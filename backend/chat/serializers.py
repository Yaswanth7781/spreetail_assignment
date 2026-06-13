from rest_framework import serializers
from .models import Message
from users.serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'expense', 'sender', 'content', 'created_at']
        read_only_fields = ['id', 'expense', 'sender', 'created_at']
