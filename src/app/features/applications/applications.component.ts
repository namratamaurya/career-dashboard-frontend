import { Component, ElementRef, OnInit, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Chart } from 'chart.js/auto';
import { ApplicationRecord, ApplicationStatus, statusLabels } from '../../core/models/career.models';
import { ApplicationsService } from '../../core/services/applications.service';
import { ToastService } from '../../core/services/toast.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-applications',
  imports: [FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, StatusBadgeComponent],
  template: `
    <section class="applications-layout">
      <mat-card class="analytics">
        <mat-card-header>
          <mat-card-title>Application analytics</mat-card-title>
          <mat-card-subtitle>Status and company breakdowns</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <canvas #statusChart aria-label="Applications by status"></canvas>
          <button mat-stroked-button type="button" (click)="exportCsv()"><mat-icon>download</mat-icon> Export CSV</button>
        </mat-card-content>
      </mat-card>

      <div class="kanban" role="list" aria-label="Applications grouped by status">
        @for (group of applications.byStatus(); track group.status) {
          <section class="column">
            <h2>{{ labels[group.status] }} <span>{{ group.items.length }}</span></h2>
            @for (item of group.items; track item.id) {
              <article class="application-card" role="listitem" tabindex="0" (click)="select(item)" (keydown.enter)="select(item)">
                <strong>{{ item.title }}</strong>
                <span>{{ item.company }}</span>
                <app-status-badge [status]="item.status" />
              </article>
            }
          </section>
        }
      </div>

      @if (selected(); as record) {
        <mat-card class="editor">
          <mat-card-header>
            <mat-card-title>{{ record.title }}</mat-card-title>
            <mat-card-subtitle>{{ record.company }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select [(ngModel)]="draft.status">@for (status of statuses; track status) { <mat-option [value]="status">{{ labels[status] }}</mat-option> }</mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Applied date</mat-label><input matInput type="date" [(ngModel)]="draft.appliedDate" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Resume version</mat-label><input matInput [(ngModel)]="draft.resumeVersion" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Notes</mat-label><textarea matInput rows="4" [(ngModel)]="draft.notes"></textarea></mat-form-field>
            <div class="form-actions">
              <button mat-flat-button color="primary" type="button" (click)="save()">Save notes</button>
              <button mat-button type="button" (click)="selected.set(null)">Close</button>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </section>
  `,
  styleUrl: './applications.component.scss',
})
export class ApplicationsComponent implements OnInit {
  readonly applications = inject(ApplicationsService);
  private readonly toast = inject(ToastService);
  readonly selected = signal<ApplicationRecord | null>(null);
  readonly labels = statusLabels;
  readonly statuses = Object.keys(statusLabels) as ApplicationStatus[];
  draft: ApplicationRecord = {} as ApplicationRecord;
  private chart?: Chart;
  @ViewChild('statusChart') statusChart?: ElementRef<HTMLCanvasElement>;

  constructor() {
    effect(() => {
      this.applications.applications();
      queueMicrotask(() => this.renderChart());
    });
  }

  ngOnInit(): void {
    this.applications.loadApplications().subscribe();
  }

  select(record: ApplicationRecord): void {
    this.selected.set(record);
    this.draft = { ...record };
  }

  save(): void {
    this.applications.saveApplication(this.draft).subscribe(() => {
      this.toast.show('Application updated.', 'success');
      this.selected.set(null);
    });
  }

  exportCsv(): void {
    const blob = new Blob([this.applications.exportCsv()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'career-dashboard-applications.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  private renderChart(): void {
    const canvas = this.statusChart?.nativeElement;
    if (!canvas) {
      return;
    }
    const counts = this.applications.byStatus().map((group) => group.items.length);
    this.chart?.destroy();
    this.chart = new Chart(canvas, {
      type: 'bar',
      data: { labels: this.statuses.map((status) => this.labels[status]), datasets: [{ label: 'Applications', data: counts, backgroundColor: ['#94a3b8', '#2563eb', '#f59e0b', '#ef4444', '#10b981'] }] },
      options: { responsive: true, plugins: { legend: { display: false } } },
    });
  }
}
