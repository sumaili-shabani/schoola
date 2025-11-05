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

interface Quartier {
    id?: number;
    idPays?: string | number;
    idProvince?: string | number;
    idVille?: string | number;
    idCommune?: string | number;
    nomQuartier?: string;
    nomPays?: string;
    nomCommune?: string;
    nomVille?: string;
    nomProvince?: string;
    created_at?: string;
}

interface Option {
    value: string;
    label: string;
}

export default function QuartierPage() {
    // ---- ÉTATS ----
    const [datas, setDatas] = useState<Quartier[]>([]);
    const [formData, setFormData] = useState<Partial<Quartier>>({});
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string | null>(null);

    // ---- DROPDOWNS ----
    const [paysOptions, setPaysOptions] = useState<Option[]>([]);
    const [provinceOptions, setProvinceOptions] = useState<Option[]>([]);
    const [villeOptions, setVilleOptions] = useState<Option[]>([]);
    const [communeOptions, setCommuneOptions] = useState<Option[]>([]);

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

    // -------- CHARGEMENT DES DONNÉES --------
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

    const loadCommune = async (idVille: string | number) => {
        try {
            const res = await fetchListItems(`/fetch_commune_tug_ville/${idVille}`);
            setCommuneOptions(
                res?.data?.map((c: any) => ({
                    value: String(c.id),
                    label: c.nomCommune,
                })) || []
            );
        } catch {
            setCommuneOptions([]);
        }
    };

    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<Quartier>("/fetch_quartier", {
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

    // -------- SUBMIT --------
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (
            !formData.idPays ||
            !formData.idProvince ||
            !formData.idVille ||
            !formData.idCommune ||
            !formData.nomQuartier
        ) {
            showErrorMessage("Veuillez remplir tous les champs obligatoires");
            return;
        }

        const payload = { ...formData, id: formData.id ?? "" };
        const res = await saveItem("/insert_quartier", payload);

        showSuccessMessage(res);
        setShowModal(false);
        setFormData({});
        setIsEditing(false);
        loadDatas();
    };

    // -------- ÉDITION --------
    const handleEdit = async (id: number) => {
        setLoading(true);
        const res = await fetchSigleItem<Quartier>("/fetch_single_quartier", id);
        const data = Array.isArray(res) && res.length ? res[0] : undefined;
        if (!data) {
            setError("Quartier introuvable.");
            setLoading(false);
            return;
        }

        setFormData(data);
        setIsEditing(true);
        setShowModal(true);

        await loadProvince(data.idPays ?? "");
        await loadVille(data.idProvince ?? "");
        await loadCommune(data.idVille ?? "");
        setLoading(false);
    };

    // -------- SUPPRESSION --------
    const handleDelete = async (id: number) => {
        const confirm = await showConfirmationDialog({
            title: "Supprimer ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });

        if (!confirm) return;
        const res = await removeItem("/delete_quartier", id);
        showSuccessMessage(res);
        loadDatas();
    };

    // -------- CHARGEMENTS INITIAUX --------
    useEffect(() => {
        loadPays();
    }, []);

    useEffect(() => {
        loadDatas();
    }, [currentPage]);

    useEffect(() => {
        debounce(() => {
            setCurrentPage(1);
            loadDatas();
        });
    }, [search]);

    // -------- LOGIQUE DES SELECTS --------
    const handleSelectChange = async (field: string, val: string) => {
        setFormData((prev) => ({ ...prev, [field]: val }));

        if (field === "idPays") {
            setProvinceOptions([]);
            setVilleOptions([]);
            setCommuneOptions([]);
            await loadProvince(val);
        }

        if (field === "idProvince") {
            setVilleOptions([]);
            setCommuneOptions([]);
            await loadVille(val);
        }

        if (field === "idVille") {
            setCommuneOptions([]);
            await loadCommune(val);
        }
    };

    // -------- MODAL HANDLERS --------
    const openModal = () => {
        setFormData({});
        setIsEditing(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setIsEditing(false);
        setShowModal(false);
    };

    // -------- RENDU --------
    return (
        <div className="col-md-12">
            <h4>Liste des Quartiers</h4>

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

            {/* Table */}
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Nom du quartier</th>
                        <th>Province</th>
                        <th>Ville</th>
                        <th>Commune</th>
                        <th>Date création</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {datas.map((d) => (
                        <tr key={d.id}>
                            <td>{d.nomQuartier}</td>
                            <td>{d.nomProvince}</td>
                            <td>{d.nomVille}</td>
                            <td>{d.nomCommune}</td>
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

            {/* Modal */}
            <Modal
                title={isEditing ? "Modifier Quartier" : "Ajouter Quartier"}
                show={showModal}
                onClose={closeModal}
            >
                <form onSubmit={handleSubmit}>
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

                    <SelectPickerField
                        label="Commune"
                        name="idCommune"
                        icon="fas fa-map-pin"
                        value={formData.idCommune ? String(formData.idCommune) : ""}
                        options={communeOptions}
                        required
                        onChange={(v) => handleSelectChange("idCommune", v)}
                    />

                    <TextField
                        name="nomQuartier"
                        label="Nom Quartier"
                        value={formData.nomQuartier ?? ""}
                        onChange={(e) =>
                            setFormData({ ...formData, nomQuartier: e.target.value })
                        }
                        required
                        icon="fas fa-home"
                    />

                    <button className="btn btn-primary w-100 mt-2">
                        {isEditing ? "Modifier" : "Ajouter"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
