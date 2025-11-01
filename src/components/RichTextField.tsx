import React from 'react';
import { Editor } from 'primereact/editor';


interface RichTextFieldProps {
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<any>) => void;
    placeholder?: string;
    icon?: string;
    required?: boolean;
    label?: string;
}

export default function RichTextField({
    name,
    value,
    onChange,
    placeholder = '',
    icon = 'fas fa-text-width',
    required = false,
    label,
}: RichTextFieldProps) {
    const handleEditorChange = (content: string) => {
        const event = {
            target: {
                name,
                value: content,
            }
        } as React.ChangeEvent<any>;
        onChange(event);
    };

    return (
        <div className="mb-3">
            {label && <label className="form-label">{label}</label>}
            <div className="input-group">
                <div className="input-group-prepend">
                    <span className="input-group-text">
                        <i className={icon}></i>
                    </span>
                </div>
                <div className="form-control form-control-sm bg-white text-dark dark:bg-zinc-800 dark:text-white p-0" 
                style={{ minHeight: '144px' }}>
                    <Editor
                        value={value}
                        onTextChange={(e) => handleEditorChange(e.htmlValue || '')}
                        placeholder={placeholder}
                        style={{ height: '100px', minHeight: '10px', maxHeight: '150px' }}
                        
                    />
                </div>
            </div>

            {/* <div dangerouslySetInnerHTML={{ __html: formData.description }} /> */}
        </div>
    );
}
