from sqlalchemy.orm import Session

from .config import settings
from .models import Room, User
from .security import hash_password


SEED_ROOMS = [
    {
        "name": "Aurora",
        "location": "Floor 5, North Wing",
        "capacity": 8,
        "description": "Bright corner room with floor-to-ceiling windows. Great for design reviews.",
        "amenities": "TV,Whiteboard,Video conferencing,HDMI",
        "image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "Borealis",
        "location": "Floor 3, East Wing",
        "capacity": 4,
        "description": "Cozy huddle space for quick syncs and 1:1s.",
        "amenities": "TV,Whiteboard,HDMI",
        "image_url": "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "Cascade",
        "location": "Floor 2, West Wing",
        "capacity": 12,
        "description": "Large boardroom with conference phone and projector.",
        "amenities": "Projector,Conference phone,Whiteboard,Video conferencing",
        "image_url": "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "Drift",
        "location": "Floor 1, Lobby",
        "capacity": 6,
        "description": "Standing-height meeting room near the cafe.",
        "amenities": "TV,Whiteboard",
        "image_url": "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "Echo",
        "location": "Floor 4, South Wing",
        "capacity": 20,
        "description": "All-hands room with stage and PA system.",
        "amenities": "Projector,PA system,Stage,Video conferencing",
        "image_url": "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80",
    },
]


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
            name="Demo User",
            hashed_password=hash_password("user123"),
            is_admin=False,
        )
        db.add(demo)

    if db.query(Room).count() == 0:
        for r in SEED_ROOMS:
            db.add(Room(**r))

    db.commit()
