import React from 'react';
import { Link } from 'react-router-dom';

const SidebarItem = ({ icon: Icon, label, to, active, onClick }) => {
    if (onClick) {
        return (
            <button onClick={onClick} className={`sidebar-item ${active ? 'active' : ''}`}>
                <Icon size={20} />
                <span>{label}</span>
            </button>
        );
    }

    return (
        <Link to={to} className={`sidebar-item ${active ? 'active' : ''}`}>
            <Icon size={20} />
            <span>{label}</span>
        </Link>
    );
};

export default SidebarItem;
