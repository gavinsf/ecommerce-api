import app.repositories.cart as cart_repo
from app.models import CartItem, Product, User
import pytest


async def make_user(db, email="cart_user@example.com") -> User:
    user = User(email=email, hash="hashed-password")
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def make_product(db, name="Widget", stock=10) -> Product:
    product = Product(name=name, cost_price=1.0, sell_price=2.0, stock=stock)
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@pytest.mark.asyncio
async def test_create_cart_item_and_commit_refresh(db_session):
    user = await make_user(db_session)
    product = await make_product(db_session)

    item = await cart_repo.create_cart_item(db_session, user.id, product.id, 3)
    await cart_repo.commit_refresh(db_session, item)

    assert item.id is not None
    assert item.user_id == user.id
    assert item.product_id == product.id
    assert item.quantity == 3


@pytest.mark.asyncio
async def test_get_cart_item_found_and_not_found(db_session):
    user = await make_user(db_session)
    product = await make_product(db_session)

    item = await cart_repo.create_cart_item(db_session, user.id, product.id, 1)
    await cart_repo.commit_refresh(db_session, item)

    found = await cart_repo.get_cart_item(db_session, user.id, product.id)
    assert found is not None
    assert found.id == item.id

    other_product = await make_product(db_session, name="Other")
    missing = await cart_repo.get_cart_item(db_session, user.id, other_product.id)
    assert missing is None


@pytest.mark.asyncio
async def test_get_product_by_id_found_and_not_found(db_session):
    product = await make_product(db_session)

    found = await cart_repo.get_product_by_id(db_session, product.id)
    assert found is not None
    assert found.id == product.id

    import uuid
    missing = await cart_repo.get_product_by_id(db_session, uuid.uuid4())
    assert missing is None


@pytest.mark.asyncio
async def test_get_user_cart_joins_products(db_session):
    user = await make_user(db_session)
    product_a = await make_product(db_session, name="A")
    product_b = await make_product(db_session, name="B")

    item_a = await cart_repo.create_cart_item(db_session, user.id, product_a.id, 2)
    item_b = await cart_repo.create_cart_item(db_session, user.id, product_b.id, 5)
    await cart_repo.commit_refresh(db_session, item_a)
    await cart_repo.commit_refresh(db_session, item_b)

    rows = await cart_repo.get_user_cart(db_session, user.id)

    assert len(rows) == 2
    names = {prod.name for _, prod in rows}
    assert names == {"A", "B"}


@pytest.mark.asyncio
async def test_get_user_cart_empty_for_new_user(db_session):
    user = await make_user(db_session)

    rows = await cart_repo.get_user_cart(db_session, user.id)

    assert rows == []


@pytest.mark.asyncio
async def test_delete_commit_removes_item(db_session):
    user = await make_user(db_session)
    product = await make_product(db_session)

    item = await cart_repo.create_cart_item(db_session, user.id, product.id, 1)
    await cart_repo.commit_refresh(db_session, item)

    await cart_repo.delete_commit(db_session, item)

    found = await cart_repo.get_cart_item(db_session, user.id, product.id)
    assert found is None


@pytest.mark.asyncio
async def test_commit_persists_pending_changes(db_session):
    user = await make_user(db_session)
    product = await make_product(db_session)

    item = await cart_repo.create_cart_item(db_session, user.id, product.id, 1)
    await cart_repo.commit_refresh(db_session, item)

    item.quantity = 9
    await cart_repo.commit(db_session)

    found = await cart_repo.get_cart_item(db_session, user.id, product.id)
    assert found.quantity == 9


@pytest.mark.asyncio
async def test_delete_list_removes_all_rows(db_session):
    user = await make_user(db_session)
    product_a = await make_product(db_session, name="A")
    product_b = await make_product(db_session, name="B")

    item_a = await cart_repo.create_cart_item(db_session, user.id, product_a.id, 1)
    item_b = await cart_repo.create_cart_item(db_session, user.id, product_b.id, 1)
    await cart_repo.commit_refresh(db_session, item_a)
    await cart_repo.commit_refresh(db_session, item_b)

    rows = await cart_repo.get_user_cart(db_session, user.id)
    await cart_repo.delete_list(db_session, rows)

    remaining = await cart_repo.get_user_cart(db_session, user.id)
    assert remaining == []
