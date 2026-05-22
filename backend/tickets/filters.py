"""
tickets/filters.py

django-filter FilterSet for the Ticket model.
Plugs into DRF's DjangoFilterBackend — no manual query param parsing in views.
"""
import django_filters
from .models import Ticket


class TicketFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name="status")
    priority = django_filters.CharFilter(field_name="priority")
    assigned_to = django_filters.NumberFilter(field_name="assigned_to__id")
    category = django_filters.NumberFilter(field_name="category__id")
    is_sla_breached = django_filters.BooleanFilter(field_name="is_sla_breached")

    # Date-range filters
    created_after = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="gte"
    )
    created_before = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="lte"
    )
    due_before = django_filters.DateTimeFilter(
        field_name="due_at", lookup_expr="lte"
    )

    # Unassigned filter
    unassigned = django_filters.BooleanFilter(
        field_name="assigned_to", lookup_expr="isnull"
    )

    class Meta:
        model = Ticket
        fields = [
            "status", "priority", "assigned_to",
            "category", "is_sla_breached",
        ]
