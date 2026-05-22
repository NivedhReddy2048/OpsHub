"""
tickets/urls.py — All ticket domain endpoints.
"""
from django.urls import path
from .views import (
    TicketListCreateView,
    TicketDetailView,
    TicketTransitionView,
    TicketAssignView,
    TicketCommentListCreateView,
    TicketCommentDeleteView,
    TicketAttachmentView,
    TicketAttachmentDeleteView,
    TicketCategoryListCreateView,
    TicketCategoryDeleteView,
)

urlpatterns = [
    # Ticket CRUD
    path("", TicketListCreateView.as_view(), name="ticket-list-create"),
    path("<int:pk>/", TicketDetailView.as_view(), name="ticket-detail"),

    # Status & assignment
    path("<int:pk>/transition/", TicketTransitionView.as_view(), name="ticket-transition"),
    path("<int:pk>/assign/", TicketAssignView.as_view(), name="ticket-assign"),

    # Comments
    path("<int:pk>/comments/", TicketCommentListCreateView.as_view(), name="ticket-comments"),
    path(
        "<int:pk>/comments/<int:comment_id>/",
        TicketCommentDeleteView.as_view(),
        name="ticket-comment-delete",
    ),

    # Attachments
    path("<int:pk>/attachments/", TicketAttachmentView.as_view(), name="ticket-attachments"),
    path(
        "<int:pk>/attachments/<int:attachment_id>/",
        TicketAttachmentDeleteView.as_view(),
        name="ticket-attachment-delete",
    ),

    # Categories
    path("categories/", TicketCategoryListCreateView.as_view(), name="ticket-category-list"),
    path(
        "categories/<int:pk>/",
        TicketCategoryDeleteView.as_view(),
        name="ticket-category-delete",
    ),
]
