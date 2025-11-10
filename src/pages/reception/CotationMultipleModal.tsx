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
    LoaderAndError,
    Modal,
    SelectPickerField,
    TextField,
} from "../../components";
import LoadingSpinner from "../../components/LoadingSpinner";

interface CotationMultipleModalProps {
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
    maxima: number;
    cote?: number;
}

export default function CotationMultipleModal({
    show,
    onClose,
    onSuccess,
}: CotationMultipleModalProps) {
    const [loading, setLoading] = useState(false);
    const [anneeOptions, setAnneeOptions] = useState<OptionItem[]>([]);
    const [sectionOptions, setSectionOptions] = useState<OptionItem[]>([]);
    const [optionOptions, setOptionOptions] = useState<OptionItem[]>([]);
    const [classeOptions, setClasseOptions] = useState<OptionItem[]>([]);
    const [periodeOptions, setPeriodeOptions] = useState<OptionItem[]>([]);
    const [eleveOptions, setEleveOptions] = useState<OptionItem[]>([]);
    const [coursList, setCoursList] = useState<CoursRow[]>([]);
    const [form, setForm] = useState({
        idAnne: "",
        idSection: "",
        idOption: "",
        idClasse: "",
        idPeriode: "",
        idInscription: "",
    });

    // === Load listes initiales ===
    useEffect(() => {
        if (show) {
            loadAnnees();
            loadSections();
            loadClasses();
            loadPeriodes();
        }
    }, [show]);

    // recalc élève + cours si contexte change
    useEffect(() => {
        const { idAnne, idSection, idOption, idClasse, idPeriode, idInscription } = form;

        if (idAnne && idOption && idClasse) {
            loadEleves(idAnne, idOption, idClasse);
        }
        // if(idSection){
        //     loadOptionsBySection(idSection);
        // }

    }, [form.idAnne, form.idOption, form.idClasse, form.idPeriode, form.idSection]);

    const loadAnnees = async () => {
        const res = await fetchListItems("/fetch_anne_scolaire");
        setAnneeOptions(
            (res?.data || []).map((x: any) => ({
                value: String(x.id),
                label: x.designation,
            }))
        );
    };

    const loadSections = async () => {
        const res = await fetchListItems("/fetch_section_2");
        setSectionOptions(
            (res?.data || []).map((x: any) => ({
                value: String(x.id),
                label: x.nomSection,
            }))
        );
    };

    const loadClasses = async () => {
        const res = await fetchListItems("/fetch_classe_2");
        setClasseOptions(
            (res?.data || []).map((x: any) => ({
                value: String(x.id),
                label: x.nomClasse,
            }))
        );
    };

    const loadPeriodes = async () => {
        const res = await fetchListItems("/fetch_periode");
        setPeriodeOptions(
            (res?.data || []).map((x: any) => ({
                value: String(x.id),
                label: x.nomPeriode,
            }))
        );
    };

    const loadOptionsBySection = async (idSection: string) => {
        const res = await fetchListItems(`/fetch_option_by_section/${idSection}`);
        setOptionOptions(
            (res?.data || []).map((x: any) => ({
                value: String(x.id),
                label: x.nomOption,
            }))
        );
    };


    const loadEleves = async (
        idAnne?: string | number,
        idOption?: string | number,
        idClasse?: string | number
    ) => {
        if (!idAnne || !idOption || !idClasse) {
            setEleveOptions([]);
            return;
        }
        try {
            const res = await fetchListItems(
                `/get_eleve_inscript_par_classe/${idAnne}/${idOption}/${idClasse}`
            );
            setEleveOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.id),
                    label: `${x.Noms} (${x.nomClasse} - ${x.nomOption} ${x.nomDivision})`,
                }))
            );
        } catch {
            setEleveOptions([]);
        }
    };

    const loadCoursList = async () => {
        const { idAnne, idOption, idClasse, idPeriode } = form;
        if (!idAnne || !idOption || !idClasse || !idPeriode) return;
        setLoading(true);
        try {
            const res = await fetchListItems(
                `/getListCoursClasse/${idAnne}/${idOption}/${idClasse}/${idPeriode}`
            );
            const courses = (res?.data || []).map((x: any) => ({
                idCours: x.idCours,
                nomCours: x.nomCours,
                maxima: x.maximale || 20,
            }));
            setCoursList(courses);
        } catch (err) {
            showErrorMessage(err);
        } finally {
            setLoading(false);
        }
    };

    // === Handlers ===
    const handleSelectChange = (field: keyof typeof form, val: string) => {
        setForm((prev) => ({ ...prev, [field]: val }));
        if (field === "idSection") loadOptionsBySection(val);

        // if (field === "idClasse") {
        //     if (!form.idAnne && !form.idOption && !form.idClasse) {
        //         loadEleves(form.idAnne, form.idOption, form.idClasse);

        //     }
        // }

    };

    const handleCoteChange = (idCours: number, value: string) => {
        setCoursList((prev) =>
            prev.map((c) =>
                c.idCours === idCours ? { ...c, cote: Number(value) } : c
            )
        );
    };

    const handleSaveAll = async () => {
        const { idAnne, idOption, idClasse, idPeriode, idInscription } = form;
        if (!idAnne || !idOption || !idClasse || !idPeriode || !idInscription) {
            showWarningMessage("Veuillez remplir toutes les sélections avant d’enregistrer.");
            return;
        }

        const invalid = coursList.find(
            (c) => c.cote !== undefined && c.cote > c.maxima
        );
        if (invalid) {
            showErrorMessage(
                `La cote du cours "${invalid.nomCours}" dépasse le maxima (${invalid.maxima}).`
            );
            return;
        }

        const rows = coursList
            .filter((c) => c.cote !== undefined && c.cote !== null)
            .map((c) => ({
                idInscription,
                idCours: c.idCours,
                idPeriode,
                cote: c.cote,
                maxima: c.maxima,
            }));

        if (rows.length === 0) {
            showWarningMessage("Aucune cote saisie.");
            return;
        }

        const confirmed = await showConfirmationDialog({
            title: "Confirmer l’enregistrement",
            text: `Vous allez enregistrer ${rows.length} cotes.`,
            icon: "question",
            confirmButtonText: "Oui, enregistrer",
        });
        if (!confirmed) return;

        try {
            const res = await saveItem("/insert_cotation_multiple", { rows });
            showSuccessMessage(res);
            onSuccess();
            onClose();
        } catch (err) {
            showErrorMessage(err);
        }
    };

    return (
        <Modal
            show={show}
            onClose={onClose}
            title="Saisie multiple des cotes"
            dimension="modal-xl"
        >
            <LoaderAndError loading={loading} error={null} />

            <div className="row">
                <div className="col-lg-4 col-md-12 col-sm-12 c0l-xs-12 col-12">
                    <SelectPickerField
                        name="idAnne"
                        label="Année scolaire"
                        icon="fas fa-calendar"
                        options={anneeOptions}
                        value={form.idAnne}
                        onChange={(v) => handleSelectChange("idAnne", v)}
                    />
                </div>
                <div className="col-lg-4 col-md-12 col-sm-12 c0l-xs-12 col-12">
                    <SelectPickerField
                        name="idSection"
                        label="Section"
                        icon="fas fa-layer-group"
                        options={sectionOptions}
                        value={form.idSection}
                        onChange={(v) => handleSelectChange("idSection", v)}
                    />
                </div>
                <div className="col-lg-4 col-md-12 col-sm-12 c0l-xs-12 col-12">
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
                <div className="col-lg-12 col-md-12 col-sm-12 c0l-xs-12 col-12">
                    <SelectPickerField
                        name="idInscription"
                        label="Élève"
                        icon="fas fa-user-graduate"
                        options={eleveOptions}
                        value={form.idInscription}
                        onChange={(v) => handleSelectChange("idInscription", v)}
                    />
                </div>
            </div>

            <div className="mt-4">
                <div className="justify-content-start">
                    <button className="btn btn-secondary btn-sm mb-2 me-1" onClick={loadCoursList}>
                        <i className="fas fa-list me-1"></i> Charger les cours
                    </button>
                    <LoadingSpinner loading={loading} />
                </div>

                <table className="table table-sm table-bordered align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>#</th>
                            <th>Cours</th>
                            <th>Maxima</th>
                            <th>Cote</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coursList.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center text-muted">
                                    Aucun cours à afficher
                                </td>
                            </tr>
                        ) : (
                            coursList.map((c, i) => (
                                <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td>{c.nomCours}</td>
                                    <td className="text-center">{c.maxima}</td>
                                    <td>
                                        <input
                                            type="number"
                                            min={0}
                                            max={c.maxima}
                                            className="form-control form-control-sm"
                                            value={c.cote ?? ""}
                                            onChange={(e) => handleCoteChange(c.idCours, e.target.value)}
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="text-end mt-3">
                    <button className="btn btn-outline-secondary me-2" onClick={onClose}>
                        Fermer
                    </button>
                    <button className="btn btn-primary" onClick={handleSaveAll}>
                        <i className="fas fa-save me-1"></i> Enregistrer toutes les cotes
                    </button>
                </div>
            </div>
        </Modal>
    );
}
