export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export const TICKET_STATUSES: readonly TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
export const TICKET_PRIORITIES: readonly TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Aperto',
  IN_PROGRESS: 'In lavorazione',
  RESOLVED: 'Risolto',
  CLOSED: 'Chiuso',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Bassa',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

/** Allowed status changes, mirroring the server rules to offer only valid actions. */
export const STATUS_TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['IN_PROGRESS', 'CLOSED'],
  CLOSED: [],
};

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Category {
  id: number;
  name: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  categoryId: number;
  assigneeId: number | null;
  reporterId: number;
  createdAt: string;
  updatedAt: string;
}

export interface TicketInput {
  title: string;
  description: string;
  priority: TicketPriority;
  categoryId: number;
  assigneeId: number | null;
}

export interface TicketPage {
  items: Ticket[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TicketListQuery {
  page: number;
  pageSize: number;
  status: TicketStatus | '';
  priority: TicketPriority | '';
  search: string;
}

export interface TicketComment {
  id: number;
  ticketId: number;
  authorId: number;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface Stats {
  total: number;
  byStatus: Record<TicketStatus, number>;
  byPriority: Record<TicketPriority, number>;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
