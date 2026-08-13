import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, delay, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BackendLoginResponse, BackendUserProfile, LoginResponse, SignupRequest, SignupStatus, User } from '../models/career.models';
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

  signupStatus(): Observable<SignupStatus> {
    if (environment.useMockApi) {
      return of({ usersCreated: 0, maxUsers: 2, signupOpen: true }).pipe(delay(200));
    }
    return this.http.get<SignupStatus>(`${environment.apiBaseUrl}/auth/signup-status`);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    if (environment.useMockApi) {
      const user = mockUsers.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());
      if (!user || password.length < 4) {
        return throwError(() => new Error('Use one of the seeded demo emails and any 4+ character password.'));
      }
      return of({ token: `mock-jwt-${user.id}`, user }).pipe(delay(450), tap((response) => this.setSession(response)));
    }

    return this.http
      .post<BackendLoginResponse>(`${environment.apiBaseUrl}/auth/login`, { email, password })
      .pipe(map((response) => this.fromBackendLogin(response, email)))
      .pipe(tap((response) => this.setSession(response)));
  }

  signup(request: SignupRequest): Observable<LoginResponse> {
    if (environment.useMockApi) {
      const user: User = {
        id: crypto.randomUUID(),
        name: request.displayName,
        email: request.email,
        avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(request.displayName)}`,
        profile: {
          fieldKeywords: request.fieldKeywords,
          targetLocations: request.targetLocations,
          notificationEmails: [request.email],
        },
      };
      return of({ token: `mock-jwt-${user.id}`, user }).pipe(delay(450), tap((response) => this.setSession(response)));
    }

    return this.http.post<BackendLoginResponse>(`${environment.apiBaseUrl}/auth/signup`, request).pipe(
      map((response) => this.fromBackendLogin(response, request.email)),
      tap((response) => this.setSession(response)),
    );
  }

  loadProfile(): Observable<User> {
    if (environment.useMockApi) {
      return of(this.userState() ?? mockUsers[0]).pipe(delay(200));
    }
    return this.http.get<BackendUserProfile>(`${environment.apiBaseUrl}/me/profile`).pipe(
      map((profile) => this.fromBackendProfile(profile)),
      tap((user) => {
        this.userState.set(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenState.set(null);
    this.userState.set(null);
  }

  updateProfile(profile: User['profile']): Observable<User> {
    const user = this.userState();
    if (!user) {
      return throwError(() => new Error('No authenticated user.'));
    }
    if (environment.useMockApi) {
      const next = { ...user, profile };
      this.userState.set(next);
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return of(next).pipe(delay(200));
    }

    return this.http
      .patch<BackendUserProfile>(`${environment.apiBaseUrl}/me/profile`, {
        id: user.id,
        email: user.email,
        displayName: user.name,
        fieldKeywords: profile.fieldKeywords,
        targetLocations: profile.targetLocations,
      })
      .pipe(
        map((backendProfile) => ({
          ...this.fromBackendProfile(backendProfile),
          profile: { ...profile, notificationEmails: profile.notificationEmails },
        })),
        tap((next) => {
          this.userState.set(next);
          localStorage.setItem(USER_KEY, JSON.stringify(next));
        }),
      );
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

  private fromBackendLogin(response: BackendLoginResponse, email: string): LoginResponse {
    const token = response.token ?? response.accessToken ?? response.jwt;
    const profile = response.user ?? response.profile;
    if (!token) {
      throw new Error('Login response did not include a JWT token.');
    }
    return { token, user: profile ? this.fromBackendProfile(profile) : this.fallbackUser(email) };
  }

  private fromBackendProfile(profile: BackendUserProfile): User {
    return {
      id: profile.id,
      name: profile.displayName,
      email: profile.email,
      avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(profile.displayName)}`,
      profile: {
        fieldKeywords: profile.fieldKeywords ?? [],
        targetLocations: profile.targetLocations ?? [],
        notificationEmails: this.userState()?.profile.notificationEmails ?? [profile.email],
      },
    };
  }

  private fallbackUser(email: string): User {
    return {
      id: email,
      name: email.split('@')[0],
      email,
      avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(email)}`,
      profile: { fieldKeywords: [], targetLocations: [], notificationEmails: [email] },
    };
  }
}
