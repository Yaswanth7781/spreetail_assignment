import uuid
from django.db import models
from users.models import User
from groups.models import Group


class Expense(models.Model):
    SPLIT_TYPES = [
        ('equal', 'Equal'),
        ('unequal', 'Unequal'),
        ('percentage', 'Percentage'),
        ('share', 'Share'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='expenses')
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='paid_expenses')
    split_type = models.CharField(max_length=20, choices=SPLIT_TYPES)
    notes = models.TextField(blank=True, default='')
    date = models.DateField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_expenses')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'expenses'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'{self.title} - ₹{self.amount}'


class ExpenseSplit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='splits')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expense_splits')
    owed_amount = models.DecimalField(max_digits=12, decimal_places=2)
    share_value = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)

    class Meta:
        db_table = 'expense_splits'
        unique_together = ('expense', 'user')

    def __str__(self):
        return f'{self.user.name} owes ₹{self.owed_amount}'
