import { Component, computed, input } from '@angular/core';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-table-skeleton',
  imports: [TableModule],
  templateUrl: './table-skeleton.component.html',
  styleUrl: './table-skeleton.component.scss',
})
export class TableSkeletonComponent {
  readonly headers = input<string[]>([]);
  readonly columns = input(5);
  readonly rows = input(8);
  readonly actionCount = input(3);
  readonly showPaginator = input(false);

  readonly headerLabels = computed(() =>
    this.headers().length ? this.headers() : Array.from({ length: this.columns() }, () => ''),
  );
  readonly rowIndexes = computed(() => Array.from({ length: this.rows() }, (_, i) => i));
  readonly actionIndexes = computed(() =>
    Array.from({ length: this.actionCount() }, (_, i) => i),
  );
}
