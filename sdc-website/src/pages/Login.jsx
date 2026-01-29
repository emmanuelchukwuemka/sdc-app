import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import { LogIn } from 'lucide-react';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Logic later
        navigate('/dashboard');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">SDC</div>
                    <h1>Welcome Back</h1>
                    <p>Login to your account to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="name@example.com"
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        required
                    />

                    <div className="form-options">
                        <Link to="/forgot-password">Forgot password?</Link>
                    </div>

                    <Button type="submit" size="lg" className="w-full">
                        <LogIn size={18} />
                        Sign In
                    </Button>
                </form>

                <div className="auth-footer">
                    Don't have an account? <Link to="/register">Create one</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
