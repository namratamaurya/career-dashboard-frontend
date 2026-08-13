import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
  });

  it('redirects anonymous visitors to login', () => {
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toEqual(TestBed.inject(Router).createUrlTree(['/login']));
  });

  it('allows authenticated visitors', (done) => {
    const auth = TestBed.inject(AuthService);
    auth.login('namrata@example.com', 'portfolio').subscribe(() => {
      const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
      expect(result).toBeTrue();
      done();
    });
  });
});
