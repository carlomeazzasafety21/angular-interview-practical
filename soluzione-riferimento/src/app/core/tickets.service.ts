import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api';
import { Stats, Ticket, TicketComment, TicketInput, TicketListQuery, TicketPage, TicketStatus } from './models';

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private readonly http = inject(HttpClient);

  list(query: TicketListQuery): Observable<TicketPage> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.status) params = params.set('status', query.status);
    if (query.priority) params = params.set('priority', query.priority);
    if (query.search) params = params.set('search', query.search);
    return this.http.get<TicketPage>(`${API_URL}/tickets`, { params });
  }

  get(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${API_URL}/tickets/${id}`);
  }

  create(input: TicketInput): Observable<Ticket> {
    return this.http.post<Ticket>(`${API_URL}/tickets`, input);
  }

  update(id: number, input: TicketInput): Observable<Ticket> {
    return this.http.put<Ticket>(`${API_URL}/tickets/${id}`, input);
  }

  changeStatus(id: number, status: TicketStatus): Observable<Ticket> {
    return this.http.patch<Ticket>(`${API_URL}/tickets/${id}/status`, { status });
  }

  comments(id: number): Observable<TicketComment[]> {
    return this.http.get<TicketComment[]>(`${API_URL}/tickets/${id}/comments`);
  }

  addComment(id: number, text: string): Observable<TicketComment> {
    return this.http.post<TicketComment>(`${API_URL}/tickets/${id}/comments`, { text });
  }

  stats(): Observable<Stats> {
    return this.http.get<Stats>(`${API_URL}/stats`);
  }
}
