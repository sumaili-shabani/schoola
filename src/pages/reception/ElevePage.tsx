import React, { useEffect, useState } from "react";
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
    saveItemImageForm,
} from "../../api/callApi";
import {
    showErrorMessage,
    showSuccessMessage,
    showWarningMessage,
    fileUrl,
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

// =============================================
// 🔹 Interface TypeScript
// =============================================
interface Eleve {
    id?: number;
    nomEleve?: string;
    postNomEleve?: string;
    preNomEleve?: string;
    sexeEleve?: string;
    etatCivilEleve?: string;
    nomPere?: string;
    nomMere?: string;
    numPere?: string;
    numMere?: string;
    photoEleve?: string;
    codeEleve?: string;
    numAdresseEleve?: string;
    dateNaisEleve?: string;
    idPays?: number | string;
    idProvince?: number | string;
    idVille?: number | string;
    idCommune?: number | string;
    idQuartier?: number | string;
    idAvenue?: number | string;
    idParent?: number | string;
    nomPays?: string;
    nomProvince?: string;
    nomVille?: string;
    nomCommune?: string;
    nomQuartier?: string;
    nomAvenue?: string;
    ageEleve?: number;
    created_at?: string;
    logoFile?: File;
}

// =============================================
// 🔹 Composant principal
// =============================================
export default function ElevePage() {
    const [datas, setDatas] = useState<Eleve[]>([]);
    const [formData, setFormData] = useState<Partial<Eleve>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // listes dynamiques
    const [paysOptions, setPaysOptions] = useState<any[]>([]);
    const [provinceOptions, setProvinceOptions] = useState<any[]>([]);
    const [villeOptions, setVilleOptions] = useState<any[]>([]);
    const [communeOptions, setCommuneOptions] = useState<any[]>([]);
    const [quartierOptions, setQuartierOptions] = useState<any[]>([]);
    const [avenueOptions, setAvenueOptions] = useState<any[]>([]);
    const [parentOptions, setParentOptions] = useState<any[]>([]);

    // pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } = usePagination({
        currentPage,
        totalPages,
    });

    // changement des textes
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };


    // =============================================
    // 🔹 Chargement des données
    // =============================================
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<Eleve>("/fetch_eleve", {
                page: currentPage,
                limit,
                query: search,
            });
            setDatas(res.data);
            setTotalPages(res.lastPage);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // -------- LOGIQUE DES SELECTS --------
    const handleSelectChange = async (field: string, val: string) => {
        setFormData((prev) => ({ ...prev, [field]: val }));

        if (field === "idPays") {
            setProvinceOptions([]);
            setVilleOptions([]);
            setCommuneOptions([]);
            setQuartierOptions([]);
            await loadProvince(val);
        }

        if (field === "idProvince") {
            setVilleOptions([]);
            setCommuneOptions([]);
            setQuartierOptions([]);
            await loadVille(val);
        }

        if (field === "idVille") {
            setCommuneOptions([]);
            setQuartierOptions([]);
            await loadCommune(val);
        }
        if (field === "idCommune") {
            setQuartierOptions([]);
            await loadQuartier(val);
        }
        if (field === "idQuartier") {
            setAvenueOptions([]);
            await loadAvenue(val);
        }
        if (field === "idParent") {
            // setParentOptions([]);
            await loadInfouser(val);

        }
    };

    // -------- CHARGEMENT DES DONNÉES --------
    const loadParent = async () => {
        try {
            const res = await fetchListItems("/fetch_all_parents");
            setParentOptions(
                res?.data?.map((x: any) => ({
                    value: String(x.id),
                    label: x.nomP,
                })) || []
            );
        } catch {
            showErrorMessage("Erreur lors du chargement des pays");
        }
    };
    const loadInfouser = async (idParent: string | number) => {
        try {
            const res = await fetchListItems(`/fetch_single_parent/${idParent}`);
            res?.data?.map((p: any) => {
                // ✅ fusionne proprement
                setFormData(prev => ({
                    ...prev,
                    idParent: p.id,
                    nomPere: p.nomP,
                    numPere: p.telephoneP,
                }));

            });

        } catch {

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

    const loadQuartier = async (idCommune: string | number) => {
        try {
            const res = await fetchListItems(`/fetch_quartier_tug_commune/${idCommune}`);
            setQuartierOptions(
                res?.data?.map((c: any) => ({
                    value: String(c.id),
                    label: c.nomQuartier,
                })) || []
            );
        } catch {
            setQuartierOptions([]);
        }
    };

    const loadAvenue = async (idQuartier: string | number) => {
        try {
            const res = await fetchListItems(`/getAvenueTug/${idQuartier}`);
            setAvenueOptions(
                res?.data?.map((c: any) => ({
                    value: String(c.id),
                    label: c.nomAvenue,
                })) || []
            );
        } catch {
            setAvenueOptions([]);
        }
    };



    const getAllAvenue = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetchListItems(`/fetch_avenue_2`);
            setAvenueOptions(
                res?.data?.map((c: any) => ({
                    value: String(c.id),
                    label: c.nomAvenue,
                })) || []
            );
        } catch {
            setAvenueOptions([]);
        }
    };




    // =============================================
    // 🔹 Submit formulaire
    // =============================================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await saveItem("/insert_eleve", formData);
            showSuccessMessage(res);
            setShowModal(false);
            setFormData({});
            loadDatas();
        } catch (error) {
            showWarningMessage(error);
        }
    };

    // =============================================
    // 🔹 Édition
    // =============================================
    const handleEdit = async (id: number) => {
        try {
            setLoading(true);
            const res = await fetchSigleItem<Eleve[]>("/fetch_single_eleve", id);
            const data = res && res.length > 0 ? res[0] : undefined;
            if (!data) {
                showErrorMessage("Élève introuvable.");
                return;
            }
            setFormData(data);
            setIsEditing(true);
            setShowModal(true);

            // Précharger les listes dépendantes
            await loadProvince(data.idPays ?? "");
            await loadVille(data.idProvince ?? "");
            await loadCommune(data.idVille ?? "");
            await loadQuartier(data.idCommune ?? "");
            await loadAvenue(data.idQuartier ?? "");
            if (data.idParent) await loadInfouser(data.idParent ?? "");
        } catch (error) {
            showErrorMessage(error);
        } finally {
            setLoading(false);
        }
    };

    // =============================================
    // 🔹 Suppression
    // =============================================
    const handleDelete = async (id: number) => {
        const confirmed = await showConfirmationDialog({
            title: "Supprimer cet élève ?",
            text: "Cette action est irréversible.",
            confirmButtonText: "Oui, supprimer",
            icon: "warning",
        });
        if (confirmed) {
            try {
                const res = await removeItem("/delete_eleve", id);
                showSuccessMessage(res);
                loadDatas();
            } catch (error) {
                showErrorMessage(error);
            }
        }
    };

    // =============================================
    // 🔹 Hooks
    // =============================================
    useEffect(() => {
        loadPays();
        loadParent();
        loadDatas();
    }, [search, currentPage, limit]);



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
            const roles = await fetchSigleItem<Eleve[]>("/fetch_single_eleve", id);
            const data = roles && roles.length > 0 ? roles[0] : undefined;
            if (!data) {
                setLoading(false);
                setError("Rôle introuvable.");
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
            const res = await saveItemImageForm("/editPhotoEleve", formDataToSend);
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

    // =============================================
    // 🔹 Rendu
    // =============================================
    return (
        <div className="col-md-12">
            <h4 className="mb-3">Gestion des élèves</h4>

            <LoaderAndError loading={loading} error={error} onClearError={() => setError(null)} />

            {/* 🔍 Barre de recherche */}
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
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                        <LoadingSpinner loading={loading} />
                    </div>
                </div>

                <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                    <i className="fas fa-plus me-1"></i> Ajouter
                </button>
            </div>

            {/* TABLE */}
            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-striped align-middle">
                            <thead>
                                <tr>
                                    <th>Photo</th>
                                    <th>Nom complet</th>
                                    <th>Sexe / Âge</th>
                                    <th>Parents</th>
                                    <th>Contacts</th>
                                    <th>Adresse</th>
                                    <th>Mise à jour</th>
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
                                    datas.map((e) => (
                                        <tr key={e.id}>
                                            <td>
                                                <img
                                                    src={
                                                        e.photoEleve
                                                            ? `${fileUrl}/images/${e.photoEleve}`
                                                            : `${fileUrl}/images/avatar.png`
                                                    }
                                                    alt="eleve"
                                                    className="rounded-circle"
                                                    width={50}
                                                    height={50}
                                                />
                                            </td>
                                            <td>
                                                {e.nomEleve} {e.postNomEleve} <br />
                                                {e.preNomEleve}
                                            </td>
                                            <td>
                                                {e.sexeEleve} / {e.ageEleve ?? "-"} ans
                                            </td>
                                            <td>
                                                <b>Père :</b> {e.nomPere} <br />
                                                <b>Mère :</b> {e.nomMere}
                                            </td>
                                            <td>
                                                <a href={`tel:${e.numPere}`}>📞 {e.numPere}</a> <br />
                                                <a href={`tel:${e.numMere}`}>📞 {e.numMere}</a>
                                            </td>
                                            <td>
                                                {truncateText(`${e.nomPays}, ${e.nomProvince}, ${e.nomVille}, ${e.nomCommune},{" "}
                                                ${e.nomQuartier}, ${e.nomAvenue} N°${e.numAdresseEleve}`, 20)}
                                                {/* {e.nomPays}, {e.nomProvince}, {e.nomVille}, {e.nomCommune},{" "}
                                                {e.nomQuartier}, {e.nomAvenue} N°{e.numAdresseEleve} */}
                                            </td>
                                            <td>
                                                {formatDateFR(e.created_at || "")}{" "}
                                                {extractTime(e.created_at || "")}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-secondary btn-circle btn-sm me-1"
                                                    onClick={() => handlEditImage(e.id!)}
                                                >
                                                    <i className="fas fa-camera"></i>
                                                </button>
                                                <button
                                                    className="btn btn-warning btn-circle btn-sm me-1"
                                                    onClick={() => handleEdit(e.id!)}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-circle btn-sm"
                                                    onClick={() => handleDelete(e.id!)}
                                                >
                                                    <i className="fas fa-trash"></i>
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
                                <img src={preview || fileUrl + '/images/' + formData.photoEleve} alt="image sélectionnée" className='img img-thumbnail col-md-6' width={50} height={50} />


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

            {/* MODAL FORM */}
            <Modal
                title={isEditing ? "Modifier l'élève" : "Ajouter un élève"}
                show={showModal}
                onClose={() => setShowModal(false)}
                dimension="modal-xl"
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-6 col-ms-12 col-12 col-lg-4 col-xs-12">
                            <TextField
                                label="Nom"
                                name="nomEleve"
                                value={formData.nomEleve || ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="col-md-6 col-ms-12 col-12 col-lg-4 col-xs-12">
                            <TextField
                                label="Post-nom"
                                name="postNomEleve"
                                value={formData.postNomEleve || ""}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="col-md-6 col-ms-12 col-12 col-lg-4 col-xs-12">
                            <TextField
                                label="Prénom"
                                name="preNomEleve"
                                value={formData.preNomEleve || ""}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="col-md-6 col-ms-12 col-12 col-lg-4 col-xs-12">
                            <SelectPickerField
                                label="Sexe"
                                name="sexeEleve"
                                options={[
                                    { value: "M", label: "Masculin" },
                                    { value: "F", label: "Féminin" },
                                ]}
                                value={formData.sexeEleve || ""}
                                onChange={(v) => setFormData({ ...formData, sexeEleve: v })}
                                required
                            />
                        </div>
                        <div className="col-md-6 col-ms-12 col-12 col-lg-4 col-xs-12">
                            <SelectPickerField
                                label="État civil"
                                name="etatCivilEleve"
                                options={[
                                    { value: "Célibataire", label: "Célibataire" },
                                    { value: "Marié(e)", label: "Marié(e)" },
                                    { value: "Divorcé(e)", label: "Divorcé(e)" },
                                    { value: "Veuf(ve)", label: "Veuf(ve)" },
                                ]}
                                value={formData.etatCivilEleve || ""}
                                onChange={(v) => setFormData({ ...formData, etatCivilEleve: v })}

                            />
                        </div>
                        <div className="col-md-6 col-ms-12 col-12 col-lg-4 col-xs-12">
                            <TextField
                                label="Date de naissance"
                                name="dateNaisEleve"
                                type="date"
                                value={formData.dateNaisEleve || ""}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="col-md-12">
                            <SelectPickerField
                                label="Parents"
                                name="idParent"
                                icon="fas fa-user"
                                value={formData.idParent ? String(formData.idParent) : ""}
                                options={parentOptions}
                                required
                                onChange={(v) => handleSelectChange("idParent", v)}
                            />

                        </div>


                        <div className="col-md-6">
                            <TextField
                                label="Nom du père"
                                name="nomPere"
                                value={formData.nomPere || ""}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="col-md-6">
                            <TextField
                                label="Nom de la mère"
                                name="nomMere"
                                value={formData.nomMere || ""}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="col-md-6">
                            <TextField
                                icon="fas fa-phone"
                                label="N° du téléphone du père"
                                name="numPere"
                                value={formData.numPere || ""}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="col-md-6">
                            <TextField
                                icon="fas fa-phone"
                                label="N° du téléphone de la mère"
                                name="numMere"
                                value={formData.numMere || ""}
                                onChange={handleInputChange}
                            />
                        </div>

                        {/* Localisation (Pays -> Avenue) */}

                        <div className="col-md-6">
                            <SelectPickerField
                                label="Pays"
                                name="idPays"
                                icon="fas fa-flag"
                                value={formData.idPays ? String(formData.idPays) : ""}
                                options={paysOptions}

                                onChange={(v) => handleSelectChange("idPays", v)}
                            />
                        </div>
                        <div className="col-md-6">
                            <SelectPickerField
                                label="Province"
                                name="idProvince"
                                icon="fas fa-map"
                                value={formData.idProvince ? String(formData.idProvince) : ""}
                                options={provinceOptions}

                                onChange={(v) => handleSelectChange("idProvince", v)}
                            />
                        </div>
                        <div className="col-md-6">
                            <SelectPickerField
                                label="Ville"
                                name="idVille"
                                icon="fas fa-city"
                                value={formData.idVille ? String(formData.idVille) : ""}
                                options={villeOptions}

                                onChange={(v) => handleSelectChange("idVille", v)}
                            />
                        </div>
                        <div className="col-md-6">
                            <SelectPickerField
                                label="Commune"
                                name="idCommune"
                                icon="fas fa-map-pin"
                                value={formData.idCommune ? String(formData.idCommune) : ""}
                                options={communeOptions}
                                required
                                onChange={(v) => handleSelectChange("idCommune", v)}
                            />
                        </div>
                        <div className="col-md-6">

                            <SelectPickerField
                                label="Quartier"
                                name="idQuartier"
                                icon="fas fa-map-pin"
                                value={formData.idQuartier ? String(formData.idQuartier) : ""}
                                options={quartierOptions}
                                required
                                onChange={(v) => handleSelectChange("idQuartier", v)}
                            />
                        </div>

                        <div className="col-md-5">
                            <SelectPickerField
                                label="Avenue"
                                name="idAvenue"
                                icon="fas fa-map-pin"
                                value={formData.idAvenue ? String(formData.idAvenue) : ""}
                                options={avenueOptions}
                                required
                                onChange={(v) => setFormData(prev => ({ ...prev, idAvenue: v }))}
                            />
                        </div>
                        <div className="col-md-1">
                            <div className="col-md-12">
                                <p>
                                    Recharcher
                                </p>
                                <a href="#" className="btn btn-info btn-sm" onClick={getAllAvenue}>
                                    <i className="fas fa-refresh"></i> la liste
                                </a>

                            </div>

                        </div>


                        <div className="col-md-12">
                            <TextField
                                label="Numéro de parcelle"
                                name="numAdresseEleve"
                                value={formData.numAdresseEleve || ""}
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
        </div>
    );
}
