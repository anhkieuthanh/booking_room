from sqlalchemy.orm import Session

from .config import settings
from .models import Room, User
from .security import hash_password


SEED_ROOMS = [
    {
        "name": "Aurora",
        "location": "Tầng 5, Cánh Bắc",
        "capacity": 8,
        "description": "Phòng góc sáng với cửa kính từ trần tới sàn. Phù hợp cho buổi rà soát thiết kế.",
        "amenities": "TV,Bảng trắng,Hội nghị truyền hình,HDMI",
        "image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "Borealis",
        "location": "Tầng 3, Cánh Đông",
        "capacity": 4,
        "description": "Không gian ấm cúng cho các buổi họp nhanh và 1:1.",
        "amenities": "TV,Bảng trắng,HDMI",
        "image_url": "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "Cascade",
        "location": "Tầng 2, Cánh Tây",
        "capacity": 12,
        "description": "Phòng họp lớn có điện thoại hội nghị và máy chiếu.",
        "amenities": "Máy chiếu,Điện thoại hội nghị,Bảng trắng,Hội nghị truyền hình",
        "image_url": "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "Drift",
        "location": "Tầng 1, Sảnh chính",
        "capacity": 6,
        "description": "Phòng họp đứng gần khu cafe, thuận tiện cho các cuộc trao đổi nhanh.",
        "amenities": "TV,Bảng trắng",
        "image_url": "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "Echo",
        "location": "Tầng 4, Cánh Nam",
        "capacity": 20,
        "description": "Phòng họp toàn công ty với sân khấu và hệ thống loa.",
        "amenities": "Máy chiếu,Hệ thống loa,Sân khấu,Hội nghị truyền hình",
        "image_url": "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80",
    },
]


# Fields managed by the seed. Existing rows with a matching name will be
# updated to the values above on every startup so localized copy/imagery stays
# in sync with the codebase. User-created rooms (not in SEED_ROOMS) are left
# alone.
_MANAGED_FIELDS = ("location", "description", "amenities", "image_url")


def seed_initial_data(db: Session) -> None:
    if db.query(User).count() == 0:
        admin = User(
            email=settings.seed_admin_email,
            name=settings.seed_admin_name,
            hashed_password=hash_password(settings.seed_admin_password),
            is_admin=True,
        )
        db.add(admin)
        demo = User(
            email="user@example.com",
            name="Nhân viên Demo",
            hashed_password=hash_password("user123"),
            is_admin=False,
        )
        db.add(demo)

    existing_rooms = {r.name: r for r in db.query(Room).all()}
    for r in SEED_ROOMS:
        if r["name"] not in existing_rooms:
            db.add(Room(**r))
        else:
            room = existing_rooms[r["name"]]
            for field in _MANAGED_FIELDS:
                setattr(room, field, r[field])

    db.commit()
