-- ==============================================================================
-- Supabase PostgreSQL Schema for Travel Management System
-- Source of Truth: srs.md (Functional Requirements FR-01 through FR-06)
-- Generated for vineka03/Travel-Management
-- ==============================================================================

-- 1. Users Table (FR-01: User Login and Profile Management)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    travel_preference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Destinations Table (FR-02: Destination Search)
CREATE TABLE IF NOT EXISTS destinations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    state TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    duration TEXT NOT NULL,
    rating NUMERIC(3, 1) DEFAULT 4.5 CHECK (rating >= 0 AND rating <= 5),
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Packages Table (FR-05: Travel Package)
CREATE TABLE IF NOT EXISTS packages (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    duration TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    rating NUMERIC(3, 1) DEFAULT 4.8 CHECK (rating >= 0 AND rating <= 5),
    discount TEXT,
    image_url TEXT,
    inclusions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Hotels Table (FR-04: Hotel Booking)
CREATE TABLE IF NOT EXISTS hotels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    type TEXT NOT NULL,
    rating NUMERIC(3, 1) DEFAULT 4.5 CHECK (rating >= 0 AND rating <= 5),
    price_per_night INTEGER NOT NULL CHECK (price_per_night >= 0),
    image_url TEXT,
    amenities TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Trip Plans Table (FR-03: Trip Planning / Itinerary Planner)
CREATE TABLE IF NOT EXISTS trip_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    travelers INTEGER DEFAULT 1 CHECK (travelers > 0),
    start_date DATE,
    end_date DATE,
    budget INTEGER DEFAULT 0 CHECK (budget >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bookings Table (FR-06: Booking Details / Reservation)
CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    item_name TEXT NOT NULL,
    dates TEXT NOT NULL,
    guests INTEGER DEFAULT 1 CHECK (guests > 0),
    amount INTEGER NOT NULL CHECK (amount >= 0),
    status TEXT DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Cancelled', 'Pending', 'Completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Expenses Table (Expense Tracker)
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Reviews Table (FR-06: Review and Feedback System)
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL,
    target_id TEXT,
    target_name TEXT NOT NULL,
    rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Performance Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_trip_plans_user_id ON trip_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_destinations_category ON destinations(category);
CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(city);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read & write access for application backend/client operations
CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public write users" ON users FOR ALL USING (true);

CREATE POLICY "Allow public read destinations" ON destinations FOR SELECT USING (true);
CREATE POLICY "Allow public write destinations" ON destinations FOR ALL USING (true);

CREATE POLICY "Allow public read packages" ON packages FOR SELECT USING (true);
CREATE POLICY "Allow public write packages" ON packages FOR ALL USING (true);

CREATE POLICY "Allow public read hotels" ON hotels FOR SELECT USING (true);
CREATE POLICY "Allow public write hotels" ON hotels FOR ALL USING (true);

CREATE POLICY "Allow public read trip_plans" ON trip_plans FOR SELECT USING (true);
CREATE POLICY "Allow public write trip_plans" ON trip_plans FOR ALL USING (true);

CREATE POLICY "Allow public read bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Allow public write bookings" ON bookings FOR ALL USING (true);

CREATE POLICY "Allow public read expenses" ON expenses FOR SELECT USING (true);
CREATE POLICY "Allow public write expenses" ON expenses FOR ALL USING (true);

CREATE POLICY "Allow public read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Allow public write reviews" ON reviews FOR ALL USING (true);

-- ==============================================================================
-- Seed Initial Records (Preserve Existing Data)
-- ==============================================================================

-- 1. Users (FR-01)
INSERT INTO users (id, name, email, phone, travel_preference) VALUES
('user1', 'John Traveler', 'john.traveler@example.com', '+91 98765 43210', 'Hill Stations & Nature'),
('user2', 'Sarah Explorer', 'sarah.explorer@example.com', '+91 98765 11223', 'Beach & Water Sports')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  travel_preference = EXCLUDED.travel_preference;

-- 2. Destinations (FR-02)
INSERT INTO destinations (id, name, category, state, price, duration, rating, image_url, description) VALUES
('d1', 'Manali & Rohtang Pass', 'Hill Station', 'Himachal Pradesh', 12000, '4 Days / 3 Nights', 4.8, 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=700&q=80', 'Snow-capped peaks, scenic Solang valley adventure sports, and river rafting.'),
('d2', 'Goa Golden Beaches', 'Beach', 'Goa', 9500, '3 Days / 2 Nights', 4.7, 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=700&q=80', 'Sun-kissed sands of Calangute, vibrant beach shacks, water sports, and sunset cruises.'),
('d3', 'Jaipur & Udaipur Royal Tour', 'Heritage', 'Rajasthan', 15000, '5 Days / 4 Nights', 4.9, 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=700&q=80', 'Majestic Amber fort, City Palace, romantic Lake Pichola, and royal Rajasthani culture.'),
('d4', 'Ooty & Nilgiri Hills', 'Hill Station', 'Tamil Nadu', 8000, '3 Days / 2 Nights', 4.6, 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=700&q=80', 'Lush tea plantations, Botanical gardens, toy train journey, and cool mountain breezes.'),
('d5', 'Munnar & Alleppey Backwaters', 'Hill Station', 'Kerala', 14000, '4 Days / 3 Nights', 4.9, 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=700&q=80', 'Tranquil houseboat cruising along backwaters, sprawling tea estates, and spice gardens.'),
('d6', 'Dubai Skyline & Desert Safari', 'City', 'International', 38000, '5 Days / 4 Nights', 4.8, 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=700&q=80', 'Burj Khalifa views, Desert Dune Bashing safari, Marina Yacht cruise, and shopping festivals.')
ON CONFLICT (id) DO NOTHING;

-- 3. Packages (FR-05)
INSERT INTO packages (id, title, duration, price, rating, discount, image_url, inclusions) VALUES
('pkg1', 'Himalayan Adventure Escape', '6 Days / 5 Nights', 18500, 4.9, '20% OFF', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=700&q=80', '["4-Star Mountain Resort", "All Breakfasts & Dinners", "River Rafting & Trek Guide", "Private Cab Transfers"]'::jsonb),
('pkg2', 'Romantic Kerala Houseboat Special', '5 Days / 4 Nights', 21000, 4.9, '15% OFF', 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=700&q=80', '["Private AC Deluxe Houseboat", "Traditional Kerala Meals", "Munnar Tea Tour", "Kochi Airport Transfers"]'::jsonb),
('pkg3', 'Goa Weekend Party & Relaxation', '4 Days / 3 Nights', 12500, 4.7, '10% OFF', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=700&q=80', '["Beachside Resort Stay", "Complimentary Buffet Breakfast", "Scuba Diving & Jet Ski", "Scooter Rental Included"]'::jsonb),
('pkg4', 'Golden Triangle Heritage Grandeur', '7 Days / 6 Nights', 28000, 4.8, '25% OFF', 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=700&q=80', '["Delhi, Agra & Jaipur 5-Star Stays", "Taj Mahal & Fort Entry Passes", "Heritage Expert Guide", "Chauffeured AC Sedan"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 4. Hotels (FR-04)
INSERT INTO hotels (id, name, city, type, rating, price_per_night, image_url, amenities) VALUES
('h1', 'Grand Himalayan Resort & Spa', 'Manali', '5-Star', 4.9, 4500, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=700&q=80', 'Free WiFi • Mountain View • Heated Pool • Breakfast'),
('h2', 'Goa Palms Beachfront Resort', 'Goa', 'Resort', 4.7, 3800, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=700&q=80', 'Private Beach Access • Infinity Pool • Cocktail Bar'),
('h3', 'Udaipur Lake Palace View Hotel', 'Udaipur', '4-Star', 4.8, 5200, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=700&q=80', 'Rooftop Lake Dining • Heritage Architecture • Spa'),
('h4', 'Nilgiri Pine Wood Cottages', 'Ooty', '4-Star', 4.6, 2800, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=700&q=80', 'Campfire • Tea Garden Walk • Cozy Fireplace')
ON CONFLICT (id) DO NOTHING;

-- 5. Trip Plans (FR-03)
INSERT INTO trip_plans (id, user_id, title, destination, travelers, start_date, end_date, budget, notes) VALUES
('PL-1', 'user1', 'Autumn in Manali', 'Manali, HP', 2, '2026-10-05', '2026-10-10', 45000, 'Visit Solang valley for paragliding, hot springs in Vashisht, Old Manali cafe hopping.')
ON CONFLICT (id) DO NOTHING;

-- 6. Bookings (FR-06)
INSERT INTO bookings (id, user_id, type, item_name, dates, guests, amount, status, notes) VALUES
('BK-1001', 'user1', 'Package', 'Himalayan Adventure Escape', '2026-10-05 to 2026-10-10', 2, 37000, 'Confirmed', 'Window seat preferred'),
('BK-1002', 'user2', 'Hotel', 'Goa Palms Beachfront Resort', '2026-11-12 to 2026-11-15', 2, 11400, 'Confirmed', 'Sea view room requested')
ON CONFLICT (id) DO NOTHING;

-- 7. Expenses
INSERT INTO expenses (id, user_id, category, description, amount) VALUES
('ex1', 'user1', 'Activities & Sightseeing', 'Solang Valley Rafting Pass', 2400),
('ex2', 'user1', 'Food & Dining', 'Cafe 1947 Riverside Dinner', 1650)
ON CONFLICT (id) DO NOTHING;

-- 8. Reviews
INSERT INTO reviews (id, user_id, target_type, target_id, target_name, rating, comment) VALUES
('rev-1', 'user1', 'Package', 'pkg1', 'Himalayan Adventure Escape', 5.0, 'Incredible experience! The river rafting and luxury resort stay were phenomenal.'),
('rev-2', 'user2', 'Hotel', 'h2', 'Goa Palms Beachfront Resort', 4.8, 'Direct beach access was breathtaking. Excellent staff hospitality.')
ON CONFLICT (id) DO NOTHING;
