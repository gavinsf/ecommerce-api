// src/layouts/RootLayout.tsx
import { type ReactElement } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth_context";

export default function RootLayout(): ReactElement {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div className="app-container">
            <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px" }}>
                <div style={{ display: "flex", gap: "16px" }}>
                    <Link to="/">Home</Link>
                    <Link to="/search">Search</Link>
                    <Link to="/cart">Cart</Link>
                </div>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    {isAuthenticated ? (
                        <>
                            <span>{user?.email}</span>
                            <button onClick={handleLogout} style={{ cursor: "pointer" }}>
                                Log Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">Log In</Link>
                            <Link to="/register">Register</Link>
                        </>
                    )}
                </div>
            </nav>

            <main>
                {/* Active sub-routes will render here */}
                <Outlet />
            </main>
        </div>
    );
}
