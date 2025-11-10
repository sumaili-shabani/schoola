import React, { useEffect, useState } from "react";
import {
    fetchListItems,
    saveItem,
    showConfirmationDialog,
} from "../../api/callApi";
import {
    showErrorMessage,
    showSuccessMessage,
    showWarningMessage,
} from "../../api/config";
import {
    Modal,
    SelectPickerField,
    LoaderAndError,
} from "../../components";
import LoadingSpinner from "../../components/LoadingSpinner";

interface AttributionCoursMultipleModalProps {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface OptionItem {
    value: string;
    label: string;
}

interface CoursRow {
    idCours: number;
    nomCours: string;
    nomCatCours: string;
    nomEns?: string;
    idEnseignant?: string;
    maximale?: number;
}

export default function AttributionCoursMultipleModal({
    show,
    onClose,
    onSuccess,
}: AttributionCoursMultipleModalProps) {
    const [loading, setLoading] = useState(false);
    const [anneeOptions, setAnneeOptions] = useState<OptionItem[]>([]);
    const [sectionOptions, setSectionOptions] = useState<OptionItem[]>([]);
    const [optionOptions, setOptionOptions] = useState<OptionItem[]>([]);
    const [classeOptions, setClasseOptions] = useState<OptionItem[]>([]);
    const [periodeOptions, setPeriodeOptions] = useState<OptionItem[]>([]);
    const [enseignantOptions, setEnseignantOptions] = useState<OptionItem[]>([]);
    const [coursList, setCoursList] = useState<CoursRow[]>([]);
    const [selectedCours, setSelectedCours] = useState<CoursRow[]>([]);

    const [form, setForm] = useState({
        idAnne: "",
        idSection: "",
        idOption: "",
        idClasse: "",
        idPeriode: "",
    });

    // === LOAD lists on modal open ===
    useEffect(() => {
        if (show) {
            loadAnnees();
            loadSections();
            loadClasses();
            loadPeriodes();
            loadEnseignants();
        }
    }, [show]);

    // === Load dropdowns ===
    const loadAnnees = async () => {
        const res = await fetchListItems("/fetch_anne_scolaire");
        setAnneeOptions((res?.data || []).map((x: any) => ({
            value: String(x.id),
            label: x.designation,
        })));
    };

    const loadSections = async () => {
        const res = await fetchListItems("/fetch_section_2");
        setSectionOptions((res?.data || []).map((x: any) => ({
            value: String(x.id),
            label: x.nomSection,
        })));
    };

    const loadClasses = async () => {
        const res = await fetchListItems("/fetch_classe_2");
        setClasseOptions((res?.data || []).map((x: any) => ({
            value: String(x.id),
            label: x.nomClasse,
        })));
    };

    const loadPeriodes = async () => {
        const res = await fetchListItems("/fetch_periode");
        setPeriodeOptions((res?.data || []).map((x: any) => ({
            value: String(x.id),
            label: x.nomPeriode,
        })));
    };

    const loadEnseignants = async () => {
        const res = await fetchListItems("/fetch_enseignant_2");
        setEnseignantOptions((res?.data || []).map((x: any) => ({
            value: String(x.id),
            label: x.nomEns,
        })));
    };

    const loadOptionsBySection = async (idSection: string) => {
        const res = await fetchListItems(`/fetch_option_by_section/${idSection}`);
        setOptionOptions((res?.data || []).map((x: any) => ({
            value: String(x.id),
            label: x.nomOption,
        })));
    };

    // === Handlers ===
    const handleSelectChange = (field: keyof typeof form, val: string) => {
        setForm((prev) => ({ ...prev, [field]: val }));
        if (field === "idSection") loadOptionsBySection(val);
    };

    const loadCoursList = async () => {
        const { idAnne, idOption, idClasse, idPeriode } = form;
        if (!idAnne || !idOption || !idClasse) {
            showWarningMessage("Veuillez sélectionner tous les filtres avant de charger les cours.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetchListItems(`/getListCoursClasse_ui/${idAnne}/${idOption}/${idClasse}`);
            const list = (res?.data || []).map((x: any) => ({
                idCours: x.idCours,
                nomCours: x.nomCours,
                nomCatCours: x.nomCatCours,
                idEnseignant: x.idEnseignant,
                nomEns: x.nomEns,
                maximale: x.maximale || 20,
            }));
            setCoursList(list);
        } catch (err) {
            showErrorMessage(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEnseignantChange = (idCours: number, idEnseignant: string) => {
        setCoursList((prev) =>
            prev.map((c) =>
                c.idCours === idCours ? { ...c, idEnseignant } : c
            )
        );
    };

    const handleMaxChange = (idCours: number, value: string) => {
        setCoursList((prev) =>
            prev.map((c) =>
                c.idCours === idCours ? { ...c, maximale: Number(value) } : c
            )
        );
    };

    const handleAddToBatch = (cours: CoursRow) => {
        if (!cours.idEnseignant) {
            showWarningMessage("Sélectionnez d'abord un enseignant.");
            return;
        }
        if (!cours.maximale || cours.maximale <= 0) {
            showWarningMessage("Veuillez définir un point maximal valide.");
            return;
        }
        if (!selectedCours.find((c) => c.idCours === cours.idCours)) {
            setSelectedCours((prev) => [...prev, cours]);
            showSuccessMessage(`Cours "${cours.nomCours}" ajouté.`);
        } else {
            showWarningMessage("Ce cours est déjà dans la liste.");
        }
    };

    const handleSaveAll = async () => {
        const { idAnne, idOption, idClasse, idPeriode } = form;
        if (!idAnne || !idOption || !idClasse || !idPeriode) {
            showWarningMessage("Complétez tous les champs avant l’enregistrement.");
            return;
        }

        if (selectedCours.length === 0) {
            showWarningMessage("Aucun cours sélectionné.");
            return;
        }

        const batch = selectedCours.map((c) => ({
            idCours: c.idCours,
            idEnseignant: c.idEnseignant,
            idPeriode,
            idAnne,
            idOption,
            idClasse,
            maximale: c.maximale,
        }));

        const confirmed = await showConfirmationDialog({
            title: "Confirmer l’enregistrement multiple",
            text: `Vous allez enregistrer ${batch.length} attributions.`,
            icon: "question",
            confirmButtonText: "Oui, enregistrer",
        });
        if (!confirmed) return;

        try {
            setLoading(true);
            const res = await saveItem("/insert_multiple_attribution_cours", { batch });
            showSuccessMessage(res || "Attributions enregistrées !");
            setSelectedCours([]);
            onSuccess();
            onClose();
        } catch (err) {
            showErrorMessage(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            show={show}
            onClose={onClose}
            title="Attribution multiple des cours"
            dimension="modal-xl"
        >
            <LoaderAndError loading={loading} error={null} />

            <div className="row">
                <div className="col-lg-6 col-md-12 col-sm-12 c0l-xs-12 col-12">
                    <SelectPickerField
                        name="idAnne"
                        label="Année scolaire"
                        icon="fas fa-calendar"
                        options={anneeOptions}
                        value={form.idAnne}
                        onChange={(v) => handleSelectChange("idAnne", v)}
                    />
                </div>
                <div className="col-lg-6 col-md-12 col-sm-12 c0l-xs-12 col-12">
                    <SelectPickerField
                        name="idSection"
                        label="Section"
                        icon="fas fa-layer-group"
                        options={sectionOptions}
                        value={form.idSection}
                        onChange={(v) => handleSelectChange("idSection", v)}
                    />
                </div>
                <div className="col-lg-6 col-md-12 col-sm-12 c0l-xs-12 col-12">
                    <SelectPickerField
                        name="idOption"
                        label="Option"
                        icon="fas fa-list"
                        options={optionOptions}
                        value={form.idOption}
                        onChange={(v) => handleSelectChange("idOption", v)}
                    />
                </div>
                <div className="col-lg-6 col-md-12 col-sm-12 c0l-xs-12 col-12">
                    <SelectPickerField
                        name="idClasse"
                        label="Classe"
                        icon="fas fa-home"
                        options={classeOptions}
                        value={form.idClasse}
                        onChange={(v) => handleSelectChange("idClasse", v)}
                    />
                </div>
                <div className="col-lg-6 col-md-12 col-sm-12 c0l-xs-12 col-12">
                    <SelectPickerField
                        name="idPeriode"
                        label="Période"
                        icon="fas fa-clock"
                        options={periodeOptions}
                        value={form.idPeriode}
                        onChange={(v) => handleSelectChange("idPeriode", v)}
                    />
                </div>
                <div className="col-md-12 mb-3 text-start">
                    <button
                        className="btn btn-outline-secondary btn-sm me-2"
                        onClick={loadCoursList}
                    >
                        <i className="fas fa-sync-alt me-1"></i> Charger les cours
                    </button>
                    <LoadingSpinner loading={loading} />
                </div>
            </div>

            {/* === Grille des cours === */}
            <div className="row">
                {coursList.length === 0 ? (
                    <p className="text-center text-muted">Aucun cours à afficher.</p>
                ) : (
                    coursList.map((c, i) => (
                        <div key={i} className="col-lg-4 col-md-6 col-sm-12 c0l-xs-12 col-12 mb-2">
                            <div className="card shadow-sm border-0 h-100">
                                <div className="card-body">
                                    <h6 className="card-title text-primary">
                                        {c.nomCours}
                                    </h6>
                                    <p className="text-muted mb-1">
                                        Catégorie : <b>{c.nomCatCours}</b>
                                    </p>
                                    <p className="text-muted mb-1">
                                        Ensignant : <b>{c.nomEns??''}</b>
                                    </p>

                                    <SelectPickerField
                                        name={`enseignant_${c.idCours}`}
                                        label="Enseignant"
                                        icon="fas fa-user"
                                        options={enseignantOptions}
                                        value={c.idEnseignant || ""}
                                        onChange={(v) => handleEnseignantChange(c.idCours, v)}
                                    />

                                    <div className="mt-2">
                                        <label className="form-label small mb-1">Point Maximal</label>
                                        <input
                                            type="number"
                                            min={1}
                                            className="form-control form-control-sm"
                                            value={c.maximale || ""}
                                            onChange={(e) => handleMaxChange(c.idCours, e.target.value)}
                                        />
                                    </div>

                                    <button
                                        className="btn btn-sm btn-success mt-3 w-100"
                                        onClick={() => handleAddToBatch(c)}
                                    >
                                        <i className="fas fa-plus me-1"></i> Ajouter à la liste
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* === Bouton global === */}
            {selectedCours.length > 0 && (
                <div className="alert alert-info mt-3">
                    <i className="fas fa-check-circle me-2"></i>
                    {selectedCours.length} cours prêts à être enregistrés
                </div>
            )}

            <div className="text-end mt-3">
                <button className="btn btn-outline-secondary me-2" onClick={onClose}>
                    Fermer
                </button>
                <button className="btn btn-primary" onClick={handleSaveAll}>
                    <i className="fas fa-save me-1"></i> Enregistrer tout
                </button>
            </div>
        </Modal>
    );
}
