'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  MonitorUp,
  MessageSquare,
  FileText,
  Settings,
  Users,
  AlertTriangle,
  Clock,
  Send,
  Paperclip,
  Maximize2,
  Minimize2,
  RotateCcw,
  Camera,
  Volume2,
  VolumeX,
  User,
  X,
  ChevronRight,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { telemedicineApi } from '@/lib/api/telemedicine';
import {
  VideoCallStatus,
  ParticipantStatus,
  getVideoCallStatusLabel,
  getVideoCallStatusColor,
  formatDuration,
  formatConnectionQuality,
} from '@/types/telemedicine';
import type { ChatMessage, VideoCall } from '@/types/telemedicine';

export default function TelemedicineRoomPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const callId = params.id as string;

  // Video refs
  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null);
  const localStreamRef = React.useRef<MediaStream | null>(null);

  // State
  const [isConnected, setIsConnected] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isVideoOn, setIsVideoOn] = React.useState(true);
  const [isScreenSharing, setIsScreenSharing] = React.useState(false);
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const [showChat, setShowChat] = React.useState(false);
  const [showNotes, setShowNotes] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showEndDialog, setShowEndDialog] = React.useState(false);
  const [chatMessage, setChatMessage] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [connectionQuality, setConnectionQuality] = React.useState<string>('good');
  const [callDuration, setCallDuration] = React.useState(0);

  // Queries
  const { data: call, isLoading } = useQuery({
    queryKey: ['telemedicine', callId],
    queryFn: () => telemedicineApi.getById(callId),
    refetchInterval: 5000,
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['telemedicine', callId, 'messages'],
    queryFn: () => telemedicineApi.getMessages(callId),
    enabled: isConnected,
    refetchInterval: 3000,
  });

  // Mutations
  const startCallMutation = useMutation({
    mutationFn: () => telemedicineApi.start(callId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telemedicine', callId] });
      setIsConnected(true);
    },
  });

  const endCallMutation = useMutation({
    mutationFn: () => telemedicineApi.end(callId),
    onSuccess: () => {
      router.push('/telemedicina');
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => telemedicineApi.sendMessage(callId, message),
    onSuccess: () => {
      setChatMessage('');
      refetchMessages();
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: (notes: string) => telemedicineApi.updateNotes(callId, notes),
  });

  // Initialize media devices
  React.useEffect(() => {
    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    }

    initMedia();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Call duration timer
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected && call?.startedAt) {
      interval = setInterval(() => {
        const start = new Date(call.startedAt!).getTime();
        const now = Date.now();
        setCallDuration(Math.floor((now - start) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected, call?.startedAt]);

  // Auto-save notes
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (notes && notes !== call?.doctorNotes) {
        updateNotesMutation.mutate(notes);
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [notes]);

  // Handlers
  const toggleMute = () => {
    if (localStreamRef.current) {
      telemedicineApi.toggleMute(localStreamRef.current, !isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      telemedicineApi.toggleVideo(localStreamRef.current, isVideoOn);
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleScreenShare = async () => {
    // Screen sharing implementation would go here
    setIsScreenSharing(!isScreenSharing);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      sendMessageMutation.mutate(chatMessage.trim());
    }
  };

  const formatCallDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4" />
          <p>Carregando consulta...</p>
        </div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <p>Consulta nao encontrada</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/telemedicina')}
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // Pre-call lobby
  if (!isConnected && call.status !== VideoCallStatus.IN_PROGRESS) {
    return (
      <div className="flex h-screen bg-gray-900">
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          {/* Preview */}
          <div className="relative w-full max-w-2xl aspect-video rounded-xl overflow-hidden bg-gray-800 mb-6">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!isVideoOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center text-white">
                  <VideoOff className="h-16 w-16 mx-auto mb-2 opacity-50" />
                  <p>Camera desligada</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <Button
                variant={isMuted ? 'destructive' : 'secondary'}
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              <Button
                variant={!isVideoOn ? 'destructive' : 'secondary'}
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={toggleVideo}
              >
                {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Call Info */}
          <Card className="w-full max-w-md bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="text-center text-white mb-6">
                <h2 className="text-xl font-semibold mb-2">
                  Teleconsulta com {call.patient?.socialName || call.patient?.fullName}
                </h2>
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(parseISO(call.scheduledAt), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                  </span>
                  <span>-</span>
                  <span>{formatDuration(call.scheduledDuration)}</span>
                </div>
              </div>

              {call.status === VideoCallStatus.WAITING ? (
                <div className="text-center mb-6">
                  <Badge className="bg-yellow-500 text-yellow-900 mb-2">
                    Paciente na sala de espera
                  </Badge>
                  <p className="text-gray-400 text-sm">
                    O paciente esta aguardando. Clique para iniciar.
                  </p>
                </div>
              ) : (
                <div className="text-center mb-6 text-gray-400">
                  <p>Aguardando paciente entrar na sala...</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/telemedicina')}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => startCallMutation.mutate()}
                  disabled={startCallMutation.isPending}
                >
                  <Video className="mr-2 h-4 w-4" />
                  {startCallMutation.isPending ? 'Iniciando...' : 'Iniciar Consulta'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configuracoes de Audio e Video</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Camera</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a camera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Camera padrao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Microfone</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o microfone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Microfone padrao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Alto-falante</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o alto-falante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Alto-falante padrao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // In-call interface
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Main Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video (Patient) */}
        <div className="absolute inset-0">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Placeholder when no remote video */}
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center text-white">
              <div className="h-32 w-32 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <User className="h-16 w-16 text-gray-500" />
              </div>
              <p className="text-lg font-medium">
                {call.patient?.socialName || call.patient?.fullName}
              </p>
              <p className="text-gray-400">Conectando...</p>
            </div>
          </div>
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute bottom-24 right-4 w-48 aspect-video rounded-lg overflow-hidden shadow-lg border-2 border-gray-700">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {!isVideoOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <VideoOff className="h-8 w-8 text-gray-500" />
            </div>
          )}
        </div>

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge className={getVideoCallStatusColor(call.status)}>
                {getVideoCallStatusLabel(call.status)}
              </Badge>
              <div className="flex items-center gap-2 text-white">
                <Clock className="h-4 w-4" />
                <span className="font-mono">{formatCallDuration(callDuration)}</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                {connectionQuality === 'poor' ? (
                  <WifiOff className="h-4 w-4 text-red-500" />
                ) : (
                  <Wifi className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm">{formatConnectionQuality(connectionQuality)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={toggleFullScreen}
                    >
                      {isFullScreen ? (
                        <Minimize2 className="h-5 w-5" />
                      ) : (
                        <Maximize2 className="h-5 w-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isFullScreen ? 'Sair da tela cheia' : 'Tela cheia'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex items-center justify-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isMuted ? 'destructive' : 'secondary'}
                    size="icon"
                    className="rounded-full h-14 w-14"
                    onClick={toggleMute}
                  >
                    {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isMuted ? 'Ativar microfone' : 'Desativar microfone'}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={!isVideoOn ? 'destructive' : 'secondary'}
                    size="icon"
                    className="rounded-full h-14 w-14"
                    onClick={toggleVideo}
                  >
                    {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isVideoOn ? 'Desativar camera' : 'Ativar camera'}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isScreenSharing ? 'default' : 'secondary'}
                    size="icon"
                    className="rounded-full h-14 w-14"
                    onClick={toggleScreenShare}
                  >
                    <MonitorUp className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isScreenSharing ? 'Parar compartilhamento' : 'Compartilhar tela'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showChat ? 'default' : 'secondary'}
                    size="icon"
                    className="rounded-full h-14 w-14"
                    onClick={() => setShowChat(!showChat)}
                  >
                    <MessageSquare className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Chat</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showNotes ? 'default' : 'secondary'}
                    size="icon"
                    className="rounded-full h-14 w-14"
                    onClick={() => setShowNotes(!showNotes)}
                  >
                    <FileText className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Anotacoes</TooltipContent>
              </Tooltip>

              <div className="w-px h-10 bg-gray-600 mx-2" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="rounded-full h-14 w-14"
                    onClick={() => setShowEndDialog(true)}
                  >
                    <PhoneOff className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Encerrar consulta</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-white">Chat</h3>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
              onClick={() => setShowChat(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhuma mensagem ainda
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.senderRole === 'DOCTOR' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      msg.senderRole === 'DOCTOR'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-white'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    {format(parseISO(msg.timestamp), 'HH:mm')}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Digite uma mensagem..."
                className="bg-gray-700 border-gray-600 text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!chatMessage.trim() || sendMessageMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Panel */}
      {showNotes && (
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-white">Anotacoes</h3>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
              onClick={() => setShowNotes(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 p-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Faca anotacoes durante a consulta..."
              className="h-full resize-none bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <div className="p-4 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              {updateNotesMutation.isPending
                ? 'Salvando...'
                : 'Anotacoes salvas automaticamente'}
            </p>
          </div>
        </div>
      )}

      {/* End Call Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encerrar Consulta</DialogTitle>
            <DialogDescription>
              Deseja realmente encerrar esta teleconsulta?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted-foreground/20">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">
                  {call.patient?.socialName || call.patient?.fullName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Duracao: {formatCallDuration(callDuration)}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Continuar Consulta
            </Button>
            <Button
              variant="destructive"
              onClick={() => endCallMutation.mutate()}
              disabled={endCallMutation.isPending}
            >
              <PhoneOff className="mr-2 h-4 w-4" />
              {endCallMutation.isPending ? 'Encerrando...' : 'Encerrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
