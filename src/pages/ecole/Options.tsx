import React, { useState, useEffect, useMemo } from "react";
import {
    fetchItems,
    fetchListItems,
    fetchSigleItem,
    saveItem,
    removeItem,
    extractTime,
    formatDateFR,
    showConfirmationDialog,
} from "../../api/callApi";
import { showErrorMessage, showSuccessMessage } from "../../api/config";
import { usePagination } from "../../hooks/usePagination";
import {
    TextField,
    Modal,
    Pagination,
    LoaderAndError,
    SelectPickerField,
} from "../../components";
import LoadingSpinner from "../../components/LoadingSpinner";

interface OptionData {
    id?: number;
    idSection?: string | number;
    nomOption?: string;
    nomSection?: string;
    created_at?: string;
}

interface SelectOption {
    value: string;
    label: string;
}

export default function OptionPage() {
    // --- États ---
    const [datas, setDatas] = useState<OptionData[]>([]);
    const [formData, setFormData] = useState<Partial<OptionData>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [search, setSearch] = useState("");

    const [sectionOptions, setSectionOptions] = useState<SelectOption[]>([]);

    // --- Pagination ---
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } =
        usePagination({ currentPage, totalPages });

    // --- Debounce recherche ---
    const debounce = useMemo(() => {
        let timer: any;
        return (fn: () => void, delay = 350) => {
            clearTimeout(timer);
            timer = setTimeout(fn, delay);
        };
    }, []);

    // ===============================
    // 🔹 Chargement des sections
    // ===============================
    const loadSections = async () => {
        try {
            const res = await fetchListItems("/fetch_section");
            setSectionOptions(
                res.data.map((x: any) => ({
                    value: String(x.id),
                    label: x.nomSection,
                }))
            );
        } catch {
            showErrorMessage("Erreur lors du chargement des sections");
        }
    };

    // ===============================
    // 🔹 Liste des options
    // ===============================
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<OptionData>("/fetch_option", {
                page: currentPage,
                limit,
                query: search,
            });
            setDatas(res.data);
            setTotalPages(res.lastPage || 1);
        } catch {
            showErrorMessage("Erreur lors du chargement des options");
        } finally {
            setLoading(false);
        }
    };

    // ===============================
    // 🔹 Ajout / Modification
    // ===============================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nomOption || !formData.idSection) {
            showErrorMessage("Veuillez remplir tous les champs requis");
            return;
        }

        setLoading(true);
        try {
            const payload = { ...formData, id: formData.id ?? "" };
            const res = await saveItem("/insert_option", payload);
            showSuccessMessage(res);
            setShowModal(false);
            setFormData({});
            setIsEditing(false);
            loadDatas();
        } finally {
            setLoading(false);
        }
    };

    // ===============================
    // 🔹 Édition
    // ===============================
    const handleEdit = async (id: number) => {
        setLoading(true);
        try {
            const res = await fetchSigleItem<OptionData>("/fetch_single_option", id);
            const data = Array.isArray(res) && res.length ? res[0] : undefined;
            if (!data) {
                showErrorMessage("Option introuvable.");
                return;
            }
            setFormData(data);
            setIsEditing(true);
            setShowModal(true);
        } finally {
            setLoading(false);
        }
    };

    // ===============================
    // 🔹 Suppression
    // ===============================
    const handleDelete = async (id: number) => {
        const confirm = await showConfirmationDialog({
            title: "Supprimer ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });

        if (!confirm) return;
        const res = await removeItem("/delete_option", id);
        showSuccessMessage(res);
        loadDatas();
    };

    // ===============================
    // 🔹 Initialisation
    // ===============================
    useEffect(() => {
        loadSections();
        loadDatas();
    }, [currentPage]);

    useEffect(() => {
        debounce(() => {
            setCurrentPage(1);
            loadDatas();
        });
    }, [search]);

    // ===============================
    // 🔹 Gestion UI
    // ===============================
    const openModal = () => {
        setFormData({});
        setIsEditing(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setIsEditing(false);
        setShowModal(false);
    };

    // ===============================
    // 🔹 Rendu JSX
    // ===============================
    return (
        <div className="col-md-12">
            <h4>Gestion des options</h4>

            <LoaderAndError
                loading={loading}
                error={error}
                onClearError={() => setError(null)}
            />

            {/* Barre de recherche */}
            <div className="d-flex justify-content-between mb-3">
                <div className="col-auto col-sm-6">
                    <div className="input-group">
                        <button
                            className="btn btn-sm btn-primary me-1"
                            onClick={loadDatas}
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

            {/* Tableau */}
            <div className="table-responsive">
                <table className="table table-striped align-middle">
                    <thead>
                        <tr>
                            <th>Section</th>
                            <th>Option</th>
                            <th>Mise à jour</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && datas.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center text-muted">
                                    Aucune donnée trouvée
                                </td>
                            </tr>
                        )}
                        {datas.map((d) => (
                            <tr key={d.id}>
                                <td>{d.nomSection}</td>
                                <td>{d.nomOption}</td>
                                <td>
                                    {formatDateFR(d.created_at || "")}{" "}
                                    {extractTime(d.created_at || "")}
                                </td>
                                <td>
                                    <button
                                        className="btn btn-warning btn-sm me-1"
                                        onClick={() => handleEdit(d.id!)}
                                    >
                                        <i className="fas fa-edit" />
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDelete(d.id!)}
                                    >
                                        <i className="fas fa-trash" />
                                    </button>
                                </td>
                            </tr>
                        ))}
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

            {/* Modal */}
            <Modal
                title={isEditing ? "Modifier une option" : "Nouvelle option"}
                show={showModal}
                onClose={closeModal}
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-12 mb-3">
                            <SelectPickerField
                                label="Section"
                                name="idSection"
                                options={sectionOptions}
                                value={formData.idSection ? String(formData.idSection) : ""}
                                onChange={(v) =>
                                    setFormData({ ...formData, idSection: v })
                                }
                                required
                            />
                        </div>

                        <div className="col-md-12">
                            <TextField
                                label="Nom de l'option"
                                name="nomOption"
                                value={formData.nomOption ?? ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        nomOption: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-100 mt-3">
                        {isEditing ? "Modifier" : "Ajouter"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
