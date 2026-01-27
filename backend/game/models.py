from django.db import models
from django.utils import timezone
import random
import string

def generate_room_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

class Room(models.Model):
    STATUS_CHOICES = [
        ('waiting', 'Waiting'),
        ('playing', 'Playing'),
        ('finished', 'Finished'),
    ]
    
    code = models.CharField(max_length=6, unique=True, default=generate_room_code)
    admin_token = models.CharField(max_length=32, unique=True)
    max_players = models.IntegerField(default=8)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Role configuration
    num_wolves = models.IntegerField(default=2)
    num_seers = models.IntegerField(default=1)
    num_protectors = models.IntegerField(default=1)
    num_hunters = models.IntegerField(default=1)
    
    def __str__(self):
        return f"Room {self.code}"
    
    class Meta:
        ordering = ['-created_at']

class Player(models.Model):
    ROLE_CHOICES = [
        ('wolf', 'Wolf'),
        ('citizen', 'Citizen'),
        ('seer', 'Agisienne (Seer)'),
        ('protector', 'Protector'),
        ('hunter', 'Sayad (Hunter)'),
    ]
    
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='players')
    nickname = models.CharField(max_length=50)
    token = models.CharField(max_length=32, unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, null=True, blank=True)
    is_alive = models.BooleanField(default=True)
    is_leader = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    # Speaking time tracking
    total_speaking_time = models.IntegerField(default=120)  # 2 minutes default
    speaking_time_used = models.IntegerField(default=0)
    
    # Protector constraint
    last_protected_player_id = models.IntegerField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.nickname} in {self.room.code}"
    
    class Meta:
        ordering = ['joined_at']
        unique_together = ['room', 'nickname']

class GameState(models.Model):
    PHASE_CHOICES = [
        ('setup', 'Setup'),
        ('night', 'Night'),
        ('day', 'Day'),
        ('leader_election', 'Leader Election'),
        ('voting', 'Voting'),
        ('finished', 'Finished'),
    ]
    
    room = models.OneToOneField(Room, on_delete=models.CASCADE, related_name='game_state')
    phase = models.CharField(max_length=20, choices=PHASE_CHOICES, default='setup')
    night_number = models.IntegerField(default=0)
    day_number = models.IntegerField(default=0)
    timer_end = models.DateTimeField(null=True, blank=True)
    
    # Current speaking player
    current_speaker_id = models.IntegerField(null=True, blank=True)
    speaking_order = models.JSONField(default=list)  # List of player IDs
    
    # Night action tracking
    wolves_voted = models.BooleanField(default=False)
    seer_acted = models.BooleanField(default=False)
    protector_acted = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Game State for {self.room.code} - {self.phase}"

class Action(models.Model):
    ACTION_TYPE_CHOICES = [
        ('wolf_vote', 'Wolf Vote'),
        ('seer_inspect', 'Seer Inspect'),
        ('protector_protect', 'Protector Protect'),
        ('hunter_kill', 'Hunter Kill'),
    ]
    
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='actions')
    action_type = models.CharField(max_length=20, choices=ACTION_TYPE_CHOICES)
    target = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='targeted_by', null=True, blank=True)
    night_number = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # For storing additional data (like seer results)
    result_data = models.JSONField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.player.nickname} - {self.action_type} - Night {self.night_number}"
    
    class Meta:
        ordering = ['-timestamp']

class Vote(models.Model):
    VOTE_TYPE_CHOICES = [
        ('leader', 'Leader Election'),
        ('elimination', 'Elimination Vote'),
    ]
    
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='votes_cast')
    target = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='votes_received')
    vote_type = models.CharField(max_length=20, choices=VOTE_TYPE_CHOICES)
    vote_phase = models.IntegerField()  # day_number for elimination, unique identifier for leader
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.player.nickname} votes for {self.target.nickname}"
    
    class Meta:
        unique_together = ['player', 'vote_type', 'vote_phase']
        ordering = ['-timestamp']

class GameLog(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='logs')
    phase = models.CharField(max_length=20)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.room.code} - {self.phase} - {self.timestamp}"
    
    class Meta:
        ordering = ['timestamp']
