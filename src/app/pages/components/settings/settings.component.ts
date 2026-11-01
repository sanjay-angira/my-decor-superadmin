import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-settings',
  imports: [RouterLink],
  template: `
    <div class="vr-page">
      <div class="vr-page-header-band">
        <div class="vr-title-card">
          <div class="vr-title-left">
            <h1>Settings</h1>
            <div class="vr-breadcrumbs">
              <a routerLink="/admin/dashboard">
                <i class="pi pi-home" aria-hidden="true"></i>
              </a>
              <span class="dot"></span>
              <span>Settings</span>
            </div>
          </div>
        </div>
      </div>
      <div class="vr-page-content" style="margin-top: 0; padding-top: 1rem">
        <div class="vr-card" style="padding: 1.25rem">
          Store-level settings will appear here. Backend <code>settings</code> module is currently a stub.
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent {}
