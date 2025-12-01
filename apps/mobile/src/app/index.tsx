import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>HealthFlow</Text>
        <Text style={styles.subtitle}>Sistema de Gestão de Saúde</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Em Desenvolvimento</Text>
        </View>
      </View>

      <View style={styles.features}>
        <FeatureCard
          icon="📋"
          title="Prontuário Eletrônico"
          description="Registros médicos completos"
        />
        <FeatureCard
          icon="📅"
          title="Agendamento"
          description="Sistema de consultas"
        />
        <FeatureCard
          icon="📹"
          title="Telemedicina"
          description="Videochamadas integradas"
        />
        <FeatureCard
          icon="💊"
          title="Prescrição Digital"
          description="Receitas com assinatura"
        />
        <FeatureCard
          icon="🎮"
          title="Gamificação"
          description="Pontos e conquistas"
        />
        <FeatureCard
          icon="🔗"
          title="Integrações"
          description="FHIR, RNDS e convênios"
        />
      </View>
    </ScrollView>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
  },
  badge: {
    marginTop: 16,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    color: '#15803d',
    fontSize: 14,
    fontWeight: '500',
  },
  features: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#64748b',
  },
});
