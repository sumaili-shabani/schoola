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
    login: (email: string, password: string) => Promise<{
        success: boolean;
        message?: string;
        user?: User;
    }>;
    logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const path = window.location.pathname;
        const token = localStorage.getItem("access_token");

        if (path !== "/login" && token) {
            AuthAPI.me()
                .then((res) => setUser(res as User))
                .catch(() => {
                    localStorage.removeItem("access_token");
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    // ✅ login retourne maintenant un feedback complet
    const login = async (email: string, password: string) => {
        try {
            const response = await AuthAPI.login(email, password);

            if (!response?.access_token) {
                return { success: false, message: "Identifiants incorrects." };
            }

            const me = (await AuthAPI.me()) as User;
            setUser(me);

            return { success: true, message: "Connexion réussie", user: me };
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                "Erreur de connexion au serveur. Vérifiez vos identifiants.";
            return { success: false, message: msg };
        }
    };

    const logout = async () => {
        try {
            await AuthAPI.logout();
        } catch { }
        localStorage.removeItem("access_token");
        setUser(null);
        window.location.href = "/login";
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
