import React, { useEffect, useState } from "react";
import {
    fetchListItems,
    showConfirmationDialog,
} from "../../api/callApi";
import {
    fileUrl,
    showErrorMessage,
    showSuccessMessage,
    showWarningMessage,
} from "../../api/config";
import { SelectPickerField, LoaderAndError, TextField } from "../../components";
import LoadingSpinner from "../../components/LoadingSpinner";

interface OptionItem {
    value: string;
    label: string;
}

interface RapportForm {
    refRubEntree?: string | number;
    refRubSortie?: string | number;
    date1?: string;
    date2?: string;
}

export default function RapportComptabilitePage() {
    const [formData, setFormData] = useState<RapportForm>({});
    const [rubEntreeList, setRubEntreeList] = useState<OptionItem[]>([]);
    const [rubSortieList, setRubSortieList] = useState<OptionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDates, setShowDates] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ======================== LOAD LISTS =========================
    const loadRubriques = async () => {
        try {
            setLoading(true);
            const resEntree = await fetchListItems("/fetch_compte_entree");
            const resSortie = await fetchListItems("/fetch_compte_sortie");
            setRubEntreeList(
                (resEntree?.data || []).map((r: any) => ({
                    value: String(r.id),
                    label: r.designation,
                }))
            );
            setRubSortieList(
                (resSortie?.data || []).map((r: any) => ({
                    value: String(r.id),
                    label: r.designation,
                }))
            );
        } catch (e) {
            showErrorMessage("Erreur lors du chargement des rubriques.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRubriques();
    }, []);

    // ======================== HANDLERS =========================
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (field: keyof RapportForm, val: string) => {
        setFormData((prev) => ({ ...prev, [field]: val }));
    };

    const validateDates = (): boolean => {
        const { date1, date2 } = formData;
        if (!date1 || !date2) {
            showWarningMessage("Veuillez choisir les deux dates !");
            return false;
        }
        if (date1 > date2) {
            showErrorMessage("La date de début doit être avant la date de fin !");
            return false;
        }
        return true;
    };

    // ======================== IMPRESSIONS =========================
    const printDepenseByDate = () => {
        if (!validateDates()) return;
        const { date1, date2 } = formData;
        window.open(
            `${fileUrl}/fetch_rapport_sortie_compte_date?date1=${date1}&date2=${date2}`,
            "_blank"
        );
    };

    const printRecetteByDate = () => {
        if (!validateDates()) return;
        const { date1, date2 } = formData;
        window.open(
            `${fileUrl}/fetch_rapport_entree_compte_date?date1=${date1}&date2=${date2}`,
            "_blank"
        );
    };

    const printDepenseByRubrique = () => {
        if (!validateDates() || !formData.refRubSortie) {
            showWarningMessage("Veuillez sélectionner une rubrique de dépense !");
            return;
        }
        const { date1, date2, refRubSortie } = formData;
        window.open(
            `${fileUrl}/fetch_rapport_sortie_compte_date_rubrique?date1=${date1}&date2=${date2}&refRubSortie=${refRubSortie}`,
            "_blank"
        );
    };

    const printRecetteByRubrique = () => {
        if (!validateDates() || !formData.refRubEntree) {
            showWarningMessage("Veuillez sélectionner une rubrique de recette !");
            return;
        }
        const { date1, date2, refRubEntree } = formData;
        window.open(
            `${fileUrl}/fetch_rapport_entree_compte_date_rubrique?date1=${date1}&date2=${date2}&refRubEntree=${refRubEntree}`,
            "_blank"
        );
    };

    // ======================== RENDER =========================
    return (
        <div className="container-fluid mt-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold">
                    <i className="fas fa-file-alt me-2 text-primary"></i> Rapports de
                    Comptabilité
                </h5>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowDates((prev) => !prev)}
                >
                    <i className="fas fa-calendar me-2"></i> {showDates ? "Masquer" : "Afficher"} les filtres
                </button>
            </div>

            {loading && <LoadingSpinner loading={loading} />}
            {error && (
                <div className="alert alert-danger py-2">{error}</div>
            )}

            {showDates && (
                <div className="card shadow-sm">
                    <div className="card-body">
                        <div className="row">
                            {/* Dates */}
                            <div className="col-md-6">
                                <TextField
                                    label="Date de début"
                                    name="date1"
                                    type="date"
                                    value={formData.date1 || ""}
                                    onChange={handleDateChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <TextField
                                    label="Date de fin"
                                    name="date2"
                                    type="date"
                                    value={formData.date2 || ""}
                                    onChange={handleDateChange}
                                    required
                                />
                            </div>

                            <div className="col-md-12 mt-3">
                                <button
                                    className="btn btn-outline-primary w-100 mb-2"
                                    onClick={printDepenseByDate}
                                >
                                    <i className="fas fa-print me-2"></i> Rapport des Dépenses
                                </button>
                                <button
                                    className="btn btn-outline-success w-100 mb-2"
                                    onClick={printRecetteByDate}
                                >
                                    <i className="fas fa-print me-2"></i> Rapport des Recettes
                                </button>
                            </div>

                            {/* Rubriques */}
                            <div className="col-md-6 mt-3">
                                <SelectPickerField
                                    label="Rubrique de Dépenses"
                                    name="refRubSortie"
                                    options={rubSortieList}
                                    value={formData.refRubSortie ? String(formData.refRubSortie) : ""}
                                    onChange={(v) => handleSelectChange("refRubSortie", v)}
                                />
                                <button
                                    className="btn btn-outline-primary w-100 mt-2"
                                    onClick={printDepenseByRubrique}
                                >
                                    <i className="fas fa-print me-2"></i> Dépenses par Rubrique
                                </button>
                            </div>

                            <div className="col-md-6 mt-3">
                                <SelectPickerField
                                    label="Rubrique de Recettes"
                                    name="refRubEntree"
                                    options={rubEntreeList}
                                    value={formData.refRubEntree ? String(formData.refRubEntree) : ""}
                                    onChange={(v) => handleSelectChange("refRubEntree", v)}
                                />
                                <button
                                    className="btn btn-outline-success w-100 mt-2"
                                    onClick={printRecetteByRubrique}
                                >
                                    <i className="fas fa-print me-2"></i> Recettes par Rubrique
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
