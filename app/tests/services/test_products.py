import app.services.products as prod_service
from app.schemas.products import ProductCreate
from fastapi import HTTPException
import pytest
import uuid


async def make_product(db, name="Widget", is_deleted=0):
    prod = await prod_service.create_product(
        db, ProductCreate(name=name, cost_price=1.0, sell_price=2.0)
    )
    if is_deleted:
        prod.is_deleted = 1
        await db.commit()
    return prod


@pytest.mark.asyncio
async def test_create_product(db_session):
    prod = await make_product(db_session, name="Created")

    assert prod.id is not None
    assert prod.name == "Created"


@pytest.mark.asyncio
async def test_list_products_returns_results(db_session):
    await make_product(db_session, name="A")
    await make_product(db_session, name="B")

    prods = await prod_service.list_products(db_session, 0, 20)

    assert len(prods) == 2


@pytest.mark.asyncio
async def test_list_products_raises_404_when_empty(db_session):
    with pytest.raises(HTTPException) as exc_info:
        await prod_service.list_products(db_session, 0, 20)

    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_search_products_by_name_returns_matches(db_session):
    await make_product(db_session, name="Standard Widget")

    prods = await prod_service.search_products_by_name(db_session, "widget", 0, 20)

    assert len(prods) == 1


@pytest.mark.asyncio
async def test_search_products_by_name_raises_404_when_no_matches(db_session):
    await make_product(db_session, name="Standard Widget")

    with pytest.raises(HTTPException) as exc_info:
        await prod_service.search_products_by_name(db_session, "nonexistent", 0, 20)

    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_get_product_returns_product(db_session):
    prod = await make_product(db_session, name="Found")

    got = await prod_service.get_product(db_session, prod.id)

    assert got.id == prod.id


@pytest.mark.asyncio
async def test_get_product_raises_404_when_missing(db_session):
    with pytest.raises(HTTPException) as exc_info:
        await prod_service.get_product(db_session, uuid.uuid4())

    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_get_product_raises_422_when_deleted(db_session):
    prod = await make_product(db_session, name="Gone", is_deleted=1)

    with pytest.raises(HTTPException) as exc_info:
        await prod_service.get_product(db_session, prod.id)

    assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_soft_delete_product_marks_deleted(db_session):
    prod = await make_product(db_session, name="ToDelete")

    await prod_service.soft_delete_product(db_session, prod.id)

    await db_session.refresh(prod)
    assert prod.is_deleted == 1


@pytest.mark.asyncio
async def test_soft_delete_product_raises_404_when_missing(db_session):
    with pytest.raises(HTTPException) as exc_info:
        await prod_service.soft_delete_product(db_session, uuid.uuid4())

    assert exc_info.value.status_code == 404
