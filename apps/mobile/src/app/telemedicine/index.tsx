import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { api } from '../../lib/api';

interface TelemedicineAppointment {
  id: string;
  scheduledAt: string;
  duration: number;
  status: 'SCHEDULED' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  doctor: {
    id: string;
    fullName: string;
    specialty?: string;
    avatarUrl?: string;
  };
  roomUrl?: string;
}

export default function TelemedicineListScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<TelemedicineAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAppointments = useCallback(async () => {
    try {
      const response = await api.get<{ data: TelemedicineAppointment[] }>(
        '/appointments/my?type=TELEMEDICINE&upcoming=true'
      );
      setAppointments(response.data || []);
    } catch (error) {
      console.error('Error loading telemedicine appointments:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadAppointments();
    setIsRefreshing(false);
  };

  const handleJoinCall = (appointment: TelemedicineAppointment) => {
    const now = new Date();
    const scheduledTime = new Date(appointment.scheduledAt);
    const diffMinutes = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);

    // Can join 10 minutes before scheduled time
    if (diffMinutes > 10) {
      Alert.alert(
        'Aguarde',
        `A consulta começa em ${Math.ceil(diffMinutes)} minutos. Você poderá entrar 10 minutos antes do horário.`
      );
      return;
    }

    router.push({
      pathname: '/telemedicine/[id]',
      params: {
        id: appointment.id,
        doctorName: appointment.doctor.fullName,
      },
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Amanhã';
    }
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (status: string, scheduledAt: string) => {
    const now = new Date();
    const scheduledTime = new Date(scheduledAt);
    const diffMinutes = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);

    if (status === 'IN_PROGRESS') {
      return { label: 'Em andamento', color: '#22c55e', canJoin: true };
    }
    if (status === 'WAITING') {
      return { label: 'Aguardando', color: '#f59e0b', canJoin: true };
    }
    if (diffMinutes <= 10 && diffMinutes > -60) {
      return { label: 'Disponível', color: '#22c55e', canJoin: true };
    }
    if (diffMinutes <= 60) {
      return { label: `Em ${Math.ceil(diffMinutes)} min`, color: '#3b82f6', canJoin: false };
    }
    return { label: 'Agendada', color: '#64748b', canJoin: false };
  };

  const renderAppointment = ({ item }: { item: TelemedicineAppointment }) => {
    const statusInfo = getStatusInfo(item.status, item.scheduledAt);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.doctorAvatar}>
            <Text style={styles.doctorEmoji}>👨‍⚕️</Text>
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>Dr(a). {item.doctor.fullName}</Text>
            <Text style={styles.specialty}>{item.doctor.specialty}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleIcon}>📅</Text>
            <Text style={styles.scheduleText}>
              {formatDate(item.scheduledAt)} às {formatTime(item.scheduledAt)}
            </Text>
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleIcon}>⏱️</Text>
            <Text style={styles.scheduleText}>{item.duration} minutos</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.joinButton,
            !statusInfo.canJoin && styles.joinButtonDisabled,
          ]}
          onPress={() => handleJoinCall(item)}
          disabled={!statusInfo.canJoin}
        >
          <Text style={styles.joinButtonIcon}>📹</Text>
          <Text style={styles.joinButtonText}>
            {statusInfo.canJoin ? 'Entrar na Consulta' : 'Aguarde o horário'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Telemedicina',
          headerStyle: { backgroundColor: '#22c55e' },
          headerTintColor: '#fff',
        }}
      />

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>💡</Text>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Como funciona?</Text>
          <Text style={styles.infoText}>
            Você poderá entrar na sala de consulta 10 minutos antes do horário agendado.
            Certifique-se de estar em um local silencioso e com boa conexão.
          </Text>
        </View>
      </View>

      <FlatList
        data={appointments}
        renderItem={renderAppointment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#22c55e']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📹</Text>
            <Text style={styles.emptyTitle}>Nenhuma teleconsulta</Text>
            <Text style={styles.emptyText}>
              Você não tem consultas online agendadas no momento.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#3b82f6',
    lineHeight: 18,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorEmoji: {
    fontSize: 24,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  specialty: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  scheduleText: {
    fontSize: 14,
    color: '#475569',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 14,
  },
  joinButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  joinButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
