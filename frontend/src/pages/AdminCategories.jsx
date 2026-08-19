// src/pages/AdminCategories.jsx
//
// Page d'administration des catégories : liste sous forme de cartes (icône
// colorée, nom, description, nombre de produits), création/modification via
// un formulaire avec un sélecteur de couleur natif + un champ texte pour la
// classe Font Awesome complète (ex: "fas fa-microchip"), suppression, et
// visualisation des produits associés à une catégorie.
//
// L'icône est stockée en base comme une simple chaîne de classe CSS Font
// Awesome (ex: "fas fa-microchip", "fab fa-github", "far fa-heart") et
// rendue avec une balise <i className="..."> — voir index.html pour le
// chargement de la police Font Awesome via CDN, nécessaire pour que ces
// classes s'affichent réellement comme des icônes.

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaTags, FaBoxOpen } from 'react-icons/fa';
import '../styles/Admin.css';
import { API_URL, getMediaUrl } from '../api/api';

const DEFAULT_ICON = 'fas fa-tag';
const DEFAULT_COLOR = '#6366f1';

// Univers disponibles — doit rester synchronisé avec l'enum du modèle
// backend (models/category.model.js -> universe).
const UNIVERSES = [
  { value: 'informatique', label: 'Informatique' },
  { value: 'vetements', label: 'Vêtements' },
  { value: 'electromenager', label: 'Électroménager' },
];

const emptyForm = {
  name: '', description: '', universe: 'informatique', parentId: '',
  icon: '', color: DEFAULT_COLOR,
};

const AdminCategories = () => {
  const { token } = useSelector((state) => state.auth);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal d'ajout / modification
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState(null);

  // Modal "produits de cette catégorie"
  const [viewingCategory, setViewingCategory] = useState(null);

  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/categories`);
      setCategories(data);
    } catch (error) {
      console.error("Erreur lors du chargement des catégories", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (cat) => {
    setEditingId(cat._id);
    setFormData({
      name: cat.name || '',
      description: cat.description || '',
      universe: cat.universe || 'informatique',
      parentId: cat.parentId?._id || cat.parentId || '',
      icon: cat.icon || '',
      color: cat.color || DEFAULT_COLOR,
    });
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // On n'envoie parentId que s'il est renseigné (chaîne vide -> pas de parent).
    const payload = {
      ...formData,
      parentId: formData.parentId || null,
    };

    try {
      if (editingId) {
        await axios.put(`${API_URL}/api/categories/${editingId}`, payload, config);
      } else {
        await axios.post(`${API_URL}/api/categories`, payload, config);
      }
      closeForm();
      fetchCategories();
    } catch (err) {
      // On affiche l'erreur DANS le formulaire plutôt qu'une alert() bloquante,
      // pour laisser la personne corriger sans perdre sa saisie.
      // err.response.data.error contient le détail technique renvoyé par
      // Mongoose (ex: quel champ précis a échoué la validation) — plus utile
      // que le message générique seul pour comprendre ce qui bloque.
      const data = err.response?.data;
      setFormError(data?.error || data?.message || err.message || "Erreur lors de l'enregistrement.");
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Supprimer la catégorie "${cat.name}" ?`)) return;
    try {
      await axios.delete(`${API_URL}/api/categories/${cat._id}`, config);
      fetchCategories();
    } catch (err) {
      // Le backend refuse la suppression si des produits ou sous-catégories
      // en dépendent encore, et renvoie un message clair — on l'affiche tel quel.
      alert(err.response?.data?.message || "Erreur lors de la suppression.");
    }
  };

  const handleViewProducts = async (cat) => {
    try {
      const { data } = await axios.get(`${API_URL}/api/categories/${cat._id}`);
      setViewingCategory(data);
    } catch (err) {
      alert("Impossible de charger les produits de cette catégorie.");
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1><FaTags /> Gestion des catégories</h1>
        <button onClick={openCreateForm} className="btn-add-product">
          <FaPlus /> Nouvelle catégorie
        </button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : categories.length === 0 ? (
        <p>Aucune catégorie pour le moment. Crée-en une pour pouvoir ajouter des produits.</p>
      ) : (
        <div className="category-grid">
          {categories.map((cat) => (
            <div key={cat._id} className="category-card">
              <div className="category-card-top-border" style={{ backgroundColor: cat.color || DEFAULT_COLOR }} />

              <div className="category-card-actions">
                <button className="category-action-btn" onClick={() => openEditForm(cat)} title="Modifier">
                  <FaEdit size={13} />
                </button>
                <button className="category-action-btn delete" onClick={() => handleDelete(cat)} title="Supprimer">
                  <FaTrash size={13} />
                </button>
              </div>

              <div className="category-card-body">
                <div
                  className="category-icon-badge"
                  style={{ backgroundColor: `${cat.color || DEFAULT_COLOR}22`, color: cat.color || DEFAULT_COLOR }}
                >
                  <i className={cat.icon || DEFAULT_ICON}></i>
                </div>

                <div className="category-card-name">{cat.name}</div>
                <div className="category-card-desc">{cat.description || 'Pas de description.'}</div>

                <button
                  className="category-count-badge"
                  onClick={() => handleViewProducts(cat)}
                  title="Voir les produits de cette catégorie"
                >
                  <FaBoxOpen /> {cat.productCount} produit{cat.productCount === 1 ? '' : 's'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'ajout / modification de catégorie */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
              <button onClick={closeForm}><FaTimes /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                type="text" placeholder="Nom de la catégorie" required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <div className="form-row">
                <select
                  value={formData.universe}
                  onChange={(e) => setFormData({ ...formData, universe: e.target.value })}
                >
                  {UNIVERSES.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>

                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                >
                  <option value="">Aucune (catégorie principale)</option>
                  {categories
                    .filter(c => c._id !== editingId) // une catégorie ne peut pas être son propre parent
                    .map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                </select>
              </div>

              {/* Sélecteur de couleur natif du navigateur — accès à toutes les
                  couleurs, pas juste une palette limitée. */}
              <label className="field-label">Couleur</label>
              <div className="color-picker-field">
                <input
                  type="color"
                  className="color-input-native"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
                {/* Aperçu en direct de l'icône avec la couleur choisie */}
                <div
                  className="icon-preview-badge"
                  style={{ backgroundColor: `${formData.color}22`, color: formData.color }}
                >
                  <i className={formData.icon || DEFAULT_ICON}></i>
                </div>
              </div>

              {/* Icône : classe Font Awesome complète tapée à la main —
                  donne accès à tout le catalogue Font Awesome plutôt qu'une
                  liste limitée d'icônes prédéfinies. */}
              <label className="field-label">Icône (classe Font Awesome complète)</label>
              <input
                type="text"
                placeholder="Ex: fas fa-microchip, fab fa-github, far fa-heart"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              />

              <textarea
                placeholder="Description (optionnel)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              {formError && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '-4px 0 10px' }}>{formError}</p>}

              <button type="submit" className="btn-save">
                {editingId ? 'Enregistrer les modifications' : 'Créer la catégorie'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal "produits de cette catégorie" */}
      {viewingCategory && (
        <div className="modal-overlay" onClick={() => setViewingCategory(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Produits — {viewingCategory.name}</h2>
              <button onClick={() => setViewingCategory(null)}><FaTimes /></button>
            </div>

            {viewingCategory.products && viewingCategory.products.length > 0 ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {viewingCategory.products.map((p) => (
                  <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                    <img
                      src={p.images && p.images[0] ? getMediaUrl(p.images[0]) : 'https://placeholder.com'}
                      alt={p.name}
                      style={{ width: '45px', height: '45px', objectFit: 'contain' }}
                    />
                    <div style={{ flex: 1 }}>
                      <strong>{p.name}</strong>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {p.price?.toLocaleString()} DA · {p.countInStock} en stock
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Aucun produit dans cette catégorie pour le moment.</p>
            )}
          </div>
        </div>
      )}

      <div className="quick-actions">
        <button className="btn-action-card" onClick={() => window.location.href = '/admin/products'}>
          Retour vers la gestion du stock
        </button>
      </div>
    </div>
  );
};

export default AdminCategories;
