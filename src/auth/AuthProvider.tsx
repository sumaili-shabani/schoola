import React, { createContext, useEffect, useState } from "react";
import { AuthAPI } from "../api/auth";

export type User = {
    id: number;
    name: string;
    email: string;
    id_role?: number;
    telephone?: string;
    adresse?: string;
    avatar?: string;
    sexe?: string;
} | null;

type AuthContextType = {
    user: User;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>;
    logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);

    // ✅ Vérification initiale du token sans rechargement
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem("access_token");
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const me = await AuthAPI.me();
                setUser(me as User);
            } catch (err) {
                console.warn("Token invalide, suppression...");
                localStorage.removeItem("access_token");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    // ✅ Connexion : pas d'appel concurrent à `me()` au moment du login
    const login = async (email: string, password: string) => {
        try {
            const response = await AuthAPI.login(email, password);

            if (!response?.access_token) {
                return { success: false, message: "Identifiants incorrects." };
            }

            localStorage.setItem("access_token", response.access_token);

            // 🔹 Récupération des infos utilisateur
            const me = (await AuthAPI.me()) as User;
            setUser(me);

            return { success: true, message: "Connexion réussie", user: me };
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Erreur de connexion au serveur.";
            return { success: false, message: msg };
        }
    };

    // ✅ Déconnexion propre sans reload
    const logout = async () => {
        try {
            await AuthAPI.logout();
        } catch {
            /* rien */
        }
        localStorage.removeItem("access_token");
        setUser(null);
        // 🔸 Utiliser navigation côté React au lieu du reload forcé
        window.dispatchEvent(new CustomEvent("auth-logout"));
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
