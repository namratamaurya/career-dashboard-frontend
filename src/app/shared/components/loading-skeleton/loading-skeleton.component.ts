import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  template: `
    <div class="skeleton-card" aria-hidden="true">
      <span></span>
      <strong></strong>
      <p></p>
      <p></p>
    </div>
  `,
  styles: `
    .skeleton-card {
      border: 1px solid #dde4ee;
      border-radius: 8px;
      background: #fff;
      padding: 18px;
    }
    span, strong, p {
      display: block;
      border-radius: 999px;
      background: linear-gradient(90deg, #edf1f7, #f7f9fc, #edf1f7);
      background-size: 200% 100%;
      animation: shimmer 1.2s linear infinite;
      height: 14px;
    }
    span { width: 44px; height: 44px; border-radius: 8px; }
    strong { width: 68%; margin-top: 14px; height: 22px; }
    p { width: 92%; margin: 14px 0 0; }
    p:last-child { width: 54%; }
    @keyframes shimmer { to { background-position: -200% 0; } }
  `,
})
export class LoadingSkeletonComponent {}
