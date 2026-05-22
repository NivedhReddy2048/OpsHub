"""
tickets/models.py

Four models for the OpsHub ticket domain:
  - TicketCategory  : org-scoped label/category
  - Ticket          : the core helpdesk record
  - TicketComment   : public or internal comment thread
  - TicketAttachment: file attached to a ticket

All models inherit BaseModel (created_at, updated_at, is_deleted soft-delete).
All models are organization-scoped — no cross-tenant data leaks.
"""
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from core.models import BaseModel, ActiveManager
from core.constants import TicketStatus, TicketPriority


# ─── TicketCategory ───────────────────────────────────────────────────────────

class TicketCategory(BaseModel):
    """
    Admin-defined categories per organization (e.g. 'Billing', 'Infrastructure').
    Slug is auto-generated from name if not provided.
    """
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="ticket_categories",
    )
    description = models.TextField(blank=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "ticket_categories"
        verbose_name = "Ticket Category"
        verbose_name_plural = "Ticket Categories"
        ordering = ["name"]
        # Slug unique within an org, names unique within an org too
        unique_together = [("slug", "organization"), ("name", "organization")]
        indexes = [
            models.Index(fields=["organization"]),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


# ─── Ticket ───────────────────────────────────────────────────────────────────

class Ticket(BaseModel):
    """
    Core helpdesk support ticket.

    Status workflow (enforced in service layer via TICKET_TRANSITIONS):
        open -> assigned -> in_progress -> resolved -> closed

    Organization isolation: all querysets MUST filter by organization.
    """
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="tickets",
        db_index=True,
    )
    created_by = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_tickets",
    )
    assigned_to = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tickets",
        db_index=True,
    )
    category = models.ForeignKey(
        TicketCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tickets",
    )

    priority = models.CharField(
        max_length=20,
        choices=TicketPriority.choices,
        default=TicketPriority.MEDIUM,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=TicketStatus.choices,
        default=TicketStatus.OPEN,
        db_index=True,
    )

    # SLA / timing fields
    sla_response_due_at = models.DateTimeField(null=True, blank=True)
    sla_resolution_due_at = models.DateTimeField(null=True, blank=True)
    first_response_at = models.DateTimeField(null=True, blank=True)
    is_sla_breached = models.BooleanField(default=False, db_index=True)
    breached_at = models.DateTimeField(null=True, blank=True)
    due_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    # Default manager excludes soft-deleted records
    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "tickets"
        verbose_name = "Ticket"
        verbose_name_plural = "Tickets"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "status"]),
            models.Index(fields=["organization", "priority"]),
            models.Index(fields=["organization", "assigned_to"]),
            models.Index(fields=["organization", "created_at"]),
        ]

    def __str__(self):
        return f"[{self.status.upper()}] {self.title}"

    # ── Lifecycle helpers (called by service layer only) ──

    def mark_resolved(self):
        """Stamp resolved_at when status transitions to resolved."""
        if not self.resolved_at:
            self.resolved_at = timezone.now()

    def mark_closed(self):
        """Stamp closed_at when status transitions to closed."""
        if not self.closed_at:
            self.closed_at = timezone.now()


# ─── TicketComment ────────────────────────────────────────────────────────────

class TicketComment(BaseModel):
    """
    Comment on a ticket.
    is_internal=True comments are only visible to admins and support agents.
    """
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="comments",
        db_index=True,
    )
    author = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        related_name="ticket_comments",
    )
    content = models.TextField()
    is_internal = models.BooleanField(
        default=False,
        help_text="Internal notes are only visible to admins and support agents.",
    )

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "ticket_comments"
        verbose_name = "Ticket Comment"
        verbose_name_plural = "Ticket Comments"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["ticket", "is_internal"]),
        ]

    def __str__(self):
        return f"Comment by {self.author} on Ticket #{self.ticket_id}"


# ─── TicketAttachment ─────────────────────────────────────────────────────────

class TicketAttachment(models.Model):
    """
    File attached to a ticket.
    Does not inherit BaseModel (no soft delete for files — use delete()).
    uploaded_at is immutable — files are not edited, only replaced/deleted.
    """
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="attachments",
        db_index=True,
    )
    uploaded_by = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        related_name="ticket_attachments",
    )
    file = models.FileField(upload_to="ticket_attachments/%Y/%m/")
    original_filename = models.CharField(max_length=255, blank=True)
    file_size = models.PositiveIntegerField(default=0, help_text="File size in bytes")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ticket_attachments"
        verbose_name = "Ticket Attachment"
        verbose_name_plural = "Ticket Attachments"
        ordering = ["uploaded_at"]

    def __str__(self):
        return f"Attachment on Ticket #{self.ticket_id}: {self.original_filename}"

    def save(self, *args, **kwargs):
        if self.file and not self.original_filename:
            self.original_filename = self.file.name.split("/")[-1]
        super().save(*args, **kwargs)
