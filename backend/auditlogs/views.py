"""
auditlogs/views.py
"""
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsOrganizationMember, IsAdmin
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    """
    List all audit logs for the organization.
    Only admins should ideally see this, but for OpsHub, 
    we can restrict to admins or let everyone see timeline.
    Let's restrict to admins for security.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember, IsAdmin]

    def get_queryset(self):
        return AuditLog.objects.filter(
            organization=self.request.user.organization
        ).select_related("actor")
