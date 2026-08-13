import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgClass, MatButtonModule, MatIconModule],
  template: `
    <div class="shell" [class.dark]="isDark()">
      <aside class="sidebar" [class.open]="navOpen()">
        <div class="brand">
          <span class="brand-mark">CD</span>
          <div>
            <strong>Career Dashboard</strong>
            <span>Job search cockpit</span>
          </div>
        </div>

        <nav aria-label="Primary navigation">
          @for (item of navItems; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active" (click)="navOpen.set(false)">
              <mat-icon aria-hidden="true">{{ item.icon }}</mat-icon>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
      </aside>

      <div class="content">
        <header class="topbar">
          <button mat-icon-button class="mobile-menu" type="button" aria-label="Toggle navigation" (click)="toggleNav()">
            <mat-icon>menu</mat-icon>
          </button>
          <div>
            <p class="eyebrow">Static SPA · mock-first API</p>
            <h1>{{ pageTitle() }}</h1>
          </div>
          <div class="topbar-actions">
            <button mat-icon-button type="button" [attr.aria-label]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'" (click)="toggleDarkMode()">
              <mat-icon>{{ isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>
            @if (user(); as currentUser) {
              <div class="user-chip">
                <img [src]="currentUser.avatarUrl" [alt]="currentUser.name" />
                <span>{{ currentUser.name }}</span>
              </div>
            }
            <button mat-button type="button" (click)="logout()">
              <mat-icon>logout</mat-icon>
              Logout
            </button>
          </div>
        </header>

        <main>
          <router-outlet />
        </main>
      </div>

      <section class="toast-stack" aria-live="polite">
        @for (message of toasts.messages(); track message.id) {
          <button type="button" class="toast" [ngClass]="message.tone" (click)="toasts.dismiss(message.id)">
            {{ message.text }}
          </button>
        }
      </section>
    </div>
  `,
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly toasts = inject(ToastService);
  readonly user = this.auth.user;
  readonly navOpen = signal(false);
  readonly isDark = signal(localStorage.getItem('career-dashboard-theme') === 'dark');
  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { label: 'Companies', icon: 'business', path: '/companies' },
    { label: 'Applications', icon: 'view_kanban', path: '/applications' },
    { label: 'Saved Searches', icon: 'saved_search', path: '/saved-searches' },
    { label: 'Settings', icon: 'settings', path: '/settings' },
  ];
  readonly pageTitle = computed(() => {
    const path = this.router.url.split('?')[0];
    return this.navItems.find((item) => path.startsWith(item.path))?.label ?? 'Dashboard';
  });

  constructor() {
    effect(() => {
      document.documentElement.classList.toggle('dark-theme', this.isDark());
      localStorage.setItem('career-dashboard-theme', this.isDark() ? 'dark' : 'light');
    });
  }

  toggleDarkMode(): void {
    this.isDark.update((isDark) => !isDark);
  }

  toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
