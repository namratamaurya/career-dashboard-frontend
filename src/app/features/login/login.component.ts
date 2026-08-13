import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
        <span>Create the first two dashboard accounts here. After two users exist, signup closes and only those users can sign in.</span>
      </section>

      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ isSignup() ? 'Create dashboard account' : 'Sign in' }}</mat-card-title>
          <mat-card-subtitle>
            @if (checkingSignup()) {
              Checking signup availability...
            } @else if (signupOpen()) {
              {{ usersCreated() }} of {{ maxUsers() }} accounts created.
            } @else {
              Signup is closed. Use one of the two approved accounts.
            }
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="mode-switch" role="group" aria-label="Access mode">
            @if (signupOpen()) {
              <button mat-button type="button" [class.active]="isSignup()" (click)="showSignup()">Sign up</button>
            }
            <button mat-button type="button" [class.active]="!isSignup()" (click)="showLogin()">Sign in</button>
          </div>

          @if (isSignup()) {
            <form [formGroup]="signupForm" (ngSubmit)="submit()">
              <mat-form-field appearance="outline">
                <mat-label>Display name</mat-label>
                <input matInput formControlName="displayName" autocomplete="name" />
                @if (signupForm.controls.displayName.invalid && signupForm.controls.displayName.touched) {
                  <mat-error>Enter your display name.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" autocomplete="email" />
                @if (signupForm.controls.email.invalid && signupForm.controls.email.touched) {
                  <mat-error>Enter a valid email.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Password</mat-label>
                <input matInput type="password" formControlName="password" autocomplete="new-password" />
                @if (signupForm.controls.password.invalid && signupForm.controls.password.touched) {
                  <mat-error>Password must be at least 8 characters.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Field keywords</mat-label>
                <textarea matInput rows="2" formControlName="fieldKeywords"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Target locations</mat-label>
                <textarea matInput rows="2" formControlName="targetLocations"></textarea>
              </mat-form-field>

              @if (error()) {
                <p class="form-error">{{ error() }}</p>
              }

              <button mat-flat-button color="primary" type="submit" [disabled]="signupForm.invalid || loading() || checkingSignup()">
                {{ loading() ? 'Creating account...' : 'Create account' }}
              </button>
            </form>
          } @else {
            <form [formGroup]="loginForm" (ngSubmit)="submit()">
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" autocomplete="email" />
                @if (loginForm.controls.email.invalid && loginForm.controls.email.touched) {
                  <mat-error>Enter a valid email.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Password</mat-label>
                <input matInput type="password" formControlName="password" autocomplete="current-password" />
                @if (loginForm.controls.password.invalid && loginForm.controls.password.touched) {
                  <mat-error>Password must be at least 4 characters.</mat-error>
                }
              </mat-form-field>

              @if (error()) {
                <p class="form-error">{{ error() }}</p>
              }

              <button mat-flat-button color="primary" type="submit" [disabled]="loginForm.invalid || loading() || checkingSignup()">
                {{ loading() ? 'Signing in...' : 'Sign in' }}
              </button>
            </form>
          }
        </mat-card-content>
      </mat-card>
    </main>
  `,
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly checkingSignup = signal(true);
  readonly error = signal('');
  readonly signupOpen = signal(false);
  readonly usersCreated = signal(0);
  readonly maxUsers = signal(2);
  readonly mode = signal<'signup' | 'login'>('login');
  readonly isSignup = computed(() => this.mode() === 'signup');
  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });
  readonly signupForm = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    fieldKeywords: ['frontend, angular, typescript'],
    targetLocations: ['remote, bengaluru, mumbai'],
  });

  ngOnInit(): void {
    this.auth.signupStatus().subscribe({
      next: (status) => {
        this.signupOpen.set(status.signupOpen);
        this.usersCreated.set(status.usersCreated);
        this.maxUsers.set(status.maxUsers);
        this.mode.set(status.signupOpen ? 'signup' : 'login');
        this.checkingSignup.set(false);
      },
      error: () => {
        this.signupOpen.set(false);
        this.mode.set('login');
        this.checkingSignup.set(false);
      },
    });
  }

  submit(): void {
    this.isSignup() ? this.signup() : this.login();
  }

  showLogin(): void {
    this.mode.set('login');
    this.error.set('');
  }

  showSignup(): void {
    if (!this.signupOpen()) {
      return;
    }
    this.mode.set('signup');
    this.error.set('');
  }

  private login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.loginForm.controls.email.value, this.loginForm.controls.password.value).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (error: Error) => {
        this.error.set(error.message);
        this.loading.set(false);
      },
    });
  }

  private signup(): void {
    if (this.signupForm.invalid || !this.signupOpen()) {
      this.signupForm.markAllAsTouched();
      return;
    }
    const value = this.signupForm.getRawValue();
    this.loading.set(true);
    this.error.set('');
    this.auth
      .signup({
        email: value.email,
        password: value.password,
        displayName: value.displayName,
        fieldKeywords: this.splitList(value.fieldKeywords),
        targetLocations: this.splitList(value.targetLocations),
      })
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (error: Error) => {
          this.error.set(error.message);
          this.loading.set(false);
        },
      });
  }

  private splitList(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
