import { Component, ChangeDetectionStrategy, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { NotificationType, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationPanelComponent {
  close = output<void>();
  notificationService = inject(NotificationService);

  getIconForType(type: NotificationType): string {
    switch (type) {
      case 'alert':
        return '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />';
      case 'reminder':
        return '<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />';
      case 'info':
        return '<path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />';
      case 'success':
          return '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />';
    }
  }

  getColorsForType(type: NotificationType): string {
      switch (type) {
          case 'alert': return 'text-red-500 bg-red-100 dark:bg-red-900/50';
          case 'reminder': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/50';
          case 'info': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/50';
          case 'success': return 'text-green-500 bg-green-100 dark:bg-green-900/50';
      }
  }

  onNotificationClick(notification: Notification) {
      if (!notification.read) {
          this.notificationService.markAsRead(notification.id);
      }
      // Potentially navigate to the related item
  }

  markAllAsRead() {
      this.notificationService.markAllAsRead();
  }

  closePanel() {
    this.close.emit();
  }

  timeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `قبل ${Math.floor(interval)} سنة`;
    interval = seconds / 2592000;
    if (interval > 1) return `قبل ${Math.floor(interval)} شهر`;
    interval = seconds / 86400;
    if (interval > 1) return `قبل ${Math.floor(interval)} يوم`;
    interval = seconds / 3600;
    if (interval > 1) return `قبل ${Math.floor(interval)} ساعة`;
    interval = seconds / 60;
    if (interval > 1) return `قبل ${Math.floor(interval)} دقيقة`;
    return 'الآن';
  }
}