// ✅ Bien importer le type officiel
import { MultiSelect, Option } from 'react-multi-select-component';

interface MultiSelectFieldProps {
    name: string;
    value: Option[];
    onChange: (selected: Option[]) => void;
    placeholder?: string;
    icon?: string;
    required?: boolean;
    label?: string;
    options: Option[];
}

export default function MultiSelectField({
    name,
    value,
    onChange,
    placeholder = '-- Sélectionner --',
    icon = 'fas fa-list',
    required = false,
    label,
    options,
}: MultiSelectFieldProps) {
    return (
        <div className="mb-3">
            {label && <label className="form-label">{label}</label>}
            <div className="input-group mb-3">
                <div className="input-group-prepend">
                    <span className="input-group-text">
                        <i className={icon}></i>
                    </span>
                </div>
                <div className="flex-grow-1">
                    <MultiSelect
                        options={options}
                        value={value}
                        onChange={onChange}
                        labelledBy={name}
                        overrideStrings={{ selectSomeItems: placeholder }}
                        hasSelectAll={false}
                    />
                </div>
            </div>
        </div>
    );
}
