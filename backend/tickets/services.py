"""
tickets/services.py

Business logic for the ticket domain.
Views call services — NOT direct ORM in views.

This keeps views thin and makes business rules testable in isolation.
"""
import logging
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from core.constants import TicketStatus, TICKET_TRANSITIONS, UserRole, AuditAction, NotificationType
from accounts.models import CustomUser
from .models import Ticket, TicketComment, TicketAttachment
from sla.services import SLAService
from auditlogs.services import AuditLogService
from notifications.services import NotificationService

logger = logging.getLogger(__name__)


# ─── Ticket Service ───────────────────────────────────────────────────────────

class TicketService:

    @staticmethod
    def get_org_queryset(user: CustomUser):
        """
        Base queryset for tickets — always org-scoped.
        Team members see all tickets in their org (read) but can't manage them.
        Uses select_related to avoid N+1 in list views.
        """
        return (
            Ticket.objects
            .filter(organization=user.organization)
            .select_related(
                "created_by",
                "assigned_to",
                "category",
                "organization",
            )
        )

    @staticmethod
    def create_ticket(*, data: dict, user: CustomUser) -> Ticket:
        """
        Create a new ticket in the user's organization.
        - organization is always set from the user (never from request body)
        - created_by is always the requesting user
        - initial status is always OPEN
        """
        if not user.organization_id:
            raise ValidationError("You must belong to an organization to create tickets.")

        # Validate assigned_to is in same org (if provided)
        assigned_to = data.get("assigned_to")
        if assigned_to and assigned_to.organization_id != user.organization_id:
            raise ValidationError(
                {"assigned_to": "Assignee must belong to the same organization."}
            )

        ticket = Ticket(
            title=data["title"],
            description=data.get("description", ""),
            organization=user.organization,
            created_by=user,
            assigned_to=assigned_to,
            category=data.get("category"),
            priority=data.get("priority", "medium"),
            status=TicketStatus.OPEN,
            due_at=data.get("due_at"),
        )
        # Calculate SLA deadlines before saving
        ticket = SLAService.calculate_deadlines(ticket=ticket)
        ticket.save()

        AuditLogService.log(
            organization_id=user.organization_id,
            action=AuditAction.TICKET_CREATED,
            target_type="ticket",
            target_id=ticket.pk,
            actor=user,
            metadata={"title": ticket.title},
        )

        logger.info("Ticket #%d created by %s", ticket.pk, user.email)
        return ticket

    @staticmethod
    def transition_status(*, ticket: Ticket, new_status: str, user: CustomUser) -> Ticket:
        """
        Apply a status transition, enforcing the TICKET_TRANSITIONS rules.
        Stamps resolved_at / closed_at when entering those states.
        """
        current = ticket.status
        allowed = TICKET_TRANSITIONS.get(current, [])

        if new_status not in allowed:
            raise ValidationError(
                {
                    "status": (
                        f"Cannot transition from '{current}' to '{new_status}'. "
                        f"Allowed: {allowed or 'none (terminal state)'}."
                    )
                }
            )

        ticket.status = new_status

        if new_status == TicketStatus.RESOLVED:
            ticket.mark_resolved()
        elif new_status == TicketStatus.CLOSED:
            ticket.mark_closed()

        # Auto-assign when moving to ASSIGNED state
        if new_status == TicketStatus.ASSIGNED and not ticket.assigned_to:
            ticket.assigned_to = user

        # Record first response on any transition from OPEN
        if current == TicketStatus.OPEN and new_status != TicketStatus.OPEN:
            ticket = SLAService.record_first_response(ticket=ticket)

        ticket.save()

        AuditLogService.log(
            organization_id=user.organization_id,
            action=AuditAction.TICKET_STATUS_CHANGED,
            target_type="ticket",
            target_id=ticket.pk,
            actor=user,
            metadata={"old_status": current, "new_status": new_status},
        )

        logger.info(
            "Ticket #%d status: %s -> %s by %s",
            ticket.pk, current, new_status, user.email,
        )
        return ticket

    @staticmethod
    def assign_ticket(*, ticket: Ticket, assignee: CustomUser, actor: CustomUser) -> Ticket:
        """
        Assign (or reassign) a ticket to a user within the same org.
        Only admins and support agents may assign tickets.
        """
        if actor.role not in (UserRole.ADMIN, UserRole.SUPPORT_AGENT):
            raise PermissionDenied("Only admins and support agents can assign tickets.")

        if assignee.organization_id != ticket.organization_id:
            raise ValidationError(
                {"assigned_to": "Assignee must belong to the same organization."}
            )

        ticket.assigned_to = assignee
        if ticket.status == TicketStatus.OPEN:
            ticket.status = TicketStatus.ASSIGNED
            ticket = SLAService.record_first_response(ticket=ticket)
        ticket.save(update_fields=["assigned_to", "status", "updated_at", "first_response_at"])

        AuditLogService.log(
            organization_id=ticket.organization_id,
            action=AuditAction.TICKET_ASSIGNED,
            target_type="ticket",
            target_id=ticket.pk,
            actor=actor,
            metadata={"assignee_id": assignee.pk, "assignee_email": assignee.email},
        )

        NotificationService.notify(
            recipient=assignee,
            title="Ticket Assigned",
            message=f"You have been assigned to Ticket #{ticket.pk}: {ticket.title}",
            type=NotificationType.TICKET_ASSIGNED,
            related_object_type="ticket",
            related_object_id=ticket.pk,
        )

        return ticket


# ─── Comment Service ──────────────────────────────────────────────────────────

class CommentService:

    @staticmethod
    def get_comment_queryset(ticket: Ticket, user: CustomUser):
        """
        Returns comments the user is allowed to see.
        Team members see only public (is_internal=False) comments.
        Admins and support agents see all comments.
        """
        qs = ticket.comments.select_related("author").filter(is_deleted=False)
        if user.role == UserRole.TEAM_MEMBER:
            qs = qs.filter(is_internal=False)
        return qs

    @staticmethod
    def add_comment(
        *, ticket: Ticket, content: str, is_internal: bool, author: CustomUser
    ) -> TicketComment:
        """
        Add a comment to a ticket.
        Team members cannot post internal notes.
        """
        if is_internal and author.role == UserRole.TEAM_MEMBER:
            raise PermissionDenied("Team members cannot post internal notes.")

        if ticket.status == TicketStatus.CLOSED:
            raise ValidationError("Cannot add comments to a closed ticket.")

        comment = TicketComment.objects.create(
            ticket=ticket,
            author=author,
            content=content,
            is_internal=is_internal,
        )

        if author.role in (UserRole.ADMIN, UserRole.SUPPORT_AGENT):
            ticket = SLAService.record_first_response(ticket=ticket)
            ticket.save(update_fields=["first_response_at", "updated_at"])

        AuditLogService.log(
            organization_id=ticket.organization_id,
            action=AuditAction.COMMENT_ADDED,
            target_type="ticket",
            target_id=ticket.pk,
            actor=author,
            metadata={"comment_id": comment.pk, "is_internal": is_internal},
        )

        if ticket.assigned_to and ticket.assigned_to != author and not is_internal:
            NotificationService.notify(
                recipient=ticket.assigned_to,
                title="New Comment",
                message=f"A new comment was added to Ticket #{ticket.pk}.",
                type=NotificationType.TICKET_COMMENTED,
                related_object_type="ticket",
                related_object_id=ticket.pk,
            )

        return comment


# ─── Attachment Service ───────────────────────────────────────────────────────

class AttachmentService:
    MAX_FILE_SIZE_MB = 10

    @staticmethod
    def add_attachment(
        *, ticket: Ticket, file, uploader: CustomUser
    ) -> TicketAttachment:
        """
        Attach a file to a ticket.
        Validates file size (max 10 MB).
        """
        max_bytes = AttachmentService.MAX_FILE_SIZE_MB * 1024 * 1024
        if file.size > max_bytes:
            raise ValidationError(
                {"file": f"File size exceeds the {AttachmentService.MAX_FILE_SIZE_MB} MB limit."}
            )

        attachment = TicketAttachment.objects.create(
            ticket=ticket,
            uploaded_by=uploader,
            file=file,
            original_filename=file.name,
            file_size=file.size,
        )
        return attachment
