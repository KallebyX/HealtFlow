import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

// Types
interface HealthMetric {
  id: string;
  type: 'BLOOD_PRESSURE' | 'GLUCOSE' | 'WEIGHT' | 'HEART_RATE' | 'TEMPERATURE' | 'OXYGEN';
  value: number;
  secondaryValue?: number; // for blood pressure diastolic
  unit: string;
  measuredAt: string;
  notes?: string;
}

interface HealthStats {
  bloodPressure?: { systolic: number; diastolic: number; status: string };
  glucose?: { value: number; status: string };
  weight?: { value: number; change: number };
  heartRate?: { value: number; status: string };
}

// Health API
const healthApi = {
  getMetrics: (type?: string) => api.get<{ data: HealthMetric[] }>(`/health/metrics${type ? `?type=${type}` : ''}`),
  getStats: () => api.get<HealthStats>('/health/stats'),
  addMetric: (data: Partial<HealthMetric>) => api.post<HealthMetric>('/health/metrics', data),
};

const metricTypes = [
  { key: 'BLOOD_PRESSURE', label: 'Pressao Arterial', icon: '💓', unit: 'mmHg', color: '#ef4444' },
  { key: 'GLUCOSE', label: 'Glicemia', icon: '🩸', unit: 'mg/dL', color: '#f59e0b' },
  { key: 'WEIGHT', label: 'Peso', icon: '⚖️', unit: 'kg', color: '#3b82f6' },
  { key: 'HEART_RATE', label: 'Freq. Cardiaca', icon: '❤️', unit: 'bpm', color: '#ec4899' },
  { key: 'TEMPERATURE', label: 'Temperatura', icon: '🌡️', unit: '°C', color: '#8b5cf6' },
  { key: 'OXYGEN', label: 'Saturacao O2', icon: '💨', unit: '%', color: '#06b6d4' },
];

export default function HealthScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newMetric, setNewMetric] = useState({
    type: '',
    value: '',
    secondaryValue: '',
    notes: '',
  });

  const loadData = useCallback(async () => {
    try {
      const [metricsRes, statsRes] = await Promise.all([
        healthApi.getMetrics(),
        healthApi.getStats(),
      ]);
      setMetrics(metricsRes.data || []);
      setStats(statsRes);
    } catch (error) {
      console.error('Error loading health data:', error);
      // Use mock data for demo
      setStats({
        bloodPressure: { systolic: 120, diastolic: 80, status: 'normal' },
        glucose: { value: 95, status: 'normal' },
        weight: { value: 72.5, change: -0.5 },
        heartRate: { value: 72, status: 'normal' },
      });
      setMetrics([
        {
          id: '1',
          type: 'BLOOD_PRESSURE',
          value: 120,
          secondaryValue: 80,
          unit: 'mmHg',
          measuredAt: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'GLUCOSE',
          value: 95,
          unit: 'mg/dL',
          measuredAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '3',
          type: 'WEIGHT',
          value: 72.5,
          unit: 'kg',
          measuredAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleAddMetric = async () => {
    if (!newMetric.type || !newMetric.value) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatorios');
      return;
    }

    try {
      const data: Partial<HealthMetric> = {
        type: newMetric.type as HealthMetric['type'],
        value: parseFloat(newMetric.value),
        measuredAt: new Date().toISOString(),
        notes: newMetric.notes || undefined,
      };

      if (newMetric.type === 'BLOOD_PRESSURE' && newMetric.secondaryValue) {
        data.secondaryValue = parseFloat(newMetric.secondaryValue);
      }

      await healthApi.addMetric(data);
      setIsModalVisible(false);
      setNewMetric({ type: '', value: '', secondaryValue: '', notes: '' });
      loadData();
      Alert.alert('Sucesso', 'Medicao registrada com sucesso!');
    } catch (error) {
      console.error('Error adding metric:', error);
      Alert.alert('Erro', 'Nao foi possivel registrar a medicao');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'normal':
        return '#22c55e';
      case 'high':
      case 'elevated':
        return '#f59e0b';
      case 'critical':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'normal':
        return 'Normal';
      case 'high':
        return 'Elevado';
      case 'elevated':
        return 'Alterado';
      case 'critical':
        return 'Critico';
      default:
        return '-';
    }
  };

  const filteredMetrics = selectedType
    ? metrics.filter((m) => m.type === selectedType)
    : metrics;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Monitoramento de Saude',
          headerStyle: { backgroundColor: '#22c55e' },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#22c55e']} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Minha Saude</Text>
          <Text style={styles.headerSubtitle}>
            Acompanhe suas medicoes e mantenha seu historico atualizado
          </Text>
        </View>

        {/* Quick Stats */}
        {stats && (
          <View style={styles.statsGrid}>
            {stats.bloodPressure && (
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>💓</Text>
                <Text style={styles.statValue}>
                  {stats.bloodPressure.systolic}/{stats.bloodPressure.diastolic}
                </Text>
                <Text style={styles.statLabel}>Pressao Arterial</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(stats.bloodPressure.status) + '20' },
                  ]}
                >
                  <Text
                    style={[styles.statusText, { color: getStatusColor(stats.bloodPressure.status) }]}
                  >
                    {getStatusLabel(stats.bloodPressure.status)}
                  </Text>
                </View>
              </View>
            )}

            {stats.glucose && (
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>🩸</Text>
                <Text style={styles.statValue}>{stats.glucose.value}</Text>
                <Text style={styles.statLabel}>Glicemia (mg/dL)</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(stats.glucose.status) + '20' },
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(stats.glucose.status) }]}>
                    {getStatusLabel(stats.glucose.status)}
                  </Text>
                </View>
              </View>
            )}

            {stats.weight && (
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>⚖️</Text>
                <Text style={styles.statValue}>{stats.weight.value}</Text>
                <Text style={styles.statLabel}>Peso (kg)</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        stats.weight.change < 0 ? '#22c55e20' : stats.weight.change > 0 ? '#f59e0b20' : '#64748b20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          stats.weight.change < 0 ? '#22c55e' : stats.weight.change > 0 ? '#f59e0b' : '#64748b',
                      },
                    ]}
                  >
                    {stats.weight.change > 0 ? '+' : ''}
                    {stats.weight.change} kg
                  </Text>
                </View>
              </View>
            )}

            {stats.heartRate && (
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>❤️</Text>
                <Text style={styles.statValue}>{stats.heartRate.value}</Text>
                <Text style={styles.statLabel}>Freq. Cardiaca</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(stats.heartRate.status) + '20' },
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(stats.heartRate.status) }]}>
                    {getStatusLabel(stats.heartRate.status)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Add New Measurement */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Nova Medicao</Text>
        </TouchableOpacity>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            style={[styles.filterPill, !selectedType && styles.filterPillActive]}
            onPress={() => setSelectedType(null)}
          >
            <Text style={[styles.filterPillText, !selectedType && styles.filterPillTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          {metricTypes.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[styles.filterPill, selectedType === type.key && styles.filterPillActive]}
              onPress={() => setSelectedType(selectedType === type.key ? null : type.key)}
            >
              <Text
                style={[styles.filterPillText, selectedType === type.key && styles.filterPillTextActive]}
              >
                {type.icon} {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Metrics History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historico de Medicoes</Text>
          {filteredMetrics.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>Nenhuma medicao encontrada</Text>
              <Text style={styles.emptySubtext}>
                Registre suas primeiras medicoes para acompanhar sua saude
              </Text>
            </View>
          ) : (
            filteredMetrics.map((metric) => {
              const typeInfo = metricTypes.find((t) => t.key === metric.type);
              return (
                <View key={metric.id} style={styles.metricCard}>
                  <View
                    style={[styles.metricIcon, { backgroundColor: (typeInfo?.color || '#64748b') + '20' }]}
                  >
                    <Text style={styles.metricIconText}>{typeInfo?.icon || '📊'}</Text>
                  </View>
                  <View style={styles.metricInfo}>
                    <Text style={styles.metricType}>{typeInfo?.label || metric.type}</Text>
                    <Text style={styles.metricDate}>{formatDate(metric.measuredAt)}</Text>
                  </View>
                  <View style={styles.metricValue}>
                    <Text style={[styles.metricValueText, { color: typeInfo?.color || '#1e293b' }]}>
                      {metric.secondaryValue
                        ? `${metric.value}/${metric.secondaryValue}`
                        : metric.value}
                    </Text>
                    <Text style={styles.metricUnit}>{metric.unit}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Metric Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Medicao</Text>

            {/* Metric Type Selection */}
            <Text style={styles.inputLabel}>Tipo de Medicao</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.typeSelector}
            >
              {metricTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeOption,
                    newMetric.type === type.key && styles.typeOptionActive,
                  ]}
                  onPress={() => setNewMetric({ ...newMetric, type: type.key })}
                >
                  <Text style={styles.typeOptionIcon}>{type.icon}</Text>
                  <Text
                    style={[
                      styles.typeOptionLabel,
                      newMetric.type === type.key && styles.typeOptionLabelActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Value Input */}
            <Text style={styles.inputLabel}>
              Valor{newMetric.type === 'BLOOD_PRESSURE' ? ' (Sistolica)' : ''}
            </Text>
            <TextInput
              style={styles.input}
              value={newMetric.value}
              onChangeText={(text) => setNewMetric({ ...newMetric, value: text })}
              placeholder="Digite o valor"
              keyboardType="numeric"
            />

            {/* Secondary Value for Blood Pressure */}
            {newMetric.type === 'BLOOD_PRESSURE' && (
              <>
                <Text style={styles.inputLabel}>Valor (Diastolica)</Text>
                <TextInput
                  style={styles.input}
                  value={newMetric.secondaryValue}
                  onChangeText={(text) => setNewMetric({ ...newMetric, secondaryValue: text })}
                  placeholder="Digite o valor"
                  keyboardType="numeric"
                />
              </>
            )}

            {/* Notes */}
            <Text style={styles.inputLabel}>Observacoes (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newMetric.notes}
              onChangeText={(text) => setNewMetric({ ...newMetric, notes: text })}
              placeholder="Adicione observacoes..."
              multiline
              numberOfLines={3}
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsModalVisible(false);
                  setNewMetric({ type: '', value: '', secondaryValue: '', notes: '' });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddMetric}>
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  statusBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  addButtonIcon: {
    fontSize: 24,
    color: '#fff',
    marginRight: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricIconText: {
    fontSize: 24,
  },
  metricInfo: {
    flex: 1,
  },
  metricType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  metricDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  metricValue: {
    alignItems: 'flex-end',
  },
  metricValueText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  metricUnit: {
    fontSize: 12,
    color: '#64748b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  typeSelector: {
    marginBottom: 16,
  },
  typeOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    minWidth: 80,
  },
  typeOptionActive: {
    backgroundColor: '#dcfce7',
  },
  typeOptionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeOptionLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  typeOptionLabelActive: {
    color: '#16a34a',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
