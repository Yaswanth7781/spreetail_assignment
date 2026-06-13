from django.urls import path
from .views import SettlementListCreateView

urlpatterns = [
    path('groups/<uuid:group_id>/settlements/', SettlementListCreateView.as_view(), name='settlement-list-create'),
]
