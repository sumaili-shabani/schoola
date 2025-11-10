// src/pages/enseignement/CotationPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
    fetchItems,
    fetchListItems,
    fetchSigleItem,
    saveItem,
    removeItem,
    showConfirmationDialog,
    formatDateFR,
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
    TextField,
    SelectPickerField,
} from "../../components";
import LoadingSpinner from "../../components/LoadingSpinner";
import CotationMultipleModal from "./CotationMultipleModal";
import CotationEditMultipleModal from "./CotationEditMultipleModal";

// ========================= Types =========================

interface Cotation {
    id?: number;
    idCatCours?: number | string;
    idAnne?: number | string;
    idSection?: number | string;
    idOption?: number | string;
    idClasse?: number | string;

    idInscription?: number | string;
    idCours?: number | string;
    idPeriode?: number | string;

    maximale?: number | string; // utilisée pour saisie
    maxima?: number | string;   // peut venir du backend
    cote?: number | string;
    codeCote?: string;

    // Affichage
    noms?: string;
    sexeEleve?: string;
    ageEleve?: number;
    nomCours?: string;
    nomPeriode?: string;
    nomSection?: string;
    nomOption?: string;
    nomClasse?: string;
    nomDivision?: string;
    created_at?: string;
}

interface OptionItem {
    value: string;
    label: string;
}

// ========================= Component =========================

export default function CotationPage() {

    const [showMultiModal, setShowMultiModal] = useState(false);
    const [showEditMultiModal, setShowEditMultiModal] = useState(false);
    
    // Table
    const [datas, setDatas] = useState<Cotation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // Formulaire
    const [formData, setFormData] = useState<Partial<Cotation>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Options selects
    const [anneeOptions, setAnneeOptions] = useState<OptionItem[]>([]);
    const [sectionOptions, setSectionOptions] = useState<OptionItem[]>([]);
    const [optionOptions, setOptionOptions] = useState<OptionItem[]>([]);
    const [classeOptions, setClasseOptions] = useState<OptionItem[]>([]);
    const [periodeOptions, setPeriodeOptions] = useState<OptionItem[]>([]);
    const [catCoursOptions, setCatCoursOptions] = useState<OptionItem[]>([]);
    const [eleveOptions, setEleveOptions] = useState<OptionItem[]>([]);
    const [coursOptions, setCoursOptions] = useState<OptionItem[]>([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } =
        usePagination({ currentPage, totalPages });

    // ========================= Debounce recherche =========================

    const debounced = useMemo(() => {
        let t: any;
        return (fn: () => void, delay = 350) => {
            clearTimeout(t);
            t = setTimeout(fn, delay);
        };
    }, []);

    // ========================= Load listes =========================

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
            // ajuste selon ton backend exact si besoin
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
            // silencieux si pas dispo
        }
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

    const loadCoursList = async (
        idAnne?: string | number,
        idOption?: string | number,
        idClasse?: string | number,
        idPeriode?: string | number
    ) => {
        if (!idAnne || !idOption || !idClasse || !idPeriode) {
            setCoursOptions([]);
            return;
        }
        try {
            const res = await fetchListItems(
                `/getListCoursClasse/${idAnne}/${idOption}/${idClasse}/${idPeriode}`
            );
            setCoursOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.idCours),
                    label: x.nomCours,
                }))
            );
        } catch {
            setCoursOptions([]);
        }
    };

    const loadCoursByCatCours = async (
        idAnne?: string | number,
        idOption?: string | number,
        idClasse?: string | number,
        idPeriode?: string | number,
        idCatCours?: string | number
    ) => {
        if (!idAnne || !idOption || !idClasse || !idPeriode || !idCatCours) {
            setCoursOptions([]);
            return;
        }
        try {
            const res = await fetchListItems(
                `/getListCoursClasseByCatCours/${idAnne}/${idOption}/${idClasse}/${idPeriode}/${idCatCours}`
            );
            setCoursOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.idCours),
                    label: x.nomCours,
                }))
            );
        } catch {
            setCoursOptions([]);
        }
    };

    const loadMaximaCours = async (
        idAnne?: string | number,
        idOption?: string | number,
        idClasse?: string | number,
        idPeriode?: string | number,
        idCours?: string | number
    ) => {
        if (!idAnne || !idOption || !idClasse || !idPeriode || !idCours) return;
        try {
            const res = await fetchListItems(
                `/getMaximaCours/${idAnne}/${idOption}/${idClasse}/${idPeriode}/${idCours}`
            );
            const row = (res?.data || [])[0];
            if (row) {
                setFormData((prev) => ({
                    ...prev,
                    maximale: row.maximale,
                    idCatCours: row.idCatCours,
                }));
            }
        } catch {
            // rien
        }
    };

    // ========================= Load cotations =========================

    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<Cotation>("/fetch_cotation", {
                page: currentPage,
                limit,
                query: search,
            });
            setDatas(res.data);
            setTotalPages(res.lastPage);
        } catch (e) {
            setError("Erreur lors du chargement des cotations");
        } finally {
            setLoading(false);
        }
    };

    // ========================= Effects =========================

    useEffect(() => {
        // listes initiales
        (async () => {
            setLoading(true);
            await Promise.all([
                loadAnnees(),
                loadSections(),
                loadClasses(),
                loadPeriodes(),
                loadCatCours(),
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

    // recalc élève + cours si contexte change
    useEffect(() => {
        const { idAnne, idOption, idClasse, idPeriode, idCatCours } = formData;

        if (idAnne && idOption && idClasse) {
            loadEleves(idAnne, idOption, idClasse);
        }

        if (idAnne && idOption && idClasse && idPeriode) {
            if (idCatCours) {
                loadCoursByCatCours(idAnne, idOption, idClasse, idPeriode, idCatCours);
            } else {
                loadCoursList(idAnne, idOption, idClasse, idPeriode);
            }
        }
    }, [formData.idAnne, formData.idOption, formData.idClasse, formData.idPeriode, formData.idCatCours]);

    // ========================= Handlers =========================

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (field: keyof Cotation, val: string) => {
        setFormData((prev) => {
            let updated: Partial<Cotation> = { ...prev, [field]: val };

            if (field === "idSection") {
                updated = {
                    ...updated,
                    idOption: "",
                    idClasse: "",
                    idInscription: "",
                    idCours: "",
                    maximale: "",
                    cote: "",
                };
                setOptionOptions([]);
                setEleveOptions([]);
                setCoursOptions([]);
                loadOptionsBySection(val);
            }

            if (field === "idOption" || field === "idClasse") {
                updated = {
                    ...updated,
                    idInscription: "",
                    idCours: "",
                    maximale: "",
                    cote: "",
                };
                setEleveOptions([]);
                setCoursOptions([]);
            }

            if (field === "idPeriode") {
                updated = {
                    ...updated,
                    idCours: "",
                    maximale: "",
                    cote: "",
                };
                setCoursOptions([]);
            }

            if (field === "idCatCours") {
                updated = {
                    ...updated,
                    idCours: "",
                    maximale: "",
                    cote: "",
                };
                setCoursOptions([]);
            }

            // Lorsqu'on choisit un cours → charger maxima
            if (field === "idCours") {
                const { idAnne, idOption, idClasse, idPeriode } = updated;
                if (idAnne && idOption && idClasse && idPeriode && val) {
                    loadMaximaCours(idAnne, idOption, idClasse, idPeriode, val);
                }
            }

            return updated;
        });
    };

    const openModal = async () => {
        setFormData({});
        setIsEditing(false);
        setShowModal(true);
        await loadPeriodeEnCours();
    };

    const closeModal = () => {
        setFormData({});
        setIsEditing(false);
        setShowModal(false);
        setEleveOptions([]);
        setCoursOptions([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const {
            idAnne,
            idOption,
            idClasse,
            idPeriode,
            idInscription,
            idCours,
            cote,
            maximale,
        } = formData;

        if (
            !idAnne ||
            !idOption ||
            !idClasse ||
            !idPeriode ||
            !idInscription ||
            !idCours ||
            cote === undefined ||
            cote === "" ||
            maximale === undefined ||
            maximale === ""
        ) {
            showWarningMessage(
                "Veuillez remplir tous les champs obligatoires (Année, Section/Option, Classe, Élève, Période, Cours, Maxima, Cote)."
            );
            return;
        }

        const max = Number(maximale);
        const note = Number(cote);

        if (isNaN(max) || max <= 0) {
            showWarningMessage("Le point maxima doit être un nombre positif.");
            return;
        }
        if (isNaN(note) || note < 0) {
            showWarningMessage("La cote doit être un nombre valide.");
            return;
        }
        if (note > max) {
            showErrorMessage(`La cote (${note}) doit être ≤ au maxima (${max}).`);
            return;
        }

        try {
            const payload: any = {
                ...formData,
                maxima: max, // certains backends utilisent maxima, d’autres maximale
                maximale: max,
                cote: note,
            };
            const res = await saveItem("/insert_cotation", payload);
            showSuccessMessage(res);
            closeModal();
            loadDatas();
        } catch (err) {
            showErrorMessage(err);
        }
    };

    const handleEdit = async (id: number) => {
        try {
            setLoading(true);
            const res = await fetchSigleItem<Cotation[]>("/fetch_single_cotation", id);
            const data = res && res.length ? res[0] : undefined;
            if (!data) {
                showErrorMessage("Cotation introuvable.");
                return;
            }

            // On suppose que le backend renvoie idSection (via jointure)
            const current: Partial<Cotation> = {
                id: data.id,
                idAnne: data.idAnne,
                idSection: (data as any).idSection,
                idOption: data.idOption,
                idClasse: data.idClasse,
                idInscription: data.idInscription,
                idPeriode: data.idPeriode,
                idCours: data.idCours,
                cote: data.cote,
                maximale: data.maxima ?? data.maximale,
                idCatCours: data.idCatCours,
            };

            // Charger dépendances
            if (current.idSection) {
                await loadOptionsBySection(current.idSection);
            }
            if (current.idAnne && current.idOption && current.idClasse) {
                await loadEleves(current.idAnne, current.idOption, current.idClasse);
            }
            if (current.idAnne && current.idOption && current.idClasse && current.idPeriode) {
                if (current.idCatCours) {
                    await loadCoursByCatCours(
                        current.idAnne,
                        current.idOption,
                        current.idClasse,
                        current.idPeriode,
                        current.idCatCours
                    );
                } else {
                    await loadCoursList(
                        current.idAnne,
                        current.idOption,
                        current.idClasse,
                        current.idPeriode
                    );
                }
            }
            if (
                current.idAnne &&
                current.idOption &&
                current.idClasse &&
                current.idPeriode &&
                current.idCours
            ) {
                await loadMaximaCours(
                    current.idAnne,
                    current.idOption,
                    current.idClasse,
                    current.idPeriode,
                    current.idCours
                );
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
            title: "Supprimer cette cotation ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });
        if (!confirmed) return;

        try {
            const res = await removeItem("/delete_cotation", id);
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
                <i className="fas fa-clipboard-check me-2" />
                Cotations des élèves
            </h4>
            <p className="text-muted mb-3">
                Enregistrez et gérez les notes par élève, cours, période et classe.
            </p>

            <LoaderAndError
                loading={loading}
                error={error}
                onClearError={() => setError(null)}
            />

            {/* Barre de recherche + actions */}
            <div className="d-flex justify-content-between mb-3">
                <div className="col-auto col-sm-5">
                    <div className="input-group mb-2">
                        <button
                            className="btn btn-sm btn-primary me-1"
                            onClick={handleRefresh}
                        >
                            <i className="fas fa-sync" />
                        </button>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Recherche (élève, cours, période, classe...)"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <LoadingSpinner loading={loading} />
                    </div>
                </div>

                <div className="justify-content-end py-1">

                    <button
                        className="btn btn-success btn-sm me-1 mb-1"
                        onClick={() => setShowMultiModal(true)}
                    >
                        <i className="fas fa-layer-group me-1" /> Saisie multiple
                    </button>

                    <button
                        className="btn btn-warning btn-sm me-1 mb-1"
                        onClick={() => setShowEditMultiModal(true)}
                    >
                        <i className="fas fa-pen me-1" /> Modifier les cotes
                    </button>

                    <button className="btn btn-primary btn-sm mb-1" onClick={openModal}>
                        <i className="fas fa-plus me-1" /> Nouvelle cotation
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
                                    <th>Élève</th>
                                    <th>Sexe / Âge</th>
                                    <th>Cours</th>
                                    <th>Cote</th>
                                    <th>Période</th>
                                    <th>Section / Option</th>
                                    <th>Classe / Division</th>
                                    <th>Créé le</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datas.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center text-muted">
                                            Aucune cotation trouvée
                                        </td>
                                    </tr>
                                ) : (
                                    datas.map((row) => {
                                        const max = Number(row.maxima ?? row.maximale ?? 0);
                                        const note = Number(row.cote ?? 0);
                                        const isLow = max > 0 && note < max / 2;

                                        return (
                                            <tr key={row.id}>
                                                <td>{row.noms}</td>
                                                <td>
                                                    {row.sexeEleve} / {row.ageEleve} ans
                                                </td>
                                                <td>
                                                    <b>{row.nomCours}</b>
                                                </td>
                                                <td>
                                                    <span
                                                        className={
                                                            isLow
                                                                ? "text-danger fw-bold"
                                                                : "fw-bold"
                                                        }
                                                    >
                                                        {note}/{max || "-"}
                                                    </span>
                                                </td>
                                                <td>{row.nomPeriode}</td>
                                                <td>
                                                    {row.nomSection} - {row.nomOption}
                                                </td>
                                                <td>
                                                    {row.nomClasse} {row.nomDivision}
                                                </td>
                                                <td>
                                                    {formatDateFR(row.created_at || "")}
                                                </td>
                                                <td>
                                                    <div className="btn-group">
                                                        <button
                                                            className="btn btn-warning btn-sm me-1"
                                                            title="Modifier"
                                                            onClick={() =>
                                                                handleEdit(row.id!)
                                                            }
                                                        >
                                                            <i className="fas fa-edit" />
                                                        </button>
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            title="Supprimer"
                                                            onClick={() =>
                                                                handleDelete(row.id!)
                                                            }
                                                        >
                                                            <i className="fas fa-trash" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Pagination */}
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

            {/* Modal Ajout / Edition */}
            <Modal
                title={
                    isEditing
                        ? "Modifier la cotation"
                        : "Nouvelle cotation"
                }
                show={showModal}
                onClose={closeModal}
                dimension="modal-lg"
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        {/* Année */}
                        <div className="col-lg-4 col-md-6 col-sm-12 c0l-xs-12 col-12">
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

                        {/* Section */}
                        <div className="col-lg-4 col-md-6 col-sm-12 c0l-xs-12 col-12">
                            <SelectPickerField
                                label="Section"
                                name="idSection"
                                icon="fas fa-layer-group"
                                value={
                                    formData.idSection ? String(formData.idSection) : ""
                                }
                                options={sectionOptions}
                                required
                                onChange={(v) => handleSelectChange("idSection", v)}
                            />
                        </div>

                        {/* Option */}
                        <div className="col-lg-4 col-md-6 col-sm-12 c0l-xs-12 col-12">
                            <SelectPickerField
                                label="Option"
                                name="idOption"
                                icon="fas fa-list"
                                value={
                                    formData.idOption ? String(formData.idOption) : ""
                                }
                                options={optionOptions}
                                required
                                onChange={(v) => handleSelectChange("idOption", v)}
                            />
                        </div>

                        {/* Classe */}
                        <div className="col-lg-12 col-md-6 col-sm-12 c0l-xs-12 col-12">
                            <SelectPickerField
                                label="Classe"
                                name="idClasse"
                                icon="fas fa-home"
                                value={
                                    formData.idClasse ? String(formData.idClasse) : ""
                                }
                                options={classeOptions}
                                required
                                onChange={(v) => handleSelectChange("idClasse", v)}
                            />
                        </div>

                        {/* Élève */}
                        <div className="col-lg-12 col-md-12 col-sm-12 c0l-xs-12 col-12">
                            <SelectPickerField
                                label="Élève"
                                name="idInscription"
                                icon="fas fa-user-graduate"
                                value={
                                    formData.idInscription
                                        ? String(formData.idInscription)
                                        : ""
                                }
                                options={eleveOptions}
                                required
                                onChange={(v) => handleSelectChange("idInscription", v)}
                            />
                        </div>

                        {/* Catégorie cours */}
                        <div className="col-lg-6 col-md-6 col-sm-12 c0l-xs-12 col-12">
                            <SelectPickerField
                                label="Catégorie de cours"
                                name="idCatCours"
                                icon="fas fa-tags"
                                value={
                                    formData.idCatCours
                                        ? String(formData.idCatCours)
                                        : ""
                                }
                                options={catCoursOptions}
                                required={false}
                                onChange={(v) => handleSelectChange("idCatCours", v)}
                            />
                        </div>

                        {/* Période */}
                        <div className="col-lg-6 col-md-6 col-sm-12 c0l-xs-12 col-12">
                            <SelectPickerField
                                label="Période"
                                name="idPeriode"
                                icon="fas fa-clock"
                                value={
                                    formData.idPeriode
                                        ? String(formData.idPeriode)
                                        : ""
                                }
                                options={periodeOptions}
                                required
                                onChange={(v) => handleSelectChange("idPeriode", v)}
                            />
                        </div>

                        {/* Cours */}
                        <div className="col-lg-6 col-md-6 col-sm-12 c0l-xs-12 col-12">
                            <SelectPickerField
                                label="Cours"
                                name="idCours"
                                icon="fas fa-book-open"
                                value={
                                    formData.idCours ? String(formData.idCours) : ""
                                }
                                options={coursOptions}
                                required
                                onChange={(v) => handleSelectChange("idCours", v)}
                            />
                            <p className="small text-muted mt-1">
                                La liste des cours est filtrée selon la promotion,
                                la période et éventuellement la catégorie.
                            </p>
                        </div>

                        {/* Maxima + Cote */}
                        <div className="col-lg-3 col-md-3 col-sm-12 c0l-xs-12 col-12">
                            <TextField
                                label="Maxima"
                                name="maximale"
                                type="number"
                                value={
                                    formData.maximale !== undefined
                                        ? String(formData.maximale)
                                        : ""
                                }
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="col-lg-3 col-md-3 col-sm-12 c0l-xs-12 col-12">
                            <TextField
                                label="Cote"
                                name="cote"
                                type="number"
                                value={
                                    formData.cote !== undefined
                                        ? String(formData.cote)
                                        : ""
                                }
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
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {isEditing ? "Modifier" : "Enregistrer"}
                        </button>
                    </div>
                </form>
            </Modal>

            {showMultiModal && (
                <CotationMultipleModal
                    show={showMultiModal}
                    onClose={() => setShowMultiModal(false)}
                    onSuccess={()=>{loadDatas()}}
                />
            )}

            {showEditMultiModal && (
                <CotationEditMultipleModal
                    show={showEditMultiModal}
                    onClose={() => setShowEditMultiModal(false)}
                    onSuccess={() => loadDatas()}
                />
            )}
        </div>
    );
}
