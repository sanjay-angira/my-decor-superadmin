import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, JsonPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-order-view',
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    JsonPipe,
    ButtonModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './order-view.component.html',
  styleUrl: './order-view.component.scss',
})
export class OrderViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly order = signal<any>(null);
  readonly itemColumns = ['productName', 'quantity', 'price', 'total'];

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params.get('id');
      if (!id) return;
      this.loading.set(true);
      this.api.get(`/orders/${id}`).subscribe({
        next: (res) => {
          this.order.set(res?.data ?? res);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }
}
