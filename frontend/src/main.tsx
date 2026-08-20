// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import RootLayout from './layouts/root_layout';
import Home, { homeLoader } from './pages/home';
import Search, { searchLoader } from './pages/search';
import ProductDetail, { productLoader } from './pages/products';
import CartPage, { cartLoader } from './pages/cart';
import Login from './pages/login';
import Register from './pages/register';
import OrderConfirmation from './pages/order_confirmation';
import { AuthProvider } from './auth/auth_context';


const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />,
        loader: homeLoader,
      },
      {
        path: "search",
        element: <Search />,
        loader: searchLoader,
      },
      {
        path: "products/:id",
        element: <ProductDetail />,
        loader: productLoader,
      },
      {
        path: "cart",
        element: <CartPage />,
        loader: cartLoader,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "order-confirmation",
        element: <OrderConfirmation />,
      },
    ],
  },
]);


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
