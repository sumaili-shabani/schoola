import React, { useEffect, useRef } from 'react';

type ModalProps = {
    dimension?: String,
    title: string;
    show: boolean;
    onClose: () => void;
    onSave?: () => void;
    children: React.ReactNode;

};

const Modal: React.FC<ModalProps> = ({ title, show, onClose, onSave, children, dimension }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const modalElement = modalRef.current;
        if (!modalElement) return;

        if (show) {
            modalElement.classList.add('show');
            modalElement.style.display = 'block';
            document.body.classList.add('modal-open');
        } else {
            modalElement.classList.remove('show');
            modalElement.style.display = 'none';
            document.body.classList.remove('modal-open');
        }

        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [show]);

    return (
        <div className="modal fade" tabIndex={-1} role="dialog" ref={modalRef} style={{ display: 'none' }} id="exampleModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
            <div className={'modal-dialog ' + dimension +' modal-dialog-centered'} role="document">
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">{title}</h5>
                        
                        <button type="button" className="btn-close btn-sm btn-close-white text-white " onClick={onClose} >
                            
                        </button>
                    </div>
                    <div className="modal-body">{children}</div>
                   
                </div>
            </div>
        </div>
    );
};

export default Modal;
