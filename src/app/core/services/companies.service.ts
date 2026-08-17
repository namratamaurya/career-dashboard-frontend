import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, delay, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BackendCompany, Company } from '../models/career.models';
import { mockCompanies } from './mock-data';

@Injectable({ providedIn: 'root' })
export class CompaniesService {
  private readonly http = inject(HttpClient);
  private readonly companiesState = signal<Company[]>(environment.useMockApi ? mockCompanies : []);
  readonly companies = this.companiesState.asReadonly();

  loadCompanies(): Observable<Company[]> {
    if (environment.useMockApi) {
      return of(this.companiesState()).pipe(delay(250));
    }
    return this.http.get<BackendCompaniesResponse>(`${environment.apiBaseUrl}/companies`).pipe(
      map((response) => this.unwrapCompanies(response).map((company) => this.fromBackendCompany(company))),
      tap((companies) => this.companiesState.set(companies)),
    );
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

    const input = this.toBackendCompanyInput(saved);
    return company.id
      ? this.http.patch<BackendCompany>(`${environment.apiBaseUrl}/companies/${company.id}`, input).pipe(
          map((response) => this.fromBackendCompany(response)),
          tap((updated) => this.companiesState.update((companies) => companies.map((item) => (item.id === updated.id ? updated : item)))),
        )
      : this.http.post<BackendCompany>(`${environment.apiBaseUrl}/companies`, input).pipe(
          map((response) => this.fromBackendCompany(response)),
          tap((created) => this.companiesState.update((companies) => [created, ...companies])),
        );
  }

  deleteCompany(id: string): Observable<void> {
    if (environment.useMockApi) {
      this.companiesState.update((companies) => companies.filter((company) => company.id !== id));
      return of(undefined).pipe(delay(200));
    }
    return this.http.delete<void>(`${environment.apiBaseUrl}/companies/${id}`).pipe(
      tap(() => this.companiesState.update((companies) => companies.filter((company) => company.id !== id))),
    );
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
    return this.http.post<unknown>(`${environment.apiBaseUrl}/companies/${id}/scrape-now`, {}).pipe(
      map(() => ({ ...this.companiesState().find((company) => company.id === id)!, lastScrapeStatus: 'queued' as const })),
      tap((company) => this.companiesState.update((companies) => companies.map((item) => (item.id === id ? company : item)))),
    );
  }

  private fromBackendCompany(company: BackendCompany): Company {
    return {
      id: company.id,
      name: company.name,
      logoUrl: company.logoUrl ?? `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(company.name)}`,
      careersUrl: company.portalUrl,
      atsType: this.titleEnum(company.atsType),
      priority: this.titleEnum(company.priority),
      tags: company.tags ?? [],
      lastScrapedAt: company.lastScrapedAt ?? '',
      lastScrapeStatus: company.lastScrapeStatus.toLowerCase() as Company['lastScrapeStatus'],
    };
  }

  private unwrapCompanies(response: BackendCompaniesResponse): BackendCompany[] {
    if (Array.isArray(response)) {
      return response;
    }
    return response.items ?? response.companies ?? response.data ?? [];
  }

  private toBackendCompanyInput(company: Company): Record<string, unknown> {
    return {
      name: company.name,
      portalUrl: company.careersUrl,
      atsType: company.atsType.toUpperCase(),
      logoUrl: company.logoUrl,
      tags: company.tags,
      priority: company.priority.toUpperCase(),
      scrapeIntervalMinutes: 720,
    };
  }

  private titleEnum<T extends string>(value: string): T {
    return (value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()) as T;
  }
}

type BackendCompaniesResponse =
  | BackendCompany[]
  | {
      items?: BackendCompany[];
      companies?: BackendCompany[];
      data?: BackendCompany[];
    };
