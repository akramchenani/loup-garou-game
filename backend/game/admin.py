from django.contrib import admin
from .models import Room, Player, GameState, Action, Vote, GameLog

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['code', 'status', 'max_players', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['code']

@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ['nickname', 'room', 'role', 'is_alive', 'is_leader']
    list_filter = ['role', 'is_alive', 'is_leader']
    search_fields = ['nickname', 'room__code']

@admin.register(GameState)
class GameStateAdmin(admin.ModelAdmin):
    list_display = ['room', 'phase', 'night_number', 'day_number']
    list_filter = ['phase']

@admin.register(Action)
class ActionAdmin(admin.ModelAdmin):
    list_display = ['player', 'action_type', 'target', 'night_number', 'timestamp']
    list_filter = ['action_type', 'night_number']

@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ['player', 'target', 'vote_type', 'vote_phase', 'timestamp']
    list_filter = ['vote_type', 'vote_phase']

@admin.register(GameLog)
class GameLogAdmin(admin.ModelAdmin):
    list_display = ['room', 'phase', 'message', 'timestamp']
    list_filter = ['phase', 'timestamp']
    search_fields = ['message']
