import { Component, ChangeDetectionStrategy, input, output, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Client } from '../../services/client.service';
import { FileUploadComponent } from '../file-upload/file-upload.component';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [ReactiveFormsModule, FileUploadComponent],
  templateUrl: './client-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientFormComponent {
  client = input<Client | null>();
  formSubmit = output<Client>();
  formClose = output<void>();

  private fb: FormBuilder = inject(FormBuilder);

  isEditMode = false;

  clientForm = this.fb.group({
    id: [null as number | null, [Validators.required, Validators.pattern('^[0-9]+$')]],
    classification: ['موكل' as 'موكل' | 'خصم', Validators.required],
    nameAr: ['', Validators.required],
    nameEn: [''],
    emiratesId: [''],
    passportNo: [''],
    nationality: [''],
    phone1: ['', Validators.required],
    phone2: [''],
    email: ['', [Validators.email]],
    address: [''],
    password: [''],
    loginEnabled: [true, Validators.required]
  });

  constructor() {
    effect(() => {
      this.populateForm(this.client());
    });
  }

  populateForm(client: Client | null) {
    this.clientForm.reset({
      classification: 'موكل',
      loginEnabled: true,
    });
    if (client) {
      this.isEditMode = true;
      this.clientForm.patchValue(client);
      this.clientForm.get('id')?.disable();
    } else {
      this.isEditMode = false;
      this.clientForm.get('id')?.enable();
    }
  }

  onSubmit() {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }
    // FIX: Construct a valid `Client` object with the required `username` property derived from the client's ID.
    // This ensures the emitted value matches the `Client` interface and resolves the type error.
    const formValue = this.clientForm.getRawValue();
    const clientToEmit: Client = {
      id: formValue.id!,
      classification: formValue.classification!,
      nameAr: formValue.nameAr!,
      nameEn: formValue.nameEn!,
      nationality: formValue.nationality || undefined,
      emiratesId: formValue.emiratesId || undefined,
      passportNo: formValue.passportNo || undefined,
      phone1: formValue.phone1!,
      phone2: formValue.phone2 || undefined,
      email: formValue.email || undefined,
      address: formValue.address || undefined,
      username: String(formValue.id!),
      loginEnabled: formValue.loginEnabled!,
    };
    this.formSubmit.emit(clientToEmit);
  }

  close() {
    this.formClose.emit();
  }
}
