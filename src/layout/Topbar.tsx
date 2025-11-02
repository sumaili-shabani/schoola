import { useAuth } from "../auth/useAuth";
import feather from "feather-icons";
import { useEffect } from "react";
import { API_CONFIG } from "../api/config";

import { useSidebar } from "../context/SidebarContext";
import { useTheme } from "../context/ThemeContext";
import { Link } from "react-router-dom";

export default function Topbar() {
    const { user, logout } = useAuth();
    const { collapsed, toggle } = useSidebar();

    const { theme, toggleTheme } = useTheme();

    // ⚡️ recharger les icônes Feather
    useEffect(() => {
        feather.replace();
    });

    return (
        <nav className={`navbar navbar-expand navbar-light border-bottom shadow-sm ${theme === "dark" ? "bg-dark navbar-dark" : "bg-white navbar-light"
            }`}>
            {/* ☰ Bouton toggle sidebar */}
            <a className="sidebar-toggle js-sidebar-toggle" onClick={(e) => { e.preventDefault(); toggle(); }} href="#">
                <i className="hamburger align-self-center"></i>
            </a>

            {/* --- Champ de recherche --- */}
            <form className="d-none d-sm-inline-block me-2">
                <div className="input-group input-group-navbar">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Rechercher..."
                        aria-label="Search"
                    />
                    <button className="btn" type="button">
                        <i className="align-middle" data-feather="search"></i>
                    </button>
                </div>
            </form>


            {/* === RIGHT SECTION === */}
            <div className="d-flex align-items-center gap-3">
                {/* 🔹 Bouton bascule du thème */}
                <button
                    onClick={toggleTheme}
                    className={`btn btn-sm rounded-circle shadow-sm ${theme === "dark"
                        ? "btn-outline-light border-light"
                        : "btn-outline-secondary border-secondary"
                        }`}
                    title={`Basculer en mode ${theme === "light" ? "sombre" : "clair"}`}
                    style={{
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.3s ease-in-out",
                    }}
                >
                    {theme === "light" ? (
                        <i className="fas fa-moon text-dark"></i>
                    ) : (
                        <i className="fas fa-sun text-warning"></i>
                    )}
                </button>

            </div>

            <div className="navbar-collapse collapse">
                <ul className="navbar-nav navbar-align">

                    {/* 🔔 Notifications */}
                    <li className="nav-item dropdown">
                        <a className="nav-icon dropdown-toggle" href="#" data-bs-toggle="dropdown">
                            <div className="position-relative">
                                <i className="align-middle" data-feather="bell"></i>
                                <span className="indicator">3</span>
                            </div>
                        </a>
                        <div className="dropdown-menu dropdown-menu-lg dropdown-menu-end py-0">
                            <div className="dropdown-menu-header">3 nouvelles notifications</div>
                            <div className="list-group">
                                <a href="#" className="list-group-item">
                                    <i className="text-primary me-2" data-feather="check-circle"></i>
                                    Présence mise à jour
                                </a>
                                <a href="#" className="list-group-item">
                                    <i className="text-warning me-2" data-feather="alert-circle"></i>
                                    Nouvelle alerte administrative
                                </a>
                                <a href="#" className="list-group-item">
                                    <i className="text-success me-2" data-feather="user-plus"></i>
                                    Nouvel utilisateur ajouté
                                </a>
                            </div>
                        </div>
                    </li>

                    {/* 💬 Messages */}
                    <li className="nav-item dropdown">
                        <a className="nav-icon dropdown-toggle" href="#" data-bs-toggle="dropdown">
                            <div className="position-relative">
                                <i className="align-middle" data-feather="message-square"></i>
                            </div>
                        </a>
                        <div className="dropdown-menu dropdown-menu-lg dropdown-menu-end py-0">
                            <div className="dropdown-menu-header">2 nouveaux messages</div>
                            <div className="list-group">
                                <a href="#" className="list-group-item">
                                    <strong>Prof. Katembo</strong> : Les notes de 3e année sont prêtes
                                </a>
                                <a href="#" className="list-group-item">
                                    <strong>Comptabilité</strong> : Facture école validée
                                </a>
                            </div>
                        </div>
                    </li>

                    {/* 🌍 Langue */}
                    <li className="nav-item dropdown">
                        <a className="nav-flag dropdown-toggle" href="#" data-bs-toggle="dropdown">
                            <img src="/img/flags/fr.png" alt="Français" />
                        </a>
                        <div className="dropdown-menu dropdown-menu-end">
                            <a className="dropdown-item" href="#">
                                <img src="/img/flags/fr.png" width="20" className="me-1" /> Français
                            </a>
                            <a className="dropdown-item" href="#">
                                <img src="/img/flags/us.png" width="20" className="me-1" /> English
                            </a>
                        </div>
                    </li>

                    {/* ⛶ Fullscreen */}
                    <li className="nav-item">
                        <a
                            className="nav-icon js-fullscreen d-none d-lg-block"
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (!document.fullscreenElement) {
                                    document.documentElement.requestFullscreen();
                                } else {
                                    document.exitFullscreen();
                                }
                            }}
                        >
                            <i className="align-middle" data-feather="maximize"></i>
                        </a>
                    </li>

                    {/* 👤 Profil utilisateur */}
                    <li className="nav-item dropdown">
                        <a className="nav-icon pe-md-0 dropdown-toggle" href="#" data-bs-toggle="dropdown">
                            <img
                                src={user?.avatar ? `${API_CONFIG.fileURL}/images/${user.avatar}` : "/img/avatars/avatar.jpg"}
                                className="avatar img-fluid rounded"
                                alt="Avatar"
                            />
                        </a>
                        <div className="dropdown-menu dropdown-menu-end">
                            <span className="dropdown-item-text px-3 fw-bold">
                                {user?.name || "Utilisateur"}
                            </span>
                            <div className="dropdown-divider"></div>
                            <Link className="dropdown-item" to="/profil"><i className="align-middle me-1" data-feather="settings"></i> Paramètres</Link>
                            <Link className="dropdown-item" to="#"><i className="align-middle me-1" data-feather="mail"></i> Messagerie</Link>
                            <Link className="dropdown-item" to="#"><i className="align-middle me-1" data-feather="calendar"></i> Calendrier</Link>
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item" onClick={logout}>
                                <i className="align-middle me-1" data-feather="log-out"></i> Déconnexion
                            </button>
                        </div>
                    </li>
                </ul>
            </div>
        </nav>
    );
}
