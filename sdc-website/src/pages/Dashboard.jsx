import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import SidebarItem from '../components/SidebarItem';
import Card from '../components/Card';
import Marketplace from './Marketplace';
import Wallet from './Wallet';
import Messages from './Messages';
import AdminDashboard from './AdminDashboard';
import AgencyDashboard from './AgencyDashboard';
import DonorDashboard from './DonorDashboard';
import IpDashboard from './IpDashboard';
import {
    LayoutDashboard,
    Users,
    ShoppingCart,
    MessageSquare,
    Wallet as WalletIcon,
    Settings,
    LogOut,
    Bell
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [userRole, setUserRole] = React.useState('donor'); // Mock

    const handleLogout = () => {
        navigate('/login');
    };

    const renderOverview = () => {
        switch (userRole) {
            case 'admin': return <AdminDashboard />;
            case 'agency': return <AgencyDashboard />;
            case 'donor':
            case 'surrogate': return <DonorDashboard />;
            case 'ip': return <IpDashboard />;
            default: return <DonorDashboard />;
        }
    };

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">SDC</div>

                <nav className="sidebar-nav">
                    <SidebarItem
                        icon={LayoutDashboard}
                        label="Overview"
                        to="/dashboard"
                        active={location.pathname === '/dashboard'}
                    />
                    <SidebarItem
                        icon={ShoppingCart}
                        label="Marketplace"
                        to="/dashboard/marketplace"
                        active={location.pathname === '/dashboard/marketplace'}
                    />
                    <SidebarItem
                        icon={MessageSquare}
                        label="Messages"
                        to="/dashboard/messages"
                        active={location.pathname === '/dashboard/messages'}
                    />
                    <SidebarItem
                        icon={WalletIcon}
                        label="Wallet"
                        to="/dashboard/wallet"
                        active={location.pathname === '/dashboard/wallet'}
                    />
                    <SidebarItem
                        icon={Users}
                        label="Community"
                        to="/dashboard/community"
                        active={location.pathname === '/dashboard/community'}
                    />
                </nav>

                <div className="sidebar-footer">
                    <SidebarItem
                        icon={Settings}
                        label="Settings"
                        to="/dashboard/settings"
                        active={location.pathname === '/dashboard/settings'}
                    />
                    <SidebarItem
                        icon={LogOut}
                        label="Logout"
                        onClick={handleLogout}
                    />
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="main-header">
                    <div className="header-title">
                        <h1>Welcome back, User</h1>
                    </div>
                    <div className="header-actions">
                        <button className="header-btn">
                            <Bell size={20} />
                        </button>
                        <div className="user-profile">
                            <div className="avatar">U</div>
                        </div>
                    </div>
                </header>

                <div className="content-inner">
                    <Routes>
                        <Route index element={renderOverview()} />
                        <Route path="marketplace" element={<Marketplace />} />
                        <Route path="messages" element={<Messages />} />
                        <Route path="wallet" element={<Wallet />} />
                        <Route path="*" element={<div><h2>Coming Soon</h2><p>This feature is being developed.</p></div>} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
