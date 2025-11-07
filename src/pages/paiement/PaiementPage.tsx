// src/pages/ecole/PaiementPage.tsx
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

// ========================= Types =========================
interface Paiement {
    id?: number;
    idInscription?: number | string;
    idTranche?: number | string;
    idFrais?: number | string;
    datePaiement?: string;
    montant?: number | string;
    modepaie?: string;          // "Cash", "Mobile Money", ...
    refBanque?: number | string; // id banque
    numeroBordereau?: string;    // N° bordereau / compte
    codePaiement?: string;
    etatPaiement?: 0 | 1;
    idUser?: number | string;

    // Champs affichage
    nomEleve?: string;
    postNomEleve?: string;
    preNomEleve?: string;
    sexeEleve?: string;
    ageEleve?: number;
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

interface EtatFraisEleve {
    idClasse?: string | number;
    idOption?: string | number;
    idAnne?: string | number;
    idDivision?: string | number;
    nomEleve?: string;
    nomSection?: string;
    nomOption?: string;
    nomClasse?: string;
    nomDivision?: string;
    montantApayer?: number | string;
    montantPayer?: number | string;
    resteApayer?: number | string;
    montantRemise?: number | string;
}

// ========================= Component =========================
export default function PaiementPage() {
    // table
    const [datas, setDatas] = useState<Paiement[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // form
    const [formData, setFormData] = useState<Partial<Paiement>>({
        numeroBordereau: "000000000",
    });
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // panneaux info calculés (affichés dans le formulaire)
    const [stateInfo, setStateInfo] = useState<EtatFraisEleve>({});

    // selects options
    const [inscriptionsOptions, setInscriptionsOptions] = useState<OptionItem[]>(
        []
    ); // Élèves inscrits (idInscription)
    const [trancheOptions, setTrancheOptions] = useState<OptionItem[]>([]);
    const [fraisOptions, setFraisOptions] = useState<OptionItem[]>([]);
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
            const res = await fetchItems<Paiement>("/fetch_paiement", {
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

    // ⚠️ Ajuste l’endpoint pour la liste des inscriptions (élèves inscrits)
    const loadInscriptions = async () => {
        try {
            // ex: "/fetch_eleve_inscrits" doit retourner: id, nomEleve, postNomEleve, preNomEleve, sexeEleve, ageEleve, nomSection, nomOption, nomClasse, nomDivision, designation (année)
            const res = await fetchListItems("/getListEleveInscrits");
            setInscriptionsOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.id), // idInscription
                    label: `${x.nomEleve ?? ""} ${x.postNomEleve ?? ""} – ${x.nomSection ?? ""}/${x.nomOption ?? ""} – ${x.nomClasse ?? ""}/${x.nomDivision ?? ""} – ${x.designation ?? ""}`.trim(),
                }))
            );
        } catch {
            setInscriptionsOptions([]);
        }
    };

    const loadTranches = async () => {
        try {
            const res = await fetchListItems("/fetch_tranche");
            setTrancheOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.id),
                    label: x.nomTranche,
                }))
            );
        } catch {
            setTrancheOptions([]);
        }
    };

    const loadFrais = async () => {
        try {
            const res = await fetchListItems("/fetch_type_tranche");
            setFraisOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.id),
                    label: x.nomTypeTranche,
                }))
            );
        } catch {
            setFraisOptions([]);
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

    // infos frais élève (totaux, reste, remise, etc.)
    const loadInfoPaiementEleve = async (idInscription: string | number) => {
        if (!idInscription) {
            setStateInfo({});
            return;
        }
        try {
            const res = await fetchListItems(`/getinfo_paiement_eleve/${idInscription}`);
            const row = (res?.data || [])[0];
            if (row) {
                setStateInfo({
                    idClasse: row.idClasse,
                    idOption: row.idOption,
                    idAnne: row.idAnne,
                    idDivision: row.idDivision,
                    nomEleve: row.nomEleve,
                    nomSection: row.nomSection,
                    nomOption: row.nomOption,
                    nomClasse: row.nomClasse,
                    nomDivision: row.nomDivision,
                    montantApayer: row.montantApayer,
                    montantPayer: row.montantPayer,
                    resteApayer: row.resteApayer,
                    montantRemise: row.montantRemise,
                });
            } else setStateInfo({});
        } catch (e) {
            setStateInfo({});
        }
    };

    // ========================= Effects =========================
    useEffect(() => {
        loadInscriptions();
        loadTranches();
        loadFrais();
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

    const handleSelectChange = async (field: keyof Paiement, val: string) => {
        setFormData((prev) => ({ ...prev, [field]: val }));

        if (field === "idInscription") {
            await loadInfoPaiementEleve(val);
        }
        if (field === "modepaie") {
            await loadBanquesByMode(val);
            setFormData((prev) => ({ ...prev, refBanque: "" }));
        }
    };

    const openModal = () => {
        setFormData({ numeroBordereau: "000000000" });
        setStateInfo({});
        setIsEditing(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setFormData({ numeroBordereau: "000000000" });
        setStateInfo({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const user = getUser();
        const payload = {
            ...formData,
            idUser: user?.id ?? "",
        };

        const reste = Number(stateInfo.resteApayer ?? 0);
        const mnt = Number(payload.montant ?? 0);

        if (isNaN(mnt) || mnt <= 0) {
            showWarningMessage("Veillez saisir un montant valide (> 0).");
            return;
        }
        if (mnt > reste) {
            showErrorMessage(`Erreur, veillez payer un montant ≤ au reste à payer (${reste}$).`);
            return;
        }

        try {
            const res = await saveItem("/insert_paiement", payload);
            showSuccessMessage(res);

            if (payload.idInscription) await loadInfoPaiementEleve(payload.idInscription);

            setFormData((prev) => ({
                ...prev,
                idTranche: "",
                idFrais: "",
                montant: "",
            }));

            loadDatas();
            closeModal();
        } catch (error) {
            showWarningMessage(error);
        }
    };

    const handleEdit = async (id: number) => {
        try {
            setLoading(true);
            const res = await fetchSigleItem<Paiement[]>("/fetch_single_paiement", id);
            const data = res && res.length ? res[0] : undefined;
            if (!data) {
                showErrorMessage("Paiement introuvable.");
                return;
            }
            setFormData({
                ...data,
                // on affiche la modale en mode édition
            });
            if (data.idInscription) await loadInfoPaiementEleve(data.idInscription);
            // charger banques si mode déjà présent
            if (data.modepaie) await loadBanquesByMode(String(data.modepaie));
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
            title: "Supprimer ce paiement ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });
        if (!confirmed) return;
        try {
            const res = await removeItem("/delete_paiement", id);
            showSuccessMessage(res);
            loadDatas();
        } catch (error) {
            showErrorMessage(error);
        }
    };

    const handleToggleValidation = async (id: number, etat: 0 | 1) => {
        const confirmed = await showConfirmationDialog({
            title: etat === 0 ? "Valider ce paiement ?" : "Annuler la validation ?",
            text: etat === 0
                ? "Le paiement passera à l'état 'Confirmé'."
                : "Le paiement repassera à 'En attente'.",
            icon: "question",
            confirmButtonText: "Confirmer",
        });
        if (!confirmed) return;
        try {
            const res = await fetchListItems(`/chect_validation_paiement/${id}/${etat}`);
            showSuccessMessage(res.data);
            loadDatas();
        } catch (e) {
            showErrorMessage(e);
        }
    };

    // ========================= Impression =========================
    const printRecu = (codePaiement?: string) => {
        if (!codePaiement) return;
        const url = `${fileUrl}/print_recu_paiement?codePaiement=${encodeURIComponent(
            codePaiement
        )}`;
        window.open(url, "_blank");
    };

    const printHistorique = (idInscription?: number | string) => {
        if (!idInscription) return;
        const url = `${fileUrl}/fetch_historique_paiement?idInscription=${encodeURIComponent(
            String(idInscription)
        )}`;
        window.open(url, "_blank");
    };

    // ========================= Render =========================
    return (
        <div className="col-md-12">
            <h4 className="mb-3">Liste des Paiements</h4>

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
                                    <th>N°Reçu</th>
                                    <th>Nom complet</th>
                                    <th>Sexe / Âge</th>
                                    <th>Section / Option / Classe-Division</th>
                                    <th>Date de paiement</th>
                                    <th>Montant ($)</th>
                                    <th>Mise à jour</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datas.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center text-muted">
                                            Aucune donnée trouvée
                                        </td>
                                    </tr>
                                ) : (
                                    datas.map((row) => (
                                        <tr key={row.id}>
                                            <td>{row.codePaiement}</td>
                                            <td>
                                                {truncateText(`${row.nomEleve ?? ""} ${row.postNomEleve ?? ""}`, 40)}
                                                <br />
                                                {row.preNomEleve}
                                            </td>
                                            <td>{row.sexeEleve} / {row.ageEleve ?? "-"} ans</td>
                                            <td>
                                                {truncateText(`${row.nomSection ?? ""}`, 30)} - {truncateText(`${row.nomOption ?? ""}`, 30)}
                                                <br />
                                                <b>Classe & Division:</b> {row.nomClasse} ({row.nomDivision})
                                            </td>
                                            <td>{formatDateFR(row.datePaiement || "")}</td>
                                            <td>
                                                {row.montant}
                                                <br />
                                                {row.etatPaiement === 1 ? (
                                                    <span className="text-success">Confirmé</span>
                                                ) : (
                                                    <span className="text-danger">En attente</span>
                                                )}
                                            </td>
                                            <td>
                                                {formatDateFR(row.created_at || "")} {extractTime(row.created_at || "")}
                                            </td>
                                            <td>
                                                <div className="btn-group">
                                                    {row.etatPaiement === 0 ? (
                                                        <>
                                                            <button
                                                                className="btn btn-success btn-sm me-1"
                                                                title="Valider le paiement"
                                                                onClick={() => handleToggleValidation(row.id!, row.etatPaiement!)}
                                                            >
                                                                <i className="fas fa-check" />
                                                            </button>
                                                            <button
                                                                className="btn btn-danger btn-sm me-1"
                                                                title="Supprimer"
                                                                onClick={() => handleDelete(row.id!)}
                                                            >
                                                                <i className="fas fa-trash" />
                                                            </button>

                                                            {/* <button
                                                                className="btn btn-warning btn-sm"
                                                                title="Modifier"
                                                                onClick={() => handleEdit(row.id!)}
                                                            >
                                                                <i className="fas fa-edit" />
                                                            </button> */}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                className="btn btn-secondary btn-sm me-1"
                                                                title="Imprimer le reçu"
                                                                onClick={() => printRecu(row.codePaiement)}
                                                            >
                                                                <i className="fas fa-print" />
                                                            </button>
                                                            <button
                                                                className="btn btn-secondary btn-sm me-1"
                                                                title="Imprimer ses paiements"
                                                                onClick={() => printHistorique(row.idInscription!)}
                                                            >
                                                                <i className="fas fa-file-invoice" />
                                                            </button>
                                                        </>
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

            {/* Modal Ajout/Édition Paiement */}
            <Modal
                title={isEditing ? "Modifier le paiement" : "Nouveau paiement"}
                show={showModal}
                onClose={closeModal}
                dimension="modal-xl"
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        {/* Élève (Inscription) */}
                        <div className="col-md-12">
                            <SelectPickerField
                                label="Sélectionner l'élève inscrit"
                                name="idInscription"
                                icon="fas fa-user"
                                value={formData.idInscription ? String(formData.idInscription) : ""}
                                options={inscriptionsOptions}
                                required
                                onChange={(v) => handleSelectChange("idInscription", v)}
                            />
                        </div>

                        {/* Tranche & Frais */}
                        <div className="col-md-6">
                            <SelectPickerField
                                label="Tranche"
                                name="idTranche"
                                icon="fas fa-layer-group"
                                value={formData.idTranche ? String(formData.idTranche) : ""}
                                options={trancheOptions}
                                required
                                onChange={(v) => setFormData((prev) => ({ ...prev, idTranche: v }))}
                            />
                        </div>
                        <div className="col-md-6">
                            <SelectPickerField
                                label="Frais"
                                name="idFrais"
                                icon="fas fa-list"
                                value={formData.idFrais ? String(formData.idFrais) : ""}
                                options={fraisOptions}
                                required
                                onChange={(v) => setFormData((prev) => ({ ...prev, idFrais: v }))}
                            />
                        </div>

                        {/* Date + Montant */}
                        <div className="col-md-6">
                            <TextField
                                label="Date de paiement"
                                name="datePaiement"
                                type="date"
                                value={formData.datePaiement || ""}
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

                        {/* Mode de paiement → Banque (dynamique) */}
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
                                label="Banque"
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

                        {/* Panneaux info calculées */}
                        <div className="col-md-6">
                            <h6>Promotion</h6>
                            <ul className="mb-0">
                                <li>
                                    <b>Nom Élève:</b> {truncateText(stateInfo.nomEleve ?? "", 40)}
                                </li>
                                <li>
                                    <b>Promotion:</b> {truncateText(stateInfo.nomSection ?? "", 30)} - {truncateText(stateInfo.nomOption ?? "", 30)}
                                    <br />
                                    <b>Division:</b> {stateInfo.nomClasse} ({stateInfo.nomDivision})
                                    <br />
                                    <b>Réduction:</b> {stateInfo.montantRemise ?? 0}$
                                </li>
                            </ul>
                        </div>
                        <div className="col-md-6">
                            <h6>Frais</h6>
                            <ul className="mb-0">
                                <li><b>Total à payer:</b> {stateInfo.montantApayer ?? 0}$</li>
                                <li><b>Total déjà payé:</b> <span className="text-success">{stateInfo.montantPayer ?? 0}$</span></li>
                                <li><b>Reste à payer:</b> <span className="text-danger">{stateInfo.resteApayer ?? 0}$</span></li>
                            </ul>
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
        </div>
    );
}
