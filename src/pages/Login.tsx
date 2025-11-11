import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TextField } from "../components";
import { useFormData } from "../hooks/useFormData";
import { callApi } from "../api/callApi";
import { showErrorMessage, showSuccessMessage } from "../api/config";

export interface LoginUiData {
    id?: number | string;
    email: string;
    password: string;
}

export default function Login() {
    const { login, user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [remember, setRemember] = useState(true);

    const { formData, handleChange } = useFormData<LoginUiData>({
        email: "",
        password: "",
    });

    // 🔹 Redirection si déjà connecté
    useEffect(() => {
        if (user && window.location.pathname === "/login") {
            navigate("/", { replace: true });
        }
    }, [user, navigate]);

    // 🔹 Gestion du formulaire
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await login(formData.email.trim(), formData.password);

            if (result?.success) {
                showSuccessMessage(result.message || "Connexion réussie !");
                // Petite pause pour afficher le toast avant redirection
                setLoading(false);
                setTimeout(() => navigate("/", { replace: true }), 800);
            } else {
               
                showErrorMessage(result?.message || "Identifiants incorrects.");
                setLoading(false);
            }
        } catch (error) {
            setLoading(false);
            console.error("Erreur de connexion:", error);
            showErrorMessage("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="d-flex w-100 h-100 bg-light">
            <div className="container d-flex flex-column">
                <div className="row vh-100">
                    <div className="col-sm-10 col-md-8 col-lg-6 col-xl-5 mx-auto d-table h-100">
                        <div className="d-table-cell align-middle">

                            {/* Header */}
                            <div className="text-center mt-4">
                                <h1 className="h2">Bon retour 👋</h1>
                                <p className="lead">Connectez-vous pour accéder à votre tableau de bord</p>
                            </div>

                            {/* Formulaire */}
                            <div className="card shadow-sm border-0">
                                <div className="card-body p-4">
                                    <form onSubmit={handleSubmit}>
                                        <TextField
                                            label="Adresse e-mail"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            placeholder="ex: admin@gmail.com"
                                            icon="fas fa-envelope"
                                        />

                                        <TextField
                                            label="Mot de passe"
                                            name="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            placeholder="********"
                                            icon="fas fa-lock"
                                        />

                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="form-check">
                                                <input
                                                    id="remember"
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={remember}
                                                    onChange={() => setRemember(!remember)}
                                                />
                                                <label className="form-check-label text-small" htmlFor="remember">
                                                    Se souvenir de moi
                                                </label>
                                            </div>
                                            <Link to="#" className="small">
                                                Mot de passe oublié ?
                                            </Link>
                                        </div>

                                        <div className="d-grid mt-4">
                                            <button
                                                type="submit"
                                                className="btn btn-lg btn-primary"
                                                disabled={loading}
                                            >
                                                {loading ? "Connexion..." : "Se connecter"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="text-center mt-3">
                                <small>
                                    Pas encore de compte ?{" "}
                                    <Link to="#" className="fw-semibold text-decoration-none">
                                        Créer un compte
                                    </Link>
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ✅ Le container des toasts */}
            <ToastContainer
                position="top-right"
                autoClose={2500}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                pauseOnHover
                draggable
            />
        </main>
    );
}
