import { Component, EventEmitter, Output, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApplicationStatus, Job, statusLabels } from '../../../core/models/career.models';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-job-card',
  imports: [DatePipe, MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule, StatusBadgeComponent],
  template: `
    <article class="job-card">
      <div class="job-heading">
        <img [src]="job().companyLogoUrl" [alt]="job().company + ' logo'" />
        <div>
          <div class="meta">
            <span>{{ job().company }}</span>
            @if (job().isNew) {
              <span class="new-dot">New</span>
            }
          </div>
          <h2>{{ job().title }}</h2>
        </div>
      </div>

      <div class="details">
        <span><mat-icon>location_on</mat-icon>{{ job().location }}</span>
        <span><mat-icon>work</mat-icon>{{ job().jobType }}</span>
        <span><mat-icon>event</mat-icon>{{ job().postedDate | date: 'mediumDate' }}</span>
      </div>

      <div class="tags">
        @for (tag of job().tags; track tag) {
          <span>{{ tag }}</span>
        }
      </div>

      @if (job().whyThisFits) {
        <p class="fit">{{ job().whyThisFits }}</p>
      }

      <footer>
        <app-status-badge [status]="job().status" />
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Status</mat-label>
          <mat-select [value]="job().status" (selectionChange)="statusChange.emit($event.value)">
            @for (status of statuses; track status) {
              <mat-option [value]="status">{{ labels[status] }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <a mat-flat-button color="primary" [href]="job().applyUrl" target="_blank" rel="noopener noreferrer">
          <mat-icon>open_in_new</mat-icon>
          Apply
        </a>
      </footer>
    </article>
  `,
  styleUrl: './job-card.component.scss',
})
export class JobCardComponent {
  readonly job = input.required<Job>();
  @Output() readonly statusChange = new EventEmitter<ApplicationStatus>();
  readonly statuses = Object.keys(statusLabels) as ApplicationStatus[];
  readonly labels = statusLabels;
}
