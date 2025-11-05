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
    value: SingleValue | MultiValue;
    onChange: (value: SingleValue | MultiValue) => void;
    placeholder?: string;
    icon?: string;
    required?: boolean;
    label?: string;
    options: ChoiceOption[];
    isMultiple?: boolean;
    disabled?: boolean;
    searchEnabled?: boolean;
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
    searchEnabled = true,
    searchPlaceholderValue,
}: ChoiceSelectFieldProps) {
    const selectRef = useRef<HTMLSelectElement | null>(null);
    const choicesRef = useRef<Choices | null>(null);

    const isSelected = (optVal: SingleValue): boolean => {
        if (Array.isArray(value)) return value.map(String).includes(String(optVal));
        return String(value ?? "") === String(optVal);
    };

    // Init Choices
    useEffect(() => {
        if (!selectRef.current) return;

        const element = selectRef.current;

        const choices = new Choices(element, {
            searchEnabled,
            searchPlaceholderValue,
            itemSelectText: "",
            removeItemButton: isMultiple,
            placeholder: true,
            placeholderValue: placeholder,
            shouldSort: false,
            allowHTML: false,
        });

        choicesRef.current = choices;

        // Add listener DOM
        const handler = (e: any) => {
            const target = e.target as HTMLSelectElement;
            if (isMultiple) {
                const vals = Array.from(target.selectedOptions).map(o => o.value);
                onChange(vals);
            } else {
                onChange(target.value);
            }
        };
        element.addEventListener("change", handler);

        return () => {
            element.removeEventListener("change", handler);
            try { choices.destroy(); } catch { }
            choicesRef.current = null;
        };
    }, []);

    // Sync options + selection
    useEffect(() => {
        const inst = choicesRef.current;
        if (!inst) return;

        try {
            inst.clearChoices();
            inst.setChoices(
                options.map(opt => ({
                    value: String(opt.value),
                    label: opt.label,
                    selected: isSelected(opt.value),
                })),
                "value",
                "label",
                true
            );
        } catch { }
    }, [options, value]);

    return (
        <div className="mb-3 w-100">
            {label && <label className="form-label">{label}</label>}
            <div className="input-group" style={{ width: "100%" }}>
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
                    className="form-select w-100"
                    style={{ width: "100%" }}
                >
                    {!isMultiple && <option value="">{placeholder}</option>}
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
