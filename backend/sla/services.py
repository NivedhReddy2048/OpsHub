"""
sla/services.py
"""
import logging
from datetime import timedelta
from django.utils import timezone
from core.constants import TicketStatus
from tickets.models import Ticket
from .models import SLAConfig

logger = logging.getLogger(__name__)


class SLAService:
    @staticmethod
    def _get_config(organization_id: int, priority: str) -> SLAConfig | None:
        """Fetch the active SLA config for an org/priority."""
        return SLAConfig.objects.filter(
            organization_id=organization_id,
            priority=priority,
            is_active=True,
            is_deleted=False,
        ).first()

    @staticmethod
    def calculate_deadlines(*, ticket: Ticket) -> Ticket:
        """
        Calculate SLA deadlines based on ticket's priority and organization SLA config.
        Called on ticket creation or priority update.
        """
        config = SLAService._get_config(ticket.organization_id, ticket.priority)
        
        if config:
            # Baseline from created_at or now if not saved yet
            baseline = ticket.created_at if ticket.id else timezone.now()
            
            ticket.sla_response_due_at = baseline + timedelta(hours=config.response_time_hours)
            ticket.sla_resolution_due_at = baseline + timedelta(hours=config.resolution_time_hours)
        else:
            ticket.sla_response_due_at = None
            ticket.sla_resolution_due_at = None
            
        return ticket

    @staticmethod
    def check_sla_breach(*, ticket: Ticket) -> Ticket:
        """
        Check if the ticket has breached SLA.
        Returns the ticket. Modifies it in place. Note: Does NOT call save().
        """
        now = timezone.now()
        breached = False

        if ticket.status in (TicketStatus.RESOLVED, TicketStatus.CLOSED):
            return ticket  # Don't breach if already resolved

        if ticket.sla_response_due_at and not ticket.first_response_at:
            if now > ticket.sla_response_due_at:
                breached = True
        
        if ticket.sla_resolution_due_at:
            if now > ticket.sla_resolution_due_at:
                breached = True

        if breached and not ticket.is_sla_breached:
            ticket.is_sla_breached = True
            ticket.breached_at = now
            logger.info("Ticket #%d breached SLA.", ticket.pk)

        return ticket

    @staticmethod
    def record_first_response(*, ticket: Ticket) -> Ticket:
        """
        Stamp first_response_at if not already stamped.
        Called when a comment is added by an agent/admin, or on status transition.
        """
        if not ticket.first_response_at:
            ticket.first_response_at = timezone.now()
        return ticket
