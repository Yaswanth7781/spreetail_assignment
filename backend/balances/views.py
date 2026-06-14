from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from groups.models import Group, GroupMember
from users.serializers import UserSerializer
from .calculator import compute_net_balances, compute_user_summary, compute_simplified_balances


class GroupBalancesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        group = get_object_or_404(Group, pk=group_id)
        if not GroupMember.objects.filter(group=group, user=request.user).exists():
            return Response({'detail': 'Not a member.'}, status=403)

        balances = compute_net_balances(group)
        result = [
            {
                'from_user': UserSerializer(b['from_user']).data,
                'to_user': UserSerializer(b['to_user']).data,
                'amount': str(b['amount']),
            }
            for b in balances
        ]
        return Response({'balances': result})


class GroupSimplifiedBalancesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        group = get_object_or_404(Group, pk=group_id)
        if not GroupMember.objects.filter(group=group, user=request.user).exists():
            return Response({'detail': 'Not a member.'}, status=403)

        balances = compute_simplified_balances(group)
        result = [
            {
                'from_user': UserSerializer(b['from_user']).data,
                'to_user': UserSerializer(b['to_user']).data,
                'amount': str(b['amount']),
            }
            for b in balances
        ]
        return Response({'balances': result})



class UserBalanceSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        summary = compute_user_summary(request.user)
        result = [
            {
                'user': UserSerializer(s['user']).data,
                'net_amount': str(s['net_amount']),
            }
            for s in summary
        ]
        return Response({'summary': result})
