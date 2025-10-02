import { Injectable } from '@angular/core';
import { FormGroup, FormBuilder, AbstractControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { SystemLogger } from './system-logger.service';

@Injectable({
  providedIn: 'root'
})
export class BaseFormService {
  constructor(
    protected fb: FormBuilder,
    protected notificationService: NotificationService
  ) {}

  /**
   * Save form data with optimistic update
   */
  protected saveFormData<T>(
    endpoint: string,
    data: T,
    successMessage: string,
    errorMessage: string
  ): Observable<T> {
    // Log form submission attempt
    SystemLogger.logActivity({
      action: 'form-submit',
      module: endpoint,
      details: { formData: data }
    });

    // Optimistic update notification
    this.notificationService.addNotification({
      type: 'info',
      title: 'جاري الحفظ',
      message: 'جاري حفظ البيانات...'
    });

    // API call would go here
    return of(data).pipe(
      tap(() => {
        // Success notification
        this.notificationService.addNotification({
          type: 'success',
          title: 'تم الحفظ',
          message: successMessage
        });
      }),
      catchError(error => {
        // Error notification
        this.notificationService.addNotification({
          type: 'error',
          title: 'خطأ',
          message: errorMessage
        });
        throw error;
      })
    );
  }

  /**
   * Common form validation messages
   */
  getValidationMessage(control: AbstractControl, fieldName: string): string {
    if (control.hasError('required')) {
      return `${fieldName} مطلوب`;
    }
    if (control.hasError('min')) {
      return `${fieldName} يجب أن يكون أكبر من ${control.errors?.['min'].min}`;
    }
    if (control.hasError('max')) {
      return `${fieldName} يجب أن يكون أقل من ${control.errors?.['max'].max}`;
    }
    if (control.hasError('email')) {
      return 'البريد الإلكتروني غير صالح';
    }
    if (control.hasError('minlength')) {
      return `${fieldName} يجب أن يكون ${control.errors?.['minlength'].requiredLength} أحرف على الأقل`;
    }
    if (control.hasError('pattern')) {
      return `${fieldName} غير صالح`;
    }
    return '';
  }

  /**
   * Mark all form controls as touched
   */
  markFormTouched(form: FormGroup): void {
    Object.values(form.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormTouched(control);
      }
    });
  }

  /**
   * Reset form with optional default values
   */
  resetForm(form: FormGroup, defaultValues?: any): void {
    form.reset(defaultValues);
    this.markFormPristine(form);
  }

  /**
   * Mark form as pristine
   */
  private markFormPristine(form: FormGroup): void {
    Object.values(form.controls).forEach(control => {
      control.markAsPristine();
      if (control instanceof FormGroup) {
        this.markFormPristine(control);
      }
    });
  }

  /**
   * Common form initialization logic
   */
  protected initializeForm<T>(
    formGroup: FormGroup,
    initialData?: Partial<T>
  ): void {
    if (initialData) {
      formGroup.patchValue(initialData);
    }
    this.markFormPristine(formGroup);
  }
}