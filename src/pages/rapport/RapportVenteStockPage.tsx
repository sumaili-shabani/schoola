import React, { useEffect, useState } from "react";
import {
    fetchListItems,
} from "../../api/callApi";
import {
    fileUrl,
    showErrorMessage,
} from "../../api/config";
import {
    LoaderAndError,
    SelectPickerField,
} from "../../components";
import LoadingSpinner from "../../components/LoadingSpinner";

// ========================= Types =========================
interface ProduitItem {
    id: number | string;
    designation: string;
}

interface CategorieProduitItem {
    id: number | string;
    designation: string;
}

// ========================= Component =========================
export default function RapportVenteStockPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [produitList, setProduitList] = useState<ProduitItem[]>([]);
    const [categorieProList, setCategorieProList] = useState<CategorieProduitItem[]>([]);

    const [showDate, setShowDate] = useState(true);

    const [dates, setDates] = useState({
        date1: "",
        date2: "",
    });

    const [svData, setSvData] = useState({
        refProduit: "",
        refCategorie: "",
        idCategorie: "",
    });

    const dateRangeText =
        dates.date1 && dates.date2
            ? `${dates.date1} ~ ${dates.date2}`
            : "";

    // ========================= LOAD LISTS =========================
    const loadProduits = async () => {
        try {
            setLoading(true);
            const res = await fetchListItems("/fetch_produit_2");
            setProduitList(res?.data || []);
        } catch (e) {
            console.error(e);
            setError("Erreur lors du chargement des produits.");
        } finally {
            setLoading(false);
        }
    };

    const loadCategoriesProduit = async () => {
        try {
            setLoading(true);
            const res = await fetchListItems("/fetch_categorie_produit_2");
            setCategorieProList(res?.data || []);
        } catch (e) {
            console.error(e);
            setError("Erreur lors du chargement des catégories produit.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProduits();
        loadCategoriesProduit();
        setShowDate(true);
    }, []);

    // ========================= HANDLERS =========================
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDates((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (field: keyof typeof svData, val: string) => {
        setSvData((prev) => ({ ...prev, [field]: val }));
    };

    const requireDates = (): boolean => {
        const { date1, date2 } = dates;
        if (!date1 || !date2) {
            showErrorMessage("Veuillez sélectionner la période complète.");
            return false;
        }
        if (date1 > date2) {
            showErrorMessage("La date de début doit être inférieure ou égale à la date de fin.");
            return false;
        }
        return true;
    };

    const requireProduit = (): boolean => {
        if (!svData.refProduit) {
            showErrorMessage("Veuillez sélectionner un produit.");
            return false;
        }
        return true;
    };

    const requireCategorie = (field: "refCategorie" | "idCategorie"): boolean => {
        if (!svData[field]) {
            showErrorMessage("Veuillez sélectionner une catégorie de produit.");
            return false;
        }
        return true;
    };

    // ========================= ACTIONS IMPRESSION =========================
    // 1. RAPPORTS GLOBAUX PAR PÉRIODE
    const showDetailSortieByDate = () => {
        if (!requireDates()) return;
        const { date1, date2 } = dates;
        const url = `${fileUrl}/fetch_pdf_rapport_detail_vente_date?date1=${encodeURIComponent(
            date1
        )}&date2=${encodeURIComponent(date2)}`;
        window.open(url, "_blank");
    };

    const showDetailSortieDetteByDate = () => {
        if (!requireDates()) return;
        const { date1, date2 } = dates;
        const url = `${fileUrl}/fetch_rapport_detailvente_dette_date?date1=${encodeURIComponent(
            date1
        )}&date2=${encodeURIComponent(date2)}`;
        window.open(url, "_blank");
    };

    const showDetailEntreeByDate = () => {
        if (!requireDates()) return;
        const { date1, date2 } = dates;
        const url = `${fileUrl}/fetch_pdf_rapport_detail_vente_entree_date?date1=${encodeURIComponent(
            date1
        )}&date2=${encodeURIComponent(date2)}`;
        window.open(url, "_blank");
    };

    const showDetailRequisitionByDate = () => {
        if (!requireDates()) return;
        const { date1, date2 } = dates;
        const url = `${fileUrl}/fetch_pdf_rapport_detail_vente_cmd_date?date1=${encodeURIComponent(
            date1
        )}&date2=${encodeURIComponent(date2)}`;
        window.open(url, "_blank");
    };

    const showFicheStockByDate = () => {
        if (!requireDates()) return;
        const { date1, date2 } = dates;
        const url = `${fileUrl}/pdf_fiche_stock_vente?date1=${encodeURIComponent(
            date1
        )}&date2=${encodeURIComponent(date2)}`;
        window.open(url, "_blank");
    };

    // 2. PAR CATÉGORIE
    const showDetailSortieByDateCategorie = () => {
        if (!requireDates() || !requireCategorie("refCategorie")) return;
        const { date1, date2 } = dates;
        const url = `${fileUrl}/fetch_pdf_rapport_detail_vente_date_categorie?date1=${encodeURIComponent(
            date1
        )}&date2=${encodeURIComponent(date2)}&refCategorie=${encodeURIComponent(
            svData.refCategorie
        )}`;
        window.open(url, "_blank");
    };

    const showFicheStockByDateCategorie = () => {
        if (!requireDates() || !requireCategorie("idCategorie")) return;
        const { date1, date2 } = dates;
        const url = `${fileUrl}/pdf_fiche_stock_vente_categorie?date1=${encodeURIComponent(
            date1
        )}&date2=${encodeURIComponent(date2)}&idCategorie=${encodeURIComponent(
            svData.idCategorie
        )}`;
        window.open(url, "_blank");
    };

    // 3. PAR PRODUIT
    const showDetailSortieByDateProduit = () => {
        if (!requireDates() || !requireProduit()) return;
        const { date1, date2 } = dates;
        const url = `${fileUrl}/fetch_pdf_rapport_detail_vente_date_produit?date1=${encodeURIComponent(
            date1
        )}&date2=${encodeURIComponent(date2)}&refProduit=${encodeURIComponent(
            svData.refProduit
        )}`;
        window.open(url, "_blank");
    };

    // ========================= RENDER =========================
    return (
        <div className="col-md-12">
            {/* HEADER */}
            <div className="page-header mb-4">
                <h4 className="fw-bold text-primary mb-1">
                    <i className="fas fa-chart-bar me-2 text-secondary" />
                    Rapports Ventes & Stocks
                </h4>
                <p className="text-muted mb-0">
                    Ventes, dettes, approvisionnements, réquisitions & fiches de stock par période, produit ou catégorie.
                </p>
            </div>

            <LoaderAndError
                loading={loading}
                error={error}
                onClearError={() => setError(null)}
            />

            <div className="card shadow-sm border-0">
                <div className="card-body">
                    {/* FILTRES */}
                    <div className="row align-items-end mb-3">
                        <div className="col-md-3">
                            <label className="form-label fw-semibold">
                                Date début
                            </label>
                            <input
                                type="date"
                                name="date1"
                                className="form-control"
                                value={dates.date1}
                                onChange={handleDateChange}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold">
                                Date fin
                            </label>
                            <input
                                type="date"
                                name="date2"
                                className="form-control"
                                value={dates.date2}
                                onChange={handleDateChange}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold">
                                Période sélectionnée
                            </label>
                            <input
                                type="text"
                                className="form-control bg-light"
                                value={dateRangeText}
                                placeholder="Sélectionnez une période..."
                                readOnly
                            />
                        </div>
                        <div className="col-md-2 text-end">
                            <button
                                className="btn btn-outline-primary w-100"
                                onClick={() => setShowDate(!showDate)}
                            >
                                <i className="fas fa-calendar-alt me-2" />
                                {showDate ? "Masquer" : "Afficher"}
                            </button>
                        </div>
                    </div>

                    {showDate && (
                        <>
                            {/* BOUTONS RAPPORTS GLOBAUX */}
                            <div className="row g-3 mb-4">
                                <div className="col-md-6 col-lg-4">
                                    <button
                                        onClick={showDetailSortieByDate}
                                        className="btn btn-primary w-100 shadow-sm"
                                    >
                                        <i className="fas fa-receipt me-2" />
                                        Rapports des Ventes
                                    </button>
                                </div>
                                <div className="col-md-6 col-lg-4">
                                    <button
                                        onClick={showDetailSortieDetteByDate}
                                        className="btn btn-primary w-100 shadow-sm"
                                    >
                                        <i className="fas fa-file-invoice-dollar me-2" />
                                        Rapports Dettes / Ventes
                                    </button>
                                </div>
                                <div className="col-md-6 col-lg-4">
                                    <button
                                        onClick={showDetailEntreeByDate}
                                        className="btn btn-primary w-100 shadow-sm"
                                    >
                                        <i className="fas fa-truck-loading me-2" />
                                        Rapports Approvisionnements
                                    </button>
                                </div>
                                <div className="col-md-6 col-lg-4">
                                    <button
                                        onClick={showDetailRequisitionByDate}
                                        className="btn btn-outline-primary w-100 shadow-sm"
                                    >
                                        <i className="fas fa-file-alt me-2" />
                                        Rapports Réquisitions
                                    </button>
                                </div>
                                <div className="col-md-6 col-lg-4">
                                    <button
                                        onClick={showFicheStockByDate}
                                        className="btn btn-outline-primary w-100 shadow-sm"
                                    >
                                        <i className="fas fa-warehouse me-2" />
                                        Fiche de Stock (Globale)
                                    </button>
                                </div>
                            </div>

                            {/* FILTRE PRODUIT + RAPPORTS */}
                            <div className="row g-3 mb-4">
                                <div className="col-md-6 col-lg-4">
                                    <SelectPickerField
                                        label="Produit"
                                        name="refProduit"
                                        icon="fas fa-box"
                                        value={svData.refProduit}
                                        options={produitList.map((p) => ({
                                            value: String(p.id),
                                            label: p.designation,
                                        }))}
                                        onChange={(v) =>
                                            handleSelectChange("refProduit", v)
                                        }
                                    />
                                </div>

                                <div className="col-md-6 col-lg-4">
                                    <SelectPickerField
                                        label="Catégorie Produit"
                                        name="idCategorie"
                                        icon="fas fa-tags"
                                        value={svData.idCategorie}
                                        options={categorieProList.map((c) => ({
                                            value: String(c.id),
                                            label: c.designation,
                                        }))}
                                        onChange={(v) =>
                                            setSvData((prev) => ({
                                                ...prev,
                                                idCategorie: v,
                                                refCategorie: v,
                                            }))
                                        }
                                    />
                                </div>
                                
                            </div>

                            {/* FILTRE CATÉGORIE + RAPPORTS */}
                            <div className="row g-3">
                                <div className="col-md-6 col-lg-4 d-flex align-items-end">
                                    <button
                                        onClick={showDetailSortieByDateProduit}
                                        className="btn btn-outline-success w-100 shadow-sm"
                                    >
                                        <i className="fas fa-chart-line me-2" />
                                        Ventes par Produit
                                    </button>
                                </div>
                                <div className="col-md-6 col-lg-4 d-flex align-items-end">
                                    <button
                                        onClick={showFicheStockByDateCategorie}
                                        className="btn btn-outline-primary w-100 shadow-sm"
                                    >
                                        <i className="fas fa-boxes me-2" />
                                        Fiche de Stock / Catégorie
                                    </button>
                                </div>
                                <div className="col-md-6 col-lg-4 d-flex align-items-end">
                                    <button
                                        onClick={showDetailSortieByDateCategorie}
                                        className="btn btn-outline-primary w-100 shadow-sm"
                                    >
                                        <i className="fas fa-chart-pie me-2" />
                                        Ventes par Catégorie
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 text-muted" style={{ fontSize: "0.9rem" }}>
                                <i className="fas fa-info-circle me-2 text-primary" />
                                Choisissez une période, puis affinez par produit ou catégorie pour
                                générer des rapports PDF détaillés. Chaque rapport s’ouvre dans un
                                nouvel onglet.
                            </div>
                        </>
                    )}
                </div>

                <LoadingSpinner loading={loading} />
            </div>
        </div>
    );
}
