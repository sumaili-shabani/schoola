import React, { useEffect, useMemo, useState, useRef } from "react";
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
import FactureVente from "./FactureVente";
import PetitRecu from "./PetitRecu";

// ======================= Interfaces =======================
interface Paiement {
    id?: number;
    refEnteteVente?: number;
    montant_paie?: number;
    date_paie?: string;
    modepaie?: string;
    refBanque?: number | string;
    numeroBordereau?: string;
    devise?: string;
    author?: string;
    taux?: number;
    noms?: string;
    nom_banque?: string;
}

interface ModePaiement {
    designation: string;
}

interface Banque {
    id: number;
    nom_banque: string;
}

interface VentePaiementProps {
    show: boolean;
    onClose: () => void;
    refEnteteVente: number;
    title?: string;
}

export default function VentePaiement({
    show,
    onClose,
    refEnteteVente,
    title = "Paiements de la vente",
}: VentePaiementProps) {
    const [datas, setDatas] = useState<Paiement[]>([]);
    const [modes, setModes] = useState<ModePaiement[]>([]);
    const [banques, setBanques] = useState<Banque[]>([]);
    const [formData, setFormData] = useState<Partial<Paiement>>({});
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

    const [showFacture, setShowFacture] = useState(false);
    const [factureId, setFactureId] = useState<number | null>(null);
    const [venteName, setVenteName] = useState("");

    const [showPetitRecu, setShowPetitRecu] = useState(false);
    const [recuId, setRecuId] = useState<number | null>(null);

    const debounced = useMemo(() => {
        let t: any;
        return (fn: () => void, delay = 400) => {
            clearTimeout(t);
            t = setTimeout(fn, delay);
        };
    }, []);

    // ======================= Effects =======================
    useEffect(() => {
        if (show) {
            loadModes();
            loadDatas();
        }
    }, [show, currentPage]);

    useEffect(() => {
        debounced(() => {
            setCurrentPage(1);
            loadDatas();
        });
    }, [search]);

    // ======================= Fetch =======================
    const loadDatas = async () => {
        if (!refEnteteVente) return;
        setLoading(true);
        try {
            const res = await fetchItems<Paiement>(
                `/fetch_vente_paiement/${refEnteteVente}`,
                { page: currentPage, limit, query: search }
            );
            setDatas(res.data || []);
            setTotalPages(res.lastPage || 1);
        } catch (err) {
            setError("Erreur lors du chargement des paiements.");
        } finally {
            setLoading(false);
        }
    };

    const loadModes = async () => {
        try {
            const res = await fetchListItems("/fetch_tconf_modepaie_2");
            setModes(res?.data || []);
        } catch (err) {
            showErrorMessage("Erreur lors du chargement des modes de paiement.");
        }
    };

    const loadBanques = async (mode: string) => {
        try {
            const res = await fetchListItems(`/fetch_list_banque/${mode}`);
            setBanques(res?.data || []);
        } catch (err) {
            setBanques([]);
        }
    };

    // ======================= Form Logic =======================
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelect = (name: string, value: string | number) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
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

        if (!formData.montant_paie) return showWarningMessage("Montant obligatoire.");
        if (!formData.modepaie) return showWarningMessage("Choisissez un mode de paiement.");
        if (!formData.date_paie) return showWarningMessage("Date obligatoire.");

        const user = getUser();
        const payload = {
            ...formData,
            refEnteteVente,
            author: user?.name || "Admin",
            libellepaie: "Paiement Facture",
        };

        try {
            setLoading(true);
            await saveItem("/insert_vente_paiement", payload);
            showSuccessMessage("Paiement enregistré avec succès !");
            closeModal();
            loadDatas();
        } catch (err) {
            showErrorMessage("Erreur lors de l’enregistrement du paiement.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const confirm = await showConfirmationDialog({
            title: "Supprimer ce paiement ?",
            text: "Cette action est irréversible.",
        });
        if (!confirm) return;
        try {
            await removeItem("/delete_vente_paiement", id);
            showSuccessMessage("Supprimé !");
            loadDatas();
        } catch (err) {
            showErrorMessage("Erreur lors de la suppression.");
        }
    };

    // ======================= UI =======================
    return (
        <Modal title={title} show={show} onClose={onClose} dimension="modal-xl">
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

                <div>
                    <button className="btn btn-primary btn-sm me-2" onClick={openModal}>
                        <i className="fas fa-plus me-1"></i> Ajouter
                    </button>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                            // setFactureId(refEnteteVente!);
                            // setShowFacture(true);
                            // setVenteName(formData.noms ?? "");

                            setRecuId(refEnteteVente!);
                            setShowPetitRecu(true);
                        }}
                    >
                        <i className="fas fa-print me-1"></i> Imprimer
                    </button>
                </div>
            </div>

            <table className="table table-bordered table-sm align-middle">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Client</th>
                        <th>Montant</th>
                        <th>Mode</th>
                        <th>Date</th>
                        <th>Taux</th>
                        <th>Banque</th>
                        <th>Compte</th>
                        <th>Agent</th>
                        <th className="no-print">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {datas.length === 0 ? (
                        <tr>
                            <td colSpan={10} className="text-center text-muted">
                                Aucun paiement trouvé
                            </td>
                        </tr>
                    ) : (
                        datas.map((item) => (
                            <tr key={item.id}>
                                <td>{item.id}</td>
                                <td>{item.noms}</td>
                                <td>{item.montant_paie}$</td>
                                <td>{item.modepaie}</td>
                                <td>{item.date_paie}</td>
                                <td>{item.taux ?? "-"}</td>
                                <td>{item.nom_banque ?? "-"}</td>
                                <td>{item.numeroBordereau}</td>
                                <td>{item.author}</td>
                                <td className="no-print">
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDelete(item.id!)}
                                    >
                                        <i className="fas fa-trash" />
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

            {/* Modal d’ajout paiement */}
            <Modal
                title={isEditing ? "Modifier le paiement" : "Ajouter un paiement"}
                show={showModal}
                onClose={closeModal}
                dimension="modal-md"
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-6">
                            <TextField
                                label="Montant Payé ($)"
                                name="montant_paie"
                                type="number"
                                value={String(formData.montant_paie || "")}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <SelectPickerField
                                label="Devise"
                                name="devise"
                                options={[
                                    { value: "USD", label: "USD" },
                                    { value: "FC", label: "FC" },
                                ]}
                                value={formData.devise || ""}
                                required
                                onChange={(v) => handleSelect("devise", v)}
                            />
                        </div>

                        <div className="col-md-6">
                            <SelectPickerField
                                label="Mode de Paiement"
                                name="modepaie"
                                options={modes.map((m) => ({
                                    value: m.designation,
                                    label: m.designation,
                                }))}
                                value={formData.modepaie || ""}
                                required
                                onChange={(v) => {
                                    handleSelect("modepaie", v);
                                    loadBanques(v);
                                }}
                            />
                        </div>

                        <div className="col-md-6">
                            <SelectPickerField
                                label="Banque"
                                name="refBanque"
                                options={banques.map((b) => ({
                                    value: String(b.id),
                                    label: b.nom_banque,
                                }))}
                                value={formData.refBanque ? String(formData.refBanque) : ""}
                                onChange={(v) => handleSelect("refBanque", v)}
                            />
                        </div>

                        <div className="col-md-12">
                            <TextField
                                label="N° Bordereau / Compte"
                                name="numeroBordereau"
                                value={formData.numeroBordereau || ""}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-md-12">
                            <TextField
                                label="Date Paiement"
                                name="date_paie"
                                type="date"
                                value={formData.date_paie || ""}
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

            {factureId && (
                <FactureVente
                    show={showFacture}
                    onClose={() => setShowFacture(false)}
                    refEnteteSortie={factureId}
                    serviceType="Ventes"
                    title={`Facture de ${venteName}`}
                />
            )}

            {recuId && (
                <PetitRecu
                    show={showPetitRecu}
                    onClose={() => setShowPetitRecu(false)}
                    refEnteteSortie={recuId}
                />
            )}
        </Modal>
    );
}
