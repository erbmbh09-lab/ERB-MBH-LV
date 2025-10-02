import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PermissionService, PermissionCategory, PermissionGroup } from '../../services/permission.service';
import { DataHubService } from '../../services/data-hub.service';
import { Employee } from '../../services/hr.service';
import { Client } from '../../services/client.service';
import { NotificationService } from '../../services/notification.service';

// FIX: The User type now ensures 'name' and 'role' properties exist, which are needed for display and sorting. This resolves issues in computed signals that rely on these properties.
type User = (Employee | Client) & { userType: 'Employee' | 'Client', name: string, role: string };

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './permissions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsComponent {
  permissionService = inject(PermissionService);
  dataHubService = inject(DataHubService);
  notificationService = inject(NotificationService);

  searchTerm = signal('');
  permissionStructure = signal<PermissionCategory[]>([]);
  
  selectedUser = signal<User | null>(null);
  selectedUserPermissions = signal<Set<string>>(new Set());
  private originalUserPermissions = new Set<string>();

  isDirty = computed(() => {
    if (!this.selectedUser()) return false;
    if (this.selectedUserPermissions().size !== this.originalUserPermissions.size) return true;
    for (const perm of this.selectedUserPermissions()) {
      if (!this.originalUserPermissions.has(perm)) return true;
    }
    return false;
  });

  allUsers = computed<User[]>(() => {
    // FIX: Access employees through the correctly typed `dataHubService.hr` property.
    const employees: User[] = this.dataHubService.hr.employees().map(e => ({ ...e, userType: 'Employee' }));
    // FIX: Access clients through the correctly typed `dataHubService.clients` property.
    const clients: User[] = this.dataHubService.clients.clients()
      .filter(c => c.loginEnabled)
      .map(c => ({ ...c, name: c.nameAr, role: c.classification, userType: 'Client' }));
    return [...employees, ...clients].sort((a,b) => a.name.localeCompare(b.name));
  });

  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.allUsers();
    return this.allUsers().filter(user => 
      user.name.toLowerCase().includes(term) ||
      user.id.toString().includes(term)
    );
  });

  constructor() {
    this.permissionStructure.set(this.permissionService.getPermissionStructure());
  }

  selectUser(user: User): void {
    if (this.isDirty()) {
      if (!confirm('لديك تغييرات غير محفوظة. هل تريد تجاهلها؟')) {
        return;
      }
    }
    this.selectedUser.set(user);
    const perms = this.permissionService.getPermissionsForUser(user.id);
    this.selectedUserPermissions.set(new Set(perms));
    this.originalUserPermissions = new Set(perms);
  }

  togglePermission(permissionId: string, isChecked: boolean): void {
    this.selectedUserPermissions.update(currentPerms => {
      const newPerms = new Set(currentPerms);
      if (isChecked) {
        newPerms.add(permissionId);
      } else {
        newPerms.delete(permissionId);
      }
      return newPerms;
    });
  }

  toggleGroupPermissions(group: PermissionGroup, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.selectedUserPermissions.update(currentPerms => {
      const newPerms = new Set(currentPerms);
      for (const perm of group.permissions) {
        if (isChecked) {
          newPerms.add(perm.id);
        } else {
          newPerms.delete(perm.id);
        }
      }
      return newPerms;
    });
  }

  isGroupChecked(group: PermissionGroup): boolean {
    const currentPerms = this.selectedUserPermissions();
    return group.permissions.every(p => currentPerms.has(p.id));
  }

  isGroupIndeterminate(group: PermissionGroup): boolean {
    const currentPerms = this.selectedUserPermissions();
    const hasSome = group.permissions.some(p => currentPerms.has(p.id));
    const hasAll = group.permissions.every(p => currentPerms.has(p.id));
    return hasSome && !hasAll;
  }

  saveChanges(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.permissionService.savePermissionsForUser(user.id, this.selectedUserPermissions());
    this.originalUserPermissions = new Set(this.selectedUserPermissions());

    this.notificationService.addNotification({
      type: 'success',
      title: 'تم حفظ الصلاحيات',
      message: `تم تحديث صلاحيات المستخدم "${user.name}" بنجاح.`
    });
  }

  resetChanges(): void {
    this.selectedUserPermissions.set(new Set(this.originalUserPermissions));
  }
}
