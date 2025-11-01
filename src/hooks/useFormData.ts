import { useState, ChangeEvent } from "react";

/**
 * Hook générique pour gérer les formulaires contrôlés.
 * - Typé en TS
 * - Supporte auto-parse number
 * - Compatible avec inputs et selects
 */
export function useFormData<T extends Record<string, any>>(initialState: T) {
    const [formData, setFormData] = useState<T>(initialState);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]:
                type === "number" || name.startsWith("id")
                    ? parseInt(value) || 0
                    : value,
        }));
    };

    const resetForm = () => setFormData(initialState);

    return { formData, setFormData, handleChange, resetForm };
}
