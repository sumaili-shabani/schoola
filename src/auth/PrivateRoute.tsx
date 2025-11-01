import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { JSX } from "react";

/**
 * Protéger une route : redirige vers /login si non connecté
 */
export default function PrivateRoute({ children }: { children: JSX.Element }) {
    const { user, loading } = useAuth();

    if (loading) return <div className="text-center py-4">Chargement...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}
