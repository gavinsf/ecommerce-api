import { Link } from 'react-router-dom';
import type { Product } from '../lib/api';

export default function ProductCard({ product }: { product: Product }) {
    const outOfStock = product.stock <= 0;

    return (
        <div className="product-card">
            <h3>{product.name}</h3>
            <p className="product-card-price">${product.sell_price.toFixed(2)}</p>
            <p className="product-card-stock">{outOfStock ? 'Out of stock' : `${product.stock} in stock`}</p>
            <Link to={`/products/${product.id}`}>View Product</Link>
        </div>
    );
}
