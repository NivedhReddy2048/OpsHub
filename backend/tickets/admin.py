"""
tickets/admin.py

Admin registration for the ticket domain models.
"""
from django.contrib import admin
from .models import Ticket, TicketCategory, TicketComment, TicketAttachment


class TicketCommentInline(admin.TabularInline):
    model = TicketComment
    extra = 0
    readonly_fields = ["author", "created_at", "is_internal"]
    fields = ["author", "content", "is_internal", "created_at"]


class TicketAttachmentInline(admin.TabularInline):
    model = TicketAttachment
    extra = 0
    readonly_fields = ["uploaded_by", "uploaded_at", "file_size", "original_filename"]


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = [
        "id", "title", "status", "priority", "organization",
        "assigned_to", "is_sla_breached", "created_at",
    ]
    list_filter = ["status", "priority", "organization", "is_sla_breached"]
    search_fields = ["title", "description", "id"]
    readonly_fields = ["created_at", "updated_at", "resolved_at", "closed_at"]
    raw_id_fields = ["created_by", "assigned_to", "organization", "category"]
    inlines = [TicketCommentInline, TicketAttachmentInline]
    actions = ["close_tickets"]

    @admin.action(description="Close selected tickets")
    def close_tickets(self, request, queryset):
        from core.constants import TicketStatus
        from django.utils import timezone
        queryset.update(status=TicketStatus.CLOSED, closed_at=timezone.now())


@admin.register(TicketCategory)
class TicketCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "organization"]
    list_filter = ["organization"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(TicketComment)
class TicketCommentAdmin(admin.ModelAdmin):
    list_display = ["id", "ticket", "author", "is_internal", "created_at"]
    list_filter = ["is_internal"]
    raw_id_fields = ["ticket", "author"]


@admin.register(TicketAttachment)
class TicketAttachmentAdmin(admin.ModelAdmin):
    list_display = ["id", "ticket", "uploaded_by", "original_filename", "file_size", "uploaded_at"]
    raw_id_fields = ["ticket", "uploaded_by"]
