import React from 'react';
import Card from '../components/Card';
import { Users, FileText, AlertCircle, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
    return (
        <div className="admin-dashboard">
            <div className="dashboard-grid">
                <Card title="User Management" subtitle="Manage all platform users">
                    <div className="quick-actions">
                        <button className="btn-action"><Users size={16} /> All Users</button>
                        <button className="btn-action"><FileText size={16} /> KYC Requests</button>
                    </div>
                </Card>

                <Card title="Disputes" subtitle="Pending issues">
                    <div className="status-badge warning">
                        <AlertCircle size={16} /> 3 Active Disputes
                    </div>
                </Card>

                <Card title="Finances" subtitle="Platform revenue">
                    <div className="stat-large">₦2,450,000</div>
                    <div className="trend positive"><TrendingUp size={14} /> +12% this week</div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
