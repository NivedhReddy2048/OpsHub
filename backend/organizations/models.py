"""
organizations/models.py

Organization is the top-level multi-tenant unit in OpsHub.
All tickets, tasks, and users belong to an organization.
"""
from django.db import models
from django.utils.text import slugify
from core.models import BaseModel, ActiveManager


class Organization(BaseModel):
    """
    Represents a tenant/company using OpsHub.
    Slug is auto-generated from name and must be unique.
    """
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(unique=True, max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)

    # Default managers
    objects = ActiveManager()       # Excludes soft-deleted records
    all_objects = models.Manager()  # Includes all records

    class Meta:
        db_table = "organizations"
        verbose_name = "Organization"
        verbose_name_plural = "Organizations"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
