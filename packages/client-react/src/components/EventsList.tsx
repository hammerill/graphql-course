import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  User, 
  Search, 
  Filter,
  UserPlus,
  Eye
} from 'lucide-react';
import Modal from './Modal';
import EventDetails from './EventDetails';
import { useQuery } from '@apollo/client';
import { GET_EVENTS } from '../queries';

interface DateRange {
  start: string;
  end: string;
}

interface EventUser {
  id: string;
  name: string;
  email?: string;
}

interface Event {
  id: string;
  title: string;
  date: DateRange;
  organizer: EventUser;
  participants?: EventUser[];
  description?: string;
  location?: string;
  category?: string;
  maxParticipants?: number;
  currentParticipants?: number;
}

interface EventsData {
  events: Event[];
}

const EventsList: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { loading, error, data } = useQuery<EventsData>(GET_EVENTS);

  if (loading) {
    return <div className="loading">Chargement des événements...</div>;
  }

  if (error) {
    return <div className="error">Erreur lors du chargement des événements : {error.message}</div>;
  }

  const events = data?.events ?? [];

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleRegister = () => {
    // TODO: Implémenter l'inscription via GraphQL
    console.log('TODO: Inscription GraphQL');
  };

  return (
    <div className="events-list">
      <div className="section-header">
        <h2>
          <Calendar size={20} />
          Événements
        </h2>
        <span className="mock-data-indicator">Données GraphQL</span>
      </div>
      
      {/* TODO: Ajouter ici des filtres et recherche avec GraphQL */}
      <div className="filters-placeholder">
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Rechercher un événement... (TODO: GraphQL)"
            className="search-input"
            disabled
          />
        </div>
        <div className="filter-container">
          <Filter size={16} />
          <select className="filter-select" disabled>
            <option>Toutes les catégories (TODO: GraphQL)</option>
          </select>
        </div>
      </div>

      <div className="events-grid">
        {events.map((event) => {
          const participantsCount = event.participants?.length ?? event.currentParticipants ?? 0;
          const capacity = event.maxParticipants ?? (participantsCount > 0 ? participantsCount : 1);
          const safeCapacity = capacity === 0 ? 1 : capacity;
          const progress = Math.min((participantsCount / safeCapacity) * 100, 100);
          const categoryLabel = event.category ?? 'General';
          const categoryClass = categoryLabel.toLowerCase().replace(/\s+/g, '-');
          const startDate = event.date?.start ? new Date(event.date.start) : null;
          const endDate = event.date?.end ? new Date(event.date.end) : null;
          const dateLabel = startDate
            ? startDate.toLocaleDateString('fr-FR')
            : 'Date non communiquée';
          const dateRangeLabel =
            startDate && endDate
              ? `${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}`
              : dateLabel;

          return (
            <div key={event.id} className="event-card">
              <div className="event-header">
                <h3>{event.title}</h3>
                <span className={`category-badge ${categoryClass}`}>
                  {categoryLabel}
                </span>
              </div>
              
              <p className="event-description">
                {event.description ?? 'Description non disponible'}
              </p>
              
              <div className="event-details">
                <div className="detail-item">
                  <Calendar size={16} />
                  <span>{dateRangeLabel}</span>
                </div>
                <div className="detail-item">
                  <MapPin size={16} />
                  <span>{event.location ?? 'Lieu non communiqué'}</span>
                </div>
                <div className="detail-item">
                  <User size={16} />
                  <span>{event.organizer.name}</span>
                </div>
                
                <div className="participants-info">
                  <div className="participants-header">
                    <Users size={16} />
                    <span className="participants-text">
                      {participantsCount}
                      {event.maxParticipants ? `/${event.maxParticipants}` : ''} participants
                    </span>
                  </div>
                  <div className="participants-bar">
                    <div 
                      className="participants-progress" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="event-actions">
                <button className="btn-primary" disabled>
                  <UserPlus size={16} />
                  S'inscrire (TODO: GraphQL)
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => handleViewDetails(event)}
                >
                  <Eye size={16} />
                  Détails
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal pour les détails de l'événement */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Détails de l'événement"
        size="large"
      >
        {selectedEvent && (
          <EventDetails
            event={selectedEvent}
            currentUser={{ id: 'current-user', name: 'Utilisateur actuel' }}
            isRegistered={false}
            onRegister={handleRegister}
          />
        )}
      </Modal>
    </div>
  );
};

export default EventsList;
