import React, { useEffect, useState } from "react";
import { fetchListItems } from "../../api/callApi";
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
interface BanqueItem {
    id: number | string;
    nom_banque: string;
}

// ========================= Component =========================
export default function RapportCaisseBanquePage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [date1, setDate1] = useState("");
    const [date2, setDate2] = useState("");
    const [banques, setBanques] = useState<BanqueItem[]>([]);
    const [refTresorerie, setRefTresorerie] = useState<string>("");

    const [showFilters, setShowFilters] = useState(true);

    // ========================= Load banques =========================
    const loadBanques = async () => {
        setLoading(true);
        try {
            // Vue: fetch_tconf_banque_2
            const res = await fetchListItems("/fetch_tconf_banque_2");
            setBanques(res?.data || []);
        } catch (e) {
            console.error(e);
            setError("Erreur lors du chargement des comptes de trésorerie.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBanques();
    }, []);

    // ========================= Helpers =========================
    const requireSingleDate = (): string | null => {
        if (!date1) {
            showErrorMessage("Veuillez sélectionner une date.");
            return null;
        }
        return date1;
    };

    const requireRange = (): { d1: string; d2: string } | null => {
        if (!date1 || !date2) {
            showErrorMessage("Veuillez sélectionner la période complète (date début et date fin).");
            return null;
        }
        if (date1 > date2) {
            showErrorMessage(
                "La date de début doit être inférieure ou égale à la date de fin."
            );
            return null;
        }
        return { d1: date1, d2: date2 };
    };

    const requireTresorerie = (): string | null => {
        if (!refTresorerie) {
            showErrorMessage("Veuillez sélectionner le compte de trésorerie.");
            return null;
        }
        return refTresorerie;
    };

    // ========================= Actions Impression =========================
    const handleLivreCaisse = () => {
        const d = requireSingleDate();
        if (!d) return;
        const url = `${fileUrl}/pdf_livre_caisse?dateOperation=${encodeURIComponent(d)}`;
        window.open(url, "_blank");
    };

    const handleLivreBanque = () => {
        const d = requireSingleDate();
        if (!d) return;
        const url = `${fileUrl}/pdf_livre_banque?dateOperation=${encodeURIComponent(d)}`;
        window.open(url, "_blank");
    };

    const handleRapportBilan = () => {
        const range = requireRange();
        if (!range) return;
        const url = `${fileUrl}/fetch_rapport_bilan?date1=${encodeURIComponent(
            range.d1
        )}&date2=${encodeURIComponent(range.d2)}`;
        window.open(url, "_blank");
    };

    const handleJournalCaisse = () => {
        const range = requireRange();
        if (!range) return;
        const treso = requireTresorerie();
        if (!treso) return;

        const url = `${fileUrl}/fetch_rapport_journal_caisse?date1=${encodeURIComponent(
            range.d1
        )}&date2=${encodeURIComponent(range.d2)}&refTresorerie=${encodeURIComponent(
            treso
        )}`;
        window.open(url, "_blank");
    };

    // ========================= Render =========================
    return (
        <div className="col-md-12">
            {/* Header */}
            <div className="page-header d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h4>Rapports Trésorerie</h4>
                    <p className="text-muted mb-0">
                        Livre de caisse, livre des banques, bilan & journal des opérations
                    </p>
                </div>
                <div>
                    <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={loadBanques}
                    >
                        <i className="fas fa-sync me-1" />
                        Actualiser
                    </button>
                </div>
            </div>

            <LoaderAndError
                loading={loading}
                error={error}
                onClearError={() => setError(null)}
            />

            <div className="card">
                <div className="card-body">

                    <div className="col-md-12">

                    </div>



                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex flex-wrap gap-2">
                            <div className="me-2">
                                <label className="form-label mb-1">Date début</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={date1}
                                    onChange={(e) => setDate1(e.target.value)}
                                />
                            </div>
                            <div className="me-2">
                                <label className="form-label mb-1">Date fin</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={date2}
                                    onChange={(e) => setDate2(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setShowFilters((v) => !v)}
                            >
                                <i className="fas fa-calendar-alt me-1" />
                                {showFilters ? "Masquer les actions" : "Afficher les actions"}
                            </button>
                        </div>
                    </div>

                    {/* Sélecteur Compte Trésorerie */}
                    <div className="row mb-3">
                        <div className="col-md-4">
                            <SelectPickerField
                                label="Compte de trésorerie / banque"
                                name="refTresorerie"
                                icon="fas fa-building-columns"
                                value={refTresorerie}
                                options={banques.map((b) => ({
                                    value: String(b.id),
                                    label: b.nom_banque,
                                }))}
                                onChange={(v) => setRefTresorerie(v)}
                                placeholder="Sélectionner un compte"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    {showFilters && (
                        <>
                            <div className="row g-2">
                                <div className="col-md-3">
                                    <button
                                        className="btn btn-primary btn-sm w-100"
                                        onClick={handleLivreCaisse}
                                    >
                                        <i className="fas fa-print me-1" />
                                        Livre de caisse (par jour)
                                    </button>
                                </div>
                                <div className="col-md-3">
                                    <button
                                        className="btn btn-primary btn-sm w-100"
                                        onClick={handleLivreBanque}
                                    >
                                        <i className="fas fa-print me-1" />
                                        Livre des banques (par jour)
                                    </button>
                                </div>
                                <div className="col-md-3">
                                    <button
                                        className="btn btn-outline-primary btn-sm w-100"
                                        onClick={handleRapportBilan}
                                    >
                                        <i className="fas fa-file-alt me-1" />
                                        Rapport bilan (période)
                                    </button>
                                </div>
                                <div className="col-md-3">
                                    <button
                                        className="btn btn-outline-primary btn-sm w-100"
                                        onClick={handleJournalCaisse}
                                    >
                                        <i className="fas fa-book me-1" />
                                        Journal des opérations (période + compte)
                                    </button>
                                </div>
                            </div>

                            <p className="text-muted mt-3 mb-0" style={{ fontSize: "0.8rem" }}>
                                ⚙️ Sélectionnez la période et, si nécessaire, le compte de trésorerie,
                                puis lancez l’impression du rapport souhaité. Tous les rapports
                                s’ouvrent dans un nouvel onglet au format imprimable.
                            </p>
                        </>
                    )}

                    <LoadingSpinner loading={loading} />
                </div>
            </div>
        </div>
    );
}
