from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('users.urls')),
    path('api/v1/', include('groups.urls')),
    path('api/v1/', include('expenses.urls')),
    path('api/v1/', include('balances.urls')),
    path('api/v1/', include('settlements.urls')),
    path('api/v1/', include('chat.urls')),
]
