import React, { useEffect, useState } from "react";
import { fetchListItems } from "../../api/callApi";
import {
    fileUrl,
    showErrorMessage,
    showWarningMessage,
} from "../../api/config";
import {
    TextField,
    SelectPickerField,
} from "../../components";
import LoadingSpinner from "../../components/LoadingSpinner";
import PieChartComponent from "../../components/charts/PieChartComponent";
import BarChartComponent from "../../components/charts/BarChartComponent";

interface OptionItem {
    value: string;
    label: string;
}

export default function RapportResultatsPage() {
    const [loading, setLoading] = useState(false);

    // === Données & filtres ===
    const [anneeOptions, setAnneeOptions] = useState<OptionItem[]>([]);
    const [sectionOptions, setSectionOptions] = useState<OptionItem[]>([]);
    const [optionOptions, setOptionOptions] = useState<OptionItem[]>([]);
    const [classeOptions, setClasseOptions] = useState<OptionItem[]>([]);
    const [periodeOptions, setPeriodeOptions] = useState<OptionItem[]>([]);
    const [enseignantOptions, setEnseignantOptions] = useState<OptionItem[]>([]);
    const [eleveOptions, setEleveOptions] = useState<OptionItem[]>([]);
    const [catCoursOptions, setCatCoursOptions] = useState<OptionItem[]>([]);
    const [coursOptions, setCoursOptions] = useState<OptionItem[]>([]);

    const [formData, setFormData] = useState({
        idAnne: "",
        idSection: "",
        idOption: "",
        idClasse: "",
        idPeriode: "",
        idEnseignant: "",
        idInscription: "",
        idCatCours: "",
        idCours: "",
    });

    // === Graphiques (facultatif : exemples de données statiques) ===
    const [statResultats, setStatResultats] = useState([
        { name: "Réussite", value: 72 },
        { name: "Échec", value: 28 },
    ]);
    const [statCours, setStatCours] = useState([
        { name: "Mathématiques", value: 18 },
        { name: "Physique", value: 14 },
        { name: "Français", value: 12 },
        { name: "Biologie", value: 10 },
    ]);

    // === Fonctions helpers ===
    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (field === "idSection") loadOptionsBySection(value);
        if (field === "idCatCours") loadCoursByCatCours(value);

        if (field === "idOption" && formData.idClasse) {
            loadEleves(value, formData.idClasse);
        }

        if (field === "idClasse" && formData.idOption) {
            loadEleves(formData.idOption, value);
        }

    };

    const validateFields = (...fields: string[]) =>
        fields.every((f) => formData[f as keyof typeof formData] !== "");

    const openReport = (url: string) => {
        window.open(`${fileUrl}${url}`, "_blank");
    };

    // === Récupération des données ===
    useEffect(() => {
        Promise.all([
            loadAnnees(),
            loadSections(),
            loadClasses(),
            loadPeriodes(),
            loadCatCours(),
            loadEnseignants(),
        ]);
    }, []);
    // ✅ Charger les élèves inscrits selon année, option et classe
    const loadEleves = async (idOption: string, idClasse: string) => {
        if (!formData.idAnne) {
            return showWarningMessage("Veuillez sélectionner une année scolaire d'abord.");
        }

        try {
            const res = await fetchListItems(
                `/get_eleve_inscript_par_classe/${formData.idAnne}/${idOption}/${idClasse}`
            );

            // Adaptation de la structure de l'API
            setEleveOptions(
                (res.data || []).map((x: any) => ({
                    value: x.id,
                    label: `${x.Noms} (${x.nomClasse} - ${x.nomOption})`,
                }))
            );
        } catch (err) {
            showErrorMessage("Erreur de chargement des élèves inscrits.");
            setEleveOptions([]);
        }
    };

    const loadAnnees = async () => {
        try {
            const res = await fetchListItems("/fetch_anne_scolaire");
            setAnneeOptions(res.data.map((x: any) => ({ value: x.id, label: x.designation })));
        } catch {
            setAnneeOptions([]);
        }
    };
    const loadSections = async () => {
        try {
            const res = await fetchListItems("/fetch_section_2");
            setSectionOptions(res.data.map((x: any) => ({ value: x.id, label: x.nomSection })));
        } catch {
            setSectionOptions([]);
        }
    };
    const loadOptionsBySection = async (idSection: string) => {
        if (!idSection) return;
        try {
            const res = await fetchListItems(`/fetch_option_by_section/${idSection}`);
            setOptionOptions(res.data.map((x: any) => ({ value: x.id, label: x.nomOption })));
        } catch {
            setOptionOptions([]);
        }
    };
    const loadClasses = async () => {
        try {
            const res = await fetchListItems("/fetch_classe_2");
            setClasseOptions(res.data.map((x: any) => ({ value: x.id, label: x.nomClasse })));
        } catch {
            setClasseOptions([]);
        }
    };
    const loadPeriodes = async () => {
        try {
            const res = await fetchListItems("/fetch_periode");
            setPeriodeOptions(res.data.map((x: any) => ({ value: x.id, label: x.nomPeriode })));
        } catch {
            setPeriodeOptions([]);
        }
    };
    const loadCatCours = async () => {
        try {
            const res = await fetchListItems("/fetch_cat_cours_2");
            setCatCoursOptions(res.data.map((x: any) => ({ value: x.id, label: x.nomCatCours })));
        } catch {
            setCatCoursOptions([]);
        }
    };
    const loadCoursByCatCours = async (idCatCours: string) => {
        if (!idCatCours) return;
        try {
            const res = await fetchListItems(`/fetch_cours_by_catcours/${idCatCours}`);
            setCoursOptions(res.data.map((x: any) => ({ value: x.idCours, label: x.nomCours })));
        } catch {
            setCoursOptions([]);
        }
    };
    const loadEnseignants = async () => {
        try {
            const res = await fetchListItems("/fetch_enseignant");
            setEnseignantOptions(res.data.map((x: any) => ({ value: x.id, label: x.nomEns })));
        } catch {
            setEnseignantOptions([]);
        }
    };

    // === Impression rapports ===
    const rapportCoursParClasse = () => {
        const { idAnne, idOption, idClasse, idPeriode } = formData;
        if (!validateFields("idAnne", "idOption", "idClasse", "idPeriode"))
            return showWarningMessage("Veuillez remplir tous les champs requis.");
        openReport(`/print_cours_par_classe?idAnne=${idAnne}&idOption=${idOption}&idClasse=${idClasse}&idPeriode=${idPeriode}`);
    };
    const rapportCoursParEnseignant = () => {
        const { idAnne, idPeriode, idEnseignant } = formData;
        if (!validateFields("idAnne", "idPeriode", "idEnseignant"))
            return showWarningMessage("Veuillez remplir tous les champs requis.");
        openReport(`/print_cours_par_enseignant?idAnne=${idAnne}&idPeriode=${idPeriode}&idEnseignant=${idEnseignant}`);
    };
    const rapportRepartitionCours = () => {
        const { idAnne, idOption, idClasse, idPeriode } = formData;
        if (!validateFields("idAnne", "idOption", "idClasse", "idPeriode"))
            return showWarningMessage("Veuillez remplir tous les champs requis.");
        openReport(`/print_cours_aux_enseignants_par_classe?idAnne=${idAnne}&idOption=${idOption}&idClasse=${idClasse}&idPeriode=${idPeriode}`);
    };
    const rapportResultatParClasse = () => {
        const { idAnne, idOption, idClasse, idPeriode } = formData;
        if (!validateFields("idAnne", "idOption", "idClasse", "idPeriode"))
            return showWarningMessage("Veuillez remplir tous les champs requis.");
        openReport(`/print_resultat_cotation_par_classe?idAnne=${idAnne}&idOption=${idOption}&idClasse=${idClasse}&idPeriode=${idPeriode}`);
    };
    const rapportResultatParEleve = () => {
        const { idAnne, idOption, idClasse, idPeriode, idInscription } = formData;
        if (!validateFields("idAnne", "idOption", "idClasse", "idPeriode", "idInscription"))
            return showWarningMessage("Veuillez remplir tous les champs requis.");
        openReport(`/print_resultat_cotation_par_eleve?idAnne=${idAnne}&idOption=${idOption}&idClasse=${idClasse}&idPeriode=${idPeriode}&idInscription=${idInscription}`);
    };

    //resultat annuel
    const rapportResultatAnnuelParClasse = () => {
        const { idAnne, idOption, idClasse, idPeriode } = formData;
        if (!validateFields("idAnne", "idOption", "idClasse", "idPeriode"))
            return showWarningMessage("Veuillez remplir tous les champs requis.");
        openReport(`/print_resultat_annuel_par_classe?idAnne=${idAnne}&idOption=${idOption}&idClasse=${idClasse}&idPeriode=${idPeriode}`);
    };

    const rapportResultatAnnuelGlobalParClasse = () => {
        const { idAnne, idOption, idClasse, idPeriode } = formData;
        if (!validateFields("idAnne", "idOption", "idClasse", "idPeriode"))
            return showWarningMessage("Veuillez remplir tous les champs requis.");
        openReport(`/print_resultat_annuel_global_par_classe?idAnne=${idAnne}&idOption=${idOption}&idClasse=${idClasse}&idPeriode=${idPeriode}`);
    };

    const rapportResultatAnnuelGlobalParEleve = () => {
        const { idAnne, idOption, idClasse, idPeriode, idInscription } = formData;
        if (!validateFields("idAnne", "idOption", "idClasse", "idPeriode", "idInscription"))
            return showWarningMessage("Veuillez remplir tous les champs requis.");
        openReport(`/print_resultat_annuel_global_par_eleve?idAnne=${idAnne}&idOption=${idOption}&idClasse=${idClasse}&idPeriode=${idPeriode}&idInscription=${idInscription}`);
    };


    const rapportBulletinAnnuelGlobalParEleve = () => {
        const { idAnne, idOption, idClasse, idPeriode, idInscription } = formData;
        if (!validateFields("idAnne", "idOption", "idClasse", "idPeriode", "idInscription"))
            return showWarningMessage("Veuillez remplir tous les champs requis.");
        openReport(`/print_bulletin_annuel_par_eleve?idAnne=${idAnne}&idOption=${idOption}&idClasse=${idClasse}&idPeriode=${idPeriode}&idInscription=${idInscription}`);
    };

    

    

    

    // === Rendu ===
    return (
        <div className="col-md-12">
            <div className="row">
                {/* === Colonne gauche : Filtres et rapports === */}
                <div className="col-md-12 col-sm-12 mb-3">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <h5 className="mb-0">Rapports sur les résultats scolaires</h5>
                                    <small className="text-muted">
                                        Générez rapidement des états de cours, répartitions et proclamations.
                                    </small>
                                </div>
                                <LoadingSpinner loading={loading} />
                            </div>

                            <hr />

                            {/* === Filtres académiques === */}
                            <div className="row mb-3">
                                <div className="col-lg-4 col-md-6 col-sm-12 col-xs-12 col-12 mb-2">
                                    <SelectPickerField name="idAnne" label="Année scolaire" value={formData.idAnne}
                                        options={anneeOptions} onChange={(v) => handleChange("idAnne", v)} />
                                </div>
                                <div className="col-lg-4 col-md-6 col-sm-12 col-xs-12 col-12 mb-2">
                                    <SelectPickerField name="idSection" label="Section" value={formData.idSection}
                                        options={sectionOptions} onChange={(v) => handleChange("idSection", v)} />
                                </div>
                                <div className="col-lg-4 col-md-6 col-sm-12 col-xs-12 col-12 mb-2">
                                    <SelectPickerField name="idOption" label="Option" value={formData.idOption}
                                        options={optionOptions} onChange={(v) => handleChange("idOption", v)} />
                                </div>
                                <div className="col-lg-6 col-md-6 col-sm-12 col-xs-12 col-12 mb-2">
                                    <SelectPickerField name="idClasse" label="Classe" value={formData.idClasse}
                                        options={classeOptions} onChange={(v) => handleChange("idClasse", v)} />
                                </div>
                                <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12 col-12 mb-2">
                                    <SelectPickerField name="idPeriode" label="Période" value={formData.idPeriode}
                                        options={periodeOptions} onChange={(v) => handleChange("idPeriode", v)} />
                                </div>
                                <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12 col-12 mb-2">
                                    <SelectPickerField name="idEnseignant" label="Enseignant" value={formData.idEnseignant}
                                        options={enseignantOptions} onChange={(v) => handleChange("idEnseignant", v)} />
                                </div>
                                <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12 col-12 mb-2">
                                    <SelectPickerField name="idInscription" label="Élève" value={formData.idInscription}
                                        options={eleveOptions} onChange={(v) => handleChange("idInscription", v)} />
                                </div>
                                <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12 col-12 mb-2">
                                    <SelectPickerField name="idCatCours" label="Catégorie de cours" value={formData.idCatCours}
                                        options={catCoursOptions} onChange={(v) => handleChange("idCatCours", v)} />
                                </div>
                                <div className="col-lg-6 col-md-12 col-sm-12 col-xs-12 col-12 mb-2">
                                    <SelectPickerField name="idCours" label="Cours" value={formData.idCours}
                                        options={coursOptions} onChange={(v) => handleChange("idCours", v)} />
                                </div>
                            </div>

                            {/* === Bloc: Attribution des cours === */}
                            <div className="mb-3">
                                <h6 className="text-uppercase text-muted mb-2">
                                    Attribution & répartition des cours
                                </h6>
                                <div className="d-grid gap-2">
                                    <button className="btn btn-outline-dark btn-sm" onClick={rapportCoursParClasse}>
                                        Rapport des cours par classe
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={rapportCoursParEnseignant}>
                                        Rapport des cours par enseignant
                                    </button>
                                    <button className="btn btn-outline-warning btn-sm" onClick={rapportRepartitionCours}>
                                        Répartition des cours par enseignant
                                    </button>
                                </div>
                            </div>

                            {/* === Bloc: Résultats scolaires === */}
                            <div className="mb-3">
                                <h6 className="text-uppercase text-muted mb-2">
                                    Résultats & proclamations
                                </h6>
                                <div className="d-grid gap-2">
                                    <button className="btn btn-outline-success btn-sm" onClick={rapportResultatParClasse}>
                                        Résultats par classe
                                    </button>
                                    <button className="btn btn-outline-primary btn-sm" onClick={rapportResultatParEleve}>
                                        Résultats par élève
                                    </button>
                                </div>
                            </div>

                            <div className="mb-3">
                                <h6 className="text-uppercase text-muted mb-2">
                                    Résultats & proclamations Annuelle
                                </h6>
                                <div className="d-grid gap-2">
                                    <button className="btn btn-outline-primary btn-sm" onClick={rapportResultatAnnuelParClasse}>
                                        RÉSULTATS FINAUX DE LA CLASSE
                                    </button>
                                   
                                    <button className="btn btn-outline-dark btn-sm" onClick={rapportResultatAnnuelGlobalParClasse}>
                                        Cumul global des résultats annuels par période
                                    </button>
                                    <button className="btn btn-outline-dark btn-sm" onClick={rapportResultatAnnuelGlobalParEleve}>
                                        Cumul global des résultats annuels par élève
                                    </button>


                                    
                                    <button className="btn btn-outline-success btn-sm" onClick={rapportBulletinAnnuelGlobalParEleve}>
                                        Bulletin annuel par élève
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* === Colonne droite : Graphiques & widgets === */}
                {/* <div className="col-md-4 col-sm-12">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body d-flex flex-column justify-content-center text-center">
                            <div className="d-flex flex-column justify-content-center text-center mb-3">
                                <PieChartComponent data={statResultats} title="Taux de réussite global" />
                            </div>
                            <div className="d-flex flex-column justify-content-center text-center mb-3">
                                <BarChartComponent data={statCours} color="#6a82fb" title="Répartition des cours attribués" />
                            </div>

                            <h6 className="text-muted mb-2">Centre de rapports</h6>
                            <p className="text-muted mb-3">
                                Utilisez les filtres à gauche pour générer les rapports PDF d’attribution et de résultats.
                            </p>
                            <i className="fas fa-chart-line fa-3x text-secondary mb-2" />
                            <small className="text-muted">
                                Espace libre pour indicateurs, tendances, ou profil enseignant.
                            </small>
                        </div>
                    </div>
                </div> */}
            </div>
        </div>
    );
}
