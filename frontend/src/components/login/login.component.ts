import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  // FIX: Explicitly type `router` to resolve a potential type inference issue where it was being treated as 'unknown'.
  private router: Router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  
  loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    const { username, password } = this.loginForm.getRawValue();

    try {
        const success = await this.authService.login(username!, password!);
        if (success) {
            this.router.navigate(['/dashboard']);
        } else {
            this.errorMessage.set('اسم المستخدم أو كلمة المرور غير صحيحة.');
        }
    } catch (error) {
        this.errorMessage.set('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    } finally {
        this.isLoading.set(false);
    }
  }
}
