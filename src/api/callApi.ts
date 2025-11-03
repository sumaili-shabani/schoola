// ✅ callApi.ts
import axios, { AxiosRequestConfig } from "axios";
import Swal from "sweetalert2";
import { API_CONFIG, getToken, setToken, showErrorMessage } from "./config";

// =============================================================
// 🔹 CONFIGURATION GÉNÉRALE D'AXIOS
// =============================================================
const api = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
});

// Ajout automatique du token JWT à chaque requête
api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers = config.headers || {};
        (config.headers as any)["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

// =============================================================
// 🔹 GESTION DU TOKEN EXPIRÉ
// =============================================================
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        (originalRequest.headers as any)["Authorization"] = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch(Promise.reject);
            }

            isRefreshing = true;
            try {
                // 🔄 Ici tu peux activer ton endpoint /refresh quand il sera 100 % prêt
                // const { data } = await axios.post(`${API_CONFIG.baseURL}/refresh`, null, {
                //   headers: { Authorization: `Bearer ${getToken()}` },
                // });
                // const newToken = data.access_token;
                // setToken(newToken);
                // processQueue(null, newToken);
                // isRefreshing = false;
                // (originalRequest.headers as any)["Authorization"] = `Bearer ${newToken}`;
                // return api(originalRequest);
            } catch (err) {
                processQueue(err, null);
                isRefreshing = false;
                setToken(null);
                window.dispatchEvent(new CustomEvent("auth-logout"));
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

// =============================================================
// 🔧 FONCTION GÉNÉRIQUE POUR TOUTE REQUÊTE
// =============================================================
export const callApi = async <T>(
    method: AxiosRequestConfig["method"],
    url: string,
    data?: any,
    config?: AxiosRequestConfig
): Promise<T> => {
    const response = await api.request<T>({ method, url, data, ...config });
    return response.data;
};

// =============================================================
// 🧩 MÉTHODES CRUD GÉNÉRIQUES
// =============================================================

// 🔹 Récupérer tous les éléments (liste paginée ou non)

export const fetchItems2 = async <T>(endpoint: string, id: number) => {
    try {
        const res = await api.get(`${endpoint}/${id}`);
        return res.data.data;
    } catch (err: any) {
        showErrorMessage("Erreur de chargement " + err);
        throw err;
    }
};

// ✅ Récupération paginée compatible Laravel
export const fetchItems = async <T>(url: string, params?: any): Promise<{
    data: T[];
    currentPage: number;
    perPage: number;
    total: number;
    lastPage: number;
}> => {
    const response = await api.get(url, { params });
    const { data, current_page, per_page, total, last_page } = response.data;
    return {
        data,
        currentPage: current_page,
        perPage: per_page,
        total,
        lastPage: last_page,
    };
};

// 🔹 Récupérer un seul élément
export const fetchItem = async <T>(url: string, id: number | string): Promise<T> => {
    const response = await api.get(`${url}/${id}`);
    return response.data;
};
// 🔹 Récupérer un seul élément pour edition
export const fetchSigleItem = async <T>(url: string, id: number | string): Promise<T> => {
    const response = await api.get(`${url}/${id}`);
    return response.data.data;
};

// 🔹 Récupérer une liste
export const fetchListItems = async <T>(endpoint: string) => {
    const res = await api.get(`${endpoint}`);
    return res.data;
};


// 🔹 Ajouter ou mettre à jour un élément
export const saveItem = async <T>(url: string, data: any): Promise<T> => {
    const response = await api.post(url, data);
    return response.data.data;
};


// 🔹 Ajouter ou mettre à jour un élément d'un fichier
export const saveItemImageForm = async <T>(endpoint: string, data: FormData) => {
    try {
        const res = await api.post(endpoint, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return res.data;
    } catch (err: any) {
        throw err;
    }
};

// 🔹 Supprimer un élément
export const removeItem = async <T>(url: string, id: number | string): Promise<T> => {
    const response = await api.get(`${url}/${id}`);
    return response.data.data;
};

// =============================================================
// 🧠 UTILITAIRES GÉNÉRAUX
// =============================================================

// 🔹 Formatage de date au format français
export const formatDateFR = (dateStr: string): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
};

// 🔹 Extraction de l'heure
export const extractTime = (dateStr: string): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

// 🔹 Tronquer un texte long
export const truncateText = (text: string, maxLength: number): string => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

// 🔹 Fenêtre de confirmation (SweetAlert2)
export const showConfirmationDialog = async ({
    title = "Êtes-vous sûr ?",
    text = "",
    icon = "warning",
    confirmButtonText = "Oui",
    cancelButtonText = "Annuler",
}: {
    title?: string;
    text?: string;
    icon?: "warning" | "info" | "error" | "success" | "question";
    confirmButtonText?: string;
    cancelButtonText?: string;
}): Promise<boolean> => {
    const result = await Swal.fire({
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText,
        cancelButtonText,
    });
    return result.isConfirmed;
};

export default api;
