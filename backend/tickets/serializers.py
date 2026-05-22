"""
tickets/serializers.py

Serializer hierarchy for the ticket domain.

Read/Write split:
  - TicketListSerializer     — lightweight for list views
  - TicketDetailSerializer   — full representation for detail/create response
  - TicketCreateSerializer   — validated write data for ticket creation
  - TicketUpdateSerializer   — partial update (title, description, priority, due_at)
  - TicketStatusSerializer   — status transitions only
  - TicketCategorySerializer — category read/create
  - CommentSerializer        — read/write comment
  - CommentCreateSerializer  — write-only comment input
  - AttachmentSerializer     — attachment read representation
"""
from rest_framework import serializers
from accounts.models import CustomUser
from core.constants import TicketStatus, TicketPriority, TICKET_TRANSITIONS
from .models import Ticket, TicketCategory, TicketComment, TicketAttachment


# ─── Nested helpers ───────────────────────────────────────────────────────────

class UserMiniSerializer(serializers.ModelSerializer):
    """Minimal user representation for nested fields."""
    class Meta:
        model = CustomUser
        fields = ["id", "email", "full_name", "role"]
        read_only_fields = fields


class CategoryMiniSerializer(serializers.ModelSerializer):
    """Minimal category representation for nested fields."""
    class Meta:
        model = TicketCategory
        fields = ["id", "name", "slug"]
        read_only_fields = fields


# ─── Category ─────────────────────────────────────────────────────────────────

class TicketCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketCategory
        fields = ["id", "name", "slug", "description", "created_at"]
        read_only_fields = ["id", "slug", "created_at"]

    def validate_name(self, value: str) -> str:
        org = self.context["request"].user.organization
        qs = TicketCategory.objects.filter(name__iexact=value, organization=org)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "A category with this name already exists in your organization."
            )
        return value


# ─── Attachment ───────────────────────────────────────────────────────────────

class AttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserMiniSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = TicketAttachment
        fields = [
            "id", "file_url", "original_filename", "file_size",
            "uploaded_by", "uploaded_at",
        ]
        read_only_fields = fields

    def get_file_url(self, obj) -> str | None:
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


# ─── Comments ─────────────────────────────────────────────────────────────────

class CommentSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)

    class Meta:
        model = TicketComment
        fields = [
            "id", "content", "is_internal", "author", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "author", "created_at", "updated_at"]


class CommentCreateSerializer(serializers.Serializer):
    """Write-only input for creating a comment."""
    content = serializers.CharField(min_length=1, max_length=10000)
    is_internal = serializers.BooleanField(default=False)


# ─── Ticket ───────────────────────────────────────────────────────────────────

class TicketListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for paginated list views.
    Avoids N+1 (relies on select_related in queryset).
    """
    created_by = UserMiniSerializer(read_only=True)
    assigned_to = UserMiniSerializer(read_only=True)
    category = CategoryMiniSerializer(read_only=True)
    comment_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Ticket
        fields = [
            "id", "title", "status", "priority",
            "created_by", "assigned_to", "category",
            "is_sla_breached", "due_at", "created_at", "updated_at",
            "comment_count",
        ]
        read_only_fields = fields


class TicketDetailSerializer(serializers.ModelSerializer):
    """
    Full ticket representation — used for detail, create, and update responses.
    Includes nested comments and attachments.
    """
    created_by = UserMiniSerializer(read_only=True)
    assigned_to = UserMiniSerializer(read_only=True)
    category = CategoryMiniSerializer(read_only=True)
    comments = serializers.SerializerMethodField()
    attachments = AttachmentSerializer(many=True, read_only=True)
    allowed_transitions = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            "id", "title", "description", "status", "priority",
            "organization", "created_by", "assigned_to", "category",
            "is_sla_breached", "due_at", "resolved_at", "closed_at",
            "created_at", "updated_at",
            "comments", "attachments", "allowed_transitions",
        ]
        read_only_fields = fields

    def get_comments(self, obj):
        """Filter internal comments for team members."""
        user = self.context["request"].user
        from core.constants import UserRole
        qs = obj.comments.filter(is_deleted=False).select_related("author")
        if user.role == UserRole.TEAM_MEMBER:
            qs = qs.filter(is_internal=False)
        return CommentSerializer(qs, many=True, context=self.context).data

    def get_allowed_transitions(self, obj) -> list[str]:
        return TICKET_TRANSITIONS.get(obj.status, [])


class TicketCreateSerializer(serializers.Serializer):
    """
    Validated input for creating a new ticket.
    Uses a plain Serializer (not ModelSerializer) so that
    organization/created_by are never taken from request data.
    """
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True, default="")
    priority = serializers.ChoiceField(
        choices=TicketPriority.choices, default=TicketPriority.MEDIUM
    )
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=TicketCategory.objects.none(),
        source="category",
        allow_null=True,
        required=False,
    )
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.none(),
        source="assigned_to",
        allow_null=True,
        required=False,
    )
    due_at = serializers.DateTimeField(required=False, allow_null=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context["request"].user
        org = user.organization

        # Scope category and assignee choices to the user's organization
        if org:
            self.fields["category_id"].queryset = TicketCategory.objects.filter(
                organization=org, is_deleted=False
            )
            self.fields["assigned_to_id"].queryset = CustomUser.objects.filter(
                organization=org, is_active=True
            )


class TicketUpdateSerializer(serializers.Serializer):
    """
    Partial update: title, description, priority, category, due_at.
    Status changes go through TicketStatusSerializer instead.
    """
    title = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(allow_blank=True, required=False)
    priority = serializers.ChoiceField(
        choices=TicketPriority.choices, required=False
    )
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=TicketCategory.objects.none(),
        source="category",
        allow_null=True,
        required=False,
    )
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.none(),
        source="assigned_to",
        allow_null=True,
        required=False,
    )
    due_at = serializers.DateTimeField(required=False, allow_null=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context["request"].user
        org = user.organization
        if org:
            self.fields["category_id"].queryset = TicketCategory.objects.filter(
                organization=org, is_deleted=False
            )
            self.fields["assigned_to_id"].queryset = CustomUser.objects.filter(
                organization=org, is_active=True
            )


class TicketStatusSerializer(serializers.Serializer):
    """
    Used exclusively for PATCH /tickets/<id>/transition/.
    Validates that the requested status is a legal next state.
    """
    status = serializers.ChoiceField(choices=TicketStatus.choices)

    def validate_status(self, value: str) -> str:
        ticket = self.context["ticket"]
        allowed = TICKET_TRANSITIONS.get(ticket.status, [])
        if value not in allowed:
            raise serializers.ValidationError(
                f"Cannot transition from '{ticket.status}' to '{value}'. "
                f"Allowed: {allowed or ['none — terminal state']}."
            )
        return value
