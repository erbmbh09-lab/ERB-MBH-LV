import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseFormService } from './base-form.service';
import { NotificationService } from './notification.service';
import { LegalEntity } from '../interfaces/legal-definitions';

export interface CaseFormData {
  title: string;
  caseNumber: string;
  caseType: string;
  court: string;
  client: LegalEntity;
  opponents: LegalEntity[];
  subject: string;
  value: number;
  filingDate: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  assignedTeam: number[];
  documents: {
    title: string;
    file: File;
    type: string;
    notes?: string;
  }[];
  deadlines: {
    title: string;
    date: string;
    type: string;
    assigneeId: number;
  }[];
  notes: string;
}

@Injectable({
  providedIn: 'root'
})
export class CaseFormService extends BaseFormService {
  constructor(
    protected override fb: FormBuilder,
    protected override notificationService: NotificationService
  ) {
    super(fb, notificationService);
  }

  /**
   * Create case form
   */
  createForm(initialData?: Partial<CaseFormData>): FormGroup {
    const form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      caseNumber: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{4}$/)]],
      caseType: ['', Validators.required],
      court: ['', Validators.required],
      client: ['', Validators.required],
      opponents: [[], Validators.required],
      subject: ['', [Validators.required, Validators.minLength(10)]],
      value: [0, [Validators.required, Validators.min(0)]],
      filingDate: ['', Validators.required],
      status: ['new', Validators.required],
      priority: ['medium', Validators.required],
      assignedTeam: [[], Validators.required],
      documents: this.fb.array([]),
      deadlines: this.fb.array([]),
      notes: ['']
    });

    this.initializeForm(form, initialData);
    return form;
  }

  /**
   * Add document to form
   */
  addDocument(form: FormGroup) {
    const documents = form.get('documents');
    documents?.push(
      this.fb.group({
        title: ['', Validators.required],
        file: [null, Validators.required],
        type: ['', Validators.required],
        notes: ['']
      })
    );
  }

  /**
   * Add deadline to form
   */
  addDeadline(form: FormGroup) {
    const deadlines = form.get('deadlines');
    deadlines?.push(
      this.fb.group({
        title: ['', Validators.required],
        date: ['', Validators.required],
        type: ['', Validators.required],
        assigneeId: ['', Validators.required]
      })
    );
  }

  /**
   * Save case
   */
  saveCase(data: CaseFormData) {
    return this.saveFormData(
      'cases',
      data,
      'تم حفظ القضية بنجاح',
      'حدث خطأ أثناء حفظ القضية'
    );
  }

  /**
   * Update case
   */
  updateCase(id: string, data: Partial<CaseFormData>) {
    return this.saveFormData(
      `cases/${id}`,
      data,
      'تم تحديث القضية بنجاح',
      'حدث خطأ أثناء تحديث القضية'
    );
  }
}