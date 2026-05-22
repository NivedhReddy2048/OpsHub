"""
Root URL configuration for OpsHub API.
All API routes live under /api/v1/
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from core.views import health_check, GlobalSearchView
from accounts.views import LogoutView
from tasks.urls import project_patterns, task_patterns
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),

    # Health check (public)
    path("api/v1/health/", health_check, name="health-check"),
    path("api/v1/search/", GlobalSearchView.as_view(), name="global-search"),

    # API Documentation
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/v1/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/v1/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # JWT Authentication
    path("api/v1/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/v1/auth/token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("api/v1/auth/logout/", LogoutView.as_view(), name="auth-logout"),

    # App routes
    path("api/v1/accounts/", include("accounts.urls")),
    path("api/v1/organizations/", include("organizations.urls")),
    path("api/v1/tickets/", include("tickets.urls")),
    path("api/v1/projects/", include(project_patterns)),
    path("api/v1/tasks/", include(task_patterns)),
    path("api/v1/notifications/", include("notifications.urls")),
    path("api/v1/analytics/", include("analytics.urls")),
    path("api/v1/auditlogs/", include("auditlogs.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
