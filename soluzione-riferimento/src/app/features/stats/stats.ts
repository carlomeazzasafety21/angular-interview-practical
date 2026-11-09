import { Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { toApiError } from '../../core/api';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  Stats,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from '../../core/models';
import { TicketsService } from '../../core/tickets.service';

@Component({
  selector: 'app-stats',
  template: `
    <h1>Statistiche</h1>

    @if (error()) {
      <div class="alert error">
        {{ error() }}
        <button type="button" class="btn" [disabled]="loading()" (click)="load()">Riprova</button>
      </div>
    }

    @if (stats(); as s) {
      <p>Ticket totali: <strong>{{ s.total }}</strong></p>
      <div class="cols">
        <section class="card">
          <h2>Per stato</h2>
          @for (k of statuses; track k) {
            <div class="bar-row">
              <span>{{ statusLabels[k] }}</span>
              <div class="bar"><div class="fill" [style.width.%]="percent(s.byStatus[k], s.total)"></div></div>
              <strong>{{ s.byStatus[k] }}</strong>
            </div>
          }
        </section>
        <section class="card">
          <h2>Per priorità</h2>
          @for (k of priorities; track k) {
            <div class="bar-row">
              <span>{{ priorityLabels[k] }}</span>
              <div class="bar"><div class="fill" [style.width.%]="percent(s.byPriority[k], s.total)"></div></div>
              <strong>{{ s.byPriority[k] }}</strong>
            </div>
          }
        </section>
      </div>
    } @else if (loading()) {
      <div class="state">Caricamento…</div>
    }
  `,
  styles: `
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    h2 { margin-top: 0; }
    .bar-row { display: grid; grid-template-columns: 110px 1fr 36px; align-items: center; gap: 10px; margin-bottom: 8px; }
    .bar { background: #edf0f6; border-radius: 4px; height: 10px; overflow: hidden; }
    .fill { background: #2f6fed; height: 100%; }
  `,
})
export class StatsPage {
  private readonly api = inject(TicketsService);

  protected readonly statuses = TICKET_STATUSES;
  protected readonly priorities = TICKET_PRIORITIES;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly priorityLabels = PRIORITY_LABELS;

  protected readonly stats = signal<Stats | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .stats()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: (err: unknown) => this.error.set(toApiError(err).message),
      });
  }

  protected percent(value: number, total: number): number {
    return total === 0 ? 0 : (value / total) * 100;
  }
}
