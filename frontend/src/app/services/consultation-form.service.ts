import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseFormService } from './base-form.service';
import { NotificationService } from './notification.service';

export interface ConsultationFormData {
  clientId: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'in-person' | 'phone' | 'video';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  assignedLawyer: string;
  details: string;
  attachments?: {
    title: string;
    file: File;
    type: string;
  }[];
  followUpActions?: {
    action: string;
    dueDate: string;
    assigneeId: string;
  }[];
  billing?: {
    billable: boolean;
    rate: number;
    duration: number; // in minutes
    notes: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ConsultationFormService extends BaseFormService {
  constructor(
    protected override fb: FormBuilder,
    protected override notificationService: NotificationService
  ) {
    super(fb, notificationService);
  }

  /**
   * Create consultation form
   */
  createForm(initialData?: Partial<ConsultationFormData>): FormGroup {
    const form = this.fb.group({
      clientId: ['', Validators.required],
      subject: ['', [Validators.required, Validators.minLength(5)]],
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      type: ['in-person', Validators.required],
      status: ['scheduled', Validators.required],
      assignedLawyer: ['', Validators.required],
      details: ['', [Validators.required, Validators.minLength(10)]],
      attachments: this.fb.array([]),
      followUpActions: this.fb.array([]),
      billing: this.fb.group({
        billable: [true],
        rate: [0, [Validators.min(0)]],
        duration: [60, [Validators.min(15), Validators.max(480)]], // 15min to 8hrs
        notes: ['']
      })
    });

    // Add custom validators
    form.get('endTime')?.setValidators([
      Validators.required,
      this.validateEndTime(form.get('startTime')?.value)
    ]);

    this.initializeForm(form, initialData);
    return form;
  }

  /**
   * Add attachment to form
   */
  addAttachment(form: FormGroup) {
    const attachments = form.get('attachments');
    attachments?.push(
      this.fb.group({
        title: ['', Validators.required],
        file: [null, Validators.required],
        type: ['', Validators.required]
      })
    );
  }

  /**
   * Add follow-up action to form
   */
  addFollowUpAction(form: FormGroup) {
    const actions = form.get('followUpActions');
    actions?.push(
      this.fb.group({
        action: ['', Validators.required],
        dueDate: ['', Validators.required],
        assigneeId: ['', Validators.required]
      })
    );
  }

  /**
   * Save consultation
   */
  saveConsultation(data: ConsultationFormData) {
    return this.saveFormData(
      'consultations',
      data,
      'تم حفظ الاستشارة بنجاح',
      'حدث خطأ أثناء حفظ الاستشارة'
    );
  }

  /**
   * Update consultation
   */
  updateConsultation(id: string, data: Partial<ConsultationFormData>) {
    return this.saveFormData(
      `consultations/${id}`,
      data,
      'تم تحديث الاستشارة بنجاح',
      'حدث خطأ أثناء تحديث الاستشارة'
    );
  }

  /**
   * Custom validator for end time
   */
  private validateEndTime(startTime: string) {
    return (control: AbstractControl) => {
      if (!startTime || !control.value) {
        return null;
      }

      const start = new Date(`1970-01-01T${startTime}`);
      const end = new Date(`1970-01-01T${control.value}`);

      if (end <= start) {
        return { endTimeInvalid: true };
      }

      return null;
    };
  }

  /**
   * Calculate consultation duration
   */
  calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // Duration in minutes
  }
}