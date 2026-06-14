from django.urls import path
from .views import ExpenseListCreateView, ExpenseDetailView, ImportUploadView, ImportCommitView

urlpatterns = [
    path('groups/<uuid:group_id>/expenses/', ExpenseListCreateView.as_view(), name='expense-list-create'),
    path('groups/<uuid:group_id>/expenses/<uuid:pk>/', ExpenseDetailView.as_view(), name='expense-detail'),
    path('groups/<uuid:group_id>/import/upload/', ImportUploadView.as_view(), name='import-upload'),
    path('groups/<uuid:group_id>/import/commit/', ImportCommitView.as_view(), name='import-commit'),
]
