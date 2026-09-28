from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.security import create_access_token, require_admin, verify_credentials

router = APIRouter()


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=200)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest) -> TokenResponse:
    if not verify_credentials(data.username, data.password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuário ou senha inválidos")
    return TokenResponse(access_token=create_access_token(data.username), username=data.username)


@router.get("/me")
async def me(username: Annotated[str, Depends(require_admin)]) -> dict[str, str]:
    return {"username": username}
