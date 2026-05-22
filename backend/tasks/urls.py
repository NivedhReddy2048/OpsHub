"""
tasks/urls.py — All task and project endpoints.
"""
from django.urls import path
from .views import (
    ProjectListCreateView,
    ProjectDetailView,
    TaskListCreateView,
    TaskDetailView,
    TaskTransitionView,
    TaskAssignView,
    ConvertTicketToTaskView,
    TaskCommentListCreateView,
    TaskCommentDeleteView,
)

# Projects: /api/v1/projects/
project_patterns = [
    path("", ProjectListCreateView.as_view(), name="project-list-create"),
    path("<int:pk>/", ProjectDetailView.as_view(), name="project-detail"),
]

# Tasks: /api/v1/tasks/
task_patterns = [
    path("", TaskListCreateView.as_view(), name="task-list-create"),
    path("<int:pk>/", TaskDetailView.as_view(), name="task-detail"),
    path("<int:pk>/transition/", TaskTransitionView.as_view(), name="task-transition"),
    path("<int:pk>/assign/", TaskAssignView.as_view(), name="task-assign"),
    path("from-ticket/<int:ticket_id>/", ConvertTicketToTaskView.as_view(), name="task-from-ticket"),
    path("<int:pk>/comments/", TaskCommentListCreateView.as_view(), name="task-comments"),
    path(
        "<int:pk>/comments/<int:comment_id>/",
        TaskCommentDeleteView.as_view(),
        name="task-comment-delete",
    ),
]
