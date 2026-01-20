# backend/schemas.py
from pydantic import BaseModel, EmailStr
import uuid

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str

# Properties to return to client
class User(UserBase):
    id: uuid.UUID

    class Config:
        orm_mode = True

# Properties stored in DB
class UserInDB(UserBase):
    hashed_password: str
