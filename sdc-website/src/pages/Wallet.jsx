import React from 'react';
import Card from '../components/Card';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import './Dashboard.css';

const Wallet = () => {
    return (
        <div className="wallet-container">
            <div className="dashboard-grid">
                <Card title="Balance" subtitle="Available funds">
                    <div className="stat-large">₦145,000.00</div>
                    <button className="btn-primary mt-4 w-full">Withdraw Funds</button>
                </Card>

                <Card title="Quick Actions">
                    <div className="quick-actions-list">
                        <button className="btn-secondary w-full mb-2">Fund Wallet</button>
                        <button className="btn-secondary w-full">Transaction History</button>
                    </div>
                </Card>
            </div>

            <div className="recent-transactions mt-8">
                <h3>Recent Transactions</h3>
                <Card className="mt-4">
                    <div className="transaction-item">
                        <div className="transaction-icon income">
                            <ArrowDownLeft size={16} />
                        </div>
                        <div className="transaction-info">
                            <p className="tx-title">Profile Unlock</p>
                            <p className="tx-date">Oct 24, 2025</p>
                        </div>
                        <div className="transaction-amount positive">+ ₦5,000.00</div>
                    </div>

                    <div className="transaction-item">
                        <div className="transaction-icon expense">
                            <ArrowUpRight size={16} />
                        </div>
                        <div className="transaction-info">
                            <p className="tx-title">Service Fee</p>
                            <p className="tx-date">Oct 22, 2025</p>
                        </div>
                        <div className="transaction-amount negative">- ₦500.00</div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Wallet;
