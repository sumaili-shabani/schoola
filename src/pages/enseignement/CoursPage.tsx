import React, { useEffect, useMemo, useState } from "react";
import {
    fetchItems,
    fetchListItems,
    fetchSigleItem,
    saveItem,
    removeItem,
    showConfirmationDialog,
    formatDateFR,
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
    SelectPickerField,
} from "../../components";
import LoadingSpinner from "../../components/LoadingSpinner";

// ========================= Types =========================
interface Cours {
    id?: number;
    nomCours?: string;
    idCatCours?: number | string;
    nomCatCours?: string;
    created_at?: string;
}

interface OptionItem {
    value: string;
    label: string;
}

// ========================= Component =========================
export default function CoursPage() {
    // Table
    const [datas, setDatas] = useState<Cours[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // Formulaire
    const [formData, setFormData] = useState<Partial<Cours>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Catégories
    const [catCoursOptions, setCatCoursOptions] = useState<OptionItem[]>([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } =
        usePagination({ currentPage, totalPages });

    // ========================= Debounce recherche =========================
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
            const res = await fetchItems<Cours>("/fetch_cours", {
                page: currentPage,
                limit,
                query: search,
            });
            setDatas(res.data);
            setTotalPages(res.lastPage);
        } catch (e) {
            setError("Erreur lors du chargement des cours");
        } finally {
            setLoading(false);
        }
    };


    const loadCategories = async () => {
        try {
            const res = await fetchListItems("/fetch_cat_cours_2");
            setCatCoursOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.id),
                    label: x.nomCatCours,
                }))
            );
        } catch {
            setCatCoursOptions([]);
        }
    };

    // ========================= Effects =========================

    useEffect(() => {
        debounced(() => {
            setCurrentPage(1);
            loadDatas();
        });
    }, [search]);


    useEffect(() => {
        loadCategories();
        loadDatas();
    }, [currentPage]);

    

    // ========================= Handlers =========================
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };



    const handleSelectChange = async (field: keyof Cours, val: string) => {
        setFormData((prev) => ({ ...prev, [field]: val }));

        // if (field === "idSection") {
        //     setOptionOptions([]);
        //     setFormData((prev) => ({ ...prev, idOption: "" }));
        //     await loadOptionsBySection(val);
        // }
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
        if (!formData.nomCours || !formData.idCatCours) {
            showWarningMessage("Veuillez remplir tous les champs obligatoires.");
            return;
        }
        setLoading(true);
        try {
            const res = await saveItem("/insert_cours", formData);
            showSuccessMessage(res);
            closeModal();
            loadDatas();
        } catch (err) {
            showErrorMessage(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (id: number) => {
        try {
            setLoading(true);
            const res = await fetchSigleItem<Cours[]>("/fetch_single_cours", id);
            const data = res && res.length ? res[0] : undefined;
            if (!data) {
                showErrorMessage("Cours introuvable.");
                return;
            }
            setFormData(data);
            setIsEditing(true);
            setShowModal(true);
            // précharger options par section
            // if (data.idSection) await loadOptionsBySection(data.idSection);
        } catch (error) {
            showErrorMessage(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = await showConfirmationDialog({
            title: "Supprimer ce cours ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });
        if (!confirmed) return;
        try {
            const res = await removeItem("/delete_cours", id);
            showSuccessMessage(res);
            loadDatas();
        } catch (err) {
            showErrorMessage(err);
        }
    };

    const handleRefresh = () => {
        setSearch("");
        loadDatas();
    };

    // ========================= Render =========================
    return (
        <div className="col-md-12">
            <h4 className="mb-3">
                <i className="fas fa-book me-2"></i> Gestion des Cours
            </h4>

            <LoaderAndError loading={loading} error={error} onClearError={() => setError(null)} />

            {/* Barre de recherche */}
            <div className="d-flex justify-content-between mb-3">
                <div className="col-auto col-sm-4">
                    <div className="input-group mb-2">
                        <button className="btn btn-sm btn-primary me-1" onClick={handleRefresh}>
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
                                    <th>Nom du cours</th>
                                    <th>Catégorie</th>
                                    <th>Date de création</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datas.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center text-muted">
                                            Aucun cours trouvé
                                        </td>
                                    </tr>
                                ) : (
                                    datas.map((row, i) => (
                                        <tr key={row.id}>
                                            <td>{row.nomCours}</td>
                                            <td>{row.nomCatCours}</td>
                                            <td>{formatDateFR(row.created_at || "")}</td>
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

            {/* Modal Ajout / Edition */}
            <Modal
                title={isEditing ? "Modifier le cours" : "Nouveau cours"}
                show={showModal}
                onClose={closeModal}
                dimension="modal-md"
            >
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Nom du cours"
                        name="nomCours"
                        icon="fas fa-book"
                        value={formData.nomCours || ""}
                        onChange={handleInputChange}
                        required
                    />
                    <SelectPickerField
                        label="Catégorie de cours"
                        name="idCatCours"
                        icon="fas fa-list"
                        value={formData.idCatCours ? String(formData.idCatCours) : ""}
                        options={catCoursOptions}
                        onChange={(v) => handleSelectChange("idCatCours", v)}
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
