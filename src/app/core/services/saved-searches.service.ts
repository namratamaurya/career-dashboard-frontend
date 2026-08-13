import { Injectable, signal } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { SavedSearch } from '../models/career.models';
import { defaultFilters, mockSavedSearches } from './mock-data';

@Injectable({ providedIn: 'root' })
export class SavedSearchesService {
  private readonly searchesState = signal<SavedSearch[]>(mockSavedSearches);
  readonly searches = this.searchesState.asReadonly();

  loadSavedSearches(): Observable<SavedSearch[]> {
    return of(this.searchesState()).pipe(delay(250));
  }

  create(name: string, keyword = ''): Observable<SavedSearch> {
    const saved: SavedSearch = {
      id: crypto.randomUUID(),
      name,
      filters: { ...defaultFilters, keyword, profileDefault: false },
      notificationCadence: 'daily',
    };
    this.searchesState.update((searches) => [saved, ...searches]);
    return of(saved).pipe(delay(250));
  }

  update(search: SavedSearch): Observable<SavedSearch> {
    this.searchesState.update((searches) => searches.map((item) => (item.id === search.id ? search : item)));
    return of(search).pipe(delay(250));
  }

  delete(id: string): Observable<void> {
    this.searchesState.update((searches) => searches.filter((search) => search.id !== id));
    return of(undefined).pipe(delay(200));
  }

  notifyNow(id: string): Observable<SavedSearch> {
    const updated = this.searchesState().find((search) => search.id === id)!;
    const withNotification = { ...updated, lastNotifiedAt: new Date().toISOString() };
    this.searchesState.update((searches) => searches.map((search) => (search.id === id ? withNotification : search)));
    return of(withNotification).pipe(delay(500));
  }
}
