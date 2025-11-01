// ✅ callApi.ts
import axios, { AxiosRequestConfig } from "axios";
import { API_CONFIG, getToken, setToken } from "./config";

// Crée l’instance Axios
const api = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
});

// Intercepteur des requêtes — ajoute le token JWT
api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers = config.headers || {};
        (config.headers as any)["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

// Intercepteur des réponses — gestion du refresh token + redirection login
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

        // Si token expiré → tenter le refresh
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
                const { data } = await axios.post(`${API_CONFIG.baseURL}/refresh`, null, {
                    headers: { Authorization: `Bearer ${getToken()}` },
                });

                const newToken = data.access_token;
                setToken(newToken);
                processQueue(null, newToken);
                isRefreshing = false;

                (originalRequest.headers as any)["Authorization"] = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (err) {
                processQueue(err, null);
                isRefreshing = false;
                setToken(null);
                window.location.href = "/login";
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

/**
 * 🔧 Fonction générique pour exécuter des requêtes API
 */
export const callApi = async <T>(
    method: AxiosRequestConfig["method"],
    url: string,
    data?: any,
    config?: AxiosRequestConfig
): Promise<T> => {
    const response = await api.request<T>({ method, url, data, ...config });
    return response.data;
};

export default api;
