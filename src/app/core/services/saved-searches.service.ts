import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, delay, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BackendSavedSearch, NotificationCadence, SavedSearch } from '../models/career.models';
import { defaultFilters, mockSavedSearches } from './mock-data';

@Injectable({ providedIn: 'root' })
export class SavedSearchesService {
  private readonly http = inject(HttpClient);
  private readonly searchesState = signal<SavedSearch[]>(mockSavedSearches);
  readonly searches = this.searchesState.asReadonly();

  loadSavedSearches(): Observable<SavedSearch[]> {
    if (environment.useMockApi) {
      return of(this.searchesState()).pipe(delay(250));
    }
    return this.http.get<BackendSavedSearch[]>(`${environment.apiBaseUrl}/saved-searches`).pipe(
      map((searches) => searches.map((search) => this.fromBackendSearch(search))),
      tap((searches) => this.searchesState.set(searches)),
    );
  }

  create(name: string, keyword = ''): Observable<SavedSearch> {
    const saved: SavedSearch = {
      id: crypto.randomUUID(),
      name,
      filters: { ...defaultFilters, keyword, profileDefault: false },
      notificationCadence: 'daily',
    };
    if (environment.useMockApi) {
      this.searchesState.update((searches) => [saved, ...searches]);
      return of(saved).pipe(delay(250));
    }
    return this.http
      .post<BackendSavedSearch>(`${environment.apiBaseUrl}/saved-searches`, {
        name,
        filters: { keyword },
        notificationFrequency: 'DAILY',
      })
      .pipe(
        map((search) => this.fromBackendSearch(search)),
        tap((search) => this.searchesState.update((searches) => [search, ...searches])),
      );
  }

  update(search: SavedSearch): Observable<SavedSearch> {
    if (!environment.useMockApi) {
      this.searchesState.update((searches) => searches.map((item) => (item.id === search.id ? search : item)));
      return of(search);
    }
    this.searchesState.update((searches) => searches.map((item) => (item.id === search.id ? search : item)));
    return of(search).pipe(delay(250));
  }

  delete(id: string): Observable<void> {
    this.searchesState.update((searches) => searches.filter((search) => search.id !== id));
    return of(undefined).pipe(delay(200));
  }

  notifyNow(id: string): Observable<SavedSearch> {
    if (!environment.useMockApi) {
      return this.http.post<BackendSavedSearch | Record<string, never>>(`${environment.apiBaseUrl}/saved-searches/${id}/notify-now`, {}).pipe(
        map(() => {
          const current = this.searchesState().find((search) => search.id === id)!;
          return { ...current, lastNotifiedAt: new Date().toISOString() };
        }),
        tap((updated) => this.searchesState.update((searches) => searches.map((search) => (search.id === id ? updated : search)))),
      );
    }
    const updated = this.searchesState().find((search) => search.id === id)!;
    const withNotification = { ...updated, lastNotifiedAt: new Date().toISOString() };
    this.searchesState.update((searches) => searches.map((search) => (search.id === id ? withNotification : search)));
    return of(withNotification).pipe(delay(500));
  }

  private fromBackendSearch(search: BackendSavedSearch): SavedSearch {
    const filters = search.filters ?? {};
    return {
      id: search.id,
      name: search.name,
      filters: {
        ...defaultFilters,
        keyword: String(filters['keyword'] ?? ''),
        location: String(filters['location'] ?? ''),
        jobType: this.fromBackendJobType(String(filters['type'] ?? '')),
        company: String(filters['company'] ?? ''),
        dateFrom: String(filters['since'] ?? ''),
        dateTo: String(filters['until'] ?? ''),
        newSinceLastVisit: Boolean(filters['newSinceLastVisit']),
        profileDefault: !Boolean(filters['includeOutsideProfile']),
      },
      notificationCadence: this.fromBackendCadence(search.notificationFrequency ?? 'DAILY'),
      lastNotifiedAt: search.lastNotifiedAt,
    };
  }

  private fromBackendCadence(cadence: string): NotificationCadence {
    const map: Record<string, NotificationCadence> = { INSTANT: 'instant', DAILY: 'daily', WEEKLY: 'weekly', NONE: 'off' };
    return map[cadence] ?? 'daily';
  }

  private fromBackendJobType(type: string): string {
    const map: Record<string, string> = { REMOTE: 'Remote', HYBRID: 'Hybrid', ONSITE: 'Onsite', UNKNOWN: 'Unknown' };
    return map[type] ?? '';
  }
}
