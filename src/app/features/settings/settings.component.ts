import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `
    <mat-card class="settings-card">
      <mat-card-header>
        <mat-card-title>Profile settings</mat-card-title>
        <mat-card-subtitle>Defaults used by the job feed and notification settings.</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="save()">
          <mat-form-field appearance="outline"><mat-label>Field keywords</mat-label><textarea matInput rows="3" formControlName="fieldKeywords"></textarea></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Target locations</mat-label><textarea matInput rows="3" formControlName="targetLocations"></textarea></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Notification emails</mat-label><textarea matInput rows="3" formControlName="notificationEmails"></textarea></mat-form-field>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Save settings</button>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .settings-card { max-width: 760px; border-radius: 8px; }
    form { display: grid; gap: 14px; margin-top: 16px; }
  `,
})
export class SettingsComponent {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly profile = this.auth.user()?.profile;
  readonly form = this.fb.group({
    fieldKeywords: [(this.profile?.fieldKeywords ?? []).join(', '), Validators.required],
    targetLocations: [(this.profile?.targetLocations ?? []).join(', '), Validators.required],
    notificationEmails: [(this.profile?.notificationEmails ?? []).join(', '), Validators.required],
  });

  save(): void {
    const value = this.form.getRawValue();
    this.auth.updateProfile({
      fieldKeywords: this.split(value.fieldKeywords),
      targetLocations: this.split(value.targetLocations),
      notificationEmails: this.split(value.notificationEmails),
    });
    this.toast.show('Settings saved.', 'success');
  }

  private split(value: string): string[] {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
}
