"""
core/constants.py

Central enums and choices used across the OpsHub platform.
Import from here — never define status/role strings inline.
"""
from django.db import models


class UserRole(models.TextChoices):
    ADMIN = "admin", "Admin"
    SUPPORT_AGENT = "support_agent", "Support Agent"
    TEAM_MEMBER = "team_member", "Team Member"


class TicketStatus(models.TextChoices):
    OPEN = "open", "Open"
    ASSIGNED = "assigned", "Assigned"
    IN_PROGRESS = "in_progress", "In Progress"
    RESOLVED = "resolved", "Resolved"
    CLOSED = "closed", "Closed"


class TicketPriority(models.TextChoices):
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"
    CRITICAL = "critical", "Critical"


class TaskStatus(models.TextChoices):
    TODO = "todo", "To Do"
    IN_PROGRESS = "in_progress", "In Progress"
    REVIEW = "review", "In Review"
    DONE = "done", "Done"
    ARCHIVED = "archived", "Archived"


class TaskPriority(models.TextChoices):
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"
    CRITICAL = "critical", "Critical"


# Valid task status transitions — enforced in service layer
TASK_TRANSITIONS: dict[str, list[str]] = {
    TaskStatus.TODO: [TaskStatus.IN_PROGRESS],
    TaskStatus.IN_PROGRESS: [TaskStatus.REVIEW, TaskStatus.TODO],
    TaskStatus.REVIEW: [TaskStatus.DONE, TaskStatus.IN_PROGRESS],
    TaskStatus.DONE: [TaskStatus.ARCHIVED, TaskStatus.IN_PROGRESS],
    TaskStatus.ARCHIVED: [],
}


# Valid ticket status transitions — enforced in service layer
TICKET_TRANSITIONS: dict[str, list[str]] = {
    TicketStatus.OPEN: [TicketStatus.ASSIGNED],
    TicketStatus.ASSIGNED: [TicketStatus.IN_PROGRESS, TicketStatus.OPEN],
    TicketStatus.IN_PROGRESS: [TicketStatus.RESOLVED, TicketStatus.ASSIGNED],
    TicketStatus.RESOLVED: [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS],
    TicketStatus.CLOSED: [],
}


class AuditAction(models.TextChoices):
    TICKET_CREATED = "ticket_created", "Ticket Created"
    TICKET_STATUS_CHANGED = "ticket_status_changed", "Ticket Status Changed"
    TICKET_ASSIGNED = "ticket_assigned", "Ticket Assigned"
    TASK_CREATED = "task_created", "Task Created"
    TASK_ASSIGNED = "task_assigned", "Task Assigned"
    TICKET_CONVERTED = "ticket_converted", "Ticket Converted to Task"
    COMMENT_ADDED = "comment_added", "Comment Added"
    SLA_BREACHED = "sla_breached", "SLA Breached"


class NotificationType(models.TextChoices):
    TASK_ASSIGNED = "task_assigned", "Task Assigned"
    TICKET_ASSIGNED = "ticket_assigned", "Ticket Assigned"
    TICKET_COMMENTED = "ticket_commented", "Ticket Commented"
    SLA_BREACHED = "sla_breached", "SLA Breached"
    TASK_OVERDUE = "task_overdue", "Task Overdue"
    TICKET_CONVERTED = "ticket_converted", "Ticket Converted"
