import React, { useEffect, useMemo, useState } from "react";
import {
    fetchItems,
    fetchListItems,
    fetchSigleItem,
    saveItem,
    removeItem,
    showConfirmationDialog,
    formatDateFR,
    extractTime,
    truncateText,
} from "../../api/callApi";
import {
    fileUrl,
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

interface Effectif {
    id?: number;
    idAnne?: string | number;
    idSection?: string | number;
    idOption?: string | number;
    idClasse?: string | number;
    refMois?: string | number;
    effectifClasse?: number | string;
    effectifAbandon?: number | string;
    effectifTotal?: number | string;
    nomClasse?: string;
    nomOption?: string;
    nomMois?: string;
    designation?: string;
    created_at?: string;
}

interface OptionItem {
    value: string;
    label: string;
}

// ========================= COMPONENT =========================
export default function EffectifPage() {
    const [datas, setDatas] = useState<Effectif[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const [formData, setFormData] = useState<Partial<Effectif>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Dropdown options
    const [anneeOptions, setAnneeOptions] = useState<OptionItem[]>([]);
    const [sectionOptions, setSectionOptions] = useState<OptionItem[]>([]);
    const [optionOptions, setOptionOptions] = useState<OptionItem[]>([]);
    const [classeOptions, setClasseOptions] = useState<OptionItem[]>([]);
    const [moisOptions, setMoisOptions] = useState<OptionItem[]>([]);

    const [effectifClasse, setEffectifClasse] = useState<number>(0);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } =
        usePagination({ currentPage, totalPages });

    // Debounce
    const debounced = useMemo(() => {
        let t: any;
        return (fn: () => void, delay = 350) => {
            clearTimeout(t);
            t = setTimeout(fn, delay);
        };
    }, []);

    // ========================= LOADERS =========================
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<Effectif>("/fetch_clauture", {
                page: currentPage,
                limit,
                query: search,
            });
            setDatas(res.data);
            setTotalPages(res.lastPage);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadAnnee = async () => {
        const res = await fetchListItems("/fetch_anne_scolaire");
        setAnneeOptions(
            (res?.data || []).map((x: any) => ({
                value: String(x.id),
                label: x.designation,
            }))
        );
    };

    const loadSections = async () => {
        const res = await fetchListItems("/fetch_section");
        setSectionOptions(
            (res?.data || []).map((x: any) => ({
                value: String(x.id),
                label: x.nomSection,
            }))
        );
    };

    const loadOptionsBySection = async (idSection: string | number) => {
        if (!idSection) return setOptionOptions([]);
        const res = await fetchListItems(`/fetch_option_by_section/${idSection}`);
        setOptionOptions(
            (res?.data || []).map((x: any) => ({
                value: String(x.id),
                label: x.nomOption,
            }))
        );
    };

    const loadClasses = async () => {
        const res = await fetchListItems("/fetch_classe");
        setClasseOptions(
            (res?.data || []).map((x: any) => ({
                value: String(x.id),
                label: x.nomClasse,
            }))
        );
    };

    const loadMois = async () => {
        const res = await fetchListItems("/fetch_mois_scolaire_2");
        setMoisOptions(
            (res?.data || []).map((x: any) => ({
                value: String(x.id),
                label: x.nomMois,
            }))
        );
    };

    // ========================= EFFECTS =========================
    useEffect(() => {
        loadAnnee();
        loadSections();
        loadClasses();
        loadMois();
        loadDatas();
    }, []);

    useEffect(() => {
        debounced(() => {
            setCurrentPage(1);
            loadDatas();
        });
    }, [search]);

    useEffect(() => {
        loadDatas();
    }, [currentPage]);

    // ========================= HANDLERS =========================
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (name === "effectifAbandon") {
            calculNumber(Number(value));
        }
    };

    const handleSelectChange = async (field: keyof Effectif, val: string) => {
        setFormData((prev) => ({ ...prev, [field]: val }));
        if (field === "idSection") {
            setOptionOptions([]);
            setFormData((prev) => ({ ...prev, idOption: "" }));
            await loadOptionsBySection(val);
        }
        if (field === "idClasse" && formData.idOption) {
            getCountEffectifClasse(val, formData.idOption);
        }
    };

    const openModal = () => {
        setFormData({});
        setIsEditing(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setFormData({});
    };

    const getCountEffectifClasse = async (idClasse?: any, idOption?: any) => {
        if (!idClasse || !idOption) {
            showWarningMessage("Veuillez sélectionner la classe et l'option");
            return;
        }
        try {
            const res = await fetchListItems<Effectif>(
                `/get_effectif_eleve_classe/${idClasse}/${idOption}`
            );
            const data = res.data[0];
            if (data?.effectifClasse) {
                setEffectifClasse(Number(data.effectifClasse));
                setFormData((prev) => ({ ...prev, effectifClasse: data.effectifClasse }));
            }
        } catch {
            showErrorMessage("Impossible de charger l'effectif de la classe.");
        }
    };

    const calculNumber = (val: number) => {
        if (!effectifClasse) return;
        if (val <= effectifClasse) {
            const total = effectifClasse - val;
            setFormData((prev) => ({ ...prev, effectifTotal: total }));
        } else {
            setFormData((prev) => ({ ...prev, effectifAbandon: "", effectifTotal: "" }));
            showErrorMessage(`Le nombre d'abandons doit être ≤ ${effectifClasse}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await saveItem("/insert_clauture", formData);
            showSuccessMessage(res);
            closeModal();
            loadDatas();
        } catch (error) {
            showWarningMessage(error);
        }
    };

    const handleEdit = async (id: number) => {
        try {
            setLoading(true);
            const res = await fetchSigleItem<Effectif[]>("/fetch_single_clauture", id);
            const data = res && res.length ? res[0] : undefined;
            if (!data) return showErrorMessage("Clôture introuvable.");

            setFormData(data);
            setIsEditing(true);
            setShowModal(true);
            if (data.idSection) await loadOptionsBySection(data.idSection);
            if (data.idClasse && data.idOption)
                await getCountEffectifClasse(data.idClasse, data.idOption);
        } catch (error) {
            showErrorMessage(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = await showConfirmationDialog({
            title: "Supprimer cette clôture ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });
        if (!confirmed) return;
        try {
            const res = await removeItem("/delete_clauture", id);
            showSuccessMessage(res);
            loadDatas();
        } catch (error) {
            showErrorMessage(error);
        }
    };

    // ========================= RENDER =========================
    return (
        <div className="col-md-12">
            <h4 className="mb-1">Clôture des effectifs</h4>
            <p className="text-muted mb-3">Gérez les opérations</p>

            <LoaderAndError loading={loading} error={error} onClearError={() => setError(null)} />

            {/* Toolbar */}
            <div className="d-flex justify-content-between mb-3">
                <div className="col-auto col-sm-6">
                    <div className="input-group mb-2">
                        <button className="btn btn-sm btn-primary me-1" onClick={() => loadDatas()}>
                            <i className="fas fa-sync"></i>
                        </button>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Recherche..."
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

            {/* Table */}
            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-striped align-middle">
                            <thead>
                                <tr>
                                    <th>Classe</th>
                                    <th>Option</th>
                                    <th>Mois</th>
                                    <th>Effectif classe</th>
                                    <th>Abandons</th>
                                    <th>Total restant</th>
                                    <th>Année scolaire</th>
                                    <th>Mise à jour</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datas.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center text-muted">
                                            Aucune donnée trouvée
                                        </td>
                                    </tr>
                                ) : (
                                    datas.map((row) => (
                                        <tr key={row.id}>
                                            <td>{truncateText(row.nomClasse ?? "", 30)}</td>
                                            <td>{truncateText(row.nomOption ?? "", 30)}</td>
                                            <td>{truncateText(row.nomMois ?? "", 20)}</td>
                                            <td>{row.effectifClasse} élèves</td>
                                            <td className="text-danger">{row.effectifAbandon} élèves</td>
                                            <td>{row.effectifTotal} élèves</td>
                                            <td>{row.designation}</td>
                                            <td>
                                                {formatDateFR(row.created_at || "")} {extractTime(row.created_at || "")}
                                            </td>
                                            <td>
                                                <div className="btn-group">
                                                    <button
                                                        className="btn btn-warning btn-sm me-1"
                                                        onClick={() => handleEdit(row.id!)}
                                                    >
                                                        <i className="fas fa-edit" />
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(row.id!)}
                                                    >
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
                </div>
            </div>

            {/* Modal */}
            <Modal
                title={isEditing ? "Modifier la clôture d'effectif" : "Ajouter un effectif"}
                show={showModal}
                onClose={closeModal}
                dimension="modal-lg"
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        {/* Année */}
                        <div className="col-md-12">
                            <SelectPickerField
                                label="Année scolaire"
                                name="idAnne"
                                icon="fas fa-calendar"
                                value={formData.idAnne ? String(formData.idAnne) : ""}
                                options={anneeOptions}
                                required
                                onChange={(v) => setFormData((prev) => ({ ...prev, idAnne: v }))}
                            />
                        </div>

                        {/* Section */}
                        <div className="col-md-6">
                            <SelectPickerField
                                label="Section"
                                name="idSection"
                                icon="fas fa-layer-group"
                                value={formData.idSection ? String(formData.idSection) : ""}
                                options={sectionOptions}
                                required
                                onChange={(v) => handleSelectChange("idSection", v)}
                            />
                        </div>

                        {/* Option */}
                        <div className="col-md-6">
                            <SelectPickerField
                                label="Option"
                                name="idOption"
                                icon="fas fa-list"
                                value={formData.idOption ? String(formData.idOption) : ""}
                                options={optionOptions}
                                required
                                onChange={(v) => setFormData((prev) => ({ ...prev, idOption: v }))}
                            />
                        </div>

                        {/* Classe */}
                        <div className="col-md-6">
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

                        {/* Mois */}
                        <div className="col-md-6">
                            <SelectPickerField
                                label="Mois"
                                name="refMois"
                                icon="fas fa-calendar-alt"
                                value={formData.refMois ? String(formData.refMois) : ""}
                                options={moisOptions}
                                required
                                onChange={(v) => setFormData((prev) => ({ ...prev, refMois: v }))}
                            />
                        </div>

                        {/* Effectifs */}
                        <div className="col-md-4">
                            <TextField
                                label="Effectif de la classe"
                                name="effectifClasse"
                                type="number"
                                value={formData.effectifClasse ? String(formData.effectifClasse) : ""}
                                onChange={handleInputChange}
                                disabled
                            />
                        </div>

                        <div className="col-md-4">
                            <TextField
                                label="Nombre d'abandons"
                                name="effectifAbandon"
                                type="number"
                                value={formData.effectifAbandon ? String(formData.effectifAbandon) : ""}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="col-md-4">
                            <TextField
                                label="Effectif restant"
                                name="effectifTotal"
                                type="number"
                                value={formData.effectifTotal ? String(formData.effectifTotal) : ""}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-end mt-3">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {isEditing ? "Modifier" : "Ajouter"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
