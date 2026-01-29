import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import { ShieldCheck } from 'lucide-react';
import './Login.css';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const [code, setCode] = useState('');

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
                    <h1>Verify Email</h1>
                    <p>We've sent a 6-digit code to your email. Please enter it below.</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <Input
                        label="Verification Code"
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        className="text-center-input"
                    />

                    <Button type="submit" size="lg" className="w-full">
                        <ShieldCheck size={18} />
                        Verify Account
                    </Button>

                    <div className="auth-footer">
                        Didn't receive a code? <button className="link-btn">Resend Code</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VerifyEmail;
