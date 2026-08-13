import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { ApplicationRecord, ApplicationStatus } from '../models/career.models';
import { mockApplications } from './mock-data';

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private readonly applicationsState = signal<ApplicationRecord[]>(mockApplications);
  readonly applications = this.applicationsState.asReadonly();
  readonly byStatus = computed(() => {
    const statuses: ApplicationStatus[] = ['not_applied', 'applied', 'interviewing', 'rejected', 'offer'];
    return statuses.map((status) => ({
      status,
      items: this.applicationsState().filter((application) => application.status === status),
    }));
  });

  loadApplications(): Observable<ApplicationRecord[]> {
    return of(this.applicationsState()).pipe(delay(250));
  }

  saveApplication(record: ApplicationRecord): Observable<ApplicationRecord> {
    this.applicationsState.update((records) => records.map((item) => (item.id === record.id ? record : item)));
    return of(record).pipe(delay(250));
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
}
