"""
tasks/models.py

Three models for the OpsHub task domain:
  - Project     : org-scoped container for tasks
  - Task        : internal work item, optionally linked to a Ticket
  - TaskComment : discussion thread on a task

All models are organization-scoped. Task stores an optional FK to the
originating Ticket (ticket-to-task conversion).
"""
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from core.models import BaseModel, ActiveManager
from core.constants import TaskStatus, TaskPriority


# ─── Project ──────────────────────────────────────────────────────────────────

class Project(BaseModel):
    """
    A container for tasks within an organization.
    Teams group related tasks into projects (e.g. 'Q3 Infrastructure', 'Onboarding').
    """
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=280)
    description = models.TextField(blank=True)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="projects",
        db_index=True,
    )
    created_by = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_projects",
    )
    is_active = models.BooleanField(default=True, db_index=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "projects"
        verbose_name = "Project"
        verbose_name_plural = "Projects"
        ordering = ["-created_at"]
        unique_together = [("slug", "organization"), ("name", "organization")]
        indexes = [
            models.Index(fields=["organization", "is_active"]),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def task_count(self):
        return self.tasks.count()

    @property
    def completed_task_count(self):
        return self.tasks.filter(status=TaskStatus.DONE).count()


# ─── Task ─────────────────────────────────────────────────────────────────────

class Task(BaseModel):
    """
    Internal work item. Can be created independently or converted from a Ticket.

    linked_ticket: nullable FK — set when this task was converted from a ticket.
    is_overdue   : denormalized flag updated by a periodic job (Phase 6).
                   Computed in the service layer for now.

    Status workflow (enforced by service layer via TASK_TRANSITIONS):
        todo -> in_progress -> review -> done -> archived
    """
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="tasks",
        db_index=True,
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
        db_index=True,
    )
    created_by = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_tasks",
    )
    assigned_to = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
        db_index=True,
    )

    # Ticket-to-task link
    linked_ticket = models.ForeignKey(
        "tickets.Ticket",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="linked_tasks",
        help_text="Set when this task was converted from a helpdesk ticket.",
    )

    priority = models.CharField(
        max_length=20,
        choices=TaskPriority.choices,
        default=TaskPriority.MEDIUM,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.TODO,
        db_index=True,
    )

    due_date = models.DateField(null=True, blank=True, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_overdue = models.BooleanField(default=False, db_index=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "tasks"
        verbose_name = "Task"
        verbose_name_plural = "Tasks"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "status"]),
            models.Index(fields=["organization", "priority"]),
            models.Index(fields=["organization", "assigned_to"]),
            models.Index(fields=["organization", "due_date"]),
            models.Index(fields=["organization", "project"]),
        ]

    def __str__(self):
        return f"[{self.status.upper()}] {self.title}"

    def mark_completed(self):
        """Stamp completed_at when transitioning to DONE."""
        if not self.completed_at:
            self.completed_at = timezone.now()

    def compute_overdue(self) -> bool:
        """Return True if due_date is past and task is not done/archived."""
        if not self.due_date:
            return False
        terminal = (TaskStatus.DONE, TaskStatus.ARCHIVED)
        if self.status in terminal:
            return False
        return self.due_date < timezone.now().date()


# ─── TaskComment ──────────────────────────────────────────────────────────────

class TaskComment(BaseModel):
    """
    Discussion thread on a task. All comments are visible to org members
    with access to the task (no internal/public split unlike TicketComment).
    """
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="comments",
        db_index=True,
    )
    author = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        related_name="task_comments",
    )
    content = models.TextField()

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "task_comments"
        verbose_name = "Task Comment"
        verbose_name_plural = "Task Comments"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["task"]),
        ]

    def __str__(self):
        return f"Comment by {self.author} on Task #{self.task_id}"
