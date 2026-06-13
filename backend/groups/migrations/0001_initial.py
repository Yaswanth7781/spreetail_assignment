from django.db import migrations, models
import uuid
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ('users', '0001_initial'),
    ]
    operations = [
        migrations.CreateModel(
            name='Group',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, default='')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_groups', to='users.user')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'db_table': 'groups'},
        ),
        migrations.CreateModel(
            name='GroupMember',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='memberships', to='groups.group')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='group_memberships', to='users.user')),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'db_table': 'group_members', 'unique_together': {('group', 'user')}},
        ),
    ]
