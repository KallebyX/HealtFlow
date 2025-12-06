import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

interface SettingsItemProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function SettingsItem({ icon, label, value, onPress, rightElement, danger }: SettingsItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <View style={styles.settingsItemLeft}>
        <Text style={styles.settingsItemIcon}>{icon}</Text>
        <Text style={[styles.settingsItemLabel, danger && styles.settingsItemLabelDanger]}>
          {label}
        </Text>
      </View>
      {rightElement || (
        <View style={styles.settingsItemRight}>
          {value && <Text style={styles.settingsItemValue}>{value}</Text>}
          {onPress && <Text style={styles.settingsItemArrow}>›</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  // Settings state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [examReminders, setExamReminders] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometricAuth, setBiometricAuth] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir Conta',
      'Tem certeza que deseja excluir sua conta? Esta acao e irreversivel e todos os seus dados serao perdidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmar Exclusao',
              'Digite "EXCLUIR" para confirmar a exclusao da conta.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Confirmar',
                  style: 'destructive',
                  onPress: () => {
                    // API call to delete account
                    Alert.alert('Conta excluida', 'Sua conta foi excluida com sucesso.');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://healthflow.com/privacy');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://healthflow.com/terms');
  };

  const openSupport = () => {
    Linking.openURL('mailto:suporte@healthflow.com');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Configuracoes',
          headerStyle: { backgroundColor: '#22c55e' },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Account Section */}
        <SettingsSection title="Conta">
          <SettingsItem
            icon="👤"
            label="Dados Pessoais"
            onPress={() => router.push('/(tabs)/profile')}
          />
          <SettingsItem
            icon="📧"
            label="Email"
            value={user?.email || '-'}
          />
          <SettingsItem
            icon="🔐"
            label="Alterar Senha"
            onPress={() => Alert.alert('Em breve', 'Esta funcionalidade estara disponivel em breve.')}
          />
        </SettingsSection>

        {/* Notifications Section */}
        <SettingsSection title="Notificacoes">
          <SettingsItem
            icon="🔔"
            label="Notificacoes Push"
            rightElement={
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: '#e2e8f0', true: '#86efac' }}
                thumbColor={pushNotifications ? '#22c55e' : '#f4f4f5'}
              />
            }
          />
          <SettingsItem
            icon="📧"
            label="Notificacoes por Email"
            rightElement={
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: '#e2e8f0', true: '#86efac' }}
                thumbColor={emailNotifications ? '#22c55e' : '#f4f4f5'}
              />
            }
          />
          <SettingsItem
            icon="📱"
            label="Notificacoes por SMS"
            rightElement={
              <Switch
                value={smsNotifications}
                onValueChange={setSmsNotifications}
                trackColor={{ false: '#e2e8f0', true: '#86efac' }}
                thumbColor={smsNotifications ? '#22c55e' : '#f4f4f5'}
              />
            }
          />
          <SettingsItem
            icon="📅"
            label="Lembretes de Consulta"
            rightElement={
              <Switch
                value={appointmentReminders}
                onValueChange={setAppointmentReminders}
                trackColor={{ false: '#e2e8f0', true: '#86efac' }}
                thumbColor={appointmentReminders ? '#22c55e' : '#f4f4f5'}
              />
            }
          />
          <SettingsItem
            icon="🔬"
            label="Lembretes de Exames"
            rightElement={
              <Switch
                value={examReminders}
                onValueChange={setExamReminders}
                trackColor={{ false: '#e2e8f0', true: '#86efac' }}
                thumbColor={examReminders ? '#22c55e' : '#f4f4f5'}
              />
            }
          />
        </SettingsSection>

        {/* Appearance Section */}
        <SettingsSection title="Aparencia">
          <SettingsItem
            icon="🌙"
            label="Modo Escuro"
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#e2e8f0', true: '#86efac' }}
                thumbColor={darkMode ? '#22c55e' : '#f4f4f5'}
              />
            }
          />
          <SettingsItem
            icon="🌐"
            label="Idioma"
            value="Portugues (BR)"
            onPress={() => Alert.alert('Em breve', 'Mais idiomas estarao disponiveis em breve.')}
          />
        </SettingsSection>

        {/* Security Section */}
        <SettingsSection title="Seguranca">
          <SettingsItem
            icon="👆"
            label="Login com Biometria"
            rightElement={
              <Switch
                value={biometricAuth}
                onValueChange={setBiometricAuth}
                trackColor={{ false: '#e2e8f0', true: '#86efac' }}
                thumbColor={biometricAuth ? '#22c55e' : '#f4f4f5'}
              />
            }
          />
          <SettingsItem
            icon="🔒"
            label="Sessoes Ativas"
            onPress={() => Alert.alert('Em breve', 'Esta funcionalidade estara disponivel em breve.')}
          />
        </SettingsSection>

        {/* Health Data Section */}
        <SettingsSection title="Dados de Saude">
          <SettingsItem
            icon="❤️"
            label="Monitoramento de Saude"
            onPress={() => router.push('/health')}
          />
          <SettingsItem
            icon="📊"
            label="Exportar Meus Dados"
            onPress={() => Alert.alert('Exportar Dados', 'Seus dados serao enviados para seu email cadastrado.', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Exportar', onPress: () => Alert.alert('Sucesso', 'Seus dados serao enviados em ate 24h.') },
            ])}
          />
          <SettingsItem
            icon="🏥"
            label="Compartilhamento com Medicos"
            onPress={() => Alert.alert('Em breve', 'Esta funcionalidade estara disponivel em breve.')}
          />
        </SettingsSection>

        {/* Support Section */}
        <SettingsSection title="Suporte">
          <SettingsItem
            icon="❓"
            label="Central de Ajuda"
            onPress={() => Alert.alert('Ajuda', 'Para suporte, entre em contato pelo email suporte@healthflow.com')}
          />
          <SettingsItem
            icon="💬"
            label="Fale Conosco"
            onPress={openSupport}
          />
          <SettingsItem
            icon="⭐"
            label="Avaliar o App"
            onPress={() => Alert.alert('Avaliar', 'Obrigado por usar o HealthFlow! Sua avaliacao e muito importante.')}
          />
          <SettingsItem
            icon="🐛"
            label="Reportar um Problema"
            onPress={() => Alert.alert('Reportar', 'Envie detalhes do problema para suporte@healthflow.com')}
          />
        </SettingsSection>

        {/* Legal Section */}
        <SettingsSection title="Legal">
          <SettingsItem
            icon="📜"
            label="Termos de Uso"
            onPress={openTermsOfService}
          />
          <SettingsItem
            icon="🔐"
            label="Politica de Privacidade"
            onPress={openPrivacyPolicy}
          />
          <SettingsItem
            icon="📋"
            label="LGPD - Seus Direitos"
            onPress={() => Alert.alert('LGPD', 'Voce tem direito de acessar, corrigir, excluir e portar seus dados pessoais. Entre em contato conosco para exercer esses direitos.')}
          />
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection title="Zona de Perigo">
          <SettingsItem
            icon="🚪"
            label="Sair da Conta"
            onPress={handleLogout}
            danger
          />
          <SettingsItem
            icon="🗑️"
            label="Excluir Minha Conta"
            onPress={handleDeleteAccount}
            danger
          />
        </SettingsSection>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>HealthFlow</Text>
          <Text style={styles.appVersion}>Versao 1.0.0</Text>
          <Text style={styles.appCopyright}>© 2024 HealthFlow. Todos os direitos reservados.</Text>
        </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingsItemLabel: {
    fontSize: 16,
    color: '#1e293b',
  },
  settingsItemLabelDanger: {
    color: '#ef4444',
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemValue: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 8,
  },
  settingsItemArrow: {
    fontSize: 20,
    color: '#94a3b8',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  appVersion: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
});
