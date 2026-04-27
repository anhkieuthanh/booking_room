from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, joinedload

from ..db import get_db
from ..models import Booking, Room, User
from ..schemas import BookingCreate, BookingDetail, BookingOut
from ..security import get_current_user

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


def _validate_window(start: datetime, end: datetime) -> None:
    if end <= start:
        raise HTTPException(status_code=400, detail="Thời gian kết thúc phải sau thời gian bắt đầu")
    if (end - start).total_seconds() > 24 * 3600:
        raise HTTPException(status_code=400, detail="Lịch đặt không được vượt quá 24 giờ")


def _has_conflict(
    db: Session, room_id: int, start: datetime, end: datetime, exclude_id: Optional[int] = None
) -> bool:
    q = db.query(Booking).filter(
        Booking.room_id == room_id,
        Booking.start_time < end,
        Booking.end_time > start,
    )
    if exclude_id is not None:
        q = q.filter(Booking.id != exclude_id)
    return db.query(q.exists()).scalar()


@router.get("", response_model=list[BookingDetail])
def list_bookings(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    room_id: Optional[int] = Query(None),
    mine: bool = Query(False),
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
) -> list[BookingDetail]:
    q = db.query(Booking).options(joinedload(Booking.room), joinedload(Booking.user))
    if room_id is not None:
        q = q.filter(Booking.room_id == room_id)
    if mine:
        q = q.filter(Booking.user_id == current_user.id)
    if start is not None and end is not None:
        q = q.filter(and_(Booking.start_time < end, Booking.end_time > start))
    elif start is not None:
        q = q.filter(Booking.end_time > start)
    elif end is not None:
        q = q.filter(Booking.start_time < end)
    bookings = q.order_by(Booking.start_time.asc()).all()
    return [BookingDetail.model_validate(b) for b in bookings]


@router.post("", response_model=BookingDetail, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> BookingDetail:
    _validate_window(payload.start_time, payload.end_time)
    room = db.get(Room, payload.room_id)
    if room is None or not room.is_active:
        raise HTTPException(status_code=404, detail="Phòng không tồn tại hoặc đã ngừng hoạt động")
    if _has_conflict(db, payload.room_id, payload.start_time, payload.end_time):
        raise HTTPException(status_code=409, detail="Khung giờ này đã có lịch đặt khác")

    booking = Booking(
        room_id=payload.room_id,
        user_id=current_user.id,
        title=payload.title,
        notes=payload.notes,
        start_time=payload.start_time,
        end_time=payload.end_time,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.room), joinedload(Booking.user))
        .filter(Booking.id == booking.id)
        .one()
    )
    return BookingDetail.model_validate(booking)


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_booking(
    booking_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch đặt")
    if booking.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Bạn chỉ có thể huỷ lịch đặt của chính mình")
    db.delete(booking)
    db.commit()
