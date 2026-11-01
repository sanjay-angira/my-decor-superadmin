import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class AdminToastService {
  private readonly messages = inject(MessageService);

  open(
    detail: string,
    action?: string,
    config?: { duration?: number },
  ): void {
    const severity = action?.toLowerCase() === 'ok' ? 'success' : 'info';
    this.messages.add({
      severity,
      detail,
      life: config?.duration ?? 3000,
    });
  }
}
