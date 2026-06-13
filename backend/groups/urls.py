from django.urls import path
from .views import GroupListCreateView, GroupDetailView, GroupMemberView, GroupMemberDetailView

urlpatterns = [
    path('groups/', GroupListCreateView.as_view(), name='group-list-create'),
    path('groups/<uuid:pk>/', GroupDetailView.as_view(), name='group-detail'),
    path('groups/<uuid:pk>/members/', GroupMemberView.as_view(), name='group-members'),
    path('groups/<uuid:pk>/members/<uuid:user_id>/', GroupMemberDetailView.as_view(), name='group-member-detail'),
]
