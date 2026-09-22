# Travel Management System

A full-stack Travel Management System built with Node.js, Express, and Supabase PostgreSQL, strictly adhering to the Software Requirements Specification (`srs.md`).

## Core Functional Modules (srs.md)
1. **FR-01: User Login & Account Management**: Multi-user session switcher (`user1` - John Traveler, `user2` - Sarah Explorer), profile management, contact details, and travel preferences.
2. **FR-02: Destination Search & Filtering**: Multi-category destination browsing (Hill Stations, Beaches, Heritage, Wildlife, Deserts) with pricing, duration, and ratings.
3. **FR-03: Trip Planning**: Customizable day-by-day travel itineraries with traveler counts, calendar dates, budget tracking, and notes.
4. **FR-04: Hotel Search & Booking**: Hotel listings, pricing per night, star ratings, and amenities.
5. **FR-05: Travel Packages**: Curated holiday packages with inclusions, discounts, and duration.
6. **FR-06: Booking Details & Reviews**: Reservation confirmation, status tracking, cancellations, and feedback/ratings.
7. **Expense Tracker**: Real-time travel budget calculator, expense categorizer, and ledger.

## Supabase PostgreSQL Database Architecture

The system is configured with 8 PostgreSQL tables matching the SRS requirements:
- `users`: User profiles, credentials, and preferences.
- `destinations`: Tourist destinations, categories, durations, and pricing.
- `packages`: Curated travel packages and inclusions.
- `hotels`: Accommodation listings, ratings, and rates per night.
- `trip_plans`: Custom user itineraries and planned budgets.
- `bookings`: Reservations, traveler counts, amounts, and statuses.
- `expenses`: Category-based expense ledger.
- `reviews`: Traveler feedback, ratings, and comments.

## Setup & Migration Instructions

### 1. Database Provisioning
Run the SQL script in your Supabase SQL Editor:
```bash
# Execute the schema definitions, RLS policies, and seed data
cat supabase_schema.sql
```

### 2. Environment Variables
Configure your Supabase credentials in your environment or `.env` file (refer to `.env.example`):
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-service-role-or-anon-key
```

### 3. Migrate Data
To migrate all existing data without loss into your live Supabase instance:
```bash
npm run migrate
# or
node migrate_to_supabase.js
```

### 4. Running the Tests
Execute the automated test suite (25 tests covering FR-01 through FR-06 and Supabase APIs):
```bash
npm test
```

### 5. Companion Projects in Repository
- `waffel.html`: Waffle World Management System
- `cake.html`: Sweet Dream Cake Shop
