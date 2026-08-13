import { Component, input } from '@angular/core';
import { ApplicationStatus, statusLabels } from '../../../core/models/career.models';

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [class]="status()">{{ label }}</span>`,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 4px 9px;
    }
    .not_applied { background: #e5e7eb; color: #374151; }
    .applied { background: #dbeafe; color: #1d4ed8; }
    .interviewing { background: #fef3c7; color: #92400e; }
    .rejected { background: #fee2e2; color: #b91c1c; }
    .offer { background: #dcfce7; color: #047857; }
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<ApplicationStatus>();

  get label(): string {
    return statusLabels[this.status()];
  }
}
