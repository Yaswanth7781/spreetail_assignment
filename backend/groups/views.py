from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Group, GroupMember
from .serializers import GroupSerializer, GroupCreateSerializer, GroupMemberSerializer
from users.models import User
from users.serializers import UserSerializer


class GroupListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return GroupCreateSerializer
        return GroupSerializer

    def get_queryset(self):
        return Group.objects.filter(
            memberships__user=self.request.user
        ).distinct().order_by('-created_at')

    def create(self, request, *args, **kwargs):
        serializer = GroupCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        group = serializer.save(created_by=request.user)
        GroupMember.objects.create(group=group, user=request.user)
        return Response(GroupSerializer(group).data, status=status.HTTP_201_CREATED)


class GroupDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_group(self, pk, user):
        group = get_object_or_404(Group, pk=pk)
        if not GroupMember.objects.filter(group=group, user=user).exists():
            return None, Response({'detail': 'Not a member.'}, status=status.HTTP_403_FORBIDDEN)
        return group, None

    def get(self, request, pk):
        group, err = self.get_group(pk, request.user)
        if err:
            return err
        return Response(GroupSerializer(group).data)

    def delete(self, request, pk):
        group, err = self.get_group(pk, request.user)
        if err:
            return err
        if group.created_by != request.user:
            return Response({'detail': 'Only admin can delete group.'}, status=status.HTTP_403_FORBIDDEN)
        group.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GroupMemberView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        group = get_object_or_404(Group, pk=pk)
        if group.created_by != request.user:
            return Response({'detail': 'Only admin can add members.'}, status=status.HTTP_403_FORBIDDEN)
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        membership, created = GroupMember.objects.get_or_create(group=group, user=user)
        if not created:
            return Response({'detail': 'User is already a member.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(GroupMemberSerializer(membership).data, status=status.HTTP_201_CREATED)


class GroupMemberDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, user_id):
        group = get_object_or_404(Group, pk=pk)
        if group.created_by != request.user:
            return Response({'detail': 'Only admin can remove members.'}, status=status.HTTP_403_FORBIDDEN)
        if str(group.created_by.id) == str(user_id):
            return Response({'detail': 'Cannot remove group admin.'}, status=status.HTTP_400_BAD_REQUEST)
        membership = get_object_or_404(GroupMember, group=group, user_id=user_id)
        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
