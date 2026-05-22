"""
accounts/urls.py — Phase 2 auth and user management routes.
"""
from django.urls import path
from .views import (
    MeView,
    ChangePasswordView,
    UserListView,
    UserDetailView,
)

urlpatterns = [
    # Current user
    path("me/", MeView.as_view(), name="accounts-me"),
    path("me/change-password/", ChangePasswordView.as_view(), name="accounts-change-password"),

    # Admin user management (org-scoped)
    path("users/", UserListView.as_view(), name="accounts-user-list"),
    path("users/<int:pk>/", UserDetailView.as_view(), name="accounts-user-detail"),
]
