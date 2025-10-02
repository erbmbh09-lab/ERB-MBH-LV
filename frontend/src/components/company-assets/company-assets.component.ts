import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DataHubService } from '../../services/data-hub.service';
import { CompanyAsset } from '../../services/hr.service';
import { NotificationService } from '../../services/notification.service';
import { FileUploadComponent } from '../file-upload/file-upload.component';

@Component({
  selector: 'app-company-assets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FileUploadComponent],
  templateUrl: './company-assets.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class CompanyAssetsComponent {
  dataHubService = inject(DataHubService);
  notificationService = inject(NotificationService);
  // FIX: Explicitly type `fb` as `FormBuilder` to resolve type inference errors on `.group()`.
  private fb: FormBuilder = inject(FormBuilder);
  private datePipe = inject(DatePipe);

  activeCategory = signal<'Office' | 'Vehicle/Resource'>('Office');
  isModalVisible = signal(false);
  editingAssetId = signal<number | null>(null);

  assetForm = this.fb.group({
    category: ['Office' as 'Office' | 'Vehicle/Resource', Validators.required],
    branch: ['دبي' as 'دبي' | 'الشارقة' | 'عجمان' | 'عام', Validators.required],
    name: ['', Validators.required],
    documentType: ['', Validators.required],
    issueDate: ['', Validators.required],
    expiryDate: ['', Validators.required],
    notes: [''],
    detailKey: [''],
    detailValue: ['']
  });

  filteredAssets = computed(() => {
    const category = this.activeCategory();
    // FIX: Access companyAssets through the correctly typed `dataHubService.hr` property.
    return this.dataHubService.hr.companyAssets().filter(asset => asset.category === category);
  });

  openModal(asset: CompanyAsset | null = null) {
    this.assetForm.reset();
    this.assetForm.get('category')?.setValue(this.activeCategory());
    
    if (asset) {
      this.editingAssetId.set(asset.id);
      this.assetForm.patchValue(asset);
      if (asset.details) {
        const firstKey = Object.keys(asset.details)[0];
        if (firstKey) {
          this.assetForm.get('detailKey')?.setValue(firstKey);
          this.assetForm.get('detailValue')?.setValue(asset.details[firstKey]);
        }
      }
    } else {
      this.editingAssetId.set(null);
    }
    this.isModalVisible.set(true);
  }

  closeModal() {
    this.isModalVisible.set(false);
    this.editingAssetId.set(null);
  }

  deleteAsset(assetId: number) {
    if (confirm('هل أنت متأكد من حذف هذا الأصل؟')) {
      // FIX: Access deleteCompanyAsset through the correctly typed `dataHubService.hr` property.
      this.dataHubService.hr.deleteCompanyAsset(assetId);
      this.notificationService.addNotification({
        type: 'success',
        title: 'تم الحذف',
        message: 'تم حذف الأصل بنجاح.'
      });
    }
  }

  onSubmit() {
    if (this.assetForm.invalid) {
      this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'يرجى ملء جميع الحقول الإلزامية.' });
      return;
    }

    const formValue = this.assetForm.getRawValue();
    const assetData: Omit<CompanyAsset, 'id'> & { id?: number } = {
      category: formValue.category!,
      branch: formValue.branch!,
      name: formValue.name!,
      documentType: formValue.documentType!,
      issueDate: this.datePipe.transform(formValue.issueDate, 'yyyy-MM-dd')!,
      expiryDate: this.datePipe.transform(formValue.expiryDate, 'yyyy-MM-dd')!,
      notes: formValue.notes || undefined,
      details: (formValue.detailKey && formValue.detailValue) ? { [formValue.detailKey]: formValue.detailValue } : undefined,
    };
    
    if (this.editingAssetId()) {
      // FIX: Access updateCompanyAsset through the correctly typed `dataHubService.hr` property.
      this.dataHubService.hr.updateCompanyAsset({ ...assetData, id: this.editingAssetId()! });
      this.notificationService.addNotification({ type: 'success', title: 'تم التحديث', message: `تم تحديث بيانات "${assetData.name}" بنجاح.` });
    } else {
      // FIX: Access addCompanyAsset through the correctly typed `dataHubService.hr` property.
      this.dataHubService.hr.addCompanyAsset(assetData);
      this.notificationService.addNotification({ type: 'success', title: 'تمت الإضافة', message: `تمت إضافة "${assetData.name}" بنجاح.` });
    }

    this.closeModal();
  }
}