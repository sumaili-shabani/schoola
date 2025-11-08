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

// ===================================================
// TYPES
// ===================================================
interface Depense {
    id?: number;
    codeOperation?: string;
    montant?: number | string;
    montantLettre?: string;
    motif?: string;
    dateOperation?: string;
    refMvt?: number | string; // 2 = dépense
    refCompte?: number | string;
    numero_ssouscompte?: string;
    Compte?: string;
    modepaie?: string;
    refBanque?: number | string;
    nom_banque?: string;
    numeroBordereau?: string;
    numeroBE?: string;
    comptesJournal?: string;
    numCompteJournal?: string;
    StatutAcquitterPar?: string;
    StatutApproCoordi?: string;
    author?: string;
}

interface OptionItem {
    value: string;
    label: string;
}

// ===================================================
// COMPONENT
// ===================================================
export default function DepensePage() {
    const [datas, setDatas] = useState<Depense[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // form state
    const [formData, setFormData] = useState<Partial<Depense>>({
        refMvt: 2,
        numeroBE: "0000",
    });
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // select lists
    const [compteOptions, setCompteOptions] = useState<OptionItem[]>([]);
    const [modeOptions, setModeOptions] = useState<OptionItem[]>([]);
    const [banqueOptions, setBanqueOptions] = useState<OptionItem[]>([]);

    // pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } =
        usePagination({ currentPage, totalPages });

    // =================== Debounce ===================
    const debounced = useMemo(() => {
        let t: any;
        return (fn: () => void, delay = 350) => {
            clearTimeout(t);
            t = setTimeout(fn, delay);
        };
    }, []);

    // =================== LOAD ===================
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<Depense>("/fetch_mouvement_depense", {
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
            const res = await fetchListItems("/fetch_compte_sortie");
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

    // =================== EFFECTS ===================
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

    // =================== FORM HANDLERS ===================
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = async (field: keyof Depense, val: string) => {
        setFormData((prev) => ({ ...prev, [field]: val }));
        if (field === "modepaie") {
            await loadBanquesByMode(val);
            setFormData((prev) => ({ ...prev, refBanque: "" }));
        }
    };

    const handleSelectCompte = async (val: string) => {
        setFormData((prev) => ({ ...prev, refCompte: val }));
        if (val) {
            try {
                const res = await fetchSigleItem<any[]>("/fetch_single_libelle", Number(val));
                if (res && res.length > 0) {
                    const lib = res[0];
                    setFormData((prev) => ({
                        ...prev,
                        comptesJournal: lib.nom_ssouscompte,
                        numCompteJournal: lib.numero_ssouscompte,
                    }));
                }
            } catch (e) {
                showErrorMessage("Erreur chargement du compte");
            }
        }
    };

    const openModal = () => {
        setFormData({
            refMvt: 2,
            numeroBE: "0000",
            montant: "",
            motif: "",
            dateOperation: "",
            refCompte: "",
            comptesJournal: "",
            numCompteJournal: "",
            modepaie: "",
            refBanque: "",
            numeroBordereau: "",
        });
        setIsEditing(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setIsEditing(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const user = getUser();
        const payload: any = {
            ...formData,
            refMvt: 2,
            author: user?.name ?? "Admin",
            numeroBE: "0000",
        };

        if (!payload.montant || Number(payload.montant) <= 0) {
            showWarningMessage("Le montant doit être > 0.");
            return;
        }
        if (!payload.refCompte) {
            showWarningMessage("Sélectionnez un compte (libellé).");
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
            const res = await fetchSigleItem<Depense[]>("/fetch_single_depense", id);
            const data = res && res.length ? res[0] : undefined;
            if (!data) {
                showErrorMessage("Dépense introuvable.");
                return;
            }
            if (data.modepaie) await loadBanquesByMode(String(data.modepaie));
            setFormData(data);
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
            title: "Supprimer cette dépense ?",
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

    const acquitterDepense = async (id: number) => {
        const user = getUser();
        const payload = { id, author: user?.name ?? "Admin" };
        const confirmed = await showConfirmationDialog({
            title: "Acquitter la dépense ?",
            text: "Marquera cette dépense comme acquittée.",
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

    const approuverDepense = async (id: number) => {
        const user = getUser();
        const payload = { id, author: user?.name ?? "Admin" };
        const confirmed = await showConfirmationDialog({
            title: "Approuver la dépense ?",
            text: "Confirme l'approbation de cette dépense.",
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

    const printBonSortie = (id?: number) => {
        if (!id) return;
        const url = `${fileUrl}/pdf_bonsortie_data?id=${encodeURIComponent(String(id))}`;
        window.open(url, "_blank");
    };

    // =================== ANNEXES ===================
    const [showAnnexe, setShowAnnexe] = useState(false);
    const [annexeRefDepense, setAnnexeRefDepense] = useState<number | null>(null);
    const [annexeTitle, setAnnexeTitle] = useState<string>("");

    const openAnnexes = (row: Depense) => {
        if (!row.id) return;
        setAnnexeRefDepense(row.id);
        setAnnexeTitle(`Documents en annexe pour ${row.codeOperation ?? row.id}`);
        setShowAnnexe(true);
    };

    const closeAnnexe = () => {
        setShowAnnexe(false);
        setAnnexeRefDepense(null);
    };

    // =================== RENDER ===================
    return (
        <div className="col-md-12">
            <h4 className="mb-3">Les Dépenses</h4>

            <LoaderAndError loading={loading} error={error} onClearError={() => setError(null)} />

            {/* Recherche + bouton */}
            <div className="d-flex justify-content-between mb-3 align-items-center">
                <div className="col-auto col-sm-6">
                    <div className="input-group mb-2">
                        <button className="btn btn-sm btn-primary me-2" onClick={() => loadDatas()}>
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
                                    <th>Montant Lettre</th>
                                    <th>Caisse/Banque</th>
                                    <th>N°Compte</th>
                                    <th>Compte</th>
                                    <th>Motif</th>
                                    <th>Date</th>
                                    <th>Acquitté</th>
                                    <th>Approuvé (AG)</th>
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
                                            <td>{row.StatutAcquitterPar ?? "-"}</td>
                                            <td>{row.StatutApproCoordi ?? "-"}</td>
                                            <td>{row.author}</td>
                                            <td>
                                                <div className="btn-group">
                                                    <button
                                                        className="btn btn-success btn-sm me-1"
                                                        onClick={() => acquitterDepense(row.id!)}
                                                    >
                                                        <i className="fas fa-check" />
                                                    </button>
                                                    <button
                                                        className="btn btn-success btn-sm me-1"
                                                        onClick={() => approuverDepense(row.id!)}
                                                    >
                                                        <i className="fas fa-thumbs-up" />
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary btn-sm me-1"
                                                        onClick={() => openAnnexes(row)}
                                                    >
                                                        <i className="fas fa-paperclip" />
                                                    </button>
                                                    {row.StatutAcquitterPar === "OUI" && (
                                                        <button
                                                            className="btn btn-secondary btn-sm me-1"
                                                            onClick={() => printBonSortie(row.id!)}
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

            {/* Modal Dépense */}
            <Modal
                title={isEditing ? "Modifier la dépense" : "Nouvelle dépense"}
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
                                onChange={(v) => handleSelectChange("modepaie", v)}
                                required
                            />
                        </div>
                        <div className="col-md-12">
                            <SelectPickerField
                                label="Caisse / Banque"
                                name="refBanque"
                                icon="fas fa-building-columns"
                                value={formData.refBanque ? String(formData.refBanque) : ""}
                                options={banqueOptions}
                                onChange={(v) => setFormData((p) => ({ ...p, refBanque: v }))}
                                required
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
                                label="Date Dépense"
                                name="dateOperation"
                                type="date"
                                value={formData.dateOperation || ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <SelectPickerField
                                label="Libellé (compte)"
                                name="refCompte"
                                icon="fas fa-folder"
                                value={formData.refCompte ? String(formData.refCompte) : ""}
                                options={compteOptions}
                                onChange={handleSelectCompte}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <TextField
                                label="Comptes"
                                name="comptesJournal"
                                value={formData.comptesJournal || ""}
                                onChange={handleInputChange}
                                
                            />
                        </div>
                        <div className="col-md-6">
                            <TextField
                                label="Numéro Compte"
                                name="numCompteJournal"
                                value={formData.numCompteJournal || ""}
                                onChange={handleInputChange}
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
