from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
import json

from app.core.database import AsyncSessionLocal
from app.core.redis_client import get_redis
from app.features.auth.jwt import decode_access_token
from app.features.users.models import User
from app.features.courses.service_discussion import check_course_access
from sqlalchemy.orm import joinedload
from sqlalchemy.future import select

router = APIRouter(tags=["Course WebSocket"])

async def get_ws_user(token: str, db: AsyncSession) -> User:
    if not token:
        raise HTTPException(status_code=401, detail="Token missing")
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    result = await db.execute(
        select(User).options(joinedload(User.school)).filter(
            User.id == int(user_id),
            User.is_deleted == False,
        )
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    return user

@router.websocket("/courses/{course_id}/ws")
async def course_websocket_endpoint(
    websocket: WebSocket,
    course_id: int,
    token: str = Query(...)
):
    await websocket.accept()
    
    async with AsyncSessionLocal() as db:
        try:
            user = await get_ws_user(token, db)
            has_access = await check_course_access(db, course_id, user)
            if not has_access:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
        except Exception:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    redis = await get_redis()
    pubsub = redis.pubsub()
    channel_name = f"course_{course_id}"
    await pubsub.subscribe(channel_name)

    async def reader_task():
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = message["data"]
                    if isinstance(data, bytes):
                        data = data.decode('utf-8')
                    await websocket.send_text(data)
        except Exception as e:
            print(f"Redis reader task error: {e}")

    task = asyncio.create_task(reader_task())

    try:
        while True:
            # Keep connection alive and handle client disconnects
            await websocket.receive_text()
    except WebSocketDisconnect:
        task.cancel()
        await pubsub.unsubscribe(channel_name)
    except Exception as e:
        task.cancel()
        await pubsub.unsubscribe(channel_name)
