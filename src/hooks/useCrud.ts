import { useState, useCallback } from "react";
import { callApi } from "../api/callApi";
import { toast } from "react-toastify";

/**
 * 🔧 Hook générique de gestion CRUD
 * - Compatible avec ton backend Laravel
 * - Gère les erreurs (API, SQL, réseau, syntaxe)
 * - Supporte la création, mise à jour, suppression, récupération
 */

export interface CrudState<T> {
    data: T[];
    loading: boolean;
    error: string | null;
    current?: T | null;
}

export const useCrud = <T>(endpoint: string) => {
    const [state, setState] = useState<CrudState<T>>({
        data: [],
        loading: false,
        error: null,
        current: null,
    });

    const handleError = (error: any) => {
        console.error("❌ API Error:", error);

        let message = "Erreur inconnue.";

        if (error.response) {
            // Erreur venant de Laravel ou de la base de données
            const apiError = error.response.data;

            if (apiError?.message) message = apiError.message;
            else if (apiError?.error) message = apiError.error;
            else if (typeof apiError === "string") message = apiError;
            else message = "Erreur côté serveur.";

            if (apiError?.errors) {
                const firstError = Object.values(apiError.errors)[0] as string[];
                message = firstError?.[0] || message;
            }
        } else if (error.message?.includes("Network Error")) {
            message = "Problème de connexion au serveur.";
        } else if (error instanceof SyntaxError) {
            message = "Erreur de syntaxe dans le code.";
        }

        toast.error(message);
        setState((prev) => ({ ...prev, loading: false, error: message }));
    };

    const fetchAll = useCallback(async () => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const data = await callApi<T[]>("get", endpoint);
            setState((prev) => ({ ...prev, data, loading: false }));
        } catch (error: any) {
            handleError(error);
        }
    }, [endpoint]);

    const create = async (payload: any) => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            await callApi("post", endpoint, payload);
            toast.success("Ajout réussi !");
            fetchAll();
        } catch (error: any) {
            handleError(error);
        }
    };

    const update = async (id: number | string, payload: any) => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            await callApi("post", `${endpoint}/${id}`, payload);
            toast.success("Mise à jour réussie !");
            fetchAll();
        } catch (error: any) {
            handleError(error);
        }
    };

    const remove = async (id: number | string) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cet élément ?")) return;
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            await callApi("delete", `${endpoint}/${id}`);
            toast.success("Suppression réussie !");
            fetchAll();
        } catch (error: any) {
            handleError(error);
        }
    };

    const setCurrent = (item: T | null) => setState((prev) => ({ ...prev, current: item }));

    return {
        ...state,
        fetchAll,
        create,
        update,
        remove,
        setCurrent,
    };
};

export default useCrud;
