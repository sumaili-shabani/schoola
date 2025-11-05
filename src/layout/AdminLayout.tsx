import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { initAppKit } from "../utils/initAppKit";
import { initAdminKit } from "../utils/initAdminKit";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { ToastContainer } from "react-toastify";
import { useTheme } from "../context/ThemeContext";


function LayoutInner() {
    const { collapsed } = useSidebar();
    const { theme } = useTheme();

    // (ré)applique Feather après chaque rendu
    useEffect(() => {
        initAdminKit();
        initAppKit();
    });

    return (
        <div className={`wrapper d-flex theme-${theme}`}>
            <nav id="sidebar"
                className={`sidebar js-sidebar${collapsed ? " collapsed" : ""} ${theme === "dark" ? "bg-dark text-light border-end border-secondary" : "bg-white border-end"
                    }`}
                style={{
                    transition: "all 0.3s ease",
                    minHeight: "100vh",
                }}>
                <Sidebar />
            </nav>

            <div className="main">
                <Topbar />
                <main className="content">
                    <div className="container-fluid p-0">
                        <Outlet />
                    </div>
                </main>

                {/* <footer className="footer">
                    <div className="container-fluid">
                        <div className="row text-muted">
                            <div className="col-6 text-start">
                                <p className="mb-0"><strong>Schoola</strong> &copy;</p>
                            </div>
                            <div className="col-6 text-end">
                                <ul className="list-inline">
                                    <li className="list-inline-item"><a className="text-muted" href="#">Support</a></li>
                                    <li className="list-inline-item"><a className="text-muted" href="#">Confidentialité</a></li>
                                    <li className="list-inline-item"><a className="text-muted" href="#">Termes</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </footer> */}
            </div>
        </div>
    );
}

export default function AdminLayout() {
    return (
        <SidebarProvider>
            <LayoutInner />

            {/* ✅ Le container des toasts */}
            <ToastContainer
                position="top-right"
                autoClose={2500}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                pauseOnHover
                draggable
            />
        </SidebarProvider>
    );
}