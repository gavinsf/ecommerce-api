import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth_context';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '360px', margin: '0 auto', textAlign: 'left' }}>
            <h2>Log In</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
                <label>
                    Email
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </label>
                <label>
                    Password
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </label>
                {error && <p style={{ color: 'crimson' }}>{error}</p>}
                <button type="submit" disabled={submitting} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                    {submitting ? 'Logging in...' : 'Log In'}
                </button>
            </form>
            <p>
                Don't have an account? <Link to="/register">Register</Link>
            </p>
        </div>
    );
}
