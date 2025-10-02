import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseFormService } from './base-form.service';
import { NotificationService } from './notification.service';
import { 
  EntityType, 
  LegalPersonType,
  ClientClassification 
} from '../interfaces/legal-definitions';

export interface ContactFormData {
  primaryPhone: string;
  secondaryPhone?: string;
  email?: string;
  fax?: string;
  website?: string;
  preferredContact: 'phone' | 'email' | 'fax';
}

export interface AddressFormData {
  country: string;
  city: string;
  district?: string;
  street?: string;
  buildingNo?: string;
  postalCode?: string;
  additionalInfo?: string;
}

export interface EntityFormData {
  type: EntityType;
  personType: LegalPersonType;
  nameAr: string;
  nameEn?: string;
  identifier: string;
  identifierType: string;
  classification: ClientClassification;
  nationality: string;
  contact: ContactFormData;
  address: AddressFormData;
  // Client specific
  category?: 'regular' | 'vip' | 'strategic';
  riskLevel?: 'low' | 'medium' | 'high';
  assignedLawyer?: string;
  contractDetails?: {
    contractId: string;
    startDate: string;
    endDate?: string;
    terms: string[];
  };
  billingInfo?: {
    method: 'hourly' | 'fixed' | 'retainer';
    currency: string;
    rate?: number;
    billingCycle: 'monthly' | 'quarterly' | 'project';
  };
  // Opponent specific
  opposingCounsel?: {
    name: string;
    firm: string;
    contact: ContactFormData;
  };
  risk?: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class EntityFormService extends BaseFormService {
  constructor(
    protected override fb: FormBuilder,
    protected override notificationService: NotificationService
  ) {
    super(fb, notificationService);
  }

  /**
   * Create contact form group
   */
  private createContactForm(data?: Partial<ContactFormData>): FormGroup {
    const form = this.fb.group({
      primaryPhone: ['', [
        Validators.required,
        Validators.pattern(/^\+?[0-9]{10,15}$/)
      ]],
      secondaryPhone: ['', Validators.pattern(/^\+?[0-9]{10,15}$/)],
      email: ['', [Validators.email]],
      fax: [''],
      website: ['', Validators.pattern(/^https?:\/\/.+/)],
      preferredContact: ['phone', Validators.required]
    });

    if (data) {
      form.patchValue(data);
    }

    return form;
  }

  /**
   * Create address form group
   */
  private createAddressForm(data?: Partial<AddressFormData>): FormGroup {
    const form = this.fb.group({
      country: ['', Validators.required],
      city: ['', Validators.required],
      district: [''],
      street: [''],
      buildingNo: [''],
      postalCode: [''],
      additionalInfo: ['']
    });

    if (data) {
      form.patchValue(data);
    }

    return form;
  }

  /**
   * Create entity form based on type
   */
  createForm(type: EntityType, initialData?: Partial<EntityFormData>): FormGroup {
    const baseForm = this.fb.group({
      type: [type, Validators.required],
      personType: ['', Validators.required],
      nameAr: ['', [Validators.required, Validators.minLength(3)]],
      nameEn: ['', Validators.minLength(3)],
      identifier: ['', Validators.required],
      identifierType: ['', Validators.required],
      classification: ['', Validators.required],
      nationality: ['', Validators.required],
      contact: this.createContactForm(initialData?.contact),
      address: this.createAddressForm(initialData?.address)
    });

    // Add type-specific fields
    if (type === EntityType.CLIENT) {
      baseForm.addControl('category', this.fb.control('regular', Validators.required));
      baseForm.addControl('riskLevel', this.fb.control('low', Validators.required));
      baseForm.addControl('assignedLawyer', this.fb.control('', Validators.required));
      baseForm.addControl('contractDetails', this.fb.group({
        contractId: ['', Validators.required],
        startDate: ['', Validators.required],
        endDate: [''],
        terms: [[], Validators.required]
      }));
      baseForm.addControl('billingInfo', this.fb.group({
        method: ['hourly', Validators.required],
        currency: ['SAR', Validators.required],
        rate: [0, [Validators.min(0)]],
        billingCycle: ['monthly', Validators.required]
      }));
    }

    if (type === EntityType.OPPONENT) {
      baseForm.addControl('opposingCounsel', this.fb.group({
        name: [''],
        firm: [''],
        contact: this.createContactForm()
      }));
      baseForm.addControl('risk', this.fb.group({
        level: ['medium', Validators.required],
        factors: [[]]
      }));
    }

    this.initializeForm(baseForm, initialData);
    return baseForm;
  }

  /**
   * Save entity
   */
  saveEntity(data: EntityFormData) {
    const endpoint = data.type === EntityType.CLIENT ? 'clients' : 
                    data.type === EntityType.OPPONENT ? 'opponents' : 
                    'entities';

    return this.saveFormData(
      endpoint,
      data,
      `تم حفظ ${this.getEntityTypeLabel(data.type)} بنجاح`,
      `حدث خطأ أثناء حفظ ${this.getEntityTypeLabel(data.type)}`
    );
  }

  /**
   * Update entity
   */
  updateEntity(id: string, data: Partial<EntityFormData>) {
    const endpoint = data.type === EntityType.CLIENT ? 'clients' : 
                    data.type === EntityType.OPPONENT ? 'opponents' : 
                    'entities';

    return this.saveFormData(
      `${endpoint}/${id}`,
      data,
      `تم تحديث ${this.getEntityTypeLabel(data.type)} بنجاح`,
      `حدث خطأ أثناء تحديث ${this.getEntityTypeLabel(data.type)}`
    );
  }

  /**
   * Get entity type label in Arabic
   */
  private getEntityTypeLabel(type: EntityType): string {
    const labels: Record<EntityType, string> = {
      [EntityType.CLIENT]: 'العميل',
      [EntityType.OPPONENT]: 'الخصم',
      [EntityType.POTENTIAL_CLIENT]: 'العميل المحتمل',
      [EntityType.WITNESS]: 'الشاهد',
      [EntityType.EXPERT]: 'الخبير',
      [EntityType.RELATED_PARTY]: 'الطرف ذو العلاقة',
      [EntityType.COURT]: 'المحكمة',
      [EntityType.AUTHORITY]: 'الجهة الرسمية',
      [EntityType.OTHER]: 'الكيان'
    };
    return labels[type];
  }
}