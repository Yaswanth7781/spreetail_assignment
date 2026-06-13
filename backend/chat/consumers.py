import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Message
from .serializers import MessageSerializer
from expenses.models import Expense
from groups.models import GroupMember


class ExpenseChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.expense_id = self.scope['url_route']['kwargs']['expense_id']
        self.room_group_name = f'expense_{self.expense_id}'
        self.user = self.scope.get('user')

        if not self.user:
            await self.close()
            return

        # Check membership
        is_member = await self.check_membership()
        if not is_member:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            content = data.get('content', '').strip()
        except Exception:
            return

        if not content:
            return

        message = await self.save_message(content)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def check_membership(self):
        try:
            expense = Expense.objects.get(pk=self.expense_id)
            return GroupMember.objects.filter(group=expense.group, user=self.user).exists()
        except Expense.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content):
        expense = Expense.objects.get(pk=self.expense_id)
        msg = Message.objects.create(expense=expense, sender=self.user, content=content)
        return {
            'id': str(msg.id),
            'sender': {'id': str(self.user.id), 'name': self.user.name, 'email': self.user.email},
            'content': msg.content,
            'created_at': msg.created_at.isoformat(),
        }
