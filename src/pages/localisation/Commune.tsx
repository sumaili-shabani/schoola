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

/* ===============================
   🔹 INTERFACES TYPES
   =============================== */
interface Entity {
    id?: number;
    // Remplace les champs ci-dessous selon ta table
    idPays?:number | string,
    idProvince?:number | string,
    idVille?:number | string,
    nomProvince?:string,
    nomVille?: string,
    nomCommune?:string,
    created_at?: string;
}

interface Option {
    value: string;
    label: string;
}

/* ===============================
   🔹 COMPOSANT PRINCIPAL
   =============================== */
export default function Commune() {
    // ---- ÉTATS ----
    const [datas, setDatas] = useState<Entity[]>([]);
    const [formData, setFormData] = useState<Partial<Entity>>({});
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string | null>(null);

    // ---- EXEMPLE DE DROPDOWN ----
    const [options, setOptions] = useState<Option[]>([]);
    // ---- DROPDOWNS ----
    const [paysOptions, setPaysOptions] = useState<Option[]>([]);
    const [provinceOptions, setProvinceOptions] = useState<Option[]>([]);
    const [villeOptions, setVilleOptions] = useState<Option[]>([]);

    // ---- PAGINATION ----
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } =
        usePagination({
            currentPage,
            totalPages,
        });

    // ---- DEBOUNCE RECHERCHE ----
    const debounce = useMemo(() => {
        let timer: any;
        return (fn: () => void) => {
            clearTimeout(timer);
            timer = setTimeout(fn, 350);
        };
    }, []);

    // -------- LOGIQUE DES SELECTS --------
    const handleSelectChange = async (field: string, val: string) => {
        setFormData((prev) => ({ ...prev, [field]: val }));

        if (field === "idPays") {
            setProvinceOptions([]);
            setVilleOptions([]);
            await loadProvince(val);
        }

        if (field === "idProvince") {
            setVilleOptions([]);
            await loadVille(val);
        }

       
    };

    /* ===============================
       🔹 CHARGEMENT DES DONNÉES
       =============================== */

    const loadOptions = async () => {
        try {
            const res = await fetchListItems("/fetch_options_endpoint");
            setOptions(
                res?.data?.map((x: any) => ({
                    value: String(x.id),
                    label: x.nom, // adapte le champ selon la table
                })) || []
            );
        } catch {
            showErrorMessage("Erreur de chargement des options");
        }
    };

    const loadPays = async () => {
        try {
            const res = await fetchListItems("/fetch_pays_2");
            setPaysOptions(
                res?.data?.map((x: any) => ({
                    value: String(x.id),
                    label: x.nomPays,
                })) || []
            );
        } catch {
            showErrorMessage("Erreur lors du chargement des pays");
        }
    };

    const loadProvince = async (idPays: string | number) => {
        try {
            const res = await fetchListItems(`/fetch_province_tug_pays/${idPays}`);
            setProvinceOptions(
                res?.data?.map((p: any) => ({
                    value: String(p.id),
                    label: p.nomProvince,
                })) || []
            );
        } catch {
            setProvinceOptions([]);
        }
    };

    const loadVille = async (idProvince: string | number) => {
        try {
            const res = await fetchListItems(`/fetch_ville_tug_pays/${idProvince}`);
            setVilleOptions(
                res?.data?.map((v: any) => ({
                    value: String(v.id),
                    label: v.nomVille,
                })) || []
            );
        } catch {
            setVilleOptions([]);
        }
    };

    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<Entity>("/fetch_commune", {
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

    /* ===============================
       🔹 AJOUT / MODIFICATION
       =============================== */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation simple
        if (!formData.nomCommune || !formData.idVille || !formData.idProvince) {
            showErrorMessage("Veuillez remplir les champs requis");
            return;
        }

        const payload = { ...formData, id: formData.id ?? "" };
        const res = await saveItem("/insert_commune", payload);

        showSuccessMessage(res);
        setShowModal(false);
        setFormData({});
        setIsEditing(false);
        loadDatas();
    };

    /* ===============================
       🔹 ÉDITION
       =============================== */
    const handleEdit = async (id: number) => {
        setLoading(true);
        const res = await fetchSigleItem<Entity>("/fetch_single_commune", id);
        const data = Array.isArray(res) && res.length ? res[0] : undefined;
        if (!data) {
            setError("Enregistrement introuvable");
            setLoading(false);
            return;
        }
        
        setFormData(data);
        setIsEditing(true);
        setShowModal(true);
        // autre chargement dynamique
        await loadProvince(data.idPays ?? "");
        await loadVille(data.idProvince ?? "");


        setLoading(false);
    };

    /* ===============================
       🔹 SUPPRESSION
       =============================== */
    const handleDelete = async (id: number) => {
        const confirm = await showConfirmationDialog({
            title: "Supprimer ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });

        if (!confirm) return;
        const res = await removeItem("/delete_commune", id);
        showSuccessMessage(res);
        loadDatas();
    };

    /* ===============================
       🔹 CYCLES DE VIE
       =============================== */
    useEffect(() => {
        loadDatas();
        loadPays();
        // loadOptions();
    }, [currentPage]);

    useEffect(() => {
        debounce(() => {
            setCurrentPage(1);
            loadDatas();
        });
    }, [search]);

    /* ===============================
       🔹 UI
       =============================== */
    const openModal = () => {
        setFormData({});
        setIsEditing(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setIsEditing(false);
        setShowModal(false);
    };

    return (
        <div className="col-md-12">
            <h4>Gestion des communes</h4>

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
                            id="btn-refresh"
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

            {/* Tableau de données */}
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Nom de la province</th>
                        <th>Nom de la ville</th>
                        <th>Nom de la Commune</th>
                        <th>Date création</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {datas.map((d) => (
                        <tr key={d.id}>
                            <td>{ d.nomProvince }</td>
                            <td>{ d.nomVille }</td>
                            <td>{ d.nomCommune }</td>
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

            {/* Modal d'ajout / édition */}
            <Modal
                title={isEditing ? "Modifier l'entité" : "Ajouter une entité"}
                show={showModal}
                onClose={closeModal}
            >
                <form onSubmit={handleSubmit}>
                    <div className="col-md-12">
                        <SelectPickerField
                            label="Pays"
                            name="idPays"
                            icon="fas fa-flag"
                            value={formData.idPays ? String(formData.idPays) : ""}
                            options={paysOptions}
                            required
                            onChange={(v) => handleSelectChange("idPays", v)}
                        />

                        <SelectPickerField
                            label="Province"
                            name="idProvince"
                            icon="fas fa-map"
                            value={formData.idProvince ? String(formData.idProvince) : ""}
                            options={provinceOptions}
                            required
                            onChange={(v) => handleSelectChange("idProvince", v)}
                        />

                        <SelectPickerField
                            label="Ville"
                            name="idVille"
                            icon="fas fa-city"
                            value={formData.idVille ? String(formData.idVille) : ""}
                            options={villeOptions}
                            required
                            onChange={(v) => handleSelectChange("idVille", v)}
                        />
                    </div>

                    <TextField
                        name="nomCommune"
                        label="Commune"
                        value={formData.nomCommune ?? ""}
                        onChange={(e) =>
                            setFormData({ ...formData, nomCommune: e.target.value })
                        }
                        required
                        icon="fas fa-pen"
                    />

                   

                    <button className="btn btn-primary w-100 mt-2">
                        {isEditing ? "Modifier" : "Ajouter"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
