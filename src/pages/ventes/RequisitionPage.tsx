// src/pages/ecole/RequisitionPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
    fetchItems,
    fetchListItems,
    fetchSigleItem,
    saveItem,
    removeItem,
    showConfirmationDialog,
    formatDateFR,
    extractTime,
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
import BonRequisition from "./BonRequisition";
import RequisitionDetail from "./RequisitionDetail";

// ========================== Types ==========================
interface Requisition {
    id?: number;
    refFournisseur?: number | string;
    dateCmd?: string;
    libelle?: string;
    montant?: number;
    noms?: string;
    contact?: string;
    author?: string;
    created_at?:string;
}


interface OptionItem {
    value: string;
    label: string;
}

// ========================== Composant ==========================

export default function RequisitionPage() {
    const [datas, setDatas] = useState<Requisition[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [formData, setFormData] = useState<Partial<Requisition>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const [fournisseurs, setFournisseurs] = useState<OptionItem[]>([]);

    // Pour le modal du bon de commande
    const [showBonCommande, setShowBonCommande] = useState(false);
    const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [commandeId, setCommandeId] = useState<number | null>(null);

    // pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } =
        usePagination({ currentPage, totalPages });

    // ========================= Debounce =========================
    const debounced = useMemo(() => {
        let t: any;
        return (fn: () => void, delay = 350) => {
            clearTimeout(t);
            t = setTimeout(fn, delay);
        };
    }, []);

    // ===================== Chargement =====================
    useEffect(() => {
        loadFournisseurs();
        loadDatas();
    }, []);

    useEffect(() => {
        debounced(() => {
            setCurrentPage(1);
            loadDatas();
        });
    }, [search]);

    useEffect(() => {
        loadDatas();
    }, [currentPage]);

    const loadFournisseurs = async () => {
        try {
            const res = await fetchListItems("/fetch_list_fournisseur");
            setFournisseurs(
                (res?.data || []).map((c: any) => ({
                    value: String(c.id),
                    label: c.noms,
                }))
            );
        } catch {
            setFournisseurs([]);
        }
    };



    // ========================= Loads =========================
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<Requisition>("/fetch_vente_entete_requisition", {
                page: currentPage,
                limit,
                query: search,
            });
            setDatas(res.data);
            setTotalPages(res.lastPage);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // ===================== Handlers =====================
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = async (field: keyof Requisition, val: string) => {
        setFormData((prev) => ({ ...prev, [field]: val }));

        // if (field === "refFournisseur") {
        //     // await loadInfoPaiementEleve(val);
        // }

    };


    const openModal = () => {
        setFormData({});
        setIsEditing(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setIsEditing(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.refFournisseur) {
            showWarningMessage("Veuillez sélectionner un fournisseur.");
            return;
        }
        if (!formData.dateCmd) {
            showWarningMessage("Veuillez renseigner la date.");
            return;
        }
        if (!formData.libelle) {
            showWarningMessage("Veuillez indiquer un libellé.");
            return;
        }

        const user = getUser();
        const payload = {
            ...formData,
            author: user?.name || "Admin",
        };

        try {
            setLoading(true);
            if (isEditing && formData.id) {
                await saveItem(
                    `/update_vente_entete_requisition/${formData.id}`,
                    payload
                );
                showSuccessMessage("Réquisition modifiée avec succès !");
            } else {
                await saveItem("/insert_vente_entete_requisition", payload);
                showSuccessMessage("Réquisition ajoutée avec succès !");
            }
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
            const res = await fetchSigleItem<Requisition[]>(
                "/fetch_single_vente_entete_requisition",
                id
            );
            const row = res?.[0];
            if (row) {
                setFormData(row);
                setIsEditing(true);
                setShowModal(true);
            }
        } catch (err) {
            showErrorMessage(err);
        }
    };

    const handleDelete = async (id: number) => {
        const confirm = await showConfirmationDialog({
            title: "Supprimer ?",
            text: "Voulez-vous vraiment supprimer cette réquisition ?",
        });
        if (!confirm) return;
        try {
            await removeItem("/delete_vente_entete_requisition", id);
            showSuccessMessage("Supprimée avec succès !");
            loadDatas();
        } catch (err) {
            showErrorMessage(err);
        }
    };

    // ===================== UI =====================
    return (
        <div className="col-md-12">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">Réquisitions</h4>

            </div>

            <LoaderAndError
                loading={loading}
                error={error}
                onClearError={() => setError(null)}
            />

            <div className="d-flex justify-content-between mb-3">
                <div className="col-auto col-sm-4">
                    <div className="input-group mb-2">
                        <button
                            className="btn btn-sm btn-primary me-1"
                            onClick={() => loadDatas()}
                        >
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
                    <i className="fas fa-plus me-1" /> Nouvelle Réquisition
                </button>
            </div>


            <div className="card shadow-sm">
                <div className="card-body p-2">
                    <table className="table table-sm table-striped align-middle">
                        <thead>
                            <tr>

                                <th>Date</th>
                                <th>Fournisseur</th>
                                <th>Libellé</th>
                                <th>Montant($)</th>
                                <th>Auteur</th>
                                <th>Mise à jour</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {datas.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center text-muted">
                                        Aucune donnée trouvée
                                    </td>
                                </tr>
                            ) : (
                                datas.map((row) => (
                                    <tr key={row.id}>

                                        <td> {formatDateFR(row.dateCmd || "")}</td>
                                        <td>{row.noms}</td>
                                        <td>{row.libelle}</td>
                                        <td><b>{row.montant ?? ''}</b></td>
                                        <td>{row.author}</td>
                                        <td>
                                            {formatDateFR(row.created_at || "")} {extractTime(row.created_at || "")}
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-outline-primary me-1"
                                                onClick={() => handleEdit(row.id!)}
                                            >
                                                <i className="fas fa-edit" />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger me-1"
                                                onClick={() => handleDelete(row.id!)}
                                            >
                                                <i className="fas fa-trash" />
                                            </button>

                                            
                                            <button
                                                className="btn btn-sm btn-outline-secondary me-1"
                                                onClick={() => {
                                                    // setSelectedRequisition(row);
                                                    // setShowBonCommande(true);

                                                    setCommandeId(row.id!);
                                                    setShowDetailModal(true);
                                                }}
                                            >
                                                <i className="fas fa-file-invoice"></i>
                                            </button>

                                            <button
                                                className="btn btn-sm btn-outline-success me-1"
                                                onClick={() => {
                                                    setSelectedRequisition(row);
                                                    setShowBonCommande(true);
                                                }}
                                            >
                                                <i className="fas fa-print"></i>
                                            </button>


                                          

                                            {/* ajouter deux autres boutons detail etat de besoin et imprimer etat de besoin */}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
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

            {/* Modal Ajouter / Modifier */}
            <Modal
                title={isEditing ? "Modifier Réquisition" : "Nouvelle Réquisition"}
                show={showModal}
                onClose={closeModal}
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-12">
                            <SelectPickerField
                                label="Fournisseur"
                                name="refFournisseur"
                                icon="fas fa-user-tie"

                                value={formData.refFournisseur ? String(formData.refFournisseur) : ""}
                                options={fournisseurs}
                                onChange={(v) => setFormData((prev) => ({ ...prev, refFournisseur: v }))}

                            />
                        </div>
                        <div className="col-md-6">
                            <TextField
                                label="Date de commande"
                                name="dateCmd"
                                type="date"
                                value={formData.dateCmd || ""}
                                onChange={handleFormChange}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <TextField
                                label="Libellé"
                                name="libelle"
                                value={formData.libelle || ""}
                                onChange={handleFormChange}
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
                            Annuler
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {isEditing ? "Modifier" : "Ajouter"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* autres composants */}
            <BonRequisition
                show={showBonCommande}
                onClose={() => setShowBonCommande(false)}
                refEnteteCmd={selectedRequisition?.id}
                service="Ventes"
                title={`Bon de commande - ${selectedRequisition?.noms || ""}`}
            />

            {commandeId && (
                <RequisitionDetail
                    show={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    refEnteteCmd={commandeId}
                    title="Détails de la requisition"
                />
            )}
        </div>
    );
}
