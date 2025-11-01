import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
import { hasRole, RoleId } from "./permissions";
import { JSX } from "react";

/** Protège par rôle l'accès à une page/section. */
export default function RoleGuard({
    allowed,
    children,
}: {
    allowed?: RoleId[];
    children: JSX.Element;
}) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div className="p-4 text-center">Chargement…</div>;
    if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

    if (!hasRole(user.id_role, allowed)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
}
