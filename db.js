import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Lazy Supabase client holder
let supabaseClient = null;

// Initial Fallback / Seed Data in case credentials are not yet set
const memoryStore = {
  users: [
    { id: 'user1', name: 'John Traveler', email: 'john.traveler@example.com', phone: '+91 98765 43210', travel_preference: 'Hill Stations & Nature' },
    { id: 'user2', name: 'Sarah Explorer', email: 'sarah.explorer@example.com', phone: '+91 98765 11223', travel_preference: 'Beach & Water Sports' }
  ],
  destinations: [
    { id: 'd1', name: 'Manali & Rohtang Pass', category: 'Hill Station', state: 'Himachal Pradesh', price: 12000, duration: '4 Days / 3 Nights', rating: 4.8, image_url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=700&q=80', description: 'Snow-capped peaks, scenic Solang valley adventure sports, and river rafting.' },
    { id: 'd2', name: 'Goa Golden Beaches', category: 'Beach', state: 'Goa', price: 9500, duration: '3 Days / 2 Nights', rating: 4.7, image_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=700&q=80', description: 'Sun-kissed sands of Calangute, vibrant beach shacks, water sports, and sunset cruises.' },
    { id: 'd3', name: 'Jaipur & Udaipur Royal Tour', category: 'Heritage', state: 'Rajasthan', price: 15000, duration: '5 Days / 4 Nights', rating: 4.9, image_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=700&q=80', description: 'Majestic Amber fort, City Palace, romantic Lake Pichola, and royal Rajasthani culture.' },
    { id: 'd4', name: 'Ooty & Nilgiri Hills', category: 'Hill Station', state: 'Tamil Nadu', price: 8000, duration: '3 Days / 2 Nights', rating: 4.6, image_url: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=700&q=80', description: 'Lush tea plantations, Botanical gardens, toy train journey, and cool mountain breezes.' },
    { id: 'd5', name: 'Munnar & Alleppey Backwaters', category: 'Hill Station', state: 'Kerala', price: 14000, duration: '4 Days / 3 Nights', rating: 4.9, image_url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=700&q=80', description: 'Tranquil houseboat cruising along backwaters, sprawling tea estates, and spice gardens.' },
    { id: 'd6', name: 'Dubai Skyline & Desert Safari', category: 'City', state: 'International', price: 38000, duration: '5 Days / 4 Nights', rating: 4.8, image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=700&q=80', description: 'Burj Khalifa views, Desert Dune Bashing safari, Marina Yacht cruise, and shopping festivals.' }
  ],
  packages: [
    { id: 'pkg1', title: 'Himalayan Adventure Escape', duration: '6 Days / 5 Nights', price: 18500, rating: 4.9, discount: '20% OFF', image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=700&q=80', inclusions: ['4-Star Mountain Resort', 'All Breakfasts & Dinners', 'River Rafting & Trek Guide', 'Private Cab Transfers'] },
    { id: 'pkg2', title: 'Romantic Kerala Houseboat Special', duration: '5 Days / 4 Nights', price: 21000, rating: 4.9, discount: '15% OFF', image_url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=700&q=80', inclusions: ['Private AC Deluxe Houseboat', 'Traditional Kerala Meals', 'Munnar Tea Tour', 'Kochi Airport Transfers'] },
    { id: 'pkg3', title: 'Goa Weekend Party & Relaxation', duration: '4 Days / 3 Nights', price: 12500, rating: 4.7, discount: '10% OFF', image_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=700&q=80', inclusions: ['Beachside Resort Stay', 'Complimentary Buffet Breakfast', 'Scuba Diving & Jet Ski', 'Scooter Rental Included'] },
    { id: 'pkg4', title: 'Golden Triangle Heritage Grandeur', duration: '7 Days / 6 Nights', price: 28000, rating: 4.8, discount: '25% OFF', image_url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=700&q=80', inclusions: ['Delhi, Agra & Jaipur 5-Star Stays', 'Taj Mahal & Fort Entry Passes', 'Heritage Expert Guide', 'Chauffeured AC Sedan'] }
  ],
  hotels: [
    { id: 'h1', name: 'Grand Himalayan Resort & Spa', city: 'Manali', type: '5-Star', rating: 4.9, price_per_night: 4500, image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=700&q=80', amenities: 'Free WiFi • Mountain View • Heated Pool • Breakfast' },
    { id: 'h2', name: 'Goa Palms Beachfront Resort', city: 'Goa', type: 'Resort', rating: 4.7, price_per_night: 3800, image_url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=700&q=80', amenities: 'Private Beach Access • Infinity Pool • Cocktail Bar' },
    { id: 'h3', name: 'Udaipur Lake Palace View Hotel', city: 'Udaipur', type: '4-Star', rating: 4.8, price_per_night: 5200, image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=700&q=80', amenities: 'Rooftop Lake Dining • Heritage Architecture • Spa' },
    { id: 'h4', name: 'Nilgiri Pine Wood Cottages', city: 'Ooty', type: '4-Star', rating: 4.6, price_per_night: 2800, image_url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=700&q=80', amenities: 'Campfire • Tea Garden Walk • Cozy Fireplace' }
  ],
  trip_plans: [
    {
      id: 'PL-1',
      user_id: 'user1',
      title: 'Autumn in Manali',
      destination: 'Manali, HP',
      travelers: 2,
      start_date: '2026-10-05',
      end_date: '2026-10-10',
      budget: 45000,
      notes: 'Visit Solang valley for paragliding, hot springs in Vashisht, Old Manali cafe hopping.'
    }
  ],
  bookings: [
    {
      id: 'BK-1001',
      user_id: 'user1',
      type: 'Package',
      item_name: 'Himalayan Adventure Escape',
      dates: '2026-10-05 to 2026-10-10',
      guests: 2,
      amount: 37000,
      status: 'Confirmed',
      notes: 'Window seat preferred'
    },
    {
      id: 'BK-1002',
      user_id: 'user2',
      type: 'Hotel',
      item_name: 'Goa Palms Beachfront Resort',
      dates: '2026-11-12 to 2026-11-15',
      guests: 2,
      amount: 11400,
      status: 'Confirmed',
      notes: 'Sea view room requested'
    }
  ],
  expenses: [
    { id: 'ex1', user_id: 'user1', category: 'Activities & Sightseeing', description: 'Solang Valley Rafting Pass', amount: 2400 },
    { id: 'ex2', user_id: 'user1', category: 'Food & Dining', description: 'Cafe 1947 Riverside Dinner', amount: 1650 }
  ]
};

/**
 * Lazy initialize Supabase Client
 */
export function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, key, {
        auth: { persistSession: false }
      });
      console.log('Connected to Supabase PostgreSQL at:', url);
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseClient;
}

export function isSupabaseConfigured() {
  const client = getSupabase();
  return client !== null;
}

// ==============================================================================
// 1. Users Operations (FR-01)
// ==============================================================================
export async function getUsers() {
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client.from('users').select('*').order('id');
      if (!error && data && data.length > 0) return data;
      if (error) console.warn('Supabase getUsers warning:', error.message);
    } catch (err) {
      console.warn('Supabase getUsers error:', err.message);
    }
  }
  return memoryStore.users;
}

export async function getUserById(id) {
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client.from('users').select('*').eq('id', id).single();
      if (!error && data) return data;
      if (error) console.warn('Supabase getUserById warning:', error.message);
    } catch (err) {
      console.warn('Supabase getUserById error:', err.message);
    }
  }
  return memoryStore.users.find(u => u.id === id) || null;
}

export async function updateUser(id, updates) {
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('users')
        .upsert({ id, ...updates })
        .select()
        .single();
      if (!error && data) return data;
      if (error) console.warn('Supabase updateUser warning:', error.message);
    } catch (err) {
      console.warn('Supabase updateUser error:', err.message);
    }
  }

  const idx = memoryStore.users.findIndex(u => u.id === id);
  if (idx !== -1) {
    memoryStore.users[idx] = { ...memoryStore.users[idx], ...updates };
    return memoryStore.users[idx];
  } else {
    const newUser = { id, ...updates };
    memoryStore.users.push(newUser);
    return newUser;
  }
}

// ==============================================================================
// 2. Destinations Operations (FR-02)
// ==============================================================================
export async function getDestinations() {
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client.from('destinations').select('*').order('id');
      if (!error && data && data.length > 0) return data;
      if (error) console.warn('Supabase getDestinations warning:', error.message);
    } catch (err) {
      console.warn('Supabase getDestinations error:', err.message);
    }
  }
  return memoryStore.destinations;
}

// ==============================================================================
// 3. Packages Operations (FR-05)
// ==============================================================================
export async function getPackages() {
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client.from('packages').select('*').order('id');
      if (!error && data && data.length > 0) return data;
      if (error) console.warn('Supabase getPackages warning:', error.message);
    } catch (err) {
      console.warn('Supabase getPackages error:', err.message);
    }
  }
  return memoryStore.packages;
}

// ==============================================================================
// 4. Hotels Operations (FR-04)
// ==============================================================================
export async function getHotels() {
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client.from('hotels').select('*').order('id');
      if (!error && data && data.length > 0) return data;
      if (error) console.warn('Supabase getHotels warning:', error.message);
    } catch (err) {
      console.warn('Supabase getHotels error:', err.message);
    }
  }
  return memoryStore.hotels;
}

// ==============================================================================
// 5. Trip Plans Operations (FR-03)
// ==============================================================================
export async function getTripPlans(userId) {
  const client = getSupabase();
  if (client) {
    try {
      let query = client.from('trip_plans').select('*').order('created_at', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (!error && data) return data;
      if (error) console.warn('Supabase getTripPlans warning:', error.message);
    } catch (err) {
      console.warn('Supabase getTripPlans error:', err.message);
    }
  }
  if (userId) {
    return memoryStore.trip_plans.filter(p => p.user_id === userId);
  }
  return memoryStore.trip_plans;
}

export async function createTripPlan(plan) {
  const newPlan = {
    id: plan.id || 'PL-' + Date.now().toString(36).toUpperCase(),
    user_id: plan.user_id,
    title: plan.title,
    destination: plan.destination,
    travelers: Number(plan.travelers) || 1,
    start_date: plan.start_date,
    end_date: plan.end_date,
    budget: Number(plan.budget) || 0,
    notes: plan.notes || ''
  };

  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client.from('trip_plans').insert([newPlan]).select().single();
      if (!error && data) return data;
      if (error) console.warn('Supabase createTripPlan warning:', error.message);
    } catch (err) {
      console.warn('Supabase createTripPlan error:', err.message);
    }
  }

  memoryStore.trip_plans.unshift(newPlan);
  return newPlan;
}

export async function deleteTripPlan(id) {
  const client = getSupabase();
  if (client) {
    try {
      const { error } = await client.from('trip_plans').delete().eq('id', id);
      if (!error) return true;
      if (error) console.warn('Supabase deleteTripPlan warning:', error.message);
    } catch (err) {
      console.warn('Supabase deleteTripPlan error:', err.message);
    }
  }
  const idx = memoryStore.trip_plans.findIndex(p => p.id === id);
  if (idx !== -1) {
    memoryStore.trip_plans.splice(idx, 1);
    return true;
  }
  return false;
}

// ==============================================================================
// 6. Bookings Operations (FR-06)
// ==============================================================================
export async function getBookings(userId) {
  const client = getSupabase();
  if (client) {
    try {
      let query = client.from('bookings').select('*').order('created_at', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (!error && data) return data;
      if (error) console.warn('Supabase getBookings warning:', error.message);
    } catch (err) {
      console.warn('Supabase getBookings error:', err.message);
    }
  }
  if (userId) {
    return memoryStore.bookings.filter(b => b.user_id === userId);
  }
  return memoryStore.bookings;
}

export async function createBooking(booking) {
  const newBooking = {
    id: booking.id || 'BK-' + Math.floor(1000 + Math.random() * 9000),
    user_id: booking.user_id,
    type: booking.type,
    item_name: booking.item_name,
    dates: booking.dates,
    guests: Number(booking.guests) || 1,
    amount: Number(booking.amount) || 0,
    status: booking.status || 'Confirmed',
    notes: booking.notes || ''
  };

  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client.from('bookings').insert([newBooking]).select().single();
      if (!error && data) return data;
      if (error) console.warn('Supabase createBooking warning:', error.message);
    } catch (err) {
      console.warn('Supabase createBooking error:', err.message);
    }
  }

  memoryStore.bookings.unshift(newBooking);
  return newBooking;
}

export async function updateBooking(id, updates) {
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client.from('bookings').update(updates).eq('id', id).select().single();
      if (!error && data) return data;
      if (error) console.warn('Supabase updateBooking warning:', error.message);
    } catch (err) {
      console.warn('Supabase updateBooking error:', err.message);
    }
  }

  const idx = memoryStore.bookings.findIndex(b => b.id === id);
  if (idx !== -1) {
    memoryStore.bookings[idx] = { ...memoryStore.bookings[idx], ...updates };
    return memoryStore.bookings[idx];
  }
  return null;
}

export async function deleteBooking(id) {
  const client = getSupabase();
  if (client) {
    try {
      const { error } = await client.from('bookings').delete().eq('id', id);
      if (!error) return true;
      if (error) console.warn('Supabase deleteBooking warning:', error.message);
    } catch (err) {
      console.warn('Supabase deleteBooking error:', err.message);
    }
  }

  const idx = memoryStore.bookings.findIndex(b => b.id === id);
  if (idx !== -1) {
    memoryStore.bookings.splice(idx, 1);
    return true;
  }
  return false;
}

// ==============================================================================
// 7. Expenses Operations
// ==============================================================================
export async function getExpenses(userId) {
  const client = getSupabase();
  if (client) {
    try {
      let query = client.from('expenses').select('*').order('created_at', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (!error && data) return data;
      if (error) console.warn('Supabase getExpenses warning:', error.message);
    } catch (err) {
      console.warn('Supabase getExpenses error:', err.message);
    }
  }
  if (userId) {
    return memoryStore.expenses.filter(e => e.user_id === userId);
  }
  return memoryStore.expenses;
}

export async function createExpense(expense) {
  const newExpense = {
    id: expense.id || 'ex-' + Date.now().toString(36),
    user_id: expense.user_id,
    category: expense.category,
    description: expense.description,
    amount: Number(expense.amount) || 0
  };

  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client.from('expenses').insert([newExpense]).select().single();
      if (!error && data) return data;
      if (error) console.warn('Supabase createExpense warning:', error.message);
    } catch (err) {
      console.warn('Supabase createExpense error:', err.message);
    }
  }

  memoryStore.expenses.unshift(newExpense);
  return newExpense;
}

export async function deleteExpense(id) {
  const client = getSupabase();
  if (client) {
    try {
      const { error } = await client.from('expenses').delete().eq('id', id);
      if (!error) return true;
      if (error) console.warn('Supabase deleteExpense warning:', error.message);
    } catch (err) {
      console.warn('Supabase deleteExpense error:', err.message);
    }
  }
  const idx = memoryStore.expenses.findIndex(e => e.id === id);
  if (idx !== -1) {
    memoryStore.expenses.splice(idx, 1);
    return true;
  }
  return false;
}
