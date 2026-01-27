import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Room, Player, GameState

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.room_group_name = f'room_{self.room_code}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send current game state
        game_data = await self.get_game_state()
        await self.send(text_data=json.dumps({
            'type': 'initial_state',
            'data': game_data
        }))
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'ping':
            await self.send(text_data=json.dumps({
                'type': 'pong'
            }))
        elif message_type == 'request_state':
            game_data = await self.get_game_state()
            await self.send(text_data=json.dumps({
                'type': 'state_update',
                'data': game_data
            }))
    
    async def game_update(self, event):
        """Handle game update broadcasts"""
        await self.send(text_data=json.dumps({
            'type': 'game_update',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def get_game_state(self):
        """Get current game state"""
        try:
            room = Room.objects.get(code=self.room_code)
            
            players = list(room.players.values(
                'id', 'nickname', 'is_alive', 'is_leader'
            ))
            
            try:
                game_state = room.game_state
                state_data = {
                    'phase': game_state.phase,
                    'night_number': game_state.night_number,
                    'day_number': game_state.day_number,
                    'current_speaker_id': game_state.current_speaker_id,
                    'timer_end': game_state.timer_end.isoformat() if game_state.timer_end else None,
                }
            except GameState.DoesNotExist:
                state_data = None
            
            return {
                'room': {
                    'code': room.code,
                    'status': room.status,
                    'max_players': room.max_players,
                },
                'players': players,
                'game_state': state_data
            }
        except Room.DoesNotExist:
            return {'error': 'Room not found'}
