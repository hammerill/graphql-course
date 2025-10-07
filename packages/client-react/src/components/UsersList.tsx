import React, { useMemo, useState } from 'react';
import { 
  Users, 
  Mail, 
  Calendar, 
  Search, 
  Filter,
  User,
  MessageCircle,
  Eye,
  Award,
  Activity
} from 'lucide-react';
import Modal from './Modal';
import UserDetails from './UserDetails';
import { useQuery } from '@apollo/client';
import { GET_EVENTS, GET_USERS } from '../queries';

interface User {
  id: string;
  name: string;
  email?: string;
  role?: string;
  eventsOrganized?: number;
  eventsAttended?: number;
  joinDate?: string;
}

interface UsersData {
  users: User[];
}

interface EventUser {
  id: string;
  name: string;
}

interface Event {
  id: string;
  title: string;
  date: {
    start: string;
    end: string;
  };
  organizer: EventUser;
  participants?: EventUser[];
}

interface EventsData {
  events: Event[];
}

const UsersList: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { loading: usersLoading, error: usersError, data: usersData } = useQuery<UsersData>(GET_USERS);
  const { loading: eventsLoading, error: eventsError, data: eventsData } = useQuery<EventsData>(GET_EVENTS);

  const isLoading = usersLoading || eventsLoading;
  const errorMessage = usersError?.message ?? eventsError?.message ?? '';

  const events = eventsData?.events ?? [];
  const rawUsers = usersData?.users ?? [];

  const userActivity = useMemo(() => {
    const stats = new Map<string, { organized: number; attended: number }>();

    events.forEach((event) => {
      const organizerStats = stats.get(event.organizer.id) ?? { organized: 0, attended: 0 };
      organizerStats.organized += 1;
      stats.set(event.organizer.id, organizerStats);

      event.participants?.forEach((participant) => {
        const participantStats = stats.get(participant.id) ?? { organized: 0, attended: 0 };
        participantStats.attended += 1;
        stats.set(participant.id, participantStats);
      });
    });

    return stats;
  }, [events]);

  const users = rawUsers.map((user) => {
    const activity = userActivity.get(user.id) ?? { organized: 0, attended: 0 };
    const role = activity.organized > activity.attended ? 'Organisateur' : 'Participant';
    return {
      ...user,
      role,
      eventsOrganized: activity.organized,
      eventsAttended: activity.attended,
    };
  });

  if (isLoading) {
    return <div className="loading">Chargement des utilisateurs...</div>;
  }

  if (errorMessage) {
    return <div className="error">Erreur lors du chargement des utilisateurs : {errorMessage}</div>;
  }

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSendMessage = () => {
    // TODO: Implémenter l'envoi de message via GraphQL
    console.log('TODO: Envoi message GraphQL');
  };

  return (
    <div className="users-list">
      <div className="section-header">
        <h2>
          <Users size={20} />
          Utilisateurs
        </h2>
        <span className="mock-data-indicator">Données GraphQL</span>
      </div>
      
      {/* TODO: Ajouter ici des filtres pour les utilisateurs avec GraphQL */}
      <div className="filters-placeholder">
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Rechercher un utilisateur... (TODO: GraphQL)"
            className="search-input"
            disabled
          />
        </div>
        <div className="filter-container">
          <Filter size={16} />
          <select className="filter-select" disabled>
            <option>Tous les rôles (TODO: GraphQL)</option>
          </select>
        </div>
      </div>

      <div className="users-grid">
        {users.map((user) => {
          const role = user.role ?? 'Membre';
          const roleClass = role.toLowerCase().replace(/\s+/g, '-');
          const joinDateLabel = user.joinDate
            ? new Date(user.joinDate).toLocaleDateString('fr-FR')
            : 'Date inconnue';
          const email = user.email ?? 'Email non communiqué';

          return (
            <div key={user.id} className="user-card">
              <div className="user-header">
                <div className="user-avatar">
                  <User size={20} />
                  <span className="avatar-text">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="user-info">
                  <h3>{user.name}</h3>
                  <span className={`role-badge ${roleClass}`}>
                    {role === 'Organisateur' ? <Award size={12} /> : <Activity size={12} />}
                    {role}
                  </span>
                </div>
              </div>
              
              <div className="user-details">
                <div className="detail-item">
                  <Mail size={14} />
                  <span>{email}</span>
                </div>
                <div className="detail-item">
                  <Calendar size={14} />
                  <span>Membre depuis {joinDateLabel}</span>
                </div>
                
                <div className="user-stats">
                  <div className="stat-item">
                    <div className="stat-icon">
                      <Award size={16} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number">{user.eventsOrganized ?? 0}</span>
                      <span className="stat-label">Organisés</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">
                      <Activity size={16} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number">{user.eventsAttended ?? 0}</span>
                      <span className="stat-label">Participés</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="user-actions">
                <button className="btn-primary" disabled>
                  <MessageCircle size={16} />
                  Contacter (TODO: GraphQL)
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => handleViewProfile(user)}
                >
                  <Eye size={16} />
                  Profil
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal pour les détails de l'utilisateur */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Profil utilisateur"
        size="large"
      >
        {selectedUser && (
          <UserDetails
            user={selectedUser}
            currentUser={{ id: 'current-user', name: 'Utilisateur actuel' }}
            isCurrentUser={false}
            onSendMessage={handleSendMessage}
          />
        )}
      </Modal>
    </div>
  );
};

export default UsersList;
