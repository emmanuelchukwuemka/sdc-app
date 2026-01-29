import React from 'react';
import Card from '../components/Card';
import { Search, Heart, UserCheck } from 'lucide-react';

const IpDashboard = () => {
    return (
        <div className="ip-dashboard">
            <div className="dashboard-grid">
                <Card title="Match Progress" subtitle="Finding your surrogate/donor">
                    <div className="match-status">
                        <strong>Searching</strong>
                    </div>
                    <button className="btn-primary mt-4">Explore Marketplace</button>
                </Card>

                <Card title="Saved Profiles" subtitle="Your favorites">
                    <div className="fav-count">
                        <Heart size={16} /> 5 Favorites
                    </div>
                </Card>

                <Card title="Active Connections" subtitle="Agencies you are talking to">
                    <div className="connection-item">
                        <UserCheck size={16} /> Bloomzon Agency
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default IpDashboard;
