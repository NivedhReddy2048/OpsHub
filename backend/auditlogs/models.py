"""
auditlogs/models.py
"""
from django.db import models
from core.constants import AuditAction


class AuditLog(models.Model):
    """
    Immutable audit log for key system events.
    Created explicitly by service layer.
    """
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="audit_logs",
        db_index=True,
    )
    actor = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        related_name="audit_actions",
        help_text="The user who performed the action.",
    )
    action = models.CharField(
        max_length=50,
        choices=AuditAction.choices,
        db_index=True,
    )
    # Generic relation via strings to avoid complex contenttypes for now
    target_type = models.CharField(max_length=50, db_index=True, help_text="e.g., 'ticket', 'task'")
    target_id = models.IntegerField(db_index=True, help_text="ID of the affected object")
    
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "audit_logs"
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "created_at"]),
        ]

    def __str__(self):
        return f"{self.action} by {self.actor} on {self.target_type} #{self.target_id}"
