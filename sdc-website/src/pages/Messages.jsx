import React from 'react';
import Card from '../components/Card';
import { Search, Send, User } from 'lucide-react';
import './Dashboard.css';

const Messages = () => {
    return (
        <div className="messages-layout">
            <aside className="chat-sidebar">
                <div className="search-chats">
                    <Search size={16} />
                    <input type="text" placeholder="Search conversations..." />
                </div>
                <div className="chats-list">
                    <div className="chat-preview active">
                        <div className="avatar">JD</div>
                        <div className="chat-info">
                            <h4>Jane Doe</h4>
                            <p>Looking forward to our meeting!</p>
                        </div>
                        <span className="time">12:30 PM</span>
                    </div>
                    <div className="chat-preview">
                        <div className="avatar">BA</div>
                        <div className="chat-info">
                            <h4>Bloomzon Agency</h4>
                            <p>Contract has been updated.</p>
                        </div>
                        <span className="time">Yesterday</span>
                    </div>
                </div>
            </aside>

            <main className="chat-window">
                <header className="chat-header">
                    <div className="user-info">
                        <div className="avatar">JD</div>
                        <h3>Jane Doe</h3>
                    </div>
                </header>

                <div className="chat-body">
                    <div className="message received">
                        <p>Hi, I saw your profile on the marketplace.</p>
                        <span className="time">10:00 AM</span>
                    </div>
                    <div className="message sent">
                        <p>Hello! Thanks for reaching out. How can I help?</p>
                        <span className="time">10:05 AM</span>
                    </div>
                </div>

                <footer className="chat-footer">
                    <input type="text" placeholder="Type a message..." />
                    <button className="send-btn"><Send size={18} /></button>
                </footer>
            </main>
        </div>
    );
};

export default Messages;
