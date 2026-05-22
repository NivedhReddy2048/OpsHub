"""
notifications/services.py
"""
import logging
from accounts.models import CustomUser
from .models import Notification

logger = logging.getLogger(__name__)


class NotificationService:
    @staticmethod
    def notify(
        *,
        recipient: CustomUser,
        title: str,
        message: str,
        type: str,
        related_object_type: str = "",
        related_object_id: int | None = None,
    ) -> Notification | None:
        """
        Create a new in-app notification for a user.
        """
        if not recipient.organization_id:
            return None

        try:
            notification = Notification.objects.create(
                organization_id=recipient.organization_id,
                recipient=recipient,
                title=title,
                message=message,
                type=type,
                related_object_type=related_object_type,
                related_object_id=related_object_id,
            )
            return notification
        except Exception as e:
            logger.error("Failed to create notification: %s", e)
            return None

    @staticmethod
    def mark_as_read(notification: Notification) -> Notification:
        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=["is_read"])
        return notification

    @staticmethod
    def mark_all_as_read(user: CustomUser) -> int:
        return Notification.objects.filter(
            recipient=user, is_read=False
        ).update(is_read=True)
