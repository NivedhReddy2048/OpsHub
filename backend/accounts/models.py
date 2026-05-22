"""
accounts/models.py

Custom user model extending AbstractUser.
Uses email as the primary login field.
Role stored directly on the user for simplicity and query performance.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from core.constants import UserRole


class CustomUser(AbstractUser):
    """
    OpsHub custom user model.
    - email is unique and used as the login identifier
    - role determines permissions across the platform
    - organization FK is nullable (set in Phase 2 onboarding flow)
    """

    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=255, blank=True)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.TEAM_MEMBER,
        db_index=True,
    )
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="members",
    )
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    is_active = models.BooleanField(default=True)

    # Use email as the login field
    USERNAME_FIELD = "email"
    # username still required by AbstractUser — keep it but make optional
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "accounts_users"
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-date_joined"]

    def __str__(self):
        return self.email

    def get_full_name(self):
        return self.full_name or self.email

    # --- Role helpers ---
    @property
    def is_admin(self):
        return self.role == UserRole.ADMIN

    @property
    def is_support_agent(self):
        return self.role == UserRole.SUPPORT_AGENT

    @property
    def is_team_member(self):
        return self.role == UserRole.TEAM_MEMBER
