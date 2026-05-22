"""
accounts/views.py

Authentication and user management views for Phase 2.

Endpoints:
    POST /api/v1/accounts/register/           — Admin creates a user in their org
    GET  /api/v1/accounts/me/                 — Current authenticated user
    PATCH /api/v1/accounts/me/                — Update own profile
    POST /api/v1/accounts/me/change-password/ — Change own password
    GET  /api/v1/accounts/users/              — List users in same org (admin only)
    GET  /api/v1/accounts/users/<id>/         — Get user detail (admin only)
    POST /api/v1/auth/logout/                 — Blacklist refresh token (logout)
"""
import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import CustomUser
from .permissions import IsAdmin, IsOrganizationMember
from .serializers import (
    UserSerializer,
    UserListSerializer,
    UserRegistrationSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer,
)

logger = logging.getLogger(__name__)


# ─── Logout ───────────────────────────────────────────────────────────────────

class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Blacklists the provided refresh token, effectively invalidating the session.
    The access token will expire naturally (short-lived by design).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        logger.info("User %s logged out.", request.user.email)
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)


# ─── Current User ─────────────────────────────────────────────────────────────

class MeView(APIView):
    """
    GET  /api/v1/accounts/me/ — Return the authenticated user's full profile.
    PATCH /api/v1/accounts/me/ — Update full_name, username, or avatar.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        serializer = UserSerializer(request.user, context={"request": request})
        return Response(serializer.data)

    def patch(self, request: Request) -> Response:
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Return full updated profile
        return Response(
            UserSerializer(request.user, context={"request": request}).data
        )


# ─── Change Password ───────────────────────────────────────────────────────────

class ChangePasswordView(APIView):
    """
    POST /api/v1/accounts/me/change-password/
    Validates current password, sets a new one. All existing tokens remain valid
    until their natural expiry (short-lived access tokens mitigate this risk).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        logger.info("User %s changed password.", request.user.email)
        return Response({"detail": "Password changed successfully."})


# ─── Admin: Register / List Users ─────────────────────────────────────────────

class UserListView(APIView):
    """
    GET  /api/v1/accounts/users/ — List all users in the admin's organization.
    POST /api/v1/accounts/users/ — Register a new user in the admin's organization.

    Only admins can access this endpoint.
    Users are automatically scoped to the requesting admin's organization.
    """
    permission_classes = [IsAuthenticated, IsAdmin, IsOrganizationMember]

    def get(self, request: Request) -> Response:
        queryset = (
            CustomUser.objects.filter(organization=request.user.organization)
            .order_by("-date_joined")
        )
        serializer = UserListSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request: Request) -> Response:
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save(organization=request.user.organization)
        logger.info(
            "Admin %s created user %s in org %s.",
            request.user.email,
            user.email,
            request.user.organization,
        )
        return Response(
            UserSerializer(user, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class UserDetailView(APIView):
    """
    GET   /api/v1/accounts/users/<pk>/ — Get a specific user (admin only, same org).
    PATCH /api/v1/accounts/users/<pk>/ — Admin updates a user's role or active status.
    """
    permission_classes = [IsAuthenticated, IsAdmin, IsOrganizationMember]

    def _get_user(self, pk: int, requesting_user: CustomUser) -> CustomUser | None:
        """Return user only if they belong to the same organization."""
        try:
            return CustomUser.objects.get(pk=pk, organization=requesting_user.organization)
        except CustomUser.DoesNotExist:
            return None

    def get(self, request: Request, pk: int) -> Response:
        user = self._get_user(pk, request.user)
        if not user:
            return Response(
                {"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(UserSerializer(user, context={"request": request}).data)

    def patch(self, request: Request, pk: int) -> Response:
        user = self._get_user(pk, request.user)
        if not user:
            return Response(
                {"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )
        # Admin can update role and is_active only — not passwords or emails
        allowed_fields = {"role", "is_active", "full_name"}
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        serializer = UserSerializer(user, data=data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
