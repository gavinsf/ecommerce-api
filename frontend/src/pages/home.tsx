import { useLoaderData } from 'react-router-dom';
import { productsApi, type Product } from '../lib/api';
import ProductCard from '../components/product_card';

export default function Home() {
    const products = useLoaderData() as Product[];

    return (
        <div style={{ padding: '20px' }}>
            <h1>Welcome Home!</h1>
            <p>Browse our latest products below.</p>

            <div className="product-grid">
                {products.length > 0 ? (
                    products.map((product) => <ProductCard key={product.id} product={product} />)
                ) : (
                    <p>No products available right now.</p>
                )}
            </div>
        </div>
    );
}

export async function homeLoader() {
    try {
        return await productsApi.list();
    } catch {
        return [];
    }
}
