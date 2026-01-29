import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, Heart, ShieldCheck } from 'lucide-react';
import './RoleSelection.css';

const roles = [
    { id: 'admin', title: 'Admin', icon: ShieldCheck, desc: 'Manage platform and users' },
    { id: 'agency', title: 'Agency', icon: Users, desc: 'Connect surrogates and parents' },
    { id: 'donor', title: 'Donor', icon: Heart, desc: 'Provide biological support' },
    { id: 'surrogate', title: 'Surrogate', icon: User, desc: 'Help families grow' },
];

const RoleSelection = () => {
    const navigate = useNavigate();

    const handleRoleSelect = (roleId) => {
        // Logic later
        navigate('/dashboard');
    };

    return (
        <div className="role-container">
            <div className="role-header">
                <h1>Select Your Role</h1>
                <p>Choose the role that best fits your purpose on SDC</p>
            </div>

            <div className="role-grid">
                {roles.map((role) => (
                    <div
                        key={role.id}
                        className="role-card"
                        onClick={() => handleRoleSelect(role.id)}
                    >
                        <div className="role-icon">
                            <role.icon size={32} />
                        </div>
                        <h3>{role.title}</h3>
                        <p>{role.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoleSelection;
