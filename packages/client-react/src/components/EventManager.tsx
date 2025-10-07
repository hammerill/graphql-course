import React, { useMemo, useState } from 'react';
import { 
  Settings, 
  Plus, 
  X, 
  BarChart3, 
  Bell,
  CheckCircle,
  Calendar,
  MapPin,
  Users,
  Type,
  Target,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react';
import Modal from './Modal';
import UserManager from './UserManager';
import { useMutation, useQuery } from '@apollo/client';
import { ADD_EVENT, DELETE_EVENT, GET_EVENTS, GET_USERS, UPDATE_EVENT } from '../queries';

interface EventFormData {
  title: string;
  start: string;
  end: string;
  organizerId: string;
  participantIds: string[];
}

interface DateRange {
  start: string;
  end: string;
}

interface EventUser {
  id: string;
  name: string;
}

interface GraphQLEvent {
  id: string;
  title: string;
  date: DateRange;
  organizer: EventUser;
  participants?: EventUser[];
}

interface EventWithMeta extends GraphQLEvent {
  description?: string;
  location?: string;
  category?: string;
  currentParticipants: number;
  maxParticipants?: number;
}

interface EventsData {
  events: GraphQLEvent[];
}

interface UsersData {
  users: EventUser[];
}

interface EventManagerProps {
  onEventCreated?: () => void;
  onEventUpdated?: () => void;
  onEventDeleted?: () => void;
}

const EventManager: React.FC<EventManagerProps> = ({ 
  onEventCreated, 
  onEventUpdated, 
  onEventDeleted 
}) => {
  const [activeSection, setActiveSection] = useState<'events' | 'users'>('events');
  const [showEventForm, setShowEventForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventWithMeta | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningEvent, setAssigningEvent] = useState<EventWithMeta | null>(null);
  const [assignParticipants, setAssignParticipants] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    start: '',
    end: '',
    organizerId: '',
    participantIds: []
  });

  const { data: eventsData, loading: eventsLoading, error: eventsError, refetch: refetchEvents } = useQuery<EventsData>(GET_EVENTS);
  const { data: usersData, loading: usersLoading, error: usersError } = useQuery<UsersData>(GET_USERS);

  const [addEvent, { loading: addEventLoading }] = useMutation(ADD_EVENT, {
    onCompleted: async () => {
      await refetchEvents();
      onEventCreated?.();
    }
  });

  const [updateEventMutation, { loading: updateEventLoading }] = useMutation(UPDATE_EVENT, {
    onCompleted: async () => {
      await refetchEvents();
      onEventUpdated?.();
    }
  });

  const [deleteEventMutation, { loading: deleteEventLoading }] = useMutation(DELETE_EVENT, {
    onCompleted: async () => {
      await refetchEvents();
      onEventDeleted?.();
    }
  });

  const users = usersData?.users ?? [];

  const mappedEvents: EventWithMeta[] = useMemo(() => {
    return (eventsData?.events ?? []).map((event) => ({
      ...event,
      description: event.title,
      location: 'Lieu non communiqué',
      category: 'Général',
      currentParticipants: event.participants?.length ?? 0,
      maxParticipants: undefined,
    }));
  }, [eventsData]);

  const formatDateTimeLocal = (value: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    const offset = date.getTimezoneOffset();
    const offsetDate = new Date(date.getTime() - offset * 60000);
    return offsetDate.toISOString().slice(0, 16);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, selectedOptions } = e.target;
    if (name === 'participantIds') {
      const values = Array.from(selectedOptions).map(option => option.value);
      setFormData(prev => ({
        ...prev,
        participantIds: values
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { title, start, end, organizerId, participantIds } = formData;
    if (!organizerId) {
      alert('Veuillez sélectionner un organisateur.');
      return;
    }

    try {
      await addEvent({
        variables: {
          input: {
            title,
            date: {
              start,
              end: end || start
            },
            organizerId,
            participantIds
          }
        }
      });

      alert('✅ Événement créé avec succès !');

      setFormData({
        title: '',
        start: '',
        end: '',
        organizerId: '',
        participantIds: []
      });
      setShowEventForm(false);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('❌ Erreur lors de la création de l\'événement.');
    }
  };

  const handleEditEvent = (event: EventWithMeta) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      start: formatDateTimeLocal(event.date.start),
      end: formatDateTimeLocal(event.date.end),
      organizerId: event.organizer.id,
      participantIds: (event.participants ?? []).map(participant => participant.id)
    });
    setShowEditModal(true);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) {
      return;
    }

    const { title, start, end, organizerId, participantIds } = formData;
    try {
      await updateEventMutation({
        variables: {
          id: editingEvent.id,
          input: {
            title,
            date: {
              start,
              end: end || start
            },
            organizerId,
            participantIds
          }
        }
      });

      alert('✅ Événement modifié avec succès !');
      setShowEditModal(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert('❌ Erreur lors de la modification de l\'événement.');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      return;
    }

    try {
      await deleteEventMutation({
        variables: { id: eventId }
      });

      alert('✅ Événement supprimé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('❌ Erreur lors de la suppression de l\'événement.');
    }
  };

  const handleAssignUsers = (event: EventWithMeta) => {
    setAssigningEvent(event);
    setAssignParticipants((event.participants ?? []).map(participant => participant.id));
    setShowAssignModal(true);
  };

  const handleAssignChange = (userId: string, checked: boolean) => {
    setAssignParticipants((prev) => {
      if (checked) {
        return prev.includes(userId) ? prev : [...prev, userId];
      }
      return prev.filter(id => id !== userId);
    });
  };

  const handleAssignSave = async () => {
    if (!assigningEvent) return;

    try {
      await updateEventMutation({
        variables: {
          id: assigningEvent.id,
          input: {
            participantIds: assignParticipants
          }
        }
      });

      alert('✅ Participants mis à jour !');
      setShowAssignModal(false);
      setAssigningEvent(null);
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      alert('❌ Erreur lors de la mise à jour des participants.');
    }
  };

  const isLoading = eventsLoading || usersLoading || addEventLoading || updateEventLoading || deleteEventLoading;
  const errorMessage = eventsError?.message ?? usersError?.message ?? '';

  if (isLoading && mappedEvents.length === 0) {
    return <div className="loading">Chargement de l’administration...</div>;
  }

  if (errorMessage && mappedEvents.length === 0) {
    return <div className="error">Erreur lors du chargement de l’administration : {errorMessage}</div>;
  }

  return (
    <div className="event-manager">
      <div className="manager-header">
        <h2>
          <Settings size={20} />
          Administration
        </h2>
        <span className="mock-data-indicator">Données GraphQL</span>
      </div>

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeSection === 'events' ? 'active' : ''}`}
          onClick={() => setActiveSection('events')}
        >
          <Calendar size={16} />
          Gestion des Événements
        </button>
        <button 
          className={`admin-tab ${activeSection === 'users' ? 'active' : ''}`}
          onClick={() => setActiveSection('users')}
        >
          <Users size={16} />
          Gestion des Utilisateurs
        </button>
      </div>

      {activeSection === 'events' && (
        <div className="events-management">
          <div className="manager-actions">
            <button 
              className="btn-create-event"
              onClick={() => setShowEventForm(!showEventForm)}
            >
              {showEventForm ? (
                <>
                  <X size={16} />
                  Annuler
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Nouvel Événement
                </>
              )}
            </button>
            
            <div className="admin-actions">
              <button className="btn-secondary" disabled>
                <BarChart3 size={16} />
                Statistiques (TODO: GraphQL)
              </button>
              <button className="btn-secondary" disabled>
                <Bell size={16} />
                Notifications (TODO: GraphQL)
              </button>
            </div>
          </div>

          {showEventForm && (
            <div className="event-form-container">
              <h3>Créer un nouvel événement</h3>
              <p className="form-help">
                💡 Créez un événement en sélectionnant un organisateur et des participants existants.
              </p>
              
              <form onSubmit={handleSubmit} className="event-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="title">
                      <Type size={16} />
                      Titre de l'événement *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Ex: Workshop GraphQL Avancé"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="date">
                      <Calendar size={16} />
                      Date *
                    </label>
                    <input
                      type="datetime-local"
                      id="date"
                      name="start"
                      value={formData.start}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="end">
                      <Calendar size={16} />
                      Date de fin
                    </label>
                    <input
                      type="datetime-local"
                      id="end"
                      name="end"
                      value={formData.end}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="organizerId">
                      <UserPlus size={16} />
                      Organisateur *
                    </label>
                    <select
                      id="organizerId"
                      name="organizerId"
                      value={formData.organizerId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Sélectionnez un organisateur</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="participantIds">
                      <Users size={16} />
                      Participants
                    </label>
                    <select
                      id="participantIds"
                      name="participantIds"
                      multiple
                      value={formData.participantIds}
                      onChange={handleInputChange}
                    >
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    <small>Sélectionnez plusieurs utilisateurs en maintenant Ctrl (Windows) ou ⌘ (Mac).</small>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-submit">
                    <CheckCircle size={16} />
                    Créer l'événement
                  </button>
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowEventForm(false)}
                  >
                    <X size={16} />
                    Annuler
                  </button>
                </div>
                
                <div className="form-todo">
                  <h4>
                    <Target size={16} />
                    TODOs pour les étudiants :
                  </h4>
                  <ul>
                    <li>Étendre le schéma pour gérer description, lieu et catégorie.</li>
                    <li>Ajouter des contrôles avancés (statut, capacité maximale, etc.).</li>
                    <li>Mettre en place une gestion d'erreurs plus poussée (toasts, retry).</li>
                    <li>Ajouter la recherche et la pagination des événements.</li>
                    <li>Implémenter la modification et la suppression complètes côté serveur.</li>
                  </ul>
                </div>
              </form>
            </div>
          )}

          {/* Liste des événements existants */}
          <div className="events-management-list">
            <h3>Événements existants ({mappedEvents.length})</h3>
            <div className="events-management-grid">
              {mappedEvents.map((event) => (
                <div key={event.id} className="event-management-card">
                  <div className="event-card-header">
                    <div>
                      <h4>{event.title}</h4>
                      <span className={`category-badge ${event.category?.toLowerCase() ?? 'general'}`}>
                        {event.category ?? 'Général'}
                      </span>
                    </div>
                    
                    <div className="event-actions-admin">
                      <button 
                        className="btn-icon btn-edit"
                        onClick={() => handleEditEvent(event)}
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon btn-assign"
                        onClick={() => handleAssignUsers(event)}
                        title="Gérer les participants"
                      >
                        <UserPlus size={16} />
                      </button>
                      <button 
                        className="btn-icon btn-delete"
                        onClick={() => handleDeleteEvent(event.id)}
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <p className="event-description">{event.description}</p>
                  
                  <div className="event-meta-mini">
                    <div className="meta-item">
                      <Calendar size={14} />
                      {new Date(event.date.start).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="meta-item">
                      <MapPin size={14} />
                      {event.location}
                    </div>
                    <div className="meta-item">
                      <Users size={14} />
                      {event.currentParticipants}
                      {typeof event.maxParticipants === 'number' ? `/${event.maxParticipants}` : ''} participants
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'users' && (
        <UserManager 
          onUserCreated={() => console.log('User created')}
          onUserUpdated={() => console.log('User updated')}
          onUserDeleted={() => console.log('User deleted')}
        />
      )}

      {/* Modal de modification d'événement */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingEvent(null);
        }}
        title="Modifier l'événement"
        size="large"
      >
        {editingEvent && (
          <form onSubmit={handleUpdateEvent} className="event-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-title">
                  <Type size={16} />
                  Titre de l'événement *
                </label>
                <input
                  type="text"
                  id="edit-title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-start">
                  <Calendar size={16} />
                  Date de début *
                </label>
                <input
                  type="datetime-local"
                  id="edit-start"
                  name="start"
                  value={formData.start}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-end">
                  <Calendar size={16} />
                  Date de fin
                </label>
                <input
                  type="datetime-local"
                  id="edit-end"
                  name="end"
                  value={formData.end}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-organizer">
                  <UserPlus size={16} />
                  Organisateur *
                </label>
                <select
                  id="edit-organizer"
                  name="organizerId"
                  value={formData.organizerId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Sélectionnez un organisateur</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-participantIds">
                  <Users size={16} />
                  Participants
                </label>
                <select
                  id="edit-participantIds"
                  name="participantIds"
                  multiple
                  value={formData.participantIds}
                  onChange={handleInputChange}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                <CheckCircle size={16} />
                Sauvegarder
              </button>
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => setShowEditModal(false)}
              >
                <X size={16} />
                Annuler
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal d'assignation d'utilisateurs */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setAssigningEvent(null);
          setAssignParticipants([]);
        }}
        title="Gérer les participants"
        size="large"
      >
        {assigningEvent && (
          <div className="assign-users-content">
            <h3>Événement: {assigningEvent.title}</h3>
            <div className="assign-users-list">
              {users.map((user) => {
                const checked = assignParticipants.includes(user.id);
                return (
                  <label key={user.id} className="assign-user-item">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => handleAssignChange(user.id, event.target.checked)}
                    />
                    <span>{user.name}</span>
                  </label>
                );
              })}
            </div>
            <div className="assign-actions">
              <button className="btn-submit" onClick={handleAssignSave}>
                <CheckCircle size={16} />
                Enregistrer
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowAssignModal(false);
                  setAssigningEvent(null);
                  setAssignParticipants([]);
                }}
              >
                <X size={16} />
                Annuler
              </button>
            </div>
            <small>💡 L'ajout ou la suppression de participants met immédiatement à jour l'événement via GraphQL.</small>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EventManager;
