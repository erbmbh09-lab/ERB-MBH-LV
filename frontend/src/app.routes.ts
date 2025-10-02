import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
    data: { title: 'تسجيل الدخول' }
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    data: { title: 'لوحة التحكم' }
  },
  {
    path: 'cases',
    loadComponent: () => import('./components/case-management/case-management.component').then(m => m.CaseManagementComponent),
    canActivate: [authGuard],
    data: { title: 'إدارة القضايا' }
  },
  {
    path: 'clients',
    loadComponent: () => import('./components/client-management/client-management.component').then(m => m.ClientManagementComponent),
    canActivate: [authGuard],
    data: { title: 'إدارة العملاء' }
  },
  {
    path: 'financials',
    loadComponent: () => import('./components/financial-management/financial-management.component').then(m => m.FinancialManagementComponent),
    canActivate: [authGuard],
    data: { title: 'الإدارة المالية' }
  },
  {
    path: 'hr',
    loadComponent: () => import('./components/hr-management/hr-management.component').then(m => m.HrManagementComponent),
    canActivate: [authGuard],
    data: { title: 'الموارد البشرية' }
  },
  {
    path: 'tasks',
    loadComponent: () => import('./components/task-management/task-management.component').then(m => m.TaskManagementComponent),
    canActivate: [authGuard],
    data: { title: 'إدارة المهام' }
  },
  {
    path: 'consultations',
    loadComponent: () => import('./components/legal-consultations/legal-consultations.component').then(m => m.LegalConsultationsComponent),
    canActivate: [authGuard],
    data: { title: 'الاستشارات القانونية' }
  },
  {
    path: 'goaml',
    loadComponent: () => import('./components/goaml-check/goaml-check.component').then(m => m.GoamlCheckComponent),
    canActivate: [authGuard],
    data: { title: 'تحقق GoAML' }
  },
  {
    path: 'call-log',
    loadComponent: () => import('./components/call-log/call-log.component').then(m => m.CallLogComponent),
    canActivate: [authGuard],
    data: { title: 'سجل المكالمات' }
  },
  {
    path: 'leads',
    loadComponent: () => import('./components/prospective-clients/prospective-clients.component').then(m => m.ProspectiveClientsComponent),
    canActivate: [authGuard],
    data: { title: 'العملاء المحتملون' }
  },
  {
    path: 'customer-requests',
    loadComponent: () => import('./components/customer-requests/customer-requests.component').then(m => m.CustomerRequestsComponent),
    canActivate: [authGuard],
    data: { title: 'طلبات العملاء' }
  },
  {
    path: 'client-portal',
    loadComponent: () => import('./components/client-portal/client-portal.component').then(m => m.ClientPortalComponent),
    canActivate: [authGuard],
    data: { title: 'بوابة العميل' }
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard],
    data: { title: 'الإعدادات' }
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
