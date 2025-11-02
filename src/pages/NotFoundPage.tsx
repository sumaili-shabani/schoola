import React from 'react'
import { Link, useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    // ✅ Retourne à la page précédente
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/"); // Fallback : redirige vers le tableau de bord
    }
  };
  return (

    <div className="d-flex flex-column justify-content-center align-items-center vh-100 text-center bg-light">
      <h1 className="display-1 fw-bold text-danger">404</h1>
      <h2 className="mb-3">Page introuvable</h2>
      <p className="text-muted mb-4">
        Oups ! La page que vous recherchez n’existe pas ou a été déplacée.
      </p>
      <button onClick={handleGoBack} className="btn btn-primary">
        <i className="fas fa-arrow-left me-2"></i> Retour en arrière
      </button>
    </div>


  )
}
