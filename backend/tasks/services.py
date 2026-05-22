"""
tasks/services.py

Business logic for the task domain. Views call services — never raw ORM.

Services:
  - ProjectService : create/update/soft-delete projects
  - TaskService    : CRUD, status transitions, assignment, overdue check
  - ConversionService : ticket → task workflow
  - TaskCommentService : comment management
"""
import logging
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from core.constants import TaskStatus, TaskPriority, TASK_TRANSITIONS, UserRole, AuditAction, NotificationType
from accounts.models import CustomUser
from tickets.models import Ticket
from .models import Project, Task, TaskComment
from auditlogs.services import AuditLogService
from notifications.services import NotificationService
from accounts.models import CustomUser
from tickets.models import Ticket
from .models import Project, Task, TaskComment

logger = logging.getLogger(__name__)


# ─── Project Service ──────────────────────────────────────────────────────────

class ProjectService:

    @staticmethod
    def get_org_queryset(user: CustomUser):
        """All active projects in the user's organization."""
        return (
            Project.objects
            .filter(organization=user.organization)
            .select_related("created_by", "organization")
        )

    @staticmethod
    def create_project(*, data: dict, user: CustomUser) -> Project:
        if not user.organization_id:
            raise ValidationError("You must belong to an organization to create projects.")
        project = Project.objects.create(
            name=data["name"],
            description=data.get("description", ""),
            organization=user.organization,
            created_by=user,
            is_active=data.get("is_active", True),
        )
        logger.info("Project '%s' created by %s", project.name, user.email)
        return project

    @staticmethod
    def update_project(*, project: Project, data: dict, user: CustomUser) -> Project:
        allowed_fields = {"name", "description", "is_active"}
        for field in allowed_fields:
            if field in data:
                setattr(project, field, data[field])
        # Regenerate slug if name changed
        if "name" in data:
            from django.utils.text import slugify
            project.slug = slugify(data["name"])
        project.save()
        return project


# ─── Task Service ─────────────────────────────────────────────────────────────

class TaskService:

    @staticmethod
    def get_org_queryset(user: CustomUser):
        """
        Base queryset for tasks — org-scoped.
        Team members only see tasks assigned to them.
        """
        qs = (
            Task.objects
            .filter(organization=user.organization)
            .select_related(
                "created_by", "assigned_to", "project",
                "organization", "linked_ticket",
            )
        )
        if user.role == UserRole.TEAM_MEMBER:
            qs = qs.filter(assigned_to=user)
        return qs

    @staticmethod
    def create_task(*, data: dict, user: CustomUser) -> Task:
        if not user.organization_id:
            raise ValidationError("You must belong to an organization to create tasks.")

        assigned_to = data.get("assigned_to")
        if assigned_to and assigned_to.organization_id != user.organization_id:
            raise ValidationError(
                {"assigned_to": "Assignee must belong to the same organization."}
            )

        project = data.get("project")
        if project and project.organization_id != user.organization_id:
            raise ValidationError(
                {"project": "Project must belong to the same organization."}
            )

        task = Task.objects.create(
            title=data["title"],
            description=data.get("description", ""),
            organization=user.organization,
            project=project,
            created_by=user,
            assigned_to=assigned_to,
            priority=data.get("priority", TaskPriority.MEDIUM),
            status=TaskStatus.TODO,
            due_date=data.get("due_date"),
        )

        # Compute overdue immediately
        task.is_overdue = task.compute_overdue()
        if task.is_overdue:
            task.save(update_fields=["is_overdue"])

        logger.info("Task #%d created by %s", task.pk, user.email)

        AuditLogService.log(
            organization_id=user.organization_id,
            action=AuditAction.TASK_CREATED,
            target_type="task",
            target_id=task.pk,
            actor=user,
            metadata={"title": task.title, "project_id": project.pk if project else None},
        )

        if assigned_to and assigned_to != user:
            NotificationService.notify(
                recipient=assigned_to,
                title="Task Assigned",
                message=f"You have been assigned to a new Task #{task.pk}: {task.title}",
                type=NotificationType.TASK_ASSIGNED,
                related_object_type="task",
                related_object_id=task.pk,
            )

        return task

    @staticmethod
    def update_task(*, task: Task, data: dict, user: CustomUser) -> Task:
        """Partial field update — status changes must go through transition_status."""
        allowed = {"title", "description", "priority", "project", "assigned_to", "due_date"}
        for field in allowed:
            if field in data:
                setattr(task, field, data[field])
        task.is_overdue = task.compute_overdue()
        task.save()
        return task

    @staticmethod
    def transition_status(*, task: Task, new_status: str, user: CustomUser) -> Task:
        """
        Apply a status transition, enforcing TASK_TRANSITIONS rules.
        Stamps completed_at when entering DONE.
        """
        current = task.status
        allowed = TASK_TRANSITIONS.get(current, [])

        if new_status not in allowed:
            raise ValidationError(
                {
                    "status": (
                        f"Cannot transition from '{current}' to '{new_status}'. "
                        f"Allowed: {allowed or ['none — terminal state']}."
                    )
                }
            )

        task.status = new_status
        if new_status == TaskStatus.DONE:
            task.mark_completed()
            task.is_overdue = False
        elif new_status == TaskStatus.ARCHIVED:
            task.is_overdue = False
        else:
            task.is_overdue = task.compute_overdue()

        task.save()
        logger.info(
            "Task #%d status: %s -> %s by %s",
            task.pk, current, new_status, user.email,
        )
        return task

    @staticmethod
    def assign_task(*, task: Task, assignee: CustomUser, actor: CustomUser) -> Task:
        """Assign a task. Validates org membership."""
        if assignee.organization_id != task.organization_id:
            raise ValidationError(
                {"assigned_to": "Assignee must belong to the same organization."}
            )
        task.assigned_to = assignee
        task.save(update_fields=["assigned_to", "updated_at"])

        AuditLogService.log(
            organization_id=task.organization_id,
            action=AuditAction.TASK_ASSIGNED,
            target_type="task",
            target_id=task.pk,
            actor=actor,
            metadata={"assignee_id": assignee.pk, "assignee_email": assignee.email},
        )

        if assignee != actor:
            NotificationService.notify(
                recipient=assignee,
                title="Task Assigned",
                message=f"You have been assigned to Task #{task.pk}: {task.title}",
                type=NotificationType.TASK_ASSIGNED,
                related_object_type="task",
                related_object_id=task.pk,
            )

        return task


# ─── Ticket → Task Conversion ─────────────────────────────────────────────────

class ConversionService:
    """
    Converts a helpdesk Ticket into an internal Task.

    Rules:
    - The ticket must belong to the same organization as the requesting user.
    - Title and description are copied from the ticket.
    - Priority is mapped: ticket priority → task priority
      (critical → critical, high → high, medium → medium, low → low).
    - The originating ticket is stored in linked_ticket.
    - No signals — the conversion is explicit and controlled.
    """

    PRIORITY_MAP: dict[str, str] = {
        "low": TaskPriority.LOW,
        "medium": TaskPriority.MEDIUM,
        "high": TaskPriority.HIGH,
        "critical": TaskPriority.CRITICAL,
    }

    @classmethod
    def convert_ticket_to_task(
        cls,
        *,
        ticket: Ticket,
        user: CustomUser,
        project: Project | None = None,
        assignee: CustomUser | None = None,
        due_date=None,
        priority: str | None = None,
        title: str | None = None,
        description: str | None = None,
    ) -> Task:
        """
        Creates a Task from a Ticket.

        Args:
            ticket    : source ticket (already org-validated by the view)
            user      : requesting user (creator)
            project   : optional target project
            assignee  : optional initial assignee
            due_date  : optional due date (date, not datetime)
            priority  : optional override; defaults to mapped ticket priority
            title     : optional override; defaults to ticket title
            description: optional override; defaults to ticket description
        """
        if not user.organization_id:
            raise ValidationError("You must belong to an organization.")

        if ticket.organization_id != user.organization_id:
            raise ValidationError("Ticket does not belong to your organization.")

        if project and project.organization_id != user.organization_id:
            raise ValidationError(
                {"project": "Project must belong to the same organization."}
            )

        if assignee and assignee.organization_id != user.organization_id:
            raise ValidationError(
                {"assigned_to": "Assignee must belong to the same organization."}
            )

        resolved_priority = priority or cls.PRIORITY_MAP.get(
            ticket.priority, TaskPriority.MEDIUM
        )

        task = Task.objects.create(
            title=title or ticket.title,
            description=description or ticket.description,
            organization=user.organization,
            project=project,
            created_by=user,
            assigned_to=assignee,
            linked_ticket=ticket,
            priority=resolved_priority,
            status=TaskStatus.TODO,
            due_date=due_date,
        )

        task.is_overdue = task.compute_overdue()
        if task.is_overdue:
            task.save(update_fields=["is_overdue"])

        logger.info(
            "Ticket #%d converted to Task #%d by %s",
            ticket.pk, task.pk, user.email,
        )

        AuditLogService.log(
            organization_id=user.organization_id,
            action=AuditAction.TICKET_CONVERTED,
            target_type="task",
            target_id=task.pk,
            actor=user,
            metadata={"ticket_id": ticket.pk, "task_id": task.pk},
        )

        # Notify the ticket's creator if they didn't convert it
        if ticket.created_by and ticket.created_by != user:
            NotificationService.notify(
                recipient=ticket.created_by,
                title="Ticket Converted to Task",
                message=f"Ticket #{ticket.pk} was converted to an internal Task.",
                type=NotificationType.TICKET_CONVERTED,
                related_object_type="task",
                related_object_id=task.pk,
            )

        # If assignee is provided and it's not the creator
        if assignee and assignee != user:
            NotificationService.notify(
                recipient=assignee,
                title="Task Assigned",
                message=f"You have been assigned to a new Task #{task.pk} (from Ticket #{ticket.pk}).",
                type=NotificationType.TASK_ASSIGNED,
                related_object_type="task",
                related_object_id=task.pk,
            )

        return task


# ─── Task Comment Service ─────────────────────────────────────────────────────

class TaskCommentService:

    @staticmethod
    def add_comment(
        *, task: Task, content: str, author: CustomUser
    ) -> TaskComment:
        if task.status == TaskStatus.ARCHIVED:
            raise ValidationError("Cannot comment on an archived task.")
        return TaskComment.objects.create(task=task, author=author, content=content)

    @staticmethod
    def delete_comment(
        *, comment: TaskComment, actor: CustomUser
    ) -> None:
        if comment.author != actor and actor.role != UserRole.ADMIN:
            raise PermissionDenied("You cannot delete this comment.")
        comment.soft_delete()
