import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-control',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="form-group" [class.rtl-input]="isRtl">
      <label [for]="id" *ngIf="label">{{ label }}</label>
      
      <!-- Text Input -->
      <input *ngIf="type === 'text' || type === 'number' || type === 'email' || type === 'tel' || type === 'date'"
             [type]="type"
             [id]="id"
             [formControl]="control"
             [placeholder]="placeholder"
             [class.is-invalid]="showError"
             [attr.min]="min"
             [attr.max]="max"
             [attr.step]="step"
             [attr.pattern]="pattern"
             (blur)="onTouched()"
             [dir]="isRtl ? 'rtl' : 'ltr'">

      <!-- Textarea -->
      <textarea *ngIf="type === 'textarea'"
                [id]="id"
                [formControl]="control"
                [placeholder]="placeholder"
                [class.is-invalid]="showError"
                [rows]="rows || 3"
                (blur)="onTouched()"
                [dir]="isRtl ? 'rtl' : 'ltr'">
      </textarea>

      <!-- Select -->
      <select *ngIf="type === 'select'"
              [id]="id"
              [formControl]="control"
              [class.is-invalid]="showError"
              (blur)="onTouched()"
              [dir]="isRtl ? 'rtl' : 'ltr'">
        <option value="" disabled>{{ placeholder }}</option>
        <option *ngFor="let option of options" [value]="option.value">
          {{ option.label }}
        </option>
      </select>

      <!-- Error Messages -->
      <div class="invalid-feedback" *ngIf="showError">
        <span *ngIf="control.errors?.['required']">{{ label }} مطلوب</span>
        <span *ngIf="control.errors?.['email']">البريد الإلكتروني غير صالح</span>
        <span *ngIf="control.errors?.['minlength']">
          {{ label }} يجب أن يكون {{ control.errors?.['minlength'].requiredLength }} أحرف على الأقل
        </span>
        <span *ngIf="control.errors?.['maxlength']">
          {{ label }} يجب أن لا يتجاوز {{ control.errors?.['maxlength'].requiredLength }} حرف
        </span>
        <span *ngIf="control.errors?.['pattern']">{{ label }} غير صالح</span>
        <span *ngIf="control.errors?.['min']">
          {{ label }} يجب أن يكون {{ control.errors?.['min'].min }} على الأقل
        </span>
        <span *ngIf="control.errors?.['max']">
          {{ label }} يجب أن لا يتجاوز {{ control.errors?.['max'].max }}
        </span>
        <span *ngIf="control.errors?.['custom']">{{ control.errors?.['custom'] }}</span>
      </div>

      <!-- Help Text -->
      <small class="form-text text-muted" *ngIf="helpText">{{ helpText }}</small>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormControlComponent),
      multi: true
    }
  ]
})
export class FormControlComponent implements ControlValueAccessor {
  @Input() id!: string;
  @Input() label!: string;
  @Input() type: 'text' | 'number' | 'email' | 'tel' | 'date' | 'textarea' | 'select' = 'text';
  @Input() placeholder = '';
  @Input() helpText = '';
  @Input() isRtl = true;
  @Input() options: { value: any; label: string }[] = [];
  @Input() min?: number;
  @Input() max?: number;
  @Input() step?: number;
  @Input() rows?: number;
  @Input() pattern?: string;
  @Input() customValidator?: (value: any) => null | { custom: string };

  control = new FormControl('');
  showError = false;

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.control.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: any): void {
    this.control.valueChanges.subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.control.disable() : this.control.enable();
  }

  // Touch handler
  onTouched = () => {
    this.showError = this.control.invalid && this.control.touched;
  };
}