import React from 'react';
import { 
  Calendar, 
  MapPin, 
  User, 
  Users, 
  Mail,
  UserPlus,
  UserMinus,
  Settings,
  Share2,
  Bookmark
} from 'lucide-react';

interface EventDetailsProps {
  event: {
    id: string;
    title: string;
    description?: string;
    date: {
      start: string;
      end: string;
    };
    location?: string;
    maxParticipants?: number;
    currentParticipants?: number;
    category?: string;
    organizer: {
      id: string;
      name: string;
      email?: string;
    };
    participants?: Array<{
      id: string;
      name: string;
      email?: string;
    }>;
  };
  currentUser?: {
    id: string;
    name: string;
  };
  isRegistered?: boolean;
  onRegister?: () => void;
  onUnregister?: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({
  event,
  currentUser,
  isRegistered = false,
  onRegister,
  onUnregister
}) => {
  const participants = event.participants ?? [];
  const participantCount = event.currentParticipants ?? participants.length;
  const maxParticipants = event.maxParticipants ?? (participantCount > 0 ? participantCount : undefined);
  const capacity = maxParticipants ?? participantCount ?? 0;
  const hasCapacity = typeof maxParticipants === 'number';
  const availableSpots = hasCapacity ? Math.max((maxParticipants ?? 0) - participantCount, 0) : undefined;
  const isOrganizer = currentUser?.id === event.organizer.id;
  const isFull = hasCapacity ? (availableSpots ?? 0) <= 0 : false;
  const categoryLabel = event.category ?? 'General';
  const categoryClass = categoryLabel.toLowerCase().replace(/\s+/g, '-');
  const startDate = event.date?.start ? new Date(event.date.start) : null;
  const endDate = event.date?.end ? new Date(event.date.end) : null;
  const dateRangeLabel =
    startDate && endDate
      ? `${startDate.toLocaleString('fr-FR')} - ${endDate.toLocaleString('fr-FR')}`
      : startDate
        ? startDate.toLocaleString('fr-FR')
        : 'Date non communiquée';
  const progress = hasCapacity && maxParticipants
    ? Math.min((participantCount / maxParticipants) * 100, 100)
    : 100;

  return (
    <div className="event-details">
      <div className="event-details-header">
        <div className="event-title-section">
          <h1>{event.title}</h1>
          <span className={`category-badge ${categoryClass}`}>
            {categoryLabel}
          </span>
        </div>
        
        <div className="event-actions-header">
          {!isOrganizer && (
            <>
              {isRegistered ? (
                <button 
                  className="btn-danger" 
                  onClick={onUnregister}
                  disabled
                >
                  <UserMinus size={16} />
                  Se désinscrire (TODO: GraphQL)
                </button>
              ) : (
                <button 
                  className="btn-primary" 
                  onClick={onRegister}
                  disabled={isFull}
                >
                  <UserPlus size={16} />
                  {isFull ? 'Complet' : 'S\'inscrire'} (TODO: GraphQL)
                </button>
              )}
            </>
          )}
          
          <button className="btn-secondary" disabled>
            <Share2 size={16} />
            Partager (TODO: GraphQL)
          </button>
          
          <button className="btn-secondary" disabled>
            <Bookmark size={16} />
            Sauvegarder (TODO: GraphQL)
          </button>
          
          {isOrganizer && (
            <button className="btn-secondary" disabled>
              <Settings size={16} />
              Gérer (TODO: GraphQL)
            </button>
          )}
        </div>
      </div>

      <div className="event-details-content">
        <div className="event-info-section">
          <h3>Description</h3>
          <p className="event-description">{event.description ?? 'Description non disponible'}</p>
          
          <div className="event-meta">
            <div className="meta-item">
              <Calendar size={20} />
              <div>
                <strong>Date et heure</strong>
                <p>{dateRangeLabel}</p>
              </div>
            </div>
            
            <div className="meta-item">
              <MapPin size={20} />
              <div>
                <strong>Lieu</strong>
                <p>{event.location ?? 'Lieu non communiqué'}</p>
              </div>
            </div>
            
            <div className="meta-item">
              <User size={20} />
              <div>
                <strong>Organisateur</strong>
                <p>{event.organizer.name}</p>
                <p className="organizer-email">
                  <Mail size={14} />
                  {event.organizer.email ?? 'Email non communiqué'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="participants-section">
          <div className="participants-header">
            <h3>
              <Users size={20} />
              Participants
              {hasCapacity
                ? ` (${participantCount}/${capacity})`
                : ` (${participantCount})`}
            </h3>
            <span className="spots-indicator">
              {hasCapacity ? (
                availableSpots && availableSpots > 0 ? (
                  <span className="available">
                    {availableSpots} place{availableSpots > 1 ? 's' : ''} disponible{availableSpots > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="full">Complet</span>
                )
              ) : (
                <span className="available">Capacité libre</span>
              )}
            </span>
          </div>
          
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="participants-list">
            {participants.length === 0 && (
              <div className="empty-participants">
                Aucun participant pour le moment.
              </div>
            )}
            {participants.map((participant) => (
              <div key={participant.id} className="participant-item">
                <div className="participant-avatar">
                  <User size={16} />
                </div>
                <div className="participant-info">
                  <span className="participant-name">{participant.name}</span>
                  <span className="participant-email">
                    {participant.email ?? 'Email non communiqué'}
                  </span>
                </div>
                {isOrganizer && (
                  <button className="btn-remove-participant" disabled>
                    <UserMinus size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
