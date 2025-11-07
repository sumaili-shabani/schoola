import React, { useState, useEffect, useMemo } from "react";
import {
    fetchItems,
    fetchListItems,
    fetchSigleItem,
    saveItem,
    removeItem,
    extractTime,
    formatDateFR,
    showConfirmationDialog,
} from "../../api/callApi";
import { showErrorMessage, showSuccessMessage } from "../../api/config";
import { usePagination } from "../../hooks/usePagination";
import {
    TextField,
    Modal,
    Pagination,
    LoaderAndError,
    SelectPickerField,
} from "../../components";
import LoadingSpinner from "../../components/LoadingSpinner";
import axios from "axios";

interface Prevision {
    id?: number;
    idTranche?: string | number;
    idFrais?: string | number;
    idAnne?: string | number;
    idSection?: string | number;
    idOption?: string | number;
    idClasse?: string | number;
    date_debit_prev?: string;
    date_fin_prev?: string;
    montant?: number | string;

    nomTranche?: string;
    nomTypeTranche?: string;
    nomFrais?: string;
    nomSection?: string;
    nomOption?: string;
    nomClasse?: string;
    designation?: string;



    created_at?: string;
}

interface Option {
    value: string;
    label: string;
}

export default function PrevisionPage() {
    // ---- ÉTATS ----
    const [datas, setDatas] = useState<Prevision[]>([]);
    const [formData, setFormData] = useState<Partial<Prevision>>({});
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string | null>(null);

    // ---- DROPDOWNS ----
    const [trancheOptions, setTrancheOptions] = useState<Option[]>([]);
    const [fraisOptions, setFraisOptions] = useState<Option[]>([]);
    const [anneeOptions, setAnneeOptions] = useState<Option[]>([]);
    const [sectionOptions, setSectionOptions] = useState<Option[]>([]);
    const [optionOptions, setOptionOptions] = useState<Option[]>([]);
    const [classeOptions, setClasseOptions] = useState<Option[]>([]);

    // ---- PAGINATION ----
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } =
        usePagination({ currentPage, totalPages });

    // ---- DEBOUNCE ----
    const debounce = useMemo(() => {
        let timer: any;
        return (fn: () => void) => {
            clearTimeout(timer);
            timer = setTimeout(fn, 350);
        };
    }, []);

    // -------- CHARGEMENT DES LISTES --------
    const loadTranches = async () => {
        try {
            const res = await fetchListItems("/fetch_tranche");
            setTrancheOptions(
                res?.data?.map((x: any) => ({
                    value: String(x.id),
                    label: x.nomTranche,
                })) || []
            );
        } catch {
            showErrorMessage("Erreur lors du chargement des tranches");
        }
    };

    const loadFrais = async () => {
        try {
            const res = await fetchListItems("/fetch_type_tranche");
            setFraisOptions(
                res?.data?.map((x: any) => ({
                    value: String(x.id),
                    label: x.nomTypeTranche,
                })) || []
            );
        } catch {
            showErrorMessage("Erreur lors du chargement des frais");
        }
    };

    const loadAnnees = async () => {
        try {
            const res = await fetchListItems("/fetch_anne_scolaire");
            setAnneeOptions(
                res?.data?.map((x: any) => ({
                    value: String(x.id),
                    label: x.designation,
                })) || []
            );
        } catch {
            showErrorMessage("Erreur lors du chargement des années scolaires");
        }
    };

    const loadSections = async () => {
        try {
            const res = await fetchListItems("/fetch_section");
            setSectionOptions(
                res?.data?.map((x: any) => ({
                    value: String(x.id),
                    label: x.nomSection,
                })) || []
            );
        } catch {
            showErrorMessage("Erreur lors du chargement des sections");
        }
    };

    const loadClasses = async () => {
        try {
            const res = await fetchListItems("/fetch_classe");
            setClasseOptions(
                res?.data?.map((x: any) => ({
                    value: String(x.id),
                    label: x.nomClasse,
                })) || []
            );
        } catch {
            showErrorMessage("Erreur lors du chargement des classes");
        }
    };


    const loadOptionsBySection = async (idSection: string | number) => {
        if (!idSection) {
            setOptionOptions([]);
            return;
        }
        const res = await fetchListItems(`/fetch_option_by_section/${idSection}`);
        setOptionOptions(
            res.data.map((x: any) => ({
                value: String(x.id),
                label: x.nomOption,
            }))
        );
    };

    // -------- CHARGEMENT DES DONNÉES --------
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<Prevision>("/fetch_prevision", {
                page: currentPage,
                limit,
                query: search,
            });
            setDatas(res.data);
            setTotalPages(res.lastPage);
        } finally {
            setLoading(false);
        }
    };

    // -------- SUBMIT --------
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.idTranche || !formData.idFrais || !formData.montant) {
            showErrorMessage("Veuillez remplir tous les champs obligatoires");
            return;
        }

        const payload = { ...formData, id: formData.id ?? "" };
        const res = await saveItem("/insert_prevision", payload);

        showSuccessMessage(res);
        setShowModal(false);
        setFormData({});
        setIsEditing(false);
        loadDatas();
    };

    // -------- ÉDITION --------
    const handleEdit = async (id: number) => {
        setLoading(true);
        const res = await fetchSigleItem<Prevision>("/fetch_single_prevision", id);
        const data = Array.isArray(res) && res.length ? res[0] : undefined;
        if (!data) {
            setError("Prévision introuvable.");
            setLoading(false);
            return;
        }

        setFormData(data);
        setIsEditing(true);
        setShowModal(true);

        if (data.idSection) {
            await loadOptionsBySection(data.idSection);
        }
        setLoading(false);
    };

    // -------- SUPPRESSION --------
    const handleDelete = async (id: number) => {
        const confirm = await showConfirmationDialog({
            title: "Supprimer ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });

        if (!confirm) return;
        const res = await removeItem("/delete_prevision", id);
        showSuccessMessage(res);
        loadDatas();
    };

    // -------- INIT --------
    useEffect(() => {
        loadTranches();
        loadFrais();
        loadAnnees();
        loadSections();
        loadClasses();
        loadDatas();
    }, [currentPage]);

    useEffect(() => {
        debounce(() => {
            setCurrentPage(1);
            loadDatas();
        });
    }, [search]);

    // -------- HANDLERS --------
    const handleSelectChange = async (field: string, val: string) => {
        setFormData((prev) => ({ ...prev, [field]: val }));

        if (field === "idSection") {
            setOptionOptions([]);
            await loadOptionsBySection(val);
        }
    };

    const openModal = () => {
        setFormData({});
        setIsEditing(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setIsEditing(false);
        setShowModal(false);
    };

    // -------- RENDU --------
    return (
        <div className="col-md-12">
            <h4>Prévisions des frais</h4>

            <LoaderAndError
                loading={loading}
                error={error}
                onClearError={() => setError(null)}
            />

            {/* Barre de recherche */}
            <div className="d-flex justify-content-between mb-3">
                <div className="col-auto col-sm-6">
                    <div className="input-group">
                        <button
                            className="btn btn-sm btn-primary me-1"
                            onClick={loadDatas}
                        >
                            <i className="fas fa-sync" />
                        </button>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Recherche…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <LoadingSpinner loading={loading} />
                    </div>
                </div>

                <button className="btn btn-primary btn-sm" onClick={openModal}>
                    <i className="fas fa-plus me-1" /> Ajouter
                </button>
            </div>

            {/* Tableau */}
            <table className="table table-striped">
                <thead>
                    <tr>
                       
                        <th>Tranche</th>
                        <th>Frais</th>
                        <th>Section / Option</th>
                        <th>Classe</th>
                        <th>Échéance</th>
                        <th>Montant ($)</th>
                        <th>Mise à jour</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {datas.map((d) => (
                        <tr key={d.id}>
                          
                            <td>
                                {d.nomTranche} <br />
                                <span className="badge bg-success">
                                    {d.designation}
                                </span>
                            </td>
                            <td>{d.nomTypeTranche}</td>

                            <td>
                                {d.nomSection} -
                                {d.nomOption}
                            </td>
                            <td>{d.nomClasse}</td>
                            <td>
                                {formatDateFR(d.date_debit_prev || "")} au{" "}
                                {formatDateFR(d.date_fin_prev || "")}

                            </td>

                            <td>
                                {d.montant}
                            </td>


                            <td>
                                {formatDateFR(d.created_at || "")}{" "}
                                {extractTime(d.created_at || "")}
                            </td>
                            <td>
                                <button
                                    className="btn btn-warning btn-circle btn-sm me-1"
                                    onClick={() => handleEdit(d.id!)}
                                >
                                    <i className="fas fa-edit" />
                                </button>
                                <button
                                    className="btn btn-danger btn-circle btn-sm"
                                    onClick={() => handleDelete(d.id!)}
                                >
                                    <i className="fas fa-trash" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

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

            {/* Modal */}
            <Modal
                title={isEditing ? "Modifier Prévision" : "Nouvelle Prévision"}
                show={showModal}
                onClose={closeModal}
                dimension="modal-lg"
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-6">
                            <SelectPickerField
                                label="Tranche"
                                name="idTranche"
                                options={trancheOptions}
                                value={formData.idTranche ? String(formData.idTranche) : ""}
                                onChange={(v) => handleSelectChange("idTranche", v)}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <SelectPickerField
                                label="Frais"
                                name="idFrais"
                                options={fraisOptions}
                                value={formData.idFrais ? String(formData.idFrais) : ""}
                                onChange={(v) => handleSelectChange("idFrais", v)}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <SelectPickerField
                                label="Année scolaire"
                                name="idAnne"
                                options={anneeOptions}
                                value={formData.idAnne ? String(formData.idAnne) : ""}
                                onChange={(v) => handleSelectChange("idAnne", v)}
                            />
                        </div>
                        <div className="col-md-6">
                            <SelectPickerField
                                label="Section"
                                name="idSection"
                                options={sectionOptions}
                                value={formData.idSection ? String(formData.idSection) : ""}
                                onChange={(v) => handleSelectChange("idSection", v)}
                            />
                        </div>

                        <div className="col-md-6">
                            <SelectPickerField
                                label="Option"
                                name="idOption"
                                options={optionOptions}
                                value={formData.idOption ? String(formData.idOption) : ""}
                                onChange={(v) => handleSelectChange("idOption", v)}
                            />
                        </div>
                        <div className="col-md-6">
                            <SelectPickerField
                                label="Classe"
                                name="idClasse"
                                options={classeOptions}
                                value={formData.idClasse ? String(formData.idClasse) : ""}
                                onChange={(v) => handleSelectChange("idClasse", v)}
                            />
                        </div>

                        <div className="col-md-6">
                            <TextField
                                label="Date début échéance"
                                name="date_debit_prev"
                                type="date"
                                value={formData.date_debit_prev ?? ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        date_debit_prev: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <TextField
                                label="Date fin échéance"
                                name="date_fin_prev"
                                type="date"
                                value={formData.date_fin_prev ?? ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        date_fin_prev: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>

                        <div className="col-md-12">
                            <TextField
                                label="Montant ($)"
                                name="montant"
                                type="number"
                                value={formData.montant !== undefined ? String(formData.montant) : ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        montant: e.target.value === "" ? "" : Number(e.target.value),
                                    })
                                }
                                required
                            />
                        </div>
                    </div>

                    <button className="btn btn-primary w-100 mt-3">
                        {isEditing ? "Modifier" : "Ajouter"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
