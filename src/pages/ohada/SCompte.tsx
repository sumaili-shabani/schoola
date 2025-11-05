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
interface SousCompte {
    id?: number | string;
    refCompte?: number | string;
    nom_souscompte?: string;
    numero_souscompte?: string;
    nom_compte?: string;
    nom_classe?: string;
    nom_typecompte?: string;
    author?: string;
    created_at?: string;
}

interface Option {
    value: string;
    label: string;
}

// ---- Composant principal ----
export default function SousCompteOhadaPage() {
    const [datas, setDatas] = useState<SousCompte[]>([]);
    const [formData, setFormData] = useState<Partial<SousCompte>>({});
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [compteOptions, setCompteOptions] = useState<Option[]>([]);

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

    // ---- Charger les données principales ----
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<SousCompte>("/fetch_souscomptefin", {
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

    // ---- Charger la liste des comptes ----
    const loadComptes = async () => {
        const res = await fetchListItems("/fetch_compte2");
        setCompteOptions(
            res.data.map((x: any) => ({
                value: String(x.id),
                label: x.nom_compte,
            }))
        );
    };

    // ---- Ajouter / Modifier ----
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nom_souscompte || !formData.numero_souscompte || !formData.refCompte) {
            showErrorMessage("Veuillez remplir tous les champs requis !");
            return;
        }

        const user = getUser();
        const payload = {
            ...formData,
            id: formData.id ?? "",
            author: user?.name ?? "Inconnu",
        };

        const route = isEditing
            ? `/update_souscomptefin/${formData.id}`
            : "/insert_souscomptefin";

        const res = await saveItem(route, payload);
        showSuccessMessage(res);
        setShowModal(false);
        setFormData({});
        setIsEditing(false);
        loadDatas();
    };

    // ---- Éditer ----
    const handleEdit = async (id: number) => {
        const res = await fetchSigleItem<SousCompte>("/fetch_single_souscompte", id);
        const data = Array.isArray(res) && res.length ? res[0] : undefined;
        if (!data) {
            showErrorMessage("Sous compte introuvable !");
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
        const res = await removeItem("/delete_souscomptefin", id);
        showSuccessMessage(res);
        loadDatas();
    };

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

    // ---- Initialisation ----
    useEffect(() => {
        loadDatas();
        loadComptes();
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
            <h4>Plan Comptable OHADA — Sous Comptes</h4>

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
                        <th>Numéro Sous Compte</th>
                        <th>Compte</th>
                        <th>Classe</th>
                        <th>Type Compte</th>
                       
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {datas.map((d) => (
                        <tr key={d.id}>
                            <td>{d.nom_souscompte}</td>
                            <td>{d.numero_souscompte}</td>
                            <td>{d.nom_compte}</td>
                            <td>{d.nom_classe}</td>
                            <td>{d.nom_typecompte}</td>
                            
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

            <Modal
                title={isEditing ? "Modifier Sous Compte" : "Ajouter Sous Compte"}
                show={showModal}
                onClose={closeModal}
            >
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Désignation"
                        name="nom_souscompte"
                        value={formData.nom_souscompte ?? ""}
                        onChange={(e) =>
                            setFormData({ ...formData, nom_souscompte: e.target.value })
                        }
                        required
                        icon="fas fa-file"
                    />

                    <TextField
                        label="Numéro Sous Compte"
                        name="numero_souscompte"
                        value={formData.numero_souscompte ?? ""}
                        onChange={(e) =>
                            setFormData({ ...formData, numero_souscompte: e.target.value })
                        }
                        required
                        icon="fas fa-hashtag"
                    />

                    <SelectPickerField
                        label="Compte"
                        name="refCompte"
                        icon="fas fa-layer-group"
                        value={formData.refCompte ? String(formData.refCompte) : ""}
                        options={compteOptions}
                        required
                        onChange={(v) => setFormData({ ...formData, refCompte: v })}
                    />

                    <button className="btn btn-primary w-100 mt-2">
                        {isEditing ? "Modifier" : "Ajouter"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
