import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import FormInput from '../../components/FormInput';

const Login = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: '',
        password: ''
    });

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await login(form.email, form.password);
            navigate('/dashboard');
        } catch (err) {
            setError(
                err.response?.data?.message || 'Invalid credentials'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>Login</h2>

            <form onSubmit={handleSubmit}>
                <FormInput
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => setForm({...form, email: v})}
                />

                <FormInput
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={(v) => setForm({...form, password: v})}
                />

                {error && <p className="error">{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
};

export default Login;