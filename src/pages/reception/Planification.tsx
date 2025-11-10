// src/pages/enseignement/AttributionCoursPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
    fetchItems,
    fetchListItems,
    fetchSigleItem,
    saveItem,
    removeItem,
    showConfirmationDialog,
    formatDateFR,
    truncateText,
} from "../../api/callApi";
import {
    showErrorMessage,
    showSuccessMessage,
    showWarningMessage,
} from "../../api/config";
import { usePagination } from "../../hooks/usePagination";
import {
    LoaderAndError,
    Modal,
    Pagination,
    SelectPickerField,
    TextField,
} from "../../components";
import LoadingSpinner from "../../components/LoadingSpinner";
import AttributionCoursMultipleModal from "./AttributionCoursMultipleModal";


// ========================= Types =========================
interface AttributionCours {
    id?: number;
    idCatCours?: number | string;
    idCours?: number | string;
    idEnseignant?: number | string;
    idPeriode?: number | string;
    idAnne?: number | string;
    idSection?: number | string;
    idOption?: number | string;
    idClasse?: number | string;
    maximale?: number | string;

    // Pour affichage
    nomEns?: string;
    sexeEns?: string;
    ageEns?: number;
    nomCours?: string;
    nomCatCours?: string;
    nomPeriode?: string;
    nomSection?: string;
    nomOption?: string;
    nomClasse?: string;
    created_at?: string;
}

interface OptionItem {
    value: string;
    label: string;
}

// ========================= Composant =========================
export default function PlanificationPage() {
    const [showBatchModal, setShowBatchModal] = useState(false);
    // Table & états
    const [datas, setDatas] = useState<AttributionCours[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // Formulaire
    const [formData, setFormData] = useState<Partial<AttributionCours>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Options
    const [anneeOptions, setAnneeOptions] = useState<OptionItem[]>([]);
    const [sectionOptions, setSectionOptions] = useState<OptionItem[]>([]);
    const [optionOptions, setOptionOptions] = useState<OptionItem[]>([]);
    const [classeOptions, setClasseOptions] = useState<OptionItem[]>([]);
    const [periodeOptions, setPeriodeOptions] = useState<OptionItem[]>([]);
    const [catCoursOptions, setCatCoursOptions] = useState<OptionItem[]>([]);
    const [coursOptions, setCoursOptions] = useState<OptionItem[]>([]);
    const [enseignantOptions, setEnseignantOptions] = useState<OptionItem[]>([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } =
        usePagination({ currentPage, totalPages });

    // ========================= Debounce =========================
    const debounced = useMemo(() => {
        let t: any;
        return (fn: () => void, delay = 350) => {
            clearTimeout(t);
            t = setTimeout(fn, delay);
        };
    }, []);

    // ========================= Chargement des listes =========================
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

    const loadOptionsBySection = async (idSection: string | number) => {
        if (!idSection) return;
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

    const loadPeriodes = async () => {
        try {
            const res = await fetchListItems("/fetch_periode");
            setPeriodeOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.id),
                    label: x.nomPeriode,
                }))
            );
        } catch {
            setPeriodeOptions([]);
        }
    };

    const loadCatCours = async () => {
        try {
            const res = await fetchListItems("/fetch_cat_cours_2");
            setCatCoursOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.id),
                    label: x.nomCatCours,
                }))
            );
        } catch {
            setCatCoursOptions([]);
        }
    };

    const loadEnseignants = async () => {
        try {
            const res = await fetchListItems("/fetch_enseignant");
            setEnseignantOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.id),
                    label: x.nomEns,
                }))
            );
        } catch {
            setEnseignantOptions([]);
        }
    };

    const loadCoursByCatCours = async (idCatCours: string | number) => {
        if (!idCatCours) return;
        try {
            const res = await fetchListItems(`/fetch_cours_by_catcours/${idCatCours}`);
            setCoursOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.id),
                    label: x.nomCours,
                }))
            );
        } catch {
            setCoursOptions([]);
        }
    };

    const loadPeriodeEnCours = async () => {
        try {
            const res = await fetchListItems("/getPeriodeEnCours");
            const row = (res?.data || [])[0];
            if (row) {
                setFormData((prev) => ({
                    ...prev,
                    idAnne: row.idAnne,
                    idPeriode: row.idPeriode,
                }));
            }
        } catch {
            // silencieux
        }
    };

    // ========================= Chargement principal =========================
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<AttributionCours>("/fetch_attribution_cours", {
                page: currentPage,
                limit,
                query: search,
            });
            setDatas(res.data);
            setTotalPages(res.lastPage);
        } catch (e) {
            setError("Erreur lors du chargement des données.");
        } finally {
            setLoading(false);
        }
    };

    // ========================= Effects =========================
    useEffect(() => {
        (async () => {
            setLoading(true);
            await Promise.all([
                loadAnnees(),
                loadSections(),
                loadClasses(),
                loadPeriodes(),
                loadCatCours(),
                loadEnseignants(),
            ]);
            setLoading(false);
        })();
    }, []);

    useEffect(() => {
        loadDatas();
    }, [currentPage]);

    useEffect(() => {
        debounced(() => {
            setCurrentPage(1);
            loadDatas();
        });
    }, [search]);

    // ========================= Handlers =========================
    const handleSelectChange = (field: keyof AttributionCours, value: string) => {
        setFormData((prev) => {
            let updated: Partial<AttributionCours> = { ...prev, [field]: value };
            if (field === "idSection") {
                setOptionOptions([]);
                loadOptionsBySection(value);
                updated.idOption = "";
            }
            if (field === "idCatCours") {
                setCoursOptions([]);
                loadCoursByCatCours(value);
            }
            return updated;
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const openModal = async () => {
        setFormData({});
        setIsEditing(false);
        setShowModal(true);
        await loadPeriodeEnCours();
    };

    const closeModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setFormData({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const {
            idAnne,
            idSection,
            idOption,
            idClasse,
            idCours,
            idCatCours,
            idEnseignant,
            idPeriode,
            maximale,
        } = formData;

        if (
            !idAnne ||
            !idSection ||
            !idOption ||
            !idClasse ||
            !idCours ||
            !idCatCours ||
            !idEnseignant ||
            !idPeriode ||
            maximale === undefined
        ) {
            showWarningMessage("Veuillez remplir tous les champs obligatoires.");
            return;
        }

        try {
            const payload = { ...formData };
            const res = await saveItem("/insert_attribution_cours", payload);
            showSuccessMessage(res);

            if (isEditing) {
                closeModal();
            }
            loadDatas();
        } catch (err) {
            showErrorMessage(err);
        }
    };

    const handleEdit = async (id: number) => {
        setLoading(true);
        try {
            const res = await fetchSigleItem<AttributionCours[]>(
                "/fetch_single_attribution_cours",
                id
            );
            const data = res && res.length ? res[0] : undefined;
            if (!data) {
                showErrorMessage("Attribution introuvable.");
                return;
            }
            const current: Partial<AttributionCours> = {
                ...data,
                idCatCours: data.idCatCours,
                idSection: (data as any).idSection,
            };

            if (current.idSection) {
                await loadOptionsBySection(current.idSection);
            }
            if (current.idCatCours) {
                await loadCoursByCatCours(current.idCatCours);
            }

            setFormData(current);
            setIsEditing(true);
            setShowModal(true);
        } catch (err) {
            showErrorMessage(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = await showConfirmationDialog({
            title: "Supprimer cette attribution ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });
        if (!confirmed) return;

        try {
            const res = await removeItem("/delete_attribution_cours", id);
            showSuccessMessage(res);
            loadDatas();
        } catch (err) {
            showErrorMessage(err);
        }
    };

    const handleRefresh = () => {
        setSearch("");
        loadDatas();
    };

    // ========================= Render =========================
    return (
        <div className="col-md-12">
            <h4 className="mb-1">
                <i className="fas fa-clipboard-list me-2" />
                Attribution de cours
            </h4>
            <p className="text-muted mb-3">
                Assignez les cours aux enseignants pour chaque classe et période.
            </p>

            <LoaderAndError loading={loading} error={error} onClearError={() => setError(null)} />

            {/* Barre d'action */}
            <div className="d-flex justify-content-between mb-3">
                <div className="col-auto col-sm-5">
                    <div className="input-group mb-2">
                        <button className="btn btn-sm btn-primary me-1" onClick={handleRefresh}>
                            <i className="fas fa-sync" />
                        </button>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Rechercher..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <LoadingSpinner loading={loading} />
                    </div>
                </div>

                <div className="justify-content-end">

                    <button
                        className="btn btn-sm btn-success me-2"
                        onClick={() => setShowBatchModal(true)}
                    >
                        <i className="fas fa-layer-group me-1"></i> Attribution multiple
                    </button>

                    <button className="btn btn-primary btn-sm" onClick={openModal}>
                        <i className="fas fa-plus me-1" /> Nouvelle attribution
                    </button>

                </div>
            </div>

            {/* Tableau */}
            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-striped align-middle">
                            <thead>
                                <tr>
                                    <th>Enseignant</th>
                                    <th>Sexe / Âge</th>
                                    <th>Cours</th>
                                    <th>Maxima</th>
                                    <th>Catégorie</th>
                                    <th>Période</th>
                                    <th>Section / Option</th>
                                    <th>Classe</th>
                                    <th>Créé le</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datas.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="text-center text-muted">
                                            Aucune attribution trouvée
                                        </td>
                                    </tr>
                                ) : (
                                    datas.map((row) => (
                                        <tr key={row.id}>
                                            <td>{row.nomEns}</td>
                                            <td>{row.sexeEns} / {row.ageEns} ans</td>
                                            <td><b>{row.nomCours}</b></td>
                                            <td>{row.maximale}</td>
                                            <td><span className="badge bg-info">{truncateText(row.nomCatCours ?? '', 20)}</span></td>
                                            <td>{row.nomPeriode}</td>
                                            <td>{row.nomSection} - {row.nomOption}</td>
                                            <td>{row.nomClasse}</td>
                                            <td>{formatDateFR(row.created_at || "")}</td>
                                            <td>
                                                <div className="btn-group">
                                                    <button className="btn btn-warning btn-sm me-1" title="Modifier" onClick={() => handleEdit(row.id!)}>
                                                        <i className="fas fa-edit" />
                                                    </button>
                                                    <button className="btn btn-danger btn-sm" title="Supprimer" onClick={() => handleDelete(row.id!)}>
                                                        <i className="fas fa-trash" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
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

            {/* Modal */}
            <Modal
                title={isEditing ? "Modifier l'attribution" : "Nouvelle attribution"}
                show={showModal}
                onClose={closeModal}
                dimension="modal-lg"
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-lg-12 col-md-12 col-sm-12 c0l-xs-12 col-12">
                            <SelectPickerField
                                label="Enseignant"
                                name="idEnseignant"
                                icon="fas fa-user-tie"
                                value={formData.idEnseignant ? String(formData.idEnseignant) : ""}
                                options={enseignantOptions}
                                required
                                onChange={(v) => handleSelectChange("idEnseignant", v)}
                            />
                        </div>

                        <div className="col-lg-6 col-md-12 col-sm-12 c0l-xs-12 col-12">
                            <SelectPickerField
                                label="Catégorie de cours"
                                name="idCatCours"
                                icon="fas fa-layer-group"
                                value={formData.idCatCours ? String(formData.idCatCours) : ""}
                                options={catCoursOptions}
                                required
                                onChange={(v) => handleSelectChange("idCatCours", v)}
                            />
                        </div>
                        <div className="col-lg-6 col-md-12 col-sm-12 c0l-xs-12 col-12">
                            <SelectPickerField
                                label="Cours"
                                name="idCours"
                                icon="fas fa-book"
                                value={formData.idCours ? String(formData.idCours) : ""}
                                options={coursOptions}
                                required
                                onChange={(v) => handleSelectChange("idCours", v)}
                            />
                        </div>

                        <div className="col-lg-6 col-md-12 col-sm-12 c0l-xs-12 col-12">
                            <SelectPickerField
                                label="Période"
                                name="idPeriode"
                                icon="fas fa-clock"
                                value={formData.idPeriode ? String(formData.idPeriode) : ""}
                                options={periodeOptions}
                                required
                                onChange={(v) => handleSelectChange("idPeriode", v)}
                            />
                        </div>

                        <div className="col-lg-6 col-md-12 col-sm-12 c0l-xs-12 col-12">
                            <SelectPickerField
                                label="Année scolaire"
                                name="idAnne"
                                icon="fas fa-calendar"
                                value={formData.idAnne ? String(formData.idAnne) : ""}
                                options={anneeOptions}
                                required
                                onChange={(v) => handleSelectChange("idAnne", v)}
                            />
                        </div>

                        <div className="col-md-6 mt-2">
                            <SelectPickerField
                                label="Section"
                                name="idSection"
                                icon="fas fa-sitemap"
                                value={formData.idSection ? String(formData.idSection) : ""}
                                options={sectionOptions}
                                required
                                onChange={(v) => handleSelectChange("idSection", v)}
                            />
                        </div>

                        <div className="col-md-6 mt-2">
                            <SelectPickerField
                                label="Option"
                                name="idOption"
                                icon="fas fa-list"
                                value={formData.idOption ? String(formData.idOption) : ""}
                                options={optionOptions}
                                required
                                onChange={(v) => handleSelectChange("idOption", v)}
                            />
                        </div>

                        <div className="col-md-6 mt-2">
                            <SelectPickerField
                                label="Classe"
                                name="idClasse"
                                icon="fas fa-home"
                                value={formData.idClasse ? String(formData.idClasse) : ""}
                                options={classeOptions}
                                required
                                onChange={(v) => handleSelectChange("idClasse", v)}
                            />
                        </div>

                        <div className="col-md-6 mt-2">
                            <TextField
                                label="Point (Maxima)"
                                name="maximale"
                                type="number"
                                value={formData.maximale ? String(formData.maximale) : ""}
                                onChange={handleInputChange}
                                required
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
                        <button type="submit" className="btn btn-primary">
                            {isEditing ? "Modifier" : "Enregistrer"}
                        </button>
                    </div>
                </form>
            </Modal>

            {showBatchModal && (
                <AttributionCoursMultipleModal
                    show={showBatchModal}
                    onClose={() => setShowBatchModal(false)}
                    onSuccess={() => { loadDatas() }}
                />
            )}


        </div>
    );
}
