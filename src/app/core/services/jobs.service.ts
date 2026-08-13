import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, delay, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationStatus, Job, JobFilters } from '../models/career.models';
import { defaultFilters, mockJobs } from './mock-data';

@Injectable({ providedIn: 'root' })
export class JobsService {
  private readonly http = inject(HttpClient);
  private readonly jobsState = signal<Job[]>(mockJobs);
  private readonly filtersState = signal<JobFilters>({ ...defaultFilters });
  readonly pageSize = signal(6);
  readonly pageIndex = signal(0);

  readonly jobs = this.jobsState.asReadonly();
  readonly filters = this.filtersState.asReadonly();
  readonly queryParams = computed(() => this.serializeFilters(this.filtersState()));
  readonly filteredJobs = computed(() => this.applyFilters(this.jobsState(), this.filtersState()));
  readonly pagedJobs = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredJobs().slice(start, start + this.pageSize());
  });

  loadJobs(): Observable<Job[]> {
    if (environment.useMockApi) {
      return of(this.jobsState()).pipe(delay(300));
    }
    return this.http
      .get<Job[]>(`${environment.apiBaseUrl}/jobs`, { params: this.queryParams() })
      .pipe(tap((jobs) => this.jobsState.set(jobs)));
  }

  setFilters(filters: Partial<JobFilters>): void {
    this.filtersState.update((current) => ({ ...current, ...filters }));
    this.pageIndex.set(0);
  }

  clearProfileDefault(): void {
    this.setFilters({ profileDefault: false });
  }

  updateStatus(jobId: string, status: ApplicationStatus): Observable<Job> {
    const previous = this.jobsState();
    const target = previous.find((job) => job.id === jobId);
    if (!target) {
      return throwError(() => new Error('Job not found.'));
    }
    const updated = { ...target, status };
    this.jobsState.set(previous.map((job) => (job.id === jobId ? updated : job)));

    const request = environment.useMockApi
      ? of(updated).pipe(delay(250))
      : this.http.patch<Job>(`${environment.apiBaseUrl}/jobs/${jobId}/application-status`, { status });

    return request.pipe(
      tap({
        error: () => this.jobsState.set(previous),
      }),
    );
  }

  serializeFilters(filters: JobFilters): HttpParams {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== false && value !== null && value !== undefined) {
        params = params.set(key, String(value));
      }
    });
    return params;
  }

  private applyFilters(jobs: Job[], filters: JobFilters): Job[] {
    return jobs.filter((job) => {
      const haystack = `${job.title} ${job.company} ${job.tags.join(' ')}`.toLowerCase();
      const keywordMatch = !filters.keyword || haystack.includes(filters.keyword.toLowerCase());
      const locationMatch = !filters.location || job.location.toLowerCase().includes(filters.location.toLowerCase());
      const typeMatch = !filters.jobType || job.jobType === filters.jobType;
      const companyMatch = !filters.company || job.company === filters.company;
      const newMatch = !filters.newSinceLastVisit || job.isNew;
      const fromMatch = !filters.dateFrom || job.postedDate >= filters.dateFrom;
      const toMatch = !filters.dateTo || job.postedDate <= filters.dateTo;
      return keywordMatch && locationMatch && typeMatch && companyMatch && newMatch && fromMatch && toMatch;
    });
  }
}
