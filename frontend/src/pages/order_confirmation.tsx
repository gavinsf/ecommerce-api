import { Link, Navigate, useLocation } from 'react-router-dom';
import type { OrderCreateResponse } from '../lib/api';

export default function OrderConfirmation() {
    const location = useLocation();
    const order = (location.state as { order?: OrderCreateResponse } | null)?.order;

    if (!order) {
        return <Navigate to="/" replace />;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>Thank you for your order!</h2>
            <p>Order ID: {order.order_id}</p>
            <p>Total: ${order.total.toFixed(2)}</p>
            <p>Placed: {new Date(order.created_at).toLocaleString()}</p>
            <p>
                <Link to="/">Continue shopping</Link>
            </p>
        </div>
    );
}
