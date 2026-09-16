import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  getSupabase,
  isSupabaseConfigured,
  getUsers,
  getUserById,
  updateUser,
  getDestinations,
  getPackages,
  getHotels,
  getTripPlans,
  createTripPlan,
  deleteTripPlan,
  getBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  getExpenses,
  createExpense,
  deleteExpense
} from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Status check endpoint indicating Supabase status
app.get('/api/status', (req, res) => {
  const configured = isSupabaseConfigured();
  res.json({
    status: 'ok',
    database: configured ? 'Supabase PostgreSQL (Active)' : 'Supabase PostgreSQL (Ready / Seed fallback)',
    supabaseConfigured: configured,
    tables: ['users', 'destinations', 'packages', 'hotels', 'trip_plans', 'bookings', 'expenses'],
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==============================================================================
// 1. Users API (FR-01)
// ==============================================================================
app.get('/api/users', async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const updated = await updateUser(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 2. Destinations API (FR-02)
// ==============================================================================
app.get('/api/destinations', async (req, res) => {
  try {
    const destinations = await getDestinations();
    res.json(destinations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 3. Packages API (FR-05)
// ==============================================================================
app.get('/api/packages', async (req, res) => {
  try {
    const packages = await getPackages();
    res.json(packages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 4. Hotels API (FR-04)
// ==============================================================================
app.get('/api/hotels', async (req, res) => {
  try {
    const hotels = await getHotels();
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 5. Trip Plans API (FR-03)
// ==============================================================================
app.get('/api/plans', async (req, res) => {
  try {
    const userId = req.query.userId;
    const plans = await getTripPlans(userId);
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/plans', async (req, res) => {
  try {
    const plan = await createTripPlan(req.body);
    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/plans/:id', async (req, res) => {
  try {
    const success = await deleteTripPlan(req.params.id);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 6. Bookings API (FR-06)
// ==============================================================================
app.get('/api/bookings', async (req, res) => {
  try {
    const userId = req.query.userId;
    const bookings = await getBookings(userId);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const booking = await createBooking(req.body);
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/bookings/:id', async (req, res) => {
  try {
    const updated = await updateBooking(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Booking not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const success = await deleteBooking(req.params.id);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 7. Expenses API
// ==============================================================================
app.get('/api/expenses', async (req, res) => {
  try {
    const userId = req.query.userId;
    const expenses = await getExpenses(userId);
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const expense = await createExpense(req.body);
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const success = await deleteExpense(req.params.id);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback to index.html for SPA/root routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Supabase connection status: ${isSupabaseConfigured() ? 'Active Supabase instance' : 'Ready for Supabase credentials'}`);
});
