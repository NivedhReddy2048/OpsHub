"""
tasks/filters.py

django-filter FilterSets for Task and Project models.
"""
import django_filters
from .models import Task, Project


class TaskFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name="status")
    priority = django_filters.CharFilter(field_name="priority")
    assigned_to = django_filters.NumberFilter(field_name="assigned_to__id")
    project = django_filters.NumberFilter(field_name="project__id")
    is_overdue = django_filters.BooleanFilter(field_name="is_overdue")
    has_linked_ticket = django_filters.BooleanFilter(
        field_name="linked_ticket", lookup_expr="isnull", exclude=True
    )

    # Date range
    due_before = django_filters.DateFilter(field_name="due_date", lookup_expr="lte")
    due_after = django_filters.DateFilter(field_name="due_date", lookup_expr="gte")
    created_after = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")

    # Unassigned
    unassigned = django_filters.BooleanFilter(
        field_name="assigned_to", lookup_expr="isnull"
    )

    class Meta:
        model = Task
        fields = ["status", "priority", "assigned_to", "project", "is_overdue"]


class ProjectFilter(django_filters.FilterSet):
    is_active = django_filters.BooleanFilter(field_name="is_active")

    class Meta:
        model = Project
        fields = ["is_active"]
