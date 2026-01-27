from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
import secrets

from .models import Room, Player, GameState, Action, Vote, GameLog
from .serializers import (
    RoomSerializer, RoomCreateSerializer, PlayerSerializer, 
    PlayerDetailSerializer, GameStateSerializer, ActionSerializer,
    VoteSerializer, GameLogSerializer, JoinRoomSerializer,
    NightActionSerializer, VoteSubmitSerializer, LeaderElectionSerializer,
    SpeakingControlSerializer
)
from .game_logic import (
    assign_roles, advance_to_day, advance_to_voting, 
    resolve_vote, elect_leader, broadcast_game_update,
    advance_to_night, log_game_event
)

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    lookup_field = 'code'
    
    def get_serializer_class(self):
        if self.action == 'create':
            return RoomCreateSerializer
        return RoomSerializer
    
    def create(self, request):
        """Create a new game room"""
        serializer = RoomCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Generate admin token
        admin_token = secrets.token_urlsafe(24)
        
        room = serializer.save(admin_token=admin_token)
        
        return Response({
            'room': RoomSerializer(room).data,
            'admin_token': admin_token
        }, status=status.HTTP_201_CREATED)
    
    def retrieve(self, request, code=None):
        """Get room details"""
        room = get_object_or_404(Room, code=code)
        return Response(RoomSerializer(room).data)
    
    @action(detail=True, methods=['post'])
    def join(self, request, code=None):
        """Join a room"""
        room = get_object_or_404(Room, code=code)
        
        if room.status != 'waiting':
            return Response(
                {'error': 'Room is not accepting players'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if room.players.count() >= room.max_players:
            return Response(
                {'error': 'Room is full'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = JoinRoomSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        nickname = serializer.validated_data['nickname']
        
        # Check if nickname exists
        if room.players.filter(nickname=nickname).exists():
            return Response(
                {'error': 'Nickname already taken'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create player
        player_token = secrets.token_urlsafe(24)
        player = Player.objects.create(
            room=room,
            nickname=nickname,
            token=player_token
        )
        
        # Broadcast to room
        broadcast_game_update(room, {
            'type': 'player_joined',
            'player': {
                'id': player.id,
                'nickname': player.nickname
            }
        })
        
        return Response({
            'player': PlayerDetailSerializer(player).data,
            'player_token': player_token
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def start_game(self, request, code=None):
        """Start the game (admin only)"""
        room = get_object_or_404(Room, code=code)
        
        # Verify admin token
        admin_token = request.headers.get('X-Admin-Token')
        if admin_token != room.admin_token:
            return Response(
                {'error': 'Unauthorized'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if room.status != 'waiting':
            return Response(
                {'error': 'Game already started'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if room.players.count() < room.max_players:
            return Response(
                {'error': f'Need {room.max_players} players to start'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success, message = assign_roles(room)
        
        if not success:
            return Response(
                {'error': message},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'message': 'Game started',
            'phase': 'night',
            'night_number': 1
        })
    
    @action(detail=True, methods=['post'])
    def advance_phase(self, request, code=None):
        """Advance to next phase (admin only)"""
        room = get_object_or_404(Room, code=code)
        
        # Verify admin token
        admin_token = request.headers.get('X-Admin-Token')
        if admin_token != room.admin_token:
            return Response(
                {'error': 'Unauthorized'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        game_state = room.game_state
        current_phase = game_state.phase
        
        if current_phase == 'night':
            advance_to_day(room)
            return Response({'message': 'Advanced to day'})
        elif current_phase == 'day':
            advance_to_voting(room)
            return Response({'message': 'Advanced to voting'})
        elif current_phase == 'voting':
            resolve_vote(room)
            return Response({'message': 'Votes resolved'})
        else:
            return Response(
                {'error': 'Cannot advance from current phase'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def state(self, request, code=None):
        """Get current game state"""
        room = get_object_or_404(Room, code=code)
        
        try:
            game_state = room.game_state
            return Response(GameStateSerializer(game_state).data)
        except GameState.DoesNotExist:
            return Response(
                {'error': 'Game not started'},
                status=status.HTTP_404_NOT_FOUND
            )

class PlayerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    
    @action(detail=True, methods=['get'])
    def role(self, request, pk=None):
        """Get player's role (requires player token)"""
        player = get_object_or_404(Player, pk=pk)
        
        player_token = request.headers.get('X-Player-Token')
        if player_token != player.token:
            return Response(
                {'error': 'Unauthorized'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return Response({
            'role': player.role,
            'role_display': player.get_role_display()
        })
    
    @action(detail=True, methods=['post'])
    def night_action(self, request, pk=None):
        """Submit night action"""
        player = get_object_or_404(Player, pk=pk)
        
        # Verify player token
        player_token = request.headers.get('X-Player-Token')
        if player_token != player.token:
            return Response(
                {'error': 'Unauthorized'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not player.is_alive:
            return Response(
                {'error': 'Dead players cannot act'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        game_state = player.room.game_state
        if game_state.phase != 'night':
            return Response(
                {'error': 'Not night phase'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = NightActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        target_id = serializer.validated_data['target_id']
        target = get_object_or_404(Player, id=target_id, room=player.room)
        
        if not target.is_alive:
            return Response(
                {'error': 'Cannot target dead player'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Determine action type based on role
        action_type_map = {
            'wolf': 'wolf_vote',
            'seer': 'seer_inspect',
            'protector': 'protector_protect'
        }
        
        action_type = action_type_map.get(player.role)
        if not action_type:
            return Response(
                {'error': 'Your role has no night action'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Protector cannot protect same player twice
        if player.role == 'protector' and player.last_protected_player_id == target.id:
            return Response(
                {'error': 'Cannot protect same player twice in a row'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update action
        action, created = Action.objects.update_or_create(
            player=player,
            action_type=action_type,
            night_number=game_state.night_number,
            defaults={
                'target': target,
                'result_data': {'target_role': target.role} if player.role == 'seer' else None
            }
        )
        
        # Update protector tracking
        if player.role == 'protector':
            player.last_protected_player_id = target.id
            player.save()
        
        # Update game state flags
        if player.role == 'wolf':
            # Check if all wolves voted
            wolves = player.room.players.filter(role='wolf', is_alive=True)
            wolf_votes = Action.objects.filter(
                player__in=wolves,
                action_type='wolf_vote',
                night_number=game_state.night_number
            ).count()
            
            if wolf_votes == wolves.count():
                game_state.wolves_voted = True
                game_state.save()
        elif player.role == 'seer':
            game_state.seer_acted = True
            game_state.save()
        elif player.role == 'protector':
            game_state.protector_acted = True
            game_state.save()
        
        response_data = {'message': 'Action submitted'}
        if player.role == 'seer':
            response_data['result'] = {
                'target_nickname': target.nickname,
                'target_role': target.role
            }
        
        return Response(response_data)
    
    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        """Submit vote"""
        player = get_object_or_404(Player, pk=pk)
        
        # Verify player token
        player_token = request.headers.get('X-Player-Token')
        if player_token != player.token:
            return Response(
                {'error': 'Unauthorized'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not player.is_alive:
            return Response(
                {'error': 'Dead players cannot vote'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        game_state = player.room.game_state
        
        if game_state.phase not in ['voting', 'leader_election']:
            return Response(
                {'error': 'Not a voting phase'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = VoteSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        target_id = serializer.validated_data['target_id']
        target = get_object_or_404(Player, id=target_id, room=player.room)
        
        if not target.is_alive:
            return Response(
                {'error': 'Cannot vote for dead player'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        vote_type = 'leader' if game_state.phase == 'leader_election' else 'elimination'
        vote_phase = game_state.day_number
        
        # Create or update vote
        vote, created = Vote.objects.update_or_create(
            player=player,
            vote_type=vote_type,
            vote_phase=vote_phase,
            defaults={'target': target}
        )
        
        return Response({
            'message': 'Vote submitted',
            'vote': VoteSerializer(vote).data
        })
    
    @action(detail=True, methods=['post'])
    def hunter_revenge(self, request, pk=None):
        """Hunter's revenge kill"""
        player = get_object_or_404(Player, pk=pk)
        
        # Verify player token
        player_token = request.headers.get('X-Player-Token')
        if player_token != player.token:
            return Response(
                {'error': 'Unauthorized'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if player.role != 'hunter':
            return Response(
                {'error': 'Only hunters can use this action'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if player.is_alive:
            return Response(
                {'error': 'Hunter must be dead to use revenge'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = NightActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        target_id = serializer.validated_data['target_id']
        target = get_object_or_404(Player, id=target_id, room=player.room)
        
        if not target.is_alive:
            return Response(
                {'error': 'Cannot target dead player'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kill target
        target.is_alive = False
        target.save()
        
        log_game_event(
            player.room, 
            'hunter_revenge', 
            f'{player.nickname} took {target.nickname} with them'
        )
        
        broadcast_game_update(player.room, {
            'type': 'hunter_revenge',
            'hunter': player.nickname,
            'victim': {
                'id': target.id,
                'nickname': target.nickname,
                'role': target.role
            }
        })
        
        return Response({'message': 'Hunter revenge executed'})

class GameLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = GameLogSerializer
    
    def get_queryset(self):
        room_code = self.request.query_params.get('room_code')
        if room_code:
            return GameLog.objects.filter(room__code=room_code)
        return GameLog.objects.none()
