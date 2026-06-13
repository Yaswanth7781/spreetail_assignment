from rest_framework.permissions import BasePermission
from .models import Group, GroupMember


class IsGroupAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Group):
            return obj.created_by == request.user
        return False


class IsGroupMember(BasePermission):
    def has_permission(self, request, view):
        group_id = view.kwargs.get('group_id') or view.kwargs.get('pk')
        if not group_id:
            return True
        return GroupMember.objects.filter(group_id=group_id, user=request.user).exists()
