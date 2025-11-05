import React, { useEffect, useMemo, useState } from "react";
import {
    fetchItems,
    fetchSigleItem,
    fetchListItems,
    saveItem,
    removeItem,
    extractTime,
    formatDateFR,
    showConfirmationDialog,
} from "../../api/callApi";
import { showErrorMessage, showSuccessMessage } from "../../api/config";
import { usePagination } from "../../hooks/usePagination";
import {ComboBox, LoaderAndError, Modal, Pagination, SelectPickerField, TextField } from "../../components";
import LoadingSpinner from "../../components/LoadingSpinner";

// ---- Types ----
interface Pays {
    id: number | string;
    nomPays: string;
}
interface Province {
    id?: number;
    idPays?: number | string;
    nomProvince?: string;
    nomPays?: string;      // côté table (jointure) si retourné par l’API
    created_at?: string;
}

export default function ProvincePage() {
    // ---- États UI ----
    const [datas, setDatas] = useState<Province[]>([]);
    const [formData, setFormData] = useState<Partial<Province>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const [paysOptions, setPaysOptions] = useState([]);

    // ---- Pagination util ----
    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } = usePagination({
        currentPage,
        totalPages,
    });

    // ---- Debounce simple sur la recherche ----
    const debouncedSearch = useMemo(() => {
        let t: any;
        return (value: string, cb: () => void) => {
            clearTimeout(t);
            t = setTimeout(cb, 300);
        };
    }, []);

    // ---- Chargement Pays ----
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
   

    // ---- Chargement Provinces (liste paginée) ----
    const loadDatas = async () => {
        try {
            setLoading(true);
            const res = await fetchItems<Province>("/fetch_province", {
                page: currentPage,
                limit,
                query: search,
            });
            setDatas(res.data);
            setTotalPages(res.lastPage);
        } catch (e: any) {
            setError("Erreur lors du chargement des provinces.");
        } finally {
            setLoading(false);
        }
    };

    // ---- Effets ----
    useEffect(() => {
        loadPays();
    }, []);

    useEffect(() => {
        // debounce la recherche
        debouncedSearch(search, () => {
            setCurrentPage(1);
            loadDatas();
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    useEffect(() => {
        loadDatas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, limit]);

    // ---- Actions ----
    const handleOpenCreate = () => {
        setFormData({});
        setIsEditing(false);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.idPays || !formData.nomProvince) {
            showErrorMessage("Veuillez renseigner le pays et le nom de la province.");
            return;
        }
        try {
            setLoading(true);
            const payload = {
                id: formData.id ?? "",
                idPays: formData.idPays,
                nomProvince: formData.nomProvince,
            };
            const res = await saveItem("/insert_province", payload);
            showSuccessMessage(res);
            setShowModal(false);
            setFormData({});
            setIsEditing(false);
            loadDatas();
        } catch (e: any) {
            showErrorMessage("Échec de l’enregistrement.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (id: number) => {
        try {
            setLoading(true);
            const arr = await fetchSigleItem<Province[]>("/fetch_single_province", id);
            const data = Array.isArray(arr) && arr.length ? arr[0] : undefined;
            if (!data) {
                setError("Province introuvable.");
                return;
            }
            setFormData(data);
           
            setIsEditing(true);
            setShowModal(true);
        } catch (e: any) {
            showErrorMessage("Erreur lors du chargement de la province.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = await showConfirmationDialog({
            title: "Supprimer cette province ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });
        if (!confirmed) return;

        try {
            setLoading(true);
            const res = await removeItem("/delete_province", id);
            showSuccessMessage(res);
            loadDatas();
        } catch (e: any) {
            showErrorMessage("Suppression impossible.");
        } finally {
            setLoading(false);
        }
    };

    // ---- Handlers formulaire ----
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: name === "idPays" ? Number(value) : value }));
    };

    // Pour gérer le changement depuis ChoiceSelectField
    const handleSelectChange = (name: string, value: string | number | (string | number)[]) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    return (
        <div className="col-md-12 mt-0">
            <h4 className="mb-3">Liste des provinces</h4>

            {/* loader / error */}
            <LoaderAndError loading={loading} error={error} onClearError={() => setError(null)} />

            {/* Barre de recherche + boutons */}
            <div className="d-flex justify-content-between mb-3">
                <div className="col-auto col-sm-6">
                    <div className="input-group">
                        <button className="btn btn-sm btn-primary me-1" onClick={loadDatas} id="btn-refresh">
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

                <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
                    <i className="fas fa-plus me-1" /> Ajouter
                </button>
            </div>

            {/* Tableau */}
            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Nom du pays</th>
                                    <th>Nom de la province</th>
                                    <th>Mise à jour</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datas.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center">
                                            Aucune donnée trouvée
                                        </td>
                                    </tr>
                                ) : (
                                    datas.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.nomPays}</td>
                                            <td>{item.nomProvince}</td>
                                            <td>
                                                {formatDateFR(item.created_at || "")} {extractTime(item.created_at || "")}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-warning btn-circle btn-sm me-1"
                                                    onClick={() => handleEdit(item.id!)}
                                                >
                                                    <i className="fas fa-edit" />
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-circle btn-sm"
                                                    onClick={() => handleDelete(item.id!)}
                                                >
                                                    <i className="fas fa-trash" />
                                                </button>
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
                textCounter={true}
            />

            {/* Modal Ajout/Edition */}
            <Modal
                title={isEditing ? "Modifier la province" : "Ajouter une province"}
                show={showModal}
                onClose={() => {
                    setShowModal(false);
                    setFormData({});
                    setIsEditing(false);
                }}
                dimension="modal-md"
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-12 mb-2 w-100">
                            {/* <ComboBox
                                name="idPays"
                                value={formData.idPays?? ''}
                                onChange={handleInputChange}
                                placeholder="Sélectionnez le pays"
                                icon="fas fa-globe-africa"
                                label="Pays"
                                options={paysOptions} // [{value,label}]
                                required
                            /> */}



                            <SelectPickerField

                                name="idPays"

                                value={formData.idPays ? String(formData.idPays) : ""}
                                onChange={(v) => handleSelectChange("idPays", v)}


                                placeholder="Sélectionnez le pays"
                                icon="fas fa-globe-africa"
                                label="Pays"
                                options={paysOptions}   // [{ value, label }]
                                required
                            // searchable   // 🔍 active la recherche
                            />
                        </div>
                        <div className="col-md-12 mb-2">
                            <TextField
                                name="nomProvince"
                                value={formData.nomProvince ?? ""}
                                onChange={handleInputChange}
                                placeholder="Nom de la province"
                                icon="fas fa-map"
                                label="Nom de la province"
                                required
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-end">
                        <button type="button" className="btn btn-light me-2" onClick={() => setShowModal(false)}>
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
