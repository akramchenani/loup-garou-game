from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, PlayerViewSet, GameLogViewSet

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'players', PlayerViewSet, basename='player')
router.register(r'logs', GameLogViewSet, basename='gamelog')

urlpatterns = [
    path('', include(router.urls)),
]
