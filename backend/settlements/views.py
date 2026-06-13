from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from groups.models import Group, GroupMember
from users.models import User
from .models import Settlement
from .serializers import SettlementSerializer, SettlementCreateSerializer


class SettlementListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get_group_or_403(self, group_id, user):
        group = get_object_or_404(Group, pk=group_id)
        if not GroupMember.objects.filter(group=group, user=user).exists():
            return None, Response({'detail': 'Not a member.'}, status=403)
        return group, None

    def get(self, request, group_id):
        group, err = self.get_group_or_403(group_id, request.user)
        if err:
            return err
        settlements = group.settlements.select_related('paid_by', 'paid_to')
        return Response(SettlementSerializer(settlements, many=True).data)

    def post(self, request, group_id):
        group, err = self.get_group_or_403(group_id, request.user)
        if err:
            return err

        serializer = SettlementCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        paid_by = get_object_or_404(User, pk=data['paid_by_id'])
        paid_to = get_object_or_404(User, pk=data['paid_to_id'])

        if paid_by == paid_to:
            return Response({'detail': 'Cannot settle with yourself.'}, status=400)

        for u in [paid_by, paid_to]:
            if not GroupMember.objects.filter(group=group, user=u).exists():
                return Response({'detail': f'{u.name} is not a group member.'}, status=400)

        settlement = Settlement.objects.create(
            group=group,
            paid_by=paid_by,
            paid_to=paid_to,
            amount=data['amount'],
            notes=data.get('notes', ''),
            date=data.get('date', timezone.now().date()),
        )
        return Response(SettlementSerializer(settlement).data, status=status.HTTP_201_CREATED)
