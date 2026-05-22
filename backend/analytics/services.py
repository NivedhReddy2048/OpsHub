"""
analytics/services.py
"""
from django.db.models import Count, Q, F, FloatField, ExpressionWrapper
from tickets.models import Ticket
from tasks.models import Task, Project
from core.constants import TicketStatus, TaskStatus
from accounts.models import CustomUser

class AnalyticsService:
    @staticmethod
    def get_dashboard_metrics(user: CustomUser):
        org = user.organization

        # Tickets stats
        ticket_stats = Ticket.objects.filter(organization=org).aggregate(
            total_open=Count("id", filter=~Q(status__in=[TicketStatus.RESOLVED, TicketStatus.CLOSED])),
            breached_slas=Count("id", filter=Q(is_sla_breached=True, status__in=[TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS])),
        )

        ticket_status_breakdown = list(
            Ticket.objects.filter(organization=org)
            .values("status")
            .annotate(count=Count("id"))
        )

        ticket_priority_breakdown = list(
            Ticket.objects.filter(organization=org)
            .values("priority")
            .annotate(count=Count("id"))
        )

        # Tasks stats
        task_stats = Task.objects.filter(organization=org).aggregate(
            active_tasks=Count("id", filter=~Q(status__in=[TaskStatus.DONE, TaskStatus.ARCHIVED])),
            completed_tasks=Count("id", filter=Q(status=TaskStatus.DONE)),
            overdue_tasks=Count("id", filter=Q(is_overdue=True, status__in=[TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW])),
        )

        task_status_breakdown = list(
            Task.objects.filter(organization=org)
            .values("status")
            .annotate(count=Count("id"))
        )

        # Projects health (completion pct)
        projects = list(
            Project.objects.filter(organization=org, is_active=True)
            .annotate(
                total_tasks=Count("tasks"),
                completed_tasks=Count("tasks", filter=Q(tasks__status=TaskStatus.DONE)),
            )
            .values("id", "name", "total_tasks", "completed_tasks")
        )

        project_summary = []
        for p in projects:
            pct = 0
            if p["total_tasks"] > 0:
                pct = int((p["completed_tasks"] / p["total_tasks"]) * 100)
            project_summary.append({
                "id": p["id"],
                "name": p["name"],
                "total_tasks": p["total_tasks"],
                "completed_tasks": p["completed_tasks"],
                "completion_pct": pct,
            })

        return {
            "total_open_tickets": ticket_stats["total_open"],
            "breached_slas": ticket_stats["breached_slas"],
            "active_tasks": task_stats["active_tasks"],
            "completed_tasks": task_stats["completed_tasks"],
            "overdue_tasks": task_stats["overdue_tasks"],
            "ticket_status_breakdown": ticket_status_breakdown,
            "ticket_priority_breakdown": ticket_priority_breakdown,
            "task_status_breakdown": task_status_breakdown,
            "project_completion_summary": project_summary,
        }
