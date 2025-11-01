import React from 'react';

interface TextAreaFieldProps {
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    icon?: string;
    required?: boolean;
    label?: string;
    rows?: number;
}

export default function TextAreaFild({
    name,
    value,
    onChange,
    placeholder = '',
    icon = 'fas fa-text-width',
    required = false,
    label,
    rows = 1
}: TextAreaFieldProps) {
    return (
        <div className="mb-3">
            {label && <label className="form-label">{label}</label>}
            <div className="input-group mb-3">
                <span className="input-group-text">
                    <i className={icon}></i>
                </span>
                <textarea
                    className="form-control"
                    aria-label={label || 'input'}
                    aria-describedby="basic-addon1"
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    rows={rows}
                />
            </div>
        </div>
    );
}
