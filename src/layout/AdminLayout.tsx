import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { initAppKit } from "../utils/initAppKit";
import { initAdminKit } from "../utils/initAdminKit";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";


function LayoutInner() {
    const { collapsed } = useSidebar();

    // (ré)applique Feather après chaque rendu
    useEffect(() => {
        initAdminKit();
        initAppKit();
    });

    return (
        <div className="wrapper">
            <nav id="sidebar" className={`sidebar js-sidebar${collapsed ? " collapsed" : ""}`}>
                <Sidebar />
            </nav>

            <div className="main">
                <Topbar />
                <main className="content">
                    <div className="container-fluid p-0">
                        <Outlet />
                    </div>
                </main>

                <footer className="footer">
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
                </footer>
            </div>
        </div>
    );
}

export default function AdminLayout() {
    return (
        <SidebarProvider>
            <LayoutInner />
        </SidebarProvider>
    );
}