import React from 'react'
interface LoaderProps {
    loading: boolean;
}
export default function LoadingSpinner({ loading = false }: LoaderProps) {
    return (
       <>
            {loading && (<div className="text-center mb-3">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>)}
       </>
  )
}
