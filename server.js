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
  deleteExpense,
  getReviews,
  createReview,
  deleteReview,
  migrateAllDataToSupabase,
  getManagementSummary
} from './db.js';
import { GoogleGenAI } from '@google/genai';

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
    tables: ['users', 'destinations', 'packages', 'hotels', 'trip_plans', 'bookings', 'expenses', 'reviews'],
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

// ==============================================================================
// 8. Reviews API (FR-06 Review & Feedback System)
// ==============================================================================
app.get('/api/reviews', async (req, res) => {
  try {
    const { targetId, targetType, userId } = req.query;
    const reviews = await getReviews(targetId, targetType, userId);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const review = await createReview(req.body);
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const success = await deleteReview(req.params.id);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 9. Supabase Data Migration API
// ==============================================================================
app.post('/api/migrate', async (req, res) => {
  try {
    const result = await migrateAllDataToSupabase();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 10. AI Management Data Assistant (Gemini API)
// ==============================================================================
let genAiClient = null;
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAiClient) {
    try {
      genAiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    } catch (err) {
      console.warn('Gemini client initialization warning:', err.message);
      return null;
    }
  }
  return genAiClient;
}

// Generate rule-based analysis when API key is pending or as fallback
function generateRuleBasedAnalysis(summary, query = '', focusArea = 'Overview') {
  const o = summary.overview || {};
  const b = summary.breakdown || {};
  const bookingTypes = Object.entries(b.bookingsByType || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || 'None';
  const expenses = Object.entries(b.expensesByCategory || {}).map(([k, v]) => `${k}: ₹${v.toLocaleString()}`).join(', ') || 'None';
  const confirmationRate = o.totalBookings > 0 ? ((o.confirmedBookings / o.totalBookings) * 100).toFixed(0) : 0;
  const netMargin = o.totalRevenue > 0 ? (((o.netRevenue) / o.totalRevenue) * 100).toFixed(1) : 0;

  return `### 📊 Executive Management & Data Summary
- **Financial Performance**: Total Gross Booking Value is **₹${(o.totalRevenue || 0).toLocaleString()}** across **${o.totalBookings || 0}** reservations, with **₹${(o.totalExpenses || 0).toLocaleString()}** in tracked operating expenses, resulting in an estimated Net Operating Margin of **${netMargin}%** (₹${(o.netRevenue || 0).toLocaleString()}).
- **Booking Reliability**: Confirmation rate is currently **${confirmationRate}%** (${o.confirmedBookings || 0} Confirmed, ${o.cancelledBookings || 0} Cancelled). Distribution by inventory type: ${bookingTypes}.
- **Expense Allocation**: Primary operational spending centers around: ${expenses}.
- **Customer Sentiment & Ratings**: Average customer rating is **${o.avgRating || 0} / 5.0** across **${o.totalReviews || 0}** verified traveler reviews, indicating strong hospitality satisfaction.
- **Trip Planning Pipeline**: **${o.totalPlans || 0}** active custom itineraries created by travelers with a cumulative projected budget of **₹${(o.totalPlannedBudget || 0).toLocaleString()}**.

### 💡 Strategic Operational Recommendations
1. **Capitalize on Package Demand**: Multi-day holiday packages represent high average transaction value. Bundle popular excursions (e.g. river rafting, heritage tours) to raise average booking basket size.
2. **Mitigate Cancellation Exposure**: Implement automated email confirmations and flexible reschedule policies to maintain a >90% confirmation threshold.
3. **Expense Guardrails**: Monitor 'Activities & Sightseeing' and 'Dining' expenditures against budgeted margins to preserve the healthy ${netMargin}% operating margin.
4. **Leverage Traveler Feedback**: Highlight 5-star reviews from confirmed trips on featured destination cards to increase conversion rates across the ${o.totalDestinations || 0} available tour locations.`;
}

// GET live aggregated management data metrics
app.get('/api/ai/management-summary', async (req, res) => {
  try {
    const summary = await getManagementSummary();
    const hasAiKey = Boolean(process.env.GEMINI_API_KEY);
    res.json({
      summary,
      aiModel: 'gemini-3.6-flash',
      aiConfigured: hasAiKey,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST analyze management data with Gemini AI
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { query, focusArea } = req.body || {};
    const userPrompt = (query || '').trim() || 'Provide an executive analysis of our current travel business performance and recommendations.';
    const summary = await getManagementSummary();
    const ai = getGenAI();

    if (ai) {
      try {
        const systemPrompt = `You are a Senior Travel Management & Operations Analyst AI.
Your role is to analyze live management data from the Travel Management System (destinations, holiday packages, hotel reservations, customer bookings, expenses, trip itineraries, and customer feedback).
Provide a clear, highly professional, executive analysis with:
1. Executive Overview & Key Performance Indicators (with specific numbers).
2. Segment Analysis (Bookings, Revenue, Expense Trends, and Customer Ratings).
3. Risk or Optimization Insights (cancellations, budget variations, margin).
4. 3-4 Actionable Strategic Recommendations.

Format your response using clean Markdown with bold headers and bullet points.`;

        const dataContext = JSON.stringify(summary, null, 2);
        const fullPrompt = `Here is the current live management data of the Travel Management System:
\`\`\`json
${dataContext}
\`\`\`

User Request / Focus Area: "${focusArea || 'General Management'}"
User Question: "${userPrompt}"

Analyze this management data and provide clear, actionable business intelligence.`;

        let response;
        let activeModel = 'gemini-3.6-flash';
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: fullPrompt,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.7
            }
          });
        } catch (modelErr) {
          console.warn('gemini-3.6-flash attempt error, trying gemini-3.8-flash fallback:', modelErr.message);
          activeModel = 'gemini-3.8-flash';
          response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: fullPrompt,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.7
            }
          });
        }

        const analysisText = response.text;
        return res.json({
          success: true,
          mode: activeModel,
          analysis: analysisText,
          summary,
          timestamp: new Date().toISOString()
        });
      } catch (geminiError) {
        console.warn('Gemini API call failed, using intelligent analytics fallback:', geminiError.message);
        const fallbackText = generateRuleBasedAnalysis(summary, userPrompt, focusArea);
        return res.json({
          success: true,
          mode: 'rule-based-fallback',
          analysis: fallbackText,
          summary,
          notice: `Analysis produced via live data analytics engine (${geminiError.message})`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // If GEMINI_API_KEY is not yet configured, provide seamless intelligent analytics
    const fallbackAnalysis = generateRuleBasedAnalysis(summary, userPrompt, focusArea);
    return res.json({
      success: true,
      mode: 'management-analytics-engine',
      analysis: fallbackAnalysis,
      summary,
      notice: 'Operating with intelligent data analytics engine. Add GEMINI_API_KEY in Settings > Secrets for customized generative analysis.',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('AI Analysis endpoint error:', err);
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
