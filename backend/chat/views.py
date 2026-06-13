from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from expenses.models import Expense
from groups.models import GroupMember
from .models import Message
from .serializers import MessageSerializer


class MessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, expense_id):
        expense = get_object_or_404(Expense, pk=expense_id)
        if not GroupMember.objects.filter(group=expense.group, user=request.user).exists():
            return Response({'detail': 'Not a member.'}, status=403)
        messages = expense.messages.select_related('sender')
        return Response(MessageSerializer(messages, many=True).data)
