import uuid
from django.db import models
from django.utils import timezone
from users.models import User


class Group(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_groups')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'groups'

    def __str__(self):
        return self.name


class GroupMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='group_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'group_members'
        unique_together = ('group', 'user')

    def __str__(self):
        return f'{self.user.name} in {self.group.name}'


class MembershipHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(GroupMember, on_delete=models.CASCADE, related_name='history')
    joined_date = models.DateField(default=timezone.now)
    left_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'membership_history'
        ordering = ['joined_date']

    def __str__(self):
        left_str = f"to {self.left_date}" if self.left_date else "present"
        return f'{self.member.user.name} active from {self.joined_date} {left_str}'

