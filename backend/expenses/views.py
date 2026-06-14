from decimal import Decimal
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

        expense_date = data.get('date', timezone.now().date())

        # Verify paid_by was active on expense date
        gm_payer = GroupMember.objects.filter(group=group, user=paid_by).first()
        if not gm_payer:
            return Response({'detail': 'Payer is not in the group.'}, status=400)
        
        # Check active intervals for payer
        payer_active = False
        for interval in gm_payer.history.filter(joined_date__lte=expense_date):
            if interval.left_date is None or interval.left_date >= expense_date:
                payer_active = True
                break
        if not payer_active:
            # If no intervals exist yet, check if this is the first member without setup
            if not gm_payer.history.exists():
                # Auto-initialize history if missing (e.g. for group creator)
                from groups.models import MembershipHistory
                MembershipHistory.objects.create(member=gm_payer, joined_date=expense_date)
                payer_active = True
            else:
                return Response({'detail': f'Payer {paid_by.name} was not active in the group on {expense_date}.'}, status=400)

        splits_input = [{'user_id': str(s['user_id']), 'share_value': s.get('share_value')} for s in data['splits']]

        # Validate that all split participants were active on expense date
        for s in splits_input:
            u = get_object_or_404(User, pk=s['user_id'])
            gm_user = GroupMember.objects.filter(group=group, user=u).first()
            if not gm_user:
                return Response({'detail': f'Split participant {u.name} is not in the group.'}, status=400)
            
            user_active = False
            for interval in gm_user.history.filter(joined_date__lte=expense_date):
                if interval.left_date is None or interval.left_date >= expense_date:
                    user_active = True
                    break
            if not user_active:
                if not gm_user.history.exists():
                    from groups.models import MembershipHistory
                    MembershipHistory.objects.create(member=gm_user, joined_date=expense_date)
                    user_active = True
                else:
                    return Response({'detail': f'Split participant {u.name} was not active in the group on {expense_date}.'}, status=400)

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
            original_amount=data['amount'],
            currency='INR',
            exchange_rate=Decimal('1.00'),
            amount=data['amount'],
            paid_by=paid_by,
            split_type=split_type,
            notes=data.get('notes', ''),
            date=expense_date,
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


class ImportUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        group = get_object_or_404(Group, pk=group_id)
        if not GroupMember.objects.filter(group=group, user=request.user).exists():
            return Response({'detail': 'Not a member.'}, status=403)

        csv_file = request.FILES.get('file')
        if not csv_file:
            return Response({'detail': 'No file uploaded.'}, status=400)

        # Parse CSV file wrapper
        try:
            file_data = csv_file.read().decode('utf-8-sig').splitlines()
        except Exception as e:
            return Response({'detail': f'Error reading CSV encoding: {str(e)}'}, status=400)

        from .importer import CSVExpenseImporter
        importer = CSVExpenseImporter(group, request.user)
        job = importer.dry_run_parse(file_data)

        # Return issues list
        issues = job.issues.all()
        issues_data = [
            {
                'id': str(iss.id),
                'row_number': iss.row_number,
                'row_data': iss.row_data,
                'issue_type': iss.issue_type,
                'severity': iss.severity,
                'description': iss.description,
                'confidence_score': float(iss.confidence_score) if iss.confidence_score else None,
                'resolution_selected': iss.resolution_selected,
                'resolution_details': iss.resolution_details,
            }
            for iss in issues
        ]

        # Get list of roommate names detected in group or system
        members_qs = group.memberships.select_related('user')
        roommate_names = [m.user.name for m in members_qs]

        return Response({
            'job_id': str(job.id),
            'status': job.status,
            'issues': issues_data,
            'roommates': roommate_names
        })


class ImportCommitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        group = get_object_or_404(Group, pk=group_id)
        if not GroupMember.objects.filter(group=group, user=request.user).exists():
            return Response({'detail': 'Not a member.'}, status=403)

        job_id = request.data.get('job_id')
        resolutions = request.data.get('resolutions', {})  # maps issue_id -> {resolution_selected, resolution_details, row_data_fixed}
        custom_timeline_dates = request.data.get('custom_timeline_dates', {})  # maps name -> {joined_date, left_date}

        if not job_id:
            return Response({'detail': 'Missing job_id.'}, status=400)

        from django.db import transaction
        from .importer import CSVExpenseImporter

        try:
            with transaction.atomic():
                importer = CSVExpenseImporter(group, request.user)
                count = importer.commit_import(job_id, resolutions, custom_timeline_dates)
            return Response({'detail': f'Imported {count} expenses successfully.', 'count': count})
        except Exception as e:
            return Response({'detail': f'Import transaction failed: {str(e)}'}, status=500)

