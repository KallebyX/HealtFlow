import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

interface CallState {
  isConnected: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  isSpeakerOn: boolean;
  duration: number;
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
}

export default function TelemedicineCallScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const callId = params.id as string;
  const doctorName = params.doctorName as string || 'Médico';

  const [callState, setCallState] = useState<CallState>({
    isConnected: false,
    isMuted: false,
    isVideoOn: true,
    isSpeakerOn: true,
    duration: 0,
    connectionQuality: 'good',
  });

  const [isConnecting, setIsConnecting] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate connection
  useEffect(() => {
    const connectTimeout = setTimeout(() => {
      setIsConnecting(false);
      setCallState((prev) => ({ ...prev, isConnected: true }));
    }, 2000);

    return () => clearTimeout(connectTimeout);
  }, []);

  // Call duration timer
  useEffect(() => {
    if (callState.isConnected) {
      timerRef.current = setInterval(() => {
        setCallState((prev) => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callState.isConnected]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    setCallState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const toggleVideo = () => {
    setCallState((prev) => ({ ...prev, isVideoOn: !prev.isVideoOn }));
  };

  const toggleSpeaker = () => {
    setCallState((prev) => ({ ...prev, isSpeakerOn: !prev.isSpeakerOn }));
  };

  const switchCamera = () => {
    // In a real implementation, this would switch between front/back camera
    Alert.alert('Câmera', 'Alternando câmera...');
  };

  const endCall = () => {
    Alert.alert(
      'Encerrar Chamada',
      'Deseja realmente encerrar a consulta?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Encerrar',
          style: 'destructive',
          onPress: () => {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            router.back();
          },
        },
      ]
    );
  };

  const getQualityColor = (quality: string) => {
    const colors: Record<string, string> = {
      poor: '#ef4444',
      fair: '#f59e0b',
      good: '#22c55e',
      excellent: '#22c55e',
    };
    return colors[quality] || '#22c55e';
  };

  const getQualityBars = (quality: string) => {
    const levels: Record<string, number> = {
      poor: 1,
      fair: 2,
      good: 3,
      excellent: 4,
    };
    return levels[quality] || 3;
  };

  if (isConnecting) {
    return (
      <View style={styles.connectingContainer}>
        <StatusBar style="light" />
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.connectingContent}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarEmoji}>👨‍⚕️</Text>
          </View>
          <Text style={styles.connectingText}>Conectando...</Text>
          <Text style={styles.doctorNameLarge}>Dr(a). {doctorName}</Text>
          <View style={styles.pulseContainer}>
            <View style={[styles.pulse, styles.pulse1]} />
            <View style={[styles.pulse, styles.pulse2]} />
            <View style={[styles.pulse, styles.pulse3]} />
          </View>
        </View>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Remote Video (Doctor) */}
      <View style={styles.remoteVideo}>
        {/* Placeholder for remote video */}
        <View style={styles.remoteVideoPlaceholder}>
          <View style={styles.avatarXL}>
            <Text style={styles.avatarEmojiXL}>👨‍⚕️</Text>
          </View>
          <Text style={styles.remoteVideoName}>Dr(a). {doctorName}</Text>
        </View>
      </View>

      {/* Local Video (Patient - PiP) */}
      <View style={styles.localVideo}>
        {callState.isVideoOn ? (
          <View style={styles.localVideoPlaceholder}>
            <Text style={styles.localVideoEmoji}>👤</Text>
          </View>
        ) : (
          <View style={styles.videoOffContainer}>
            <Text style={styles.videoOffIcon}>📵</Text>
            <Text style={styles.videoOffText}>Câmera desligada</Text>
          </View>
        )}
      </View>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.callInfo}>
          <View style={styles.connectionQuality}>
            {[1, 2, 3, 4].map((bar) => (
              <View
                key={bar}
                style={[
                  styles.qualityBar,
                  {
                    height: 4 + bar * 3,
                    backgroundColor:
                      bar <= getQualityBars(callState.connectionQuality)
                        ? getQualityColor(callState.connectionQuality)
                        : '#64748b',
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.durationContainer}>
            <View style={styles.recordingDot} />
            <Text style={styles.durationText}>{formatDuration(callState.duration)}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.switchCameraButton} onPress={switchCamera}>
          <Text style={styles.controlIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomBar}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlButton, callState.isMuted && styles.controlButtonActive]}
            onPress={toggleMute}
          >
            <Text style={styles.controlIcon}>{callState.isMuted ? '🔇' : '🎤'}</Text>
            <Text style={styles.controlLabel}>{callState.isMuted ? 'Ativar' : 'Mudo'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, !callState.isVideoOn && styles.controlButtonActive]}
            onPress={toggleVideo}
          >
            <Text style={styles.controlIcon}>{callState.isVideoOn ? '📹' : '📵'}</Text>
            <Text style={styles.controlLabel}>{callState.isVideoOn ? 'Vídeo' : 'Ligar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
            <Text style={styles.endCallIcon}>📞</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, callState.isSpeakerOn && styles.controlButtonActive]}
            onPress={toggleSpeaker}
          >
            <Text style={styles.controlIcon}>{callState.isSpeakerOn ? '🔊' : '🔈'}</Text>
            <Text style={styles.controlLabel}>Alto-falante</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={() => {}}>
            <Text style={styles.controlIcon}>💬</Text>
            <Text style={styles.controlLabel}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  connectingContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectingContent: {
    alignItems: 'center',
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarEmoji: {
    fontSize: 56,
  },
  connectingText: {
    fontSize: 18,
    color: '#94a3b8',
    marginBottom: 8,
  },
  doctorNameLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  pulseContainer: {
    flexDirection: 'row',
    marginTop: 32,
    gap: 8,
  },
  pulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
  },
  pulse1: {
    opacity: 0.3,
  },
  pulse2: {
    opacity: 0.6,
  },
  pulse3: {
    opacity: 1,
  },
  cancelButton: {
    position: 'absolute',
    bottom: 60,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#ef4444',
    borderRadius: 30,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  remoteVideo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteVideoPlaceholder: {
    alignItems: 'center',
  },
  avatarXL: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarEmojiXL: {
    fontSize: 72,
  },
  remoteVideoName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  localVideo: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#374151',
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  localVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4b5563',
  },
  localVideoEmoji: {
    fontSize: 40,
  },
  videoOffContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2937',
  },
  videoOffIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  videoOffText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 130,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  callInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  connectionQuality: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  qualityBar: {
    width: 4,
    borderRadius: 2,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 8,
  },
  durationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  switchCameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  controlButton: {
    alignItems: 'center',
    padding: 8,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  controlIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  controlLabel: {
    fontSize: 11,
    color: '#fff',
  },
  endCallButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
  },
  endCallIcon: {
    fontSize: 32,
  },
});
