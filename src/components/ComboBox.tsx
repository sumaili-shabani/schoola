import React from 'react';

interface ComboBoxFieldProps {
    name: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    placeholder?: string;
    icon?: string;
    required?: boolean;
    label?: string;
    options: { value: string; label: string }[];
}

export default function ComboBoxField({
    name,
    value,
    onChange,
    placeholder = '-- Sélectionner --',
    icon = 'fas fa-list',
    required = false,
    label,
    options
}: ComboBoxFieldProps) {
    return (
        <div className="mb-3">
            {label && <label className="form-label">{label}</label>}
            <div className="input-group mb-3">
                <div className="input-group-prepend">
                    <span className="input-group-text">
                        <i className={icon}></i>
                    </span>
                </div>
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="form-select form-control"
                    required={required}
                >
                    <option value="" disabled>{placeholder}</option>
                    {options.map((opt, index) => (
                        <option key={index} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
