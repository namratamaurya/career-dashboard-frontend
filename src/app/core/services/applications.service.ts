import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, delay, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationRecord, ApplicationStatus, BackendApplication, BackendJobPosting, PaginatedJobs } from '../models/career.models';
import { mockApplications } from './mock-data';

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private readonly http = inject(HttpClient);
  private readonly applicationsState = signal<ApplicationRecord[]>(environment.useMockApi ? mockApplications : []);
  readonly applications = this.applicationsState.asReadonly();
  readonly byStatus = computed(() => {
    const statuses: ApplicationStatus[] = ['not_applied', 'applied', 'interviewing', 'rejected', 'offer'];
    return statuses.map((status) => ({
      status,
      items: this.applicationsState().filter((application) => application.status === status),
    }));
  });

  loadApplications(): Observable<ApplicationRecord[]> {
    if (environment.useMockApi) {
      return of(this.applicationsState()).pipe(delay(250));
    }
    const params = new HttpParams().set('includeOutsideProfile', 'true').set('pageSize', '100').set('sort', 'newest');
    return this.http.get<PaginatedJobs>(`${environment.apiBaseUrl}/jobs`, { params }).pipe(
      map((response) => response.items.map((job) => this.fromBackendJob(job))),
      tap((records) => this.applicationsState.set(records)),
    );
  }

  saveApplication(record: ApplicationRecord): Observable<ApplicationRecord> {
    this.applicationsState.update((records) => records.map((item) => (item.id === record.id ? record : item)));
    if (environment.useMockApi) {
      return of(record).pipe(delay(250));
    }
    return this.http
      .patch<BackendApplication>(`${environment.apiBaseUrl}/jobs/${record.jobId}/application-status`, {
        status: this.toBackendStatus(record.status),
        appliedAt: record.appliedDate ? new Date(record.appliedDate).toISOString() : undefined,
        notes: record.notes,
        resumeVersion: record.resumeVersion,
      })
      .pipe(
        map((application) => this.mergeBackendApplication(record, application)),
        tap((updated) => this.applicationsState.update((records) => records.map((item) => (item.id === record.id ? updated : item)))),
      );
  }

  exportCsv(): string {
    const header = ['Title', 'Company', 'Status', 'Applied Date', 'Resume Version', 'Notes'];
    const rows = this.applicationsState().map((item) => [
      item.title,
      item.company,
      item.status,
      item.appliedDate ?? '',
      item.resumeVersion ?? '',
      item.notes ?? '',
    ]);
    return [header, ...rows].map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
  }

  private fromBackendJob(job: BackendJobPosting): ApplicationRecord {
    const application = job.applications?.[0];
    return {
      id: application?.id ?? `job-${job.id}`,
      jobId: job.id,
      title: job.title,
      company: job.company.name,
      status: this.fromBackendStatus(application?.status ?? 'NOT_APPLIED'),
      appliedDate: application?.appliedAt ? application.appliedAt.slice(0, 10) : undefined,
      resumeVersion: application?.resumeVersion ?? undefined,
      notes: application?.notes ?? '',
    };
  }

  private mergeBackendApplication(record: ApplicationRecord, application: BackendApplication): ApplicationRecord {
    return {
      ...record,
      id: application.id,
      status: this.fromBackendStatus(application.status),
      appliedDate: application.appliedAt ? application.appliedAt.slice(0, 10) : record.appliedDate,
      resumeVersion: application.resumeVersion ?? record.resumeVersion,
      notes: application.notes ?? record.notes,
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
}
