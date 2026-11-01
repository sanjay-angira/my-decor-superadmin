import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-admin-form-shell',
  imports: [RouterLink, ButtonModule, ProgressSpinnerModule],
  templateUrl: './admin-form-shell.component.html',
  styleUrl: './admin-form-shell.component.scss',
})
export class AdminFormShellComponent {
  readonly title = input.required<string>();
  readonly module = input.required<string>();
  readonly description = input('');
  readonly loading = input(false);
  readonly loadError = input('');
  readonly submitError = input('');
}
