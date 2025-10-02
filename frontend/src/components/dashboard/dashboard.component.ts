import { Component, ChangeDetectionStrategy, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataHubService } from '../../services/data-hub.service';
import { LegalDeadline } from '../../services/case.service';
import { NotificationService } from '../../services/notification.service';

export interface LateSessionDecision {
  sessionId: number;
  caseId: string;
  sessionDate: Date;
  caseNumber: string;
  clientName: string;
  delayHours: number;
}

export interface HearingOrAppeal {
  caseId: string;
  status: string;
  hearingDate: string;
  caseNumber: string;
  client: string;
  sideDate: string;
  details?: string;
  detailsType?: 'info' | 'warning';
  reservedForJudgment?: boolean;
  judgmentPostponed?: boolean;
}

// Constants for configuration
const LATE_DECISION_THRESHOLD_HOURS = 3;
const LATE_NOTIFICATION_THRESHOLD_HOURS = 24;
const UPCOMING_HEARINGS_DAYS = 7;
const APPEAL_CRITICAL_DAYS = 7;
const DELAY_CRITICAL_DAYS = 7;
const DELAY_WARNING_DAYS = 2;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private dataHubService = inject(DataHubService);
  private notificationService = inject(NotificationService);

  private notifiedLateSessions = new Set<number>();

  dashboardStats = computed(() => {
    try {
      const cases = this.dataHubService.cases.cases() ?? [];
      const activeCases = cases.filter(c => c.status === 'مفتوحة' || c.status === 'قيد التنفيذ').length;
      const deadlines = this.appealDeadlines()?.length ?? 0;
      const lateDecisions = this.lateSessionDecisions()?.length ?? 0;
      return { activeCases, deadlines, lateDecisions };
    } catch (error) {
      console.error("Error computing dashboard stats:", error);
      return { activeCases: 0, deadlines: 0, lateDecisions: 0 };
    }
  });

  lateSessionDecisions = computed((): LateSessionDecision[] => {
    try {
      const now = new Date();
      const threshold = new Date(now.getTime() - (LATE_DECISION_THRESHOLD_HOURS * 60 * 60 * 1000));
      const sessions = this.dataHubService.cases.sessions();

      if (!sessions) return [];

      return sessions
        .filter(session => {
          if (!session || !session.sessionDate) return false;
          const sessionDate = new Date(session.sessionDate);
          if (isNaN(sessionDate.getTime())) return false;
          return sessionDate < threshold && (!session.sessionDecision || session.sessionDecision.trim() === '');
        })
        .map(session => {
          const sessionDate = new Date(session.sessionDate);
          const delayMilliseconds = now.getTime() - sessionDate.getTime();
          const delayHours = Math.floor(delayMilliseconds / (1000 * 60 * 60));
          return {
            sessionId: session.id,
            caseId: session.caseId,
            sessionDate: session.sessionDate,
            caseNumber: this.formatCaseNumber(session.case),
            clientName: this.getClientName(session.client),
            delayHours: Math.max(0, delayHours),
          };
        })
        .sort((a, b) => b.delayHours - a.delayHours);
    } catch (error) {
        console.error("Error computing late session decisions:", error);
        return [];
    }
  });

  appealDeadlines = computed((): LegalDeadline[] => {
    try {
        const deadlines = this.dataHubService.cases.legalDeadlines();
        if (!deadlines) return [];
        return [...deadlines].sort((a, b) => a.daysRemaining - b.daysRemaining);
    } catch (error) {
        console.error("Error computing appeal deadlines:", error);
        return [];
    }
  });

  weeklyHearings = computed(() => {
    try {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + UPCOMING_HEARINGS_DAYS);
        today.setHours(0, 0, 0, 0);

        const sessions = this.dataHubService.cases.sessions();
        if (!sessions) return [];

        return sessions
          .filter(session => {
            if (!session?.sessionDate) return false;
            const sessionDate = new Date(session.sessionDate);
            if (isNaN(sessionDate.getTime())) return false;
            return sessionDate >= today && sessionDate <= nextWeek;
          })
          .map(session => {
            const sessionDate = new Date(session.sessionDate);
            const caseDate = new Date(session.case?.date);
            
            return {
              caseId: session.caseId,
              status: session.previousDecision || 'N/A',
              hearingDate: !isNaN(sessionDate.getTime()) ? sessionDate.toLocaleDateString('ar-AE-u-nu-latn', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'تاريخ غير صالح',
              caseNumber: this.formatCaseNumber(session.case),
              client: this.getClientName(session.client),
              sideDate: !isNaN(caseDate.getTime()) ? caseDate.toLocaleDateString('ar-AE-u-nu-latn', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'تاريخ غير صالح',
              details: session.sessionDecision || session.notes || undefined,
              detailsType: session.sessionDecision ? 'warning' : (session.notes ? 'info' : undefined),
              reservedForJudgment: session.reservedForJudgment,
              judgmentPostponed: session.judgmentPostponed,
            } as HearingOrAppeal;
          })
          .slice(0, 5);
    } catch (error) {
        console.error("Error computing weekly hearings:", error);
        return [];
    }
  });
  
  constructor() {
    effect(() => {
      try {
        const decisions = this.lateSessionDecisions();
        if (!decisions) return;

        for (const decision of decisions) {
            if (this.notifiedLateSessions.has(decision.sessionId)) {
                continue; // Already notified in this session
            }

            if (decision.delayHours > LATE_NOTIFICATION_THRESHOLD_HOURS) {
                const delayFormatted = this.formatDelay(decision.delayHours);
                this.notificationService.addNotification({
                    type: 'alert',
                    title: `تنبيه عاجل: قرار جلسة متأخر للقضية ${decision.caseNumber}`,
                    message: `لم يتم إدخال قرار الجلسة منذ ${delayFormatted}. تاريخ الجلسة: ${new Date(decision.sessionDate).toLocaleDateString('ar-AE-u-nu-latn')}. يرجى المتابعة العاجلة.`
                });
                this.notifiedLateSessions.add(decision.sessionId);
            }
        }
      } catch (error) {
        console.error("Error in late session notification effect:", error);
      }
    });
  }

  private formatCaseNumber(caseInfo: { type: string; number: string; year: string } | undefined): string {
    if (!caseInfo || !caseInfo.type || !caseInfo.number || !caseInfo.year) {
      return 'رقم قضية غير متوفر';
    }
    return `${caseInfo.type} - ${caseInfo.number}/${caseInfo.year}`;
  }

  private getClientName(clientInfo: { name: string } | undefined): string {
    return clientInfo?.name || 'عميل غير محدد';
  }

  getDelayClass(delayHours: number): string {
    const days = delayHours / 24;
    if (days > DELAY_CRITICAL_DAYS) return 'bg-red-500 hover:bg-red-600';
    if (days > DELAY_WARNING_DAYS) return 'bg-yellow-500 hover:bg-yellow-600';
    return 'bg-blue-500 hover:bg-blue-600';
  }
  
  formatDelay(delayHours: number): string {
    if (delayHours < 24) {
      return `${delayHours} ساعة`;
    }
    const days = Math.floor(delayHours / 24);
    return `${days} يوم`;
  }

  getAppealCardClass(days: number): string {
    if (days < 0) return 'bg-red-50 dark:bg-red-900/40 border-red-400';
    if (days <= APPEAL_CRITICAL_DAYS) return 'bg-yellow-50 dark:bg-yellow-900/40 border-yellow-400';
    return 'bg-gray-50 dark:bg-gray-700/50 border-gray-400';
  }

  navigateToCase(caseId: string) {
    if (!caseId) {
        this.notificationService.addNotification({
            type: 'alert', title: 'خطأ', message: 'رقم القضية غير صالح.'
        });
        return;
    }
    this.dataHubService.caseToOpen.set(caseId);
  }
}