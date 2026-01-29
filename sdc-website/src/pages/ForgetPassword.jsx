import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import { Mail, ArrowLeft } from 'lucide-react';
import './Login.css';

const ForgetPassword = () => {
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Logic later
        alert("Reset link sent if email exists.");
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <Link to="/login" className="back-link">
                    <ArrowLeft size={18} />
                    Back to Login
                </Link>
                <div className="auth-header">
                    <div className="auth-logo">SDC</div>
                    <h1>Forgot Password?</h1>
                    <p>Enter your email and we'll send you a link to reset it.</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="name@example.com"
                        required
                    />

                    <Button type="submit" size="lg" className="w-full">
                        <Mail size={18} />
                        Send Reset Link
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ForgetPassword;
