import { useState } from 'react';
import { Link, useLoaderData, useNavigate, redirect } from 'react-router-dom';
import { cartApi, getAccessToken, ordersApi, type Cart } from '../lib/api';

export default function CartPage() {
    const initialCart = useLoaderData() as Cart;
    const [cart, setCart] = useState(initialCart);
    const [error, setError] = useState<string | null>(null);
    const [checkingOut, setCheckingOut] = useState(false);
    const navigate = useNavigate();

    const refreshCart = async () => {
        setCart(await cartApi.get());
    };

    const handleQuantityChange = async (productId: string, quantity: number) => {
        if (quantity < 1) return;
        setError(null);
        try {
            await cartApi.updateItem(productId, quantity);
            await refreshCart();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update item.');
        }
    };

    const handleRemove = async (productId: string) => {
        setError(null);
        try {
            await cartApi.removeItem(productId);
            await refreshCart();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove item.');
        }
    };

    const handleClear = async () => {
        setError(null);
        try {
            await cartApi.clear();
            setCart({ items: [], total: 0 });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to clear cart.');
        }
    };

    const handleCheckout = async () => {
        setError(null);
        setCheckingOut(true);
        try {
            const order = await ordersApi.checkout();
            navigate('/order-confirmation', { state: { order } });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Checkout failed.');
        } finally {
            setCheckingOut(false);
        }
    };

    return (
        <div style={{ padding: '20px', textAlign: 'left' }}>
            <h2>Your Cart</h2>

            {error && <p style={{ color: 'crimson' }}>{error}</p>}

            {cart.items.length === 0 ? (
                <p>
                    Your cart is empty. <Link to="/">Continue shopping</Link>.
                </p>
            ) : (
                <>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {cart.items.map((item) => (
                            <div
                                key={item.product_id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    border: '1px solid #eee',
                                    padding: '12px',
                                    borderRadius: '4px',
                                }}
                            >
                                <div>
                                    <strong>{item.name}</strong>
                                    <p>${item.sell_price.toFixed(2)} each</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="number"
                                        min={1}
                                        value={item.quantity}
                                        onChange={(e) => handleQuantityChange(item.product_id, Number(e.target.value))}
                                        style={{ width: '60px', padding: '4px 8px' }}
                                    />
                                    <span>${item.line_total.toFixed(2)}</span>
                                    <button onClick={() => handleRemove(item.product_id)} style={{ cursor: 'pointer' }}>
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <hr style={{ margin: '20px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Total: ${cart.total.toFixed(2)}</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={handleClear} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                                Clear Cart
                            </button>
                            <button onClick={handleCheckout} disabled={checkingOut} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                                {checkingOut ? 'Placing order...' : 'Checkout'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export async function cartLoader() {
    if (!getAccessToken()) {
        return redirect('/login');
    }
    try {
        return await cartApi.get();
    } catch {
        return { items: [], total: 0 } as Cart;
    }
}
