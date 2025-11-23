from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.support_message import SupportMessage
from ..schemas.support import SupportMessageCreate


router = APIRouter(prefix="/api/support", tags=["support"])
alias_router = APIRouter(prefix="/support", tags=["support"])


def _handle_send_message(payload: SupportMessageCreate, db: Session):
    """Core handler to validate and store support messages."""
    # Additional server-side constraints
    if len(payload.name.strip()) == 0 or len(payload.message.strip()) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fields cannot be empty")
    if len(payload.name) > 100 or len(payload.message) > 5000:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Field length exceeded")
    # Enforce email max length since EmailStr doesn't apply Field(max_length)
    if len(str(payload.email)) > 120:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email too long")

    try:
        msg = SupportMessage(
            name=payload.name.strip(),
            email=str(payload.email).strip(),
            message=payload.message.strip(),
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)

        return {"message": "Message sent successfully!"}
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to store message: {exc}")


@router.post("/send_message")
def send_message(payload: SupportMessageCreate, db: Session = Depends(get_db)):
    """Receive feedback/issue report and store it in DB."""
    return _handle_send_message(payload, db)


@alias_router.post("/send_message")
def send_message_alias(payload: SupportMessageCreate, db: Session = Depends(get_db)):
    """Alias endpoint without /api prefix to match acceptance criteria."""
    return _handle_send_message(payload, db)