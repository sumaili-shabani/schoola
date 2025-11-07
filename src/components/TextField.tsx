import React from 'react';

interface TextFieldProps {
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    icon?: string;
    required?: boolean;
    disabled?:boolean;
    label?: string;
    type?:string;
}

export default function TextField({
    name,
    value,
    onChange,
    placeholder = '',
    icon = 'fas fa-text-width',
    required = false,
    disabled = false,
    label,
    type='text'
}: TextFieldProps) {
    return (
        <div className="mb-3">
            {label && <label className="form-label">{label}</label>}
            <div className="input-group mb-3">
                <span className="input-group-text">
                    <i className={icon}></i>
                </span>
                <input
                    type={type}
                    className="form-control"
                    aria-label={label || 'input'}
                    aria-describedby="basic-addon1"
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                />
            </div>






        </div>
    );
}
