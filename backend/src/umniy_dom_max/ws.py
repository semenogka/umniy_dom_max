from collections import defaultdict

from fastapi import WebSocket


def house_room(house_id: int) -> str:
    return f"house:{house_id}"


def appeal_room(appeal_id: int) -> str:
    return f"appeal:{appeal_id}"


class ConnectionManager:
    """In-memory WebSocket rooms for house / appeal chats."""

    def __init__(self) -> None:
        self._rooms: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, room: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._rooms[room].add(websocket)

    def disconnect(self, room: str, websocket: WebSocket) -> None:
        sockets = self._rooms.get(room)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            self._rooms.pop(room, None)

    async def broadcast(self, room: str, payload: dict) -> None:
        sockets = list(self._rooms.get(room, ()))
        dead: list[WebSocket] = []

        for websocket in sockets:
            try:
                await websocket.send_json(payload)
            except Exception:
                dead.append(websocket)

        for websocket in dead:
            self.disconnect(room, websocket)
