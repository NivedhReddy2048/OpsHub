"""
tickets/views.py

Ticket domain views — thin wrappers around the service layer.

URL structure (wired in tickets/urls.py):
    GET  /api/v1/tickets/                       — paginated list
    POST /api/v1/tickets/                       — create ticket
    GET  /api/v1/tickets/<id>/                  — detail
    PATCH /api/v1/tickets/<id>/                 — update fields
    DELETE /api/v1/tickets/<id>/                — soft delete (admin only)
    PATCH /api/v1/tickets/<id>/transition/      — status transition
    POST  /api/v1/tickets/<id>/assign/          — assign ticket
    GET   /api/v1/tickets/<id>/comments/        — list comments
    POST  /api/v1/tickets/<id>/comments/        — add comment
    DELETE /api/v1/tickets/<id>/comments/<cid>/ — soft delete comment
    POST  /api/v1/tickets/<id>/attachments/     — upload attachment
    DELETE /api/v1/tickets/<id>/attachments/<aid>/ — delete attachment

    GET  /api/v1/tickets/categories/            — list categories
    POST /api/v1/tickets/categories/            — create category (admin only)
    DELETE /api/v1/tickets/categories/<id>/     — soft delete category (admin only)
"""
import logging
from django.db.models import Count, Q
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import NotFound

from core.constants import UserRole
from accounts.permissions import IsAdmin, IsAdminOrSupportAgent, IsOrganizationMember
from .filters import TicketFilter
from .models import Ticket, TicketCategory, TicketComment, TicketAttachment
from .serializers import (
    TicketListSerializer,
    TicketDetailSerializer,
    TicketCreateSerializer,
    TicketUpdateSerializer,
    TicketStatusSerializer,
    TicketCategorySerializer,
    CommentSerializer,
    CommentCreateSerializer,
    AttachmentSerializer,
)
from .services import TicketService, CommentService, AttachmentService

logger = logging.getLogger(__name__)

TICKET_BASE_PERMISSIONS = [IsAuthenticated, IsOrganizationMember]


# ─── Pagination ───────────────────────────────────────────────────────────────

class TicketPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_ticket_or_404(pk: int, user) -> Ticket:
    """Fetch a ticket by PK, scoped to user's org. Raises NotFound if missing."""
    try:
        return (
            Ticket.objects
            .filter(organization=user.organization)
            .select_related("created_by", "assigned_to", "category", "organization")
            .prefetch_related("comments__author", "attachments__uploaded_by")
            .get(pk=pk)
        )
    except Ticket.DoesNotExist:
        raise NotFound("Ticket not found.")


# ─── Ticket List / Create ─────────────────────────────────────────────────────

class TicketListCreateView(APIView):
    permission_classes = TICKET_BASE_PERMISSIONS
    pagination_class = TicketPagination

    def _apply_filters_and_search(self, queryset, request: Request):
        filterset = TicketFilter(request.query_params, queryset=queryset)
        queryset = filterset.qs

        search = request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        ordering = request.query_params.get("ordering", "-created_at")
        valid_orderings = {
            "created_at", "-created_at", "priority", "-priority",
            "status", "-status", "updated_at", "-updated_at",
        }
        if ordering in valid_orderings:
            queryset = queryset.order_by(ordering)

        return queryset

    def get(self, request: Request) -> Response:
        queryset = TicketService.get_org_queryset(request.user)
        queryset = self._apply_filters_and_search(queryset, request)
        queryset = queryset.annotate(comment_count=Count("comments"))

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = TicketListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request: Request) -> Response:
        if request.user.role == UserRole.TEAM_MEMBER:
            return Response(
                {"detail": "Team members cannot create tickets."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = TicketCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        ticket = TicketService.create_ticket(
            data=serializer.validated_data, user=request.user
        )
        return Response(
            TicketDetailSerializer(ticket, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


# ─── Ticket Detail / Update / Delete ──────────────────────────────────────────

class TicketDetailView(APIView):
    permission_classes = TICKET_BASE_PERMISSIONS

    def get(self, request: Request, pk: int) -> Response:
        ticket = get_ticket_or_404(pk, request.user)
        return Response(
            TicketDetailSerializer(ticket, context={"request": request}).data
        )

    def patch(self, request: Request, pk: int) -> Response:
        ticket = get_ticket_or_404(pk, request.user)
        if request.user.role == UserRole.TEAM_MEMBER:
            return Response(
                {"detail": "Team members cannot update tickets."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = TicketUpdateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        for field, value in serializer.validated_data.items():
            setattr(ticket, field, value)
        ticket.save()
        return Response(
            TicketDetailSerializer(
                get_ticket_or_404(pk, request.user), context={"request": request}
            ).data
        )

    def delete(self, request: Request, pk: int) -> Response:
        if request.user.role != UserRole.ADMIN:
            return Response(
                {"detail": "Only admins can delete tickets."},
                status=status.HTTP_403_FORBIDDEN,
            )
        ticket = get_ticket_or_404(pk, request.user)
        ticket.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Status Transition ────────────────────────────────────────────────────────

class TicketTransitionView(APIView):
    permission_classes = TICKET_BASE_PERMISSIONS

    def patch(self, request: Request, pk: int) -> Response:
        ticket = get_ticket_or_404(pk, request.user)
        if request.user.role == UserRole.TEAM_MEMBER:
            return Response(
                {"detail": "Team members cannot change ticket status."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = TicketStatusSerializer(
            data=request.data, context={"request": request, "ticket": ticket}
        )
        serializer.is_valid(raise_exception=True)
        ticket = TicketService.transition_status(
            ticket=ticket,
            new_status=serializer.validated_data["status"],
            user=request.user,
        )
        return Response(
            TicketDetailSerializer(ticket, context={"request": request}).data
        )


# ─── Assign Ticket ────────────────────────────────────────────────────────────

class TicketAssignView(APIView):
    permission_classes = [IsAuthenticated, IsOrganizationMember, IsAdminOrSupportAgent]

    def post(self, request: Request, pk: int) -> Response:
        ticket = get_ticket_or_404(pk, request.user)
        assignee_id = request.data.get("assignee_id")
        if not assignee_id:
            return Response(
                {"detail": "assignee_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        from accounts.models import CustomUser
        try:
            assignee = CustomUser.objects.get(
                pk=assignee_id, organization=request.user.organization, is_active=True
            )
        except CustomUser.DoesNotExist:
            return Response(
                {"detail": "Assignee not found in your organization."},
                status=status.HTTP_404_NOT_FOUND,
            )
        ticket = TicketService.assign_ticket(
            ticket=ticket, assignee=assignee, actor=request.user
        )
        return Response(
            TicketDetailSerializer(ticket, context={"request": request}).data
        )


# ─── Comments ─────────────────────────────────────────────────────────────────

class TicketCommentListCreateView(APIView):
    permission_classes = TICKET_BASE_PERMISSIONS

    def get(self, request: Request, pk: int) -> Response:
        ticket = get_ticket_or_404(pk, request.user)
        comments = CommentService.get_comment_queryset(ticket, request.user)
        return Response(
            CommentSerializer(comments, many=True, context={"request": request}).data
        )

    def post(self, request: Request, pk: int) -> Response:
        ticket = get_ticket_or_404(pk, request.user)
        serializer = CommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = CommentService.add_comment(
            ticket=ticket,
            content=serializer.validated_data["content"],
            is_internal=serializer.validated_data["is_internal"],
            author=request.user,
        )
        return Response(
            CommentSerializer(comment, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class TicketCommentDeleteView(APIView):
    permission_classes = TICKET_BASE_PERMISSIONS

    def delete(self, request: Request, pk: int, comment_id: int) -> Response:
        ticket = get_ticket_or_404(pk, request.user)
        try:
            comment = ticket.comments.get(pk=comment_id)
        except TicketComment.DoesNotExist:
            return Response(
                {"detail": "Comment not found."}, status=status.HTTP_404_NOT_FOUND
            )
        if comment.author != request.user and request.user.role != UserRole.ADMIN:
            return Response(
                {"detail": "You cannot delete this comment."},
                status=status.HTTP_403_FORBIDDEN,
            )
        comment.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Attachments ──────────────────────────────────────────────────────────────

class TicketAttachmentView(APIView):
    permission_classes = TICKET_BASE_PERMISSIONS
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request: Request, pk: int) -> Response:
        ticket = get_ticket_or_404(pk, request.user)
        file = request.FILES.get("file")
        if not file:
            return Response(
                {"detail": "No file was provided."}, status=status.HTTP_400_BAD_REQUEST
            )
        attachment = AttachmentService.add_attachment(
            ticket=ticket, file=file, uploader=request.user
        )
        return Response(
            AttachmentSerializer(attachment, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class TicketAttachmentDeleteView(APIView):
    permission_classes = TICKET_BASE_PERMISSIONS

    def delete(self, request: Request, pk: int, attachment_id: int) -> Response:
        ticket = get_ticket_or_404(pk, request.user)
        try:
            attachment = ticket.attachments.get(pk=attachment_id)
        except TicketAttachment.DoesNotExist:
            return Response(
                {"detail": "Attachment not found."}, status=status.HTTP_404_NOT_FOUND
            )
        if (
            attachment.uploaded_by != request.user
            and request.user.role != UserRole.ADMIN
        ):
            return Response(
                {"detail": "You cannot delete this attachment."},
                status=status.HTTP_403_FORBIDDEN,
            )
        attachment.file.delete(save=False)
        attachment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Categories ───────────────────────────────────────────────────────────────

class TicketCategoryListCreateView(APIView):
    permission_classes = TICKET_BASE_PERMISSIONS

    def get(self, request: Request) -> Response:
        categories = TicketCategory.objects.filter(
            organization=request.user.organization
        ).order_by("name")
        return Response(
            TicketCategorySerializer(
                categories, many=True, context={"request": request}
            ).data
        )

    def post(self, request: Request) -> Response:
        if request.user.role != UserRole.ADMIN:
            return Response(
                {"detail": "Only admins can create categories."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = TicketCategorySerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        category = serializer.save(organization=request.user.organization)
        return Response(
            TicketCategorySerializer(category, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class TicketCategoryDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsOrganizationMember, IsAdmin]

    def delete(self, request: Request, pk: int) -> Response:
        try:
            category = TicketCategory.objects.get(
                pk=pk, organization=request.user.organization
            )
        except TicketCategory.DoesNotExist:
            return Response(
                {"detail": "Category not found."}, status=status.HTTP_404_NOT_FOUND
            )
        category.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
