// src/pages/ecole/VentePage.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
    fetchItems,
    fetchListItems,
    fetchSigleItem,
    saveItem,
    removeItem,
    showConfirmationDialog,
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
import VenteDetailVente from "./VenteDetailVente";
import FactureVente from "./FactureVente";
import VentePaiement from "./VentePaiement";

interface Vente {
    id?: number;
    refClient?: number | string;
    dateVente?: string;
    libelle?: string;
    noms?: string;
    contact?: string;
    totalFacture?: number;
    totalPaie?: number;
    RestePaie?: number;
    author?: string;
}

interface Client {
    id: number;
    Noms: string;
}

export default function VentePage() {
    const [datas, setDatas] = useState<Vente[]>([]);
    const [formData, setFormData] = useState<Partial<Vente>>({});
    const [clients, setClients] = useState<Client[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // ✅ variables pour les détails de vente
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [venteId, setVenteId] = useState<number | null>(null);
    const [venteName, setVenteName] = useState<string>("");

    const [showFacture, setShowFacture] = useState(false);
    const [factureId, setFactureId] = useState<number | null>(null);

    const [showPaiementModal, setShowPaiementModal] = useState(false);
  


    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } =
        usePagination({ currentPage, totalPages });

    // Debounce recherche
    const debounced = useMemo(() => {
        let t: any;
        return (fn: () => void, delay = 350) => {
            clearTimeout(t);
            t = setTimeout(fn, delay);
        };
    }, []);

    // ==================== LOAD ====================
    useEffect(() => {
        loadDatas();
        loadClients();
    }, [currentPage]);

    useEffect(() => {
        debounced(() => {
            setCurrentPage(1);
            loadDatas();
        });
    }, [search]);

    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<Vente>("/fetch_vente_entete_vente", {
                page: currentPage,
                limit,
                query: search,
            });
            setDatas(res.data || []);
            setTotalPages(res.lastPage || 1);
        } catch (e) {
            setError("Erreur lors du chargement des ventes.");
        } finally {
            setLoading(false);
        }
    };

    const loadClients = async () => {
        try {
            const res = await fetchListItems("/fetch_inscription_2");
            setClients(res?.data || []);
        } catch (e) {
            showErrorMessage("Erreur lors du chargement des clients.");
        }
    };

    // ==================== FORM ====================
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (field: keyof Vente, val: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: val }));
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
        if (!formData.refClient) return showWarningMessage("Sélectionnez un client.");
        if (!formData.dateVente) return showWarningMessage("La date est obligatoire.");

        const user = getUser();
        const payload = {
            ...formData,
            libelle: "Vente des produits",
            author: user?.name || "Admin",
        };

        try {
            // console.log("payload: ", payload);
            if (isEditing) {

                setLoading(true);
                await saveItem("/update_vente_entete_vente/" + payload.id, payload);
                showSuccessMessage("Vente enregistrée avec succès !");
                closeModal();
                loadDatas();

            } else {
                setLoading(true);
                await saveItem("/insert_vente_entete_vente", payload);
                showSuccessMessage("Vente enregistrée avec succès !");
                closeModal();
                loadDatas();

            }

        } catch (err) {
            showErrorMessage(err);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Fonction pour ouvrir le modal de détail
    const openDetailVente = (id: number, name: string) => {
        console.log(`id: ${id} name:${name}`);
        setVenteId(id);
        setVenteName(name);
        setShowDetailModal(true);
    };

    const handleEdit = async (id: number) => {
        try {
            const res = await fetchSigleItem<Vente[]>("/fetch_single_vente_entete_vente", id);
            const data = res && res.length ? res[0] : undefined;
            if (!data) return showErrorMessage("Vente introuvable.");

            setFormData(data);

            setIsEditing(true);
            setShowModal(true);
        } catch (err) {
            showErrorMessage(err);
        }
    };

    const handleDelete = async (id: number) => {
        const confirm = await showConfirmationDialog({
            title: "Supprimer cette vente ?",
            text: "Cette action est irréversible.",
        });
        if (!confirm) return;
        try {
            await removeItem("/delete_vente_entete_vente", id);
            showSuccessMessage("Vente supprimée !");
            loadDatas();
        } catch (err) {
            showErrorMessage(err);
        }
    };

    // ==================== UI ====================
    return (
        <div className="col-md-12">
            <h4 className="mb-3">Liste des ventes</h4>

            <LoaderAndError loading={loading} error={error} />

            {/* Recherche + bouton */}
            <div className="d-flex justify-content-between mb-3 align-items-center">
                <div className="col-auto col-sm-6">
                    <div className="input-group mb-2">
                        <button className="btn btn-sm btn-primary me-2" onClick={() => loadDatas()} title="Initialiser">
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
                    <i className="fas fa-plus me-1" /> Ajouter
                </button>
            </div>
            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-striped align-middle">
                            <thead>
                                <tr>
                                    <th>N° Facture</th>
                                    <th>Date Vente</th>
                                    <th>Client</th>

                                    <th>Libellé</th>
                                    <th>Total</th>
                                    <th>Payé</th>
                                    <th>Solde</th>
                                    <th>Author</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datas.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="text-center text-muted">
                                            Aucune donnée trouvée
                                        </td>
                                    </tr>
                                ) : (
                                    datas.map((item) => (
                                        <tr key={item.id}>
                                            <td>#{item.id}</td>
                                            <td>{item.dateVente}</td>
                                            <td>{item.noms}</td>

                                            <td>{item.libelle}</td>
                                            <td>{item.totalFacture ?? 0}$</td>
                                            <td>{item.totalPaie ?? 0}$</td>
                                            <td>{item.RestePaie ?? 0}$</td>
                                            <td>{item.author}</td>
                                            <td>
                                                <div className="btn-group">
                                                    <button
                                                        className="btn btn-secondary btn-sm me-1"
                                                        title="Détails vente"
                                                        onClick={() => openDetailVente(item.id!, item.noms || "")}
                                                    >
                                                        <i className="fas fa-list" />
                                                    </button>
                                                    <button
                                                        className="btn btn-info btn-sm me-1"
                                                        title="Paiement"
                                                        onClick={()=>{
                                                            setVenteId(item.id!);
                                                            setShowPaiementModal(true);
                                                            setVenteName(item.noms ?? '');
                                                        }}
                                                    >
                                                        <i className="fas fa-money-bill" />
                                                    </button>
                                                    <button
                                                        className="btn btn-success btn-sm me-1"
                                                        title="Facture"
                                                        onClick={() => {
                                                            setFactureId(item.id!);
                                                            setShowFacture(true);
                                                            setVenteName(item.noms??'');
                                                        }}

                                                    >
                                                        <i className="fas fa-print" />
                                                    </button>

                                                    {/* ✅ Bouton Détail vente */}

                                                    <button
                                                        className="btn btn-warning btn-sm me-1"
                                                        onClick={() => handleEdit(item.id!)}
                                                        title="Modifier"
                                                    >
                                                        <i className="fas fa-edit" />
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(item.id!)}
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

            {/* Modal ajout / modification */}
            <Modal
                title={isEditing ? "Modifier la vente" : "Ajouter une vente"}
                show={showModal}
                onClose={closeModal}
                dimension="modal-md"
            >
                <form onSubmit={handleSubmit}>
                    <SelectPickerField
                        label="Élève / Client"
                        name="refClient"
                        options={clients.map((c) => ({
                            value: String(c.id),
                            label: c.Noms,
                        }))}
                        value={formData.refClient ? String(formData.refClient) : ""}
                        required
                        onChange={(v) => handleSelectChange("refClient", v)}
                    />

                    <TextField
                        label="Date de vente"
                        name="dateVente"
                        type="date"
                        value={formData.dateVente || ""}
                        onChange={handleChange}
                        required
                    />

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

            <VenteDetailVente
                show={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                refEnteteVente={venteId!}
            />

            {factureId && (
                <FactureVente
                    show={showFacture}
                    onClose={() => setShowFacture(false)}
                    refEnteteSortie={factureId}
                    serviceType="Ventes"
                    title={`Facture de ${venteName}`}
                />
            )}

            {venteId && (
                <VentePaiement
                    show={showPaiementModal}
                    onClose={() => setShowPaiementModal(false)}
                    refEnteteVente={venteId}
                    title={`Paiement de la vente de  ${venteName}`}
                />
            )}
        </div>
    );
}
