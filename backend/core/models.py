"""
core/models.py

Abstract base model inherited by all OpsHub models.
Provides: created_at, updated_at, is_deleted (soft delete).
"""
from django.db import models


class BaseModel(models.Model):
    """
    Abstract model providing timestamp and soft-delete fields.
    All OpsHub models should inherit from this.
    """
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False, db_index=True)

    class Meta:
        abstract = True

    def soft_delete(self):
        """Mark record as deleted without removing from DB."""
        self.is_deleted = True
        self.save(update_fields=["is_deleted", "updated_at"])

    def restore(self):
        """Restore a soft-deleted record."""
        self.is_deleted = False
        self.save(update_fields=["is_deleted", "updated_at"])


class ActiveManager(models.Manager):
    """Default manager that excludes soft-deleted records."""
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
