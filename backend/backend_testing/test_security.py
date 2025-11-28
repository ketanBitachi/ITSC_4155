# tests/test_security.py

import pytest
from fastapi import HTTPException

from app.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_token,
)


def test_password_hashing_and_verification_roundtrip():
    """Verify that hashing + verification works and rejects wrong passwords."""
    pw = "securepass"
    hashed = get_password_hash(pw)
    assert hashed != pw  # never store plain text
    assert verify_password(pw, hashed)
    assert not verify_password("wrong", hashed)


def test_jwt_creation_and_decoding_success():
    """A token created by create_access_token must decode back correctly."""
    token = create_access_token({"sub": "test@example.com"})
    payload = decode_token(token)
    assert payload["sub"] == "test@example.com"


def test_decode_invalid_token_raises_http_exception():
    """Decoding a nonsense token should raise HTTPException."""
    with pytest.raises(HTTPException):
        decode_token("this.is.not.a.valid.jwt")
