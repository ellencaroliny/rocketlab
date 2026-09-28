from datetime import UTC, datetime, timedelta
from hmac import compare_digest
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings

ALGORITHM = "HS256"
_bearer = HTTPBearer(auto_error=False)


def verify_credentials(username: str, password: str) -> bool:
    settings = get_settings()
    # Ambas as comparações sempre executam, para não vazar qual campo estava errado.
    user_ok = compare_digest(username.encode(), settings.admin_username.encode())
    pass_ok = compare_digest(password.encode(), settings.admin_password.encode())
    return user_ok and pass_ok


def create_access_token(subject: str) -> str:
    settings = get_settings()
    expires = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({"sub": subject, "exp": expires}, settings.secret_key, algorithm=ALGORITHM)


def require_admin(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> str:
    unauthorized = HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        "Autenticação necessária",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    try:
        payload = jwt.decode(
            credentials.credentials, get_settings().secret_key, algorithms=[ALGORITHM]
        )
    except jwt.PyJWTError:
        raise unauthorized from None
    subject = payload.get("sub")
    if not isinstance(subject, str):
        raise unauthorized
    return subject
