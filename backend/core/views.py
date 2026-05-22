"""
core/views.py

Platform-level views: health check, etc.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.db import connection


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """
    Public health check endpoint.
    Verifies DB connectivity and returns service status.
    Used by Render/Railway health probe.
    """
    db_status = "healthy"
    try:
        connection.ensure_connection()
    except Exception:
        db_status = "unhealthy"

    return Response(
        {
            "success": True,
            "status": "healthy",
            "service": "OpsHub API",
            "version": "1.0.0",
            "timestamp": timezone.now().isoformat(),
            "database": db_status,
        }
    )

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsOrganizationMember
from tickets.models import Ticket
from tasks.models import Task, Project
from django.db.models import Q

class GlobalSearchView(APIView):
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if len(query) < 2:
            return Response({"tickets": [], "tasks": [], "projects": []})

        org = request.user.organization
        
        ticket_q = Q(title__icontains=query)
        task_q = Q(title__icontains=query)
        
        if query.isdigit():
            ticket_q |= Q(id=int(query))
            task_q |= Q(id=int(query))

        tickets = Ticket.objects.filter(organization=org).filter(ticket_q)[:5].values("id", "title", "status", "priority")

        tasks = Task.objects.filter(organization=org).filter(task_q)[:5].values("id", "title", "status", "priority")

        projects = Project.objects.filter(organization=org).filter(
            Q(name__icontains=query)
        )[:5].values("id", "name")

        return Response({
            "tickets": list(tickets),
            "tasks": list(tasks),
            "projects": list(projects),
        })
