from django.db import migrations, models
import uuid
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ('users', '0001_initial'),
        ('groups', '0001_initial'),
    ]
    operations = [
        migrations.CreateModel(
            name='Expense',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('split_type', models.CharField(choices=[('equal', 'Equal'), ('unequal', 'Unequal'), ('percentage', 'Percentage'), ('share', 'Share')], max_length=20)),
                ('notes', models.TextField(blank=True, default='')),
                ('date', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='expenses', to='groups.group')),
                ('paid_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='paid_expenses', to='users.user')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_expenses', to='users.user')),
            ],
            options={'db_table': 'expenses', 'ordering': ['-date', '-created_at']},
        ),
        migrations.CreateModel(
            name='ExpenseSplit',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('owed_amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('share_value', models.DecimalField(blank=True, decimal_places=4, max_digits=12, null=True)),
                ('expense', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='splits', to='expenses.expense')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='expense_splits', to='users.user')),
            ],
            options={'db_table': 'expense_splits', 'unique_together': {('expense', 'user')}},
        ),
    ]
