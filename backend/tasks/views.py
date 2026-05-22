"""
tasks/views.py

Task domain API views — thin wrappers over the service layer.

Endpoints (all under /api/v1/):
  Projects:
    GET  /projects/                  list
    POST /projects/                  create (admin/support_agent)
    GET  /projects/<id>/             detail
    PATCH /projects/<id>/            update (admin/support_agent)
    DELETE /projects/<id>/           soft delete (admin only)

  Tasks:
    GET  /tasks/                     list (team member filtered to assigned)
    POST /tasks/                     create
    GET  /tasks/<id>/                detail
    PATCH /tasks/<id>/               update
    DELETE /tasks/<id>/              soft delete (admin only)
    PATCH /tasks/<id>/transition/    status transition
    POST  /tasks/<id>/assign/        assign task
    POST  /tasks/from-ticket/<tid>/  convert ticket to task

  Comments:
    GET  /tasks/<id>/comments/           list
    POST /tasks/<id>/comments/           add
    DELETE /tasks/<id>/comments/<cid>/   delete
"""
import logging
from django.db.models import Count, Q
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from core.constants import UserRole
from accounts.models import CustomUser
from accounts.permissions import IsAdmin, IsAdminOrSupportAgent, IsOrganizationMember
from tickets.models import Ticket

from .filters import TaskFilter, ProjectFilter
from .models import Project, Task, TaskComment
from .serializers import (
    ProjectSerializer,
    ProjectCreateSerializer,
    ProjectUpdateSerializer,
    TaskListSerializer,
    TaskDetailSerializer,
    TaskCreateSerializer,
    TaskUpdateSerializer,
    TaskStatusSerializer,
    TaskCommentSerializer,
    TaskCommentCreateSerializer,
    ConvertTicketSerializer,
)
from .services import (
    ProjectService,
    TaskService,
    ConversionService,
    TaskCommentService,
)

logger = logging.getLogger(__name__)

TASK_BASE_PERMISSIONS = [IsAuthenticated, IsOrganizationMember]


# ─── Pagination ───────────────────────────────────────────────────────────────

class StandardPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_project_or_404(pk: int, user) -> Project:
    try:
        return Project.objects.filter(
            organization=user.organization
        ).select_related("created_by").get(pk=pk)
    except Project.DoesNotExist:
        raise NotFound("Project not found.")


def get_task_or_404(pk: int, user) -> Task:
    try:
        qs = TaskService.get_org_queryset(user)
        return qs.prefetch_related(
            "comments__author"
        ).get(pk=pk)
    except Task.DoesNotExist:
        raise NotFound("Task not found.")


# ─── Projects ─────────────────────────────────────────────────────────────────

class ProjectListCreateView(APIView):
    permission_classes = TASK_BASE_PERMISSIONS

    def get(self, request: Request) -> Response:
        qs = ProjectService.get_org_queryset(request.user)
        filterset = ProjectFilter(request.query_params, queryset=qs)
        qs = filterset.qs

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))

        serializer = ProjectSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request: Request) -> Response:
        if request.user.role == UserRole.TEAM_MEMBER:
            return Response(
                {"detail": "Team members cannot create projects."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = ProjectCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        project = ProjectService.create_project(
            data=serializer.validated_data, user=request.user
        )
        return Response(
            ProjectSerializer(project, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ProjectDetailView(APIView):
    permission_classes = TASK_BASE_PERMISSIONS

    def get(self, request: Request, pk: int) -> Response:
        project = get_project_or_404(pk, request.user)
        return Response(ProjectSerializer(project, context={"request": request}).data)

    def patch(self, request: Request, pk: int) -> Response:
        if request.user.role == UserRole.TEAM_MEMBER:
            return Response(
                {"detail": "Team members cannot update projects."},
                status=status.HTTP_403_FORBIDDEN,
            )
        project = get_project_or_404(pk, request.user)
        serializer = ProjectUpdateSerializer(
            project, data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        project = ProjectService.update_project(
            project=project, data=serializer.validated_data, user=request.user
        )
        return Response(ProjectSerializer(project, context={"request": request}).data)

    def delete(self, request: Request, pk: int) -> Response:
        if request.user.role != UserRole.ADMIN:
            return Response(
                {"detail": "Only admins can delete projects."},
                status=status.HTTP_403_FORBIDDEN,
            )
        project = get_project_or_404(pk, request.user)
        project.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Tasks ────────────────────────────────────────────────────────────────────

class TaskListCreateView(APIView):
    permission_classes = TASK_BASE_PERMISSIONS
    pagination_class = StandardPagination

    def _filter_and_search(self, queryset, request: Request):
        filterset = TaskFilter(request.query_params, queryset=queryset)
        qs = filterset.qs

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        ordering = request.query_params.get("ordering", "-created_at")
        valid = {
            "created_at", "-created_at", "due_date", "-due_date",
            "priority", "-priority", "status", "-status",
            "updated_at", "-updated_at",
        }
        if ordering in valid:
            qs = qs.order_by(ordering)

        return qs

    def get(self, request: Request) -> Response:
        qs = TaskService.get_org_queryset(request.user)
        qs = self._filter_and_search(qs, request)
        qs = qs.annotate(comment_count=Count("comments"))

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = TaskListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request: Request) -> Response:
        serializer = TaskCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        task = TaskService.create_task(
            data=serializer.validated_data, user=request.user
        )
        return Response(
            TaskDetailSerializer(task, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class TaskDetailView(APIView):
    permission_classes = TASK_BASE_PERMISSIONS

    def get(self, request: Request, pk: int) -> Response:
        task = get_task_or_404(pk, request.user)
        return Response(TaskDetailSerializer(task, context={"request": request}).data)

    def patch(self, request: Request, pk: int) -> Response:
        task = get_task_or_404(pk, request.user)
        # Team members can only update tasks assigned to them
        if (
            request.user.role == UserRole.TEAM_MEMBER
            and task.assigned_to != request.user
        ):
            return Response(
                {"detail": "You can only update tasks assigned to you."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = TaskUpdateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        task = TaskService.update_task(
            task=task, data=serializer.validated_data, user=request.user
        )
        return Response(TaskDetailSerializer(task, context={"request": request}).data)

    def delete(self, request: Request, pk: int) -> Response:
        if request.user.role != UserRole.ADMIN:
            return Response(
                {"detail": "Only admins can delete tasks."},
                status=status.HTTP_403_FORBIDDEN,
            )
        task = get_task_or_404(pk, request.user)
        task.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Task Transition ──────────────────────────────────────────────────────────

class TaskTransitionView(APIView):
    permission_classes = TASK_BASE_PERMISSIONS

    def patch(self, request: Request, pk: int) -> Response:
        task = get_task_or_404(pk, request.user)
        # Team members can only transition their own tasks
        if (
            request.user.role == UserRole.TEAM_MEMBER
            and task.assigned_to != request.user
        ):
            return Response(
                {"detail": "You can only transition tasks assigned to you."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = TaskStatusSerializer(
            data=request.data, context={"request": request, "task": task}
        )
        serializer.is_valid(raise_exception=True)
        task = TaskService.transition_status(
            task=task,
            new_status=serializer.validated_data["status"],
            user=request.user,
        )
        return Response(TaskDetailSerializer(task, context={"request": request}).data)


# ─── Task Assign ──────────────────────────────────────────────────────────────

class TaskAssignView(APIView):
    permission_classes = [IsAuthenticated, IsOrganizationMember, IsAdminOrSupportAgent]

    def post(self, request: Request, pk: int) -> Response:
        task = get_task_or_404(pk, request.user)
        assignee_id = request.data.get("assignee_id")
        if not assignee_id:
            return Response(
                {"detail": "assignee_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            assignee = CustomUser.objects.get(
                pk=assignee_id,
                organization=request.user.organization,
                is_active=True,
            )
        except CustomUser.DoesNotExist:
            return Response(
                {"detail": "Assignee not found in your organization."},
                status=status.HTTP_404_NOT_FOUND,
            )
        task = TaskService.assign_task(
            task=task, assignee=assignee, actor=request.user
        )
        return Response(TaskDetailSerializer(task, context={"request": request}).data)


# ─── Ticket → Task Conversion ─────────────────────────────────────────────────

class ConvertTicketToTaskView(APIView):
    """
    POST /api/v1/tasks/from-ticket/<ticket_id>/

    Converts a helpdesk ticket into an internal task.
    Available to admins and support agents only.
    """
    permission_classes = [IsAuthenticated, IsOrganizationMember, IsAdminOrSupportAgent]

    def post(self, request: Request, ticket_id: int) -> Response:
        # Verify ticket belongs to user's org
        try:
            ticket = Ticket.objects.get(
                pk=ticket_id,
                organization=request.user.organization,
            )
        except Ticket.DoesNotExist:
            return Response(
                {"detail": "Ticket not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = ConvertTicketSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data

        task = ConversionService.convert_ticket_to_task(
            ticket=ticket,
            user=request.user,
            project=vd.get("project"),
            assignee=vd.get("assigned_to"),
            due_date=vd.get("due_date"),
            priority=vd.get("priority"),
            title=vd.get("title") or None,
            description=vd.get("description") or None,
        )
        return Response(
            TaskDetailSerializer(task, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


# ─── Task Comments ────────────────────────────────────────────────────────────

class TaskCommentListCreateView(APIView):
    permission_classes = TASK_BASE_PERMISSIONS

    def get(self, request: Request, pk: int) -> Response:
        task = get_task_or_404(pk, request.user)
        comments = task.comments.filter(is_deleted=False).select_related("author")
        return Response(
            TaskCommentSerializer(comments, many=True, context={"request": request}).data
        )

    def post(self, request: Request, pk: int) -> Response:
        task = get_task_or_404(pk, request.user)
        serializer = TaskCommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = TaskCommentService.add_comment(
            task=task,
            content=serializer.validated_data["content"],
            author=request.user,
        )
        return Response(
            TaskCommentSerializer(comment, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class TaskCommentDeleteView(APIView):
    permission_classes = TASK_BASE_PERMISSIONS

    def delete(self, request: Request, pk: int, comment_id: int) -> Response:
        task = get_task_or_404(pk, request.user)
        try:
            comment = task.comments.get(pk=comment_id, is_deleted=False)
        except TaskComment.DoesNotExist:
            return Response(
                {"detail": "Comment not found."}, status=status.HTTP_404_NOT_FOUND
            )
        TaskCommentService.delete_comment(comment=comment, actor=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
