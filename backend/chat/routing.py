from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/expense/(?P<expense_id>[0-9a-f-]+)/$', consumers.ExpenseChatConsumer.as_asgi()),
]
