# backend/clerk_auth_service.py
from fastapi import HTTPException, status
from typing import Dict

# This is a mock service. In a real application, you would
# use Clerk's SDK to verify the token and get user information.
async def verify_clerk_token(clerk_token: str) -> Dict:
    """
    Mocks the verification of a Clerk token.
    In a real app, this would call Clerk's API or SDK.
    """
    if clerk_token == "mock_clerk_valid_token":
        # Check if the test is patching the return value (as seen in test_main.py)
        # If not, provide a generic mock.
        return {
            "id": "user_mock_clerk_id",
            "email": "clerkuser@example.com",
            "full_name": "Clerk Test User"
        }
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid Clerk token",
        headers={"WWW-Authenticate": "Bearer"},
    )
