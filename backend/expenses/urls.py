from django.urls import path
from .views import ExpenseListCreateView, ExpenseDetailView

urlpatterns = [
    path('groups/<uuid:group_id>/expenses/', ExpenseListCreateView.as_view(), name='expense-list-create'),
    path('groups/<uuid:group_id>/expenses/<uuid:pk>/', ExpenseDetailView.as_view(), name='expense-detail'),
]
