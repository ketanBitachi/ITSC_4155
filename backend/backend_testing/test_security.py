from app.security import get_password_hash, verify_password, create_access_token, decode_token

def test_password_hashing_and_verification():
    pw = "securepass"
    hashed = get_password_hash(pw)
    assert verify_password(pw, hashed)
    assert not verify_password("wrong", hashed)

def test_jwt_creation_and_decoding():
    token = create_access_token({"sub": "test@example.com"})
    payload = decode_token(token)
    assert payload["sub"] == "test@example.com"
