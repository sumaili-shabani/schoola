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
    getUser,
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
interface CategorieRubrique {
    id?: number | string;
    NomCateRubrique?: string;
    author?: string;
    created_at?: string;
}

export default function CategorieRubriquePage() {
    // ---- États ----
    const [datas, setDatas] = useState<CategorieRubrique[]>([]);
    const [formData, setFormData] = useState<Partial<CategorieRubrique>>({});
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
            const res = await fetchItems<CategorieRubrique>("/fetch_all_catRubrique", {
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

        if (!formData.NomCateRubrique) {
            showErrorMessage("Veuillez saisir une désignation !");
            return;
        }

        const user = getUser();
        const payload = {
            ...formData,
            id: formData.id ?? "",
            author: user?.name ?? "Inconnu",
        };

        const res = await saveItem("/insert_catRubrique", payload);
        showSuccessMessage(res);
        setFormData({});
        setShowModal(false);
        setIsEditing(false);
        loadDatas();
    };

    // ---- Éditer ----
    const handleEdit = async (id: number) => {
        const res = await fetchSigleItem<CategorieRubrique>("/fetch_single_catRubrique", id);
        const data = Array.isArray(res) && res.length ? res[0] : undefined;
        if (!data) {
            showErrorMessage("Catégorie introuvable !");
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
        const res = await removeItem("/delete_catRubrique", id);
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
            <h4>Catégories Rubriques</h4>

            <LoaderAndError loading={loading} error={error} onClearError={() => setError(null)} />

            {/* Barre de recherche */}
            <div className="d-flex justify-content-between mb-3">
                <div className="col-auto col-sm-6">
                    <div className="input-group">
                        <button className="btn btn-sm btn-primary me-1" onClick={loadDatas}>
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
                            <td>{d.NomCateRubrique}</td>
                           
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
                title={isEditing ? "Modifier Catégorie Rubrique" : "Ajouter Catégorie Rubrique"}
                show={showModal}
                onClose={closeModal}
            >
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Désignation"
                        name="NomCateRubrique"
                        value={formData.NomCateRubrique ?? ""}
                        onChange={(e) =>
                            setFormData({ ...formData, NomCateRubrique: e.target.value })
                        }
                        required
                        icon="fas fa-folder-open"
                    />

                    <button className="btn btn-primary w-100 mt-2">
                        {isEditing ? "Modifier" : "Ajouter"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
