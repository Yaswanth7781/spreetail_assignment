from django.urls import path
from .views import MessageListView

urlpatterns = [
    path('expenses/<uuid:expense_id>/messages/', MessageListView.as_view(), name='message-list'),
]
