const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./openapi.json');

const PORT = 3000;
const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const TRANSITIONS = {
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['IN_PROGRESS', 'CLOSED'],
  CLOSED: [],
};

// In-memory state, reloaded from the seed at every start.
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'seed.json'), 'utf8'));
const users = seed.users;
const categories = seed.categories;
const tickets = seed.tickets;
const comments = seed.comments;
const sessions = new Map();
let nextTicketId = Math.max(...tickets.map((t) => t.id)) + 1;
let nextCommentId = Math.max(...comments.map((c) => c.id)) + 1;

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// API documentation: registered before the latency middleware so the UI assets load fast.
app.get('/openapi.json', (req, res) => res.json(openapi));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, { swaggerOptions: { persistAuthorization: true } }));

// Random latency on every response
app.use((req, res, next) => {
  setTimeout(next, 200 + Math.random() * 600);
});

const publicUser = ({ password, ...u }) => u;

// Auth middleware (everything under /api except login)
app.use('/api', (req, res, next) => {
  if (req.path === '/auth/login') return next();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const userId = token && sessions.get(token);
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  req.user = users.find((u) => u.id === userId);
  next();
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const token = `tok_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  sessions.set(token, user.id);
  res.json({ token, user: publicUser(user) });
});

app.get('/api/me', (req, res) => res.json(publicUser(req.user)));
app.get('/api/users', (req, res) => res.json(users.map(publicUser)));
app.get('/api/categories', (req, res) => res.json(categories));

app.get('/api/tickets', (req, res) => {
  const { status, priority, categoryId, assigneeId, search, sort } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 10));

  let result = tickets.slice();
  if (status) result = result.filter((t) => t.status === status);
  if (priority) result = result.filter((t) => t.priority === priority);
  if (categoryId) result = result.filter((t) => t.categoryId === Number(categoryId));
  if (assigneeId) result = result.filter((t) => t.assigneeId === Number(assigneeId));
  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(
      (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    );
  }

  const [field, dir] = String(sort || 'createdAt,desc').split(',');
  const factor = dir === 'asc' ? 1 : -1;
  const priorityRank = (p) => PRIORITIES.indexOf(p);
  result.sort((a, b) => {
    const av = field === 'priority' ? priorityRank(a.priority) : a[field];
    const bv = field === 'priority' ? priorityRank(b.priority) : b[field];
    if (av === undefined || bv === undefined) return 0;
    return av < bv ? -factor : av > bv ? factor : 0;
  });

  const total = result.length;
  const items = result.slice((page - 1) * pageSize, page * pageSize);
  res.json({ items, total, page, pageSize });
});

app.get('/api/tickets/:id', (req, res) => {
  const ticket = tickets.find((t) => t.id === Number(req.params.id));
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  res.json(ticket);
});

/** Validates a ticket payload and returns a map field -> messages. */
function validateTicket(body) {
  const errors = {};
  const add = (field, msg) => (errors[field] = [...(errors[field] || []), msg]);
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (title.length < 5 || title.length > 100) add('title', 'Title must be between 5 and 100 characters');
  if (!body.description || !String(body.description).trim()) add('description', 'Description is required');
  if (!PRIORITIES.includes(body.priority)) add('priority', `Priority must be one of ${PRIORITIES.join(', ')}`);
  if (!categories.some((c) => c.id === Number(body.categoryId))) add('categoryId', 'Category does not exist');
  if (body.assigneeId != null && !users.some((u) => u.id === Number(body.assigneeId))) {
    add('assigneeId', 'Assignee does not exist');
  }
  return errors;
}

app.post('/api/tickets', (req, res) => {
  const errors = validateTicket(req.body || {});
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Validation failed', errors });
  const now = new Date().toISOString();
  const b = req.body;
  const ticket = {
    id: nextTicketId++,
    title: b.title.trim(),
    description: String(b.description).trim(),
    status: 'OPEN',
    priority: b.priority,
    categoryId: Number(b.categoryId),
    assigneeId: b.assigneeId != null ? Number(b.assigneeId) : null,
    reporterId: req.user.id,
    createdAt: now,
    updatedAt: now,
  };
  tickets.unshift(ticket);
  res.status(201).json(ticket);
});

app.put('/api/tickets/:id', (req, res) => {
  const ticket = tickets.find((t) => t.id === Number(req.params.id));
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (ticket.status === 'CLOSED') return res.status(409).json({ message: 'A closed ticket cannot be modified' });
  const errors = validateTicket(req.body || {});
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Validation failed', errors });
  const b = req.body;
  Object.assign(ticket, {
    title: b.title.trim(),
    description: String(b.description).trim(),
    priority: b.priority,
    categoryId: Number(b.categoryId),
    assigneeId: b.assigneeId != null ? Number(b.assigneeId) : null,
    updatedAt: new Date().toISOString(),
  });
  res.json(ticket);
});

app.patch('/api/tickets/:id/status', (req, res) => {
  const ticket = tickets.find((t) => t.id === Number(req.params.id));
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  const next = (req.body || {}).status;
  if (!STATUSES.includes(next)) {
    return res.status(400).json({ message: 'Validation failed', errors: { status: [`Status must be one of ${STATUSES.join(', ')}`] } });
  }
  if (!TRANSITIONS[ticket.status].includes(next)) {
    return res.status(422).json({ message: `Transition from ${ticket.status} to ${next} is not allowed` });
  }
  ticket.status = next;
  ticket.updatedAt = new Date().toISOString();
  res.json(ticket);
});

app.get('/api/tickets/:id/comments', (req, res) => {
  const id = Number(req.params.id);
  if (!tickets.some((t) => t.id === id)) return res.status(404).json({ message: 'Ticket not found' });
  res.json(comments.filter((c) => c.ticketId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
});

app.post('/api/tickets/:id/comments', (req, res) => {
  const id = Number(req.params.id);
  if (!tickets.some((t) => t.id === id)) return res.status(404).json({ message: 'Ticket not found' });
  const text = typeof (req.body || {}).text === 'string' ? req.body.text.trim() : '';
  if (!text) return res.status(400).json({ message: 'Validation failed', errors: { text: ['Text is required'] } });
  const comment = {
    id: nextCommentId++,
    ticketId: id,
    authorId: req.user.id,
    authorName: req.user.fullName,
    text,
    createdAt: new Date().toISOString(),
  };
  comments.push(comment);
  res.status(201).json(comment);
});

// Fails randomly on purpose (about 25% of calls)
app.get('/api/stats', (req, res) => {
  if (Math.random() < 0.25) return res.status(500).json({ message: 'Unexpected server error' });
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, tickets.filter((t) => t.status === s).length]));
  const byPriority = Object.fromEntries(PRIORITIES.map((p) => [p, tickets.filter((t) => t.priority === p).length]));
  res.json({ total: tickets.length, byStatus, byPriority });
});

app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));

// Final error handler: keeps the documented error shape (e.g. malformed JSON bodies).
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Malformed JSON body' });
  res.status(500).json({ message: 'Unexpected server error' });
});

app.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
  console.log(`API docs on http://localhost:${PORT}/docs`);
});
