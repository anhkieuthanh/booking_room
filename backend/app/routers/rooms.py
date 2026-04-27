from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Room, User
from ..schemas import RoomCreate, RoomOut, RoomUpdate
from ..security import get_current_admin

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


@router.get("", response_model=list[RoomOut])
def list_rooms(
    db: Annotated[Session, Depends(get_db)],
    include_inactive: bool = Query(False),
    min_capacity: Optional[int] = Query(None, ge=1),
) -> list[RoomOut]:
    q = db.query(Room)
    if not include_inactive:
        q = q.filter(Room.is_active.is_(True))
    if min_capacity is not None:
        q = q.filter(Room.capacity >= min_capacity)
    rooms = q.order_by(Room.name.asc()).all()
    return [RoomOut.model_validate(r) for r in rooms]


@router.get("/{room_id}", response_model=RoomOut)
def get_room(room_id: int, db: Annotated[Session, Depends(get_db)]) -> RoomOut:
    room = db.get(Room, room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng")
    return RoomOut.model_validate(room)


@router.post("", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
def create_room(
    payload: RoomCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_admin)],
) -> RoomOut:
    if db.query(Room).filter(Room.name == payload.name).first():
        raise HTTPException(status_code=400, detail="Tên phòng đã tồn tại")
    room = Room(**payload.model_dump())
    db.add(room)
    db.commit()
    db.refresh(room)
    return RoomOut.model_validate(room)


@router.patch("/{room_id}", response_model=RoomOut)
def update_room(
    room_id: int,
    payload: RoomUpdate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_admin)],
) -> RoomOut:
    room = db.get(Room, room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng")
    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"] != room.name:
        if db.query(Room).filter(Room.name == data["name"]).first():
            raise HTTPException(status_code=400, detail="Tên phòng đã tồn tại")
    for k, v in data.items():
        setattr(room, k, v)
    db.commit()
    db.refresh(room)
    return RoomOut.model_validate(room)


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(
    room_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_admin)],
) -> None:
    room = db.get(Room, room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng")
    db.delete(room)
    db.commit()
