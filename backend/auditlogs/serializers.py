"""
auditlogs/serializers.py
"""
from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.CharField(source="actor.email", read_only=True, default="System")
    actor_name = serializers.CharField(source="actor.full_name", read_only=True, default="System")

    class Meta:
        model = AuditLog
        fields = [
            "id", "action", "target_type", "target_id",
            "actor_email", "actor_name", "metadata", "created_at"
        ]
        read_only_fields = fields
