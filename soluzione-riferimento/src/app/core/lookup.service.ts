import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { API_URL } from './api';
import { Category, User } from './models';

/** Categories and users, loaded once and used for selects and for showing names instead of ids. */
@Injectable({ providedIn: 'root' })
export class LookupService {
  private readonly http = inject(HttpClient);

  readonly categories = toSignal(
    this.http.get<Category[]>(`${API_URL}/categories`).pipe(catchError(() => of([] as Category[]))),
    { initialValue: [] as Category[] },
  );

  readonly users = toSignal(
    this.http.get<User[]>(`${API_URL}/users`).pipe(catchError(() => of([] as User[]))),
    { initialValue: [] as User[] },
  );

  categoryName(id: number): string {
    return this.categories().find((c) => c.id === id)?.name ?? '—';
  }

  userName(id: number | null): string {
    if (id === null) return 'Non assegnato';
    return this.users().find((u) => u.id === id)?.fullName ?? '—';
  }
}
