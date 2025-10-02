import { Component, ChangeDetectionStrategy, inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EntityFormService } from '../../services/entity-form.service';
import { EntityType, LegalEntity } from '../../interfaces/legal-definitions';
import { NotificationService } from '../../services/notification.service';
import { FormControlComponent } from '../shared/form-control.component';

@Component({
  selector: 'app-entity-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormControlComponent],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="entity-form">
      <!-- Basic Information -->
      <div class="form-section">
        <h3>المعلومات الأساسية</h3>
        
        <app-form-control
          id="nameAr"
          formControlName="nameAr"
          label="الاسم بالعربية"
          [isRtl]="true">
        </app-form-control>

        <app-form-control
          id="nameEn"
          formControlName="nameEn"
          label="الاسم بالإنجليزية"
          [isRtl]="false">
        </app-form-control>

        <app-form-control
          id="personType"
          formControlName="personType"
          type="select"
          label="نوع الشخص"
          [options]="personTypeOptions">
        </app-form-control>

        <app-form-control
          id="identifier"
          formControlName="identifier"
          label="رقم الهوية/السجل"
          [pattern]="getIdentifierPattern()">
        </app-form-control>

        <app-form-control
          id="identifierType"
          formControlName="identifierType"
          type="select"
          label="نوع الهوية"
          [options]="identifierTypeOptions">
        </app-form-control>
      </div>

      <!-- Contact Information -->
      <div class="form-section" formGroupName="contact">
        <h3>معلومات الاتصال</h3>
        
        <app-form-control
          id="primaryPhone"
          formControlName="primaryPhone"
          type="tel"
          label="رقم الهاتف الرئيسي"
          pattern="^\+?[0-9]{10,15}$">
        </app-form-control>

        <app-form-control
          id="email"
          formControlName="email"
          type="email"
          label="البريد الإلكتروني">
        </app-form-control>

        <!-- Other contact fields -->
      </div>

      <!-- Address Information -->
      <div class="form-section" formGroupName="address">
        <h3>العنوان</h3>
        
        <app-form-control
          id="country"
          formControlName="country"
          type="select"
          label="الدولة"
          [options]="countryOptions">
        </app-form-control>

        <app-form-control
          id="city"
          formControlName="city"
          label="المدينة">
        </app-form-control>

        <!-- Other address fields -->
      </div>

      <!-- Client Specific Fields -->
      <ng-container *ngIf="isClient" formGroupName="clientInfo">
        <div class="form-section">
          <h3>معلومات العميل</h3>
          
          <app-form-control
            id="category"
            formControlName="category"
            type="select"
            label="تصنيف العميل"
            [options]="clientCategoryOptions">
          </app-form-control>

          <app-form-control
            id="riskLevel"
            formControlName="riskLevel"
            type="select"
            label="مستوى المخاطر"
            [options]="riskLevelOptions">
          </app-form-control>

          <!-- Billing information -->
          <div formGroupName="billingInfo">
            <app-form-control
              id="billingMethod"
              formControlName="method"
              type="select"
              label="طريقة الفوترة"
              [options]="billingMethodOptions">
            </app-form-control>

            <app-form-control
              *ngIf="showRateField"
              id="rate"
              formControlName="rate"
              type="number"
              label="السعر"
              [min]="0">
            </app-form-control>
          </div>
        </div>
      </ng-container>

      <!-- Opponent Specific Fields -->
      <ng-container *ngIf="isOpponent" formGroupName="opponentInfo">
        <div class="form-section">
          <h3>معلومات الخصم</h3>
          
          <div formGroupName="opposingCounsel">
            <app-form-control
              id="counselName"
              formControlName="name"
              label="اسم المحامي">
            </app-form-control>

            <app-form-control
              id="counselFirm"
              formControlName="firm"
              label="مكتب المحاماة">
            </app-form-control>
          </div>

          <div formGroupName="risk">
            <app-form-control
              id="riskLevel"
              formControlName="level"
              type="select"
              label="مستوى المخاطر"
              [options]="riskLevelOptions">
            </app-form-control>

            <app-form-control
              id="riskFactors"
              formControlName="factors"
              type="textarea"
              label="عوامل المخاطر">
            </app-form-control>
          </div>
        </div>
      </ng-container>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" (click)="resetForm()" [disabled]="form.pristine">
          إعادة تعيين
        </button>
        <button type="submit" [disabled]="form.invalid || form.pristine || isSubmitting">
          {{ editMode ? 'تحديث' : 'حفظ' }}
        </button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntityFormComponent implements OnInit {
  @Input() entityType!: EntityType;
  @Input() entityId?: string;

  private fb = inject(FormBuilder);
  private entityFormService = inject(EntityFormService);
  private notificationService = inject(NotificationService);

  form!: FormGroup;
  editMode = false;
  isSubmitting = false;

  // Computed properties
  get isClient() { return this.entityType === EntityType.CLIENT; }
  get isOpponent() { return this.entityType === EntityType.OPPONENT; }
  get showRateField() { 
    return this.form.get('clientInfo.billingInfo.method')?.value === 'hourly';
  }

  // Form options
  personTypeOptions = [
    { value: 'natural', label: 'شخص طبيعي' },
    { value: 'juridical', label: 'شخص اعتباري' }
  ];

  identifierTypeOptions = [
    { value: 'national_id', label: 'هوية وطنية' },
    { value: 'iqama', label: 'إقامة' },
    { value: 'cr', label: 'سجل تجاري' },
    { value: 'passport', label: 'جواز سفر' }
  ];

  clientCategoryOptions = [
    { value: 'regular', label: 'عادي' },
    { value: 'vip', label: 'VIP' },
    { value: 'strategic', label: 'استراتيجي' }
  ];

  riskLevelOptions = [
    { value: 'low', label: 'منخفض' },
    { value: 'medium', label: 'متوسط' },
    { value: 'high', label: 'مرتفع' }
  ];

  billingMethodOptions = [
    { value: 'hourly', label: 'بالساعة' },
    { value: 'fixed', label: 'مبلغ مقطوع' },
    { value: 'retainer', label: 'رسوم شهرية' }
  ];

  countryOptions = [
    { value: 'SA', label: 'المملكة العربية السعودية' },
    { value: 'AE', label: 'الإمارات العربية المتحدة' },
    { value: 'KW', label: 'الكويت' }
    // Add more countries as needed
  ];

  ngOnInit() {
    this.editMode = !!this.entityId;
    this.initializeForm();
    if (this.editMode) {
      this.loadEntityData();
    }
  }

  private initializeForm() {
    this.form = this.entityFormService.createForm(this.entityType);
  }

  private async loadEntityData() {
    if (!this.entityId) return;
    // Implementation for loading entity data
  }

  onSubmit() {
    if (this.form.invalid) {
      this.markFormTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = this.form.value;

    (this.editMode ? 
      this.entityFormService.updateEntity(this.entityId!, formData) :
      this.entityFormService.saveEntity(formData)
    ).subscribe({
      next: () => {
        this.notificationService.addNotification({
          type: 'success',
          title: this.editMode ? 'تم التحديث' : 'تم الحفظ',
          message: this.getSuccessMessage()
        });
      },
      error: (error) => {
        this.notificationService.addNotification({
          type: 'error',
          title: 'خطأ',
          message: 'حدث خطأ أثناء الحفظ'
        });
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  resetForm() {
    if (confirm('هل أنت متأكد من إعادة تعيين النموذج؟ سيتم فقد جميع البيانات المدخلة.')) {
      this.form.reset();
    }
  }

  markFormTouched() {
    Object.values(this.form.controls).forEach(control => {
      if (control instanceof FormGroup) {
        Object.values(control.controls).forEach(c => c.markAsTouched());
      } else {
        control.markAsTouched();
      }
    });
  }

  getIdentifierPattern(): string {
    const identifierType = this.form.get('identifierType')?.value;
    switch (identifierType) {
      case 'national_id':
        return '^[1-2]\\d{9}$'; // 10 digits starting with 1 or 2
      case 'iqama':
        return '^[2]\\d{9}$'; // 10 digits starting with 2
      case 'cr':
        return '^[0-9]{10}$'; // 10 digits
      case 'passport':
        return '^[A-Z0-9]{6,12}$'; // 6-12 alphanumeric characters
      default:
        return '';
    }
  }

  private getSuccessMessage(): string {
    const entityLabel = this.isClient ? 'العميل' : 'الخصم';
    return this.editMode
      ? `تم تحديث بيانات ${entityLabel} بنجاح`
      : `تم إضافة ${entityLabel} بنجاح`;
  }
}