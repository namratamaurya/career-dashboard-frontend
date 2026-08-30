import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { debounceTime } from 'rxjs';

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
        <button mat-button type="button" (click)="clearFilters()">
          <mat-icon>restart_alt</mat-icon>
          Reset
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
          <strong>{{ jobs.jobs().length }}</strong>
        </article>
        <article>
          <span>New roles</span>
          <strong>{{ newCount() }}</strong>
        </article>
        <article>
          <span>Tracked sources</span>
          <strong>{{ companies.companies().length }}</strong>
        </article>
      </div>

      <section class="company-strip" aria-label="Companies used for fetching job postings">
        <div class="section-heading">
          <div>
            <span>Tracked companies</span>
            <strong>{{ companies.companies().length }} career portals feeding this dashboard</strong>
          </div>
        </div>
        @if (companiesLoading()) {
          <p class="source-state">Loading companies from the API...</p>
        } @else if (companiesError()) {
          <p class="source-state error">{{ companiesError() }}</p>
        } @else if (!companies.companies().length) {
          <p class="source-state">No companies are tracked yet. Add companies in the Companies section, then scrape them to populate job postings.</p>
        } @else {
          <div class="company-grid">
            @for (company of visibleCompanies(); track company.id) {
              <article class="company-tile">
                <img [src]="company.logoUrl" [alt]="company.name + ' logo'" />
                <div>
                  <strong>{{ company.name }}</strong>
                  <span>{{ company.stats?.activeJobs ?? 0 }} active jobs · {{ company.lastScrapeStatus }}</span>
                </div>
                <button mat-button type="button" (click)="filterCompany(company.name)">Jobs</button>
              </article>
            }
          </div>
        }
      </section>

      @if (loading()) {
        <div class="job-list">
          <app-loading-skeleton />
          <app-loading-skeleton />
          <app-loading-skeleton />
        </div>
      } @else if (loadError()) {
        <section class="empty-state error">
          <mat-icon>cloud_off</mat-icon>
          <h2>Could not load job postings</h2>
          <p>{{ loadError() }}</p>
          <button mat-flat-button color="primary" type="button" (click)="reloadJobs()">Try again</button>
        </section>
      } @else if (jobs.pagedJobs().length) {
        <div class="job-list">
          @for (job of jobs.pagedJobs(); track job.id) {
            <app-job-card [job]="job" (statusChange)="updateStatus(job.id, $event)" />
          }
        </div>
      } @else {
        <section class="empty-state">
          <mat-icon>search_off</mat-icon>
          <h2>No matching job postings</h2>
          <p>Reset the filters or pick a different company. Apply buttons appear only on job listings and open the specific job description page.</p>
        </section>
      }
    </section>
  `,
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly jobs = inject(JobsService);
  readonly companies = inject(CompaniesService);
  private readonly toast = inject(ToastService);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly companiesLoading = signal(true);
  readonly companiesError = signal('');
  readonly jobTypes = ['Remote', 'Hybrid', 'Onsite', 'Unknown'];
  readonly newCount = computed(() => this.jobs.jobs().filter((job) => job.isNew).length);
  readonly visibleCompanies = computed(() => this.companies.companies().slice(0, 12));
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
    this.form.valueChanges.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.applyFilters();
    });
    this.loadCompanies();
    this.reloadJobs();
  }

  applyFilters(): void {
    this.jobs.setFilters(this.form.getRawValue());
    this.reloadJobs();
  }

  clearProfile(): void {
    this.jobs.clearProfileDefault();
    this.toast.show('Profile filter cleared.', 'info');
    this.reloadJobs();
  }

  clearFilters(): void {
    this.form.reset(
      {
        keyword: '',
        location: '',
        jobType: '',
        company: '',
        dateFrom: '',
        dateTo: '',
        newSinceLastVisit: false,
      },
      { emitEvent: false },
    );
    this.applyFilters();
  }

  filterCompany(company: string): void {
    this.form.patchValue({ company }, { emitEvent: false });
    this.applyFilters();
  }

  updateStatus(jobId: string, status: ApplicationStatus): void {
    this.jobs.updateStatus(jobId, status).subscribe({
      next: () => this.toast.show('Application status updated.', 'success'),
      error: () => this.toast.show('Could not update status. Rolled back.', 'error'),
    });
  }

  reloadJobs(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.jobs.loadJobs().subscribe({
      next: () => this.loadError.set(''),
      error: () => {
        this.loadError.set('Sign in again if your session expired, or confirm the backend is reachable over HTTPS.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  private loadCompanies(): void {
    this.companiesLoading.set(true);
    this.companiesError.set('');
    this.companies.loadCompanies().subscribe({
      next: () => this.companiesError.set(''),
      error: () => {
        this.companiesError.set('Could not load the companies used for fetching jobs. Sign in again if your session expired.');
        this.companiesLoading.set(false);
      },
      complete: () => this.companiesLoading.set(false),
    });
  }
}
