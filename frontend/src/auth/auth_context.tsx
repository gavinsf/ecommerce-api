import { createContext, useContext, useState, type ReactElement, type ReactNode } from 'react';
import { authApi, clearSession, getStoredUser, storeSession, type User } from '../lib/api';

interface AuthContextValue {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
    const [user, setUser] = useState<User | null>(getStoredUser());

    const login = async (email: string, password: string) => {
        const auth = await authApi.login(email, password);
        storeSession(auth);
        setUser(auth.user);
    };

    const register = async (email: string, password: string) => {
        const auth = await authApi.register(email, password);
        storeSession(auth);
        setUser(auth.user);
    };

    const logout = () => {
        clearSession();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
}
