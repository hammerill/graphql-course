import React, { useMemo, useState } from 'react';
import { 
  Users, 
  Plus, 
  X, 
  User,
  Shield,
  CheckCircle,
  Edit,
  Trash2,
  Search
} from 'lucide-react';
import Modal from './Modal';
import { useMutation, useQuery } from '@apollo/client';
import { ADD_USER, DELETE_USER, GET_USERS, UPDATE_USER } from '../queries';

interface UserFormData {
  name: string;
  password: string;
}

interface User {
  id: string;
  name: string;
}

interface UserManagerProps {
  onUserCreated?: () => void;
  onUserUpdated?: () => void;
  onUserDeleted?: () => void;
}

const UserManager: React.FC<UserManagerProps> = ({ 
  onUserCreated, 
  onUserUpdated, 
  onUserDeleted 
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [createForm, setCreateForm] = useState<UserFormData>({
    name: '',
    password: ''
  });

  const [editForm, setEditForm] = useState<UserFormData>({
    name: '',
    password: ''
  });

  const { data: usersData, loading: usersLoading, error: usersError, refetch: refetchUsers } = useQuery<{ users: User[] }>(GET_USERS);

  const [addUser, { loading: addUserLoading }] = useMutation(ADD_USER, {
    onCompleted: async () => {
      await refetchUsers();
      onUserCreated?.();
    }
  });

  const [updateUserMutation, { loading: updateUserLoading }] = useMutation(UPDATE_USER, {
    onCompleted: async () => {
      await refetchUsers();
      onUserUpdated?.();
    }
  });

  const [deleteUserMutation, { loading: deleteUserLoading }] = useMutation(DELETE_USER, {
    onCompleted: async () => {
      await refetchUsers();
      onUserDeleted?.();
    }
  });

  const users = usersData?.users ?? [];

  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createForm.name || !createForm.password) {
      alert('Veuillez renseigner un nom et un mot de passe.');
      return;
    }

    try {
      await addUser({
        variables: {
          input: {
            name: createForm.name,
            password: createForm.password
          }
        }
      });

      alert('✅ Utilisateur créé avec succès !');

      setCreateForm({
        name: '',
        password: ''
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('❌ Erreur lors de la création de l\'utilisateur.');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      password: ''
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const input: { name?: string; password?: string } = {};
      if (editForm.name && editForm.name !== editingUser.name) {
        input.name = editForm.name;
      }
      if (editForm.password) {
        input.password = editForm.password;
      }

      await updateUserMutation({
        variables: {
          id: editingUser.id,
          input
        }
      });

      alert('✅ Utilisateur modifié avec succès !');
      setShowEditModal(false);
      setEditingUser(null);
      setEditForm({ name: '', password: '' });
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert('❌ Erreur lors de la modification de l\'utilisateur.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      await deleteUserMutation({
        variables: { id: userId }
      });

      alert('✅ Utilisateur supprimé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('❌ Erreur lors de la suppression de l\'utilisateur.');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const isLoading = usersLoading || addUserLoading || updateUserLoading || deleteUserLoading;
  const errorMessage = usersError?.message ?? '';

  if (isLoading && users.length === 0) {
    return <div className="loading">Chargement des utilisateurs...</div>;
  }

  if (errorMessage && users.length === 0) {
    return <div className="error">Erreur lors du chargement des utilisateurs : {errorMessage}</div>;
  }

  return (
    <div className="user-manager">
      <div className="manager-header">
        <h3>
          <Users size={20} />
          Gestion des Utilisateurs
        </h3>
        <span className="mock-data-indicator">Données GraphQL</span>
        {isLoading && users.length > 0 && (
          <span className="loading-indicator">Mise à jour...</span>
        )}
      </div>

      <div className="manager-actions">
        <button 
          className="btn-create-user"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? (
            <>
              <X size={16} />
              Annuler
            </>
          ) : (
            <>
              <Plus size={16} />
              Nouvel Utilisateur
            </>
          )}
        </button>
        
        <div className="user-filters">
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {showCreateForm && (
        <div className="user-form-container">
          <h4>Créer un nouvel utilisateur</h4>
          <p className="form-help">
            💡 Le serveur requiert uniquement un <strong>nom</strong> et un <strong>mot de passe</strong>.
          </p>
          
          <form onSubmit={handleCreateUser} className="user-form">
            <div className="form-group">
              <label htmlFor="name">
                <User size={16} />
                Nom complet *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={createForm.name}
                onChange={handleCreateInputChange}
                placeholder="Ex: Jean Dupont"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <Shield size={16} />
                Mot de passe *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={createForm.password}
                onChange={handleCreateInputChange}
                placeholder="Définissez un mot de passe"
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={addUserLoading}>
                <CheckCircle size={16} />
                {addUserLoading ? 'Création...' : "Créer l'utilisateur"}
              </button>
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateForm({ name: '', password: '' });
                }}
              >
                <X size={16} />
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="users-table">
        <div className="table-header">
          <h4>Utilisateurs ({filteredUsers.length})</h4>
        </div>
        
        <div className="users-grid">
          {filteredUsers.map((user) => (
            <div key={user.id} className="user-management-card">
              <div className="user-card-header">
                <div className="user-info">
                  <div className="user-avatar">
                    <User size={20} />
                  </div>
                  <div>
                    <h5>{user.name}</h5>
                    <p className="user-meta">ID: {user.id}</p>
                    <span className="role-badge membre">
                      Compte GraphQL
                    </span>
                  </div>
                </div>
                
                <div className="user-actions">
                  <button 
                    className="btn-icon btn-edit"
                    onClick={() => handleEditUser(user)}
                    title="Modifier"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className="btn-icon btn-delete"
                    onClick={() => handleDeleteUser(user.id)}
                    title="Supprimer"
                    disabled={deleteUserLoading}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="empty-state">
              Aucun utilisateur ne correspond à votre recherche.
            </div>
          )}
        </div>
      </div>

      {/* Modal de modification */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
          setEditForm({ name: '', password: '' });
        }}
        title="Modifier l'utilisateur"
        size="medium"
      >
        {editingUser && (
          <form onSubmit={handleUpdateUser} className="user-form">
            <div className="form-group">
              <label htmlFor="edit-name">
                <User size={16} />
                Nom complet *
              </label>
              <input
                type="text"
                id="edit-name"
                name="name"
                value={editForm.name}
                onChange={handleEditInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-password">
                <Shield size={16} />
                Nouveau mot de passe
              </label>
              <input
                type="password"
                id="edit-password"
                name="password"
                value={editForm.password}
                onChange={handleEditInputChange}
                placeholder="Laissez vide pour conserver l'ancien"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={updateUserLoading}>
                <CheckCircle size={16} />
                {updateUserLoading ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  setEditForm({ name: '', password: '' });
                }}
              >
                <X size={16} />
                Annuler
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default UserManager;
