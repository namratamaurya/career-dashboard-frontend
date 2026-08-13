import { Component, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NotificationCadence, SavedSearch } from '../../core/models/career.models';
import { SavedSearchesService } from '../../core/services/saved-searches.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-saved-searches',
  imports: [DatePipe, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <section class="saved-layout">
      <mat-card>
        <mat-card-header><mat-card-title>Create saved search</mat-card-title><mat-card-subtitle>Persist filter combos and notification cadence.</mat-card-subtitle></mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="create()">
            <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput formControlName="name" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Keyword</mat-label><input matInput formControlName="keyword" /></mat-form-field>
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Save search</button>
          </form>
        </mat-card-content>
      </mat-card>

      <div class="search-list">
        @for (search of savedSearches.searches(); track search.id) {
          <mat-card>
            <mat-card-header>
              <mat-card-title>{{ search.name }}</mat-card-title>
              <mat-card-subtitle>Keyword: {{ search.filters.keyword || 'Any' }} · Location: {{ search.filters.location || 'Any' }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline">
                <mat-label>Notifications</mat-label>
                <mat-select [value]="search.notificationCadence" (selectionChange)="setCadence(search, $event.value)">
                  @for (cadence of cadences; track cadence) { <mat-option [value]="cadence">{{ cadence }}</mat-option> }
                </mat-select>
              </mat-form-field>
              <span>Last notified: {{ search.lastNotifiedAt ? (search.lastNotifiedAt | date: 'short') : 'Never' }}</span>
              <div class="actions">
                <button mat-stroked-button type="button" (click)="notify(search.id)"><mat-icon>notifications_active</mat-icon> Notify me now</button>
                <button mat-icon-button type="button" aria-label="Delete saved search" (click)="delete(search.id)"><mat-icon>delete</mat-icon></button>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </section>
  `,
  styleUrl: './saved-searches.component.scss',
})
export class SavedSearchesComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly savedSearches = inject(SavedSearchesService);
  private readonly toast = inject(ToastService);
  readonly cadences: NotificationCadence[] = ['instant', 'daily', 'weekly', 'off'];
  readonly form = this.fb.group({ name: ['', Validators.required], keyword: [''] });

  ngOnInit(): void {
    this.savedSearches.loadSavedSearches().subscribe();
  }

  create(): void {
    const value = this.form.getRawValue();
    this.savedSearches.create(value.name, value.keyword).subscribe(() => {
      this.toast.show('Saved search created.', 'success');
      this.form.reset({ name: '', keyword: '' });
    });
  }

  setCadence(search: SavedSearch, notificationCadence: NotificationCadence): void {
    this.savedSearches.update({ ...search, notificationCadence }).subscribe(() => this.toast.show('Notification rule updated.', 'success'));
  }

  notify(id: string): void {
    this.savedSearches.notifyNow(id).subscribe(() => this.toast.show('Notification sent.', 'success'));
  }

  delete(id: string): void {
    this.savedSearches.delete(id).subscribe(() => this.toast.show('Saved search deleted.', 'success'));
  }
}
