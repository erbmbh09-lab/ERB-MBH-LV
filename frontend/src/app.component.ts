import { Component, ChangeDetectionStrategy, signal, effect, ElementRef, Renderer2, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';

import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ThemeService } from './services/theme.service';
import { NotificationPanelComponent } from './components/notification-panel/notification-panel.component';
import { NotificationService } from './services/notification.service';
import { DataHubService } from './services/data-hub.service';
import { GoogleCalendarService } from './services/google-calendar.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    NotificationPanelComponent,
    RouterOutlet,
  ]
})
export class AppComponent {
  isNotificationPanelVisible = signal(false);

  notificationService = inject(NotificationService);
  themeService = inject(ThemeService);
  dataHubService = inject(DataHubService);
  googleCalendarService = inject(GoogleCalendarService);
  authService = inject(AuthService);
  
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);
  // FIX: Explicitly type `router` to resolve a potential type inference issue where it was being treated as 'unknown'.
  private router: Router = inject(Router);

  constructor() {
    effect(() => {
      // Handle dark/light theme class
      const theme = this.themeService.theme();
      const root = this.elementRef.nativeElement.ownerDocument.documentElement;
      if (theme === 'dark') {
        this.renderer.addClass(root, 'dark');
      } else {
        this.renderer.removeClass(root, 'dark');
      }
      
      // Handle font family
      const font = this.themeService.font();
      this.renderer.setStyle(this.elementRef.nativeElement.ownerDocument.body, 'font-family', font);

      // Handle dynamic primary color CSS variables
      const color = this.themeService.primaryColor();
      const palette = this.themeService.colorPalette[color];
      
      const primaryShades = theme === 'dark' ? palette.dark : palette.light;
      Object.entries(primaryShades).forEach(([shade, value]) => {
          this.renderer.setStyle(root, `--primary-${shade}`, value);
      });

      const secondaryShades = theme === 'dark' ? palette.secondary.dark : palette.secondary.light;
       Object.entries(secondaryShades).forEach(([shade, value]) => {
          this.renderer.setStyle(root, `--secondary-${shade}`, value);
      });
    });

    effect(() => {
      if (this.dataHubService.caseToOpen()) {
        this.router.navigate(['/cases']);
      }
    });
    
    // Initialize Google Calendar Service
    const googleClientId = localStorage.getItem('googleClientId');
    if (googleClientId) {
      this.googleCalendarService.initClient(googleClientId);
    }
  }

  toggleNotificationPanel() {
    // Regenerate notifications every time the panel is about to be opened
    if (!this.isNotificationPanelVisible()) {
      this.notificationService.generateSystemNotifications();
    }
    this.isNotificationPanelVisible.update(visible => !visible);
  }
}
