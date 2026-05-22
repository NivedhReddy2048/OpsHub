"""
organizations/serializers.py

Serializers for Organization model.
Phase 2: Read-only access for authenticated users within the organization.
"""
from rest_framework import serializers
from .models import Organization


class OrganizationSerializer(serializers.ModelSerializer):
    """
    Full organization representation.
    Returned to authenticated users viewing their own organization.
    """
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "is_active",
            "member_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_member_count(self, obj) -> int:
        """Returns count of active users in this organization."""
        return obj.members.filter(is_active=True).count()


class OrganizationCreateSerializer(serializers.ModelSerializer):
    """
    Used by superusers/Django admin to create organizations.
    Slug is auto-generated from name if not provided.
    """
    class Meta:
        model = Organization
        fields = ["name", "slug", "description"]

    def validate_name(self, value: str) -> str:
        if Organization.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError(
                "An organization with this name already exists."
            )
        return value
