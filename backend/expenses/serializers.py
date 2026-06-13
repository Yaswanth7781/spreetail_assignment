from rest_framework import serializers
from .models import Expense, ExpenseSplit
from users.serializers import UserSerializer


class ExpenseSplitSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ExpenseSplit
        fields = ['id', 'user', 'owed_amount', 'share_value']


class ExpenseSerializer(serializers.ModelSerializer):
    paid_by = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    splits = ExpenseSplitSerializer(many=True, read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'group', 'title', 'amount', 'paid_by', 'split_type',
                  'notes', 'date', 'created_by', 'splits', 'created_at']
        read_only_fields = ['id', 'group', 'created_by', 'created_at']


class SplitInputSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    share_value = serializers.DecimalField(max_digits=12, decimal_places=4, required=False, allow_null=True)


class ExpenseCreateSerializer(serializers.ModelSerializer):
    paid_by_id = serializers.UUIDField()
    splits = SplitInputSerializer(many=True)

    class Meta:
        model = Expense
        fields = ['title', 'amount', 'paid_by_id', 'split_type', 'notes', 'date', 'splits']
