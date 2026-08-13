import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { JobCardComponent } from '../../shared/components/job-card/job-card.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { ApplicationStatus } from '../../core/models/career.models';
import { JobsService } from '../../core/services/jobs.service';
import { CompaniesService } from '../../core/services/companies.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    JobCardComponent,
    LoadingSkeletonComponent,
  ],
  template: `
    <section class="dashboard-grid">
      <form class="filters" [formGroup]="form" (ngSubmit)="applyFilters()">
        <mat-form-field appearance="outline">
          <mat-label>Keyword</mat-label>
          <input matInput formControlName="keyword" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Location</mat-label>
          <input matInput formControlName="location" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Job type</mat-label>
          <mat-select formControlName="jobType">
            <mat-option value="">Any</mat-option>
            @for (type of jobTypes; track type) {
              <mat-option [value]="type">{{ type }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Company</mat-label>
          <mat-select formControlName="company">
            <mat-option value="">Any</mat-option>
            @for (company of companies.companies(); track company.id) {
              <mat-option [value]="company.name">{{ company.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>From</mat-label>
          <input matInput type="date" formControlName="dateFrom" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>To</mat-label>
          <input matInput type="date" formControlName="dateTo" />
        </mat-form-field>
        <mat-checkbox formControlName="newSinceLastVisit">New since last visit</mat-checkbox>
        <button mat-flat-button color="primary" type="submit">
          <mat-icon>filter_alt</mat-icon>
          Apply
        </button>
      </form>

      @if (jobs.filters().profileDefault) {
        <div class="profile-note">
          <span>Showing results for your profile.</span>
          <button mat-button type="button" (click)="clearProfile()">Clear to see all</button>
        </div>
      }

      <div class="summary-row">
        <article>
          <span>Total matches</span>
          <strong>{{ jobs.filteredJobs().length }}</strong>
        </article>
        <article>
          <span>New roles</span>
          <strong>{{ newCount() }}</strong>
        </article>
        <article>
          <span>Interviews</span>
          <strong>{{ interviewCount() }}</strong>
        </article>
      </div>

      @if (loading()) {
        <div class="job-list">
          <app-loading-skeleton />
          <app-loading-skeleton />
          <app-loading-skeleton />
        </div>
      } @else if (jobs.pagedJobs().length) {
        <div class="job-list">
          @for (job of jobs.pagedJobs(); track job.id) {
            <app-job-card [job]="job" (statusChange)="updateStatus(job.id, $event)" />
          }
        </div>
      } @else {
        <section class="empty-state">
          <mat-icon>search_off</mat-icon>
          <h2>No jobs match these filters</h2>
          <p>Try clearing a keyword, date, or company filter.</p>
        </section>
      }
    </section>
  `,
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly jobs = inject(JobsService);
  readonly companies = inject(CompaniesService);
  private readonly toast = inject(ToastService);
  readonly loading = signal(true);
  readonly jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];
  readonly newCount = computed(() => this.jobs.filteredJobs().filter((job) => job.isNew).length);
  readonly interviewCount = computed(() => this.jobs.jobs().filter((job) => job.status === 'interviewing').length);
  readonly form = this.fb.group({
    keyword: [''],
    location: [''],
    jobType: [''],
    company: [''],
    dateFrom: [''],
    dateTo: [''],
    newSinceLastVisit: [false],
  });

  ngOnInit(): void {
    this.companies.loadCompanies().subscribe();
    this.jobs.loadJobs().subscribe({ complete: () => this.loading.set(false) });
  }

  applyFilters(): void {
    this.jobs.setFilters(this.form.getRawValue());
  }

  clearProfile(): void {
    this.jobs.clearProfileDefault();
    this.toast.show('Profile filter cleared.', 'info');
  }

  updateStatus(jobId: string, status: ApplicationStatus): void {
    this.jobs.updateStatus(jobId, status).subscribe({
      next: () => this.toast.show('Application status updated.', 'success'),
      error: () => this.toast.show('Could not update status. Rolled back.', 'error'),
    });
  }
}
