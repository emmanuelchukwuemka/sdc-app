import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { Search, MapPin, ShieldCheck, Heart, Lock, MessageSquare } from 'lucide-react';
import './Marketplace.css';

// Mock data based on mobile data/listings.js
const MOCK_LISTINGS = [
    { id: 's1', role: 'SURROGATE', location: 'Lagos, NG', age: 28, availability: 'Immediate', alias: 'Comfort S.', bio: 'Experienced surrogate, healthy and ready to help.', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400' },
    { id: 's2', role: 'SURROGATE', location: 'Abuja, NG', age: 31, availability: '3 Months', alias: 'Blessing O.', bio: 'Kind-hearted and dedicated to helping families.', image: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400' },
    { id: 'd1', role: 'DONOR', location: 'Enugu, NG', age: 24, availability: 'Immediate', alias: 'John D.', bio: 'Healthy donor with a clean medical history.', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400' },
];

const Marketplace = () => {
    const [filter, setFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [unlockedIds, setUnlockedIds] = useState(new Set());

    const filteredData = useMemo(() => {
        let result = MOCK_LISTINGS;
        if (filter !== 'ALL') {
            result = result.filter((x) => x.role === filter);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.location.toLowerCase().includes(q) ||
                item.role.toLowerCase().includes(q) ||
                item.alias.toLowerCase().includes(q)
            );
        }
        return result;
    }, [filter, searchQuery]);

    const toggleUnlock = (id) => {
        setUnlockedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className="marketplace-container">
            <div className="marketplace-header">
                <div className="search-box">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by location, role, or name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filter-tabs">
                    {['ALL', 'SURROGATE', 'DONOR'].map(f => (
                        <button
                            key={f}
                            className={`filter-tab ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0) + f.slice(1).toLowerCase()}s
                        </button>
                    ))}
                </div>
            </div>

            <div className="listings-grid">
                {filteredData.map(item => {
                    const isUnlocked = unlockedIds.has(item.id);
                    return (
                        <Card key={item.id} className="listing-card">
                            <div className="listing-image-container">
                                <img src={item.image} alt={item.alias} className={isUnlocked ? '' : 'blurred'} />
                                {!isUnlocked && (
                                    <div className="lock-overlay">
                                        <Lock size={24} />
                                        <span>Locked Profile</span>
                                    </div>
                                )}
                                <div className="role-badge">{item.role}</div>
                            </div>

                            <div className="listing-content">
                                <div className="listing-title">
                                    <h3>{isUnlocked ? item.alias : 'Verified Candidate'}</h3>
                                    <ShieldCheck size={18} className="verified-icon" />
                                </div>

                                <div className="listing-info">
                                    <div className="info-item">
                                        <MapPin size={14} />
                                        <span>{item.location}</span>
                                    </div>
                                    <div className="info-item">
                                        <Heart size={14} />
                                        <span>Age: {item.age}</span>
                                    </div>
                                </div>

                                <p className="listing-bio">
                                    {isUnlocked ? item.bio : 'Unlock to see full profile details and contact options.'}
                                </p>

                                <div className="listing-actions">
                                    {isUnlocked ? (
                                        <Button variant="secondary" className="w-full">
                                            <MessageSquare size={18} />
                                            Message
                                        </Button>
                                    ) : (
                                        <Button onClick={() => toggleUnlock(item.id)} className="w-full">
                                            Unlock Profile • ₦5,000
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default Marketplace;
