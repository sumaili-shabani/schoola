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

/* ===============================
   🔹 INTERFACES TYPES
   =============================== */
interface Entity {
    id?: number;
    // Remplace les champs ci-dessous selon ta table
    nom?: string;
    description?: string;
    created_at?: string;
}

interface Option {
    value: string;
    label: string;
}

/* ===============================
   🔹 COMPOSANT PRINCIPAL
   =============================== */
export default function TemplatePage() {
    // ---- ÉTATS ----
    const [datas, setDatas] = useState<Entity[]>([]);
    const [formData, setFormData] = useState<Partial<Entity>>({});
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string | null>(null);

    // ---- EXEMPLE DE DROPDOWN ----
    const [options, setOptions] = useState<Option[]>([]);

    // ---- PAGINATION ----
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } =
        usePagination({
            currentPage,
            totalPages,
        });

    // ---- DEBOUNCE RECHERCHE ----
    const debounce = useMemo(() => {
        let timer: any;
        return (fn: () => void) => {
            clearTimeout(timer);
            timer = setTimeout(fn, 350);
        };
    }, []);

    /* ===============================
       🔹 CHARGEMENT DES DONNÉES
       =============================== */

    const loadOptions = async () => {
        try {
            const res = await fetchListItems("/fetch_options_endpoint");
            setOptions(
                res?.data?.map((x: any) => ({
                    value: String(x.id),
                    label: x.nom, // adapte le champ selon la table
                })) || []
            );
        } catch {
            showErrorMessage("Erreur de chargement des options");
        }
    };

    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<Entity>("/fetch_entity", {
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

    /* ===============================
       🔹 AJOUT / MODIFICATION
       =============================== */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation simple
        if (!formData.nom) {
            showErrorMessage("Veuillez remplir les champs requis");
            return;
        }

        const payload = { ...formData, id: formData.id ?? "" };
        const res = await saveItem("/insert_entity", payload);

        showSuccessMessage(res);
        setShowModal(false);
        setFormData({});
        setIsEditing(false);
        loadDatas();
    };

    /* ===============================
       🔹 ÉDITION
       =============================== */
    const handleEdit = async (id: number) => {
        setLoading(true);
        const res = await fetchSigleItem<Entity>("/fetch_single_entity", id);
        const data = Array.isArray(res) && res.length ? res[0] : undefined;
        if (!data) {
            setError("Enregistrement introuvable");
            setLoading(false);
            return;
        }

        setFormData(data);
        setIsEditing(true);
        setShowModal(true);

        // autre chargement dynamique
        
        setLoading(false);
    };

    /* ===============================
       🔹 SUPPRESSION
       =============================== */
    const handleDelete = async (id: number) => {
        const confirm = await showConfirmationDialog({
            title: "Supprimer ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });

        if (!confirm) return;
        const res = await removeItem("/delete_entity", id);
        showSuccessMessage(res);
        loadDatas();
    };

    /* ===============================
       🔹 CYCLES DE VIE
       =============================== */
    useEffect(() => {
        loadDatas();
        loadOptions();
    }, [currentPage]);

    useEffect(() => {
        debounce(() => {
            setCurrentPage(1);
            loadDatas();
        });
    }, [search]);

    /* ===============================
       🔹 UI
       =============================== */
    const openModal = () => {
        setFormData({});
        setIsEditing(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setIsEditing(false);
        setShowModal(false);
    };

    return (
        <div className="col-md-12">
            <h4>Gestion des Entités</h4>

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

            {/* Tableau de données */}
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Description</th>
                        <th>Date création</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {datas.map((d) => (
                        <tr key={d.id}>
                            <td>{d.nom}</td>
                            <td>{d.description}</td>
                            <td>
                                {formatDateFR(d.created_at || "")}{" "}
                                {extractTime(d.created_at || "")}
                            </td>
                            <td>
                                <button
                                    className="btn btn-warning btn-circle btn-sm me-1"
                                    onClick={() => handleEdit(d.id!)}
                                >
                                    <i className="fas fa-edit" />
                                </button>
                                <button
                                    className="btn btn-danger btn-circle btn-sm"
                                    onClick={() => handleDelete(d.id!)}
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

            {/* Modal d'ajout / édition */}
            <Modal
                title={isEditing ? "Modifier l'entité" : "Ajouter une entité"}
                show={showModal}
                onClose={closeModal}
            >
                <form onSubmit={handleSubmit}>
                    <SelectPickerField
                        label="Option liée"
                        name="idOption"
                        icon="fas fa-link"
                        value={(formData as any).idOption ?? ""}
                        options={options}
                        onChange={(v) =>
                            setFormData((prev) => ({ ...prev, idOption: v }))
                        }
                    />

                    <TextField
                        name="nom"
                        label="Nom"
                        value={formData.nom ?? ""}
                        onChange={(e) =>
                            setFormData({ ...formData, nom: e.target.value })
                        }
                        required
                        icon="fas fa-pen"
                    />

                    <TextField
                        name="description"
                        label="Description"
                        value={formData.description ?? ""}
                        onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                        }
                        icon="fas fa-info-circle"
                    />

                    <button className="btn btn-primary w-100 mt-2">
                        {isEditing ? "Modifier" : "Ajouter"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
