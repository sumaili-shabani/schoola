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
interface ClotureComptabilite {
    id?: number;
    dateCloture?: string;
    tauxdujour?: string | number;
    author?: string;
    created_at?: string;
}

// ========================= Component =========================
export default function ClotureComptabilitePagePage() {
    // ---- États principaux ----
    const [datas, setDatas] = useState<ClotureComptabilite[]>([]);
    const [formData, setFormData] = useState<Partial<ClotureComptabilite>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // ---- Pagination ----
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } =
        usePagination({ currentPage, totalPages });

    // ========================= Debounce recherche =========================
    const debounced = useMemo(() => {
        let timer: any;
        return (fn: () => void, delay = 400) => {
            clearTimeout(timer);
            timer = setTimeout(fn, delay);
        };
    }, []);

    // ========================= Load data =========================
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<ClotureComptabilite>(
                "/fetch_cloture_comptabilite",
                { page: currentPage, limit, query: search }
            );
            setDatas(res.data || []);
            setTotalPages(res.lastPage || 1);
        } catch (err) {
            console.error(err);
            setError("Erreur de chargement des clôtures comptables.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDatas();
    }, [currentPage]);

    useEffect(() => {
        debounced(() => {
            setCurrentPage(1);
            loadDatas();
        });
    }, [search]);

    // ========================= Form handlers =========================
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
        setShowModal(false);
        setIsEditing(false);
        setFormData({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.dateCloture) {
            showWarningMessage("Veuillez sélectionner une date de clôture.");
            return;
        }

        try {
            const user = getUser();
            let author = user?.name;
            if (!author) {
                const raw = localStorage.getItem("user");
                if (raw) {
                    const user = JSON.parse(raw);
                    author = user?.name || user?.username;
                }
            }

            const payload = { ...formData, author: author };

            const res = await saveItem("/cloturer_Comptabilite", payload);
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
            const res = await fetchSigleItem<ClotureComptabilite[]>(
                "/fetch_single_cloture_comptabilite",
                id
            );
            const data = res && res.length ? res[0] : undefined;
            if (!data) {
                showErrorMessage("Clôture introuvable.");
                return;
            }
            setFormData({
                id: data.id,
                dateCloture: data.dateCloture,
                tauxdujour: data.tauxdujour,
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
            title: "Supprimer cette clôture ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });
        if (!confirmed) return;

        try {
            const res = await removeItem("/delete_cloture_comptabilite", id);
            showSuccessMessage(res);
            loadDatas();
        } catch (err) {
            showErrorMessage(err);
        }
    };

    // ========================= Render =========================
    return (
        <div className="col-md-12">
            {/* Header */}
            <div className="page-header d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h4>Clôture comptable</h4>
                    <p className="text-muted mb-0">Gérez les opérations de clôture</p>
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
                                    <th>Date de clôture</th>
                                    <th>Taux du jour</th>
                                    <th>Auteur</th>
                                    <th>Mise à jour</th>
                                    {/* <th>Actions</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {datas.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center text-muted">
                                            Aucune clôture trouvée.
                                        </td>
                                    </tr>
                                ) : (
                                    datas.map((row) => (
                                        <tr key={row.id}>
                                            <td>{row.dateCloture}</td>
                                            <td>{row.tauxdujour}</td>
                                            <td>{row.author}</td>
                                            <td>
                                                {formatDateFR(row.created_at || "")}{" "}
                                                {extractTime(row.created_at || "")}
                                            </td>
                                            {/* <td>
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
                                            </td> */}
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
                title={
                    isEditing
                        ? "Modifier la clôture comptable"
                        : "Nouvelle clôture comptable"
                }
                show={showModal}
                onClose={closeModal}
                dimension="modal-sm"
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-12">
                            <TextField
                                label="Date de clôture"
                                name="dateCloture"
                                type="date"
                                value={formData.dateCloture || ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="col-md-12 mt-2">
                            <TextField
                                label="Taux du jour"
                                name="tauxdujour"
                                type="number"
                                value={
                                    formData.tauxdujour !== undefined
                                        ? String(formData.tauxdujour)
                                        : ""
                                }
                                onChange={handleInputChange}
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
