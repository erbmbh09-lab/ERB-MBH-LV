import { Injectable, signal } from '@angular/core';

export interface Permission {
  id: string;
  name: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface PermissionCategory {
  id: string;
  name: string;
  icon: string;
  groups: PermissionGroup[];
}

const PERMISSION_STRUCTURE: PermissionCategory[] = [
  {
    id: 'caseManagement',
    name: '1. إدارة القضايا',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />',
    groups: [
      { id: 'case.files', name: 'ملفات القضايا', permissions: [
        { id: 'case.files.query', name: 'استعلام' }, { id: 'case.files.add', name: 'إضافة' },
        { id: 'case.files.edit', name: 'تعديل' }, { id: 'case.files.delete', name: 'حذف' },
        { id: 'case.files.archive', name: 'أرشفة' }, { id: 'case.files.print', name: 'طباعة' }
      ]},
      { id: 'case.sessions', name: 'الجلسات', permissions: [
        { id: 'case.sessions.query', name: 'استعلام' }, { id: 'case.sessions.add', name: 'إضافة' },
        { id: 'case.sessions.edit', name: 'تعديل' }, { id: 'case.sessions.delete', name: 'حذف' }
      ]},
      { id: 'case.litigationDegrees', name: 'درجات التقاضي', permissions: [
        { id: 'case.litigationDegrees.query', name: 'استعلام' }, { id: 'case.litigationDegrees.add', name: 'إضافة' },
        { id: 'case.litigationDegrees.edit', name: 'تعديل' }, { id: 'case.litigationDegrees.delete', name: 'حذف' }
      ]},
      { id: 'case.courts', name: 'المحاكم', permissions: [
        { id: 'case.courts.query', name: 'استعلام' }, { id: 'case.courts.add', name: 'إضافة' },
        { id: 'case.courts.edit', name: 'تعديل' }, { id: 'case.courts.delete', name: 'حذف' }
      ]},
      { id: 'case.general', name: 'صلاحيات عامة على القضايا', permissions: [
        { id: 'case.general.assign', name: 'إسناد القضايا للموظفين' }, { id: 'case.general.reopen', name: 'إعادة فتح القضايا المغلقة' },
        { id: 'case.general.merge', name: 'دمج القضايا' }, { id: 'case.general.setPriority', name: 'تحديد القضايا كـ "ذات أولوية قصوى"' },
        { id: 'case.general.viewSessions', name: 'عرض جلسات القضية' }, { id: 'case.general.addUpdates', name: 'إضافة تحديثات على القضية' },
        { id: 'case.general.assignTasks', name: 'إسناد مهام متعلقة بالقضية' }, { id: 'case.general.managePayments', name: 'إدارة المدفوعات والإيصالات' },
        { id: 'case.general.manageBillableHours', name: 'إدارة الساعات الخاضعة للفوترة' }, { id: 'case.general.manageReminders', name: 'إدارة التذكيرات' },
        { id: 'case.general.manageNotifications', name: 'إدارة الإشعارات' }
      ]}
    ]
  },
  {
    id: 'documentManagement',
    name: '2. إدارة المستندات',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />',
    groups: [
      { id: 'doc.documents', name: 'المستندات', permissions: [
        { id: 'doc.documents.query', name: 'استعلام' }, { id: 'doc.documents.add', name: 'إضافة' },
        { id: 'doc.documents.edit', name: 'تعديل' }, { id: 'doc.documents.delete', name: 'حذف' },
        { id: 'doc.documents.print', name: 'طباعة' }
      ]},
      { id: 'doc.memos', name: 'المذكرات', permissions: [
        { id: 'doc.memos.query', name: 'استعلام' }, { id: 'doc.memos.add', name: 'إضافة' },
        { id: 'doc.memos.edit', name: 'تعديل' }, { id: 'doc.memos.delete', name: 'حذف' },
        { id: 'doc.memos.print', name: 'طباعة' }
      ]},
      { id: 'doc.general', name: 'صلاحيات عامة على المستندات', permissions: [
        { id: 'doc.general.restrictAccess', name: 'تقييد الوصول إلى المستندات' }, { id: 'doc.general.manageReminders', name: 'إدارة التذكيرات' },
        { id: 'doc.general.manageNotifications', name: 'إدارة الإشعارات' }
      ]}
    ]
  },
  {
    id: 'clientManagement',
    name: '3. إدارة العملاء',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />',
    groups: [
      { id: 'client.profile', name: 'ملف العميل', permissions: [
        { id: 'client.profile.query', name: 'استعلام' }, { id: 'client.profile.add', name: 'إضافة' },
        { id: 'client.profile.edit', name: 'تعديل' }, { id: 'client.profile.delete', name: 'حذف' }
      ]},
      { id: 'client.opponent', name: 'ملف الخصم', permissions: [
        { id: 'client.opponent.query', name: 'استعلام' }, { id: 'client.opponent.add', name: 'إضافة' },
        { id: 'client.opponent.edit', name: 'تعديل' }, { id: 'client.opponent.delete', name: 'حذف' }
      ]},
      { id: 'client.communication', name: 'صلاحيات التواصل', permissions: [
        { id: 'client.comm.whatsapp', name: 'إرسال تحديثات الجلسة عبر واتساب' }, { id: 'client.comm.email', name: 'إرسال تحديثات الجلسة عبر البريد الإلكتروني' },
        { id: 'client.comm.legalNotices', name: 'إرسال إخطارات قانونية' }, { id: 'client.comm.manage', name: 'إدارة التواصل مع العميل' }
      ]},
      { id: 'client.general', name: 'صلاحيات عامة على العملاء', permissions: [
        { id: 'client.general.manageAppointments', name: 'إدارة مواعيد العملاء' }, { id: 'client.general.manageConsultations', name: 'إدارة الاستشارات القانونية' },
        { id: 'client.general.approveAccess', name: 'الموافقة على وصول العميل لملفات القضية' }, { id: 'client.general.viewUpdateLog', name: 'عرض سجل تحديثات العميل' },
        { id: 'client.general.viewCallLog', name: 'عرض سجل المكالمات' }, { id: 'client.general.viewGoAML', name: 'عرض سجل ملفات "Go AML"' },
        { id: 'client.general.checkAML', name: 'التحقق من العميل ضمن قائمة مكافحة غسيل الأموال (AML)' }, { id: 'client.general.manageBillableHours', name: 'إدارة الساعات الخاضعة للفوترة' },
        { id: 'client.general.manageReminders', name: 'إدارة التذكيرات' }, { id: 'client.general.manageNotifications', name: 'إدارة الإشعارات' }
      ]}
    ]
  },
    {
    id: 'financeManagement',
    name: '4. الإدارة المالية',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />',
    groups: [
      { id: 'finance.agreements', name: 'الاتفاقيات المهنية', permissions: [
        { id: 'finance.agreements.query', name: 'استعلام' }, { id: 'finance.agreements.add', name: 'إضافة' },
        { id: 'finance.agreements.edit', name: 'تعديل' }, { id: 'finance.agreements.delete', name: 'حذف' }
      ]},
      { id: 'finance.billing', name: 'صلاحيات الفواتير والمدفوعات', permissions: [
        { id: 'finance.billing.approveNewCase', name: 'الموافقة على قضية جديدة' }, { id: 'finance.billing.createInvoice', name: 'إنشاء فاتورة' },
        { id: 'finance.billing.approveInvoice', name: 'الموافقة على فاتورة' }, { id: 'finance.billing.manageTerms', name: 'إدارة شروط الدفع' },
        { id: 'finance.billing.manageRefunds', name: 'إدارة طلبات استرداد الأموال' }, { id: 'finance.billing.managePayments', name: 'إدارة مدفوعات وإيصالات العملاء' },
        { id: 'finance.billing.viewBalance', name: 'عرض رصيد العميل' }, { id: 'finance.billing.approveHours', name: 'قبول/رفض الساعات الخاضعة للفوترة' }
      ]},
      { id: 'finance.general', name: 'صلاحيات عامة', permissions: [
        { id: 'finance.general.manageReminders', name: 'إدارة التذكيرات' }, { id: 'finance.general.manageNotifications', name: 'إدارة الإشعارات' }
      ]}
    ]
  },
  {
    id: 'hrManagement',
    name: '5. الموارد البشرية (HR)',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />',
    groups: [
      { id: 'hr.employees', name: 'الموظفين', permissions: [
        { id: 'hr.employees.query', name: 'استعلام' }, { id: 'hr.employees.add', name: 'إضافة' },
        { id: 'hr.employees.edit', name: 'تعديل' }, { id: 'hr.employees.delete', name: 'حذف' }
      ]},
      { id: 'hr.attachments', name: 'المرفقات', permissions: [
        { id: 'hr.attachments.query', name: 'استعلام' }, { id: 'hr.attachments.add', name: 'إضافة' },
        { id: 'hr.attachments.delete', name: 'حذف' }
      ]},
      { id: 'hr.attendance', name: 'الحضور والانصراف', permissions: [
        { id: 'hr.attendance.query', name: 'استعلام' }, { id: 'hr.attendance.edit', name: 'تعديل' }
      ]},
      { id: 'hr.memos', name: 'التعاميم والإشعارات', permissions: [
        { id: 'hr.memos.query', name: 'استعلام' }, { id: 'hr.memos.add', name: 'إضافة' },
        { id: 'hr.memos.delete', name: 'حذف' }
      ]},
      { id: 'hr.general', name: 'صلاحيات عامة للموارد البشرية', permissions: [
        { id: 'hr.general.manageLeave', name: 'إدارة طلبات إجازات الموظفين' }, { id: 'hr.general.approveLeave', name: 'قبول/رفض إجازات الموظفين' },
        { id: 'hr.general.manageCompanyDocs', name: 'إدارة مستندات الشركة' }, { id: 'hr.general.manageAssets', name: 'إدارة أصول الشركة' },
        { id: 'hr.general.viewAccessLog', name: 'عرض سجل الوصول' }, { id: 'hr.general.restrictOnLeave', name: 'تقييد وصول المستخدم في حالة الإجازة' },
        { id: 'hr.general.manageReminders', name: 'إدارة التذكيرات' }, { id: 'hr.general.manageNotifications', name: 'إدارة الإشعارات' }
      ]}
    ]
  },
  {
    id: 'security',
    name: '6. الأمان ووصول المستخدمين',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />',
    groups: [
      { id: 'security.access', name: 'صلاحيات الأمان', permissions: [
        { id: 'security.access.createUser', name: 'إنشاء مستخدم جديد' }, { id: 'security.access.assignRoles', name: 'تعيين دور وصلاحيات للمستخدم' },
        { id: 'security.access.resetPassword', name: 'إعادة تعيين كلمة المرور للمستخدمين' }, { id: 'security.access.viewLoginLog', name: 'عرض سجل دخول المستخدمين' },
        { id: 'security.access.disableUser', name: 'تعطيل وصول المستخدم' }, { id: 'security.access.monitorAlerts', name: 'مراقبة تنبيهات أمان النظام' }
      ]}
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private userPermissions = signal<Map<number, Set<string>>>(new Map());

  constructor() {
    this.initializeMockPermissions();
  }

  getPermissionStructure(): PermissionCategory[] {
    return PERMISSION_STRUCTURE;
  }

  getPermissionsForUser(userId: number): Set<string> {
    return this.userPermissions().get(userId) || new Set();
  }

  savePermissionsForUser(userId: number, permissions: Set<string>): void {
    this.userPermissions.update(currentMap => {
      const newMap = new Map(currentMap);
      newMap.set(userId, permissions);
      return newMap;
    });
    console.log(`Permissions saved for user ${userId}:`, Array.from(permissions));
  }

  private initializeMockPermissions(): void {
    const lawyerPermissions = new Set([
      'case.files.query', 'case.files.add', 'case.files.edit', 'case.files.print',
      'case.sessions.query', 'case.sessions.add', 'case.sessions.edit',
      'case.litigationDegrees.query', 'case.litigationDegrees.add',
      'case.courts.query',
      'case.general.viewSessions', 'case.general.addUpdates', 'case.general.assignTasks',
      'doc.documents.query', 'doc.documents.add', 'doc.documents.edit', 'doc.documents.print',
      'doc.memos.query', 'doc.memos.add', 'doc.memos.edit',
      'client.profile.query', 'client.profile.add', 'client.profile.edit',
      'client.opponent.query', 'client.opponent.add',
      'client.comm.whatsapp', 'client.comm.email', 'client.comm.manage',
      'client.general.manageAppointments',
      'finance.billing.createInvoice', 'finance.billing.viewBalance',
    ]);

    const consultantPermissions = new Set([
        ...lawyerPermissions,
        'case.general.assign', 'case.general.reopen', 'case.general.setPriority',
        'doc.general.restrictAccess',
        'client.general.approveAccess', 'client.general.viewUpdateLog', 'client.general.viewCallLog',
        'finance.billing.approveInvoice', 'finance.billing.approveHours',
        'hr.employees.query', 'hr.attendance.query',
        'hr.general.approveLeave',
    ]);
    
     const clientPermissions = new Set([
      'case.files.query',
      'case.sessions.query',
      'doc.documents.query',
      'client.profile.query', 'client.profile.edit',
    ]);

    this.userPermissions.set(new Map([
      [101, lawyerPermissions],         // أحمد محمود (محامي)
      [102, lawyerPermissions],         // خالد العامري (محامي)
      [103, consultantPermissions],     // مريم المنصوري (مستشار قانوني)
      [104, new Set()],                 // فاطمة الزهراء (سكرتيرة)
      [105, new Set()],                 // علي حسن (باحث قانوني)
      [7607, clientPermissions],        // محمد سالم... (موكل)
      [7606, clientPermissions],        // شركة ميدسير... (موكل)
    ]));
  }
}
