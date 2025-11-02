import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

export default function UserSettings() {

    // pour la langue
    const { t, i18n } = useTranslation();

    const changeLanguage = (lang: 'fr' | 'en') => {
        i18n.changeLanguage(lang);
    };
    // fin langue

    const { theme, toggleTheme } = useTheme();

    const [preferences, setPreferences] = useState({
        receiveMessages: true,
        receiveNotifications: true,
        receivePromotions: false,
        darkMode: false,
        language: 'fr'
    });

    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current: '',
        newPassword: '',
    });

    const handleToggle = (key: keyof typeof preferences) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key],
        }));

        if (preferences.darkMode===true) {
            toggleTheme();

        }


    };


    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setPreferences(prev => ({
            ...prev,
            language: value
        }));

        if (value === 'fr') {
            changeLanguage('fr');

        }
        else if (value === 'en') {
            changeLanguage('en');

        } else {

        }

        
    };

    return (
        <div className={`container mt-4  p-4 rounded shadow-sm`}>
            <h4 className="mb-4">
                <i className="fas fa-cog me-2"></i> Paramètres de l'application
            </h4>

            {/* Section notifications */}
            <div className="mb-4">
                <h6 className="text-primary"><i className="fas fa-bell me-2"></i>Notifications</h6>
                <div className="form-check form-switch">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={preferences.receiveMessages}
                        onChange={() => handleToggle('receiveMessages')}
                        id="messagesSwitch"
                    />
                    <label className="form-check-label" htmlFor="messagesSwitch">
                        Recevoir les messages
                    </label>
                </div>
                <div className="form-check form-switch">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={preferences.receiveNotifications}
                        onChange={() => handleToggle('receiveNotifications')}
                        id="notifSwitch"
                    />
                    <label className="form-check-label" htmlFor="notifSwitch">
                        Recevoir les notifications
                    </label>
                </div>
                <div className="form-check form-switch">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={preferences.receivePromotions}
                        onChange={() => handleToggle('receivePromotions')}
                        id="promoSwitch"
                    />
                    <label className="form-check-label" htmlFor="promoSwitch">
                        Recevoir les offres et promotions
                    </label>
                </div>
            </div>

            {/* Section thème */}
            <div className="mb-4">
                <h6 className="text-success"><i className="fas fa-adjust me-2"></i>Apparence</h6>
                <div className="form-check form-switch">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={preferences.darkMode}
                        onChange={() => handleToggle('darkMode')}
                        id="darkModeSwitch"
                    />
                    <label className="form-check-label" htmlFor="darkModeSwitch">
                        Mode sombre
                    </label>
                </div>
            </div>

            {/* Section langue */}
            <div className="mb-4">
                <h6 className={`${preferences.darkMode ? 'text-mutted' : 'text-info'}`}><i className="fas fa-language me-2"></i>Langue</h6>
                <select
                    className="form-select"
                    value={preferences.language}
                    onChange={handleLanguageChange}
                >
                    <option value="fr">Français</option>
                    <option value="en">English</option>

                </select>
            </div>




        </div>
    );
}
