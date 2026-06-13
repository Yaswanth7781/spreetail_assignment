from django.urls import path
from .views import GroupBalancesView, UserBalanceSummaryView

urlpatterns = [
    path('groups/<uuid:group_id>/balances/', GroupBalancesView.as_view(), name='group-balances'),
    path('balances/summary/', UserBalanceSummaryView.as_view(), name='balance-summary'),
]
