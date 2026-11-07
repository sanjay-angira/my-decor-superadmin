import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ApiService } from '../../../core/services/api.service';

type BannerSource = 'offer' | 'category';

type BannerSourceRow = {
  key: string;
  source: BannerSource;
  sourceId: number;
  name: string;
  desktopImage: string | null;
  tabletImage: string | null;
  mobileImage: string | null;
  useAsBanner: boolean;
};

@Component({
  selector: 'app-banner-management',
  imports: [FormsModule, ButtonModule, TableModule, ToggleSwitchModule],
  templateUrl: './banner-management.component.html',
  styleUrl: './banner-management.component.scss',
})
export class BannerManagementComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly rows = signal<BannerSourceRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly savingKeys = signal(new Set<string>());

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.get('/banners').subscribe({
      next: (response) => {
        const rows = response?.data;
        this.rows.set(Array.isArray(rows) ? rows : []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load offer and category images.');
        this.rows.set([]);
        this.loading.set(false);
      },
    });
  }

  isSaving(row: BannerSourceRow): boolean {
    return this.savingKeys().has(row.key);
  }

  setUseAsBanner(row: BannerSourceRow, enabled: boolean): void {
    this.error.set('');
    this.savingKeys.update((keys) => new Set(keys).add(row.key));
    this.api.patch(`/banners/${row.source}/${row.sourceId}`, { useAsBanner: enabled }).subscribe({
      next: (response) => {
        if (response?.success === false) {
          this.error.set(response.message || 'Could not update banner selection.');
        } else {
          this.rows.update((rows) => rows.map((item) =>
            item.key === row.key ? { ...item, useAsBanner: enabled } : item,
          ));
        }
        this.finishUpdate(row.key);
      },
      error: () => {
        this.error.set(`Could not update ${row.name}. Please try again.`);
        this.finishUpdate(row.key);
      },
    });
  }

  private finishUpdate(key: string): void {
    this.savingKeys.update((keys) => {
      const next = new Set(keys);
      next.delete(key);
      return next;
    });
  }
}