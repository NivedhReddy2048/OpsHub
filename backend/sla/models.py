"""
sla/models.py
"""
from django.db import models
from core.models import BaseModel, ActiveManager
from core.constants import TicketPriority


class SLAConfig(BaseModel):
    """
    Organization-specific SLA rules for tickets.
    """
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="sla_configs",
        db_index=True,
    )
    priority = models.CharField(
        max_length=20,
        choices=TicketPriority.choices,
    )
    response_time_hours = models.FloatField(
        default=24.0,
        help_text="Time to first response in hours.",
    )
    resolution_time_hours = models.FloatField(
        default=48.0,
        help_text="Time to resolution in hours.",
    )
    is_active = models.BooleanField(default=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "sla_configs"
        verbose_name = "SLA Config"
        verbose_name_plural = "SLA Configs"
        unique_together = [("organization", "priority")]
        indexes = [
            models.Index(fields=["organization", "is_active"]),
        ]

    def __str__(self):
        return f"{self.priority.upper()} SLA for Org {self.organization_id}"
