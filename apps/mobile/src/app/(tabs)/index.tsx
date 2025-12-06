import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentsApi, gamificationApi, notificationsApi } from '../../lib/api';
import type { Appointment, GamificationProfile, Notification } from '../../types';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [gamification, setGamification] = useState<GamificationProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadData = async () => {
    try {
      const [appointmentsRes, gamificationRes, notificationsRes] = await Promise.all([
        appointmentsApi.list({ upcoming: true }),
        gamificationApi.getProfile(),
        notificationsApi.list(),
      ]);

      const appointments = (appointmentsRes as { data: Appointment[] }).data || [];
      setNextAppointment(appointments[0] || null);
      setGamification(gamificationRes as GamificationProfile);
      setNotifications(((notificationsRes as { data: Notification[] }).data || []).slice(0, 3));
    } catch (error) {
      console.error('Error loading home data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#22c55e']} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Olá,</Text>
        <Text style={styles.userName}>{user?.socialName || user?.fullName?.split(' ')[0]}! 👋</Text>
      </View>

      {/* Gamification Card */}
      {gamification && (
        <TouchableOpacity
          style={styles.gamificationCard}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <View style={styles.gamificationHeader}>
            <View>
              <Text style={styles.gamificationLevel}>Nível {gamification.level}</Text>
              <Text style={styles.gamificationXp}>
                {gamification.currentXp} / {gamification.xpToNextLevel} XP
              </Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakText}>{gamification.streak} dias</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(gamification.currentXp / gamification.xpToNextLevel) * 100}%`,
                },
              ]}
            />
          </View>
          <View style={styles.badgesRow}>
            {gamification.badges.slice(0, 4).map((badge) => (
              <View key={badge.id} style={styles.badgeIcon}>
                <Text style={styles.badgeEmoji}>{badge.icon}</Text>
              </View>
            ))}
            {gamification.badges.length > 4 && (
              <View style={[styles.badgeIcon, styles.badgeMore]}>
                <Text style={styles.badgeMoreText}>+{gamification.badges.length - 4}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* Next Appointment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Próxima Consulta</Text>
        {nextAppointment ? (
          <TouchableOpacity
            style={styles.appointmentCard}
            onPress={() => router.push('/(tabs)/appointments')}
          >
            <View style={styles.appointmentIcon}>
              <Text style={styles.appointmentEmoji}>
                {nextAppointment.type === 'TELEMEDICINE' ? '📹' : '🏥'}
              </Text>
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={styles.appointmentDoctor}>
                Dr(a). {nextAppointment.doctor?.fullName}
              </Text>
              <Text style={styles.appointmentSpecialty}>
                {nextAppointment.doctor?.specialty}
              </Text>
              <Text style={styles.appointmentDate}>
                {formatDate(nextAppointment.scheduledAt)}
              </Text>
              <Text style={styles.appointmentTime}>
                {formatTime(nextAppointment.scheduledAt)}
              </Text>
            </View>
            <View style={styles.appointmentBadge}>
              <Text style={styles.appointmentBadgeText}>
                {nextAppointment.type === 'TELEMEDICINE' ? 'Online' : 'Presencial'}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>Nenhuma consulta agendada</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(tabs)/appointments')}
            >
              <Text style={styles.emptyButtonText}>Ver agenda</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acesso Rapido</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/prescriptions')}
          >
            <Text style={styles.quickActionIcon}>💊</Text>
            <Text style={styles.quickActionLabel}>Receitas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/exams')}
          >
            <Text style={styles.quickActionIcon}>🔬</Text>
            <Text style={styles.quickActionLabel}>Exames</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/health')}
          >
            <Text style={styles.quickActionIcon}>❤️</Text>
            <Text style={styles.quickActionLabel}>Minha Saude</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/telemedicine')}
          >
            <Text style={styles.quickActionIcon}>📹</Text>
            <Text style={styles.quickActionLabel}>Telemedicina</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/notifications')}
          >
            <Text style={styles.quickActionIcon}>🔔</Text>
            <Text style={styles.quickActionLabel}>Notificacoes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.quickActionIcon}>🏆</Text>
            <Text style={styles.quickActionLabel}>Conquistas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificações</Text>
          {notifications.map((notification) => (
            <View key={notification.id} style={styles.notificationItem}>
              <View
                style={[
                  styles.notificationDot,
                  !notification.isRead && styles.notificationDotUnread,
                ]}
              />
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationBody} numberOfLines={2}>
                  {notification.body}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  welcomeSection: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#64748b',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  gamificationCard: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  gamificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gamificationLevel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  gamificationXp: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  streakBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  streakText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeEmoji: {
    fontSize: 18,
  },
  badgeMore: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  badgeMoreText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appointmentEmoji: {
    fontSize: 24,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentDoctor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  appointmentSpecialty: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
  appointmentTime: {
    fontSize: 12,
    color: '#64748b',
  },
  appointmentBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  appointmentBadgeText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 12,
  },
  emptyButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    marginTop: 6,
    marginRight: 12,
  },
  notificationDotUnread: {
    backgroundColor: '#22c55e',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  notificationBody: {
    fontSize: 13,
    color: '#64748b',
  },
});
