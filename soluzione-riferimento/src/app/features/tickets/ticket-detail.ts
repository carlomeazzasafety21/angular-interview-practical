import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, finalize, map, of, switchMap, tap } from 'rxjs';
import { toApiError } from '../../core/api';
import { LookupService } from '../../core/lookup.service';
import { PRIORITY_LABELS, STATUS_LABELS, STATUS_TRANSITIONS, Ticket, TicketComment, TicketStatus } from '../../core/models';
import { TicketsService } from '../../core/tickets.service';

@Component({
  selector: 'app-ticket-detail',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  template: `
    <p><a routerLink="/tickets">‹ Torna all'elenco</a></p>

    @if (loadError()) {
      <div class="alert error">
        {{ loadError() }}
        <button type="button" class="btn" (click)="reload()">Riprova</button>
      </div>
    } @else if (ticket(); as t) {
      <div class="card">
        <div class="page-head">
          <h1>#{{ t.id }} {{ t.title }}</h1>
          @if (t.status !== 'CLOSED') {
            <a class="btn" [routerLink]="['/tickets', t.id, 'edit']">Modifica</a>
          }
        </div>

        <div class="meta">
          <span class="badge status-{{ t.status }}">{{ statusLabels[t.status] }}</span>
          <span class="badge priority-{{ t.priority }}">Priorità {{ priorityLabels[t.priority].toLowerCase() }}</span>
        </div>

        <dl class="grid">
          <dt>Categoria</dt>
          <dd>{{ lookup.categoryName(t.categoryId) }}</dd>
          <dt>Assegnato a</dt>
          <dd>{{ lookup.userName(t.assigneeId) }}</dd>
          <dt>Aperto da</dt>
          <dd>{{ lookup.userName(t.reporterId) }}</dd>
          <dt>Creato</dt>
          <dd>{{ t.createdAt | date: 'dd/MM/yyyy HH:mm' }}</dd>
          <dt>Aggiornato</dt>
          <dd>{{ t.updatedAt | date: 'dd/MM/yyyy HH:mm' }}</dd>
        </dl>

        <p class="description">{{ t.description }}</p>

        <h2>Cambia stato</h2>
        @if (statusError()) {
          <div class="alert error">{{ statusError() }}</div>
        }
        @if (nextStatuses().length === 0) {
          <p class="muted">Nessun cambio di stato disponibile.</p>
        } @else {
          <div class="actions">
            @for (s of nextStatuses(); track s) {
              <button type="button" class="btn" [disabled]="changing()" (click)="changeStatus(s)">
                Passa a «{{ statusLabels[s] }}»
              </button>
            }
          </div>
        }
      </div>

      <h2>Commenti</h2>
      @if (commentsError()) {
        <div class="alert error">{{ commentsError() }}</div>
      }
      @if (comments().length === 0 && !commentsError()) {
        <p class="muted">Nessun commento.</p>
      }
      @for (c of comments(); track c.id) {
        <div class="card comment">
          <strong>{{ c.authorName }}</strong>
          <span class="muted"> · {{ c.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
          <p>{{ c.text }}</p>
        </div>
      }

      <form class="card new-comment" (submit)="$event.preventDefault(); addComment()">
        <label for="comment">Aggiungi un commento</label>
        <textarea id="comment" [formControl]="commentText"></textarea>
        @if (commentError()) {
          <div class="field-error">{{ commentError() }}</div>
        }
        <button type="submit" class="btn primary" [disabled]="commentText.invalid || posting()">
          {{ posting() ? 'Invio…' : 'Invia commento' }}
        </button>
      </form>
    } @else {
      <div class="state">Caricamento…</div>
    }
  `,
  styles: `
    .meta { display: flex; gap: 8px; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: 140px 1fr; gap: 6px 12px; margin: 0 0 16px; }
    dt { color: #5a6480; }
    dd { margin: 0; }
    .description { white-space: pre-wrap; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .muted { color: #5a6480; }
    .comment { margin-bottom: 8px; }
    .comment p { margin: 6px 0 0; white-space: pre-wrap; }
    .new-comment { margin-top: 16px; }
    .new-comment label { display: block; font-weight: 600; margin-bottom: 4px; }
    .new-comment button { margin-top: 10px; }
  `,
})
export class TicketDetail {
  /** Bound from the :id route parameter. */
  readonly id = input.required<string>();

  private readonly api = inject(TicketsService);
  protected readonly lookup = inject(LookupService);

  protected readonly statusLabels = STATUS_LABELS;
  protected readonly priorityLabels = PRIORITY_LABELS;

  protected readonly ticket = signal<Ticket | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly comments = signal<TicketComment[]>([]);
  protected readonly commentsError = signal<string | null>(null);

  protected readonly statusError = signal<string | null>(null);
  protected readonly changing = signal(false);

  protected readonly commentText = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  protected readonly commentError = signal<string | null>(null);
  protected readonly posting = signal(false);

  protected readonly nextStatuses = computed<readonly TicketStatus[]>(() => {
    const t = this.ticket();
    return t ? STATUS_TRANSITIONS[t.status] : [];
  });

  private readonly attempt = signal(0);

  constructor() {
    const key$ = toObservable(computed(() => ({ id: Number(this.id()), attempt: this.attempt() })));

    key$
      .pipe(
        tap(() => {
          this.ticket.set(null);
          this.loadError.set(null);
          this.statusError.set(null);
        }),
        switchMap(({ id }) =>
          this.api.get(id).pipe(
            map((ticket) => ({ ticket, error: null as string | null })),
            catchError((err: unknown) => of({ ticket: null, error: toApiError(err).message })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((r) => {
        this.ticket.set(r.ticket);
        this.loadError.set(r.error);
      });

    key$
      .pipe(
        tap(() => {
          this.comments.set([]);
          this.commentsError.set(null);
        }),
        switchMap(({ id }) =>
          this.api.comments(id).pipe(
            map((list) => ({ list, error: null as string | null })),
            catchError((err: unknown) => of({ list: [] as TicketComment[], error: toApiError(err).message })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((r) => {
        this.comments.set(r.list);
        this.commentsError.set(r.error);
      });
  }

  protected reload(): void {
    this.attempt.update((n) => n + 1);
  }

  protected changeStatus(status: TicketStatus): void {
    const t = this.ticket();
    if (!t || this.changing()) return;
    this.changing.set(true);
    this.statusError.set(null);
    this.api
      .changeStatus(t.id, status)
      .pipe(finalize(() => this.changing.set(false)))
      .subscribe({
        next: (updated) => this.ticket.set(updated),
        error: (err: unknown) => {
          this.statusError.set(toApiError(err).message);
          // The ticket changed elsewhere: refresh it so the buttons match the real status.
          this.api.get(t.id).subscribe({ next: (fresh) => this.ticket.set(fresh), error: () => undefined });
        },
      });
  }

  protected addComment(): void {
    const t = this.ticket();
    const text = this.commentText.value.trim();
    if (!t || !text || this.posting()) return;
    this.posting.set(true);
    this.commentError.set(null);
    this.api
      .addComment(t.id, text)
      .pipe(finalize(() => this.posting.set(false)))
      .subscribe({
        next: (comment) => {
          this.comments.update((list) => [...list, comment]);
          this.commentText.reset();
        },
        error: (err: unknown) => this.commentError.set(toApiError(err).message),
      });
  }
}
