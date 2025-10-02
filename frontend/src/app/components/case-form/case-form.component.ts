import { Component, ChangeDetectionStrategy, inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CaseFormService, CaseFormData } from '../../services/case-form.service';
import { EntityFormService } from '../../services/entity-form.service';
import { EntityType, LegalEntity } from '../../interfaces/legal-definitions';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-case-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="case-form">
      <!-- Basic Information -->
      <div class="form-section">
        <h3>معلومات القضية الأساسية</h3>
        <div class="form-group">
          <label for="title">عنوان القضية</label>
          <input id="title" type="text" formControlName="title"
                 [class.is-invalid]="form.get('title')?.invalid && form.get('title')?.touched">
          <div class="invalid-feedback" *ngIf="form.get('title')?.errors as errors">
            {{ getValidationMessage('title', errors) }}
          </div>
        </div>

        <div class="form-group">
          <label for="caseNumber">رقم القضية</label>
          <input id="caseNumber" type="text" formControlName="caseNumber"
                 [class.is-invalid]="form.get('caseNumber')?.invalid && form.get('caseNumber')?.touched">
          <div class="invalid-feedback" *ngIf="form.get('caseNumber')?.errors as errors">
            {{ getValidationMessage('caseNumber', errors) }}
          </div>
        </div>

        <div class="form-group">
          <label for="court">المحكمة</label>
          <select id="court" formControlName="court"
                  [class.is-invalid]="form.get('court')?.invalid && form.get('court')?.touched">
            <option value="">اختر المحكمة</option>
            <option *ngFor="let court of courts" [value]="court.id">
              {{ court.nameAr }}
            </option>
          </select>
        </div>
      </div>

      <!-- Parties -->
      <div class="form-section">
        <h3>أطراف القضية</h3>
        <div class="form-group">
          <label>العميل</label>
          <div class="client-selector">
            <select formControlName="client"
                    [class.is-invalid]="form.get('client')?.invalid && form.get('client')?.touched">
              <option value="">اختر العميل</option>
              <option *ngFor="let client of clients" [value]="client.id">
                {{ client.nameAr }}
              </option>
            </select>
            <button type="button" (click)="openNewClientForm()">إضافة عميل جديد</button>
          </div>
        </div>

        <div class="form-group">
          <label>الخصوم</label>
          <div formArrayName="opponents">
            <div *ngFor="let opponent of opponentsArray.controls; let i=index"
                 [formGroupName]="i" class="opponent-item">
              <select formControlName="id"
                      [class.is-invalid]="opponent.get('id')?.invalid && opponent.get('id')?.touched">
                <option value="">اختر الخصم</option>
                <option *ngFor="let opp of opponents" [value]="opp.id">
                  {{ opp.nameAr }}
                </option>
              </select>
              <button type="button" (click)="removeOpponent(i)">حذف</button>
            </div>
          </div>
          <button type="button" (click)="addOpponent()">إضافة خصم</button>
          <button type="button" (click)="openNewOpponentForm()">إضافة خصم جديد</button>
        </div>
      </div>

      <!-- Details -->
      <div class="form-section">
        <h3>تفاصيل القضية</h3>
        <div class="form-group">
          <label for="subject">موضوع القضية</label>
          <textarea id="subject" formControlName="subject" rows="4"
                    [class.is-invalid]="form.get('subject')?.invalid && form.get('subject')?.touched">
          </textarea>
        </div>

        <div class="form-group">
          <label for="value">قيمة القضية</label>
          <input id="value" type="number" formControlName="value"
                 [class.is-invalid]="form.get('value')?.invalid && form.get('value')?.touched">
        </div>

        <div class="form-group">
          <label for="filingDate">تاريخ القيد</label>
          <input id="filingDate" type="date" formControlName="filingDate"
                 [class.is-invalid]="form.get('filingDate')?.invalid && form.get('filingDate')?.touched">
        </div>
      </div>

      <!-- Team Assignment -->
      <div class="form-section">
        <h3>فريق العمل</h3>
        <div formArrayName="assignedTeam">
          <div *ngFor="let member of assignedTeamArray.controls; let i=index"
               [formGroupName]="i" class="team-member">
            <select formControlName="id"
                    [class.is-invalid]="member.get('id')?.invalid && member.get('id')?.touched">
              <option value="">اختر عضو الفريق</option>
              <option *ngFor="let emp of employees" [value]="emp.id">
                {{ emp.name }}
              </option>
            </select>
            <select formControlName="role">
              <option value="lead">محامي رئيسي</option>
              <option value="support">محامي مساعد</option>
              <option value="admin">إداري</option>
            </select>
            <button type="button" (click)="removeTeamMember(i)">حذف</button>
          </div>
          <button type="button" (click)="addTeamMember()">إضافة عضو</button>
        </div>
      </div>

      <!-- Deadlines -->
      <div class="form-section">
        <h3>المواعيد القضائية</h3>
        <div formArrayName="deadlines">
          <div *ngFor="let deadline of deadlinesArray.controls; let i=index"
               [formGroupName]="i" class="deadline-item">
            <input formControlName="title" placeholder="عنوان الموعد"
                   [class.is-invalid]="deadline.get('title')?.invalid && deadline.get('title')?.touched">
            <input type="date" formControlName="date"
                   [class.is-invalid]="deadline.get('date')?.invalid && deadline.get('date')?.touched">
            <select formControlName="type">
              <option value="hearing">جلسة</option>
              <option value="submission">تقديم مستندات</option>
              <option value="procedure">إجراء</option>
            </select>
            <button type="button" (click)="removeDeadline(i)">حذف</button>
          </div>
          <button type="button" (click)="addDeadline()">إضافة موعد</button>
        </div>
      </div>

      <!-- Documents -->
      <div class="form-section">
        <h3>المستندات</h3>
        <div formArrayName="documents">
          <div *ngFor="let doc of documentsArray.controls; let i=index"
               [formGroupName]="i" class="document-item">
            <input formControlName="title" placeholder="عنوان المستند"
                   [class.is-invalid]="doc.get('title')?.invalid && doc.get('title')?.touched">
            <input type="file" (change)="onFileSelected($event, i)">
            <select formControlName="type">
              <option value="power_of_attorney">توكيل</option>
              <option value="pleading">مذكرة</option>
              <option value="evidence">دليل</option>
              <option value="other">أخرى</option>
            </select>
            <textarea formControlName="notes" placeholder="ملاحظات"></textarea>
            <button type="button" (click)="removeDocument(i)">حذف</button>
          </div>
          <button type="button" (click)="addDocument()">إضافة مستند</button>
        </div>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button type="button" (click)="resetForm()" [disabled]="form.pristine">
          إعادة تعيين
        </button>
        <button type="submit" [disabled]="form.invalid || form.pristine || isSubmitting">
          {{ editMode ? 'تحديث القضية' : 'إنشاء القضية' }}
        </button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CaseFormComponent implements OnInit {
  @Input() caseId?: string; // If provided, we're in edit mode

  private fb = inject(FormBuilder);
  private caseFormService = inject(CaseFormService);
  private entityFormService = inject(EntityFormService);
  private notificationService = inject(NotificationService);

  form!: FormGroup;
  editMode = false;
  isSubmitting = false;

  // Form getters
  get opponentsArray() { return this.form.get('opponents') as FormArray; }
  get assignedTeamArray() { return this.form.get('assignedTeam') as FormArray; }
  get deadlinesArray() { return this.form.get('deadlines') as FormArray; }
  get documentsArray() { return this.form.get('documents') as FormArray; }

  // Reference data
  courts: any[] = [];
  clients: LegalEntity[] = [];
  opponents: LegalEntity[] = [];
  employees: any[] = [];

  ngOnInit() {
    this.editMode = !!this.caseId;
    this.loadReferenceData();
    this.initializeForm();
  }

  private async loadReferenceData() {
    // Load all necessary reference data
    // Implementation details...
  }

  private initializeForm() {
    this.form = this.caseFormService.createForm();
    if (this.editMode) {
      this.loadCaseData();
    }
  }

  private async loadCaseData() {
    if (!this.caseId) return;
    // Load case data and patch form
    // Implementation details...
  }

  onSubmit() {
    if (this.form.invalid) {
      this.markFormTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = this.form.value;

    (this.editMode ? 
      this.caseFormService.updateCase(this.caseId!, formData) :
      this.caseFormService.saveCase(formData)
    ).subscribe({
      next: () => {
        this.notificationService.addNotification({
          type: 'success',
          title: this.editMode ? 'تم تحديث القضية' : 'تم إنشاء القضية',
          message: this.editMode ? 
            'تم تحديث بيانات القضية بنجاح' : 
            'تم إنشاء القضية الجديدة بنجاح'
        });
      },
      error: (error) => {
        this.notificationService.addNotification({
          type: 'error',
          title: 'خطأ',
          message: 'حدث خطأ أثناء حفظ القضية'
        });
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  // Form array management methods
  addOpponent() {
    this.opponentsArray.push(this.fb.group({
      id: [''],
      role: ['primary']
    }));
  }

  removeOpponent(index: number) {
    this.opponentsArray.removeAt(index);
  }

  addTeamMember() {
    this.assignedTeamArray.push(this.fb.group({
      id: [''],
      role: ['support']
    }));
  }

  removeTeamMember(index: number) {
    this.assignedTeamArray.removeAt(index);
  }

  addDeadline() {
    this.deadlinesArray.push(this.fb.group({
      title: [''],
      date: [''],
      type: ['hearing']
    }));
  }

  removeDeadline(index: number) {
    this.deadlinesArray.removeAt(index);
  }

  addDocument() {
    this.documentsArray.push(this.fb.group({
      title: [''],
      file: [null],
      type: [''],
      notes: ['']
    }));
  }

  removeDocument(index: number) {
    this.documentsArray.removeAt(index);
  }

  // File handling
  onFileSelected(event: Event, index: number) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.documentsArray.at(index).patchValue({ file });
    }
  }

  // Helper methods
  markFormTouched() {
    Object.values(this.form.controls).forEach(control => {
      if (control.invalid) {
        control.markAsTouched();
        if (control instanceof FormGroup) {
          Object.values(control.controls).forEach(c => c.markAsTouched());
        }
      }
    });
  }

  resetForm() {
    if (confirm('هل أنت متأكد من إعادة تعيين النموذج؟ سيتم فقد جميع البيانات المدخلة.')) {
      this.form.reset();
      this.opponentsArray.clear();
      this.assignedTeamArray.clear();
      this.deadlinesArray.clear();
      this.documentsArray.clear();
    }
  }

  getValidationMessage(fieldName: string, errors: any): string {
    return this.caseFormService.getValidationMessage(this.form.get(fieldName)!, fieldName);
  }

  // Modal handlers
  openNewClientForm() {
    // Implementation for opening new client form modal
  }

  openNewOpponentForm() {
    // Implementation for opening new opponent form modal
  }
}