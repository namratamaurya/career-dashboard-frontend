import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, delay, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, User } from '../models/career.models';
import { mockUsers } from './mock-data';

const TOKEN_KEY = 'career-dashboard-token';
const USER_KEY = 'career-dashboard-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenState = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly userState = signal<User | null>(this.restoreUser());

  readonly token = this.tokenState.asReadonly();
  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.tokenState() && this.userState()));

  login(email: string, password: string): Observable<LoginResponse> {
    if (environment.useMockApi) {
      const user = mockUsers.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());
      if (!user || password.length < 4) {
        return throwError(() => new Error('Use one of the seeded demo emails and any 4+ character password.'));
      }
      return of({ token: `mock-jwt-${user.id}`, user }).pipe(delay(450), tap((response) => this.setSession(response)));
    }

    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, { email, password })
      .pipe(tap((response) => this.setSession(response)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenState.set(null);
    this.userState.set(null);
  }

  updateProfile(profile: User['profile']): void {
    const user = this.userState();
    if (!user) {
      return;
    }
    const next = { ...user, profile };
    this.userState.set(next);
    localStorage.setItem(USER_KEY, JSON.stringify(next));
  }

  private setSession(response: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this.tokenState.set(response.token);
    this.userState.set(response.user);
  }

  private restoreUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}
