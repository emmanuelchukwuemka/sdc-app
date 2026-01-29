import React from 'react';
import './Card.css';

const Card = ({ children, title, subtitle, footer, className = '', ...props }) => {
    return (
        <div className={`card ${className}`} {...props}>
            {(title || subtitle) && (
                <div className="card-header">
                    {title && <h3>{title}</h3>}
                    {subtitle && <p>{subtitle}</p>}
                </div>
            )}
            <div className="card-body">
                {children}
            </div>
            {footer && (
                <div className="card-footer">
                    {footer}
                </div>
            )}
        </div>
    );
};

export default Card;
