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
import { prescriptionsApi } from '../../lib/api';
import type { Prescription } from '../../types';

export default function PrescriptionsScreen() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadPrescriptions = useCallback(async () => {
    try {
      const response = await prescriptionsApi.list();
      setPrescriptions((response as { data: Prescription[] }).data || []);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadPrescriptions();
    setIsRefreshing(false);
  };

  const handleDownload = async (prescription: Prescription) => {
    if (prescription.pdfUrl) {
      try {
        await Linking.openURL(prescription.pdfUrl);
      } catch {
        Alert.alert('Erro', 'Não foi possível abrir o PDF');
      }
    } else {
      Alert.alert('Aviso', 'PDF não disponível para esta receita');
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

  const getStatusInfo = (prescription: Prescription) => {
    const now = new Date();
    const validUntil = new Date(prescription.validUntil);

    if (prescription.status === 'CANCELLED') {
      return { label: 'Cancelada', color: '#ef4444', bg: '#fee2e2' };
    }
    if (validUntil < now) {
      return { label: 'Expirada', color: '#94a3b8', bg: '#f1f5f9' };
    }
    return { label: 'Ativa', color: '#22c55e', bg: '#dcfce7' };
  };

  const renderPrescription = ({ item }: { item: Prescription }) => {
    const statusInfo = getStatusInfo(item);
    const isExpanded = expandedId === item.id;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardIcon}>
            <Text style={styles.cardEmoji}>💊</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>
              Receita de {formatDate(item.issuedAt)}
            </Text>
            <Text style={styles.cardSubtitle}>
              Dr(a). {item.doctor?.fullName}
            </Text>
            <Text style={styles.cardMeta}>
              CRM: {item.doctor?.crm}/{item.doctor?.crmState}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.cardBody}>
            <Text style={styles.sectionTitle}>Medicamentos</Text>
            {item.medications.map((med, index) => (
              <View key={med.id || index} style={styles.medicationItem}>
                <View style={styles.medicationHeader}>
                  <Text style={styles.medicationName}>{med.name}</Text>
                  <Text style={styles.medicationDosage}>{med.dosage}</Text>
                </View>
                <View style={styles.medicationDetails}>
                  <View style={styles.medicationRow}>
                    <Text style={styles.medicationLabel}>Frequência:</Text>
                    <Text style={styles.medicationValue}>{med.frequency}</Text>
                  </View>
                  <View style={styles.medicationRow}>
                    <Text style={styles.medicationLabel}>Duração:</Text>
                    <Text style={styles.medicationValue}>{med.duration}</Text>
                  </View>
                  {med.instructions && (
                    <View style={styles.medicationRow}>
                      <Text style={styles.medicationLabel}>Instruções:</Text>
                      <Text style={styles.medicationValue}>{med.instructions}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}

            <View style={styles.cardFooter}>
              <Text style={styles.validUntil}>
                Válida até: {formatDate(item.validUntil)}
              </Text>
              {item.signedAt && (
                <View style={styles.signedBadge}>
                  <Text style={styles.signedText}>✓ Assinada digitalmente</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => handleDownload(item)}
            >
              <Text style={styles.downloadIcon}>📄</Text>
              <Text style={styles.downloadText}>Baixar PDF</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={prescriptions}
        renderItem={renderPrescription}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#22c55e']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💊</Text>
            <Text style={styles.emptyText}>Nenhuma receita encontrada</Text>
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
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  cardMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 8,
  },
  medicationItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  medicationDosage: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '500',
  },
  medicationDetails: {},
  medicationRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  medicationLabel: {
    fontSize: 13,
    color: '#64748b',
    width: 80,
  },
  medicationValue: {
    fontSize: 13,
    color: '#1e293b',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  validUntil: {
    fontSize: 12,
    color: '#64748b',
  },
  signedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  signedText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '500',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  downloadIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  downloadText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
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
