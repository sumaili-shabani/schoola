// components/DynamicSidebar.tsx
import React, { useState } from 'react';

interface DynamicSidebarProps {
    show: boolean;
    onClose: () => void;
    content: React.ReactNode;
    title?: string;
}

const DynamicSidebar = ({ show, onClose, content, title }: DynamicSidebarProps) => {
    // Utilisation du thème global via l'attribut data-theme
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Classe de thème basée sur l'attribut data-theme
    const themeClass = isDark ? 'theme-dark' : 'theme-light';
    const sidebarClassName = `sidebar-container ${themeClass} ${show ? 'show' : ''}`;

    return (
        <>
            <div
                className={`overlay ${themeClass} ${show ? 'show' : ''}`}
                onClick={onClose}
            />
            <div className={sidebarClassName}>
                <div className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className={`mb-0 text-${isDark ? 'light' : 'dark'}`}>
                            {title || 'Contenu'}
                        </h5>
                        <button
                            type="button"
                            className={`btn btn-${isDark ? 'outline-light' : 'outline-dark'} btn-sm`}
                            onClick={onClose}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    <div className="p-4">
                        {content}
                    </div>
                </div>
            </div>
        </>
    );
};

export default DynamicSidebar;