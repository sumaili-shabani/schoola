import React, { useEffect, useMemo, useState } from "react";
import {
    fetchItems,
    fetchListItems,
    fetchSigleItem,
    saveItem,
    removeItem,
    showConfirmationDialog,
    formatDateFR,
    saveItemImageForm,
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
interface Enseignant {
    id?: number;
    idAvenue?: string | number;
    nomEns?: string;
    nationaliteEns?: string;
    telEns?: string;
    tel2Ens?: string;
    sexeEns?: string;
    etatcivilEns?: string;
    numCarteEns?: string;
    numMaisonEns?: string;
    dateNaisEns?: string;
    imageEns?: string;
    nomUtilisateurEns?: string;
    passwordEns?: string;
    nomAvenue?: string;
    nomQuartier?: string;
    nomCommune?: string;
    nomVille?: string;
    nomProvince?: string;
    nomPays?: string;
    ageEns?: number;
    created_at?: string;
    logoFile?: File;
}

interface OptionItem {
    value: string;
    label: string;
}

// ========================= Component =========================
export default function EnseignantPage() {
    // Table
    const [datas, setDatas] = useState<Enseignant[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // Form
    const [formData, setFormData] = useState<Partial<Enseignant>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Login modal
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginData, setLoginData] = useState<{ id?: number; nomUtilisateurEns?: string; passwordEns?: string }>({});

    // Avenues
    const [avenueOptions, setAvenueOptions] = useState<OptionItem[]>([]);

    // Pagination
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
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<Enseignant>("/fetch_enseignant", {
                page: currentPage,
                limit,
                query: search,
            });
            setDatas(res.data);
            setTotalPages(res.lastPage);
        } catch (e) {
            setError("Erreur lors du chargement des enseignants");
        } finally {
            setLoading(false);
        }
    };

    const loadAvenues = async () => {
        try {
            const res = await fetchListItems("/fetch_avenue");
            setAvenueOptions(
                (res?.data || []).map((x: any) => ({
                    value: String(x.id),
                    label: `${x.nomAvenue} (${x.nomQuartier})`,
                }))
            );
        } catch {
            setAvenueOptions([]);
        }
    };

    // ========================= Effects =========================
    useEffect(() => {
        loadAvenues();
        loadDatas();
    }, [currentPage]);

    useEffect(() => {
        debounced(() => {
            setCurrentPage(1);
            loadDatas();
        });
    }, [search]);

    // ========================= Handlers =========================
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (field: keyof Enseignant, val: string) => {
        setFormData((prev) => ({ ...prev, [field]: val }));
    };

    const openModal = () => {
        setFormData({});
        setIsEditing(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setFormData({});
        setIsEditing(false);
        setShowModal(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nomEns || !formData.sexeEns || !formData.idAvenue) {
            showWarningMessage("Veuillez remplir tous les champs obligatoires.");
            return;
        }
        try {
            const res = await saveItem("/insert_enseignant", formData);
            showSuccessMessage(res);
            closeModal();
            loadDatas();
        } catch (err) {
            showErrorMessage(err);
        }
    };

    const handleEdit = async (id: number) => {
        try {
            setLoading(true);
            const res = await fetchSigleItem<Enseignant[]>("/fetch_single_enseignant", id);
            const data = res && res.length ? res[0] : undefined;
            if (!data) {
                showErrorMessage("Enseignant introuvable.");
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
            title: "Supprimer cet enseignant ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            confirmButtonText: "Oui, supprimer",
        });
        if (!confirmed) return;
        try {
            const res = await removeItem("/delete_enseignant", id);
            showSuccessMessage(res);
            loadDatas();
        } catch (err) {
            showErrorMessage(err);
        }
    };

    const handleOpenLoginModal = (row: Enseignant) => {
        setLoginData({
            id: row.id,
            nomUtilisateurEns: row.nomUtilisateurEns || "",
            passwordEns: row.passwordEns || "",
        });
        setShowLoginModal(true);
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginData.nomUtilisateurEns || !loginData.passwordEns) {
            showWarningMessage("Remplissez tous les champs de connexion.");
            return;
        }
        try {
            const res = await saveItem("/update_login_enseignant", loginData);
            showSuccessMessage(res);
            setShowLoginModal(false);
            loadDatas();
        } catch (error) {
            showErrorMessage(error);
        }
    };

    const handleRefresh = () => {
        setSearch("");
        loadDatas();
    };



    const [showModalSiteLogo, setShowModalSiteLogo] = useState(false);

    /*
 *
 *==========================
 * Utilisation de l'image
 *==========================
 *
 */
    const handlEditImage = async (id: number) => {

        try {
            setLoading(true);
            const roles = await fetchSigleItem<Enseignant[]>("/fetch_single_enseignant", id);
            const data = roles && roles.length > 0 ? roles[0] : undefined;
            if (!data) {
                setLoading(false);
                setError("Enseignant introuvable.");
                setLoading(false);
                return;
            }
            // console.log(data);
            setFormData(data);
            setIsEditing(true);
            setShowModalSiteLogo(true);
            setLoading(false);

        } catch (error) {
            setLoading(false);
            showWarningMessage(error);
        }

    }
    const handleCloseModalImage = () => {
        setShowModalSiteLogo(false);
        setFormData({});
        setIsEditing(false);
    };
    // fin modal image

    const [preview, setPreview] = useState<string | null>(null);

    const handleInputChangeImage = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, files } = e.target as HTMLInputElement;

        if (name === 'logo' && files && files[0]) {
            const file = files[0]; // ✅ Déclaration correcte

            setFormData((prev) => ({
                ...prev,
                logoFile: file,
            }));

            setPreview(URL.createObjectURL(file)); // ✅ Utilisation correcte de `file`
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };





    const handleSubmitImage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.logoFile) {
            showErrorMessage("Veuillez sélectionner une image !");
            return;
        }

        // Préparer les données JSON à envoyer avec l'image
        const data = {
            agentId: formData.id,
            id: formData.id,
        };

        // Créer un FormData
        const formDataToSend = new FormData();
        formDataToSend.append("data", JSON.stringify(data)); // ✅ correspond à $_POST['data']
        formDataToSend.append("image", formData.logoFile);   // ✅ correspond à $request->image
        formDataToSend.append("logo", formData.logoFile);   // ✅ correspond à $request->image

        try {
            const res = await saveItemImageForm("/editPhotoEnseignant", formDataToSend);
            showSuccessMessage(res.data);
            loadDatas();
        } catch (error: any) {
            showErrorMessage("Une erreur est survenue lors de l'envoi du fichier.");
            console.error(error);
        }

        handleCloseModalImage();
    };

    /*
    *
    *==========================
    * Utilisation de l'image
    *==========================
    *
    */



    // ========================= Render =========================
    return (
        <div className="col-md-12">
            <h4 className="mb-3">
                <i className="fas fa-chalkboard-teacher me-2"></i> Gestion des Enseignants
            </h4>

            <LoaderAndError loading={loading} error={error} onClearError={() => setError(null)} />

            {/* Recherche */}
            <div className="d-flex justify-content-between mb-3">
                <div className="col-auto col-sm-4">
                    <div className="input-group mb-2">
                        <button className="btn btn-sm btn-primary me-1" onClick={handleRefresh}>
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
                    <i className="fas fa-plus me-1"></i> Ajouter
                </button>
            </div>

            {/* modal image site */}
            <Modal title={isEditing ? "Modifier l'image" : "Ajouter son image"}
                show={showModalSiteLogo}
                onClose={handleCloseModalImage}
                dimension="modal-md">
                <form onSubmit={handleSubmitImage}>
                    <div className="col-md-12 col-lg-12 col-sm-12 col-xs-12">
                        {/* formulaire */}
                        <div className="row">
                            <div className="col-md-12 mb-2">

                                <input
                                    type="file"
                                    name="logo"
                                    id="logo"
                                    className='form-control'
                                    onChange={handleInputChangeImage}
                                    required
                                />
                            </div>

                            <div className="col-md-12">
                                {/* affichage de l'image selectionnée */}
                                <img src={preview || fileUrl + '/images/' + formData.imageEns} alt="image sélectionnée" className='img img-thumbnail col-md-6' width={50} height={50} />


                            </div>
                        </div>
                        {/* fin formulaire */}
                        {/* boutton */}
                        <div className="row">
                            <div className="col-md-12 d-flex justify-content-end mt-2">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {isEditing ? 'Modifier' : 'Ajouter'}

                                </button>
                            </div>
                        </div>
                        {/* fin boutton */}
                    </div>


                </form>
            </Modal>
            {/* fin modal image site */}

            {/* Tableau */}
            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-striped align-middle">
                            <thead>
                                <tr>
                                    <th>Photo</th>
                                    <th>Nom complet</th>
                                    <th>Sexe</th>
                                    <th>Téléphone</th>
                                    <th>Nationalité</th>
                                    <th>Age</th>
                                    <th>Nom d'utilisateur</th>
                                    <th>Créé le</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datas.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center text-muted">
                                            Aucun enseignant trouvé
                                        </td>
                                    </tr>
                                ) : (
                                    datas.map((row) => (
                                        <tr key={row.id}>
                                            <td>
                                                <img
                                                    src={`${fileUrl}/images/${row.imageEns || "avatar.png"}`}
                                                    alt="photo"
                                                    width={45}
                                                    height={45}
                                                    className="rounded-circle"
                                                />
                                            </td>
                                            <td>{row.nomEns}</td>
                                            <td>{row.sexeEns}</td>
                                            <td>{row.telEns}</td>
                                            <td>{row.nationaliteEns}</td>
                                            <td>{row.ageEns} ans</td>
                                            <td>{row.nomUtilisateurEns}</td>
                                            <td>{formatDateFR(row.created_at || "")}</td>
                                            <td>
                                               
                                                    <button
                                                        className="btn btn-secondary btn-circle btn-sm me-1"
                                                        onClick={() => handlEditImage(row.id!)}
                                                    >
                                                        <i className="fas fa-camera"></i>
                                                    </button>
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
                                                        className="btn btn-info btn-sm"
                                                        onClick={() => handleOpenLoginModal(row)}
                                                        title="Modifier le login"
                                                    >
                                                        <i className="fas fa-user-cog" />
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
                textCounter
            />

            {/* Modal Ajout / Edition */}
            <Modal
                title={isEditing ? "Modifier l'enseignant" : "Nouvel enseignant"}
                show={showModal}
                onClose={closeModal}
                dimension="modal-lg"
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-6">
                            <TextField
                                label="Nom complet"
                                name="nomEns"
                                icon="fas fa-user"
                                value={formData.nomEns || ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <SelectPickerField
                                label="Avenue"
                                name="idAvenue"
                                icon="fas fa-road"
                                value={formData.idAvenue ? String(formData.idAvenue) : ""}
                                options={avenueOptions}
                                onChange={(v) => handleSelectChange("idAvenue", v)}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <TextField
                                label="Téléphone principal"
                                name="telEns"
                                icon="fas fa-phone"
                                value={formData.telEns || ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <TextField
                                label="Téléphone secondaire"
                                name="tel2Ens"
                                icon="fas fa-mobile"
                                value={formData.tel2Ens || ""}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="col-md-6">
                            <SelectPickerField
                                label="Sexe"
                                name="sexeEns"
                                icon="fas fa-venus-mars"
                                value={formData.sexeEns || ""}
                                options={[
                                    { value: "M", label: "Masculin" },
                                    { value: "F", label: "Féminin" },
                                ]}
                                onChange={(v) => handleSelectChange("sexeEns", v)}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <TextField
                                label="Nationalité"
                                name="nationaliteEns"
                                icon="fas fa-flag"
                                value={formData.nationaliteEns || ""}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="col-md-6">
                            <TextField
                                label="Date de naissance"
                                name="dateNaisEns"
                                type="date"
                                icon="fas fa-calendar"
                                value={formData.dateNaisEns || ""}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="col-md-6">
                            <TextField
                                label="Numéro de carte"
                                name="numCarteEns"
                                icon="fas fa-id-card"
                                value={formData.numCarteEns || ""}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-end mt-3">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {isEditing ? "Modifier" : "Ajouter"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Login Update */}
            <Modal
                title="Modification du compte enseignant"
                show={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                dimension="modal-md"
            >
                <form onSubmit={handleLoginSubmit}>
                    <TextField
                        label="Nom d'utilisateur"
                        name="nomUtilisateurEns"
                        icon="fas fa-user"
                        value={loginData.nomUtilisateurEns || ""}
                        onChange={(e) =>
                            setLoginData((prev) => ({ ...prev, nomUtilisateurEns: e.target.value }))
                        }
                        required
                    />
                    <TextField
                        label="Mot de passe"
                        name="passwordEns"
                        type="password"
                        icon="fas fa-lock"
                        value={loginData.passwordEns || ""}
                        onChange={(e) =>
                            setLoginData((prev) => ({ ...prev, passwordEns: e.target.value }))
                        }
                        required
                    />
                    <div className="d-flex justify-content-end mt-3">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            Enregistrer
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
