import React, { useEffect, useState, useMemo } from "react";
import {
    fetchItems,
    fetchListItems,
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
    SelectPickerField,
    Modal,
    Pagination,
    LoaderAndError,
} from "../../components";
import { usePagination } from "../../hooks/usePagination";
import LoadingSpinner from "../../components/LoadingSpinner";

// ---- Types ----
interface Rubrique {
    id?: number | string;
    desiRubriq?: string;
    codeRubriq?: string;
    refcateRubrik?: number | string;
    NomCateRubrique?: string;
    author?: string;
    created_at?: string;
}

interface Option {
    value: string;
    label: string;
}

export default function RubriquePage() {
    const [datas, setDatas] = useState<Rubrique[]>([]);
    const [formData, setFormData] = useState<Partial<Rubrique>>({});
    const [categorieOptions, setCategorieOptions] = useState<Option[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Pagination
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

    // ---- Charger les rubriques ----
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<Rubrique>("/fetch_all_rubrique", {
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

    // ---- Charger les catégories ----
    const loadCategories = async () => {
        const res = await fetchListItems("/fetch_categorie_rubrique2");
        setCategorieOptions(
            res.data.map((x: any) => ({
                value: String(x.id),
                label: x.NomCateRubrique,
            }))
        );
    };

    // ---- Ajouter / Modifier ----
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.desiRubriq || !formData.codeRubriq || !formData.refcateRubrik) {
            showErrorMessage("Tous les champs sont requis !");
            return;
        }

        const user = getUser();
        const payload = {
            ...formData,
            id: formData.id ?? "",
            author: user?.name ?? "Inconnu",
        };

        const route = isEditing
            ? `/update_rubrique/${formData.id}`
            : "/insert_rubrique";

        const res = await saveItem(route, payload);
        showSuccessMessage(res);
        setFormData({});
        setShowModal(false);
        setIsEditing(false);
        loadDatas();
    };

    // ---- Éditer ----
    const handleEdit = async (id: number) => {
        const res = await fetchSigleItem<Rubrique>("/fetch_single_rubrique", id);
        const data = Array.isArray(res) && res.length ? res[0] : undefined;
        if (!data) {
            showErrorMessage("Rubrique introuvable !");
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
        const res = await removeItem("/delete_rubrique", id);
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
        loadCategories();
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
            <h4>Rubriques Comptables</h4>

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
                        <th>Designation</th>
                        <th>Code</th>
                        <th>Catégorie</th>
                        <th>Auteur</th>
                        <th>Date création</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {datas.map((d) => (
                        <tr key={d.id}>
                            <td>{d.desiRubriq}</td>
                            <td>{d.codeRubriq}</td>
                            <td>{d.NomCateRubrique}</td>
                            <td>{d.author}</td>
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
                title={isEditing ? "Modifier Rubrique" : "Ajouter Rubrique"}
                show={showModal}
                onClose={closeModal}
            >
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Désignation"
                        name="desiRubriq"
                        value={formData.desiRubriq ?? ""}
                        onChange={(e) => setFormData({ ...formData, desiRubriq: e.target.value })}
                        required
                        icon="fas fa-book"
                    />

                    <TextField
                        label="Code Rubrique"
                        name="codeRubriq"
                        value={formData.codeRubriq ?? ""}
                        onChange={(e) => setFormData({ ...formData, codeRubriq: e.target.value })}
                        required
                        icon="fas fa-hashtag"
                    />

                    <SelectPickerField
                        label="Catégorie Rubrique"
                        name="refcateRubrik"
                        icon="fas fa-folder-tree"
                        value={formData.refcateRubrik ? String(formData.refcateRubrik) : ""}
                        options={categorieOptions}
                        required
                        onChange={(v) => setFormData({ ...formData, refcateRubrik: v })}
                    />

                    <button className="btn btn-primary w-100 mt-2">
                        {isEditing ? "Modifier" : "Ajouter"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
