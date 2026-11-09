import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, debounceTime, map, of, switchMap, tap } from 'rxjs';
import { toApiError } from '../../core/api';
import { LookupService } from '../../core/lookup.service';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TicketListQuery,
  TicketPage,
  TicketPriority,
  TicketStatus,
} from '../../core/models';
import { TicketsService } from '../../core/tickets.service';

const PAGE_SIZE = 10;

/** Reads the list query from the URL, ignoring values that are not valid. */
function parseQuery(params: ParamMap): TicketListQuery {
  const status = params.get('status');
  const priority = params.get('priority');
  const page = Number(params.get('page'));
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: PAGE_SIZE,
    status: TICKET_STATUSES.includes(status as TicketStatus) ? (status as TicketStatus) : '',
    priority: TICKET_PRIORITIES.includes(priority as TicketPriority) ? (priority as TicketPriority) : '',
    search: params.get('search') ?? '',
  };
}

interface Filters {
  search: string;
  status: TicketStatus | '';
  priority: TicketPriority | '';
}

@Component({
  selector: 'app-ticket-list',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  template: `
    <div class="page-head">
      <h1>Ticket</h1>
      <a class="btn primary" routerLink="/tickets/new">Nuovo ticket</a>
    </div>

    <form class="card filters" [formGroup]="filters">
      <input type="search" formControlName="search" placeholder="Cerca per titolo o descrizione" aria-label="Cerca" />
      <select formControlName="status" aria-label="Stato">
        <option value="">Tutti gli stati</option>
        @for (s of statuses; track s) {
          <option [value]="s">{{ statusLabels[s] }}</option>
        }
      </select>
      <select formControlName="priority" aria-label="Priorità">
        <option value="">Tutte le priorità</option>
        @for (p of priorities; track p) {
          <option [value]="p">{{ priorityLabels[p] }}</option>
        }
      </select>
      <button type="button" class="btn" (click)="resetFilters()">Azzera</button>
    </form>

    @if (error()) {
      <div class="alert error">
        {{ error() }}
        <button type="button" class="btn" (click)="retry()">Riprova</button>
      </div>
    }

    @if (page(); as p) {
      @if (p.items.length === 0) {
        <div class="state card">Nessun ticket trovato con questi filtri.</div>
      } @else {
        <table [class.loading]="loading()">
          <thead>
            <tr>
              <th>#</th>
              <th>Titolo</th>
              <th>Stato</th>
              <th>Priorità</th>
              <th>Categoria</th>
              <th>Assegnato a</th>
              <th>Aggiornato</th>
            </tr>
          </thead>
          <tbody>
            @for (t of p.items; track t.id) {
              <tr>
                <td>{{ t.id }}</td>
                <td>
                  <a [routerLink]="['/tickets', t.id]">{{ t.title }}</a>
                </td>
                <td>
                  <span class="badge status-{{ t.status }}">{{ statusLabels[t.status] }}</span>
                </td>
                <td>
                  <span class="badge priority-{{ t.priority }}">{{ priorityLabels[t.priority] }}</span>
                </td>
                <td>{{ lookup.categoryName(t.categoryId) }}</td>
                <td>{{ lookup.userName(t.assigneeId) }}</td>
                <td>{{ t.updatedAt | date: 'dd/MM/yyyy HH:mm' }}</td>
              </tr>
            }
          </tbody>
        </table>
        <div class="pager">
          <button type="button" class="btn" [disabled]="p.page <= 1 || loading()" (click)="goTo(p.page - 1)">‹ Precedente</button>
          <span>Pagina {{ p.page }} di {{ totalPages() }} ({{ p.total }} ticket)</span>
          <button type="button" class="btn" [disabled]="p.page >= totalPages() || loading()" (click)="goTo(p.page + 1)">Successiva ›</button>
        </div>
      }
    } @else if (loading()) {
      <div class="state">Caricamento…</div>
    }
  `,
  styles: `
    .filters { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 12px; margin-bottom: 16px; padding: 14px; }
    table.loading { opacity: 0.5; }
    .pager { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
  `,
})
export class TicketList {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(TicketsService);
  protected readonly lookup = inject(LookupService);

  protected readonly statuses = TICKET_STATUSES;
  protected readonly priorities = TICKET_PRIORITIES;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly priorityLabels = PRIORITY_LABELS;

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly page = signal<TicketPage | null>(null);
  protected readonly totalPages = computed(() => {
    const p = this.page();
    return p ? Math.max(1, Math.ceil(p.total / p.pageSize)) : 1;
  });

  protected readonly filters = this.fb.group({
    search: '',
    status: this.fb.control<TicketStatus | ''>(''),
    priority: this.fb.control<TicketPriority | ''>(''),
  });

  private readonly reload$ = new BehaviorSubject<void>(undefined);
  // Filters we just wrote in the URL: when they come back we must not overwrite what the user is typing.
  private lastPushed: Filters | null = null;

  constructor() {
    combineLatest([this.route.queryParamMap, this.reload$])
      .pipe(
        map(([params]) => parseQuery(params)),
        tap((query) => {
          this.syncFormFromUrl(query);
          this.loading.set(true);
          this.error.set(null);
        }),
        // switchMap drops the previous request when filters change before it finishes.
        switchMap((query) =>
          this.api.list(query).pipe(
            map((page) => ({ page, error: null as string | null })),
            catchError((err: unknown) => of({ page: null, error: toApiError(err).message })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.page.set(result.page);
        this.error.set(result.error);
        this.loading.set(false);
      });

    this.filters.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe((v) => {
      const next: Filters = { search: v.search ?? '', status: v.status ?? '', priority: v.priority ?? '' };
      this.lastPushed = next;
      this.navigate({ search: next.search || null, status: next.status || null, priority: next.priority || null, page: null });
    });
  }

  protected goTo(page: number): void {
    this.navigate({ page: page > 1 ? page : null });
  }

  protected resetFilters(): void {
    this.filters.reset();
  }

  protected retry(): void {
    this.reload$.next();
  }

  private navigate(queryParams: Record<string, string | number | null>): void {
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }

  private syncFormFromUrl(query: TicketListQuery): void {
    const pushed = this.lastPushed;
    this.lastPushed = null;
    const cameFromForm = pushed && pushed.search === query.search && pushed.status === query.status && pushed.priority === query.priority;
    if (!cameFromForm) {
      this.filters.patchValue({ search: query.search, status: query.status, priority: query.priority }, { emitEvent: false });
    }
  }
}
