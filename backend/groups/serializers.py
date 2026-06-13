from rest_framework import serializers
from .models import Group, GroupMember
from users.serializers import UserSerializer


class GroupMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = GroupMember
        fields = ['id', 'user', 'joined_at']


class GroupSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    members = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'created_by', 'members', 'member_count', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_members(self, obj):
        memberships = obj.memberships.select_related('user').all()
        return GroupMemberSerializer(memberships, many=True).data

    def get_member_count(self, obj):
        return obj.memberships.count()


class GroupCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']
