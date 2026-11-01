import { Component, input } from '@angular/core';

/** BazarBaazi lockup — auth cards and the dark sidebar. */
@Component({
  selector: 'app-auth-brand-logo',
  template: `
    <div
      class="brand-logo"
      [class.brand-logo--sidebar]="variant() === 'sidebar'"
    >
      <span class="brand-logo__mark" aria-hidden="true">
        <i class="pi pi-shop"></i>
      </span>
      <span class="brand-logo__name">My Decor <small>Admin</small></span>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        max-width: 100%;
      }
      .brand-logo {
        display: inline-flex;
        align-items: center;
        justify-content: flex-start;
        gap: 10px;
        max-width: 100%;
      }
      .brand-logo__mark {
        display: grid;
        width: 38px;
        height: 38px;
        flex: 0 0 auto;
        place-items: center;
        border-radius: 10px;
        background: var(--vr-primary);
        color: #fff;
        font-size: 19px;
      }
      .brand-logo__name {
        color: var(--vr-text);
        font-size: 18px;
        font-weight: 700;
        line-height: 1.15;
        white-space: nowrap;
      }
      .brand-logo__name small {
        display: block;
        margin-top: 3px;
        color: var(--vr-text-secondary);
        font-size: 11px;
        font-weight: 500;
      }
      :host-context(html[data-theme='dark']) .brand-logo__name {
        color: var(--vr-text);
      }
      :host-context(html[data-theme='dark']) .brand-logo__name small {
        color: var(--vr-text-secondary);
      }
      .brand-logo--sidebar .brand-logo__mark {
        background: #fff;
        color: var(--vr-primary);
      }
      .brand-logo--sidebar .brand-logo__name,
      :host-context(html[data-theme='dark']) .brand-logo--sidebar .brand-logo__name {
        color: #fff;
      }
      .brand-logo--sidebar .brand-logo__name small,
      :host-context(html[data-theme='dark']) .brand-logo--sidebar .brand-logo__name small {
        color: rgba(255, 255, 255, 0.78);
      }
    `,
  ],
})
export class AuthBrandLogoComponent {
  readonly variant = input<'auth' | 'sidebar'>('auth');
}
