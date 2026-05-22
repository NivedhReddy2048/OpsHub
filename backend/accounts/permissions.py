"""
accounts/permissions.py

DRF permission classes for OpsHub RBAC.
All classes assume the user is already authenticated (IsAuthenticated is a prerequisite).
Use these in combination:
    permission_classes = [IsAuthenticated, IsAdmin]
"""
import logging
from rest_framework.permissions import BasePermission
from core.constants import UserRole

logger = logging.getLogger(__name__)


class IsAdmin(BasePermission):
    """Allow access only to users with the admin role."""
    message = "Only administrators can perform this action."

    def has_permission(self, request, view):
        user = request.user
        authenticated = bool(user and user.is_authenticated)
        role = getattr(user, "role", None)
        result = bool(authenticated and role == UserRole.ADMIN)
        logger.info(
            "[AUTH_DEBUG] IsAdmin evaluated - User ID: %s, Role: %s, Org ID: %s, Result: %s",
            getattr(user, "id", None),
            role,
            getattr(user, "organization_id", None),
            result
        )
        return result


class IsSupportAgent(BasePermission):
    """Allow access only to support agents."""
    message = "Only support agents can perform this action."

    def has_permission(self, request, view):
        user = request.user
        authenticated = bool(user and user.is_authenticated)
        role = getattr(user, "role", None)
        result = bool(authenticated and role == UserRole.SUPPORT_AGENT)
        logger.info(
            "[AUTH_DEBUG] IsSupportAgent evaluated - User ID: %s, Role: %s, Org ID: %s, Result: %s",
            getattr(user, "id", None),
            role,
            getattr(user, "organization_id", None),
            result
        )
        return result


class IsTeamMember(BasePermission):
    """Allow access only to team members."""
    message = "Only team members can perform this action."

    def has_permission(self, request, view):
        user = request.user
        authenticated = bool(user and user.is_authenticated)
        role = getattr(user, "role", None)
        result = bool(authenticated and role == UserRole.TEAM_MEMBER)
        logger.info(
            "[AUTH_DEBUG] IsTeamMember evaluated - User ID: %s, Role: %s, Org ID: %s, Result: %s",
            getattr(user, "id", None),
            role,
            getattr(user, "organization_id", None),
            result
        )
        return result


class IsAdminOrSupportAgent(BasePermission):
    """Allow access to admins or support agents."""
    message = "Only admins or support agents can perform this action."

    def has_permission(self, request, view):
        user = request.user
        authenticated = bool(user and user.is_authenticated)
        role = getattr(user, "role", None)
        result = bool(authenticated and role in (UserRole.ADMIN, UserRole.SUPPORT_AGENT))
        logger.info(
            "[AUTH_DEBUG] IsAdminOrSupportAgent evaluated - User ID: %s, Role: %s, Org ID: %s, Result: %s",
            getattr(user, "id", None),
            role,
            getattr(user, "organization_id", None),
            result
        )
        return result


class IsOrganizationMember(BasePermission):
    """
    Ensures the requesting user belongs to an organization.
    Useful as a base guard before org-scoped queries.
    """
    message = "You must belong to an organization to access this resource."

    def has_permission(self, request, view):
        user = request.user
        authenticated = bool(user and user.is_authenticated)
        org_id = getattr(user, "organization_id", None)
        result = bool(authenticated and org_id is not None)
        logger.info(
            "[AUTH_DEBUG] IsOrganizationMember evaluated - User ID: %s, Role: %s, Org ID: %s, Result: %s",
            getattr(user, "id", None),
            getattr(user, "role", None),
            org_id,
            result
        )
        return result


class IsSameOrganization(BasePermission):
    """
    Object-level permission: user can only access objects within their own organization.
    The object must have an `organization` attribute.
    """
    message = "You do not have permission to access resources from another organization."

    def has_object_permission(self, request, view, obj):
        user = request.user
        authenticated = bool(user and user.is_authenticated)
        obj_org_id = getattr(obj, "organization_id", None)
        user_org_id = getattr(user, "organization_id", None)
        result = bool(authenticated and obj_org_id == user_org_id)
        logger.info(
            "[AUTH_DEBUG] IsSameOrganization evaluated - User ID: %s, User Org: %s, Object Org: %s, Result: %s",
            getattr(user, "id", None),
            user_org_id,
            obj_org_id,
            result
        )
        return result
