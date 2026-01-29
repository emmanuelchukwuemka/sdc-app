import React from 'react';
import Card from '../components/Card';
import { UserPlus, Calendar, CreditCard } from 'lucide-react';

const AgencyDashboard = () => {
    return (
        <div className="agency-dashboard">
            <div className="dashboard-grid">
                <Card title="My Listings" subtitle="Active surrogates & donors">
                    <div className="listing-stats">
                        <strong>12</strong> Active Listings
                    </div>
                    <button className="btn-primary mt-4">Add New Listing</button>
                </Card>

                <Card title="Appointments" subtitle="Upcoming family meetings">
                    <div className="empty-state">No appointments today</div>
                </Card>

                <Card title="Subscription" subtitle="Premium Plan">
                    <div className="status-badge success">Active</div>
                    <p className="mt-2 text-sm">Renews on Feb 12, 2026</p>
                </Card>
            </div>
        </div>
    );
};

export default AgencyDashboard;
