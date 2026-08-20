import app.routers.orders as orders_router
from app.models import CartItem, Product, User, Order, OrderItem, OrderStatus
from sqlalchemy import select
import pytest


async def make_user(db, email="orders_user@example.com") -> User:
    user = User(email=email, hash="hashed-password")
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def make_product(db, name="Widget", stock=10, sell_price=2.0) -> Product:
    product = Product(name=name, cost_price=1.0, sell_price=sell_price, stock=stock)
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


async def make_cart_item(db, user, product, quantity) -> CartItem:
    item = CartItem(user_id=user.id, product_id=product.id, quantity=quantity)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@pytest.mark.asyncio
async def test_create_order_persists_order_and_items(db_session):
    user = await make_user(db_session)
    product = await make_product(db_session, sell_price=5.0)
    cart_item = await make_cart_item(db_session, user, product, 3)

    order_id = await orders_router.create_order(
        db_session, user.id, [cart_item], [product], 15.0
    )

    order_res = await db_session.execute(select(Order).where(Order.id == order_id))
    order = order_res.scalars().first()
    assert order is not None
    assert order.user_id == user.id
    assert order.total == 15.0
    assert order.status == OrderStatus.pending

    item_res = await db_session.execute(
        select(OrderItem).where(OrderItem.order_id == order_id)
    )
    order_items = item_res.scalars().all()
    assert len(order_items) == 1
    assert order_items[0].product_id == product.id
    assert order_items[0].quantity == 3
    assert order_items[0].unit_price == 5.0


@pytest.mark.asyncio
async def test_create_order_defaults_to_pending_status(db_session):
    user = await make_user(db_session)
    product = await make_product(db_session)
    cart_item = await make_cart_item(db_session, user, product, 1)

    order_id = await orders_router.create_order(
        db_session, user.id, [cart_item], [product], 2.0
    )

    order_res = await db_session.execute(select(Order).where(Order.id == order_id))
    order = order_res.scalars().first()
    assert order.status == OrderStatus.pending


@pytest.mark.asyncio
async def test_create_order_accepts_explicit_status(db_session):
    user = await make_user(db_session)
    product = await make_product(db_session)
    cart_item = await make_cart_item(db_session, user, product, 1)

    order_id = await orders_router.create_order(
        db_session, user.id, [cart_item], [product], 2.0, status=OrderStatus.paid
    )

    order_res = await db_session.execute(select(Order).where(Order.id == order_id))
    order = order_res.scalars().first()
    assert order.status == OrderStatus.paid


@pytest.mark.asyncio
async def test_reduce_stock_does_not_change_stock_column(db_session):
    """
    reduce_stock sets `prod.quantity`, but Product has no `quantity` column
    (only `stock`). SQLAlchemy silently accepts the attribute assignment
    without persisting it, so this currently never reduces stock. This test
    documents the actual (buggy) behavior; see reported finding for the fix.
    """
    product = await make_product(db_session, stock=10)

    await orders_router.reduce_stock(db_session, product.id, 4)

    await db_session.refresh(product)
    assert product.stock == 10
