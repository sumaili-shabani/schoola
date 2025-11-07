import React, { useEffect, useMemo, useState } from "react";
import {
    fetchItems,
    fetchSigleItem,
    fetchListItems,
    saveItem,
    removeItem,
    showConfirmationDialog,
    extractTime,
    formatDateFR,
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
import { useNavigate } from "react-router-dom";

// ========================= Types =========================
interface Inscription {
    id?: number;
    idEleve?: number | string;
    idAnne?: number | string;
    idSection?: number | string;
    idOption?: number | string;
    idClasse?: number | string;
    idDivision?: number | string;
    dateInscription?: string;
    codeInscription?: string;
    fraisinscription?: number | string;
    restoreinscription?: number | string;

    // Champs d’affichage (jointures)
    nomEleve?: string;
    postNomEleve?: string;
    preNomEleve?: string;
    sexeEleve?: string;
    ageEleve?: number;
    photoEleve?: string;

    nomSection?: string;
    nomOption?: string;
    nomClasse?: string;
    nomDivision?: string;

    reductionPaiement?: number;       // %
    PrevisionReduction?: number;      // $ (valeur calculée côté API)
    paie?: number;                    // total payé

    created_at?: string;
}

interface OptionItem {
    value: string;
    label: string;
}

// ========================= Component =========================
export default function InscriptionPage() {
    // table
    const [datas, setDatas] = useState<Inscription[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // form
    const [formData, setFormData] = useState<Partial<Inscription>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // réduction paiement (modal secondaire)
    const [showReductionModal, setShowReductionModal] = useState(false);
    const [reductionInput, setReductionInput] = useState<number | "">("");

    // selects options
    const [eleveOptions, setEleveOptions] = useState<OptionItem[]>([]);
    const [anneeOptions, setAnneeOptions] = useState<OptionItem[]>([]);
    const [sectionOptions, setSectionOptions] = useState<OptionItem[]>([]);
    const [optionOptions, setOptionOptions] = useState<OptionItem[]>([]);
    const [classeOptions, setClasseOptions] = useState<OptionItem[]>([]);
    const [divisionOptions, setDivisionOptions] = useState<OptionItem[]>([]);

    // pagination
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

    // ========================= Loads =========================
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<Inscription>("/fetch_inscription", {
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

    const loadEleves = async () => {
        try {
            // adapte l’endpoint à ton API si besoin
            const res = await fetchListItems("/getListEleve");
            setEleveOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.id),
                    label: `${x.nomEleve} ${x.postNomEleve ?? ""} / ${x.ageEleve ?? ""} ans`.trim(),
                }))
            );
        } catch {
            setEleveOptions([]);
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
            const res = await fetchListItems("/fetch_section");
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
            const res = await fetchListItems("/fetch_classe");
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

    const loadDivisions = async () => {
        try {
            const res = await fetchListItems("/fetch_division");
            setDivisionOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.id),
                    label: x.nomDivision,
                }))
            );
        } catch {
            setDivisionOptions([]);
        }
    };

    // ========================= Effects =========================
    useEffect(() => {
        loadEleves();
        loadAnnees();
        loadSections();
        loadClasses();
        loadDivisions();
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

    // ========================= Handlers – Form =========================
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = async (field: keyof Inscription, val: string) => {
        setFormData((prev) => ({ ...prev, [field]: val }));

        if (field === "idSection") {
            setOptionOptions([]);
            setFormData((prev) => ({ ...prev, idOption: "" }));
            await loadOptionsBySection(val);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await saveItem("/insert_inscription", formData);
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
            const res = await fetchSigleItem<Inscription[]>("/fetch_single_inscription", id);
            const data = res && res.length ? res[0] : undefined;
            if (!data) {
                showErrorMessage("Inscription introuvable.");
                return;
            }
            setFormData(data);
            setIsEditing(true);
            setShowModal(true);
            // précharger options par section
            if (data.idSection) await loadOptionsBySection(data.idSection);
        } catch (error) {
            showErrorMessage(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = await showConfirmationDialog({
            title: "Supprimer cette inscription ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });
        if (!confirmed) return;
        try {
            const res = await removeItem("/delete_inscription", id);
            showSuccessMessage(res);
            loadDatas();
        } catch (error) {
            showErrorMessage(error);
        }
    };

    // ========================= Impression carte =========================
    const printCard = (codeInscription?: string) => {
        if (!codeInscription) return;
        // Ajuste l’URL si nécessaire (fileUrl pointe déjà vers ton domaine fichiers/API)
        const url = `${fileUrl}/print_card_identification?codeInscription=${encodeURIComponent(
            codeInscription
        )}`;
        window.open(url, "_blank");
    };

    // ========================= Réduction Paiement =========================
    const openReductionModal = (row: Inscription) => {
        setFormData((prev) => ({ ...prev, id: row.id }));
        setReductionInput(row.reductionPaiement ?? "");
        setShowReductionModal(true);
    };
    const closeReductionModal = () => {
        setShowReductionModal(false);
        setReductionInput("");
    };
    const handleSubmitReduction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (reductionInput === "" || formData.id == null) {
            showWarningMessage("Renseignez un pourcentage et une inscription valide.");
            return;
        }
        try {
            // ⚠️ ajuste l’endpoint si ton API diffère
            const payload = { id: formData.id, reductionPaiement: Number(reductionInput) };
            const res = await saveItem("/updateReductionPaiement", payload);
            showSuccessMessage(res);
            closeReductionModal();
            loadDatas();
        } catch (err) {
            showErrorMessage(err);
        }
    };


    const navigate = useNavigate();

    const handleClick = (codeInscription: string) => {
        navigate(`/ecole/ponctualite/${codeInscription}`);
    };

    // ========================= Render =========================
    return (
        <div className="col-md-12">
            <h4 className="mb-3">Gestion des inscriptions</h4>

            <LoaderAndError loading={loading} error={error} onClearError={() => setError(null)} />

            {/* Recherche */}
            <div className="d-flex justify-content-between mb-3">
                <div className="col-auto col-sm-4">
                    <div className="input-group mb-2">
                        <button
                            className="btn btn-sm btn-primary me-1"
                            onClick={() => loadDatas()}
                        >
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

            {/* Tableau */}
            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-striped align-middle">
                            <thead>
                                <tr>
                                    <th>Photo</th>
                                    <th>Nom complet</th>
                                    <th>Sexe / Âge</th>
                                    <th>Section / Option</th>
                                    <th>Classe</th>
                                    <th>Division</th>
                                    <th>Inscription</th>
                                    <th>Payé</th>
                                    <th>Mise à jour</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datas.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="text-center text-muted">
                                            Aucune donnée trouvée
                                        </td>
                                    </tr>
                                ) : (
                                    datas.map((row) => (
                                        <tr key={row.id}>
                                            <td>
                                                <img
                                                    src={
                                                        row.photoEleve
                                                            ? `${fileUrl}/images/${row.photoEleve}`
                                                            : `${fileUrl}/images/avatar.png`
                                                    }
                                                    alt="eleve"
                                                    className="rounded-circle"
                                                    width={50}
                                                    height={50}
                                                />
                                            </td>
                                            <td>
                                                {truncateText(`${row.nomEleve ?? ""} ${row.postNomEleve ?? ""}`, 40)}
                                                <br />
                                                {row.preNomEleve}
                                            </td>
                                            <td>
                                                {row.sexeEleve} / {row.ageEleve ?? "-"} ans
                                            </td>
                                            <td>
                                                {truncateText(`${row.nomSection ?? ""}`, 30)} -{" "}
                                                {truncateText(`${row.nomOption ?? ""}`, 30)}
                                                {row.reductionPaiement ? (
                                                    <div>
                                                        <span className="text-success">
                                                            Réduction: <b>{row.reductionPaiement}% ({row.PrevisionReduction}$)</b>
                                                        </span>
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td>{row.nomClasse}</td>
                                            <td>{row.nomDivision}</td>
                                            <td>
                                                {formatDateFR(row.dateInscription || "")}
                                                <p className="mb-0 small">
                                                    <i className="fas fa-qrcode me-1" />
                                                    {row.codeInscription}
                                                </p>
                                            </td>
                                            <td>{row.paie}$</td>
                                            <td>
                                                {formatDateFR(row.created_at || "")} {extractTime(row.created_at || "")}
                                            </td>
                                            <td>
                                                {/* Actions */}
                                                <div className="btn-group">
                                                    <button
                                                        className="btn btn-warning btn-sm me-1"
                                                        onClick={() => handleEdit(row.id!)}
                                                        title="Modifier"
                                                    >
                                                        <i className="fas fa-edit" />
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm me-1"
                                                        onClick={() => handleDelete(row.id!)}
                                                        title="Supprimer"
                                                    >
                                                        <i className="fas fa-trash" />
                                                    </button>

                                                    

                                                    <button
                                                        className="btn btn-primary btn-sm me-1"
                                                        onClick={() => handleClick(row.codeInscription??'')}
                                                        title="Voir sa ponctualité"
                                                    >
                                                        <i className="fas fa-calendar" />
                                                    </button>


                                                    <button
                                                        className="btn btn-secondary btn-sm me-1"
                                                        onClick={() => printCard(row.codeInscription)}
                                                        title="Imprimer la carte"
                                                    >
                                                        <i className="fas fa-id-badge" />
                                                    </button>
                                                    {/* Réduction */}
                                                    <button
                                                        className="btn btn-info btn-sm me-1"
                                                        onClick={() => openReductionModal(row)}
                                                        title="Réduction de paiement"
                                                    >
                                                        <i className="fas fa-credit-card" />
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

            {/* Modal Ajout/Édition */}
            <Modal
                title={isEditing ? "Modifier l'inscription" : "Nouvelle inscription"}
                show={showModal}
                onClose={closeModal}
                dimension="modal-xl"
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        {/* Élève */}
                        <div className="col-md-12">
                            <SelectPickerField
                                label="Élève"
                                name="idEleve"
                                icon="fas fa-user"
                                value={formData.idEleve ? String(formData.idEleve) : ""}
                                options={eleveOptions}
                                required
                                onChange={(v) => setFormData((prev) => ({ ...prev, idEleve: v }))}
                            />
                        </div>

                        {/* Année */}
                        <div className="col-md-6">
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

                        {/* Option (dépend de Section) */}
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
                                onChange={(v) => setFormData((prev) => ({ ...prev, idClasse: v }))}
                            />
                        </div>

                        {/* Division */}
                        <div className="col-md-6">
                            <SelectPickerField
                                label="Dédoublement (Division)"
                                name="idDivision"
                                icon="fas fa-columns"
                                value={formData.idDivision ? String(formData.idDivision) : ""}
                                options={divisionOptions}
                                required
                                onChange={(v) => setFormData((prev) => ({ ...prev, idDivision: v }))}
                            />
                        </div>

                        {/* Date d'inscription */}
                        <div className="col-md-6">
                            <TextField
                                label="Date d'inscription"
                                name="dateInscription"
                                type="date"
                                value={formData.dateInscription || ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        {/* Frais et Reste */}
                        <div className="col-md-6">
                            <TextField
                                label="Frais d'inscription ($)"
                                name="fraisinscription"
                                type="number"
                                value={formData.fraisinscription !== undefined ? String(formData.fraisinscription) : ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <TextField
                                label="Montant manquant ($)"
                                name="restoreinscription"
                                type="number"
                                value={formData.restoreinscription !== undefined ? String(formData.restoreinscription) : ""}
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

            {/* Modal Réduction Paiement */}
            <Modal
                title="Réduction de paiement scolaire"
                show={showReductionModal}
                onClose={closeReductionModal}
                dimension="modal-md"
            >
                <form onSubmit={handleSubmitReduction}>
                    <div className="row">
                        <div className="col-md-12">
                            <TextField
                                label="Pourcentage de réduction (%)"
                                name="reductionPaiement"
                                type="number"
                                value={reductionInput === "" ? "" : String(reductionInput)}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (v === "") setReductionInput("");
                                    else setReductionInput(Math.max(0, Math.min(100, Number(v))));
                                }}
                                required
                            />
                            <p className="text-muted small mt-2">
                                Indique un pourcentage entre 0 et 100. La valeur ($) calculée est gérée côté API.
                            </p>
                        </div>
                    </div>
                    <div className="d-flex justify-content-end mt-3">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            Appliquer
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
