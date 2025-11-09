import React, { useEffect, useState } from "react";
import { fetchItems, saveItem, removeItem, extractTime, formatDateFR, showConfirmationDialog, truncateText, fetchSigleItem, saveItemImageForm, } from "../../api/callApi";
import { usePagination } from "../../hooks/usePagination";
import { LoaderAndError, Modal, Pagination, RichTextField, TextField } from "../../components";
import { fileUrl, showErrorMessage, showSuccessMessage, showWarningMessage } from "../../api/config";
import LoadingSpinner from "../../components/LoadingSpinner";
import TextAreaFild from "../../components/TextAreaField";



interface Site {
    id?: number;
    nom?: string;
    description?: string;
    email?: string;
    adresse?: string;
    tel1?: string;
    tel2?: string;
    tel3?: string;
    token?: string;
    about?: string;
    mission?: string;
    objectif?: string;
    politique?: string;
    condition?: string;
    logo?: string;
    logoFile?: File;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    whatsapp?: string;
    created_at?: string;
    updated_at?: string;
}

export default function SitePage() {
    const [datas, setDatas] = useState<Site[]>([]);
    const [formData, setFormData] = useState<Partial<Site>>({});
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");


    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // declaration de la pagination
    const { paginationRange, isCurrentPage, isFirstPage, isLastPage } = usePagination({
        currentPage,
        totalPages,
    });

    // chargement de la table
    const loadDatas = async () => {
        setLoading(true);
        try {
            const res = await fetchItems<Site>("/fetch_site", {
                page: currentPage,
                limit,
                query: search,
            });
            setDatas(res.data);
            setTotalPages(res.lastPage); // ✅ correction ici
        } catch (error: any) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDatas();
    }, [search, currentPage, limit]);


    // ✅ Ajout / Modification
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await saveItem("/insert_site", formData);
            showSuccessMessage(res);
            loadDatas();
            handleCloseModal();

        } catch (error) {
            showWarningMessage(error);

        }

    };

    // ✅ Édition
    const handleEdit = async (id: number) => {
        try {
            setLoading(true);
            const roles = await fetchSigleItem<Site[]>("/fetch_single_site", id);
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
            setShowModal(true);
            setLoading(false);

        } catch (error) {
            setLoading(false);
            showWarningMessage(error);
        }
    };

    // ✅ Suppression
    const handleDelete = async (id: number) => {
        const confirmed = await showConfirmationDialog({
            title: "Supprimer cette donnée ?",
            text: "Cette action est irréversible.",
            confirmButtonText: "Oui, supprimer",
            icon: "warning",
        });
        if (confirmed) {
            try {
                setLoading(true);
                const res = await removeItem("/delete_site", id);
                setLoading(false);
                showSuccessMessage(res);
                loadDatas();


            } catch (error) {
                setLoading(false);
                showErrorMessage(error);
            }
        }
    };

    //ouverture et fer;eture de modal
    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({});
        setIsEditing(false);
    };

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
            const roles = await fetchSigleItem<Site[]>("/fetch_single_site", id);
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
            const res = await saveItemImageForm("/edit_photo_site", formDataToSend);
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

    return (
        <div className="container mt-0">

            <h4 className="mb-3">Configuration du système</h4>


            {/* loading component */}
            <LoaderAndError
                loading={loading}
                error={error}
                onClearError={() => setError(null)}
            />

            {/* modal image site */}
            <Modal title={isEditing ? "Modifier l'image" : "Ajouter l'image"}
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
                                <img src={preview || fileUrl + '/images/' + formData.logo} alt="image sélectionnée" className='img img-thumbnail col-md-6' width={50} height={50} />


                            </div>
                        </div>
                        {/* fin formulaire */}
                        {/* boutton */}
                        <div className="row">
                            <div className="col-md-12 d-flex justify-content-end mt-2">
                                <button type="submit" className="btn btn-primary">
                                    {isEditing ? 'Modifier' : 'Ajouter'}

                                </button>
                            </div>
                        </div>
                        {/* fin boutton */}
                    </div>


                </form>
            </Modal>
            {/* fin modal image site */}


            {/* modal component */}
            <Modal
                title={isEditing ? 'Modifier le site' : 'Ajouter un site'}
                show={showModal}
                onClose={handleCloseModal}
                dimension="modal-lg"
            >
                <form onSubmit={handleSubmit}>
                    <div className="col-md-12 col-lg-12 col-sm-12 col-xs-12">
                        <div className="row">
                            <div className="col-md-12">
                                <TextField
                                    name="nom"
                                    value={formData.nom || ''}
                                    onChange={handleInputChange}
                                    placeholder="Nom du Site"
                                    icon="fas fa-user-tag"
                                    label="Nom du Site"
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <TextField
                                    name="adresse"
                                    value={formData.adresse || ''}
                                    onChange={handleInputChange}
                                    placeholder="Adresse"
                                    icon="fas fa-map-location-dot"
                                    label="Adresse domicile"
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <TextField
                                    name="email"
                                    value={formData.email || ''}
                                    onChange={handleInputChange}
                                    label="Adresse Mail"
                                    placeholder="Adresse Mail"
                                    icon="fas fa-envelope"
                                    required
                                />
                            </div>


                            <div className="col-md-6">
                                <TextField
                                    name="tel1"
                                    value={formData.tel1 || ''}
                                    onChange={handleInputChange}
                                    label="N° de téléphone principal"
                                    placeholder="N° de téléphone principal"
                                    icon="fas fa-phone"
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <TextField
                                    name="tel2"
                                    value={formData.tel2 || ''}
                                    onChange={handleInputChange}
                                    label="N° de téléphone Secondaire"
                                    placeholder="N° de téléphone Secondaire"
                                    icon="fas fa-phone"

                                />
                            </div>
                            <div className="col-md-6">
                                <TextField
                                    name="tel3"
                                    value={formData.tel3 || ''}
                                    onChange={handleInputChange}
                                    label="N° de téléphone 3"
                                    placeholder="N° de téléphone 3"
                                    icon="fas fa-phone"

                                />
                            </div>

                            <div className="col-md-6">
                                <TextField
                                    name="token"
                                    value={formData.token || ''}
                                    onChange={handleInputChange}
                                    label="Token"
                                    placeholder="Token"
                                    icon="fas fa-code"

                                />
                            </div>


                            <div className="col-md-6">
                                <TextField
                                    name="facebook"
                                    value={formData.facebook || ''}
                                    onChange={handleInputChange}
                                    label="facebook"
                                    placeholder="facebook"
                                    icon="fab fa-facebook"

                                />
                            </div>

                            <div className="col-md-6">
                                <TextField
                                    name="linkedin"
                                    value={formData.linkedin || ''}
                                    onChange={handleInputChange}
                                    label="linkedin"
                                    placeholder="linkedin"
                                    icon="fab fa-linkedin"

                                />
                            </div>

                            <div className="col-md-6">
                                <TextField
                                    name="twitter"
                                    value={formData.twitter || ''}
                                    onChange={handleInputChange}
                                    label="twitter"
                                    placeholder="twitter"
                                    icon="fab fa-twitter"

                                />
                            </div>

                            <div className="col-md-6">
                                <TextField
                                    name="youtube"
                                    value={formData.youtube || ''}
                                    onChange={handleInputChange}
                                    label="youtube"
                                    placeholder="youtube"
                                    icon="fab fa-youtube"

                                />
                            </div>

                            <div className="col-md-12">
                                <TextField
                                    name="whatsapp"
                                    value={formData.whatsapp || ''}
                                    onChange={handleInputChange}
                                    label="whatsapp"
                                    placeholder="whatsapp"
                                    icon="fab fa-whatsapp"

                                />
                            </div>

                            <div className="col-md-12">
                                <TextAreaFild
                                    name="about"
                                    value={formData.about || ''}
                                    onChange={handleInputChange}
                                    label="A propos"
                                    placeholder="A propos"
                                    icon="fas fa-text-width"
                                    

                                />
                            </div>
                            <div className="col-md-12">
                                <TextAreaFild
                                    name="mission"
                                    value={formData.mission || ''}
                                    onChange={handleInputChange}
                                    label="Mission"
                                    placeholder="Mission"
                                    icon="fas fa-text-width"
                                    

                                />
                            </div>

                            <div className="col-md-12">
                                <TextAreaFild
                                    name="objectif"
                                    value={formData.objectif || ''}
                                    onChange={handleInputChange}
                                    label="Objectif"
                                    placeholder="Objectif"
                                    icon="fas fa-text-width"
                                    

                                />
                            </div>

                            <div className="col-md-12">
                                <TextAreaFild
                                    name="politique"
                                    value={formData.politique || ''}
                                    onChange={handleInputChange}
                                    label="Politique de protection des données"
                                    placeholder="Politique de protection des données"
                                    icon="fas fa-text-width"
                                    

                                />
                            </div>

                            <div className="col-md-12">
                                <TextAreaFild
                                    name="condition"
                                    value={formData.condition || ''}
                                    onChange={handleInputChange}
                                    label="Condition d'utilisation"
                                    placeholder="Condition d'utilisation"
                                    icon="fas fa-text-width"
                                    

                                />
                            </div>

                            <div className="col-md-12">
                                <TextAreaFild
                                    name="description"
                                    value={formData.description || ''}
                                    onChange={handleInputChange}
                                    label="Description complète"
                                    placeholder="Description complète du site"
                                    

                                />
                            </div>

                            {/* <div className="col-md-12">
                                <TextAreaFild
                                name="description"
                                value={formData.description || ''}
                                onChange={handleInputChange}
                                placeholder="Description"
                                icon="fas fa-text-width"
                                label="Description du site"
                                required
                                />
                            </div> */}



                        </div>

                    </div>
                    <div className="d-flex justify-content-end">
                        <button type="submit" className="btn btn-primary">
                            {isEditing ? 'Modifier' : 'Ajouter'}

                        </button>
                    </div>
                </form>
            </Modal>
            {/* fin modal component */}

            {/* entete de recherche */}
            <div className="d-flex justify-content-between mb-3">
                <div className="col-auto col-sm-4">
                    <div className="input-group mb-2">
                        <button
                            type="button"
                            className="btn btn-sm btn-primary me-1"
                            onClick={() => loadDatas()} // recharge
                            id='btn-search'
                        >
                            <i className="fas fa-sync"></i>
                        </button>
                        <input
                            type="text"
                            className="form-control me-2"
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
            {/* fin entete de recherche */}

            <div className="card">
                <div className="card-body">

                    {/* table des données */}
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Logo</th>
                                    <th>Nom</th>
                                    <th>Adresse</th>
                                    <th>Email</th>
                                    <th>Téléphone principal</th>
                                    <th>Date de création</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datas.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center">
                                            Aucune donnée trouvée
                                        </td>
                                    </tr>
                                ) : (
                                    datas.map((item) => (
                                        <tr key={item.id}>
                                            <td><img src={fileUrl + '/images/' + item.logo} alt={item.logo} width={40} height={40} className='img rounded-circle' /></td>
                                            <td>{truncateText(item.nom ?? '', 20)}</td>
                                            <td>{truncateText(item.adresse ?? '', 40)}</td>
                                            <td>
                                                <a href={'mailto:' + item.email} className='text-primary small'>{truncateText(item.email ?? '', 20)}</a>

                                            </td>
                                            <td>
                                                <ul>
                                                    <li>
                                                        <a href={'tel:' + item.tel1} className='text-primary small'>{truncateText(item.tel1 ?? '', 20)}</a>
                                                    </li>
                                                    <li>
                                                        <a href={'tel:' + item.tel2} className='text-primary small'>{truncateText(item.tel2 ?? '', 20)}</a>
                                                    </li>
                                                </ul>
                                            </td>
                                            <td>{formatDateFR(item.created_at ?? '')} {extractTime(item.created_at ?? '')}</td>
                                            <td>
                                                <button
                                                    className="btn btn-secondary btn-circle btn-sm me-1"
                                                    onClick={() => handlEditImage(item.id!)}
                                                >
                                                    <i className="fas fa-camera"></i>
                                                </button>
                                                <button
                                                    className="btn btn-warning btn-circle btn-sm me-1"
                                                    onClick={() => handleEdit(item.id!)}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-circle btn-sm"
                                                    onClick={() => handleDelete(item.id!)}
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
                    {/* fin table des données */}


                </div>

            </div>

            {/* pagination */}
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
            {/* fin pagination */}

        </div>
    );
}
