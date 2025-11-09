import React, { useEffect, useState } from "react";
import { fetchListItems, formatDateFR } from "../../api/callApi";
import { fileUrl, showErrorMessage } from "../../api/config";
import { TextField, SelectPickerField } from "../../components";
import LoadingSpinner from "../../components/LoadingSpinner";
import PieChartComponent from "../../components/charts/PieChartComponent";
import BarChartComponent from "../../components/charts/BarChartComponent";

interface OptionItem {
    value: string;
    label: string;
}

interface Filters {
    idAnne?: string;
    idSection?: string;
    idOption?: string;
    idClasse?: string;
    montant?: string;
    date1?: string;
    date2?: string;
}

export default function RapportRecouvrementPage() {
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState<Filters>({});
    const [anneeOptions, setAnneeOptions] = useState<OptionItem[]>([]);
    const [sectionOptions, setSectionOptions] = useState<OptionItem[]>([]);
    const [optionOptions, setOptionOptions] = useState<OptionItem[]>([]);
    const [classeOptions, setClasseOptions] = useState<OptionItem[]>([]);

    const [date1, setDate1] = useState("");
    const [date2, setDate2] = useState("");
    const dateRangeText =
        date1 && date2
            ? `${formatDateFR(date1)} ~ ${formatDateFR(date2)}`
            : date1
                ? `${formatDateFR(date1)}`
                : "";

    // charts
    const [statRecouvrement, setStatRecouvrement] = useState<any[]>([]);

    // ========================= Load lists =========================
    const loadAnnees = async () => {
        try {
            const res = await fetchListItems("/fetch_anne_scolaire");
            setAnneeOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.id),
                    label: x.designation,
                }))
            );
        } catch {
            setAnneeOptions([]);
        }
    };

    const loadSections = async () => {
        try {
            const res = await fetchListItems("/fetch_section_2");
            setSectionOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.id),
                    label: x.nomSection,
                }))
            );
        } catch {
            setSectionOptions([]);
        }
    };

    const loadClasses = async () => {
        try {
            const res = await fetchListItems("/fetch_classe_2");
            setClasseOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.id),
                    label: x.nomClasse,
                }))
            );
        } catch {
            setClasseOptions([]);
        }
    };

    const loadOptionsBySection = async (idSection: string) => {
        if (!idSection) {
            setOptionOptions([]);
            return;
        }
        try {
            const res = await fetchListItems(`/fetch_option_by_section/${idSection}`);
            setOptionOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.id),
                    label: x.nomOption,
                }))
            );
        } catch {
            setOptionOptions([]);
        }
    };

    const loadStats = async () => {
        try {
            const res = await fetchListItems("/stat_dashboard_paiement_par_classe");
            setStatRecouvrement(res?.data || []);
        } catch {
            setStatRecouvrement([]);
        }
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([
            loadAnnees(),
            loadSections(),
            loadClasses(),
            loadStats(),
        ]).finally(() => setLoading(false));
    }, []);

    // ========================= Helpers =========================
    const updateFilter = (field: keyof Filters, value: string) => {
        setFilters((prev) => ({ ...prev, [field]: value || undefined }));
    };

    const ensureRangeValid = (): boolean => {
        if (!date1 || !date2) {
            showErrorMessage("Veuillez sélectionner une période complète.");
            return false;
        }
        if (date1 > date2) {
            showErrorMessage("La date de début doit être avant la date de fin.");
            return false;
        }
        return true;
    };

    const requireFields = (fields: (keyof Filters)[]): boolean => {
        for (const f of fields) {
            if (!filters[f]) {
                showErrorMessage("Veuillez sélectionner toutes les informations requises.");
                return false;
            }
        }
        return true;
    };

    const openReport = (url: string) => {
        window.open(`${fileUrl}${url}`, "_blank");
    };

    // ========================= Actions Rapports =========================
    const actions = {
        paiementJournalier: () => {
            if (!ensureRangeValid()) return;
            openReport(`/fetch_rapport_paiement_frais_date?date1=${date1}&date2=${date2}`);
        },
        paiementClasse: () => {
            if (!ensureRangeValid()) return;
            if (!requireFields(["idAnne", "idOption", "idClasse"])) return;
            const { idAnne, idOption, idClasse } = filters;
            openReport(
                `/fetch_rapport_paiement_frais_date_classe?date1=${date1}&date2=${date2}&idAnne=${idAnne}&idOption=${idOption}&idClasse=${idClasse}`
            );
        },
        recouvrementClasse: () => {
            if (!requireFields(["idAnne", "idOption", "idClasse", "montant"])) return;
            const { idAnne, idOption, idClasse, montant } = filters;
            openReport(
                `/fetch_rapport_recouvrement_classe?idAnne=${idAnne}&idOption=${idOption}&idClasse=${idClasse}&montant=${montant}`
            );
        },
        recouvrementOption: () => {
            if (!requireFields(["idAnne", "idOption", "montant"])) return;
            const { idAnne, idOption, montant } = filters;
            openReport(
                `/fetch_rapport_recouvrement_option?idAnne=${idAnne}&idOption=${idOption}&montant=${montant}`
            );
        },
        retardClasse: () => {
            if (!requireFields(["idAnne", "idOption", "idClasse", "montant"])) return;
            const { idAnne, idOption, idClasse, montant } = filters;
            openReport(
                `/fetch_rapport_retardpaie_classe?idAnne=${idAnne}&idOption=${idOption}&idClasse=${idClasse}&montant=${montant}`
            );
        },
        retardOption: () => {
            if (!requireFields(["idAnne", "idOption", "montant"])) return;
            const { idAnne, idOption, montant } = filters;
            openReport(
                `/fetch_rapport_retardpaie_option?idAnne=${idAnne}&idOption=${idOption}&montant=${montant}`
            );
        },
        previsionClasse: () => {
            if (!requireFields(["idAnne", "idOption", "idSection", "idClasse"])) return;
            const { idAnne, idOption, idSection, idClasse } = filters;
            openReport(
                `/print_echeancier_promotion?idAnne=${idAnne}&idOption=${idOption}&idSection=${idSection}&idClasse=${idClasse}`
            );
        },
        previsionGenerale: () => {
            if (!requireFields(["idAnne"])) return;
            const { idAnne } = filters;
            openReport(`/print_echeancier_anneescolaire?idAnne=${idAnne}`);
        },
        effectifRecette: () => {
            if (!requireFields(["idAnne"])) return;
            const { idAnne } = filters;
            openReport(`/print_effectif_promotion?idAnne=${idAnne}`);
        },
    };

    // ========================= UI =========================
    return (
        <div className="col-md-12">
            <div className="row">
                {/* Gauche : filtres et actions */}
                <div className="col-md-8 col-sm-12 mb-3">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <h5 className="mb-0">
                                        <i className="fas fa-file-invoice-dollar text-primary me-2"></i>
                                        Rapports de Recouvrement & Prévisions
                                    </h5>
                                    <small className="text-muted">
                                        Analyse des paiements, retards et montants par classe ou option.
                                    </small>
                                </div>
                                <LoadingSpinner loading={loading} />
                            </div>

                            <hr />

                            {/* Dates */}
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <TextField
                                        label="Date début"
                                        name="date1"
                                        type="date"
                                        value={date1}
                                        onChange={(e) => setDate1(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <TextField
                                        label="Date fin"
                                        name="date2"
                                        type="date"
                                        value={date2}
                                        onChange={(e) => setDate2(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Filtres */}
                            <div className="row mb-3">
                                <div className="col-md-6 mb-2">
                                    <SelectPickerField
                                        label="Année scolaire"
                                        name="idAnne"
                                        value={filters.idAnne || ""}
                                        options={anneeOptions}
                                        onChange={(v) => updateFilter("idAnne", v)}
                                    />
                                </div>
                                <div className="col-md-6 mb-2">
                                    <SelectPickerField
                                        label="Section"
                                        name="idSection"
                                        value={filters.idSection || ""}
                                        options={sectionOptions}
                                        onChange={(v) => {
                                            updateFilter("idSection", v);
                                            updateFilter("idOption", "");
                                            loadOptionsBySection(v);
                                        }}
                                    />
                                </div>
                                <div className="col-md-6 mb-2">
                                    <SelectPickerField
                                        label="Option"
                                        name="idOption"
                                        value={filters.idOption || ""}
                                        options={optionOptions}
                                        onChange={(v) => updateFilter("idOption", v)}
                                    />
                                </div>
                                <div className="col-md-6 mb-2">
                                    <SelectPickerField
                                        label="Classe"
                                        name="idClasse"
                                        value={filters.idClasse || ""}
                                        options={classeOptions}
                                        onChange={(v) => updateFilter("idClasse", v)}
                                    />
                                </div>

                                <div className="col-md-12 mb-2">
                                    <TextField
                                        label="Montant ($) > 0 ou ="
                                        name="montant"
                                        type="number"
                                        
                                        value={filters.montant || ""}
                                        onChange={(e) => updateFilter("montant", e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Boutons d’action */}
                            <div className="d-grid gap-2 mb-3">
                                <button
                                    className="btn btn-outline-success btn-sm"
                                    onClick={actions.paiementJournalier}
                                >
                                    Rapport journalier des paiements
                                </button>
                                <button
                                    className="btn btn-outline-success btn-sm"
                                    onClick={actions.paiementClasse}
                                >
                                    Rapport paiements par classe
                                </button>
                                <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={actions.recouvrementClasse}
                                >
                                    En ordre avec ce montant / Classe
                                </button>
                                <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={actions.recouvrementOption}
                                >
                                    En ordre avec ce montant / Option
                                </button>
                                <button
                                    className="btn btn-outline-warning btn-sm"
                                    onClick={actions.retardClasse}
                                >
                                    En retard avec ce montant / Classe
                                </button>
                                <button
                                    className="btn btn-outline-warning btn-sm"
                                    onClick={actions.retardOption}
                                >
                                    En retard avec ce montant / Option
                                </button>
                                <button
                                    className="btn btn-outline-dark btn-sm"
                                    onClick={actions.previsionClasse}
                                >
                                    Prévision paiement / Classe
                                </button>
                                <button
                                    className="btn btn-outline-dark btn-sm"
                                    onClick={actions.previsionGenerale}
                                >
                                    Prévision générale / Année
                                </button>
                                <button
                                    className="btn btn-outline-info btn-sm"
                                    onClick={actions.effectifRecette}
                                >
                                    Tableau récapitulatif (Effectifs & Recettes)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Droite : graphiques / stats */}
                <div className="col-md-4 col-sm-12">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body d-flex flex-column justify-content-center text-center">
                            <PieChartComponent
                                data={statRecouvrement}
                                title="Répartition du recouvrement global"
                            />
                            <BarChartComponent
                                data={statRecouvrement}
                                color="#00b894"
                                title="Statistiques de paiement par section"
                            />

                            <hr />
                            <i className="fas fa-chart-line fa-3x text-secondary mb-2" />
                            <p className="text-muted mb-0">
                                Génèrez des rapports PDF de recouvrement et d’analyse
                                financière à partir des filtres à gauche.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
