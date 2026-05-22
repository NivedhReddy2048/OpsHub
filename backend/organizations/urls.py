"""
organizations/urls.py — Phase 2 organization routes.
"""
from django.urls import path
from .views import MyOrganizationView

urlpatterns = [
    path("mine/", MyOrganizationView.as_view(), name="organizations-mine"),
]
