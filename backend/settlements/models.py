import uuid
from django.db import models
from users.models import User
from groups.models import Group


class Settlement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='settlements')
    paid_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='settlements_paid')
    paid_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='settlements_received')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    notes = models.TextField(blank=True, default='')
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'settlements'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'{self.paid_by.name} → {self.paid_to.name}: ₹{self.amount}'
