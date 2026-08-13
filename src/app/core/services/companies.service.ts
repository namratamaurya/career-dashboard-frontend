import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, delay, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Company } from '../models/career.models';
import { mockCompanies } from './mock-data';

@Injectable({ providedIn: 'root' })
export class CompaniesService {
  private readonly http = inject(HttpClient);
  private readonly companiesState = signal<Company[]>(mockCompanies);
  readonly companies = this.companiesState.asReadonly();

  loadCompanies(): Observable<Company[]> {
    if (environment.useMockApi) {
      return of(this.companiesState()).pipe(delay(250));
    }
    return this.http.get<Company[]>(`${environment.apiBaseUrl}/companies`).pipe(tap((companies) => this.companiesState.set(companies)));
  }

  saveCompany(company: Partial<Company>): Observable<Company> {
    const saved: Company = {
      id: company.id ?? crypto.randomUUID(),
      name: company.name ?? '',
      logoUrl: company.logoUrl || `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(company.name ?? 'Company')}`,
      careersUrl: company.careersUrl ?? '',
      atsType: company.atsType ?? 'Custom',
      priority: company.priority ?? 'Medium',
      tags: company.tags ?? [],
      lastScrapedAt: company.lastScrapedAt ?? new Date().toISOString(),
      lastScrapeStatus: company.lastScrapeStatus ?? 'queued',
    };

    if (environment.useMockApi) {
      this.companiesState.update((companies) => {
        const exists = companies.some((item) => item.id === saved.id);
        return exists ? companies.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...companies];
      });
      return of(saved).pipe(delay(250));
    }

    return company.id
      ? this.http.put<Company>(`${environment.apiBaseUrl}/companies/${company.id}`, saved)
      : this.http.post<Company>(`${environment.apiBaseUrl}/companies`, saved);
  }

  deleteCompany(id: string): Observable<void> {
    if (environment.useMockApi) {
      this.companiesState.update((companies) => companies.filter((company) => company.id !== id));
      return of(undefined).pipe(delay(200));
    }
    return this.http.delete<void>(`${environment.apiBaseUrl}/companies/${id}`);
  }

  scrapeNow(id: string): Observable<Company> {
    const previous = this.companiesState();
    this.companiesState.update((companies) => companies.map((company) => (company.id === id ? { ...company, lastScrapeStatus: 'running' } : company)));
    if (environment.useMockApi) {
      const updated = this.companiesState().find((company) => company.id === id)!;
      const done = { ...updated, lastScrapeStatus: 'success' as const, lastScrapedAt: new Date().toISOString() };
      return of(done).pipe(
        delay(700),
        tap({
          next: () => this.companiesState.update((companies) => companies.map((company) => (company.id === id ? done : company))),
          error: () => this.companiesState.set(previous),
        }),
      );
    }
    return this.http.post<Company>(`${environment.apiBaseUrl}/companies/${id}/scrape-now`, {});
  }
}
