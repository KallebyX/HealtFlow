import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { notificationsApi } from '../../lib/api';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'APPOINTMENT' | 'EXAM' | 'PRESCRIPTION' | 'SYSTEM' | 'GAMIFICATION';
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

const notificationTypeConfig = {
  APPOINTMENT: { icon: '📅', color: '#3b82f6', label: 'Consulta' },
  EXAM: { icon: '🔬', color: '#8b5cf6', label: 'Exame' },
  PRESCRIPTION: { icon: '💊', color: '#22c55e', label: 'Receita' },
  SYSTEM: { icon: '⚙️', color: '#64748b', label: 'Sistema' },
  GAMIFICATION: { icon: '🏆', color: '#f59e0b', label: 'Conquista' },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.list();
      setNotifications((res as { data: Notification[] }).data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Mock data for demo
      setNotifications([
        {
          id: '1',
          title: 'Consulta confirmada',
          body: 'Sua consulta com Dr. Carlos Santos foi confirmada para amanha as 14h.',
          type: 'APPOINTMENT',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Resultado de exame disponivel',
          body: 'O resultado do seu hemograma ja esta disponivel para visualizacao.',
          type: 'EXAM',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          title: 'Nova conquista desbloqueada!',
          body: 'Parabens! Voce desbloqueou a conquista "Paciente Assiduo" por comparecer a 5 consultas.',
          type: 'GAMIFICATION',
          isRead: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '4',
          title: 'Receita pronta para retirada',
          body: 'Sua receita de medicamentos esta pronta para retirada na farmacia.',
          type: 'PRESCRIPTION',
          isRead: true,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: '5',
          title: 'Lembrete: Consulta em 24h',
          body: 'Lembre-se: voce tem uma consulta agendada para amanha.',
          type: 'APPOINTMENT',
          isRead: true,
          createdAt: new Date(Date.now() - 259200000).toISOString(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    handleMarkAsRead(notification.id);

    // Navigate based on notification type
    switch (notification.type) {
      case 'APPOINTMENT':
        router.push('/(tabs)/appointments');
        break;
      case 'EXAM':
        router.push('/(tabs)/exams');
        break;
      case 'PRESCRIPTION':
        router.push('/(tabs)/prescriptions');
        break;
      case 'GAMIFICATION':
        router.push('/(tabs)/profile');
        break;
      default:
        break;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return minutes <= 1 ? 'Agora mesmo' : `${minutes} min atras`;
    } else if (hours < 24) {
      return `${hours}h atras`;
    } else if (days < 7) {
      return `${days} dia${days > 1 ? 's' : ''} atras`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const filteredNotifications = filter
    ? notifications.filter((n) => n.type === filter)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notificacoes',
          headerStyle: { backgroundColor: '#22c55e' },
          headerTintColor: '#fff',
          headerRight: () =>
            unreadCount > 0 ? (
              <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerAction}>
                <Text style={styles.headerActionText}>Marcar lidas</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#22c55e']} />
        }
      >
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{notifications.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#22c55e' }]}>{unreadCount}</Text>
            <Text style={styles.statLabel}>Nao lidas</Text>
          </View>
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            style={[styles.filterPill, !filter && styles.filterPillActive]}
            onPress={() => setFilter(null)}
          >
            <Text style={[styles.filterPillText, !filter && styles.filterPillTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>
          {Object.entries(notificationTypeConfig).map(([type, config]) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterPill, filter === type && styles.filterPillActive]}
              onPress={() => setFilter(filter === type ? null : type)}
            >
              <Text style={[styles.filterPillText, filter === type && styles.filterPillTextActive]}>
                {config.icon} {config.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>Nenhuma notificacao</Text>
            <Text style={styles.emptySubtext}>
              Suas notificacoes aparecerao aqui
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {filteredNotifications.map((notification) => {
              const config = notificationTypeConfig[notification.type];
              return (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    !notification.isRead && styles.notificationCardUnread,
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                >
                  <View
                    style={[
                      styles.notificationIcon,
                      { backgroundColor: config.color + '20' },
                    ]}
                  >
                    <Text style={styles.notificationIconText}>{config.icon}</Text>
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle} numberOfLines={1}>
                        {notification.title}
                      </Text>
                      {!notification.isRead && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationBody} numberOfLines={2}>
                      {notification.body}
                    </Text>
                    <View style={styles.notificationFooter}>
                      <View style={[styles.typeBadge, { backgroundColor: config.color + '20' }]}>
                        <Text style={[styles.typeBadgeText, { color: config.color }]}>
                          {config.label}
                        </Text>
                      </View>
                      <Text style={styles.notificationTime}>{formatDate(notification.createdAt)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </>
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
  headerAction: {
    marginRight: 8,
  },
  headerActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 20,
  },
  filterContainer: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  filterPill: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  filterPillText: {
    fontSize: 14,
    color: '#64748b',
  },
  filterPillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  notificationsList: {
    gap: 8,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 8,
  },
  notificationCardUnread: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationIconText: {
    fontSize: 24,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginLeft: 8,
  },
  notificationBody: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
