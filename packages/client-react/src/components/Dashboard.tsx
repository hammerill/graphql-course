import React, { useMemo } from 'react';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock,
  MapPin,
  UserPlus,
  CalendarPlus,
  Activity
} from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GET_EVENTS, GET_USERS } from '../queries';

interface DashboardStats {
  totalEvents: number;
  totalUsers: number;
  activeEvents: number;
  upcomingEvents: number;
  totalParticipants: number;
  averageParticipation: number;
}

interface DateRange {
  start: string;
  end: string;
}

interface EventUser {
  id: string;
  name: string;
}

interface Event {
  id: string;
  title: string;
  date: DateRange;
  organizer: EventUser;
  participants?: EventUser[];
  maxParticipants?: number;
  category?: string;
}

interface EventsData {
  events: Event[];
}

interface User {
  id: string;
  name: string;
}

interface UsersData {
  users: User[];
}

const Dashboard: React.FC = () => {
  const { data: eventsData, loading: eventsLoading, error: eventsError } = useQuery<EventsData>(GET_EVENTS);
  const { data: usersData, loading: usersLoading, error: usersError } = useQuery<UsersData>(GET_USERS);

  const isLoading = eventsLoading || usersLoading;
  const errorMessage = eventsError?.message ?? usersError?.message ?? '';

  const events = eventsData?.events ?? [];
  const users = usersData?.users ?? [];

  const userNameLookup = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((user) => map.set(user.id, user.name));
    return map;
  }, [users]);

  const stats: DashboardStats = useMemo(() => {
    const now = new Date();
    let totalParticipants = 0;
    let activeEvents = 0;
    let upcomingEvents = 0;

    events.forEach((event) => {
      const start = event.date?.start ? new Date(event.date.start) : null;
      const end = event.date?.end ? new Date(event.date.end) : null;
      const participantsCount = event.participants?.length ?? 0;
      totalParticipants += participantsCount;

      if (start && end) {
        if (start <= now && end >= now) {
          activeEvents += 1;
        }
      }

      if (start && start > now) {
        upcomingEvents += 1;
      }
    });

    const totalEvents = events.length;
    const averageParticipation = totalEvents > 0 ? Math.round(totalParticipants / totalEvents) : 0;

    return {
      totalEvents,
      totalUsers: users.length,
      activeEvents,
      upcomingEvents,
      totalParticipants,
      averageParticipation
    };
  }, [events, users]);

  const recentEvents = useMemo(() => {
    const now = new Date();
    return [...events]
      .sort((a, b) => {
        const aDate = a.date?.start ? new Date(a.date.start).getTime() : 0;
        const bDate = b.date?.start ? new Date(b.date.start).getTime() : 0;
        return aDate - bDate;
      })
      .slice(0, 3)
      .map((event) => {
        const start = event.date?.start ? new Date(event.date.start) : null;
        const end = event.date?.end ? new Date(event.date.end) : null;
        const status =
          start && end && start <= now && end >= now
            ? 'active'
            : start && start > now
              ? 'upcoming'
              : 'past';
        return {
          ...event,
          start,
          end,
          status,
          participantsCount: event.participants?.length ?? 0,
        };
      });
  }, [events]);

  const activeUsers = useMemo(() => {
    const activity = new Map<string, { id: string; name: string; organized: number; attended: number }>();

    const ensureActivity = (userId: string, fallbackName: string) => {
      if (!activity.has(userId)) {
        activity.set(userId, {
          id: userId,
          name: userNameLookup.get(userId) ?? fallbackName,
          organized: 0,
          attended: 0
        });
      }
      return activity.get(userId)!;
    };

    events.forEach((event) => {
      const organizer = ensureActivity(event.organizer.id, event.organizer.name);
      organizer.organized += 1;

      event.participants?.forEach((participant) => {
        const participantEntry = ensureActivity(participant.id, participant.name);
        participantEntry.attended += 1;
      });
    });

    return [...activity.values()]
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        role: entry.organized >= entry.attended ? 'Organisateur' : 'Participant',
        eventsCount: entry.organized + entry.attended,
      }))
      .sort((a, b) => b.eventsCount - a.eventsCount)
      .slice(0, 3);
  }, [events, userNameLookup]);

  if (isLoading) {
    return <div className="loading">Chargement du tableau de bord...</div>;
  }

  if (errorMessage) {
    return <div className="error">Erreur lors du chargement du tableau de bord : {errorMessage}</div>;
  }

  const StatCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: string | number;
    subtitle: string;
    trend?: 'up' | 'down' | 'stable';
  }> = ({ icon, title, value, subtitle, trend = 'stable' }) => (
    <div className="stat-card">
      <div className="stat-icon">
        {icon}
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-title">{title}</div>
        <div className="stat-subtitle">
          {subtitle}
          {trend !== 'stable' && (
            <TrendingUp 
              size={12} 
              className={`trend-icon ${trend === 'up' ? 'trend-up' : 'trend-down'}`}
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Vue d'ensemble de votre plateforme d'événements</p>
        </div>
        <div className="header-actions">
          <span className="mock-data-indicator">Données GraphQL</span>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="stats-grid">
        <StatCard
          icon={<Calendar />}
          title="Événements totaux"
          value={stats.totalEvents}
          subtitle="Tous les événements"
          trend="up"
        />
        <StatCard
          icon={<Users />}
          title="Utilisateurs actifs"
          value={stats.totalUsers}
          subtitle="Membres inscrits"
          trend="up"
        />
        <StatCard
          icon={<Activity />}
          title="Événements actifs"
          value={stats.activeEvents}
          subtitle="En cours"
        />
        <StatCard
          icon={<Clock />}
          title="À venir"
          value={stats.upcomingEvents}
          subtitle="Prochains événements"
        />
      </div>

      <div className="dashboard-content">
        {/* Événements récents */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>
              <Calendar size={20} />
              Événements récents
            </h2>
            <button className="btn-secondary" disabled>
              Voir tous (TODO: GraphQL)
            </button>
          </div>
          
          <div className="events-summary">
            {recentEvents.map((event) => (
              <div key={event.id} className="event-summary-card">
                <div className="event-summary-header">
                  <h3>{event.title}</h3>
                  <span className={`status-badge ${event.status}`}>
                    {event.status === 'active' ? 'En cours' : event.status === 'upcoming' ? 'À venir' : 'Passé'}
                  </span>
                </div>
                <div className="event-summary-details">
                  <div className="detail-item">
                    <Clock size={14} />
                    {event.start ? event.start.toLocaleDateString('fr-FR') : 'Date inconnue'}
                  </div>
                  <div className="detail-item">
                    <Users size={14} />
                    {event.participantsCount}
                    {event.maxParticipants ? `/${event.maxParticipants}` : ''} participants
                  </div>
                </div>
                <div className="participation-bar">
                  <div 
                    className="participation-fill"
                    style={{
                      width: event.maxParticipants
                        ? `${Math.min((event.participantsCount / event.maxParticipants) * 100, 100)}%`
                        : '100%'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Utilisateurs actifs */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>
              <Users size={20} />
              Utilisateurs actifs
            </h2>
            <button className="btn-secondary" disabled>
              Gérer (TODO: GraphQL)
            </button>
          </div>
                  
          <div className="users-summary">
            {activeUsers.map((user) => (
              <div key={user.id} className="user-summary-card">
                <div className="user-summary-avatar">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="user-summary-info">
                  <h4>{user.name}</h4>
                  <span className={`role-badge ${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                  <p>{user.eventsCount} participation{user.eventsCount > 1 ? 's' : ''}</p>
                </div>
                <div className="user-summary-actions">
                  <button className="btn-icon" disabled title="Voir profil (TODO: GraphQL)">
                    <Users size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="quick-actions">
        <h2>Actions rapides</h2>
        <div className="actions-grid">
          <button className="action-card" disabled>
            <CalendarPlus size={24} />
            <span>Créer un événement</span>
            <small>TODO: GraphQL</small>
          </button>
          <button className="action-card" disabled>
            <UserPlus size={24} />
            <span>Inviter des utilisateurs</span>
            <small>TODO: GraphQL</small>
          </button>
          <button className="action-card" disabled>
            <MapPin size={24} />
            <span>Gérer les lieux</span>
            <small>TODO: GraphQL</small>
          </button>
          <button className="action-card" disabled>
            <TrendingUp size={24} />
            <span>Voir les analytics</span>
            <small>TODO: GraphQL</small>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
