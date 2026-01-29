import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import { KeyRound } from 'lucide-react';
import './Login.css';

const PasswordResetConfirm = () => {
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Logic later
        alert("Password reset successfully!");
        navigate('/login');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">SDC</div>
                    <h1>Reset Password</h1>
                    <p>Please enter your new password below.</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <Input
                        label="New Password"
                        type="password"
                        placeholder="••••••••"
                        required
                    />
                    <Input
                        label="Confirm Password"
                        type="password"
                        placeholder="••••••••"
                        required
                    />

                    <Button type="submit" size="lg" className="w-full">
                        <KeyRound size={18} />
                        Update Password
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default PasswordResetConfirm;
