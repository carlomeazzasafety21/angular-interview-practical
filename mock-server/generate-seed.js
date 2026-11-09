// Generates data/seed.json deterministically. Run: node generate-seed.js
const fs = require('fs');
const path = require('path');

let s = 42;
const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const users = [
  { id: 1, username: 'mario.rossi', password: 'password', fullName: 'Mario Rossi', role: 'AGENT' },
  { id: 2, username: 'giulia.bianchi', password: 'password', fullName: 'Giulia Bianchi', role: 'AGENT' },
  { id: 3, username: 'luca.verdi', password: 'password', fullName: 'Luca Verdi', role: 'AGENT' },
  { id: 4, username: 'anna.neri', password: 'password', fullName: 'Anna Neri', role: 'REQUESTER' },
  { id: 5, username: 'paolo.gallo', password: 'password', fullName: 'Paolo Gallo', role: 'REQUESTER' },
  { id: 6, username: 'sara.conti', password: 'password', fullName: 'Sara Conti', role: 'REQUESTER' },
];

const categories = [
  { id: 1, name: 'Hardware' },
  { id: 2, name: 'Software' },
  { id: 3, name: 'Network' },
  { id: 4, name: 'Account and access' },
  { id: 5, name: 'Other' },
];

const subjects = [
  ['Laptop does not boot', 1], ['Monitor flickering', 1], ['Keyboard keys not working', 1],
  ['Printer offline', 1], ['Docking station not detected', 1], ['Battery drains quickly', 1],
  ['Application crashes on startup', 2], ['Cannot install update', 2], ['Spreadsheet macro fails', 2],
  ['Email client slow', 2], ['License expired', 2], ['Browser keeps freezing', 2],
  ['VPN disconnects every hour', 3], ['Wi-Fi unstable in meeting room', 3], ['Cannot reach shared drive', 3],
  ['Slow internet in the morning', 3], ['Password reset request', 4], ['Account locked', 4],
  ['Need access to project folder', 4], ['Two-factor code not received', 4],
  ['Request for second monitor', 5], ['Office chair broken', 5], ['Badge not working', 5],
];
const details = [
  'It started this morning and it blocks my work.',
  'It happens a few times per day, always at random moments.',
  'Already tried restarting, no change.',
  'A colleague has the same issue.',
  'Please check as soon as possible, I have a deadline.',
];

const statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const base = Date.UTC(2026, 8, 1);
const day = 86400000;

const tickets = [];
for (let i = 1; i <= 60; i++) {
  const [title, categoryId] = subjects[(i - 1) % subjects.length];
  const created = base + Math.floor(rnd() * 60 * day);
  const updated = created + Math.floor(rnd() * 5 * day);
  tickets.push({
    id: i,
    title: `${title} (#${i})`,
    description: `${title}. ${pick(details)}`,
    status: pick(statuses),
    priority: pick(priorities),
    categoryId,
    assigneeId: rnd() < 0.15 ? null : pick([1, 2, 3]),
    reporterId: pick([4, 5, 6]),
    createdAt: new Date(created).toISOString(),
    updatedAt: new Date(updated).toISOString(),
  });
}

const commentTexts = [
  'Looking into it.', 'Could you share more details?', 'I tried the suggested fix, still not working.',
  'Escalated to the vendor.', 'Works now, thanks!', 'Waiting for the replacement part.',
];
const comments = [];
let cid = 1;
for (const t of tickets) {
  const n = Math.floor(rnd() * 4);
  for (let k = 0; k < n; k++) {
    const author = pick(users);
    comments.push({
      id: cid++,
      ticketId: t.id,
      authorId: author.id,
      authorName: author.fullName,
      text: pick(commentTexts),
      createdAt: new Date(Date.parse(t.createdAt) + (k + 1) * 3600000 * 5).toISOString(),
    });
  }
}

fs.writeFileSync(path.join(__dirname, 'data', 'seed.json'), JSON.stringify({ users, categories, tickets, comments }, null, 2));
console.log(`seed.json written: ${tickets.length} tickets, ${comments.length} comments`);
