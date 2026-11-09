import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, filter, of, switchMap } from 'rxjs';
import { toApiError } from '../../core/api';
import { applyServerErrors } from '../../core/form-errors';
import { LookupService } from '../../core/lookup.service';
import { PRIORITY_LABELS, TICKET_PRIORITIES, Ticket, TicketInput, TicketPriority } from '../../core/models';
import { TicketsService } from '../../core/tickets.service';

@Component({
  selector: 'app-ticket-form',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <p><a [routerLink]="id() ? ['/tickets', id()] : ['/tickets']">‹ Indietro</a></p>
    <h1>{{ isEdit() ? 'Modifica ticket' : 'Nuovo ticket' }}</h1>

    @if (loadError()) {
      <div class="alert error">{{ loadError() }}</div>
    }
    @if (isClosed()) {
      <div class="alert info">Il ticket è chiuso e non può essere modificato.</div>
    }
    @if (formError()) {
      <div class="alert error">{{ formError() }}</div>
    }

    <form class="card" [formGroup]="form" (ngSubmit)="submit()">
      <div class="field">
        <label for="title">Titolo</label>
        <input id="title" formControlName="title" [class.invalid]="errorOf('title')" />
        @if (errorOf('title'); as e) {
          <div class="field-error">{{ e }}</div>
        }
      </div>

      <div class="field">
        <label for="description">Descrizione</label>
        <textarea id="description" formControlName="description" [class.invalid]="errorOf('description')"></textarea>
        @if (errorOf('description'); as e) {
          <div class="field-error">{{ e }}</div>
        }
      </div>

      <div class="row">
        <div class="field">
          <label for="priority">Priorità</label>
          <select id="priority" formControlName="priority" [class.invalid]="errorOf('priority')">
            @for (p of priorities; track p) {
              <option [ngValue]="p">{{ priorityLabels[p] }}</option>
            }
          </select>
          @if (errorOf('priority'); as e) {
            <div class="field-error">{{ e }}</div>
          }
        </div>

        <div class="field">
          <label for="category">Categoria</label>
          <select id="category" formControlName="categoryId" [class.invalid]="errorOf('categoryId')">
            <option [ngValue]="null">Seleziona…</option>
            @for (c of lookup.categories(); track c.id) {
              <option [ngValue]="c.id">{{ c.name }}</option>
            }
          </select>
          @if (errorOf('categoryId'); as e) {
            <div class="field-error">{{ e }}</div>
          }
        </div>

        <div class="field">
          <label for="assignee">Assegnato a</label>
          <select id="assignee" formControlName="assigneeId" [class.invalid]="errorOf('assigneeId')">
            <option [ngValue]="null">Non assegnato</option>
            @for (u of lookup.users(); track u.id) {
              <option [ngValue]="u.id">{{ u.fullName }}</option>
            }
          </select>
          @if (errorOf('assigneeId'); as e) {
            <div class="field-error">{{ e }}</div>
          }
        </div>
      </div>

      <button type="submit" class="btn primary" [disabled]="saving() || isClosed()">
        {{ saving() ? 'Salvataggio…' : 'Salva' }}
      </button>
    </form>
  `,
  styles: `
    .row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  `,
})
export class TicketForm {
  /** Bound from the :id route parameter; undefined when creating a new ticket. */
  readonly id = input<string>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(TicketsService);
  private readonly router = inject(Router);
  protected readonly lookup = inject(LookupService);

  protected readonly priorities = TICKET_PRIORITIES;
  protected readonly priorityLabels = PRIORITY_LABELS;

  protected readonly isEdit = computed(() => this.id() !== undefined);
  protected readonly saving = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);
  protected readonly isClosed = signal(false);

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
    description: ['', Validators.required],
    priority: this.fb.control<TicketPriority>('MEDIUM', Validators.required),
    categoryId: new FormControl<number | null>(null, Validators.required),
    assigneeId: new FormControl<number | null>(null),
  });

  constructor() {
    toObservable(this.id)
      .pipe(
        filter((id): id is string => id !== undefined),
        switchMap((id) =>
          this.api.get(Number(id)).pipe(
            catchError((err: unknown) => {
              this.loadError.set(toApiError(err).message);
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((ticket) => {
        if (ticket) this.fill(ticket);
      });
  }

  /** Message to show under a field, or null. Server errors are shown the same way as client ones. */
  protected errorOf(name: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[name];
    if (!control.touched || !control.errors) return null;
    if (control.errors['server']) return control.errors['server'] as string;
    if (control.errors['required']) return 'Campo obbligatorio';
    if (control.errors['minlength']) return `Minimo ${control.errors['minlength'].requiredLength} caratteri`;
    if (control.errors['maxlength']) return `Massimo ${control.errors['maxlength'].requiredLength} caratteri`;
    return null;
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;

    const value = this.form.getRawValue();
    if (value.categoryId === null) return;
    const input: TicketInput = {
      title: value.title.trim(),
      description: value.description.trim(),
      priority: value.priority,
      categoryId: value.categoryId,
      assigneeId: value.assigneeId,
    };

    const id = this.id();
    const request = id !== undefined ? this.api.update(Number(id), input) : this.api.create(input);

    this.saving.set(true);
    this.formError.set(null);
    request.subscribe({
      next: (ticket) => this.router.navigate(['/tickets', ticket.id]),
      error: (err: unknown) => {
        const apiError = toApiError(err);
        // With field errors (400) the messages sit under the fields; otherwise show the general message.
        const unmapped = apiError.errors ? applyServerErrors(this.form, apiError.errors) : [apiError.message];
        this.formError.set(unmapped.length ? unmapped.join(' ') : null);
        this.saving.set(false);
      },
    });
  }

  private fill(ticket: Ticket): void {
    this.form.patchValue({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      categoryId: ticket.categoryId,
      assigneeId: ticket.assigneeId,
    });
    if (ticket.status === 'CLOSED') {
      this.isClosed.set(true);
      this.form.disable();
    }
  }
}
