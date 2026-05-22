"""
analytics/views.py
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsOrganizationMember
from .services import AnalyticsService

class DashboardAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get(self, request):
        metrics = AnalyticsService.get_dashboard_metrics(request.user)
        return Response(metrics)
