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

// ========================= Types =========================
interface Presence {
    id?: number;
    idInscription?: number | string;
    mouvement?: "Arrivé" | "Sortie" | string;
    statut_presence?: "Présent(e)" | "Absent(e)" | "Excusé(e)" | string;
    date_entree?: string;
    date_sortie?: string;
    motif?: string;

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
    designation?: string; // année
    date1?: string | null; // entrée
    date2?: string | null; // sortie

    created_at?: string;
}

interface OptionItem {
    value: string;
    label: string;
}

// ========================= Component =========================
export default function PresencePage() {
    // table
    const [datas, setDatas] = useState<Presence[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // form
    const [formData, setFormData] = useState<Partial<Presence>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // select options
    const [eleveInscritOptions, setEleveInscritOptions] = useState<OptionItem[]>([]);

    // pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } =
        usePagination({ currentPage, totalPages });

    // QR Code modal (placeholder)
    const [showQrModal, setShowQrModal] = useState(false);

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
            const res = await fetchItems<Presence>("/fetch_presence", {
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

    const loadEleveInscrits = async () => {
        try {
            // adapte si ton endpoint est différent
            const res = await fetchListItems("/getListEleveInscrits");
            setEleveInscritOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.id),
                    label: `${x.nomEleve} ${x.postNomEleve ?? ""} — ${x.nomSection ?? ""}/${x.nomOption ?? ""}/${x.nomClasse ?? ""}/${x.nomDivision ?? ""} • ${x.designation ?? ""} • ${x.sexeEleve ?? "-"}/${x.ageEleve ?? "-"} ans`.trim(),
                }))
            );
        } catch {
            setEleveInscritOptions([]);
        }
    };

    // ========================= Effects =========================
    useEffect(() => {
        loadEleveInscrits();
        loadDatas();
    }, []); // init

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

        // validation rapide
        if (!formData.idInscription) {
            showWarningMessage("Sélectionne l'élève (inscription).");
            return;
        }
        if (!formData.mouvement) {
            showWarningMessage("Sélectionne le mouvement.");
            return;
        }
        if (!formData.statut_presence) {
            showWarningMessage("Sélectionne le statut de présence.");
            return;
        }
        if (formData.mouvement === "Arrivé" && !formData.date_entree) {
            showWarningMessage("Renseigne la date d'entrée.");
            return;
        }
        if (formData.mouvement === "Sortie" && !formData.date_sortie) {
            showWarningMessage("Renseigne la date de sortie.");
            return;
        }

        try {
            const res = await saveItem("/insert_presence", formData);
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
            const res = await fetchSigleItem<Presence[]>("/fetch_single_presence", id);
            const data = res && res.length ? res[0] : undefined;
            if (!data) {
                showErrorMessage("Présence introuvable.");
                return;
            }
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
            title: "Supprimer cette présence ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });
        if (!confirmed) return;
        try {
            const res = await removeItem("/delete_presence", id);
            showSuccessMessage(res);
            loadDatas();
        } catch (error) {
            showErrorMessage(error);
        }
    };

    // ========================= QR Code =========================
    const addPresenceByQrcode = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const formatted = `${yyyy}-${mm}-${dd}`;

        // préremplir valeurs par défaut comme côté Vue
        setFormData((prev) => ({
            ...prev,
            date_entree: formatted,
            date_sortie: formatted,
            mouvement: "Arrivé",
            statut_presence: "Présent(e)",
        }));
        setShowQrModal(true);
    };

    // ========================= Render =========================
    return (
        <div className="col-md-12">
            <h4 className="mb-1">Liste de présence</h4>
            <p className="text-muted mb-3">Gérez les opérations</p>

            <LoaderAndError loading={loading} error={error} onClearError={() => setError(null)} />

            {/* Barre d'outils */}
            <div className="d-flex justify-content-between mb-3">
                <div className="col-auto col-sm-6">
                    <div className="input-group mb-2">
                        <button className="btn btn-sm btn-warning me-1" onClick={() => loadDatas()} title="Initialiser">
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

                <div className="d-flex gap-2">
                    <button className="btn btn-outline-secondary btn-sm" onClick={addPresenceByQrcode} title="Présence par Code QR">
                        <i className="fas fa-qrcode me-1" />
                        QR Code
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={openModal}>
                        <i className="fas fa-plus me-1" /> Ajouter
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
                                    <th>Photo</th>
                                    <th>Nom complet</th>
                                    <th>Sexe / Âge</th>
                                    <th>Section / Option</th>
                                    <th>Classe</th>
                                    <th>Division</th>
                                    <th>Mouvement</th>
                                    <th>Date</th>
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
                                            </td>
                                            <td>{row.nomClasse}</td>
                                            <td>{row.nomDivision}</td>
                                            <td>
                                                {row.mouvement} / {row.statut_presence}
                                            </td>
                                            <td>
                                                {row.date1 ? (
                                                    <div>
                                                        Arrivé: {formatDateFR(row.date1)} {extractTime(row.date1)}
                                                    </div>
                                                ) : null}
                                                {row.date2 ? (
                                                    <div>
                                                        Sortie: {formatDateFR(row.date2)} {extractTime(row.date2)}
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td>
                                                {formatDateFR(row.created_at || "")} {extractTime(row.created_at || "")}
                                            </td>
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
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
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
                </div>
            </div>

            {/* Modal Ajout/Édition */}
            <Modal
                title={isEditing ? "Modifier la présence" : "Ajouter la présence"}
                show={showModal}
                onClose={closeModal}
                dimension="modal-lg"
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        {/* Élève (inscription) */}
                        <div className="col-md-12">
                            <SelectPickerField
                                label="Sélectionner l'élève (inscription)"
                                name="idInscription"
                                icon="fas fa-user"
                                value={formData.idInscription ? String(formData.idInscription) : ""}
                                options={eleveInscritOptions}
                                required
                                onChange={(v) => setFormData((prev) => ({ ...prev, idInscription: v }))}
                            />
                        </div>

                        {/* Mouvement */}
                        <div className="col-md-6">
                            <SelectPickerField
                                label="Mouvement"
                                name="mouvement"
                                icon="fas fa-exchange-alt"
                                value={formData.mouvement ? String(formData.mouvement) : ""}
                                options={[
                                    { value: "Arrivé", label: "Arrivé" },
                                    { value: "Sortie", label: "Sortie" },
                                ]}
                                required
                                onChange={(v) => setFormData((prev) => ({ ...prev, mouvement: v }))}
                            />
                        </div>

                        {/* Statut présence */}
                        <div className="col-md-6">
                            <SelectPickerField
                                label="Statut de la présence"
                                name="statut_presence"
                                icon="fas fa-check-circle"
                                value={formData.statut_presence ? String(formData.statut_presence) : ""}
                                options={[
                                    { value: "Présent(e)", label: "Présent(e)" },
                                    { value: "Absent(e)", label: "Absent(e)" },
                                    { value: "Excusé(e)", label: "Excusé(e)" },
                                ]}
                                required
                                onChange={(v) => setFormData((prev) => ({ ...prev, statut_presence: v }))}
                            />
                        </div>

                        {/* Dates conditionnelles */}
                        {formData.mouvement === "Arrivé" && (
                            <div className="col-md-6">
                                <TextField
                                    label="Date d'entrée"
                                    name="date_entree"
                                    type="date"
                                    value={formData.date_entree || ""}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        )}
                        {formData.mouvement === "Sortie" && (
                            <div className="col-md-6">
                                <TextField
                                    label="Date de sortie"
                                    name="date_sortie"
                                    type="date"
                                    value={formData.date_sortie || ""}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        )}

                        {/* Motif si excusé */}
                        {formData.statut_presence === "Excusé(e)" && (
                            <div className="col-md-12">
                                <TextField
                                    label="Motif d'excuse"
                                    name="motif"
                                    type="text"
                                    value={formData.motif || ""}
                                    onChange={handleInputChange}
                                />
                            </div>
                        )}
                    </div>

                    <div className="d-flex justify-content-end mt-3">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {isEditing ? "Modifier" : "Ajouter"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal QR Code (placeholder d’intégration scanner) */}
            <Modal
                title="Présence par QR Code"
                show={showQrModal}
                onClose={() => setShowQrModal(false)}
                dimension="modal-md"
            >
                <div className="mb-3">
                    <p className="text-muted">
                        Intègre ici ton composant de scan (<code>QrReader</code>), ou ouvre une page dédiée.
                    </p>
                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => window.open(`${fileUrl}/qr_presence`, "_blank")}
                        >
                            Ouvrir le scanner dans une page
                        </button>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                                // si tu remplis formData via scanner, tu peux soumettre ici
                                setShowQrModal(false);
                                setShowModal(true);
                            }}
                        >
                            Utiliser ces valeurs et continuer
                        </button>
                    </div>
                    <hr />
                    <div className="row">
                        <div className="col-6">
                            <TextField
                                label="Date d'entrée"
                                name="date_entree"
                                type="date"
                                value={formData.date_entree || ""}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="col-6">
                            <TextField
                                label="Date de sortie"
                                name="date_sortie"
                                type="date"
                                value={formData.date_sortie || ""}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
