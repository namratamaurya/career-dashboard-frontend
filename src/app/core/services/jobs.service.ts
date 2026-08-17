import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, delay, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationStatus, BackendJobPosting, Job, JobFilters, PaginatedJobs } from '../models/career.models';
import { defaultFilters, mockJobs } from './mock-data';

@Injectable({ providedIn: 'root' })
export class JobsService {
  private readonly http = inject(HttpClient);
  private readonly jobsState = signal<Job[]>(environment.useMockApi ? mockJobs : []);
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
      .get<PaginatedJobs>(`${environment.apiBaseUrl}/jobs`, { params: this.queryParams() })
      .pipe(
        map((response) => response.items.map((job) => this.fromBackendJob(job))),
        tap((jobs) => this.jobsState.set(jobs)),
      );
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
      : this.http
          .patch<unknown>(`${environment.apiBaseUrl}/jobs/${jobId}/application-status`, { status: this.toBackendStatus(status) })
          .pipe(map(() => updated));

    return request.pipe(
      tap({
        error: () => this.jobsState.set(previous),
      }),
    );
  }

  serializeFilters(filters: JobFilters): HttpParams {
    let params = new HttpParams();
    const entries: Record<string, string | boolean | number> = {
      keyword: filters.keyword,
      location: filters.location,
      type: this.toBackendJobType(filters.jobType),
      company: filters.company,
      since: filters.dateFrom,
      until: filters.dateTo,
      newSinceLastVisit: filters.newSinceLastVisit,
      includeOutsideProfile: !filters.profileDefault,
      sort: 'newest',
      page: this.pageIndex() + 1,
      pageSize: this.pageSize(),
    };
    Object.entries(entries).forEach(([key, value]) => {
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

  private fromBackendJob(job: BackendJobPosting): Job {
    const postedDate = job.postedAt ?? job.firstSeenAt ?? job.lastSeenAt;
    const currentApplication = job.applications?.[0];
    return {
      id: job.id,
      title: job.title,
      companyId: job.company.id,
      company: job.company.name,
      companyLogoUrl: job.company.logoUrl ?? `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(job.company.name)}`,
      location: job.location ?? 'Unknown',
      jobType: this.fromBackendJobType(job.jobType),
      postedDate: postedDate ? postedDate.slice(0, 10) : '',
      applyUrl: job.url,
      status: this.fromBackendStatus(currentApplication?.status ?? job.applicationStatus ?? job.status ?? 'NOT_APPLIED'),
      tags: [job.department, ...(job.company.tags ?? [])].filter(Boolean) as string[],
      isNew: Boolean(job.firstSeenAt && new Date(job.firstSeenAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000),
      whyThisFits: job.whyThisFits,
    };
  }

  private fromBackendStatus(status: string): ApplicationStatus {
    const normalized = status.toLowerCase();
    return normalized === 'not_applied' || normalized === 'applied' || normalized === 'interviewing' || normalized === 'rejected' || normalized === 'offer'
      ? normalized
      : 'not_applied';
  }

  private toBackendStatus(status: ApplicationStatus): string {
    return status.toUpperCase();
  }

  private fromBackendJobType(type: string): Job['jobType'] {
    const labels: Record<string, Job['jobType']> = { REMOTE: 'Remote', HYBRID: 'Hybrid', ONSITE: 'Onsite', UNKNOWN: 'Unknown' };
    return labels[type] ?? 'Unknown';
  }

  private toBackendJobType(type: string): string {
    const labels: Record<string, string> = { Remote: 'REMOTE', Hybrid: 'HYBRID', Onsite: 'ONSITE', Unknown: 'UNKNOWN' };
    return labels[type] ?? '';
  }
}
