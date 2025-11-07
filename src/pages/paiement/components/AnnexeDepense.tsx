import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    fetchItems,
    fetchListItems,
    fetchSigleItem,
    saveItem,
    removeItem,
    saveItemImageForm,
} from "../../../api/callApi";
import {
    fileUrl,
    getUser,
    showErrorMessage,
    showSuccessMessage,
    showWarningMessage,
} from "../../../api/config";
import { usePagination } from "../../../hooks/usePagination";
import { Modal, Pagination, TextField } from "../../../components";
import LoadingSpinner from "../../../components/LoadingSpinner";

interface AnnexeRow {
    id?: number;
    codeOperation?: string; // de la recette
    montant?: number | string;
    noms_annexe?: string;
    annexe?: string; // filename
    refDepense?: number | string;
    author?: string;
    created_at?: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    refDepense: number;
    title?: string;
}

export default function AnnexeDepense({ open, onClose, refDepense, title }: Props) {
    const [loading, setLoading] = useState(false);
    const [fetchData, setFetchData] = useState<AnnexeRow[]>([]);
    const [error, setError] = useState<string | null>(null);

    // pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } =
        usePagination({ currentPage, totalPages });

    // form
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<AnnexeRow>>({
        noms_annexe: "",
    });
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [search, setSearch] = useState("");

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
        if (!refDepense) return;
        setLoading(true);
        try {
            const endpoint = `/fetch_annexe_bydepense/${refDepense}`;
            const res = await fetchItems<AnnexeRow>(endpoint, {
                page: currentPage,
                limit,
                query: search,
            });
            setFetchData(res.data);
            setTotalPages(res.lastPage);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            setCurrentPage(1);
            loadDatas();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, refDepense]);

    useEffect(() => {
        if (!open) return;
        debounced(() => {
            setCurrentPage(1);
            loadDatas();
        });
    }, [search]); // eslint-disable-line

    useEffect(() => {
        if (!open) return;
        loadDatas();
    }, [currentPage]); // eslint-disable-line

    // ========================= Handlers =========================
    const openInnerModal = () => {
        setFormData({ noms_annexe: "" });
        setFile(null);
        setIsEditing(false);
        setShowModal(true);
    };

    const closeInnerModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setFormData({ noms_annexe: "" });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, files } = e.target as HTMLInputElement;
        if (name === "annexe" && files && files[0]) {
            setFile(files[0]);
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file && !isEditing) {
            showWarningMessage("Veuillez sélectionner un fichier.");
            return;
        }
        if (!formData.noms_annexe || String(formData.noms_annexe).trim() === "") {
            showWarningMessage("La désignation est requise.");
            return;
        }
        const user = getUser();

        // Construire FormData multipart
        const payload = new FormData();
        const meta = {
            ...(isEditing ? { id: formData.id } : {}),
            noms_annexe: formData.noms_annexe,
            refDepense: refDepense,
            author: user?.name ?? "Admin",
        };

        payload.append("data", JSON.stringify(meta));
        if (file) payload.append("image", file);

        try {
            if (isEditing) {
                const res = await saveItemImageForm("/update_depense_annexe", payload);
                showSuccessMessage(res.data);
            } else {
                const res = await saveItemImageForm("/insert_depense_annexe", payload);
                showSuccessMessage(res.data);
            }
            closeInnerModal();
            loadDatas();
        } catch (err) {
            showErrorMessage("Erreur lors de l’envoi du fichier.");
            console.error(err);
        }
    };

    const handleEdit = async (id: number) => {
        try {
            setLoading(true);
            const res = await fetchSigleItem<AnnexeRow[]>("/fetch_single_depense_annexe", id);
            const data = res && res.length ? res[0] : undefined;
            if (!data) {
                showErrorMessage("Annexe introuvable.");
                return;
            }
            setFormData({
                id: data.id,
                noms_annexe: data.noms_annexe ?? "",
            });
            setFile(null);
            setIsEditing(true);
            setShowModal(true);
        } catch (e) {
            showErrorMessage(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = await (async () =>
            // on réutilise le helper confirm côté parent ? Ici, fallback simple :
            window.confirm("Supprimer cette annexe ?"))();
        if (!confirmed) return;
        try {
            const res = await removeItem("/delete_depense_annexe", id);
            showSuccessMessage(res);
            loadDatas();
        } catch (e) {
            showErrorMessage(e);
        }
    };

    const openAnnexeFile = (filename?: string) => {
        if (!filename) return;
        const url = `${fileUrl}/downloadfile/${filename}`;
        window.open(url, "_blank");
    };

    // ========================= Render =========================
    return (
        <Modal
            title={title ?? "Documents en annexe"}
            show={open}
            onClose={onClose}
            dimension="modal-xxl"
        >
            {/* Barre outils */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="col-auto col-sm-6">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Recherche..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button className="btn btn-primary btn-sm" onClick={openInnerModal}>
                    <i className="fas fa-plus me-1" /> Ajouter une annexe
                </button>
            </div>

            <LoadingSpinner loading={loading} />
            {error && <div className="alert alert-danger py-2">{error}</div>}

            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-striped align-middle">
                            <thead>
                                <tr>
                                    <th>N° Opération</th>
                                    <th>Montant</th>
                                    <th>Désignation</th>
                                    <th>Fichier</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fetchData.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center text-muted">
                                            Aucune annexe
                                        </td>
                                    </tr>
                                ) : (
                                    fetchData.map((row) => (
                                        <tr key={row.id}>
                                            <td>{row.codeOperation}</td>
                                            <td>{row.montant}$</td>
                                            <td>{row.noms_annexe}</td>
                                            <td>{row.annexe}</td>
                                            <td>
                                                <div className="btn-group">
                                                    <button
                                                        className="btn btn-secondary btn-sm me-1"
                                                        onClick={() => openAnnexeFile(row.annexe)}
                                                        title="Voir / Télécharger"
                                                    >
                                                        <i className="fas fa-file" />
                                                    </button>
                                                    {/* <button
                                                        className="btn btn-warning btn-sm me-1"
                                                        onClick={() => handleEdit(row.id!)}
                                                        title="Modifier"
                                                    >
                                                        <i className="fas fa-edit" />
                                                    </button> */}
                                                    <button
                                                        className="btn btn-danger btn-sm"
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

            {/* Modal interne: Ajout / Édition Annexe */}
            <Modal
                title={isEditing ? "Modifier l'annexe" : "Ajouter une annexe"}
                show={showModal}
                onClose={closeInnerModal}
                dimension="modal-sm"
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-12">
                            <TextField
                                label="Désignation"
                                name="noms_annexe"
                                value={formData.noms_annexe || ""}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, noms_annexe: e.target.value }))
                                }
                                required
                            />
                        </div>

                        <div className="col-md-12">
                            <label className="form-label">Fichier (image/PDF)</label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                name="annexe"
                                className="form-control"
                                accept="image/*,.pdf"
                                onChange={handleInputChange}
                                {...(!isEditing ? { required: true } : {})}
                            />
                            <small className="text-muted">
                                Formats acceptés: images ou PDF.
                            </small>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end mt-3">
                        <button type="button" className="btn btn-outline-secondary me-2" onClick={closeInnerModal}>
                            Fermer
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {isEditing ? "Modifier" : "Ajouter"}
                        </button>
                    </div>
                </form>
            </Modal>
        </Modal>
    );
}
