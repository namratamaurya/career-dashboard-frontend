import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Company } from '../../core/models/career.models';
import { CompaniesService } from '../../core/services/companies.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-companies',
  imports: [DatePipe, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatTableModule],
  template: `
    <section class="companies-layout">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ editingId() ? 'Edit company' : 'Add company' }}</mat-card-title>
          <mat-card-subtitle>Track career portals shared by both dashboard users.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="save()">
            <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput formControlName="name" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Career portal URL</mat-label><input matInput formControlName="careersUrl" /></mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>ATS type</mat-label>
              <mat-select formControlName="atsType">
                @for (type of atsTypes; track type) { <mat-option [value]="type">{{ type }}</mat-option> }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Priority</mat-label>
              <mat-select formControlName="priority">
                @for (priority of priorities; track priority) { <mat-option [value]="priority">{{ priority }}</mat-option> }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Tags</mat-label><input matInput formControlName="tags" placeholder="AI, frontend" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Notes</mat-label><textarea matInput formControlName="notes" rows="3"></textarea></mat-form-field>
            <div class="form-actions">
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Save company</button>
              <button mat-button type="button" (click)="reset()">Clear</button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title>Tracked companies</mat-card-title>
          <mat-card-subtitle>{{ companies.companies().length }} portals watched</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (loading()) {
            <p class="state-message">Loading companies from the API...</p>
          } @else if (loadError()) {
            <p class="state-message error">{{ loadError() }}</p>
          } @else if (!companies.companies().length) {
            <p class="state-message">No companies are tracked yet. Add a company to start scraping career portals.</p>
          } @else {
            <div class="table-wrap">
              <table mat-table [dataSource]="companies.companies()">
                <ng-container matColumnDef="company">
                  <th mat-header-cell *matHeaderCellDef>Company</th>
                  <td mat-cell *matCellDef="let company">
                    <div class="company-cell">
                      <img [src]="company.logoUrl" [alt]="company.name" />
                      <div>
                        <strong>{{ company.name }}</strong>
                        <a [href]="company.careersUrl" target="_blank" rel="noreferrer">{{ company.atsType }} portal</a>
                      </div>
                    </div>
                  </td>
                </ng-container>
                <ng-container matColumnDef="priority"><th mat-header-cell *matHeaderCellDef>Priority</th><td mat-cell *matCellDef="let company">{{ company.priority }}</td></ng-container>
                <ng-container matColumnDef="tags"><th mat-header-cell *matHeaderCellDef>Tags</th><td mat-cell *matCellDef="let company">{{ company.tags.join(', ') || 'None' }}</td></ng-container>
                <ng-container matColumnDef="jobs">
                  <th mat-header-cell *matHeaderCellDef>Jobs</th>
                  <td mat-cell *matCellDef="let company">
                    <div class="metric">
                      <strong>{{ company.stats?.activeJobs ?? 0 }}</strong>
                      <span>active / {{ company.stats?.totalJobs ?? 0 }} total</span>
                    </div>
                  </td>
                </ng-container>
                <ng-container matColumnDef="scraped">
                  <th mat-header-cell *matHeaderCellDef>Scrape status</th>
                  <td mat-cell *matCellDef="let company">
                    <div class="scrape-cell">
                      <span
                        class="status-pill"
                        [class.success]="company.lastScrapeStatus === 'success'"
                        [class.failed]="company.lastScrapeStatus === 'failed'"
                        [class.never]="company.lastScrapeStatus === 'never'"
                        [class.skipped]="company.lastScrapeStatus === 'skipped'"
                        [class.running]="company.lastScrapeStatus === 'running'"
                        [class.queued]="company.lastScrapeStatus === 'queued'"
                      >
                        {{ company.lastScrapeStatus }}
                      </span>
                      <small>{{ company.lastScrapedAt ? (company.lastScrapedAt | date: 'short') : 'Never scraped' }}</small>
                      @if (company.stats?.scrapeRuns) {
                        <small>{{ company.stats?.scrapeRuns }} scrape runs</small>
                      }
                      @if (company.lastScrapeError) {
                        <small class="error-text">{{ company.lastScrapeError }}</small>
                      }
                    </div>
                  </td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let company">
                    <button mat-icon-button type="button" aria-label="Edit company" (click)="edit(company)"><mat-icon>edit</mat-icon></button>
                    <button mat-icon-button type="button" aria-label="Scrape now" (click)="scrape(company.id)" [disabled]="scrapingId() === company.id"><mat-icon>sync</mat-icon></button>
                    <button mat-icon-button type="button" aria-label="Delete company" (click)="delete(company.id)"><mat-icon>delete</mat-icon></button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr mat-row *matRowDef="let row; columns: columns"></tr>
              </table>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styleUrl: './companies.component.scss',
})
export class CompaniesComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly companies = inject(CompaniesService);
  private readonly toast = inject(ToastService);
  readonly columns = ['company', 'priority', 'tags', 'jobs', 'scraped', 'actions'];
  readonly atsTypes = ['Unknown', 'Greenhouse', 'Lever', 'Workday', 'Custom'];
  readonly priorities = ['High', 'Medium', 'Low'];
  readonly editingId = signal<string | null>(null);
  readonly scrapingId = signal<string | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly form = this.fb.group({
    name: ['', Validators.required],
    careersUrl: ['', Validators.required],
    atsType: ['Unknown'],
    priority: ['Medium'],
    tags: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.companies.loadCompanies().subscribe({
      next: () => {
        this.loading.set(false);
        this.loadError.set('');
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('Could not load companies from the API. Sign in again if your session expired.');
      },
    });
  }

  save(): void {
    const value = this.form.getRawValue();
    this.companies
      .saveCompany({ id: this.editingId() ?? undefined, ...value, tags: this.splitTags(value.tags) } as Partial<Company>)
      .subscribe({
        next: () => {
          this.toast.show('Company saved.', 'success');
          this.reset();
          this.loadError.set('');
        },
        error: () => {
          this.toast.show('Could not save company. Check the URL and required fields.', 'error');
        },
      });
  }

  edit(company: Company): void {
    this.editingId.set(company.id);
    this.form.patchValue({ ...company, tags: company.tags.join(', '), notes: company.notes ?? '' });
  }

  delete(id: string): void {
    this.companies.deleteCompany(id).subscribe({
      next: () => this.toast.show('Company deleted.', 'success'),
      error: () => this.toast.show('Could not delete company.', 'error'),
    });
  }

  scrape(id: string): void {
    this.scrapingId.set(id);
    this.companies.scrapeNow(id).subscribe({
      next: () => this.toast.show('Scrape triggered.', 'success'),
      error: () => {
        this.toast.show('Could not trigger scrape.', 'error');
        this.scrapingId.set(null);
      },
      complete: () => this.scrapingId.set(null),
    });
  }

  reset(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', careersUrl: '', atsType: 'Unknown', priority: 'Medium', tags: '', notes: '' });
  }

  private splitTags(tags: string): string[] {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
}
