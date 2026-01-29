import React from 'react';
import Card from '../components/Card';
import { Heart, MessageCircle, Clock } from 'lucide-react';

const DonorDashboard = () => {
    return (
        <div className="donor-dashboard">
            <div className="dashboard-grid">
                <Card title="My Profile Status" subtitle="Visibility on Marketplace">
                    <div className="status-badge success">Public</div>
                    <p className="mt-2 text-sm">Your profile is currently visible to IPs and Agencies.</p>
                </Card>

                <Card title="Inquiries" subtitle="Interested parties">
                    <div className="inquiry-item">
                        <MessageCircle size={16} /> 4 New Messages
                    </div>
                </Card>

                <Card title="Next Milestone" subtitle="Journey Timeline">
                    <div className="milestone">
                        <Clock size={16} /> Medical Screening
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default DonorDashboard;
