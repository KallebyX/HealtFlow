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
  MoreHorizontal,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { notificationsApi } from '@/lib/api/notifications';
import {
  NotificationType,
  NotificationPriority,
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

export function NotificationsDropdown() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list({ limit: 10, archived: false }),
    refetchInterval: 30000, // Refetch every 30 seconds
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

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setOpen(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificacoes</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificacoes</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllAsReadMutation.mutate()}
            >
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="mx-auto h-8 w-8 opacity-50" />
            <p className="mt-2 text-sm">Nenhuma notificacao</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </ScrollArea>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-primary cursor-pointer"
          onClick={() => {
            router.push('/notificacoes');
            setOpen(false);
          }}
        >
          Ver todas as notificacoes
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const Icon = iconMap[notification.type] || Bell;
  const priorityColor = getNotificationPriorityColor(notification.priority);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 hover:bg-muted transition-colors flex gap-3 ${
        !notification.read ? 'bg-muted/50' : ''
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          notification.priority === NotificationPriority.URGENT
            ? 'bg-red-100'
            : notification.priority === NotificationPriority.HIGH
            ? 'bg-orange-100'
            : 'bg-muted'
        }`}
      >
        <Icon className={`h-5 w-5 ${priorityColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm line-clamp-2 ${
              !notification.read ? 'font-medium' : 'text-muted-foreground'
            }`}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <div className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1.5" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}

export default NotificationsDropdown;
