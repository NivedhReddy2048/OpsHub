"""
auditlogs/services.py
"""
import logging
from accounts.models import CustomUser
from .models import AuditLog

logger = logging.getLogger(__name__)


class AuditLogService:
    @staticmethod
    def log(
        *,
        organization_id: int,
        action: str,
        target_type: str,
        target_id: int,
        actor: CustomUser | None = None,
        metadata: dict | None = None,
    ) -> AuditLog | None:
        """
        Record an audit log entry.
        Designed to be called explicitly from domain services.
        """
        try:
            log_entry = AuditLog.objects.create(
                organization_id=organization_id,
                actor=actor,
                action=action,
                target_type=target_type,
                target_id=target_id,
                metadata=metadata or {},
            )
            return log_entry
        except Exception as e:
            # Audit log failure should NOT bring down the main request
            logger.error("Failed to create audit log: %s", e)
            return None
