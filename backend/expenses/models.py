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
    original_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default='INR')
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=4, default=1.0)
    amount = models.DecimalField(max_digits=12, decimal_places=2)  # Stored converted INR amount
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


class ImportJob(models.Model):
    STATUS_CHOICES = [
        ('pending_review', 'Pending Review'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='import_jobs')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_imports')
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_review')

    class Meta:
        db_table = 'import_jobs'
        ordering = ['-created_at']

    def __str__(self):
        return f'Import for {self.group.name} by {self.uploaded_by.name} ({self.status})'


class ImportIssue(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    import_job = models.ForeignKey(ImportJob, on_delete=models.CASCADE, related_name='issues')
    row_number = models.IntegerField()
    row_data = models.JSONField()  # raw row data as key-value pairs
    issue_type = models.CharField(max_length=50)  # duplicate, currency_conversion, negative_amount, missing_data, etc.
    severity = models.CharField(max_length=20)  # critical, warning, info
    description = models.TextField()
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # for duplicate detection
    resolution_selected = models.CharField(max_length=50, null=True, blank=True)  # e.g., 'refund', 'settlement', 'ignore'
    resolution_details = models.JSONField(null=True, blank=True)  # e.g., mapping target user or specific conversion rate
    approved = models.BooleanField(default=False)

    class Meta:
        db_table = 'import_issues'
        ordering = ['row_number']

    def __str__(self):
        return f'Issue in Row {self.row_number} - {self.issue_type} ({self.severity})'
