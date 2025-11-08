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
    getUser,
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
import ApproDetailEntrees from "./ApproDetailEntrees";
import BonEntree from "./BonEntree";
// import VenteDetailEntrees from "./VenteDetailEntrees";
// import BonEntree from "./BonEntree";

// ==================== Types ====================
interface Approvisionnement {
    id?: number;
    refFournisseur?: number | string;
    dateEntree?: string;
    libelle?: string;
    author?: string;
    noms?: string;
    contact?: string;
    montant?: number;
}

interface Fournisseur {
    id: number;
    noms: string;
    contact: string;
}

export default function ApprovisionnementPage() {
    const [datas, setDatas] = useState<Approvisionnement[]>([]);
    const [formData, setFormData] = useState<Partial<Approvisionnement>>({});
    const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);

    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } =
        usePagination({ currentPage, totalPages });

    // sous-modals
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [fournisseurName, setFournisseurName] = useState("");

    const [showBon, setShowBon] = useState(false);
    const [selectedEntreeId, setSelectedEntreeId] = useState<number | null>(null);


    // debounce recherche
    const debounced = useMemo(() => {
        let t: any;
        return (fn: () => void, delay = 350) => {
            clearTimeout(t);
            t = setTimeout(fn, delay);
        };
    }, []);

    // ==================== UseEffects ====================
    useEffect(() => {
        loadDatas();
        loadFournisseurs();
    }, [currentPage]);

    useEffect(() => {
        debounced(() => {
            setCurrentPage(1);
            loadDatas();
        });
    }, [search]);

    // ==================== Loaders ====================
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<Approvisionnement>(
                "/fetch_vente_entete_entree",
                { page: currentPage, limit, query: search }
            );
            setDatas(res.data || []);
            setTotalPages(res.lastPage || 1);
        } catch {
            setError("Erreur lors du chargement des approvisionnements.");
        } finally {
            setLoading(false);
        }
    };

    const loadFournisseurs = async () => {
        try {
            const res = await fetchListItems("/fetch_list_fournisseur");
            setFournisseurs(res?.data || []);
        } catch {
            showErrorMessage("Erreur lors du chargement des fournisseurs.");
        }
    };

    // ==================== Formulaire ====================
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.refFournisseur)
            return showWarningMessage("Sélectionnez un fournisseur.");
        if (!formData.dateEntree)
            return showWarningMessage("La date d’entrée est obligatoire.");
        if (!formData.libelle)
            return showWarningMessage("Veuillez indiquer le libellé.");

        const user = getUser();
        const payload = { ...formData, author: user?.name || "Admin" };

        try {
            setLoading(true);
            if (isEditing) {
                await saveItem(`/update_vente_entete_entree/${formData.id}`, payload);
                showSuccessMessage("Approvisionnement modifié avec succès !");
            } else {
                await saveItem("/insert_vente_entete_entree", payload);
                showSuccessMessage("Approvisionnement ajouté avec succès !");
            }
            closeModal();
            loadDatas();
        } catch {
            showErrorMessage("Erreur lors de l’enregistrement.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: Approvisionnement) => {
        setFormData(item);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        const confirm = await showConfirmationDialog({
            title: "Supprimer cet approvisionnement ?",
            text: "Cette action est irréversible.",
        });
        if (!confirm) return;
        try {
            await removeItem("/delete_vente_entete_entree", id);
            showSuccessMessage("Supprimé !");
            loadDatas();
        } catch {
            showErrorMessage("Erreur lors de la suppression.");
        }
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

    // ==================== UI ====================
    return (
        <div className="container-fluid mt-3">
            <h4 className="mb-3">Liste des Approvisionnements</h4>

            <LoaderAndError loading={loading} error={error} />

            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="input-group w-25">
                    <button className="btn btn-sm btn-outline-primary" onClick={loadDatas}>
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

                <button className="btn btn-primary btn-sm" onClick={openModal}>
                    <i className="fas fa-plus me-1"></i> Ajouter
                </button>
            </div>

            <table className="table table-bordered table-sm align-middle">
                <thead className="table-light">
                    <tr>
                        <th>N°BE</th>
                        <th>Date Entrée</th>
                        <th>Fournisseur</th>
                        <th>Téléphone</th>
                        <th>Libellé</th>
                        <th>Montant ($)</th>
                        <th>Author</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {datas.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="text-center text-muted">
                                Aucun approvisionnement trouvé
                            </td>
                        </tr>
                    ) : (
                        datas.map((item) => (
                            <tr key={item.id}>
                                <td>#{item.id}</td>
                                <td>{formatDateFR(item.dateEntree || "")} </td>
                                <td>{item.noms}</td>
                                <td>{item.contact}</td>
                                <td>{item.libelle}</td>
                                <td>{item.montant}$</td>
                                <td>{item.author}</td>
                                <td>
                                    <button
                                        className="btn btn-outline-info btn-sm me-2"
                                        onClick={() => {
                                            setSelectedId(item.id!);
                                            setShowDetailModal(true);
                                            setFournisseurName(item.noms || "");
                                        }}
                                    >
                                        <i className="fas fa-list"></i>
                                    </button>
                                    <button
                                        className="btn btn-outline-secondary btn-sm me-2"
                                        onClick={() => {
                                            setSelectedEntreeId(item.id!);          // ID du bon à imprimer
                                            setFournisseurName(item.noms || "");    // Nom du fournisseur
                                            setShowBon(true);                       // Ouvre le modal
                                        }}
                                    >
                                        <i className="fas fa-print"></i>
                                    </button>
                                    <button
                                        className="btn btn-outline-primary btn-sm me-2"
                                        onClick={() => handleEdit(item)}
                                    >
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => handleDelete(item.id!)}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
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

            {/* Modal d’ajout / édition */}
            <Modal
                title={isEditing ? "Modifier un approvisionnement" : "Nouvel approvisionnement"}
                show={showModal}
                onClose={closeModal}
                dimension="modal-md"
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-12 mb-2">
                            <SelectPickerField
                                label="Fournisseur"
                                name="refFournisseur"
                                options={fournisseurs.map((f) => ({
                                    value: String(f.id),
                                    label: f.noms,
                                }))}
                                value={formData.refFournisseur ? String(formData.refFournisseur) : ""}
                                required
                                onChange={(v) => setFormData((p) => ({ ...p, refFournisseur: v }))}
                            />
                        </div>

                        <div className="col-md-6">
                            <TextField
                                type="date"
                                label="Date d’entrée"
                                name="dateEntree"
                                value={formData.dateEntree || ""}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <TextField
                                label="Libellé"
                                name="libelle"
                                value={formData.libelle || ""}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-end mt-3">
                        <button
                            type="button"
                            className="btn btn-outline-secondary me-2"
                            onClick={closeModal}
                        >
                            Fermer
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {isEditing ? "Modifier" : "Ajouter"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal détail d’entrée */}
            {selectedId && (
                <ApproDetailEntrees
                    show={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    refEnteteEntree={selectedId}
                    title={`Détails d’entrée - ${fournisseurName}`}
                />
            )}

            {/* Bon d’entrée imprimable */}
            {selectedId && (
                <BonEntree
                    show={showBon}
                    onClose={() => setShowBon(false)}
                    refEnteteEntree={selectedId}
                    title={`Bon d’entrée - ${fournisseurName}`}
                />
            )}
        </div>
    );
}
