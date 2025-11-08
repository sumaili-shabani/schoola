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
import BonEntree from "./BonEntree";
import LoadingSpinner from "../../components/LoadingSpinner";

// ======================= Types =======================
interface DetailEntree {
    id?: number;
    refEnteteEntree?: number;
    refProduit?: number | string;
    designation?: string;
    qteEntree?: number;
    puEntree?: number;
    PTEntree?: number;
    devise?: string;
    taux?: number;
    noms?: string;
    dateEntree?: string;
    unite_paquet?: string;
    author?: string;
    qteDisponible?: number;
    paquets?: string;
}

interface Produit {
    id: number;
    designation: string;
    pu: number;
    qte: number;
}

interface Props {
    show: boolean;
    onClose: () => void;
    refEnteteEntree: number;
    title?: string;
}

// ======================= Component =======================
export default function ApproDetailEntrees({
    show,
    onClose,
    refEnteteEntree,
    title = "Détails d’entrée",
}: Props) {
    const [datas, setDatas] = useState<DetailEntree[]>([]);
    const [produits, setProduits] = useState<Produit[]>([]);
    const [formData, setFormData] = useState<Partial<DetailEntree>>({});
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

    const [showBon, setShowBon] = useState(false);
    const [fournisseurName, setFournisseurName] = useState("");
    const [selectedEntreeId, setSelectedEntreeId] = useState<number | null>(null);

    // debounce recherche
    const debounced = useMemo(() => {
        let t: any;
        return (fn: () => void, delay = 350) => {
            clearTimeout(t);
            t = setTimeout(fn, delay);
        };
    }, []);

    // ======================= UseEffect =======================
    useEffect(() => {
        if (show) {
            loadProduits();
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
        if (!refEnteteEntree) return;
        setLoading(true);
        try {
            const res = await fetchItems<DetailEntree>(
                `/fetch_vente_detail_entree/${refEnteteEntree}`,
                { page: currentPage, limit, query: search }
            );
            setDatas(res.data || []);
            setTotalPages(res.lastPage || 1);
        } catch {
            setError("Erreur lors du chargement des détails d’entrée.");
        } finally {
            setLoading(false);
        }
    };

    const loadProduits = async () => {
        try {
            const res = await fetchListItems("/fetch_produit_2");
            setProduits(res?.data || []);
        } catch {
            showErrorMessage("Erreur lors du chargement des produits.");
        }
    };

    const getPrice = async (id: string) => {
        try {
            const res = await fetchSigleItem<Produit[]>("/fetch_single_produit", id);
            const produit = res[0];
            if (produit) {
                setFormData((prev) => ({
                    ...prev,
                    puEntree: produit.pu,
                    qteDisponible: produit.qte,
                }));
            }
        } catch {
            showErrorMessage("Erreur lors de la récupération du prix.");
        }
    };

    // ======================= Form =======================
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectProduit = async (val: string) => {
        setFormData((prev) => ({ ...prev, refProduit: val }));
        await getPrice(val);
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

        if (!formData.refProduit)
            return showWarningMessage("Sélectionnez un article.");
        if (!formData.qteEntree || formData.qteEntree <= 0)
            return showWarningMessage("Quantité invalide.");
        if (!formData.puEntree || formData.puEntree <= 0)
            return showWarningMessage("Prix unitaire invalide.");
        if (!formData.devise) return showWarningMessage("Choisissez une devise.");

        const user = getUser();
        const payload = {
            ...formData,
            refEnteteEntree,
            author: user?.name || "Admin",
        };

        try {
            setLoading(true);
            await saveItem("/insert_vente_detail_entree", payload);
            showSuccessMessage("Détail ajouté avec succès !");
            closeModal();
            loadDatas();
        } catch {
            showErrorMessage("Erreur lors de l’enregistrement.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const confirm = await showConfirmationDialog({
            title: "Supprimer cet article ?",
            text: "Cette action est irréversible.",
        });
        if (!confirm) return;
        try {
            await removeItem("/delete_vente_detail_entree", id);
            showSuccessMessage("Supprimé !");
            loadDatas();
        } catch {
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
                            setSelectedEntreeId(refEnteteEntree);          // ID du bon à imprimer
                            setFournisseurName(formData.noms || "");    // Nom du fournisseur
                            setShowBon(true);                       // Ouvre le modal
                        }}
                    >
                        <i className="fas fa-print me-1"></i> Imprimer
                    </button>
                </div>
            </div>

            <table className="table table-bordered table-sm align-middle">
                <thead>
                    <tr>
                        <th>Produit</th>
                        <th>Qté</th>
                        <th>PU ($)</th>
                        <th>PT ($)</th>
                        <th>N° Bon</th>
                        <th>Fournisseur</th>
                        <th>Date</th>
                        <th>Taux</th>
                        <th>Unité</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {datas.length === 0 ? (
                        <tr>
                            <td colSpan={10} className="text-center text-muted">
                                Aucun produit ajouté
                            </td>
                        </tr>
                    ) : (
                        datas.map((item) => (
                            <tr key={item.id}>
                                <td>{item.designation}</td>
                                <td>{item.qteEntree}</td>
                                <td>{item.puEntree}</td>
                                <td>{item.PTEntree}</td>
                                <td>{item.refEnteteEntree}</td>
                                <td>{item.noms}</td>
                                <td>{item.dateEntree}</td>
                                <td>{item.taux}</td>
                                <td>{item.unite_paquet}</td>
                                <td>
                                    <button
                                        className="btn btn-danger btn-sm"
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

            {/* Modal d’ajout */}
            <Modal
                title={isEditing ? "Modifier un produit" : "Ajouter un produit"}
                show={showModal}
                onClose={closeModal}
                dimension="modal-md"
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-12">
                            <SelectPickerField
                                label="Article"
                                name="refProduit"
                                options={produits.map((p) => ({
                                    value: String(p.id),
                                    label: p.designation,
                                }))}
                                value={formData.refProduit ? String(formData.refProduit) : ""}
                                required
                                onChange={(v) => handleSelectProduit(v)}
                            />
                        </div>

                        <div className="col-md-6">
                            <TextField
                                type="number"
                                label="Qté disponible"
                                name="qteDisponible"
                                value={String(formData.qteDisponible || "")}
                                onChange={handleChange}
                                disabled
                            />
                        </div>

                        <div className="col-md-6">
                            <TextField
                                label="Qté entrée"
                                name="qteEntree"
                                type="number"
                                value={String(formData.qteEntree || "")}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <TextField
                                label="Prix Unitaire ($)"
                                name="puEntree"
                                type="number"
                                value={String(formData.puEntree || "")}
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
                                onChange={(v) => setFormData((p) => ({ ...p, devise: v }))}
                            />
                        </div>

                        <div className="col-md-12">
                            <SelectPickerField
                                label="Unité"
                                name="paquets"
                                options={[
                                    { value: "Par Pièce", label: "Pièce" },
                                    { value: "Par Boîte", label: "Boîte" },
                                    { value: "Par Carton", label: "Carton" },
                                    { value: "Par Paquet", label: "Paquet" },
                                    { value: "Par Lot", label: "Lot" },
                                    { value: "Par Bouteille", label: "Bouteille" },
                                    { value: "Par Sachet", label: "Sachet" },
                                    { value: "Par Sac", label: "Sac" },
                                    { value: "Par Kilo", label: "Kilogramme (Kg)" },
                                    { value: "Par g", label: "Gramme (g)" },
                                    { value: "Par L", label: "Litre (L)" },
                                    { value: "Par m", label: "Mètre (m)" },
                                    { value: "Par m²", label: "Mètre carré (m²)" },
                                    { value: "Par m³", label: "Mètre cube (m³)" },
                                    { value: "Par Douzaine", label: "Douzaine" },
                                    { value: "Par Unité", label: "Unité" },
                                    { value: "Par Baril", label: "Baril" },
                                    { value: "Par Bidon", label: "Bidon" },
                                    { value: "Par Tonne", label: "Tonne" },
                                    { value: "Par Rouleau", label: "Rouleau" },
                                    { value: "Par Heure", label: "Heure" },
                                    { value: "Par Jour", label: "Jour" },
                                    { value: "Par Mois", label: "Mois" },
                                ]}
                                value={formData.paquets || ""}
                                required
                                onChange={(v) => setFormData((p) => ({ ...p, paquets: v }))}
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

            {/* Bon d’entrée */}
            {showBon && (
                <BonEntree
                    show={showBon}
                    onClose={() => setShowBon(false)}
                    refEnteteEntree={refEnteteEntree}
                    title={`Bon d’entrée - ${fournisseurName}`}
                />
            )}
        </Modal>
    );
}
