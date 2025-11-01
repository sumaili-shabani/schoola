import React, { useEffect, useRef } from "react";
import Choices from "choices.js";

type SingleValue = string | number;
type MultiValue = Array<string | number>;

interface ChoiceOption {
    value: SingleValue;
    label: string;
}

interface ChoiceSelectFieldProps {
    name: string;
    /** valeur contrôlée : string|number en simple, array en multiple */
    value: SingleValue | MultiValue;
    /** onChange reçoit string|number (simple) ou array (multiple) */
    onChange: (value: SingleValue | MultiValue) => void;
    placeholder?: string;
    icon?: string;
    required?: boolean;
    label?: string;
    options: ChoiceOption[];
    isMultiple?: boolean;
    disabled?: boolean;

    /** Recherche Choices.js (true par défaut = auto recherche activée) */
    searchEnabled?: boolean;
    /** Texte du champ de recherche (optionnel) */
    searchPlaceholderValue?: string;
}

export default function ChoiceSelectField({
    name,
    value,
    onChange,
    placeholder = "-- Sélectionner --",
    icon = "fas fa-list",
    required = false,
    label,
    options,
    isMultiple = false,
    disabled = false,
    searchEnabled = true,            // ✅ active la recherche
    searchPlaceholderValue,          // optionnel
}: ChoiceSelectFieldProps) {
    const selectRef = useRef<HTMLSelectElement | null>(null);
    const choicesRef = useRef<Choices | null>(null);

    // -- Helpers pour convertir vers/depuis <select> HTML (qui n'accepte que string ou string[])
    const toDomValue = (val: SingleValue | MultiValue): string | string[] => {
        if (Array.isArray(val)) return val.map(v => String(v));
        return String(val ?? "");
    };
    const isSelected = (optVal: SingleValue): boolean => {
        if (Array.isArray(value)) return value.map(String).includes(String(optVal));
        return String(value ?? "") === String(optVal);
    };

    // Initialisation de Choices.js
    useEffect(() => {
        if (!selectRef.current) return;

        choicesRef.current = new Choices(selectRef.current, {
            searchEnabled,                    // ✅ recherche activée
            searchPlaceholderValue,
            itemSelectText: "",
            removeItemButton: isMultiple,     // bouton de suppression pour multiple
            placeholder: true,
            placeholderValue: placeholder,
            shouldSort: false,
            duplicateItemsAllowed: false,
        });

        return () => {
            choicesRef.current?.destroy();
            choicesRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMultiple, placeholder, searchEnabled, searchPlaceholderValue]);

    // Mettre à jour les options + sélection à chaque changement de props
    useEffect(() => {
        if (!choicesRef.current) return;

        // Remet la liste des choix en respectant la sélection courante
        choicesRef.current.clearChoices();
        choicesRef.current.setChoices(
            options.map((opt) => ({
                value: String(opt.value),
                label: opt.label,
                selected: isSelected(opt.value),
                disabled: false,
                customProperties: {},
            })),
            "value",
            "label",
            true
        );
    }, [options, value]); // quand options ou value changent, on resynchronise

    // Gestion du changement (simple/multiple)
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (isMultiple) {
            const vals = Array.from(e.target.selectedOptions).map(o => o.value);
            // on retourne un tableau (string[])
            onChange(vals);
        } else {
            onChange(e.target.value);
        }
    };

    return (
        <div className="mb-3">
            {label && <label className="form-label">{label}</label>}
            <div className="input-group">
                {icon && (
                    <span className="input-group-text">
                        <i className={icon}></i>
                    </span>
                )}

                <select
                    ref={selectRef}
                    name={name}
                    required={required}
                    multiple={isMultiple}
                    disabled={disabled}
                    // IMPORTANT : <select> DOM attend string ou string[]
                    value={toDomValue(value)}
                    onChange={handleChange}
                    className="form-select form-control"
                >
                    {!isMultiple && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((opt, idx) => (
                        <option key={idx} value={String(opt.value)}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
