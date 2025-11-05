import React from 'react';
import Select from 'react-select';

interface Option {
    value: string;
    label: string;
}

interface SelectPickerFieldProps {
    name: string;
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    label?: string;
    icon?: string;
    isClearable?: boolean;
    required?: boolean;
}

export default function SelectPickerField({
    name,
    value,
    onChange,
    options,
    placeholder = '-- Sélectionner --',
    label,
    icon = 'fas fa-list',
    isClearable = true,
    required = false,
}: SelectPickerFieldProps) {
    const selectedOption = options.find(opt => opt.value === value) || null;

    const handleChange = (selected: Option | null) => {
        onChange(selected ? selected.value : '');
    };

    return (
        <div className="mb-3">
            {label && <label className="form-label">{label}</label>}
            <div className="input-group mb-3" style={{ width: "100%" }}>
                <span className="input-group-text">
                    <i className={icon}></i>
                </span>
                <div style={{ flexGrow: 1 }}>
                    <Select
                        name={name}
                        value={selectedOption}
                        onChange={handleChange}
                        options={options}
                        placeholder={placeholder}
                        isClearable={isClearable}
                        required={required}
                        classNamePrefix="react-select"
                        className="react-select"

                    />
                </div>
            </div>
        </div>
    );
}
