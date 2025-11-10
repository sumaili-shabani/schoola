import React, { useEffect, useMemo, useState } from "react";
import {
    fetchItems,
    fetchSigleItem,
    fetchListItems,
    saveItem,
    removeItem,
    showConfirmationDialog,
    formatDateFR,
} from "../../api/callApi";
import {
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
interface MessageScolaire {
    id?: number;
    idAnne?: string | number;
    idSection?: number | string;
    idPeriode?: number | string;
    idClasse?: string | number;
    idOption?: string | number;
    idInscription?: string | number;
    type_message?: string;
    titre_message?: string;
    contenu_message?: string;
    telephone_parent?: string;
    statut_envoi?: string;
    envoye_par?: string;
    created_at?: string;
}

interface OptionItem {
    value: string;
    label: string;
}

// ========================= Component =========================
export default function MessageScolairePage() {
    // table
    const [datas, setDatas] = useState<MessageScolaire[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // form
    const [formData, setFormData] = useState<Partial<MessageScolaire>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // selects options

    const [anneeOptions, setAnneeOptions] = useState<OptionItem[]>([]);
    const [sectionOptions, setSectionOptions] = useState<OptionItem[]>([]);
    const [optionOptions, setOptionOptions] = useState<OptionItem[]>([]);
    const [classeOptions, setClasseOptions] = useState<OptionItem[]>([]);
    const [periodeOptions, setPeriodeOptions] = useState<OptionItem[]>([]);
    const [eleveOptions, setEleveOptions] = useState<OptionItem[]>([]);


    const [sending, setSending] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        envoyes: 0,
        non_envoyes: 0,
    });

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

    const loadStats = async () => {
        try {
            setLoading(true);
            const res = await fetchListItems("/messages_scolaires/stats");
            const data = res?.data || {};
            setStats({
                total: data.total || 0,
                envoyes: data.envoyes || 0,
                non_envoyes: data.non_envoyes || 0,
            });
            setLoading(false);
        } catch (error) {
            console.error(error);
            showWarningMessage("Impossible de charger les statistiques des messages.");
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<MessageScolaire>("/messages_scolaires", {
                page: currentPage,
                limit,
                query: search,
            });
            setDatas(res.data);
            setTotalPages(res.lastPage);
            loadStats();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
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

    // === Handlers ===
    const handleSelectChange = (field: keyof typeof formData, val: string) => {
        setFormData((prev) => ({ ...prev, [field]: val }));
        if (field === "idSection") loadOptionsBySection(val);

        // if (field === "idClasse") {
        //     if (!form.idAnne && !form.idOption && !form.idClasse) {
        //         loadEleves(form.idAnne, form.idOption, form.idClasse);

        //     }
        // }

    };



    // ========================= Effects =========================
    useEffect(() => {
        loadAnnees();
        loadSections();
        loadClasses();
        loadPeriodes();

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

    // recalc élève + cours si contexte change
    useEffect(() => {
        const { idAnne, idSection, idOption, idClasse, idPeriode, idInscription } = formData;

        if (idAnne && idOption && idClasse) {
            loadEleves(idAnne, idOption, idClasse);
        }
        // if(idSection){
        //     loadOptionsBySection(idSection);
        // }

    }, [formData.idAnne, formData.idOption, formData.idClasse, formData.idPeriode, formData.idSection]);

    // ========================= Handlers =========================
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const openModal = () => {
        setFormData({});
        setIsEditing(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData({});
        setIsEditing(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const user = getUser();
            let svData = {
                ...formData,
                envoye_par: user?.name ?? ''
            }
            const res = await saveItem("/messages_scolaires/store", svData);
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
            const res = await fetchSigleItem<MessageScolaire[]>("/messages_scolaires/edit", id);
            const data = res && res.length ? res[0] : undefined;
            if (!data) {
                showErrorMessage("Message introuvable.");
                return;
            }
            setFormData(data);
            // Charger dépendances
            if (data.idSection) {
                await loadOptionsBySection(String(data.idSection));
            }
            if (data.idAnne && data.idOption && data.idClasse) {
                await loadEleves(data.idAnne, data.idOption, data.idClasse);
            }
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
            title: "Supprimer ce message ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });
        if (!confirmed) return;
        try {
            const res = await removeItem("/messages_scolaires/delete", id);
            showSuccessMessage(res);
            loadDatas();
        } catch (error) {
            showErrorMessage(error);
        }
    };

    const handleSendSms = async (id: number) => {
        try {
            const res = await fetchListItems(`/messages_scolaires/send/${id}`);
            showSuccessMessage(res);
            loadDatas();
        } catch (error) {
            showErrorMessage("Erreur lors de l’envoi du SMS.");
        }
    };


    // ========================= Envoi collectif de SMS =========================
    const handleSendCollectif = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.idAnne || !formData.idClasse || !formData.idOption || !formData.idPeriode) {
            showWarningMessage("Veuillez sélectionner l'année, la classe, l'option et la période avant d'envoyer les SMS.");
            return;
        }

        const confirmed = await showConfirmationDialog({
            title: "Envoyer les SMS de résultats ?",
            text: "Cette action va générer et envoyer les messages à tous les parents de la classe sélectionnée.",
            icon: "info",
            confirmButtonText: "Oui, envoyer",
        });
        if (!confirmed) return;

        setSending(true);
        try {
            const payload = {
                idAnne: formData.idAnne,
                idClasse: formData.idClasse,
                idOption: formData.idOption,
                idPeriode: formData.idPeriode,
            };

            const res = await saveItem("/messages_scolaires/envoyer_collectif", payload);
            showSuccessMessage(res);
            loadDatas();
        } catch (error) {
            console.error(error);
            showErrorMessage("Erreur lors de l'envoi collectif des SMS.");
        } finally {
            setSending(false);
        }
    };

    // ========================= Envoi collectif d’un communiqué =========================
    const handleSendCommunique = async () => {
        if (!formData.idAnne || !formData.idClasse || !formData.idOption || !formData.titre_message || !formData.contenu_message) {
            showWarningMessage("Veuillez renseigner l'année, la classe, l'option, le titre et le contenu du communiqué.");
            return;
        }

        const confirmed = await showConfirmationDialog({
            title: "Envoyer un communiqué collectif ?",
            text: "Ce communiqué sera envoyé à tous les parents des élèves de la classe sélectionnée.",
            icon: "info",
            confirmButtonText: "Oui, envoyer",
        });
        if (!confirmed) return;

        setSending(true);
        try {
            const payload = {
                idAnne: formData.idAnne,
                idClasse: formData.idClasse,
                idOption: formData.idOption,
                idPeriode: formData.idPeriode,
                titre_message: formData.titre_message,
                contenu_message: formData.contenu_message,
            };
            const res = await saveItem("/messages_scolaires/envoyer_communique", payload);
            showSuccessMessage(res);
            loadDatas();
        } catch (error) {
            console.error(error);
            showErrorMessage("Erreur lors de l'envoi du communiqué collectif.");
        } finally {
            setSending(false);
        }
    };

    const handleSendAll = async () => {
        const confirmed = await showConfirmationDialog({
            title: "Envoyer tous les messages non envoyés ?",
            text: "Cette action va tenter d’envoyer tous les SMS non encore envoyés.",
            icon: "question",
            confirmButtonText: "Oui, envoyer maintenant",
        });
        if (!confirmed) return;

        setSending(true);
        try {
            const res = await fetchListItems("/messages_scolaires/envoyer_tous");
            showSuccessMessage(res);
            loadDatas();
        } catch (error) {
            showErrorMessage("Erreur lors de l'envoi collectif des SMS.");
        } finally {
            setSending(false);
        }
    };

    // ========================= Envoi collectif SMS - Paiement =========================
    const handleSendPaiement = async () => {
        if (!formData.idAnne || !formData.idClasse || !formData.idOption) {
            showWarningMessage("Veuillez sélectionner l'année, la classe et l'option avant d'envoyer les SMS.");
            return;
        }

        const confirmed = await showConfirmationDialog({
            title: "Informer les parents des paiements ?",
            text: "Cette action va envoyer un SMS de paiement à tous les parents de la classe sélectionnée.",
            icon: "info",
            confirmButtonText: "Oui, envoyer",
        });
        if (!confirmed) return;

        setSending(true);
        try {
            const payload = {
                idAnne: formData.idAnne,
                idClasse: formData.idClasse,
                idOption: formData.idOption,
                idPeriode: formData.idPeriode,
            };

            const res = await saveItem("/messages_scolaires/envoyer_paiement_collectif", payload);
            showSuccessMessage(res);
            loadDatas();
        } catch (error) {
            console.error(error);
            showErrorMessage("Erreur lors de l'envoi collectif des SMS de paiements.");
        } finally {
            setSending(false);
        }
    };

    // ========================= Render =========================
    return (
        <div className="col-md-12">

           

            <h4 className="mb-3">
                <i className="fas fa-sms me-2 text-primary" />
                Gestion des messages scolaires (SMS)
            </h4>

            <LoaderAndError loading={loading} error={error} onClearError={() => setError(null)} />

            {/* Recherche */}
            <div className="d-flex justify-content-between mb-3">
                <div className="col-auto col-sm-4">
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



                <div className="justify-content-end">
                    <button
                        className="btn btn-success btn-sm me-1 mb-1"
                        onClick={handleSendAll}
                        disabled={sending}
                    >
                        {sending ? (
                            <>
                                <i className="fas fa-spinner fa-spin me-1"></i> Envoi en cours...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-paper-plane me-1"></i> Envoyer tous les SMS non envoyés
                            </>
                        )}
                    </button>

                    <button className="btn btn-primary btn-sm me-1 mb-1" onClick={openModal}>
                        <i className="fas fa-plus me-1" /> Nouveau message
                    </button>
                </div>
            </div>

            {/* message statistique */}
            <div className="alert alert-light border d-flex justify-content-between align-items-center mb-3">
                <div>
                    <b>Total messages :</b> {stats.total} <span className="mx-2">|</span>
                    <span className="text-success"><i className="fas fa-paper-plane"></i> Envoyés :</span> {stats.envoyes}
                    <span className="mx-2">|</span>
                    <span className="text-danger"><i className="fas fa-clock"></i> Non envoyés :</span> {stats.non_envoyes}
                </div>

                <button
                    className="btn btn-outline-success btn-sm"
                    onClick={() => loadStats()}
                    title="Actualiser les statistiques"
                >
                    <i className="fas fa-sync-alt"></i> Actualiser
                </button>
            </div>

            {/* Tableau */}
            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-striped align-middle">
                            <thead>
                                <tr>
                                    <th>Titre</th>
                                    <th>Type</th>
                                    <th>Numéro parent</th>
                                    <th>Statut</th>
                                    <th>Envoyé par</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datas.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-muted">
                                            Aucun message trouvé
                                        </td>
                                    </tr>
                                ) : (
                                    datas.map((row) => (
                                        <tr key={row.id}>
                                            <td>{row.titre_message}</td>
                                            <td>{row.type_message}</td>
                                            <td>{row.telephone_parent}</td>
                                            <td>
                                                {row.statut_envoi === "envoye" ? (
                                                    <span className="badge bg-success">
                                                        Envoyé
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-secondary">
                                                        Non envoyé
                                                    </span>
                                                )}
                                            </td>
                                            <td>{row.envoye_par}</td>
                                            <td>{formatDateFR(row.created_at || "")}</td>
                                            <td>
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
                                                        className="btn btn-success btn-sm me-1"
                                                        onClick={() => handleSendSms(row.id!)}
                                                        title="Envoyer le SMS"
                                                    >
                                                        <i className="fas fa-paper-plane" />
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
                title={isEditing ? "Modifier le message" : "Nouveau message scolaire"}
                show={showModal}
                onClose={closeModal}
                dimension="modal-lg"
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-lg-4 col-md-12 col-sm-12 c0l-xs-12 col-12">
                            <SelectPickerField
                                name="idAnne"
                                label="Année scolaire"
                                icon="fas fa-calendar"
                                options={anneeOptions}
                                value={String(formData.idAnne || '')}
                                onChange={(v) => handleSelectChange("idAnne", v)}
                            />
                        </div>
                        <div className="col-lg-4 col-md-12 col-sm-12 c0l-xs-12 col-12">
                            <SelectPickerField
                                name="idSection"
                                label="Section"
                                icon="fas fa-layer-group"
                                options={sectionOptions}
                                value={String(formData.idSection || '')}
                                onChange={(v) => handleSelectChange("idSection", v)}
                            />
                        </div>
                        <div className="col-lg-4 col-md-12 col-sm-12 c0l-xs-12 col-12">
                            <SelectPickerField
                                name="idOption"
                                label="Option"
                                icon="fas fa-list"
                                options={optionOptions}
                                value={String(formData.idOption || '')}
                                onChange={(v) => handleSelectChange("idOption", v)}
                            />
                        </div>
                        <div className="col-lg-6 col-md-12 col-sm-12 c0l-xs-12 col-12">
                            <SelectPickerField
                                name="idClasse"
                                label="Classe"
                                icon="fas fa-home"
                                options={classeOptions}
                                value={String(formData.idClasse || '')}
                                onChange={(v) => handleSelectChange("idClasse", v)}
                            />
                        </div>

                        <div className="col-lg-6 col-md-12 col-sm-12 c0l-xs-12 col-12">
                            <SelectPickerField
                                name="idPeriode"
                                label="Période"
                                icon="fas fa-clock"
                                options={periodeOptions}
                                value={String(formData.idPeriode || '')}
                                onChange={(v) => handleSelectChange("idPeriode", v)}
                            />
                        </div>
                        <div className="col-lg-12 col-md-12 col-sm-12 c0l-xs-12 col-12">
                            <SelectPickerField
                                name="idInscription"
                                label="Élève (facultatif)"
                                icon="fas fa-user-graduate"
                                options={eleveOptions}
                                value={String(formData.idInscription || '')}
                                onChange={(v) => handleSelectChange("idInscription", v)}
                            />
                        </div>

                        <div className="col-md-6">
                            <SelectPickerField
                                label="Type de message"
                                name="type_message"
                                icon="fas fa-tag"
                                value={formData.type_message ?? ""}
                                options={[
                                    { value: "information", label: "Information" },
                                    { value: "resultat", label: "Résultat" },
                                    { value: "presence", label: "Présence" },
                                    { value: "Mauvaise Conduite", label: "Mauvaise Conduite" },
                                ]}
                                onChange={(v) => setFormData((prev) => ({ ...prev, type_message: v }))}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <TextField
                                label="Numéro du parent"
                                name="telephone_parent"
                                value={formData.telephone_parent ?? ""}
                                onChange={handleInputChange}
                                icon="fas fa-phone"
                                placeholder="+243..."
                            />
                        </div>
                        <div className="col-md-12">
                            <TextField
                                label="Titre du message"
                                name="titre_message"
                                value={formData.titre_message ?? ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="col-md-12">
                            <textarea
                                name="contenu_message"
                                className="form-control"
                                rows={5}
                                placeholder="Contenu du message..."
                                value={formData.contenu_message ?? ""}
                                onChange={handleInputChange}
                                required
                            ></textarea>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end mt-3">

                        {formData.idAnne && formData.idClasse && formData.idOption && formData.idPeriode && (
                            <>

                                <a href="#"
                                    className="btn btn-success btn-sm me-1"
                                    onClick={handleSendCollectif}

                                >
                                    {sending ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin me-1"></i> Envoi en cours...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-bullhorn me-1"></i> Envoyer SMS Résultats
                                        </>
                                    )}
                                </a>

                                <a
                                    className="btn btn-warning btn-sm me-1"
                                    onClick={handleSendCommunique}

                                >
                                    {sending ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin me-1"></i> Envoi en cours...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-bullhorn me-1"></i> Envoyer un communiqué
                                        </>
                                    )}
                                </a>

                                <a
                                    className="btn btn-info btn-sm me-1"
                                    onClick={handleSendPaiement}

                                >
                                    {sending ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin me-1"></i> Envoi en cours...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-dollar-sign me-1"></i> Informer les parents (paiements)
                                        </>
                                    )}
                                </a>

                            </>
                        )}

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {isEditing ? "Modifier" : "Envoyer / Enregistrer"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
