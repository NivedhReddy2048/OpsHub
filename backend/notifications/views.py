"""
notifications/views.py
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsOrganizationMember
from .models import Notification
from .serializers import NotificationSerializer
from .services import NotificationService


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get(self, request):
        # Return all notifications for user, ordered by created_at desc.
        # We limit to 50 for now. Pagination can be added later.
        qs = Notification.objects.filter(recipient=request.user)[:50]
        serializer = NotificationSerializer(qs, many=True)
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({
            "results": serializer.data,
            "unread_count": unread_count,
        })


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
        except Notification.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
            
        notification = NotificationService.mark_as_read(notification)
        return Response(NotificationSerializer(notification).data)


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def post(self, request):
        count = NotificationService.mark_all_as_read(request.user)
        return Response({"marked_count": count})
