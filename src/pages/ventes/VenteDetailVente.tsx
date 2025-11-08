// src/pages/ecole/VenteDetailVente.tsx

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

interface DetailVente {
    id?: number;
    refEnteteVente?: number;
    refProduit?: number | string;
    designation?: string;
    qteVente?: number;
    puVente?: number;
    devise?: string;
    paquets?: string;
    PTVente?: number;
    Reduction?: number;
    taux?: number;
    dateVente?: string;
    noms?: string;
    unite_paquet?: string;
    qteDisponible?: number;
    author?: string;
}

interface Produit {
    id: number;
    designation?: string;
    pu?: number;
    qte?: number;
    unite?: string;
}

interface VenteDetailVenteProps {
    show: boolean;
    onClose: () => void;
    refEnteteVente: number;
    title?: string;
}

export default function VenteDetailVente({
    show,
    onClose,
    refEnteteVente,
    title = "Détails de la vente",
}: VenteDetailVenteProps) {
    const [datas, setDatas] = useState<DetailVente[]>([]);
    const [produits, setProduits] = useState<Produit[]>([]);
    const [formData, setFormData] = useState<Partial<DetailVente>>({});
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

    const printRef = useRef<HTMLDivElement>(null);

    const [venteName, setVenteName] = useState<string>("");

    const [showFacture, setShowFacture] = useState(false);
    const [factureId, setFactureId] = useState<number | null>(null);

    const debounced = useMemo(() => {
        let t: any;
        return (fn: () => void, delay = 350) => {
            clearTimeout(t);
            t = setTimeout(fn, delay);
        };
    }, []);

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

    // =================== Fetch ===================
    const loadDatas = async () => {
        if (!refEnteteVente) return;
        setLoading(true);

        try {
            const res = await fetchItems<DetailVente>(
                `/fetch_vente_detail_vente/${refEnteteVente}`,
                { page: currentPage, limit, query: search }
            );
            setDatas(res.data || []);
            setTotalPages(res.lastPage || 1);
        } catch (e) {
            setError("Erreur lors du chargement des détails.");
        } finally {
            setLoading(false);
        }
    };

    const loadProduits = async () => {
        try {
            setLoading(true);
            const res = await fetchListItems("/fetch_produit_2");
            setProduits(res?.data || []);
            setLoading(false);
        } catch (e) {
            showErrorMessage("Erreur lors du chargement des produits.");
        }
    };

    const getProduitPrice = async (id: string) => {
        try {
            setLoading(true);
            const res = await fetchSigleItem<Produit[]>("/fetch_single_produit", id);
            const produit = res[0];
            if (produit) {
                setFormData((prev) => ({
                    ...prev,
                    puVente: produit.pu,
                    qteDisponible: produit.qte,
                    unite: produit.unite,
                }));

                setLoading(false);
            }
        } catch (e) {
            showErrorMessage("Erreur lors de la récupération du prix.");
            setLoading(false);
        }
    };

    // =================== Form ===================
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectProduit = async (val: string) => {

        setFormData((prev) => ({ ...prev, refProduit: val }));
        await getProduitPrice(val);
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

        if (!formData.refProduit) return showWarningMessage("Choisissez un article.");
        if (!formData.qteVente || formData.qteVente <= 0)
            return showWarningMessage("Quantité invalide.");
        if (!formData.puVente || formData.puVente <= 0)
            return showWarningMessage("Prix unitaire invalide.");
        if (!formData.devise) return showWarningMessage("Choisissez une devise.");

        const user = getUser();
        const payload = {
            ...formData,
            refEnteteVente,
            author: user?.name || "Admin",
        };

        if ((formData.qteVente || 0) <= (formData.qteDisponible || 0)) {

            try {
                setLoading(true);
                await saveItem("/insert_vente_detail_vente", payload);
                showSuccessMessage("Détail ajouté avec succès !");
                closeModal();
                loadDatas();
                // console.log("formData:", formData);
            } catch (err) {
                showErrorMessage(err);
            } finally {
                setLoading(false);
            }

        } else {
            showErrorMessage("Veillez entrer une quantité <=" + formData.qteDisponible);
        }


    };

    const handleDelete = async (id: number) => {
        const confirm = await showConfirmationDialog({
            title: "Supprimer cet article ?",
            text: "Cette action est irréversible.",
        });
        if (!confirm) return;
        try {
            await removeItem("/delete_vente_detail_vente", id);
            showSuccessMessage("Supprimé !");
            loadDatas();
        } catch (err) {
            showErrorMessage(err);
        }
    };

    // =================== Impression ===================
    const handlePrint = () => {
        if (!printRef.current) return;
        const printContents = printRef.current.innerHTML;
        const win = window.open("", "_blank", "width=900,height=700");
        if (!win) return;
        win.document.write(`
      <html>
        <head>
          <title>Détails de la vente</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
          <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 6px 8px; }
            th { background-color: #f0f0f0; text-align: center; }
            @media print { .no-print { display: none !important; } }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContents}
        </body>
      </html>
    `);
        win.document.close();
    };

    // =================== UI ===================
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

                </div>

                <div>
                    <button className="btn btn-primary btn-sm me-2" onClick={openModal}>
                        <i className="fas fa-plus me-1"></i> Ajouter
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={()=>{
                        setFactureId(refEnteteVente!);
                        setShowFacture(true);
                        setVenteName(formData.noms ?? '');
                    }}>
                        <i className="fas fa-print me-1"></i> Imprimer
                    </button>
                </div>
            </div>

            <div ref={printRef}>
                <table className="table table-bordered table-sm align-middle">
                    <thead>
                        <tr>
                            <th>Article</th>
                            <th>Quantité</th>
                            <th>PU ($)</th>
                            <th>PT ($)</th>
                            <th>Réduction</th>
                            <th>N° Vente</th>
                            <th>Client</th>
                            <th>Date</th>
                            <th>Taux</th>
                            <th>Unité</th>
                            <th className="no-print">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {datas.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="text-center text-muted">
                                    Aucune donnée
                                </td>
                            </tr>
                        ) : (
                            datas.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.designation}</td>
                                    <td>{item.qteVente}</td>
                                    <td>{item.puVente}</td>
                                    <td>{item.PTVente}</td>
                                    <td>{item.Reduction ?? 0}</td>
                                    <td>{item.refEnteteVente}</td>
                                    <td>{item.noms}</td>
                                    <td>{item.dateVente}</td>
                                    <td>{item.taux}</td>
                                    <td>{item.unite_paquet}</td>
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

            {/* Modal d’ajout / modification */}
            <Modal
                title={isEditing ? "Modifier un article" : "Ajouter un article"}
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
                                    value: String(p.id!),
                                    label: p.designation!,
                                }))}
                                value={formData.refProduit ? String(formData.refProduit) : ""}
                                required
                                onChange={(v) => handleSelectProduit(v)}
                            />

                        </div>
                        <div className="col-md-6">
                            <TextField
                                type="number"
                                label="Quantité disponible"
                                name="qteDisponible"
                                value={String(formData.qteDisponible || "")}
                                onChange={handleChange}
                                required
                                disabled
                            />

                        </div>

                        <div className="col-md-6">

                            <TextField
                                label="Quantité vendue"
                                name="qteVente"
                                type="number"

                                value={String(formData.qteVente || "")}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <div className="col-md-6">
                            <TextField
                                label="Prix unitaire ($)"
                                name="puVente"
                                type="number"

                                value={String(formData.puVente || "")}
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
                                    // tu peux en ajouter d'autres si besoin
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



            {factureId && (
                <FactureVente
                    show={showFacture}
                    onClose={() => setShowFacture(false)}
                    refEnteteSortie={factureId}
                    serviceType="Ventes"
                    title={`Facture de ${venteName}`}
                />
            )}



        </Modal>
    );
}
