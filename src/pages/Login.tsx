import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { TextField } from "../components";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";

import { useFormData } from "../hooks/useFormData";

export interface LoginUiData {
    id?: number | string | any;
    email: string;
    password: string;
}


export default function Login() {
    const { login, user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [remember, setRemember] = useState(true);


    const { formData, handleChange } = useFormData<LoginUiData>({
        id: "",
        email: "",
        password: "",
    });

  

    // Si déjà connecté, redirection vers le dashboard
    useEffect(() => {
        if (user) navigate("/", { replace: true });
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await login(formData.email, formData.password);

        if (result.success) {
            toast.success(result.message || "Connexion réussie !");
            navigate("/", { replace: true });
        } else {
            toast.error(result.message || "Identifiants incorrects.");
        }

        setLoading(false);
    };

    return (
        <main className="d-flex w-100 h-100">
            <div className="container d-flex flex-column">
                <div className="row vh-100">
                    <div className="col-sm-10 col-md-8 col-lg-6 col-xl-5 mx-auto d-table h-100">
                        <div className="d-table-cell align-middle">
                            <div className="text-center mt-4">
                                <h1 className="h2">Bon retour 👋</h1>
                                <p className="lead">Connectez-vous pour accéder à votre tableau de bord</p>
                            </div>

                            <div className="card shadow-sm">
                                <div className="card-body">
                                    <div className="m-sm-3">
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
                                                <Link to="/forgot" className="small">
                                                    Mot de passe oublié ?
                                                </Link>
                                            </div>

                                            <div className="d-grid gap-2 mt-3">
                                                <button className="btn btn-lg btn-primary" disabled={loading}>
                                                    {loading ? "Connexion..." : "Se connecter"}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center mt-3">
                                <small>
                                    Pas encore de compte ? <Link to="#">Créer un compte</Link>
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </main>
    );
}
