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
            name='Settlement',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('notes', models.TextField(blank=True, default='')),
                ('date', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='settlements', to='groups.group')),
                ('paid_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='settlements_paid', to='users.user')),
                ('paid_to', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='settlements_received', to='users.user')),
            ],
            options={'db_table': 'settlements', 'ordering': ['-date', '-created_at']},
        ),
    ]
