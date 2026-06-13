from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from groups.models import Group, GroupMember
from users.models import User
from .models import Expense, ExpenseSplit
from .serializers import ExpenseSerializer, ExpenseCreateSerializer
from .split_logic import compute_splits


class ExpenseListCreateView(APIView):
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
        expenses = group.expenses.select_related('paid_by', 'created_by').prefetch_related('splits__user')
        return Response(ExpenseSerializer(expenses, many=True).data)

    def post(self, request, group_id):
        group, err = self.get_group_or_403(group_id, request.user)
        if err:
            return err

        serializer = ExpenseCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        paid_by = get_object_or_404(User, pk=data['paid_by_id'])
        if not GroupMember.objects.filter(group=group, user=paid_by).exists():
            return Response({'detail': 'Paid-by user is not a group member.'}, status=400)

        splits_input = [{'user_id': str(s['user_id']), 'share_value': s.get('share_value')} for s in data['splits']]

        # Validate split inputs
        split_type = data['split_type']
        if split_type in ('unequal', 'percentage', 'share'):
            for s in splits_input:
                if s['share_value'] is None:
                    return Response({'detail': f'share_value required for {split_type} split.'}, status=400)

        computed = compute_splits(data['amount'], split_type, splits_input)

        expense = Expense.objects.create(
            group=group,
            title=data['title'],
            amount=data['amount'],
            paid_by=paid_by,
            split_type=split_type,
            notes=data.get('notes', ''),
            date=data.get('date', timezone.now().date()),
            created_by=request.user,
        )

        for split in computed:
            user = get_object_or_404(User, pk=split['user_id'])
            ExpenseSplit.objects.create(
                expense=expense,
                user=user,
                owed_amount=split['owed_amount'],
                share_value=split['share_value'],
            )

        expense.refresh_from_db()
        return Response(ExpenseSerializer(expense).data, status=status.HTTP_201_CREATED)


class ExpenseDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_expense_or_403(self, group_id, expense_id, user):
        group = get_object_or_404(Group, pk=group_id)
        if not GroupMember.objects.filter(group=group, user=user).exists():
            return None, None, Response({'detail': 'Not a member.'}, status=403)
        expense = get_object_or_404(Expense, pk=expense_id, group=group)
        return group, expense, None

    def get(self, request, group_id, pk):
        group, expense, err = self.get_expense_or_403(group_id, pk, request.user)
        if err:
            return err
        return Response(ExpenseSerializer(expense).data)

    def delete(self, request, group_id, pk):
        group, expense, err = self.get_expense_or_403(group_id, pk, request.user)
        if err:
            return err
        is_creator = expense.created_by == request.user
        is_admin = group.created_by == request.user
        if not (is_creator or is_admin):
            return Response({'detail': 'Only expense creator or group admin can delete.'}, status=403)
        expense.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
