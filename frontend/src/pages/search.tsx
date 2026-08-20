import { useState } from 'react';
import { useLoaderData, useSearchParams } from 'react-router-dom'
import { productsApi, type Product } from '../lib/api';
import ProductCard from '../components/product_card';

export default function Search() {
    const products = useLoaderData() as Product[];
    const [searchParams, setSearchParams] = useSearchParams();

    const [inputValue, setInputValue] = useState(searchParams.get('q') || '');

    const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (inputValue.trim()) {
            setSearchParams({ q: inputValue.trim() });
        } else {
            setSearchParams({});
        }
    };
    return (
        <div style={{ padding: '20px' }}>
            <h2>Product Search</h2>

            {/* Internal Search Input */}
            <div style={{ marginBottom: '20px' }}>
                <form onSubmit={handleSearchSubmit} style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        placeholder="Search for items..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        style={{ padding: '8px 12px', width: '300px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer' }}>
                        Search
                    </button>
                </form>
            </div>

            <hr style={{ margin: '20px 0', borderColor: '#eee' }} />

            {/* Search Results Matrix */}
            <div className="product-grid">
                {products.length > 0 ? (
                    products.map((product) => <ProductCard key={product.id} product={product} />)
                ) : (
                    searchParams.get('q') && <p>No products found matching "{searchParams.get('q')}"</p>
                )}
            </div>
        </div>
    );
}

export async function searchLoader({ request }: { request: Request }) {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';

    if (!q) return [];

    try {
        return await productsApi.search(q);
    } catch {
        return [];
    }
}
