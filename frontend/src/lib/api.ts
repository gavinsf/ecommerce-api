import { API_URL } from '../globals';

export interface Product {
    id: string;
    name: string;
    cost_price: number;
    sell_price: number;
    created_at: string;
    is_deleted: number;
    stock: number;
}

export interface CartItem {
    id: string;
    product_id: string;
    name: string;
    quantity: number;
    sell_price: number;
    line_total: number;
}

export interface Cart {
    items: CartItem[];
    total: number;
}

export interface User {
    id: string;
    email: string;
    created_at: string;
    is_admin: number;
}

export interface Tokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}

export interface AuthResponse {
    user: User;
    tokens: Tokens;
}

export interface OrderCreateResponse {
    order_id: string;
    total: number;
    created_at: string;
}

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

export function getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
}

export function storeSession(auth: AuthResponse) {
    localStorage.setItem(ACCESS_TOKEN_KEY, auth.tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, auth.tokens.refresh_token);
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

export function clearSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
    const token = getAccessToken();
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (!response.ok) {
        let detail = response.statusText;
        try {
            const body = await response.json();
            detail = body.detail ?? detail;
        } catch {
            // response body wasn't JSON, fall back to statusText
        }
        throw new ApiError(response.status, detail);
    }

    if (response.status === 204) return null;
    return response.json();
}

export const productsApi = {
    list: (offset = 0, limit = 20) =>
        apiFetch(`products/?offset=${offset}&limit=${limit}`) as Promise<Product[]>,
    search: (name: string, offset = 0, limit = 20) =>
        apiFetch(`products/?name=${encodeURIComponent(name)}&offset=${offset}&limit=${limit}`) as Promise<Product[]>,
    get: (id: string) => apiFetch(`products/${id}`) as Promise<Product>,
};

export const cartApi = {
    get: () => apiFetch('cart/') as Promise<Cart>,
    addItem: (product_id: string, quantity: number) =>
        apiFetch('cart/items', {
            method: 'POST',
            body: JSON.stringify({ product_id, quantity }),
        }) as Promise<CartItem>,
    updateItem: (product_id: string, quantity: number) =>
        apiFetch(`cart/item/${product_id}`, {
            method: 'POST',
            body: JSON.stringify({ quantity }),
        }) as Promise<CartItem>,
    removeItem: (product_id: string) =>
        apiFetch(`cart/item/${product_id}`, { method: 'DELETE' }),
    clear: () => apiFetch('cart/', { method: 'DELETE' }),
};

export const authApi = {
    login: (email: string, password: string) =>
        apiFetch('login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }) as Promise<AuthResponse>,
    register: (email: string, password: string) =>
        apiFetch('register', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }) as Promise<AuthResponse>,
};

export const ordersApi = {
    checkout: () => apiFetch('checkout', { method: 'POST' }) as Promise<OrderCreateResponse>,
};
