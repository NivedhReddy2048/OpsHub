"""
tasks/serializers.py

Serializer hierarchy for the task domain.

Pattern: separate read and write serializers.
  - ProjectSerializer          : full project representation
  - ProjectCreateSerializer    : validated write input
  - TaskListSerializer         : lightweight for list views
  - TaskDetailSerializer       : full nested representation
  - TaskCreateSerializer       : write input for new tasks
  - TaskUpdateSerializer       : partial field updates
  - TaskStatusSerializer       : status transition only
  - TaskCommentSerializer      : comment read/create
  - ConvertTicketSerializer    : input for ticket→task conversion
"""
from rest_framework import serializers
from django.utils import timezone

from accounts.models import CustomUser
from core.constants import TaskStatus, TaskPriority, TASK_TRANSITIONS
from .models import Project, Task, TaskComment


# ─── Nested helpers ───────────────────────────────────────────────────────────

class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "email", "full_name", "role"]
        read_only_fields = fields


class ProjectMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "slug"]
        read_only_fields = fields


class LinkedTicketSerializer(serializers.Serializer):
    """Minimal ticket reference shown on Task detail."""
    id = serializers.IntegerField()
    title = serializers.CharField()
    status = serializers.CharField()
    priority = serializers.CharField()


# ─── Project ──────────────────────────────────────────────────────────────────

class ProjectSerializer(serializers.ModelSerializer):
    created_by = UserMiniSerializer(read_only=True)
    task_count = serializers.SerializerMethodField()
    completed_task_count = serializers.SerializerMethodField()
    completion_pct = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id", "name", "slug", "description", "is_active",
            "created_by", "task_count", "completed_task_count",
            "completion_pct", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "slug", "created_by", "task_count",
            "completed_task_count", "completion_pct",
            "created_at", "updated_at",
        ]

    def get_task_count(self, obj) -> int:
        return obj.tasks.filter(is_deleted=False).count()

    def get_completed_task_count(self, obj) -> int:
        return obj.tasks.filter(status=TaskStatus.DONE, is_deleted=False).count()

    def get_completion_pct(self, obj) -> float:
        total = self.get_task_count(obj)
        if total == 0:
            return 0.0
        return round(self.get_completed_task_count(obj) / total * 100, 1)


class ProjectCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True, default="")
    is_active = serializers.BooleanField(default=True)

    def validate_name(self, value: str) -> str:
        org = self.context["request"].user.organization
        qs = Project.objects.filter(name__iexact=value, organization=org)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "A project with this name already exists in your organization."
            )
        return value


class ProjectUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(allow_blank=True, required=False)
    is_active = serializers.BooleanField(required=False)

    def validate_name(self, value: str) -> str:
        org = self.context["request"].user.organization
        qs = Project.objects.filter(name__iexact=value, organization=org)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "A project with this name already exists in your organization."
            )
        return value


# ─── Task Comment ─────────────────────────────────────────────────────────────

class TaskCommentSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)

    class Meta:
        model = TaskComment
        fields = ["id", "content", "author", "created_at", "updated_at"]
        read_only_fields = ["id", "author", "created_at", "updated_at"]


class TaskCommentCreateSerializer(serializers.Serializer):
    content = serializers.CharField(min_length=1, max_length=10000)


# ─── Task ─────────────────────────────────────────────────────────────────────

class TaskListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for paginated list views."""
    assigned_to = UserMiniSerializer(read_only=True)
    created_by = UserMiniSerializer(read_only=True)
    project = ProjectMiniSerializer(read_only=True)
    comment_count = serializers.IntegerField(read_only=True, default=0)
    linked_ticket_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Task
        fields = [
            "id", "title", "status", "priority",
            "project", "assigned_to", "created_by",
            "is_overdue", "due_date", "completed_at",
            "linked_ticket_id", "comment_count",
            "created_at", "updated_at",
        ]
        read_only_fields = fields


class TaskDetailSerializer(serializers.ModelSerializer):
    """Full task representation including comments and linked ticket info."""
    assigned_to = UserMiniSerializer(read_only=True)
    created_by = UserMiniSerializer(read_only=True)
    project = ProjectMiniSerializer(read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    allowed_transitions = serializers.SerializerMethodField()
    linked_ticket = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id", "title", "description", "status", "priority",
            "organization", "project", "assigned_to", "created_by",
            "linked_ticket", "is_overdue", "due_date", "completed_at",
            "allowed_transitions", "comments",
            "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_allowed_transitions(self, obj) -> list[str]:
        return TASK_TRANSITIONS.get(obj.status, [])

    def get_linked_ticket(self, obj):
        if obj.linked_ticket_id is None:
            return None
        ticket = obj.linked_ticket
        if ticket is None:
            return None
        return {
            "id": ticket.id,
            "title": ticket.title,
            "status": ticket.status,
            "priority": ticket.priority,
        }


class TaskCreateSerializer(serializers.Serializer):
    """Validated input for creating a task. Org is always set from the user."""
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True, default="")
    priority = serializers.ChoiceField(
        choices=TaskPriority.choices, default=TaskPriority.MEDIUM
    )
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.none(),
        source="project",
        allow_null=True,
        required=False,
    )
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.none(),
        source="assigned_to",
        allow_null=True,
        required=False,
    )
    due_date = serializers.DateField(required=False, allow_null=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context["request"].user
        org = user.organization
        if org:
            self.fields["project_id"].queryset = Project.objects.filter(
                organization=org, is_deleted=False, is_active=True
            )
            self.fields["assigned_to_id"].queryset = CustomUser.objects.filter(
                organization=org, is_active=True
            )


class TaskUpdateSerializer(serializers.Serializer):
    """Partial update for editable task fields. Status changes use transition endpoint."""
    title = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(allow_blank=True, required=False)
    priority = serializers.ChoiceField(choices=TaskPriority.choices, required=False)
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.none(),
        source="project",
        allow_null=True,
        required=False,
    )
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.none(),
        source="assigned_to",
        allow_null=True,
        required=False,
    )
    due_date = serializers.DateField(required=False, allow_null=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context["request"].user
        org = user.organization
        if org:
            self.fields["project_id"].queryset = Project.objects.filter(
                organization=org, is_deleted=False, is_active=True
            )
            self.fields["assigned_to_id"].queryset = CustomUser.objects.filter(
                organization=org, is_active=True
            )


class TaskStatusSerializer(serializers.Serializer):
    """Used exclusively for PATCH /tasks/<id>/transition/."""
    status = serializers.ChoiceField(choices=TaskStatus.choices)

    def validate_status(self, value: str) -> str:
        task = self.context["task"]
        allowed = TASK_TRANSITIONS.get(task.status, [])
        if value not in allowed:
            raise serializers.ValidationError(
                f"Cannot transition from '{task.status}' to '{value}'. "
                f"Allowed: {allowed or ['none — terminal state']}."
            )
        return value


class ConvertTicketSerializer(serializers.Serializer):
    """Input for POST /api/v1/tasks/from-ticket/<ticket_id>/"""
    title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    description = serializers.CharField(allow_blank=True, required=False)
    priority = serializers.ChoiceField(
        choices=TaskPriority.choices, required=False, allow_null=True
    )
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.none(),
        source="project",
        allow_null=True,
        required=False,
    )
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.none(),
        source="assigned_to",
        allow_null=True,
        required=False,
    )
    due_date = serializers.DateField(required=False, allow_null=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context["request"].user
        org = user.organization
        if org:
            self.fields["project_id"].queryset = Project.objects.filter(
                organization=org, is_deleted=False, is_active=True
            )
            self.fields["assigned_to_id"].queryset = CustomUser.objects.filter(
                organization=org, is_active=True
            )
