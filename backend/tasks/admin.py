"""
tasks/admin.py

Admin registrations for Project, Task, TaskComment.
"""
from django.contrib import admin
from .models import Project, Task, TaskComment


class TaskCommentInline(admin.TabularInline):
    model = TaskComment
    extra = 0
    readonly_fields = ["author", "created_at"]
    fields = ["author", "content", "created_at"]


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "organization", "is_active", "created_by", "created_at"]
    list_filter = ["organization", "is_active"]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ("name",)}
    raw_id_fields = ["organization", "created_by"]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = [
        "id", "title", "status", "priority", "organization",
        "project", "assigned_to", "is_overdue", "due_date", "created_at",
    ]
    list_filter = ["status", "priority", "organization", "is_overdue"]
    search_fields = ["title", "description"]
    readonly_fields = ["created_at", "updated_at", "completed_at"]
    raw_id_fields = ["created_by", "assigned_to", "organization", "project", "linked_ticket"]
    inlines = [TaskCommentInline]


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ["id", "task", "author", "created_at"]
    raw_id_fields = ["task", "author"]
