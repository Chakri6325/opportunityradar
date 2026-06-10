const http = require('http');
const jwt = require('jsonwebtoken');

const secret = 'dev_secret_key_change_in_production';
const testUserId = '6c703fb2-dea4-4902-88d4-dd1f16769b46';
const testUserEmail = 'cb.sc.u4cse23625@cb.students.amrita.edu';
const token = jwt.sign(
  { userId: testUserId, email: testUserEmail },
  secret,
  { expiresIn: '1h' }
);

console.log('🛡️ Starting Complete System End-to-End Verification...');
console.log('🔑 JWT token generated successfully.');

function request(method, path, body = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({
            path: `${method} ${path}`,
            statusCode: res.statusCode,
            data: JSON.parse(responseBody),
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (e) {
          resolve({
            path: `${method} ${path}`,
            statusCode: res.statusCode,
            data: responseBody,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        path: `${method} ${path}`,
        statusCode: 500,
        data: err.message,
        success: false
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  const tests = [];

  // 1. Health check
  console.log('📡 Testing Health Check...');
  tests.push(await request('GET', '/health'));

  // 2. Onboarding Status
  console.log('📡 Testing Onboarding Status...');
  tests.push(await request('GET', '/api/onboarding/status'));

  // 3. Sync Work IQ
  console.log('📡 Testing Microsoft Work IQ sync...');
  tests.push(await request('GET', '/api/onboarding/sync-workiq'));

  // 4. Opportunities List
  console.log('📡 Testing Opportunities Fetch...');
  tests.push(await request('GET', '/api/opportunities'));

  // 5. Matches List
  console.log('📡 Testing Matches Fetch...');
  tests.push(await request('GET', '/api/matches'));

  // 6. User Profile
  console.log('📡 Testing Profile Fetch...');
  tests.push(await request('GET', '/api/auth/profile'));

  // 7. Career Roadmap
  console.log('📡 Testing Career Roadmap...');
  tests.push(await request('GET', '/api/profile/roadmap'));

  // 8. Applications List
  console.log('📡 Testing Applications Fetch...');
  tests.push(await request('GET', '/api/applications'));

  // 9. Add Opportunity
  console.log('📡 Testing Add Custom Opportunity...');
  const newOpp = {
    title: 'Verify Endpoint Hackathon 2026',
    type: 'hackathon',
    company_name: 'Antigravity Verification Inc',
    location: 'Remote',
    required_skills: ['Node.js', 'PostgreSQL', 'Docker'],
    difficulty_level: 'intermediate',
    source_url: 'https://verify.antigravity.dev',
    description: 'A mock hackathon created during verification check.'
  };
  const oppResponse = await request('POST', '/api/opportunities', newOpp);
  tests.push(oppResponse);

  // 10. Track Application
  if (oppResponse.success && oppResponse.data && oppResponse.data.id) {
    console.log('📡 Testing Track Application on Created Opportunity...');
    tests.push(await request('POST', '/api/applications', {
      opportunity_id: oppResponse.data.id,
      status: 'interested'
    }));
  } else {
    console.log('⚠️ Skipping track application test due to opportunity creation failure.');
  }

  // 11. Run Sync Collector Agents (Note: HNRSS feeds might take some time)
  console.log('📡 Testing 5 Source Collector Agents sync-agents route (this calls RemoteOK, Arbeitnow, Codeforces)...');
  tests.push(await request('POST', '/api/opportunities/sync-agents'));

  // 12. Regenerate AI Matches
  console.log('📡 Testing Refresh AI Matches Route (OpenAI evaluation)...');
  tests.push(await request('POST', '/api/matches/regenerate'));

  console.log('\n==================================================');
  console.log('📊 VERIFICATION REPORT SUMMARY:');
  console.log('==================================================');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    if (test.success) {
      console.log(`✅ [PASS] ${test.path} - Code: ${test.statusCode}`);
      passed++;
    } else {
      console.log(`❌ [FAIL] ${test.path} - Code: ${test.statusCode}`);
      console.log('   Error Detail:', typeof test.data === 'object' ? JSON.stringify(test.data) : test.data);
      failed++;
    }
  }

  console.log('\n==================================================');
  console.log(`🏁 Verification finished: ${passed} Passed, ${failed} Failed.`);
  console.log('==================================================');

  process.exit(failed > 0 ? 1 : 0);
}

run();
