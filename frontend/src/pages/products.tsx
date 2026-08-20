import { useState } from 'react';
import { useLoaderData, useNavigate, type LoaderFunctionArgs } from 'react-router-dom';
import { cartApi, productsApi, type Product } from '../lib/api';
import { useAuth } from '../auth/auth_context';

export default function ProductDetail() {
    const product = useLoaderData() as Product | null;
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [quantity, setQuantity] = useState(1);
    const [status, setStatus] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);

    if (!product) {
        return (
            <div style={{ padding: '20px' }}>
                <h2>Product not found</h2>
            </div>
        );
    }

    const outOfStock = product.stock <= 0;

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        setAdding(true);
        setStatus(null);
        try {
            await cartApi.addItem(product.id, quantity);
            setStatus('Added to cart.');
        } catch (err) {
            setStatus(err instanceof Error ? err.message : 'Failed to add to cart.');
        } finally {
            setAdding(false);
        }
    };

    return (
        <div style={{ padding: '20px', textAlign: 'left' }}>
            <h2>{product.name}</h2>
            <p style={{ fontSize: '24px' }}>${product.sell_price.toFixed(2)}</p>
            <p>{outOfStock ? 'Out of stock' : `${product.stock} in stock`}</p>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '16px 0' }}>
                <label htmlFor="quantity">Quantity</label>
                <input
                    id="quantity"
                    type="number"
                    min={1}
                    max={Math.max(product.stock, 1)}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    style={{ width: '60px', padding: '4px 8px' }}
                    disabled={outOfStock}
                />
                <button onClick={handleAddToCart} disabled={outOfStock || adding} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                    {adding ? 'Adding...' : 'Add to Cart'}
                </button>
            </div>

            {status && <p>{status}</p>}
        </div>
    );
}

export async function productLoader({ params }: LoaderFunctionArgs) {
    if (!params.id) return null;
    try {
        return await productsApi.get(params.id);
    } catch {
        return null;
    }
}
