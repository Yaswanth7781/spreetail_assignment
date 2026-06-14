from django.urls import path
from .views import GroupBalancesView, UserBalanceSummaryView, GroupSimplifiedBalancesView

urlpatterns = [
    path('groups/<uuid:group_id>/balances/', GroupBalancesView.as_view(), name='group-balances'),
    path('groups/<uuid:group_id>/simplified-balances/', GroupSimplifiedBalancesView.as_view(), name='group-simplified-balances'),
    path('balances/summary/', UserBalanceSummaryView.as_view(), name='balance-summary'),
]
