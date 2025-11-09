import React, { useEffect, useMemo, useState } from "react";
import {
    fetchItems,
    fetchSigleItem,
    saveItem,
    removeItem,
    showConfirmationDialog,
    formatDateFR,
    extractTime,
    fetchListItems,
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
interface Periode {
    id?: number;
    nomPeriode?: string;
    statutPeriode?: number;
    created_at?: string;
}

// ========================= Component =========================
export default function PeriodePage() {
    // États principaux
    const [datas, setDatas] = useState<Periode[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // Formulaire
    const [formData, setFormData] = useState<Partial<Periode>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } =
        usePagination({ currentPage, totalPages });

    // ========================= Debounce Recherche =========================
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
            const res = await fetchItems<Periode>("/fetch_periode", {
                page: currentPage,
                limit,
                query: search,
            });
            setDatas(res.data);
            setTotalPages(res.lastPage);
        } catch (err) {
            console.error(err);
            setError("Erreur lors du chargement des périodes.");
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
        setShowModal(false);
        setIsEditing(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nomPeriode || formData.nomPeriode.trim() === "") {
            showWarningMessage("Veuillez saisir le nom de la période.");
            return;
        }
        try {
            const res = await saveItem("/insert_periode", formData);
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
            const res = await fetchSigleItem<Periode[]>("/fetch_single_periode", id);
            const data = res && res.length ? res[0] : undefined;
            if (!data) {
                showErrorMessage("Période introuvable.");
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
            title: "Supprimer cette période ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });
        if (!confirmed) return;
        try {
            const res = await removeItem("/delete_periode", id);
            showSuccessMessage(res);
            loadDatas();
        } catch (error) {
            showErrorMessage(error);
        }
    };

    const toggleEtat = async (id: number, statut: number) => {
        try {
            const res = await fetchListItems(`/chect_etat_periode/${id}/${statut}`);
            showSuccessMessage(res.data);
            loadDatas();
        } catch (error) {
            showErrorMessage("Erreur lors du changement d’état.");
        }
    };

    // ========================= Render =========================
    return (
        <div className="col-md-12">
            <h4 className="mb-3">Gestion des Périodes</h4>

            <LoaderAndError loading={loading} error={error} onClearError={() => setError(null)} />

            {/* Recherche et bouton */}
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
                                    <th>Nom de la période</th>
                                    <th>Statut</th>
                                    <th>Créé le</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datas.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center text-muted">
                                            Aucune période trouvée
                                        </td>
                                    </tr>
                                ) : (
                                    datas.map((row, index) => (
                                        <tr key={row.id}>
                                            <td>{index + 1}</td>
                                            <td>{row.nomPeriode}</td>
                                            <td>
                                                {row.statutPeriode === 1 ? (
                                                    <span className="badge bg-success">Active</span>
                                                ) : (
                                                    <span className="badge bg-secondary">Inactive</span>
                                                )}
                                            </td>
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
                                                        className="btn btn-danger btn-sm me-1"
                                                        onClick={() => handleDelete(row.id!)}
                                                        title="Supprimer"
                                                    >
                                                        <i className="fas fa-trash" />
                                                    </button>
                                                    <button
                                                        className="btn btn-info btn-sm"
                                                        onClick={() =>
                                                            toggleEtat(row.id!, row.statutPeriode!)
                                                        }
                                                        title="Activer/Désactiver"
                                                    >
                                                        <i className="fas fa-toggle-on" />
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

            {/* Modal */}
            <Modal
                title={isEditing ? "Modifier la période" : "Nouvelle période"}
                show={showModal}
                onClose={closeModal}
                dimension="modal-md"
            >
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Nom de la période"
                        name="nomPeriode"
                        value={formData.nomPeriode || ""}
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
