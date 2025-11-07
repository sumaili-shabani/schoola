import React, { useEffect, useMemo, useState } from "react";
import {
    fetchItems,
    fetchListItems,
    fetchSigleItem,
    saveItem,
    removeItem,
    showConfirmationDialog,
    extractTime,
    formatDateFR,
    truncateText,
    saveItemImageForm,
} from "../../api/callApi";
import {
    fileUrl,
    getUser,
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
import AnnexeDepense from "./components/AnnexeDepense";


// ========================= Types =========================
interface Recette {
    id?: number;
    codeOperation?: string;

    montant?: number | string;
    montantLettre?: string;
    motif?: string;
    dateOperation?: string;

    refMvt?: number | string; // 1 = entrée
    refCompte?: number | string;
    numero_ssouscompte?: string; // affichage liste

    modepaie?: string; // cash, momo...
    refBanque?: number | string;
    nom_banque?: string;
    numeroBordereau?: string;

    StatutAcquitterPar?: "OUI" | "NON" | string;
    StatutApproCoordi?: "OUI" | "NON" | string;

    Compte?: string;
    author?: string;

    created_at?: string;
}

interface OptionItem {
    value: string;
    label: string;
}

export default function RecettePage() {
    // table
    const [datas, setDatas] = useState<Recette[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // form
    const [formData, setFormData] = useState<Partial<Recette>>({
        numeroBordereau: "",
        refMvt: 1,
    });
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // selects options
    const [compteOptions, setCompteOptions] = useState<OptionItem[]>([]);
    const [modeOptions, setModeOptions] = useState<OptionItem[]>([]);
    const [banqueOptions, setBanqueOptions] = useState<OptionItem[]>([]);

    // pagination
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

    // ========================= Loads =========================
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<Recette>("/fetch_mouvement_entree", {
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

    const loadComptes = async () => {
        try {
            const res = await fetchListItems("/fetch_compte_entree");
            setCompteOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.id),
                    label: x.designation,
                }))
            );
        } catch {
            setCompteOptions([]);
        }
    };

    const loadModes = async () => {
        try {
            const res = await fetchListItems("/fetch_tconf_modepaie_2");
            setModeOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.designation),
                    label: x.designation,
                }))
            );
        } catch {
            setModeOptions([]);
        }
    };

    const loadBanquesByMode = async (modeName: string) => {
        if (!modeName) {
            setBanqueOptions([]);
            return;
        }
        try {
            const res = await fetchListItems(`/fetch_list_banque/${modeName}`);
            setBanqueOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.id),
                    label: x.nom_banque,
                }))
            );
        } catch {
            setBanqueOptions([]);
        }
    };

    // ========================= Effects =========================
    useEffect(() => {
        loadComptes();
        loadModes();
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

    const handleSelectChange = async (field: keyof Recette, val: string) => {
        setFormData((prev) => ({ ...prev, [field]: val }));
        if (field === "modepaie") {
            await loadBanquesByMode(val);
            setFormData((prev) => ({ ...prev, refBanque: "" }));
        }
    };

    const openModal = () => {
        setFormData({
            numeroBordereau: "",
            refMvt: 1,
            refCompte: "",
            modepaie: "",
            refBanque: "",
            montant: 0,
            montantLettre: "",
            motif: "",
            dateOperation: "",
        });
        setIsEditing(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setFormData({ refMvt: 1, numeroBordereau: "" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const user = getUser();
        const payload: any = {
            ...formData,
            refMvt: 1,
            author: user?.name ?? "Admin",
        };

        // validations minimales
        if (!payload.montant || Number(payload.montant) <= 0) {
            showWarningMessage("Le montant doit être > 0.");
            return;
        }
        if (!payload.refCompte) {
            showWarningMessage("Sélectionnez un compte.");
            return;
        }
        if (!payload.modepaie) {
            showWarningMessage("Sélectionnez un mode de paiement.");
            return;
        }
        if (!payload.refBanque) {
            showWarningMessage("Sélectionnez une caisse/banque.");
            return;
        }

        try {
            if (isEditing && payload.id) {
                const res = await saveItem(`/update_depense/${payload.id}`, payload);
                showSuccessMessage(res);
            } else {
                const res = await saveItem("/insert_depense", payload);
                showSuccessMessage(res);
            }
            closeModal();
            loadDatas();
        } catch (error) {
            showWarningMessage(error);
        }
    };

    const handleEdit = async (id: number) => {
        try {
            setLoading(true);
            const res = await fetchSigleItem<Recette[]>("/fetch_single_depense", id);
            const data = res && res.length ? res[0] : undefined;
            if (!data) {
                showErrorMessage("Recette introuvable.");
                return;
            }

            // Précharger banques si nécessaire
            if (data.modepaie) await loadBanquesByMode(String(data.modepaie));

            setFormData({
                ...data,
            });
            setIsEditing(true);
            setShowModal(true);
        } catch (error) {
            showErrorMessage(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = await showConfirmationDialog({
            title: "Supprimer cette recette ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });
        if (!confirmed) return;
        try {
            const res = await removeItem("/delete_depense", id);
            showSuccessMessage(res);
            loadDatas();
        } catch (error) {
            showErrorMessage(error);
        }
    };

    const acquitterRecette = async (id: number) => {
        const user = getUser();
        const payload = { id, author: user?.name ?? "Admin" };
        const confirmed = await showConfirmationDialog({
            title: "Acquitter la recette ?",
            text: "Cette action marquera la recette comme acquittée.",
            icon: "question",
            confirmButtonText: "Acquitter",
        });
        if (!confirmed) return;
        try {
            const res = await saveItem(`/aquitter_depense/${id}`, payload);
            showSuccessMessage(res);
            loadDatas();
        } catch (e) {
            showErrorMessage(e);
        }
    };

    const approuverRecette = async (id: number) => {
        const user = getUser();
        const payload = { id, author: user?.name ?? "Admin" };
        const confirmed = await showConfirmationDialog({
            title: "Approuver la recette ?",
            text: "Cette action marquera la recette comme approuvée par la trésorerie.",
            icon: "question",
            confirmButtonText: "Approuver",
        });
        if (!confirmed) return;
        try {
            const res = await saveItem(`/approuver_depense/${id}`, payload);
            showSuccessMessage(res);
            loadDatas();
        } catch (e) {
            showErrorMessage(e);
        }
    };

    const printBonEntree = (id?: number) => {
        if (!id) return;
        const url = `${fileUrl}/pdf_bonentree_data?id=${encodeURIComponent(String(id))}`;
        window.open(url, "_blank");
    };

    // ========================= Annexes =========================
    const [showAnnexe, setShowAnnexe] = useState(false);
    const [annexeRefDepense, setAnnexeRefDepense] = useState<number | null>(null);
    const [annexeTitle, setAnnexeTitle] = useState<string>("");

    const openAnnexes = (row: Recette) => {
        if (!row.id) return;
        setAnnexeRefDepense(row.id);
        setAnnexeTitle(`Les documents en annexe pour ${row.codeOperation ?? row.id}`);
        setShowAnnexe(true);
    };

    const closeAnnexe = () => {
        setShowAnnexe(false);
        setAnnexeRefDepense(null);
    };

    // ========================= Render =========================
    return (
        <div className="col-md-12">
            <h4 className="mb-3">Les Recettes</h4>

            <LoaderAndError loading={loading} error={error} onClearError={() => setError(null)} />

            {/* Recherche + bouton */}
            <div className="d-flex justify-content-between mb-3 align-items-center">
                <div className="col-auto col-sm-6">
                    <div className="input-group mb-2">
                        <button className="btn btn-sm btn-primary me-2" onClick={() => loadDatas()} title="Initialiser">
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
                                    <th>N°</th>
                                    <th>Montant ($)</th>
                                    <th>Montant (lettre)</th>
                                    <th>Caisse/Banque</th>
                                    <th>N°Compte</th>
                                    <th>Rubrique</th>
                                    <th>Motif</th>
                                    <th>Date</th>
                                    <th>Acquitté</th>
                                    <th>Trésorerie</th>
                                    <th>Auteur</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datas.length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="text-center text-muted">
                                            Aucune donnée trouvée
                                        </td>
                                    </tr>
                                ) : (
                                    datas.map((row) => (
                                        <tr key={row.id}>
                                            <td>{truncateText(`${row.codeOperation ?? row.id}`, 5)}</td>
                                            <td>{row.montant}</td>
                                            <td>{row.montantLettre}</td>
                                            <td>{row.nom_banque}</td>
                                            <td>{row.numero_ssouscompte}</td>
                                            <td>{row.Compte}</td>
                                            <td>{row.motif}</td>
                                            <td>{formatDateFR(row.dateOperation || "")}</td>
                                            <td>
                                                <span>{row.StatutAcquitterPar ?? "-"}</span>
                                            </td>
                                            <td>
                                                <span>{row.StatutApproCoordi ?? "-"}</span>
                                            </td>
                                            <td>{row.author}</td>
                                            <td>
                                                <div className="btn-group">
                                                    <button
                                                        className="btn btn-success btn-sm me-1"
                                                        onClick={() => acquitterRecette(row.id!)}
                                                        title="Acquitter"
                                                    >
                                                        <i className="fas fa-check" />
                                                    </button>
                                                    <button
                                                        className="btn btn-success btn-sm me-1"
                                                        onClick={() => approuverRecette(row.id!)}
                                                        title="Approuver"
                                                    >
                                                        <i className="fas fa-thumbs-up" />
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary btn-sm me-1"
                                                        onClick={() => openAnnexes(row)}
                                                        title="Annexes"
                                                    >
                                                        <i className="fas fa-paperclip" />
                                                    </button>
                                                    {row.StatutAcquitterPar === "OUI" && row.StatutApproCoordi === "OUI" && (
                                                        <button
                                                            className="btn btn-secondary btn-sm me-1"
                                                            onClick={() => printBonEntree(row.id!)}
                                                            title="Bon d'entrée"
                                                        >
                                                            <i className="fas fa-print" />
                                                        </button>
                                                    )}

                                                    {row.StatutApproCoordi === "NON" && (
                                                       <div className="justify-content-lg-start">
                                                            <button
                                                                className="btn btn-warning btn-sm me-1"
                                                                onClick={() => handleEdit(row.id!)}
                                                                title="Modifier"
                                                            >
                                                                <i className="fas fa-edit" />
                                                            </button>
                                                           
                                                       </div>
                                                    )}

                                                    {row.StatutApproCoordi === "NON" && (
                                                        <div className="justify-content-lg-start">
                                                           
                                                            <button
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() => handleDelete(row.id!)}
                                                                title="Supprimer"
                                                            >
                                                                <i className="fas fa-trash" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    
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
                title={isEditing ? "Modifier la recette" : "Nouvelle recette"}
                show={showModal}
                onClose={closeModal}
                dimension="modal-lg"
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-12">
                            <SelectPickerField
                                label="Mode de paiement"
                                name="modepaie"
                                icon="fas fa-money-bill"
                                value={formData.modepaie ? String(formData.modepaie) : ""}
                                options={modeOptions}
                                required
                                onChange={(v) => handleSelectChange("modepaie", v)}
                            />
                        </div>
                        <div className="col-md-12">
                            <SelectPickerField
                                label="Caisse / Banque"
                                name="refBanque"
                                icon="fas fa-building-columns"
                                value={formData.refBanque ? String(formData.refBanque) : ""}
                                options={banqueOptions}
                                required
                                onChange={(v) => setFormData((prev) => ({ ...prev, refBanque: v }))}
                            />
                        </div>
                        <div className="col-md-12">
                            <TextField
                                label="N° Bordereau / N° Compte"
                                name="numeroBordereau"
                                value={formData.numeroBordereau || ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <TextField
                                label="Montant ($)"
                                name="montant"
                                type="number"
                                value={formData.montant !== undefined ? String(formData.montant) : ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <TextField
                                label="Montant en lettres"
                                name="montantLettre"
                                value={formData.montantLettre || ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="col-md-12">
                            <TextField
                                label="Motif"
                                name="motif"
                                value={formData.motif || ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <TextField
                                label="Date d'entrée"
                                name="dateOperation"
                                type="date"
                                value={formData.dateOperation || ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <SelectPickerField
                                label="Compte (rubrique)"
                                name="refCompte"
                                icon="fas fa-folder"
                                value={formData.refCompte ? String(formData.refCompte) : ""}
                                options={compteOptions}
                                required
                                onChange={(v) => setFormData((prev) => ({ ...prev, refCompte: v }))}
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-end mt-3">
                        <button type="button" className="btn btn-outline-secondary me-2" onClick={closeModal}>
                            Fermer
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {isEditing ? "Modifier" : "Ajouter"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Annexes */}
            <AnnexeDepense
                open={showAnnexe}
                onClose={closeAnnexe}
                refDepense={annexeRefDepense ?? 0}
                title={annexeTitle}
            />
        </div>
    );
}
