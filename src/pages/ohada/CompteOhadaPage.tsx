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
import { showErrorMessage, showSuccessMessage, getUser } from "../../api/config";
import { TextField, SelectPickerField, Modal, Pagination, LoaderAndError } from "../../components";
import { usePagination } from "../../hooks/usePagination";
import LoadingSpinner from "../../components/LoadingSpinner";

// ---- Types ----
interface Compte {
    id?: number | string;
    refClasse?: number | string;
    refTypecompte?: number | string;
    refPosition?: number | string;
    nom_compte?: string;
    numero_compte?: string;

    nom_classe?: string;
    nom_typecompte?: string;
    nom_typeposition?: string;

    author?: string;
    created_at?: string;
}

interface Option {
    value: string;
    label: string;
}

// ---- Composant principal ----
export default function CompteOhadaPage() {
    const [datas, setDatas] = useState<Compte[]>([]);
    const [formData, setFormData] = useState<Partial<Compte>>({});
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string | null>(null);

    // ---- Dropdowns ----
    const [classeOptions, setClasseOptions] = useState<Option[]>([]);
    const [typeCompteOptions, setTypeCompteOptions] = useState<Option[]>([]);
    const [positionOptions, setPositionOptions] = useState<Option[]>([]);

    // ---- Pagination ----
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } = usePagination({
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

    // ---- Chargement des données principales ----
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<Compte>("/fetch_comptefin", {
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

    // ---- Chargement des listes ----
    const loadClasse = async () => {
        const res = await fetchListItems("/fetch_fin_classe_2");
        setClasseOptions(res.data.map((x: any) => ({ value: String(x.id), label: x.nom_classe })));
    };

    const loadTypeCompte = async () => {
        const res = await fetchListItems("/fetch_fin_typecompte_2");
        setTypeCompteOptions(res.data.map((x: any) => ({ value: String(x.id), label: x.nom_typecompte })));
    };

    const loadPosition = async () => {
        const res = await fetchListItems("/fetch_fin_typeposition_2");
        setPositionOptions(res.data.map((x: any) => ({ value: String(x.id), label: x.nom_typeposition })));
    };

    // ---- Ajout / Modification ----
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nom_compte || !formData.numero_compte) {
            showErrorMessage("Veuillez remplir tous les champs requis !");
            return;
        }

        const user = getUser();
        const payload = {
            ...formData,
            id: formData.id ?? "",
            author: user?.name ?? "Inconnu",
        };

        const route = isEditing ? `/update_comptefin/${formData.id}` : "/insert_comptefin";
        const res = await saveItem(route, payload);
        showSuccessMessage(res);
        setShowModal(false);
        setFormData({});
        setIsEditing(false);
        loadDatas();
    };

    // ---- Édition ----
    const handleEdit = async (id: number) => {
        const res = await fetchSigleItem<Compte>("/fetch_single_compte", id);
        const data = Array.isArray(res) && res.length ? res[0] : undefined;
        if (!data) {
            showErrorMessage("Compte introuvable !");
            return;
        }
        setFormData(data);
        setIsEditing(true);
        setShowModal(true);
    };

    // ---- Suppression ----
    const handleDelete = async (id: number) => {
        const confirm = await showConfirmationDialog({
            title: "Supprimer ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });
        if (!confirm) return;
        const res = await removeItem("/delete_comptefin", id);
        showSuccessMessage(res);
        loadDatas();
    };

    // ---- Initialisation ----
    useEffect(() => {
        loadDatas();
        loadClasse();
        loadTypeCompte();
        loadPosition();
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

    // ---- Rendu ----
    return (
        <div className="col-md-12">
            <h4>Plan Comptable OHADA</h4>

            <LoaderAndError loading={loading} error={error} onClearError={() => setError(null)} />

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

            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Designation</th>
                        <th>Numéro Compte</th>
                        <th>Classe</th>
                        <th>Type Compte</th>
                        <th>Position</th>
                        <th>Date création</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {datas.map((d) => (
                        <tr key={d.id}>
                            <td>{d.nom_compte}</td>
                            <td>{d.numero_compte}</td>
                            <td>{d.nom_classe}</td>
                            <td>{d.nom_typecompte}</td>
                            <td>{d.nom_typeposition}</td>
                            <td>
                                {formatDateFR(d.created_at || "")} {extractTime(d.created_at || "")}
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

            <Modal title={isEditing ? "Modifier Compte" : "Ajouter Compte"} show={showModal} onClose={closeModal}>
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Désignation"
                        name="nom_compte"
                        value={formData.nom_compte ?? ""}
                        onChange={(e) => setFormData({ ...formData, nom_compte: e.target.value })}
                        required
                        icon="fas fa-file"
                    />

                    <TextField
                        label="Numéro Compte"
                        name="numero_compte"
                        value={formData.numero_compte ?? ""}
                        onChange={(e) => setFormData({ ...formData, numero_compte: e.target.value })}
                        required
                        icon="fas fa-hashtag"
                    />

                    <SelectPickerField
                        label="Classe"
                        name="refClasse"
                        icon="fas fa-layer-group"
                        value={formData.refClasse ? String(formData.refClasse) : ""}
                        options={classeOptions}
                        required
                        onChange={(v) => setFormData({ ...formData, refClasse: v })}
                    />

                    <SelectPickerField
                        label="Type Compte"
                        name="refTypecompte"
                        icon="fas fa-sitemap"
                        value={formData.refTypecompte ? String(formData.refTypecompte) : ""}
                        options={typeCompteOptions}
                        required
                        onChange={(v) => setFormData({ ...formData, refTypecompte: v })}
                    />

                    <SelectPickerField
                        label="Position"
                        name="refPosition"
                        icon="fas fa-map-marker-alt"
                        value={formData.refPosition ? String(formData.refPosition) : ""}
                        options={positionOptions}
                        required
                        onChange={(v) => setFormData({ ...formData, refPosition: v })}
                    />

                    <button className="btn btn-primary w-100 mt-2">
                        {isEditing ? "Modifier" : "Ajouter"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
