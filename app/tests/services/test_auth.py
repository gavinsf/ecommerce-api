import app.services.auth as auth_service
from app.config import settings
from fastapi import HTTPException
from jose import jwt
from datetime import datetime, UTC, timedelta
import pytest
import uuid


def test_hash_pwd_produces_verifiable_hash():
    hashed = auth_service.hash_pwd("supersecret123")

    assert hashed != "supersecret123"
    assert auth_service.verify_pwd("supersecret123", hashed)


def test_verify_pwd_rejects_wrong_password():
    hashed = auth_service.hash_pwd("supersecret123")

    assert not auth_service.verify_pwd("wrongpassword", hashed)


def test_create_access_token_has_expected_claims():
    user_id = uuid.uuid4()
    token = auth_service.create_access_token(user_id, ["user"])

    claims = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    assert claims["sub"] == str(user_id)
    assert claims["groups"] == ["user"]
    assert claims["type"] == "access"


def test_create_refresh_token_has_expected_claims():
    user_id = uuid.uuid4()
    token = auth_service.create_refresh_token(user_id)

    claims = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    assert claims["sub"] == str(user_id)
    assert claims["type"] == "refresh"


def test_decode_token_returns_claims_for_valid_token():
    user_id = uuid.uuid4()
    token = auth_service.create_access_token(user_id, ["admin"])

    claims = auth_service.decode_token(token)

    assert claims["sub"] == str(user_id)
    assert claims["groups"] == ["admin"]


def test_decode_token_raises_401_for_garbage_token():
    with pytest.raises(HTTPException) as exc_info:
        auth_service.decode_token("not-a-real-token")

    assert exc_info.value.status_code == 401


def test_decode_token_raises_401_for_expired_token():
    expired = jwt.encode(
        {
            "sub": str(uuid.uuid4()),
            "groups": ["user"],
            "type": "access",
            "exp": datetime.now(UTC) - timedelta(seconds=10),
        },
        settings.JWT_SECRET,
        algorithm="HS256",
    )

    with pytest.raises(HTTPException) as exc_info:
        auth_service.decode_token(expired)

    assert exc_info.value.status_code == 401
