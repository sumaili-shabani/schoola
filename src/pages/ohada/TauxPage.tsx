import React, { useEffect, useMemo, useState } from "react";
import {
    fetchItems,
    fetchSigleItem,
    saveItem,
    removeItem,
    extractTime,
    formatDateFR,
    showConfirmationDialog,
} from "../../api/callApi";
import { getUser, showErrorMessage, showSuccessMessage } from "../../api/config";
import { usePagination } from "../../hooks/usePagination";
import {
    Modal,
    TextField,
    Pagination,
    LoaderAndError,
} from "../../components";
import LoadingSpinner from "../../components/LoadingSpinner";

interface TypeOperation {
    id?: number;
    taux?: string;
    author?: string;
    created_at?: string;
}

export default function TauxPage() {
    // ---- États ----
    const [datas, setDatas] = useState<TypeOperation[]>([]);
    const [formData, setFormData] = useState<Partial<TypeOperation>>({});
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
        usePagination({
            currentPage,
            totalPages,
        });


    // ---- Débounce ----
    const debounce = useMemo(() => {
        let timer: any;
        return (fn: () => void) => {
            clearTimeout(timer);
            timer = setTimeout(fn, 350);
        };
    }, []);

    // -------- CHARGEMENT DES DONNÉES --------
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<TypeOperation>("/fetch_vente_taux", {
                page: currentPage,
                limit,
                query: search,
            });
            setDatas(res.data);
            setTotalPages(res.lastPage);
        } catch {
            showErrorMessage("Erreur de chargement des données");
        } finally {
            setLoading(false);
        }
    };

    // -------- AJOUT / MODIFICATION --------
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.taux) {
            showErrorMessage("Veuillez saisir une désignation !");
            return;
        }

        const user = getUser();
        // console.log("user:", user);

        // ✅ Fusionner correctement les données
        const payload = {
            ...formData,
            id: formData.id ?? "",
            author: user.name ?? "Inconnu",
        };

        try {
            const res = await saveItem("/insert_vente_taux", payload);
            showSuccessMessage(res);
            setFormData({});
            setShowModal(false);
            setIsEditing(false);
            loadDatas();
        } catch (err) {
            showErrorMessage("Erreur lors de l’enregistrement");
        }
    };

    // -------- ÉDITION --------
    const handleEdit = async (id: number) => {
        setLoading(true);
        const res = await fetchSigleItem<TypeOperation>("/fetch_single_vente_taux", id);
        const data = Array.isArray(res) && res.length ? res[0] : undefined;
        if (!data) {
            setError("Type d’opération introuvable.");
            setLoading(false);
            return;
        }

        setFormData(data);
        setIsEditing(true);
        setShowModal(true);
        setLoading(false);
    };

    // -------- SUPPRESSION --------
    const handleDelete = async (id: number) => {
        const confirm = await showConfirmationDialog({
            title: "Supprimer ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });

        if (!confirm) return;
        const res = await removeItem("/delete_vente_taux", id);
        showSuccessMessage(res);
        loadDatas();
    };

    // -------- INITIALISATIONS --------
    useEffect(() => {
        loadDatas();
    }, [currentPage]);

    useEffect(() => {
        debounce(() => {
            setCurrentPage(1);
            loadDatas();
        });
    }, [search]);

    // -------- MODAL --------
    const openModal = () => {
        setFormData({});
        setIsEditing(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setIsEditing(false);
    };

    // -------- RENDU --------
    return (
        <div className="col-md-12">
            <h4>Liste des Taux</h4>

            <LoaderAndError
                loading={loading}
                error={error}
                onClearError={() => setError(null)}
            />

            {/* Barre d’action */}
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

            {/* Table */}
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Montant(CDF)</th>
                        <th>Auteur</th>
                        <th>Date création</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {datas.map((item) => (
                        <tr key={item.id}>
                            <td>{item.taux}</td>
                            <td>{item.author}</td>
                            <td>
                                {formatDateFR(item.created_at || "")}{" "}
                                {extractTime(item.created_at || "")}
                            </td>
                            <td>
                                <button
                                    className="btn btn-warning btn-sm me-1"
                                    onClick={() => handleEdit(item.id!)}
                                >
                                    <i className="fas fa-edit"></i>
                                </button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(item.id!)}
                                >
                                    <i className="fas fa-trash"></i>
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
                title={isEditing ? "Modifier le taux" : "Ajouter le taux"}
                show={showModal}
                onClose={closeModal}
            >
                <form onSubmit={handleSubmit}>
                    <TextField
                        name="taux"
                        label="Désignation"
                        icon="fas fa-cogs"
                        placeholder="Designation"
                        value={formData.taux ?? ""}
                        onChange={(e) =>
                            setFormData({ ...formData, taux: e.target.value })
                        }
                        required
                    />

                    <button className="btn btn-primary w-100 mt-2">
                        {isEditing ? "Modifier" : "Ajouter"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
