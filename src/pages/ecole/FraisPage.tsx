import React, { useEffect, useState, useMemo } from "react";
import {
    fetchItems,
    fetchSigleItem,
    saveItem,
    removeItem,
    showConfirmationDialog,
    extractTime,
    formatDateFR,
} from "../../api/callApi";
import {
    showErrorMessage,
    showSuccessMessage,
} from "../../api/config";
import {
    TextField,
    Modal,
    Pagination,
    LoaderAndError,
} from "../../components";
import { usePagination } from "../../hooks/usePagination";
import LoadingSpinner from "../../components/LoadingSpinner";

// ---- Types ----
interface TypeTranche {
    id?: number | string;
    nomTypeTranche?: string;
    statut?: string;
    created_at?: string;
}

export default function FraisPage() {
    // ---- États ----
    const [datas, setDatas] = useState<TypeTranche[]>([]);
    const [formData, setFormData] = useState<Partial<TypeTranche>>({});
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string | null>(null);

    // ---- Pagination ----
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } =
        usePagination({ currentPage, totalPages });

    const debounce = useMemo(() => {
        let timer: any;
        return (fn: () => void) => {
            clearTimeout(timer);
            timer = setTimeout(fn, 350);
        };
    }, []);

    // ---- Charger les données ----
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<TypeTranche>("/fetch_type_tranche", {
                page: currentPage,
                limit,
                query: search,
            });
            setDatas(res.data);
            setTotalPages(res.lastPage);
        } finally {
            setLoading(false);
        }
    };

    // ---- Ajouter / Modifier ----
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nomTypeTranche) {
            showErrorMessage("Veuillez saisir la désignation du frais !");
            return;
        }

        const payload = {
            ...formData,
            id: formData.id ?? "",
        };

        const res = await saveItem("/insert_type_tranche", payload);
        showSuccessMessage(res);
        setFormData({});
        setShowModal(false);
        setIsEditing(false);
        loadDatas();
    };

    // ---- Éditer ----
    const handleEdit = async (id: number) => {
        const res = await fetchSigleItem<TypeTranche>("/fetch_single_type_tranche", id);
        const data = Array.isArray(res) && res.length ? res[0] : undefined;
        if (!data) {
            showErrorMessage("Frais introuvable !");
            return;
        }
        setFormData(data);
        setIsEditing(true);
        setShowModal(true);
    };

    // ---- Supprimer ----
    const handleDelete = async (id: number) => {
        const confirm = await showConfirmationDialog({
            title: "Supprimer ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });
        if (!confirm) return;
        const res = await removeItem("/delete_type_tranche", id);
        showSuccessMessage(res);
        loadDatas();
    };

    // ---- Modal ----
    const openModal = () => {
        setFormData({});
        setIsEditing(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setIsEditing(false);
    };

    // ---- Initialisation ----
    useEffect(() => {
        loadDatas();
    }, [currentPage]);

    useEffect(() => {
        debounce(() => {
            setCurrentPage(1);
            loadDatas();
        });
    }, [search]);

    // ---- Rendu ----
    return (
        <div className="col-md-12">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h4>Liste des Frais / Types de Tranches</h4>
                    <p className="text-muted mb-0">Gérez vos frais et tranches de paiement</p>
                </div>

            </div>

            <LoaderAndError loading={loading} error={error} onClearError={() => setError(null)} />

            {/* Barre de recherche */}
            <div className="d-flex justify-content-between mb-3">
                <div className="col-auto col-sm-6">
                    <div className="input-group">
                        <button
                            className="btn btn-sm btn-primary me-1"
                            onClick={loadDatas}
                            id="btn-refresh"
                        >
                            <i className="fas fa-sync" />
                        </button>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Recherche…"
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

            {/* Tableau */}
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Désignation</th>
                        <th>Date création</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {datas.map((d) => (
                        <tr key={d.id}>
                            <td>{d.nomTypeTranche}</td>
                            <td>
                                {formatDateFR(d.created_at || "")}{" "}
                                {extractTime(d.created_at || "")}
                            </td>
                            <td>
                                <button
                                    className="btn btn-warning btn-circle btn-sm me-1"
                                    onClick={() => handleEdit(Number(d.id))}
                                >
                                    <i className="fas fa-edit" />
                                </button>
                                <button
                                    className="btn btn-danger btn-circle btn-sm"
                                    onClick={() => handleDelete(Number(d.id))}
                                >
                                    <i className="fas fa-trash" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

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
                title={isEditing ? "Modifier le Frais" : "Ajouter un Frais"}
                show={showModal}
                onClose={closeModal}
            >
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Nom du Frais / Type de Tranche"
                        name="nomTypeTranche"
                        value={formData.nomTypeTranche ?? ""}
                        onChange={(e) =>
                            setFormData({ ...formData, nomTypeTranche: e.target.value })
                        }
                        required
                        icon="fas fa-money-bill-wave"
                    />

                    <button className="btn btn-primary w-100 mt-2">
                        {isEditing ? "Modifier" : "Ajouter"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
