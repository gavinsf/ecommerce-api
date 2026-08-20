import app.services.cart as cart_service
from app.schemas.cart import CartItemAdd, CartItemUpdate
from app.models import Product, User
from fastapi import HTTPException
import pytest
import uuid


async def make_user(db, email="cart_service_user@example.com") -> User:
    user = User(email=email, hash="hashed-password")
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def make_product(db, name="Widget", is_deleted=0) -> Product:
    product = Product(name=name, cost_price=1.0, sell_price=2.0, is_deleted=is_deleted)
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@pytest.mark.asyncio
async def test_add_item_to_cart_creates_new_item(db_session):
    user = await make_user(db_session)
    product = await make_product(db_session)

    prod, item = await cart_service.add_item_to_cart(
        db_session, user.id, CartItemAdd(product_id=product.id, quantity=2)
    )

    assert prod.id == product.id
    assert item.quantity == 2


@pytest.mark.asyncio
async def test_add_item_to_cart_increments_existing_item(db_session):
    user = await make_user(db_session)
    product = await make_product(db_session)

    await cart_service.add_item_to_cart(
        db_session, user.id, CartItemAdd(product_id=product.id, quantity=2)
    )
    _, item = await cart_service.add_item_to_cart(
        db_session, user.id, CartItemAdd(product_id=product.id, quantity=3)
    )

    assert item.quantity == 5


@pytest.mark.asyncio
async def test_add_item_to_cart_raises_404_when_product_missing(db_session):
    user = await make_user(db_session)

    with pytest.raises(HTTPException) as exc_info:
        await cart_service.add_item_to_cart(
            db_session, user.id, CartItemAdd(product_id=uuid.uuid4(), quantity=1)
        )

    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_add_item_to_cart_raises_403_when_product_deleted(db_session):
    user = await make_user(db_session)
    product = await make_product(db_session, is_deleted=1)

    with pytest.raises(HTTPException) as exc_info:
        await cart_service.add_item_to_cart(
            db_session, user.id, CartItemAdd(product_id=product.id, quantity=1)
        )

    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_get_cart_details_returns_items_and_total(db_session):
    user = await make_user(db_session)
    product = await make_product(db_session)

    await cart_service.add_item_to_cart(
        db_session, user.id, CartItemAdd(product_id=product.id, quantity=3)
    )

    cart = await cart_service.get_cart_details(db_session, user.id)

    assert len(cart.items) == 1
    assert cart.items[0].line_total == 6.0
    assert cart.total == 6.0


@pytest.mark.asyncio
async def test_get_cart_details_empty_cart(db_session):
    user = await make_user(db_session)

    cart = await cart_service.get_cart_details(db_session, user.id)

    assert cart.items == []
    assert cart.total == 0


@pytest.mark.asyncio
async def test_delete_item_from_cart_removes_item(db_session):
    user = await make_user(db_session)
    product = await make_product(db_session)

    await cart_service.add_item_to_cart(
        db_session, user.id, CartItemAdd(product_id=product.id, quantity=1)
    )

    await cart_service.delete_item_from_cart(db_session, user.id, product.id)

    cart = await cart_service.get_cart_details(db_session, user.id)
    assert cart.items == []


@pytest.mark.asyncio
async def test_delete_item_from_cart_raises_404_when_missing(db_session):
    user = await make_user(db_session)

    with pytest.raises(HTTPException) as exc_info:
        await cart_service.delete_item_from_cart(db_session, user.id, uuid.uuid4())

    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_update_item_from_cart_updates_quantity(db_session):
    user = await make_user(db_session)
    product = await make_product(db_session)

    await cart_service.add_item_to_cart(
        db_session, user.id, CartItemAdd(product_id=product.id, quantity=1)
    )

    prod, item = await cart_service.update_item_from_cart(
        db_session, user.id, product.id, CartItemUpdate(quantity=7)
    )

    assert item.quantity == 7
    assert prod.id == product.id


@pytest.mark.asyncio
async def test_update_item_from_cart_raises_404_when_missing(db_session):
    user = await make_user(db_session)

    with pytest.raises(HTTPException) as exc_info:
        await cart_service.update_item_from_cart(
            db_session, user.id, uuid.uuid4(), CartItemUpdate(quantity=1)
        )

    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_clear_cart_removes_all_items(db_session):
    user = await make_user(db_session)
    product_a = await make_product(db_session, name="A")
    product_b = await make_product(db_session, name="B")

    await cart_service.add_item_to_cart(
        db_session, user.id, CartItemAdd(product_id=product_a.id, quantity=1)
    )
    await cart_service.add_item_to_cart(
        db_session, user.id, CartItemAdd(product_id=product_b.id, quantity=1)
    )

    await cart_service.clear_cart(db_session, user.id)

    cart = await cart_service.get_cart_details(db_session, user.id)
    assert cart.items == []


@pytest.mark.asyncio
async def test_clear_cart_raises_404_when_already_empty(db_session):
    user = await make_user(db_session)

    with pytest.raises(HTTPException) as exc_info:
        await cart_service.clear_cart(db_session, user.id)

    assert exc_info.value.status_code == 404
