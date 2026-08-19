import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { FaTimes, FaCamera } from 'react-icons/fa';

import '../styles/Profile.css'
import { API_URL, getMediaUrl } from '../api/api';

const EditProfileModal = ({ user, onClose }) => {

    const { token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate()
    
    // States for data and image preview
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(null);

    // formData pour mettre a jour le profile
    const [formData, setFormData] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        bio: user.bio || ''
    });

    // Fonction pour créer l'avatar à partir des initiales de l'utilisateur.
  const getAvatarSrc = () => {
    // getMediaUrl gère à la fois les URLs Cloudinary (déjà complètes) et
    // d'anciens chemins locaux relatifs.
    if (user && user.avatar) return getMediaUrl(user.avatar);
    if (user) {
      // Initials basées sur le prénom et le nom pour un meilleur rendu de l'API
      const fullName = `${user.firstName} ${user.lastName}`;
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff&size=128&rounded=true&bold=true`;
    }
    return 'https://ui-avatars.com/api/?name=Guest&background=random&color=fff&size=128&rounded=true&bold=true';
  }


    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('firstName', formData.firstName);
        data.append('lastName', formData.lastName);
        data.append('email', formData.email);
        data.append('username', formData.username);
        data.append('bio', formData.bio);
        if (imageFile) data.append('image', imageFile);

        try {
            const config = { 
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data' 
                } 
            };
            await axios.put(`${API_URL}/api/auth/edit-profile/${user.id}`, data, config);
            
            alert("Profile updated! Please log in again to see all changes.");

            dispatch(logout())
            onClose();
            navigate('/login')
            
        } catch (err) {
            alert(err.response?.data?.message || "Error updating profile");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content profile-edit-modal">
                <div className="modal-header">
                    <h2>Edit Profile</h2>
                    <button onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                {/* 
                Formulaire pour mettre a jour L'avatar, 
                Le nom et Le prenom,  */}
                <form onSubmit={handleSubmit}>
                    {/* Section pour metre a jour l'avatar */}
                    <div className="edit-avatar-section">
                        <label htmlFor="avatar-edit" className="avatar-edit-label">
                            <img 
                                src={getAvatarSrc()} 
                                alt="Preview" 
                            />
                            <div className="camera-icon"><FaCamera /></div>
                        </label>
                        <input type="file" id="avatar-edit" hidden onChange={handleImageChange} accept="image/*" />
                    </div>

                    {/* Section pour metre a jour le nom ou le prenom */}
                    <div className="form-row">
                        <div className="input-group">
                            <label>Prénom</label>
                            <input type="text" onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
                        </div>
                        <div className="input-group">
                            <label>Nom</label>
                            <input type="text" onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
                        </div>
                    </div>

                    {/* Section pour metre a jour l'adresse email */}
                    <div className="input-group">
                        <label>Email</label>
                        <input type="email" onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>

                    {/* Section pour metre a jour la biographie */}
                    <div className="input-group">
                        <label>Biographie</label>
                        <textarea onChange={(e) => setFormData({...formData, bio: e.target.value})}></textarea>
                    </div>

                    <button type="submit" className="btn-save">Enregistrer</button>
                </form>
            </div>
        </div>
    );
};

// Export par défaut du composant
export default EditProfileModal;
