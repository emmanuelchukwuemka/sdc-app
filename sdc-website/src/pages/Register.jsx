import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import { UserPlus } from 'lucide-react';
import './Login.css'; // Reusing some styles

const Register = () => {
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        navigate('/role-selection');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">SDC</div>
                    <h1>Create Account</h1>
                    <p>Join the community today</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <Input
                        label="Full Name"
                        type="text"
                        placeholder="John Doe"
                        required
                    />
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

                    <Button type="submit" size="lg" className="w-full">
                        <UserPlus size={18} />
                        Sign Up
                    </Button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
