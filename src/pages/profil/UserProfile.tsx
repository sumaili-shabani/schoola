import React, { useEffect, useState } from 'react';
import UserSettings from './UserSettings';
import { fileUrl, showSuccessMessage } from '../../api/config';

import { ComboBox, TextField } from '../../components';
import { fetchItems, fetchItems2, fetchSigleItem, saveItem, saveItemImageForm } from '../../api/callApi';
import { showErrorMessage } from '../../api/config';
import ComboBoxField from '../../components/ComboBox';
import { getUser } from '../../api/auth';



interface UserData {
    id?: any;
    name?: string;
    email?: string;
    idRole?: string;
    id_role?: string,
    telephone?: string;
    avatar?: string;
    sexe?: string;
    role?: any;
    old_password?: string;
    newspassword?: string;
    confirmpassword?: string,
    logoFile?: File;

}

export default function UserProfile() {
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [datas, setDatas] = useState<UserData[]>([]);
    const [preview, setPreview] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<UserData>>({
        id:null,
        name: 'Roger Sumaili',
        email: 'sumailiroger681@gmail.com',
        avatar: 'avatar.png',
        role: 'Développeur Fullstack',
        telephone: '+243 817 883 541',
        sexe: 'Homme',
        idRole: 'ADMIN001',
        id_role: 'ADMIN001',
        old_password: "",
        newspassword: "",
        confirmpassword: "",
    });

    const SexeOptions = [
        { value: 'M', label: 'Homme' },
        { value: 'F', label: 'Femme' },
    ];
    const [selectedSexe, setSelectedSexe] = useState<{ value: any; label: string } | null>(null);


    const [activeTab, setActiveTab] = useState('profile');

    /** Fallback pour avatar */
    const avatarSrc =
        preview ||
        (formData.avatar
            ? `${fileUrl}/images/${formData.avatar}`
            : `${fileUrl}/images/avatar.png`);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // actions 

    const user = getUser();
    const fetchConnected = async () => {
        const id = user?.id;
        const data = await fetchItems2<UserData>('/get_user_profil', id);
        // console.log("data:" + JSON.stringify(data));
        if (data) {
            setFormData(data);
        }
        setIsEditing(true);


    }

    useEffect(() => {
        fetchConnected();
    }, []);

    const handEditForm = async () => {
        const id = user?.id;
        if (activeTab === 'profile') {
            // alert("profile");
            setFormData({
                id: id,
            });
            if (formData.name != '' && formData.email != ''
                && formData.telephone != '' && formData.sexe != '' && formData.id != null) {

                editInfoProfilCOnnected();
            }
            else {
                showErrorMessage("Veillez saisir tous les champs!!!");
            }

        }
        else if (activeTab === 'settings') {
            alert("settings");
        }
        else if (activeTab === 'avatar') {
            // alert("avatar");
            handleSubmitImage();
        }
        else if (activeTab === 'password') {
            // alert("password");
            if (formData.newspassword != '' && formData.confirmpassword != '') {

                if (formData.newspassword == formData.confirmpassword) {

                    editPasswordUserConnected();
                }
                else {
                    showErrorMessage("Les deux mot de passe doivent être identique!!!");
                }


            }
            else {
                showErrorMessage("Veillez saisir tous les champs!!!");
            }

        }
        else {
            alert("Desole!!!");
        }
    }

    const editInfoProfilCOnnected = async () => {
        // console.log("id:" + formData.id);
        const res = await saveItem('/insert_user', formData);
        // console.log(res);
        showSuccessMessage(res);
        fetchConnected();

    }

    const editPasswordUserConnected = async () => {
        // console.log("id:" + formData.id);
        const res = await saveItem('/change_pwd_user_connected', formData);
        // console.log("res:", res);
        showSuccessMessage(res);
        fetchConnected();

    }

    /*
      *
      *==========================
      * Utilisation de l'image
      *==========================
      *
      */


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

  
    const handleSubmitImage = async () => {
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

        try {
            const res = await saveItemImageForm("/edit_photo", formDataToSend);
            showSuccessMessage(res.data);
            fetchConnected();
        } catch (error: any) {
            showErrorMessage("Une erreur est survenue lors de l'envoi du fichier.");
            console.error(error);
        }
    };


    /*
    *
    *==========================
    * Utilisation de l'image
    *==========================
    *
    */

    return (
        <div className="rounded border shadow-sm  text-dark">
            {/* Banner */}
            <div className="position-relative">
                <div
                    className="bg-primary"
                    style={{
                        height: "120px",
                        borderTopLeftRadius: "5px",
                        borderTopRightRadius: "5px",
                    }}
                ></div>

                {/* Avatar */}
                <div
                    className="position-absolute top-100 start-50 translate-middle"
                    style={{ zIndex: 10 }}
                >
                    <img
                        src={avatarSrc}
                        alt="Avatar utilisateur"
                        className="rounded-circle border border-white shadow"
                        width="120"
                        height="120"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src =
                                `${fileUrl}/images/avatar.png`;
                        }}
                    />
                </div>
            </div>

            <div className="text-center mt-5 pt-2">
                <h4 className="mb-0 fw-bold">{formData.name ?? "Utilisateur"}</h4>
                <p className="text-muted mb-1">{formData.email ?? ""}</p>
                <p className="text-primary fw-semibold">
                    {formData.role ?? "Rôle non défini"}
                </p>

                <button
                    className="btn btn-outline-primary btn-sm mb-3"
                    onClick={handEditForm}
                >
                    <i className="fas fa-pen"></i> Sauvegarder les modifications
                </button>
            </div>
            {/* Tabs */}
            <ul className="nav nav-tabs justify-content-center mb-3">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <i className="fas fa-user me-1"></i> Profil
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <i className="fas fa-cog me-1"></i> Paramètres
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'avatar' ? 'active' : ''}`}
                        onClick={() => setActiveTab('avatar')}
                    >
                        <i className="fas fa-image me-1"></i> Avatar
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'password' ? 'active' : ''}`}
                        onClick={() => setActiveTab('password')}
                    >
                        <i className="fas fa-lock me-1"></i> Mot de passe
                    </button>
                </li>
            </ul>

            {/* Tab content */}
            <div className="p-3">
                {activeTab === 'profile' && (
                    <div className="col-md-12">
                        <div className="row">
                            <div className="col-md-2"></div>
                            <div className="col-md-8">
                                <div className="row">
                                    <div className="col-md-6 mb-0">

                                        <TextField
                                            name="name"
                                            value={formData.name || ''}
                                            onChange={handleInputChange}
                                            placeholder="Nom"
                                            label="Nom"
                                            icon="fas fa-user-tag"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 mb-0">
                                        <TextField
                                            type='email'
                                            name="email"
                                            value={formData.email || ''}
                                            onChange={handleInputChange}
                                            placeholder="Email"
                                            label="Email"
                                            icon="fas fa-envelope"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 mb-0">
                                        <TextField
                                            name="telephone"
                                            value={formData.telephone || ''}
                                            onChange={handleInputChange}
                                            placeholder="N° de téléphone"
                                            label="Nom"
                                            icon="fas fa-phone"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 mb-0">
                                        <ComboBoxField
                                            name="sexe"
                                            value={formData.sexe || ''}
                                            onChange={handleInputChange}
                                            label="Sexe"
                                            icon="fas fa-venus-mars"
                                            options={[
                                                { value: 'M', label: 'Homme' },
                                                { value: 'F', label: 'Femme' }
                                            ]}
                                        />


                                    </div>
                                </div>
                            </div>
                            <div className="col-md-2"></div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div>

                        <div className="col-md-12">
                            <div className="row">
                                <div className="col-md-2"></div>
                                <div className="col-md-8">
                                    <div className="row">
                                        <UserSettings />

                                    </div>
                                </div>
                                <div className="col-md-2"></div>
                            </div>
                        </div>



                    </div>

                )}

                {activeTab === 'avatar' && (

                    <div className="col-md-12">
                        <div className="row">
                            <div className="col-md-2"></div>
                            <div className="col-md-8">
                                <div className="row">
                                    <div className="col-md-6 mb-2">
                                        <p>Changer l’image de profil</p>
                                        <input
                                            type="file"
                                            name="logo"
                                            id="logo"
                                            className='form-control'
                                            onChange={handleInputChangeImage}
                                            required
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        {/* affichage de l'image selectionnée */}
                                        <img src={preview || fileUrl + '/images/' + formData.avatar}
                                            alt="image sélectionnée" className='img img-thumbnail col-md-6' width={50} height={50} />


                                    </div>

                                </div>
                            </div>
                            <div className="col-md-2"></div>
                        </div>
                    </div>



                )}

                {activeTab === 'password' && (

                    <div className="col-md-12">
                        <div className="row">
                            <div className="col-md-2"></div>
                            <div className="col-md-8">
                                <div className="row">
                                    <div className="col-md-12 mb-0">

                                        <TextField
                                            name="old_password"
                                            value={formData.old_password || ''}
                                            onChange={handleInputChange}
                                            placeholder="Ancien mot de passe"
                                            label="Ancien mot de passe"
                                            icon="fas fa-key"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 mb-0">

                                        <TextField
                                            name="newspassword"
                                            value={formData.newspassword || ''}
                                            onChange={handleInputChange}
                                            placeholder="nouveau mot de passe"
                                            label="nouveau mot de passe"
                                            icon="fas fa-lock"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 mb-0">
                                        <TextField
                                            name="confirmpassword"
                                            value={formData.confirmpassword || ''}
                                            onChange={handleInputChange}
                                            placeholder="Confirmer le nouveau mot de passe"
                                            label="Confirmer le nouveau mot de passe"
                                            icon="fas fa-lock"
                                            required
                                        />
                                    </div>

                                </div>
                            </div>
                            <div className="col-md-2"></div>
                        </div>
                    </div>

                )}
            </div>
        </div>
    );
}
