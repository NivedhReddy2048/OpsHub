"""
accounts/permissions.py

DRF permission classes for OpsHub RBAC.
All classes assume the user is already authenticated (IsAuthenticated is a prerequisite).
Use these in combination:
    permission_classes = [IsAuthenticated, IsAdmin]
"""
from rest_framework.permissions import BasePermission
from core.constants import UserRole


class IsAdmin(BasePermission):
    """Allow access only to users with the admin role."""
    message = "Only administrators can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.ADMIN
        )


class IsSupportAgent(BasePermission):
    """Allow access only to support agents."""
    message = "Only support agents can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.SUPPORT_AGENT
        )


class IsTeamMember(BasePermission):
    """Allow access only to team members."""
    message = "Only team members can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.TEAM_MEMBER
        )


class IsAdminOrSupportAgent(BasePermission):
    """Allow access to admins or support agents."""
    message = "Only admins or support agents can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (UserRole.ADMIN, UserRole.SUPPORT_AGENT)
        )


class IsOrganizationMember(BasePermission):
    """
    Ensures the requesting user belongs to an organization.
    Useful as a base guard before org-scoped queries.
    """
    message = "You must belong to an organization to access this resource."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.organization_id is not None
        )


class IsSameOrganization(BasePermission):
    """
    Object-level permission: user can only access objects within their own organization.
    The object must have an `organization` attribute.
    """
    message = "You do not have permission to access resources from another organization."

    def has_object_permission(self, request, view, obj):
        return (
            request.user.is_authenticated
            and hasattr(obj, "organization_id")
            and obj.organization_id == request.user.organization_id
        )
