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
interface CatCours {
    id?: number;
    nomCatCours?: string;
    created_at?: string;
}

// ========================= Component =========================
export default function CatCoursPage() {
    // ---- États UI ----
    const [datas, setDatas] = useState<CatCours[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // ---- Form ----
    const [formData, setFormData] = useState<Partial<CatCours>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // ---- Pagination ----
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } =
        usePagination({ currentPage, totalPages });

    // ========================= Debounce =========================
    const debounced = useMemo(() => {
        let t: any;
        return (fn: () => void, delay = 400) => {
            clearTimeout(t);
            t = setTimeout(fn, delay);
        };
    }, []);

    // ========================= Load Data =========================
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<CatCours>("/fetch_cat_cours", {
                page: currentPage,
                limit,
                query: search,
            });
            setDatas(res.data);
            setTotalPages(res.lastPage);
        } catch (error) {
            console.error(error);
            setError("Erreur lors du chargement des catégories de cours.");
        } finally {
            setLoading(false);
        }
    };

    // ========================= Effets =========================
    useEffect(() => {
        loadDatas();
    }, [currentPage]);

    useEffect(() => {
        debounced(() => {
            setCurrentPage(1);
            loadDatas();
        });
    }, [search]);

    // ========================= Handlers =========================
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const openModal = () => {
        setFormData({});
        setIsEditing(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setFormData({});
        setIsEditing(false);
        setShowModal(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nomCatCours || formData.nomCatCours.trim() === "") {
            showWarningMessage("Veuillez renseigner le nom de la catégorie.");
            return;
        }
        try {
            const res = await saveItem("/insert_cat_cours", formData);
            showSuccessMessage(res);
            closeModal();
            loadDatas();
        } catch (error) {
            showErrorMessage(error);
        }
    };

    const handleEdit = async (id: number) => {
        try {
            setLoading(true);
            const res = await fetchSigleItem<CatCours[]>("/fetch_single_cat_cours", id);
            const data = res && res.length ? res[0] : undefined;
            if (!data) {
                showErrorMessage("Catégorie introuvable.");
                return;
            }
            setFormData(data);
            setIsEditing(true);
            setShowModal(true);
        } catch (error) {
            showErrorMessage(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = await showConfirmationDialog({
            title: "Supprimer cette catégorie ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });
        if (!confirmed) return;
        try {
            const res = await removeItem("/delete_cat_cours", id);
            showSuccessMessage(res);
            loadDatas();
        } catch (error) {
            showErrorMessage(error);
        }
    };

    // ========================= Render =========================
    return (
        <div className="col-md-12">
            <h4 className="mb-3">Gestion des Catégories de Cours</h4>

            <LoaderAndError loading={loading} error={error} onClearError={() => setError(null)} />

            {/* Recherche + Ajout */}
            <div className="d-flex justify-content-between mb-3">
                <div className="col-auto col-sm-4">
                    <div className="input-group mb-2">
                        <button className="btn btn-sm btn-primary me-1" onClick={loadDatas}>
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
                    <i className="fas fa-plus me-1"></i> Ajouter
                </button>
            </div>

            {/* Tableau */}
            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-striped align-middle">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Nom de la catégorie</th>
                                    <th>Date de création</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datas.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center text-muted">
                                            Aucune catégorie trouvée
                                        </td>
                                    </tr>
                                ) : (
                                    datas.map((row, index) => (
                                        <tr key={row.id}>
                                            <td>{index + 1}</td>
                                            <td>{row.nomCatCours}</td>
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
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(row.id!)}
                                                        title="Supprimer"
                                                    >
                                                        <i className="fas fa-trash" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
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

            {/* Modal Ajout / Édition */}
            <Modal
                title={isEditing ? "Modifier la catégorie" : "Nouvelle catégorie"}
                show={showModal}
                onClose={closeModal}
                dimension="modal-md"
            >
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Nom de la catégorie"
                        name="nomCatCours"
                        icon="fas fa-book"
                        value={formData.nomCatCours || ""}
                        onChange={handleInputChange}
                        required
                    />
                    <div className="d-flex justify-content-end mt-3">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {isEditing ? "Modifier" : "Ajouter"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
