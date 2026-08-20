import app.repositories.auth as auth_repo
import pytest


@pytest.mark.asyncio
async def test_add_new_user_persists_user(db_session):
    user = await auth_repo.add_new_user(db_session, "new_user@example.com", "hashed-value")

    assert user.id is not None
    assert user.email == "new_user@example.com"
    assert user.hash == "hashed-value"


@pytest.mark.asyncio
async def test_get_user_by_email_found(db_session):
    await auth_repo.add_new_user(db_session, "lookup@example.com", "hashed-value")

    found = await auth_repo.get_user_by_email(db_session, "lookup@example.com")

    assert found is not None
    assert found.email == "lookup@example.com"


@pytest.mark.asyncio
async def test_get_user_by_email_not_found(db_session):
    found = await auth_repo.get_user_by_email(db_session, "does_not_exist@example.com")

    assert found is None
