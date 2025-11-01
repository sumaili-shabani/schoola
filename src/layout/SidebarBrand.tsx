import React from "react";
import { useSidebar } from "../context/SidebarContext";
import logoFull from "../assets/logo-schoola.png";      // 🟩 ton logo principal
import logoIcon from "../assets/logo-schoola2.png";      // ⚫ ton icône

export default function SidebarBrand() {
    const { collapsed } = useSidebar();

    return (
        <a
            className="sidebar-brand d-flex align-items-center justify-content-center text-decoration-none"
            href="/"
            style={{
                padding: collapsed ? "0rem 0" : "0rem",
                transition: "all 0.3s ease",
            }}
        >
       

            {/* 🔹 Texte visible uniquement si non-collapsé */}
            {!collapsed && (
                <div
                    className="text-start ms-2"
                    style={{
                        lineHeight: "1.2",
                        fontWeight: 600,
                        transition: "color 0.3s ease, opacity 0.3s ease",
                        color:
                            document.body.dataset.theme === "dark"
                                ? "#f8f9fa" // texte clair sur fond sombre
                                : "#212529", // texte foncé sur fond clair
                    }}
                >
                    <img
                        src={document.body.dataset.theme === "dark"
                            ? logoIcon
                            : logoFull}
                        alt="Logo Schoola"
                        style={{
                            height: collapsed ? "50px" : "120px",
                            width: "auto",
                            transition: "all 0.3s ease",
                            filter: "brightness(1.1)",
                        }}
                    /> 
                    
                   
                </div>

            )}
        </a>
    );
}
