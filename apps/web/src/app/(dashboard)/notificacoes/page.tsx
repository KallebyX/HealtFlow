'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Calendar,
  CalendarCheck,
  CalendarX,
  Clock,
  FlaskConical,
  AlertTriangle,
  FileText,
  CreditCard,
  CheckCircle,
  FileUp,
  MessageSquare,
  Cake,
  Repeat,
  Check,
  Trash2,
  Settings,
  Archive,
  CheckCheck,
  Filter,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { notificationsApi } from '@/lib/api/notifications';
import {
  NotificationType,
  NotificationPriority,
  getNotificationTypeLabel,
  getNotificationPriorityColor,
  formatTimeAgo,
} from '@/types/notification';
import type { Notification } from '@/types/notification';

const iconMap: Record<NotificationType, React.ElementType> = {
  [NotificationType.APPOINTMENT_REMINDER]: Calendar,
  [NotificationType.APPOINTMENT_CONFIRMED]: CalendarCheck,
  [NotificationType.APPOINTMENT_CANCELLED]: CalendarX,
  [NotificationType.APPOINTMENT_RESCHEDULED]: Clock,
  [NotificationType.EXAM_READY]: FlaskConical,
  [NotificationType.EXAM_CRITICAL]: AlertTriangle,
  [NotificationType.PRESCRIPTION_SIGNED]: FileText,
  [NotificationType.PRESCRIPTION_EXPIRING]: Clock,
  [NotificationType.PAYMENT_DUE]: CreditCard,
  [NotificationType.PAYMENT_RECEIVED]: CheckCircle,
  [NotificationType.DOCUMENT_UPLOADED]: FileUp,
  [NotificationType.MESSAGE_RECEIVED]: MessageSquare,
  [NotificationType.SYSTEM_ALERT]: Bell,
  [NotificationType.BIRTHDAY_REMINDER]: Cake,
  [NotificationType.FOLLOW_UP_REMINDER]: Repeat,
};

export default function NotificacoesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter, typeFilter],
    queryFn: () =>
      notificationsApi.list({
        limit: 50,
        read: filter === 'unread' ? false : undefined,
        type: typeFilter !== 'all' ? (typeFilter as NotificationType) : undefined,
        archived: false,
      }),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Notificacoes' },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificacoes</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `Voce tem ${unreadCount} notificacao(oes) nao lida(s)`
              : 'Todas as notificacoes foram lidas'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Marcar todas como lidas
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push('/configuracoes/notificacoes')}>
            <Settings className="mr-2 h-4 w-4" />
            Preferencias
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="unread">
                  Nao lidas
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.values(NotificationType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {getNotificationTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Bell className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-4 text-lg font-medium">Nenhuma notificacao</p>
              <p className="mt-1">
                {filter === 'unread'
                  ? 'Todas as notificacoes foram lidas'
                  : 'Voce nao tem notificacoes ainda'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onMarkAsRead={() => markAsReadMutation.mutate(notification.id)}
                  onArchive={() => archiveMutation.mutate(notification.id)}
                  onDelete={() => deleteMutation.mutate(notification.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationCard({
  notification,
  onClick,
  onMarkAsRead,
  onArchive,
  onDelete,
}: {
  notification: Notification;
  onClick: () => void;
  onMarkAsRead: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const Icon = iconMap[notification.type] || Bell;
  const priorityColor = getNotificationPriorityColor(notification.priority);

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-lg border transition-colors hover:bg-muted/50 ${
        !notification.read ? 'bg-muted/30 border-primary/20' : ''
      }`}
    >
      <button onClick={onClick} className="flex-1 flex items-start gap-4 text-left">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
            notification.priority === NotificationPriority.URGENT
              ? 'bg-red-100'
              : notification.priority === NotificationPriority.HIGH
              ? 'bg-orange-100'
              : 'bg-muted'
          }`}
        >
          <Icon className={`h-6 w-6 ${priorityColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p
                className={`text-sm ${
                  !notification.read ? 'font-semibold' : 'font-medium'
                }`}
              >
                {notification.title}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {notification.message}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {getNotificationTypeLabel(notification.type)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(notification.createdAt)}
                </span>
              </div>
            </div>
            {!notification.read && (
              <div className="h-2 w-2 shrink-0 rounded-full bg-primary mt-2" />
            )}
          </div>
        </div>
      </button>

      <div className="flex items-center gap-1">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead();
            }}
            title="Marcar como lida"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onArchive();
          }}
          title="Arquivar"
        >
          <Archive className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
