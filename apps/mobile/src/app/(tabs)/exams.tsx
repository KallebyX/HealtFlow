import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { examsApi } from '../../lib/api';
import type { LabExam } from '../../types';

export default function ExamsScreen() {
  const [exams, setExams] = useState<LabExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadExams = useCallback(async () => {
    try {
      const response = await examsApi.list();
      setExams((response as { data: LabExam[] }).data || []);
    } catch (error) {
      console.error('Error loading exams:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadExams();
    setIsRefreshing(false);
  };

  const handleViewResult = async (exam: LabExam) => {
    if (exam.resultPdfUrl) {
      try {
        await Linking.openURL(exam.resultPdfUrl);
      } catch {
        Alert.alert('Erro', 'Não foi possível abrir o resultado');
      }
    } else {
      Alert.alert('Aviso', 'Resultado ainda não disponível');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; bg: string; icon: string }> = {
      REQUESTED: { label: 'Solicitado', color: '#f59e0b', bg: '#fef3c7', icon: '📋' },
      COLLECTED: { label: 'Coletado', color: '#3b82f6', bg: '#dbeafe', icon: '🧪' },
      IN_PROGRESS: { label: 'Em análise', color: '#8b5cf6', bg: '#ede9fe', icon: '⏳' },
      COMPLETED: { label: 'Concluído', color: '#22c55e', bg: '#dcfce7', icon: '✅' },
      CANCELLED: { label: 'Cancelado', color: '#ef4444', bg: '#fee2e2', icon: '❌' },
    };
    return statusMap[status] || { label: status, color: '#64748b', bg: '#f1f5f9', icon: '📄' };
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      BLOOD: '🩸',
      URINE: '🧪',
      IMAGING: '📷',
      PATHOLOGY: '🔬',
      CARDIOLOGY: '❤️',
      NEUROLOGY: '🧠',
      default: '🔬',
    };
    return icons[category] || icons.default;
  };

  const renderExam = ({ item }: { item: LabExam }) => {
    const statusInfo = getStatusInfo(item.status);
    const isCompleted = item.status === 'COMPLETED';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => isCompleted && handleViewResult(item)}
        activeOpacity={isCompleted ? 0.7 : 1}
      >
        <View style={styles.cardHeader}>
          <View style={styles.categoryIcon}>
            <Text style={styles.categoryEmoji}>{getCategoryIcon(item.category)}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.examName}>{item.name}</Text>
            <Text style={styles.examCategory}>{item.category}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Solicitado:</Text>
            <Text style={styles.dateValue}>{formatDate(item.requestedAt)}</Text>
          </View>
          {item.collectedAt && (
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Coletado:</Text>
              <Text style={styles.dateValue}>{formatDate(item.collectedAt)}</Text>
            </View>
          )}
          {item.resultAt && (
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Resultado:</Text>
              <Text style={styles.dateValue}>{formatDate(item.resultAt)}</Text>
            </View>
          )}
        </View>

        {item.hasCriticalValues && (
          <View style={styles.criticalAlert}>
            <Text style={styles.criticalIcon}>⚠️</Text>
            <Text style={styles.criticalText}>
              Valores críticos - Consulte seu médico
            </Text>
          </View>
        )}

        {isCompleted && (
          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => handleViewResult(item)}
            >
              <Text style={styles.viewButtonIcon}>📄</Text>
              <Text style={styles.viewButtonText}>Ver Resultado</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Group exams by status
  const pendingExams = exams.filter((e) =>
    ['REQUESTED', 'COLLECTED', 'IN_PROGRESS'].includes(e.status)
  );
  const completedExams = exams.filter((e) => e.status === 'COMPLETED');

  return (
    <View style={styles.container}>
      <FlatList
        data={exams}
        renderItem={renderExam}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#22c55e']} />
        }
        ListHeaderComponent={
          pendingExams.length > 0 ? (
            <View style={styles.pendingAlert}>
              <Text style={styles.pendingIcon}>🔔</Text>
              <Text style={styles.pendingText}>
                {pendingExams.length} exame(s) em andamento
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔬</Text>
            <Text style={styles.emptyText}>Nenhum exame encontrado</Text>
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
  list: {
    padding: 16,
  },
  pendingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  pendingIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  pendingText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
  },
  examName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  examCategory: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 13,
    color: '#64748b',
    width: 80,
  },
  dateValue: {
    fontSize: 13,
    color: '#1e293b',
  },
  criticalAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  criticalIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  criticalText: {
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '500',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 12,
  },
  viewButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
  },
});
