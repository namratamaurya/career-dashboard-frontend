import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `
    <main class="login-page">
      <section class="login-copy">
        <p>Career Dashboard</p>
        <h1>Track the roles worth your attention.</h1>
        <span>Seeded demo accounts: namrata@example.com or recruiter@example.com. Use any 4+ character password in mock mode.</span>
      </section>

      <mat-card>
        <mat-card-header>
          <mat-card-title>Sign in</mat-card-title>
          <mat-card-subtitle>Two seeded accounts, no signup flow.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              @if (form.controls.email.invalid && form.controls.email.touched) {
                <mat-error>Enter a valid email.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="current-password" />
              @if (form.controls.password.invalid && form.controls.password.touched) {
                <mat-error>Password must be at least 4 characters.</mat-error>
              }
            </mat-form-field>

            @if (error()) {
              <p class="form-error">{{ error() }}</p>
            }

            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading()">
              {{ loading() ? 'Signing in...' : 'Sign in' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </main>
  `,
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.group({
    email: ['namrata@example.com', [Validators.required, Validators.email]],
    password: ['portfolio', [Validators.required, Validators.minLength(4)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.form.controls.email.value, this.form.controls.password.value).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (error: Error) => {
        this.error.set(error.message);
        this.loading.set(false);
      },
    });
  }
}
