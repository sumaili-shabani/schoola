import { Routes, Route } from "react-router-dom";
import PrivateRoute from "../auth/PrivateRoute";
import RoleGuard from "../auth/RoleGuard";
import { ROLES } from "../auth/permissions";
import AdminLayout from "../layout/AdminLayout";
import Dashboard from "../pages/dashboard/Dashboard";
import RoleList from "../pages/roles/RoleList";
import Login from "../pages/Login";
import UserProfile from "../pages/profil/UserProfile";
import NotFoundPage from "../pages/NotFoundPage";
import SitePage from "../pages/site/SitePage";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            {/* Accès refusé */}
            <Route
                path="/unauthorized"
                element={<div className="p-4 text-center text-danger fw-bold">Accès refusé 🚫</div>}
            />

            {/* Routes protégées */}
            <Route
                path="profil"
                element={
                    <RoleGuard
                        allowed={[
                            ROLES.SUPER_ADMIN,
                            ROLES.ADMIN,
                            ROLES.ENSEIGNANT,
                            ROLES.COMPTABLE,
                            ROLES.SECRETAIRE,
                            ROLES.AUDITEUR,
                        ]}
                    >
                        <UserProfile />
                    </RoleGuard>
                }
            />

            {/* interfaces superadmin */}
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <AdminLayout />
                    </PrivateRoute>
                }
            >
                <Route index element={<Dashboard />} />

                <Route
                    path="roles"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN]}>
                            <RoleList />
                        </RoleGuard>
                    }
                />
                <Route
                    path="systeme"
                    element={
                        <RoleGuard allowed={[ROLES.SUPER_ADMIN]}>
                            <SitePage />
                        </RoleGuard>
                    }
                />





                {/* Toutes les autres routes protégées */}
            </Route>

            {/* Page 404 (doit être à la fin) */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
