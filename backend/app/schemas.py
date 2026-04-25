from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str
    is_admin: bool


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RoomBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    location: str = ""
    capacity: int = Field(ge=1, le=1000, default=4)
    description: str = ""
    amenities: str = ""
    image_url: str = ""
    is_active: bool = True


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    location: Optional[str] = None
    capacity: Optional[int] = Field(default=None, ge=1, le=1000)
    description: Optional[str] = None
    amenities: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class RoomOut(RoomBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class BookingBase(BaseModel):
    room_id: int
    title: str = Field(min_length=1, max_length=255)
    notes: str = ""
    start_time: datetime
    end_time: datetime


class BookingCreate(BookingBase):
    pass


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    room_id: int
    user_id: int
    title: str
    notes: str
    start_time: datetime
    end_time: datetime
    created_at: datetime


class BookingDetail(BookingOut):
    room: RoomOut
    user: UserOut
