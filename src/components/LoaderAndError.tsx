import React from 'react';

interface LoaderAndErrorProps {
    loading: boolean;
    error: string | null;
    onClearError?: () => void;
}

const LoaderAndError: React.FC<LoaderAndErrorProps> = ({ loading, error, onClearError }) => {
    return (
        <>
            {loading && (
                <div className="text-center mb-3">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={onClearError}></button>
                </div>
            )}
        </>
    );
};

export default LoaderAndError;
