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
interface Banque {
    id?: number | string;
    nom_banque?: string;
    numerocompte?: string;
    nom_mode?: string;
    refCompte?: number | string;
    refSousCompte?: number | string;
    refSscompte?: number | string;
    nom_ssouscompte?: string;
    numero_ssouscompte?: string;
    author?: string;
    created_at?: string;
}

interface Option {
    value: string;
    label: string;
}

export default function BanqueOhadaPage() {
    const [datas, setDatas] = useState<Banque[]>([]);
    const [formData, setFormData] = useState<Partial<Banque>>({});
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Dropdowns
    const [modeOptions, setModeOptions] = useState<Option[]>([]);
    const [compteOptions, setCompteOptions] = useState<Option[]>([]);
    const [sousCompteOptions, setSousCompteOptions] = useState<Option[]>([]);
    const [ssousCompteOptions, setSSousCompteOptions] = useState<Option[]>([]);

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

    // ---- Charger les données principales ----
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<Banque>("/fetch_banque", {
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

    // ---- Charger les listes dépendantes ----
    const loadModePaiement = async () => {
        const res = await fetchListItems("/fetch_tconf_modepaie_2");
        setModeOptions(
            res.data.map((x: any) => ({
                value: String(x.designation),
                label: x.designation,
            }))
        );
    };

    const loadComptes = async () => {
        const res = await fetchListItems("/fetch_compte2");
        setCompteOptions(
            res.data.map((x: any) => ({
                value: String(x.id),
                label: x.nom_compte,
            }))
        );
    };

    const loadSousComptes = async (refCompte: string | number) => {
        if (!refCompte) {
            setSousCompteOptions([]);
            return;
        }
        const res = await fetchListItems(`/fetch_souscompte_compte2/${refCompte}`);
        setSousCompteOptions(
            res.data.map((x: any) => ({
                value: String(x.id),
                label: x.nom_souscompte,
            }))
        );
    };

    const loadSSousComptes = async (refSousCompte: string | number) => {
        if (!refSousCompte) {
            setSSousCompteOptions([]);
            return;
        }
        const res = await fetchListItems(`/fetch_ssouscompte_sous2/${refSousCompte}`);
        setSSousCompteOptions(
            res.data.map((x: any) => ({
                value: String(x.id),
                label: x.nom_ssouscompte,
            }))
        );
    };

    // ---- Ajouter / Modifier ----
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (
            !formData.nom_banque ||
            !formData.numerocompte ||
            !formData.nom_mode ||
            !formData.refCompte ||
            !formData.refSousCompte ||
            !formData.refSscompte
        ) {
            showErrorMessage("Veuillez remplir tous les champs requis !");
            return;
        }

        const user = getUser();
        const payload = {
            ...formData,
            id: formData.id ?? "",
            author: user.name ?? "Inconnu",
        };

        const res = await saveItem("/insert_banque", payload);
        showSuccessMessage(res);
        setFormData({});
        setShowModal(false);
        setIsEditing(false);
        loadDatas();
    };

    // ---- Éditer ----
    const handleEdit = async (id: number) => {
        const res = await fetchSigleItem<Banque>("/fetch_single_banque", id);
        const data = Array.isArray(res) && res.length ? res[0] : undefined;
        if (!data) {
            showErrorMessage("Banque introuvable !");
            return;
        }

        await loadSousComptes(data.refCompte ?? "");
        await loadSSousComptes(data.refSousCompte ?? "");

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
        const res = await removeItem("/delete_banque", id);
        showSuccessMessage(res);
        loadDatas();
    };

    // -------- MODAL --------
    const openModal = () => {
        setFormData({});
        setIsEditing(false);
        setSousCompteOptions([]);
        setSSousCompteOptions([]);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setIsEditing(false);
    };

    // ---- Initialisation ----
    useEffect(() => {
        loadDatas();
        loadModePaiement();
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
            <h4>Caisse / Banque OHADA</h4>

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
                        <th>Banque / Caisse</th>
                        <th>N° Compte</th>
                        <th>Mode Paiement</th>
                        <th>Sous-Sous Compte</th>
                        <th>N° SSCompte</th>
                        <th>Auteur</th>
                        <th>Date création</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {datas.map((d) => (
                        <tr key={d.id}>
                            <td>{d.nom_banque}</td>
                            <td>{d.numerocompte}</td>
                            <td>{d.nom_mode}</td>
                            <td>{d.nom_ssouscompte}</td>
                            <td>{d.numero_ssouscompte}</td>
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
                title={isEditing ? "Modifier Caisse/Banque" : "Ajouter Caisse/Banque"}
                show={showModal}
                onClose={closeModal}
            >
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Nom Banque / Caisse"
                        name="nom_banque"
                        value={formData.nom_banque ?? ""}
                        onChange={(e) => setFormData({ ...formData, nom_banque: e.target.value })}
                        required
                        icon="fas fa-university"
                    />

                    <TextField
                        label="Numéro de Compte"
                        name="numerocompte"
                        value={formData.numerocompte ?? ""}
                        onChange={(e) => setFormData({ ...formData, numerocompte: e.target.value })}
                        required
                        icon="fas fa-hashtag"
                    />

                    <SelectPickerField
                        label="Mode de Paiement"
                        name="nom_mode"
                        icon="fas fa-credit-card"
                        value={formData.nom_mode ?? ""}
                        options={modeOptions}
                        required
                        onChange={(v) => setFormData({ ...formData, nom_mode: v })}
                    />

                    <SelectPickerField
                        label="Compte"
                        name="refCompte"
                        icon="fas fa-layer-group"
                        value={formData.refCompte ? String(formData.refCompte) : ""}
                        options={compteOptions}
                        required
                        onChange={(v) => {
                            setFormData({ ...formData, refCompte: v });
                            loadSousComptes(v);
                        }}
                    />

                    <SelectPickerField
                        label="Sous-Compte"
                        name="refSousCompte"
                        icon="fas fa-sitemap"
                        value={formData.refSousCompte ? String(formData.refSousCompte) : ""}
                        options={sousCompteOptions}
                        required
                        onChange={(v) => {
                            setFormData({ ...formData, refSousCompte: v });
                            loadSSousComptes(v);
                        }}
                    />

                    <SelectPickerField
                        label="Sous-Sous Compte"
                        name="refSscompte"
                        icon="fas fa-diagram-project"
                        value={formData.refSscompte ? String(formData.refSscompte) : ""}
                        options={ssousCompteOptions}
                        required
                        onChange={(v) => setFormData({ ...formData, refSscompte: v })}
                    />

                    <button className="btn btn-primary w-100 mt-2">
                        {isEditing ? "Modifier" : "Ajouter"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
