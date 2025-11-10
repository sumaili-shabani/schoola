// src/pages/enseignement/CotationEditMultipleModal.tsx

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
} from "../../components";
import LoadingSpinner from "../../components/LoadingSpinner";

interface CotationEditMultipleModalProps {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface OptionItem {
    value: string;
    label: string;
}

interface CoteRow {
    id: number;
    idCours: number;
    nomCours: string;
    maxima: number;
    cote: number | null;
}

export default function CotationEditMultipleModal({
    show,
    onClose,
    onSuccess,
}: CotationEditMultipleModalProps) {
    const [loading, setLoading] = useState(false);
    const [anneeOptions, setAnneeOptions] = useState<OptionItem[]>([]);
    const [sectionOptions, setSectionOptions] = useState<OptionItem[]>([]);
    const [optionOptions, setOptionOptions] = useState<OptionItem[]>([]);
    const [classeOptions, setClasseOptions] = useState<OptionItem[]>([]);
    const [periodeOptions, setPeriodeOptions] = useState<OptionItem[]>([]);
    const [eleveOptions, setEleveOptions] = useState<OptionItem[]>([]);
    const [coursList, setCoursList] = useState<CoteRow[]>([]);
    const [form, setForm] = useState({
        idAnne: "",
        idClasse: "",
        idOption: "",
        idPeriode: "",
        idInscription: "",
        idSection:"",
    });

    // Charger les listes
    useEffect(() => {
        if (show) {
            loadAnnees();
            loadSections();
            loadClasses();
            loadPeriodes();
        }
    }, [show]);

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
        setAnneeOptions((res?.data || []).map((x: any) => ({
            value: String(x.id),
            label: x.designation,
        })));
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

    const loadOptionsBySection = async (idSection: string) => {
        const res = await fetchListItems(`/fetch_option_by_section/${idSection}`);
        setOptionOptions(
            (res?.data || []).map((x: any) => ({
                value: String(x.id),
                label: x.nomOption,
            }))
        );
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

    const loadEleves = async (idAnne: string, idOption: string, idClasse: string) => {
        const res = await fetchListItems(`/get_eleve_inscript_par_classe/${idAnne}/${idOption}/${idClasse}`);
        setEleveOptions((res?.data || []).map((x: any) => ({
            value: String(x.id),
            label: `${x.Noms} (${x.nomClasse})`,
        })));
    };

    const handleSelectChange = (field: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));

        if (field === "idSection") loadOptionsBySection(value);

        if (field === "idClasse" && form.idAnne && form.idOption) {
            loadEleves(form.idAnne, form.idOption, value);
        }
    };

    const loadCotesExistantes = async () => {
        const { idInscription, idPeriode } = form;
        if (!idInscription || !idPeriode) {
            showWarningMessage("Veuillez choisir un élève et une période.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetchListItems(`/get_cotation_par_eleve/${idInscription}/${idPeriode}`);
            setCoursList(res?.data || []);
        } catch (err) {
            showErrorMessage(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCoteChange = (id: number, value: string) => {
        setCoursList((prev) =>
            prev.map((c) =>
                c.id === id ? { ...c, cote: Number(value) } : c
            )
        );
    };

    const handleSaveAll = async () => {
        const invalid = coursList.find((c) => c.cote! > c.maxima);
        if (invalid) {
            showErrorMessage(`La cote du cours "${invalid.nomCours}" dépasse le maxima (${invalid.maxima}).`);
            return;
        }

        const confirmed = await showConfirmationDialog({
            title: "Confirmer la modification",
            text: `Vous allez modifier ${coursList.length} cotes.`,
            icon: "question",
            confirmButtonText: "Oui, modifier",
        });
        if (!confirmed) return;

        try {
            const res = await saveItem("/update_cotation_multiple", { rows: coursList });
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
            title="Modifier les cotes d’un élève"
            dimension="modal-lg"
        >
            <LoaderAndError loading={loading} error={null} />

            <div className="row">
                <div className="col-lg-4">
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

                <div className="col-lg-12 col-md-12 col-sm-12 c0l-xs-12 col-12 mt-2">
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

            <div className="mt-3">
                <button className="btn btn-secondary btn-sm mb-2 me-1" onClick={loadCotesExistantes}>
                    <i className="fas fa-search me-1"></i> Charger les cotes existantes
                </button>
                <LoadingSpinner loading={loading} />

                <table className="table table-bordered table-sm align-middle">
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
                            <tr><td colSpan={4} className="text-center text-muted">Aucune cote à afficher</td></tr>
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
                                            onChange={(e) => handleCoteChange(c.id, e.target.value)}
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
                    <button className="btn btn-primary" onClick={handleSaveAll} disabled={loading}>
                        <i className="fas fa-save me-1"></i> Modifier toutes les cotes
                    </button>
                </div>
            </div>
        </Modal>
    );
}
