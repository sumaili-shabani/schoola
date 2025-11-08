// src/pages/ecole/ProduitPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
    fetchItems,
    fetchListItems,
    fetchSigleItem,
    saveItem,
    removeItem,
    showConfirmationDialog,
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

interface Produit {
    id?: number;
    refCategorie?: number | string;
    designationCategorie?: string;
    designation?: string;
    pu?: number | string;
    qte_unite?: number | string;
    devise?: string;
    unite?: string;
    qte?: number | string;           // stock actuel (si retourné par l'API)
    author?: string;
    created_at?: string;
}

interface OptionItem {
    value: string;
    label: string;
}

// ========================= Component =========================

export default function ProduitPage() {
    // table
    const [datas, setDatas] = useState<Produit[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // form
    const [formData, setFormData] = useState<Partial<Produit>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // catégories
    const [categorieOptions, setCategorieOptions] = useState<OptionItem[]>([]);

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
            // Assure-toi que ton endpoint supporte page/limit/query comme les autres
            const res = await fetchItems<Produit>("/fetch_produit", {
                page: currentPage,
                limit,
                query: search,
            });
            setDatas(res.data || []);
            setTotalPages(res.lastPage || 1);
        } catch (e) {
            console.error(e);
            setError("Erreur lors du chargement des produits.");
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await fetchListItems("/fetch_categorie_produit_2");
            setCategorieOptions(
                (res?.data || []).map((c: any) => ({
                    value: String(c.id),
                    label: c.designation,
                }))
            );
        } catch (e) {
            setCategorieOptions([]);
            showErrorMessage("Erreur lors du chargement des catégories.");
        }
    };

    // ========================= Effects =========================

    useEffect(() => {
        loadCategories();
        loadDatas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        debounced(() => {
            setCurrentPage(1);
            loadDatas();
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    useEffect(() => {
        loadDatas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    // ========================= Handlers – Form =========================

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (field: keyof Produit, val: string) => {
        setFormData((prev) => ({ ...prev, [field]: val }));
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

        // validations simples
        if (!formData.designation) {
            showWarningMessage("La désignation est obligatoire.");
            return;
        }
        if (!formData.pu || Number(formData.pu) <= 0) {
            showWarningMessage("Le prix unitaire doit être supérieur à 0.");
            return;
        }
        if (!formData.devise) {
            showWarningMessage("Veuillez sélectionner la devise.");
            return;
        }
        if (!formData.unite) {
            showWarningMessage("Veuillez sélectionner l'unité.");
            return;
        }
        if (!formData.refCategorie) {
            showWarningMessage("Veuillez sélectionner une catégorie.");
            return;
        }

        const user = getUser();
        const payload: Partial<Produit> = {
            ...formData,
            author: user?.name || "Admin",
        };

        try {
            // Le code Vue utilise `/insert_produit` pour ajout ET modification
            // (logique d'upsert côté backend). On reproduit ce comportement.
            const res = await saveItem("/insert_produit", payload);
            showSuccessMessage(res);
            closeModal();
            loadDatas();
        } catch (err) {
            showWarningMessage(err);
        }
    };

    const handleEdit = async (id: number) => {
        try {
            setLoading(true);
            const res = await fetchSigleItem<Produit[]>("/fetch_single_produit", id);
            const data = res && res.length ? res[0] : undefined;
            if (!data) {
                showErrorMessage("Produit introuvable.");
                return;
            }

            setFormData({
                id: data.id,
                designation: data.designation,
                pu: data.pu,
                devise: data.devise,
                unite: data.unite,
                qte_unite: data.qte_unite,
                refCategorie: data.refCategorie,
            });

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
            title: "Supprimer ce produit ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });
        if (!confirmed) return;

        try {
            const res = await removeItem("/delete_produit", id);
            showSuccessMessage(res);
            loadDatas();
        } catch (err) {
            showErrorMessage(err);
        }
    };

    // ========================= Render =========================

    return (
        <div className="col-md-12">
            <h4 className="mb-3">Liste des produits (Fournitures scolaires)</h4>

            <LoaderAndError
                loading={loading}
                error={error}
                onClearError={() => setError(null)}
            />

            {/* Recherche + bouton Ajouter */}
            <div className="d-flex justify-content-between mb-3">
                <div className="col-auto col-sm-4">
                    <div className="input-group mb-2">
                        <button
                            className="btn btn-sm btn-primary me-1"
                            onClick={() => loadDatas()}
                        >
                            <i className="fas fa-sync" />
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
                    <i className="fas fa-plus me-1" />
                    Ajouter un produit
                </button>
            </div>

            {/* Tableau */}
            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-striped align-middle">
                            <thead>
                                <tr>
                                    <th>Désignation</th>
                                    <th>Catégorie</th>
                                    <th>PU</th>
                                    <th>Devise</th>
                                    <th>Qté stock</th>
                                    <th>Nbr/pièce paquet</th>
                                    <th>Unité</th>
                                    <th>Actions</th>
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
                                    datas.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.designation}</td>
                                            <td>{item.designationCategorie}</td>
                                            <td>{item.pu}</td>
                                            <td>{item.devise}</td>
                                            <td>{item.qte ?? "-"}</td>
                                            <td>{item.qte_unite}</td>
                                            <td>{item.unite}</td>
                                            <td>
                                                <div className="btn-group">
                                                    <button
                                                        className="btn btn-warning btn-sm me-1"
                                                        onClick={() => handleEdit(item.id!)}
                                                        title="Modifier"
                                                    >
                                                        <i className="fas fa-edit" />
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(item.id!)}
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

            {/* Modal Ajout / Édition */}
            <Modal
                title={isEditing ? "Modifier le produit" : "Ajouter un produit"}
                show={showModal}
                onClose={closeModal}
                dimension="modal-md"
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-12">
                            <TextField
                                label="Désignation"
                                name="designation"
                                value={formData.designation || ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <TextField
                                label="Prix unitaire"
                                name="pu"
                                type="number"
                                value={formData.pu !== undefined ? String(formData.pu) : ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <SelectPickerField
                                label="Devise"
                                name="devise"
                                options={[
                                    { value: "USD", label: "USD" },
                                    { value: "FC", label: "FC" },
                                ]}
                                value={formData.devise || ""}
                                required
                                onChange={(v) => handleSelectChange("devise", v)}
                            />
                        </div>

                        <div className="col-md-6">
                            <TextField
                                label="Nombre de pièces par paquet"
                                name="qte_unite"
                                type="number"
                                value={
                                    formData.qte_unite !== undefined
                                        ? String(formData.qte_unite)
                                        : ""
                                }
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <SelectPickerField
                                label="Unité"
                                name="unite"
                                options={[
                                    { value: "Par Pièce", label: "Pièce" },
                                    { value: "Par Boîte", label: "Boîte" },
                                    { value: "Par Carton", label: "Carton" },
                                    { value: "Par Paquet", label: "Paquet" },
                                    { value: "Par Lot", label: "Lot" },
                                    { value: "Par Bouteille", label: "Bouteille" },
                                    { value: "Par Sachet", label: "Sachet" },
                                    { value: "Par Sac", label: "Sac" },
                                    { value: "Par Kilo", label: "Kilogramme (Kg)" },
                                    { value: "Par g", label: "Gramme (g)" },
                                    { value: "Par L", label: "Litre (L)" },
                                    { value: "Par m", label: "Mètre (m)" },
                                    { value: "Par m²", label: "Mètre carré (m²)" },
                                    { value: "Par m³", label: "Mètre cube (m³)" },
                                    { value: "Par Douzaine", label: "Douzaine" },
                                    { value: "Par Unité", label: "Unité" },
                                    { value: "Par Baril", label: "Baril" },
                                    { value: "Par Bidon", label: "Bidon" },
                                    { value: "Par Tonne", label: "Tonne" },
                                    { value: "Par Rouleau", label: "Rouleau" },
                                    { value: "Par Heure", label: "Heure" },
                                    { value: "Par Jour", label: "Jour" },
                                    { value: "Par Mois", label: "Mois" },
                                ]}
                                value={formData.unite || ""}
                                required
                                onChange={(v) => handleSelectChange("unite", v)}
                            />
                        </div>

                        <div className="col-md-12">
                            <SelectPickerField
                                label="Catégorie"
                                name="refCategorie"
                                value={
                                    formData.refCategorie
                                        ? String(formData.refCategorie)
                                        : ""
                                }
                                options={categorieOptions}
                                required
                                onChange={(v) => handleSelectChange("refCategorie", v)}
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
        </div>
    );
}
