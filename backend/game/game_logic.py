import random
from django.utils import timezone
from datetime import timedelta
from .models import Player, GameState, Action, Vote, GameLog, Room
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def assign_roles(room):
    """Assign roles to all players in the room"""
    players = list(room.players.all())
    
    if len(players) < room.max_players:
        return False, "Not enough players"
    
    # Create role pool
    roles = ['wolf'] * room.num_wolves
    roles += ['seer'] * room.num_seers
    roles += ['protector'] * room.num_protectors
    roles += ['hunter'] * room.num_hunters
    
    # Fill remaining with citizens
    remaining = len(players) - len(roles)
    if remaining < 0:
        return False, "Too many special roles configured"
    
    roles += ['citizen'] * remaining
    
    # Shuffle and assign
    random.shuffle(roles)
    for player, role in zip(players, roles):
        player.role = role
        player.save()
    
    # Create game state
    GameState.objects.create(room=room, phase='night', night_number=1)
    room.status = 'playing'
    room.save()
    
    log_game_event(room, 'setup', 'Game started - Roles assigned')
    
    return True, "Roles assigned successfully"

def get_wolves(room):
    """Get all alive wolf players"""
    return room.players.filter(role='wolf', is_alive=True)

def get_alive_players(room):
    """Get all alive players"""
    return room.players.filter(is_alive=True)

def check_win_condition(room):
    """Check if game has ended"""
    alive_players = get_alive_players(room)
    wolves = alive_players.filter(role='wolf')
    non_wolves = alive_players.exclude(role='wolf')
    
    wolf_count = wolves.count()
    non_wolf_count = non_wolves.count()
    
    if wolf_count == 0:
        return 'citizens', 'All wolves eliminated'
    elif wolf_count >= non_wolf_count:
        return 'wolves', 'Wolves equal or outnumber citizens'
    
    return None, None

def resolve_night(room):
    """Resolve all night actions"""
    game_state = room.game_state
    night_number = game_state.night_number
    
    # Get wolf votes
    wolf_votes = Action.objects.filter(
        player__room=room,
        action_type='wolf_vote',
        night_number=night_number
    )
    
    # Count votes for wolf target
    from django.db.models import Count
    wolf_target_votes = wolf_votes.values('target').annotate(
        vote_count=Count('target')
    ).order_by('-vote_count')
    
    wolf_target_id = None
    if wolf_target_votes:
        wolf_target_id = wolf_target_votes[0]['target']
    
    # Get protector action
    protector_action = Action.objects.filter(
        player__room=room,
        action_type='protector_protect',
        night_number=night_number
    ).first()
    
    protected_player_id = protector_action.target.id if protector_action else None
    
    # Resolve death
    deaths = []
    if wolf_target_id and wolf_target_id != protected_player_id:
        player = Player.objects.get(id=wolf_target_id)
        player.is_alive = False
        player.save()
        deaths.append(player)
        
        log_game_event(room, 'night', f'{player.nickname} was killed by wolves')
        
        # Check for hunter
        if player.role == 'hunter':
            log_game_event(room, 'night', f'{player.nickname} was a hunter! They can take revenge.')
    
    # Process seer action (just log it, result already stored)
    seer_action = Action.objects.filter(
        player__room=room,
        action_type='seer_inspect',
        night_number=night_number
    ).first()
    
    if seer_action:
        log_game_event(room, 'night', f'The seer inspected a player', 
                      {'seer_id': seer_action.player.id})
    
    return deaths

def advance_to_day(room):
    """Advance game to day phase"""
    game_state = room.game_state
    
    deaths = resolve_night(room)
    
    game_state.phase = 'day'
    game_state.day_number += 1
    game_state.timer_end = timezone.now() + timedelta(minutes=5)
    game_state.wolves_voted = False
    game_state.seer_acted = False
    game_state.protector_acted = False
    game_state.save()
    
    # Check win condition
    winner, reason = check_win_condition(room)
    if winner:
        end_game(room, winner, reason)
        return
    
    broadcast_game_update(room, {
        'type': 'phase_change',
        'phase': 'day',
        'deaths': [{'id': p.id, 'nickname': p.nickname, 'role': p.role} for p in deaths],
        'day_number': game_state.day_number
    })

def advance_to_voting(room):
    """Advance to voting phase"""
    game_state = room.game_state
    game_state.phase = 'voting'
    game_state.timer_end = timezone.now() + timedelta(minutes=2)
    game_state.save()
    
    broadcast_game_update(room, {
        'type': 'phase_change',
        'phase': 'voting',
        'day_number': game_state.day_number
    })

def resolve_vote(room):
    """Resolve elimination vote"""
    game_state = room.game_state
    day_number = game_state.day_number
    
    votes = Vote.objects.filter(
        player__room=room,
        vote_type='elimination',
        vote_phase=day_number
    )
    
    # Count votes (leader votes count as 2)
    from collections import defaultdict
    vote_counts = defaultdict(int)
    
    for vote in votes:
        weight = 2 if vote.player.is_leader else 1
        vote_counts[vote.target.id] += weight
    
    if not vote_counts:
        log_game_event(room, 'voting', 'No votes cast - no elimination')
        advance_to_night(room)
        return
    
    # Get player with most votes
    max_votes = max(vote_counts.values())
    candidates = [pid for pid, count in vote_counts.items() if count == max_votes]
    
    if len(candidates) > 1:
        log_game_event(room, 'voting', 'Tie vote - leader must decide or revote')
        # In a real implementation, handle tie-breaking
        return
    
    eliminated_id = candidates[0]
    eliminated = Player.objects.get(id=eliminated_id)
    eliminated.is_alive = False
    eliminated.save()
    
    log_game_event(room, 'voting', f'{eliminated.nickname} was eliminated by vote')
    
    # Check for hunter
    hunter_revenge = None
    if eliminated.role == 'hunter':
        log_game_event(room, 'voting', f'{eliminated.nickname} was a hunter! They can take revenge.')
        hunter_revenge = eliminated.id
    
    # Check win condition
    winner, reason = check_win_condition(room)
    if winner:
        end_game(room, winner, reason)
        return
    
    broadcast_game_update(room, {
        'type': 'player_eliminated',
        'player': {
            'id': eliminated.id,
            'nickname': eliminated.nickname,
            'role': eliminated.role
        },
        'hunter_revenge': hunter_revenge
    })
    
    # Advance to next night
    advance_to_night(room)

def advance_to_night(room):
    """Advance to night phase"""
    game_state = room.game_state
    game_state.phase = 'night'
    game_state.night_number += 1
    game_state.timer_end = timezone.now() + timedelta(minutes=3)
    game_state.save()
    
    broadcast_game_update(room, {
        'type': 'phase_change',
        'phase': 'night',
        'night_number': game_state.night_number
    })

def end_game(room, winner, reason):
    """End the game"""
    game_state = room.game_state
    game_state.phase = 'finished'
    game_state.timer_end = None
    game_state.save()
    
    room.status = 'finished'
    room.save()
    
    log_game_event(room, 'finished', f'Game ended - {winner} win: {reason}')
    
    broadcast_game_update(room, {
        'type': 'game_ended',
        'winner': winner,
        'reason': reason
    })

def elect_leader(room, player_id):
    """Elect a player as leader"""
    # Remove previous leader
    room.players.filter(is_leader=True).update(is_leader=False)
    
    # Set new leader
    player = Player.objects.get(id=player_id)
    player.is_leader = True
    player.save()
    
    log_game_event(room, 'leader_election', f'{player.nickname} elected as leader')
    
    broadcast_game_update(room, {
        'type': 'leader_elected',
        'leader': {
            'id': player.id,
            'nickname': player.nickname
        }
    })

def log_game_event(room, phase, message, metadata=None):
    """Log a game event"""
    GameLog.objects.create(
        room=room,
        phase=phase,
        message=message,
        metadata=metadata or {}
    )

def broadcast_game_update(room, data):
    """Broadcast update to all players in room"""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'room_{room.code}',
        {
            'type': 'game_update',
            'data': data
        }
    )
