import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    environment.useMockApi = true;
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(AuthService);
  });

  it('logs in a seeded mock user and stores the token', (done) => {
    service.login('namrata@example.com', 'portfolio').subscribe((response) => {
      expect(response.token).toContain('mock-jwt');
      expect(service.isAuthenticated()).toBeTrue();
      expect(localStorage.getItem('career-dashboard-token')).toBe(response.token);
      done();
    });
  });

  it('clears auth state on logout', () => {
    service.logout();
    expect(service.isAuthenticated()).toBeFalse();
  });
});
