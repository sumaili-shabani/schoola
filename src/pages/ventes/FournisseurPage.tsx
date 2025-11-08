import React, { useEffect, useMemo, useState } from "react";
import {
    fetchItems,
    fetchSigleItem,
    saveItem,
    removeItem,
    showConfirmationDialog,
    formatDateFR,
    extractTime,
} from "../../api/callApi";
import {
    getUser,
    showErrorMessage,
    showSuccessMessage,
    showWarningMessage,
} from "../../api/config";
import { usePagination } from "../../hooks/usePagination";
import {
    LoaderAndError,
    Modal,
    Pagination,
    TextField,
} from "../../components";
import LoadingSpinner from "../../components/LoadingSpinner";

// ========================= Types =========================
interface Fournisseur {
    id?: number;
    noms?: string;
    contact?: string;
    mail?: string;
    adresse?: string;
    author?: string;
    created_at?: string;
}

// ========================= Component =========================
export default function FournisseurPage() {
    // Table
    const [datas, setDatas] = useState<Fournisseur[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // Form
    const [formData, setFormData] = useState<Partial<Fournisseur>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } =
        usePagination({ currentPage, totalPages });

    // ========================= Debounce search =========================
    const debounced = useMemo(() => {
        let t: any;
        return (fn: () => void, delay = 350) => {
            clearTimeout(t);
            t = setTimeout(fn, delay);
        };
    }, []);

    // ========================= Load Data =========================
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<Fournisseur>("/fetch_fournisseur", {
                page: currentPage,
                limit,
                query: search,
            });
            setDatas(res.data || []);
            setTotalPages(res.lastPage || 1);
        } catch (err) {
            console.error(err);
            setError("Erreur lors du chargement des fournisseurs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDatas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    useEffect(() => {
        debounced(() => {
            setCurrentPage(1);
            loadDatas();
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    useEffect(() => {
        loadDatas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ========================= Form Handlers =========================
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const openModal = () => {
        setFormData({});
        setIsEditing(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setFormData({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.noms || !formData.contact || !formData.mail || !formData.adresse) {
            showWarningMessage("Tous les champs sont obligatoires.");
            return;
        }

        // Récup auteur comme en Vue (this.userData.name)
        const user = getUser();
        let author = user?.name;
        try {
            if (!author) {
                const raw = localStorage.getItem("user");
                if (raw) {
                    const user = JSON.parse(raw);
                    author = user?.name || "";
                }
            }
        } catch {
            // ignore
        }

        const payload: Fournisseur = {
            ...formData,
            author: author,
        };



        try {
            const res = await saveItem("/insert_fournisseur", payload);
            showSuccessMessage(res);
            closeModal();
            loadDatas();
        } catch (err) {
            showErrorMessage(err);
        }
    };

    const handleEdit = async (id: number) => {
        try {
            setLoading(true);
            const res = await fetchSigleItem<Fournisseur[]>(
                "/fetch_single_fournisseur",
                id
            );
            const data = res && res.length ? res[0] : undefined;
            if (!data) {
                showErrorMessage("Fournisseur introuvable.");
                return;
            }
            setFormData({
                id: data.id,
                noms: data.noms,
                contact: data.contact,
                mail: data.mail,
                adresse: data.adresse,
                author: data.author,
            });
            setIsEditing(true);
            setShowModal(true);
        } catch (err) {
            showErrorMessage(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = await showConfirmationDialog({
            title: "Supprimer ce fournisseur ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });
        if (!confirmed) return;

        try {
            const res = await removeItem("/delete_fournisseur", id);
            showSuccessMessage(res);
            loadDatas();
        } catch (err) {
            showErrorMessage(err);
        }
    };

    const handleRefresh = () => {
        loadDatas();
    };

    // ========================= Render =========================
    return (
        <div className="col-md-12">
            {/* Header */}
            <div className="page-header d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h4>Fournisseurs</h4>
                    <p className="text-muted mb-0">Gérez vos fournisseurs</p>
                </div>
                <div className="d-flex gap-2">
                  
                </div>
            </div>

            {/* Recherche */}
            <div className="d-flex justify-content-between mb-3">
                <div className="col-auto col-sm-4">
                    <div className="input-group mb-2">
                        <button
                            className="btn btn-sm btn-primary me-1"
                            onClick={() => loadDatas()}
                        >
                            <i className="fas fa-sync"></i>
                        </button>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Recherche..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <LoadingSpinner loading={loading} />
                    </div>
                </div>

                <button className="btn btn-primary btn-sm" onClick={openModal}>
                    <i className="fas fa-plus me-1" /> Ajouter
                </button>
            </div>


            <LoaderAndError
                loading={loading}
                error={error}
                onClearError={() => setError(null)}
            />

            {/* Table */}
            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-striped align-middle">
                            <thead>
                                <tr>
                                    <th>Nom complet</th>
                                    <th>Téléphone</th>
                                    <th>E-mail</th>
                                    <th>Adresse</th>
                                    <th>Mise à jour</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datas.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center text-muted">
                                            Aucun fournisseur trouvé.
                                        </td>
                                    </tr>
                                ) : (
                                    datas.map((row) => (
                                        <tr key={row.id}>
                                            <td>{row.noms}</td>
                                            <td>{row.contact}</td>
                                            <td>{row.mail}</td>
                                            <td>{row.adresse}</td>
                                            <td>
                                                {formatDateFR(row.created_at || "")}{" "}
                                                {extractTime(row.created_at || "")}
                                            </td>
                                            <td>
                                                <div className="btn-group">
                                                    <button
                                                        className="btn btn-warning btn-sm me-1"
                                                        onClick={() => handleEdit(row.id!)}
                                                        title="Modifier"
                                                    >
                                                        <i className="fas fa-edit" />
                                                    </button>

                                                    {/* Décommenter si tu veux activer la suppression comme dans le Vue d’origine */}
                                                    {/* 
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(row.id!)}
                                                        title="Supprimer"
                                                    >
                                                        <i className="fas fa-trash" />
                                                    </button>
                                                    */}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        paginationRange={paginationRange}
                        isCurrentPage={isCurrentPage}
                        isFirstPage={isFirstPage}
                        isLastPage={isLastPage}
                        onPageChange={setCurrentPage}
                        textCounter
                    />
                </div>
            </div>

            {/* Modal */}
            <Modal
                title={isEditing ? "Modifier le fournisseur" : "Ajouter un fournisseur"}
                show={showModal}
                onClose={closeModal}
                dimension="modal-sm"
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-12 mb-2">
                            <TextField
                                label="Nom complet"
                                name="noms"
                                value={formData.noms || ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="col-md-12 mb-2">
                            <TextField
                                label="Adresse complète"
                                name="adresse"
                                value={formData.adresse || ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="col-md-12 mb-2">
                            <TextField
                                label="Téléphone"
                                name="contact"
                                value={formData.contact || ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="col-md-12 mb-2">
                            <TextField
                                label="E-mail"
                                name="mail"
                                type="email"
                                value={formData.mail || ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-end mt-3">
                        <button
                            type="button"
                            className="btn btn-light me-2"
                            onClick={closeModal}
                        >
                            Fermer
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {isEditing ? "Modifier" : "Ajouter"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
