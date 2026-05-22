"""
organizations/views.py

Organization views for Phase 2.
All views are org-scoped — users can only see their own organization.
"""
import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdmin, IsOrganizationMember
from .models import Organization
from .serializers import OrganizationSerializer

logger = logging.getLogger(__name__)


class MyOrganizationView(APIView):
    """
    GET /api/v1/organizations/mine/
    Returns the authenticated user's organization detail.
    Returns 404 if user has no organization assigned.
    """
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get(self, request: Request) -> Response:
        org = request.user.organization
        serializer = OrganizationSerializer(org, context={"request": request})
        return Response(serializer.data)
