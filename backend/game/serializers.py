from rest_framework import serializers
from .models import Room, Player, GameState, Action, Vote, GameLog

class PlayerSerializer(serializers.ModelSerializer):
    remaining_time = serializers.SerializerMethodField()
    
    class Meta:
        model = Player
        fields = ['id', 'nickname', 'is_alive', 'is_leader', 'joined_at', 
                  'remaining_time', 'token']
        read_only_fields = ['id', 'joined_at', 'token']
    
    def get_remaining_time(self, obj):
        return obj.total_speaking_time - obj.speaking_time_used

class PlayerDetailSerializer(PlayerSerializer):
    """Includes private role information"""
    class Meta(PlayerSerializer.Meta):
        fields = PlayerSerializer.Meta.fields + ['role']

class RoomSerializer(serializers.ModelSerializer):
    players = PlayerSerializer(many=True, read_only=True)
    player_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Room
        fields = ['id', 'code', 'max_players', 'status', 'created_at', 
                  'players', 'player_count', 'num_wolves', 'num_seers', 
                  'num_protectors', 'num_hunters']
        read_only_fields = ['id', 'code', 'created_at']
    
    def get_player_count(self, obj):
        return obj.players.count()

class RoomCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['max_players', 'num_wolves', 'num_seers', 'num_protectors', 'num_hunters']

class GameStateSerializer(serializers.ModelSerializer):
    time_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = GameState
        fields = ['phase', 'night_number', 'day_number', 'timer_end', 
                  'current_speaker_id', 'speaking_order', 'time_remaining',
                  'wolves_voted', 'seer_acted', 'protector_acted']
    
    def get_time_remaining(self, obj):
        if obj.timer_end:
            from django.utils import timezone
            remaining = (obj.timer_end - timezone.now()).total_seconds()
            return max(0, int(remaining))
        return None

class ActionSerializer(serializers.ModelSerializer):
    player_nickname = serializers.CharField(source='player.nickname', read_only=True)
    target_nickname = serializers.CharField(source='target.nickname', read_only=True)
    
    class Meta:
        model = Action
        fields = ['id', 'player', 'player_nickname', 'action_type', 'target', 
                  'target_nickname', 'night_number', 'timestamp', 'result_data']
        read_only_fields = ['id', 'timestamp']

class VoteSerializer(serializers.ModelSerializer):
    player_nickname = serializers.CharField(source='player.nickname', read_only=True)
    target_nickname = serializers.CharField(source='target.nickname', read_only=True)
    
    class Meta:
        model = Vote
        fields = ['id', 'player', 'player_nickname', 'target', 'target_nickname', 
                  'vote_type', 'vote_phase', 'timestamp']
        read_only_fields = ['id', 'timestamp']

class GameLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameLog
        fields = ['id', 'phase', 'message', 'timestamp', 'metadata']
        read_only_fields = ['id', 'timestamp']

class JoinRoomSerializer(serializers.Serializer):
    nickname = serializers.CharField(max_length=50)
    
class NightActionSerializer(serializers.Serializer):
    target_id = serializers.IntegerField()
    
class VoteSubmitSerializer(serializers.Serializer):
    target_id = serializers.IntegerField()

class LeaderElectionSerializer(serializers.Serializer):
    candidate_id = serializers.IntegerField()

class SpeakingControlSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['start', 'pass'])
