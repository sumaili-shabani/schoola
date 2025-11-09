import React, { useEffect, useState } from "react";
import { fetchListItems, formatDateFR } from "../../api/callApi";
import { fileUrl, showErrorMessage } from "../../api/config";
import { TextField, SelectPickerField } from "../../components";
import LoadingSpinner from "../../components/LoadingSpinner";
import BarChartComponent from "../../components/charts/BarChartComponent";
import PieChartComponent from "../../components/charts/PieChartComponent";

interface OptionItem {
    value: string;
    label: string;
}

interface Filters {
    idAnne?: string;
    idSection?: string;
    idOption?: string;
    idClasse?: string;
    date1?: string;
    date2?: string;
}

interface StatUi {
    name: any;
    value: any;
}

export default function RapportInscriptionPage() {
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState<Filters>({});
    const [anneeOptions, setAnneeOptions] = useState<OptionItem[]>([]);
    const [sectionOptions, setSectionOptions] = useState<OptionItem[]>([]);
    const [optionOptions, setOptionOptions] = useState<OptionItem[]>([]);
    const [classeOptions, setClasseOptions] = useState<OptionItem[]>([]);

    const [statUser, setStatUser] = useState<StatUi[]>([]);
    const [statInscriptionUser, setStatInscriptionUser] = useState<StatUi[]>([]);

    // Gestion dates (équivalent range picker)
    const [date1, setDate1] = useState("");
    const [date2, setDate2] = useState("");

    const dateRangeText =
        date1 && date2 ? `${formatDateFR(date1 || "")} ~ ${formatDateFR(date2 || "")}` : date1 ? `${formatDateFR(date1 || "")}` : "";

    // ========================= Load lists =========================

    const loadData = async () => {
        try {
            setLoading(true);

            const resEleve = await fetchListItems("/stat_eleve_dashborad_annee_scolaire");
            setStatInscriptionUser(resEleve.data);

            const res = await fetchListItems("/stat_users_dashborad");
            setStatUser(res.data);
            // console.log("res: ", res.data);

            setLoading(false);

        } catch (e) {
            showErrorMessage("Erreur de chargement du tableau de bord: " + e);
        } finally {
            setLoading(false);
        }
    };


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

    useEffect(() => {
        setLoading(true);
        Promise.all([loadAnnees(), loadSections(), loadClasses(), loadData(),]).finally(() =>
            setLoading(false)
        );
    }, []);

    // ========================= Helpers =========================
    const updateFilter = (field: keyof Filters, value: string) => {
        setFilters((prev) => ({ ...prev, [field]: value || undefined }));
    };

    const ensureRangeValid = (): boolean => {
        if (!date1 || !date2) {
            showErrorMessage("Veuillez sélectionner une période (date début et date fin).");
            return false;
        }
        if (date1 > date2) {
            showErrorMessage(
                "La date de début doit être inférieure ou égale à la date de fin."
            );
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

    // ========================= Actions (Rapports) =========================

    // Rapport inscriptions par classe
    const printRapportInscriptionClasse = () => {
        if (!requireFields(["idAnne", "idOption", "idClasse"])) return;
        const { idAnne, idOption, idClasse } = filters;
        openReport(
            `/fetch_rapport_inscription_classe?idAnne=${idAnne}&idOption=${idOption}&idClasse=${idClasse}`
        );
    };

    // Fiche inscription par classe
    const printFicheInscriptionClasse = () => {
        if (!requireFields(["idAnne", "idOption", "idClasse"])) return;
        const { idAnne, idOption, idClasse } = filters;
        openReport(
            `/fetch_fiche_inscription_classe?idAnne=${idAnne}&idOption=${idOption}&idClasse=${idClasse}`
        );
    };

    // Nouveaux inscrits par classe
    const printFicheInscriptionNouveauClasse = () => {
        if (!requireFields(["idAnne", "idOption", "idClasse"])) return;
        const { idAnne, idOption, idClasse } = filters;
        openReport(
            `/fetch_rapport_inscription_nouveau_classe?idAnne=${idAnne}&idOption=${idOption}&idClasse=${idClasse}`
        );
    };

    // Rapport inscriptions par option
    const printRapportInscriptionOption = () => {
        if (!requireFields(["idAnne", "idOption"])) return;
        const { idAnne, idOption } = filters;
        openReport(
            `/fetch_rapport_inscription_annuel?idAnne=${idAnne}&idOption=${idOption}`
        );
    };

    // Nouveaux inscrits par option
    const printRapportInscriptionNouveauOption = () => {
        if (!requireFields(["idAnne", "idOption"])) return;
        const { idAnne, idOption } = filters;
        openReport(
            `/fetch_rapport_nouveau_option?idAnne=${idAnne}&idOption=${idOption}`
        );
    };

    // Mesures incitatives par classe
    const printRapportInscriptionClasseReduction = () => {
        if (!requireFields(["idAnne", "idOption", "idClasse"])) return;
        const { idAnne, idOption, idClasse } = filters;
        openReport(
            `/fetch_rapport_inscription_classe_reduction?idAnne=${idAnne}&idOption=${idOption}&idClasse=${idClasse}`
        );
    };

    // Mesures incitatives par option
    const printRapportInscriptionOptionReduction = () => {
        if (!requireFields(["idAnne", "idOption"])) return;
        const { idAnne, idOption } = filters;
        openReport(
            `/fetch_rapport_inscription_classe_reduction_annuel?idAnne=${idAnne}&idOption=${idOption}`
        );
    };

    // Rapport paiements (tous)
    const PrintRapportDetailPaiement = () => {
        if (!ensureRangeValid()) return;
        openReport(
            `/fetch_rapport_paiement_frais_date?date1=${date1}&date2=${date2}`
        );
    };

    // Rapport paiements par classe
    const PrintRapportDetailPaiementClasse = () => {
        if (!ensureRangeValid()) return;
        if (!requireFields(["idAnne", "idOption", "idClasse"])) return;
        const { idAnne, idOption, idClasse } = filters;
        openReport(
            `/fetch_rapport_paiement_frais_date_classe?date1=${date1}&date2=${date2}&idAnne=${idAnne}&idOption=${idOption}&idClasse=${idClasse}`
        );
    };

    // Prévision par classe
    const printBillPrevisionClasse = () => {
        if (!requireFields(["idAnne", "idOption", "idSection", "idClasse"])) return;
        const { idAnne, idOption, idSection, idClasse } = filters;
        openReport(
            `/print_echeancier_promotion?idAnne=${idAnne}&idOption=${idOption}&idSection=${idSection}&idClasse=${idClasse}`
        );
    };

    // Prévision générale année
    const printBillPrevisionGenerale = () => {
        if (!requireFields(["idAnne"])) return;
        const { idAnne } = filters;
        openReport(`/print_echeancier_anneescolaire?idAnne=${idAnne}`);
    };

    // Effectif & Recettes par promotion
    const printBillEffectifRecette = () => {
        if (!requireFields(["idAnne"])) return;
        const { idAnne } = filters;
        openReport(`/print_effectif_promotion?idAnne=${idAnne}`);
    };

    // ========================= UI =========================

    return (
        <div className="col-md-12">
            <div className="row">
                {/* Colonne principale : filtres & actions */}
                <div className="col-md-8 col-sm-12 mb-3">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <h5 className="mb-0">Rapports d’inscription & prévisions</h5>
                                    <small className="text-muted">
                                        Générer rapidement des états consolidés, par classe ou option.
                                    </small>
                                </div>

                                {dateRangeText && (
                                    <div className="mt-1">
                                        <small className="text-muted">
                                            Période : {dateRangeText}
                                        </small>
                                    </div>
                                )}
                                <LoadingSpinner loading={loading} />
                            </div>

                            <hr />

                            {/* Dates */}
                            <div className="row mb-3">
                                <div className="col-md-6 mb-2">
                                    <TextField
                                        label="Date début"
                                        name="date1"
                                        type="date"
                                        value={date1}
                                        onChange={(e) => setDate1(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-6 mb-2">
                                    <TextField
                                        label="Date fin"
                                        name="date2"
                                        type="date"
                                        value={date2}
                                        onChange={(e) => setDate2(e.target.value)}
                                    />

                                </div>
                            </div>

                            {/* Filtres académiques */}
                            <div className="row mb-3">
                                <div className="col-md-6 mb-2">
                                    <SelectPickerField
                                        label="Année scolaire"
                                        name="idAnne"
                                        value={filters.idAnne || ""}
                                        options={anneeOptions}
                                        onChange={(v) => updateFilter("idAnne", v)}
                                        required={false}
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
                                        required={false}
                                    />
                                </div>
                                <div className="col-md-6 mb-2">
                                    <SelectPickerField
                                        label="Option"
                                        name="idOption"
                                        value={filters.idOption || ""}
                                        options={optionOptions}
                                        onChange={(v) => updateFilter("idOption", v)}
                                        required={false}
                                    />
                                </div>
                                <div className="col-md-6 mb-2">
                                    <SelectPickerField
                                        label="Classe"
                                        name="idClasse"
                                        value={filters.idClasse || ""}
                                        options={classeOptions}
                                        onChange={(v) => updateFilter("idClasse", v)}
                                        required={false}
                                    />
                                </div>
                            </div>

                            {/* Bloc: Inscriptions */}
                            <div className="mb-3">
                                <h6 className="text-uppercase text-muted mb-2">
                                    Inscriptions & effectifs
                                </h6>
                                <div className="d-grid gap-2">
                                    <button
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={printRapportInscriptionClasse}
                                    >
                                        Rapport inscriptions par classe
                                    </button>
                                    <button
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={printFicheInscriptionClasse}
                                    >
                                        Fiche d’inscription par classe
                                    </button>
                                    <button
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={printFicheInscriptionNouveauClasse}
                                    >
                                        Nouveaux inscrits par classe
                                    </button>
                                    <button
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={printRapportInscriptionOption}
                                    >
                                        Rapport inscriptions par option
                                    </button>
                                    <button
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={printRapportInscriptionNouveauOption}
                                    >
                                        Nouveaux inscrits par option
                                    </button>
                                </div>
                            </div>

                            {/* Bloc: Mesures incitatives */}
                            <div className="mb-3">
                                <h6 className="text-uppercase text-muted mb-2">
                                    Mesures incitatives / Réductions
                                </h6>
                                <div className="d-grid gap-2">
                                    <button
                                        className="btn btn-outline-warning btn-sm"
                                        onClick={printRapportInscriptionClasseReduction}
                                    >
                                        Mesures incitatives par classe
                                    </button>
                                    <button
                                        className="btn btn-outline-warning btn-sm"
                                        onClick={printRapportInscriptionOptionReduction}
                                    >
                                        Mesures incitatives par option
                                    </button>
                                </div>
                            </div>

                            {/* Bloc: Paiements */}
                            <div className="mb-3">
                                <h6 className="text-uppercase text-muted mb-2">
                                    Paiements & suivi financier
                                </h6>
                                <div className="d-grid gap-2">
                                    <button
                                        className="btn btn-outline-success btn-sm"
                                        onClick={PrintRapportDetailPaiement}
                                    >
                                        Rapport journalier des paiements (intervalle)
                                    </button>
                                    <button
                                        className="btn btn-outline-success btn-sm"
                                        onClick={PrintRapportDetailPaiementClasse}
                                    >
                                        Rapport paiements par classe (intervalle)
                                    </button>
                                </div>
                            </div>

                            {/* Bloc: Prévisions */}
                            <div className="mb-1">
                                <h6 className="text-uppercase text-muted mb-2">
                                    Prévisions & tableaux de bord
                                </h6>
                                <div className="d-grid gap-2">
                                    <button
                                        className="btn btn-outline-dark btn-sm"
                                        onClick={printBillPrevisionClasse}
                                    >
                                        Prévision de paiement par classe
                                    </button>
                                    <button
                                        className="btn btn-outline-dark btn-sm"
                                        onClick={printBillPrevisionGenerale}
                                    >
                                        Prévision générale (année scolaire)
                                    </button>
                                    <button
                                        className="btn btn-outline-info btn-sm"
                                        onClick={printBillEffectifRecette}
                                    >
                                        Tableau effectifs & recettes par promotion
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Colonne droite : espace pour profil / stats / widgets */}
                <div className="col-md-4 col-sm-12">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body d-flex flex-column justify-content-center text-center">
                            <div className="d-flex flex-column justify-content-center text-center mb-2">
                                <PieChartComponent data={statUser} title="Évolution des inscriptions par année scolaire" />
                            </div>

                            <div className="d-flex flex-column justify-content-center text-center mb-2">
                                <BarChartComponent data={statUser} color="#6a82fb" title="Répartition des options des élèves" />
                            </div>

                            
                            <h6 className="text-muted mb-2">Centre de contrôle</h6>
                            <p className="text-muted mb-3">
                                Utilisez les filtres à gauche pour générer des rapports PDF
                                détaillés sur les inscriptions, paiements et prévisions.
                            </p>
                            <i className="fas fa-chart-line fa-3x text-secondary mb-2" />
                            <small className="text-muted">
                                Bloc disponible pour un widget profil, indicateurs clés, etc.
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
