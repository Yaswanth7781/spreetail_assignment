from rest_framework import serializers
from .models import Settlement
from users.serializers import UserSerializer


class SettlementSerializer(serializers.ModelSerializer):
    paid_by = UserSerializer(read_only=True)
    paid_to = UserSerializer(read_only=True)

    class Meta:
        model = Settlement
        fields = ['id', 'group', 'paid_by', 'paid_to', 'amount', 'notes', 'date', 'created_at']
        read_only_fields = ['id', 'group', 'created_at']


class SettlementCreateSerializer(serializers.ModelSerializer):
    paid_by_id = serializers.UUIDField()
    paid_to_id = serializers.UUIDField()

    class Meta:
        model = Settlement
        fields = ['paid_by_id', 'paid_to_id', 'amount', 'notes', 'date']
