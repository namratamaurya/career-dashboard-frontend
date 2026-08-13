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
          <mat-card-subtitle>Track career portals and scrape priority.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="save()">
            <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput formControlName="name" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Career URL</mat-label><input matInput formControlName="careersUrl" /></mat-form-field>
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
          <div class="table-wrap">
            <table mat-table [dataSource]="companies.companies()">
              <ng-container matColumnDef="company">
                <th mat-header-cell *matHeaderCellDef>Company</th>
                <td mat-cell *matCellDef="let company">
                  <div class="company-cell"><img [src]="company.logoUrl" [alt]="company.name" /><strong>{{ company.name }}</strong></div>
                </td>
              </ng-container>
              <ng-container matColumnDef="priority"><th mat-header-cell *matHeaderCellDef>Priority</th><td mat-cell *matCellDef="let company">{{ company.priority }}</td></ng-container>
              <ng-container matColumnDef="tags"><th mat-header-cell *matHeaderCellDef>Tags</th><td mat-cell *matCellDef="let company">{{ company.tags.join(', ') }}</td></ng-container>
              <ng-container matColumnDef="scraped"><th mat-header-cell *matHeaderCellDef>Last scraped</th><td mat-cell *matCellDef="let company">{{ company.lastScrapedAt | date: 'short' }} · {{ company.lastScrapeStatus }}</td></ng-container>
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
  readonly columns = ['company', 'priority', 'tags', 'scraped', 'actions'];
  readonly atsTypes = ['Greenhouse', 'Lever', 'Workday', 'Custom', 'Unknown'];
  readonly priorities = ['High', 'Medium', 'Low'];
  readonly editingId = signal<string | null>(null);
  readonly scrapingId = signal<string | null>(null);
  readonly form = this.fb.group({
    name: ['', Validators.required],
    careersUrl: ['', Validators.required],
    atsType: ['Greenhouse'],
    priority: ['Medium'],
    tags: [''],
  });

  ngOnInit(): void {
    this.companies.loadCompanies().subscribe();
  }

  save(): void {
    const value = this.form.getRawValue();
    this.companies.saveCompany({ id: this.editingId() ?? undefined, ...value, tags: value.tags.split(',').map((tag) => tag.trim()).filter(Boolean) } as Partial<Company>).subscribe(() => {
      this.toast.show('Company saved.', 'success');
      this.reset();
    });
  }

  edit(company: Company): void {
    this.editingId.set(company.id);
    this.form.patchValue({ ...company, tags: company.tags.join(', ') });
  }

  delete(id: string): void {
    this.companies.deleteCompany(id).subscribe(() => this.toast.show('Company deleted.', 'success'));
  }

  scrape(id: string): void {
    this.scrapingId.set(id);
    this.companies.scrapeNow(id).subscribe({ next: () => this.toast.show('Scrape triggered.', 'success'), complete: () => this.scrapingId.set(null) });
  }

  reset(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', careersUrl: '', atsType: 'Greenhouse', priority: 'Medium', tags: '' });
  }
}
