// src/api/config.ts
/**
 * 🌍 Configuration API
 * Ajuste ici les URL et les paramètres généraux du backend.
 */

import { toast } from "react-toastify";

export const API_CONFIG = {
    baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000/api",
    fileURL: process.env.REACT_APP_FILE_URL || "http://localhost:8000",
    timeout: 30000, // 30 secondes
};

// Clé du token utilisée dans le localStorage
export const TOKEN_KEY = "access_token";

/**
 * Fonction utilitaire : récupérer le token JWT
 */
export const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};


export const showSuccessMessage = (message: string | any) => {
    toast.success(message);
};

export const showErrorMessage = (message: string | any) => {
    toast.error(message);
};

export const showWarningMessage = (message: string | any) => {
    toast.warning(message);
};

/**
 * Fonction utilitaire : enregistrer le token JWT
 */
export const setToken = (token: string | null) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
};
