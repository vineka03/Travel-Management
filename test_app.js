/**
 * Automated Test Suite for Travel Management System
 * Validates all Functional Requirements (FR-01 to FR-06)
 * and Supabase Database Operations
 */

import http from 'http';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const opts = { ...options };
    let body = null;
    if (postData) {
      body = typeof postData === 'string' ? postData : JSON.stringify(postData);
      opts.headers = {
        ...opts.headers,
        'Content-Type': opts.headers?.['Content-Type'] || 'application/json',
        'Content-Length': Buffer.byteLength(body)
      };
    }

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.setTimeout(25000, () => {
      req.destroy(new Error('Request timeout'));
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=====================================================');
  console.log('🧪 Starting Travel Management System Test Suite');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. System Health & Status Check
    console.log('1. Testing System Health & Supabase Status');
    const health = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET'
    });
    assert(health.status === 200 && health.data.status === 'ok', 'GET /api/health returned 200 OK');

    const statusRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/status',
      method: 'GET'
    });
    assert(statusRes.status === 200, 'GET /api/status returned 200 OK');
    assert(statusRes.data.tables.length === 8, 'Status endpoint reports all 8 SRS database tables');
    assert(statusRes.data.tables.includes('users') && statusRes.data.tables.includes('bookings'), 'Core SRS tables confirmed');

    // 2. FR-01: User Login & Account Management
    console.log('\n2. Testing FR-01: User Account Management');
    const usersRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/users',
      method: 'GET'
    });
    assert(usersRes.status === 200 && Array.isArray(usersRes.data), 'GET /api/users returns array of users');
    assert(usersRes.data.some(u => u.id === 'user1'), 'Default User1 (John Traveler) exists');

    const user1Res = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/users/user1',
      method: 'GET'
    });
    assert(user1Res.status === 200 && user1Res.data.name === 'John Traveler', 'GET /api/users/user1 retrieves profile');

    const updateProfile = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/users/user1',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { phone: '+91 98765 99999' });
    assert(updateProfile.status === 200 && updateProfile.data.phone === '+91 98765 99999', 'PUT /api/users/user1 successfully updates contact info');

    // 3. FR-02: Destination Search
    console.log('\n3. Testing FR-02: Destination Search');
    const destRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/destinations',
      method: 'GET'
    });
    assert(destRes.status === 200 && destRes.data.length >= 6, 'GET /api/destinations returns 6+ verified destinations');
    assert(destRes.data.every(d => d.name && d.category && d.price >= 0), 'All destinations conform to schema constraints');

    // 4. FR-05: Travel Packages
    console.log('\n4. Testing FR-05: Travel Packages');
    const pkgRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/packages',
      method: 'GET'
    });
    assert(pkgRes.status === 200 && pkgRes.data.length >= 4, 'GET /api/packages returns curated holiday packages');
    assert(pkgRes.data.every(p => p.title && p.duration && p.price > 0), 'Packages contain title, duration, price');

    // 5. FR-04: Hotel Search & Booking
    console.log('\n5. Testing FR-04: Hotels Search');
    const hotelRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/hotels',
      method: 'GET'
    });
    assert(hotelRes.status === 200 && hotelRes.data.length >= 4, 'GET /api/hotels returns accommodation listings');
    assert(hotelRes.data.every(h => h.name && h.city && h.price_per_night > 0), 'Hotels contain name, city, price');

    // 6. FR-03: Trip Planning
    console.log('\n6. Testing FR-03: Trip Planning');
    const createPlan = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/plans',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      user_id: 'user1',
      title: 'Automated Test Trip to Ooty',
      destination: 'Ooty, Tamil Nadu',
      travelers: 2,
      start_date: '2026-12-01',
      end_date: '2026-12-05',
      budget: 25000,
      notes: 'Test trip for automated validation'
    });
    assert(createPlan.status === 201 && createPlan.data.id, 'POST /api/plans creates a new trip plan');
    const planId = createPlan.data.id;

    const delPlan = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/plans/${planId}`,
      method: 'DELETE'
    });
    assert(delPlan.status === 200 && delPlan.data.success, 'DELETE /api/plans/:id successfully removes plan');

    // 7. FR-06: Booking Details, Update, and Cancellation
    console.log('\n7. Testing FR-06: Booking Lifecycle & Cancellation');
    const createBk = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/bookings',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      user_id: 'user1',
      type: 'Hotel',
      item_name: 'Nilgiri Pine Wood Cottages',
      dates: '2026-12-01 to 2026-12-05',
      guests: 2,
      amount: 11200,
      status: 'Confirmed',
      notes: 'Automated test booking'
    });
    assert(createBk.status === 201 && createBk.data.id, 'POST /api/bookings creates a new booking');
    const bkId = createBk.data.id;

    const updateBk = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/bookings/${bkId}`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    }, { status: 'Cancelled' });
    assert(updateBk.status === 200 && updateBk.data.status === 'Cancelled', 'PATCH /api/bookings/:id cancels booking');

    const delBk = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/bookings/${bkId}`,
      method: 'DELETE'
    });
    assert(delBk.status === 200 && delBk.data.success, 'DELETE /api/bookings/:id cleans up booking');

    // 8. Expense Tracking
    console.log('\n8. Testing Expense Tracking');
    const createEx = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/expenses',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      user_id: 'user1',
      category: 'Transit',
      description: 'Local Taxi from Airport',
      amount: 1200
    });
    assert(createEx.status === 201 && createEx.data.id, 'POST /api/expenses creates expense');

    const delEx = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/expenses/${createEx.data.id}`,
      method: 'DELETE'
    });
    assert(delEx.status === 200 && delEx.data.success, 'DELETE /api/expenses/:id removes expense');

    // 9. Reviews and Feedback System (FR-06)
    console.log('\n9. Testing Reviews & Feedback');
    const createRev = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/reviews',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      user_id: 'user1',
      target_type: 'Destination',
      target_id: 'd1',
      target_name: 'Manali & Rohtang Pass',
      rating: 5,
      comment: 'Excellent trip testing!'
    });
    assert(createRev.status === 201 && createRev.data.id, 'POST /api/reviews submits review & rating');

    const delRev = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/reviews/${createRev.data.id}`,
      method: 'DELETE'
    });
    assert(delRev.status === 200 && delRev.data.success, 'DELETE /api/reviews/:id cleans up review');

    // 10. Database Migration Endpoint
    console.log('\n10. Testing Supabase Migration Endpoint');
    const migRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/migrate',
      method: 'POST'
    });
    assert(migRes.status === 200, 'POST /api/migrate returns 200 status');
    assert(migRes.data !== undefined, 'Migration endpoint responds with detailed status report');

    // 11. AI Management Assistant Endpoints
    console.log('\n11. Testing AI Management Assistant Endpoints');
    const aiSummary = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/ai/management-summary',
      method: 'GET'
    });
    assert(aiSummary.status === 200, 'GET /api/ai/management-summary returns 200 OK');
    assert(aiSummary.data && aiSummary.data.summary && aiSummary.data.summary.overview, 'AI summary contains aggregated overview metrics');
    assert(typeof aiSummary.data.summary.overview.totalBookings === 'number', 'AI summary aggregates total bookings as a number');

    const aiAnalyze = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/ai/analyze',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      query: 'Analyze our gross booking revenue, cancellations, and margin trends.',
      focusArea: 'Revenue & Bookings'
    });
    assert(aiAnalyze.status === 200, 'POST /api/ai/analyze returns 200 OK');
    assert(aiAnalyze.data && aiAnalyze.data.success === true, 'AI analysis returns success true');
    assert(typeof aiAnalyze.data.analysis === 'string' && aiAnalyze.data.analysis.length > 50, 'AI analysis returns rich structured text');
    assert(aiAnalyze.data.mode !== undefined, `AI analysis executed with mode: ${aiAnalyze.data?.mode}`);

    // 12. Testing Progressive Web App (PWA) Standards & Assets
    console.log('\n12. Testing Progressive Web App (PWA) Compliance');
    const manifestRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/manifest.json',
      method: 'GET'
    });
    assert(manifestRes.status === 200, 'GET /manifest.json returns 200 OK');
    assert(manifestRes.headers['content-type'] && manifestRes.headers['content-type'].includes('application/manifest+json'), 'Manifest served with application/manifest+json content-type');
    assert(manifestRes.data && manifestRes.data.display === 'standalone', 'Manifest specifies display: standalone');
    assert(manifestRes.data && manifestRes.data.start_url === '/', 'Manifest specifies start_url: /');
    assert(Array.isArray(manifestRes.data?.icons) && manifestRes.data.icons.length >= 3, 'Manifest includes complete set of responsive icons');

    const swRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/sw.js',
      method: 'GET'
    });
    assert(swRes.status === 200, 'GET /sw.js returns 200 OK');
    assert(swRes.headers['content-type'] && swRes.headers['content-type'].includes('javascript'), 'Service worker served with javascript content-type');
    assert(swRes.headers['service-worker-allowed'] === '/', 'Service worker specifies Service-Worker-Allowed: /');

    const offlineRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/offline.html',
      method: 'GET'
    });
    assert(offlineRes.status === 200, 'GET /offline.html returns 200 OK');

    const icon192 = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/pwa-192x192.png',
      method: 'GET'
    });
    assert(icon192.status === 200, 'GET /pwa-192x192.png returns 200 OK');

    const icon512 = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/pwa-512x512.png',
      method: 'GET'
    });
    assert(icon512.status === 200, 'GET /pwa-512x512.png returns 200 OK');

    const iconSvg = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/icon.svg',
      method: 'GET'
    });
    assert(iconSvg.status === 200, 'GET /icon.svg returns 200 OK');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n=====================================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
