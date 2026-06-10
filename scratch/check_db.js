const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/opportunityradar'
});
async function run() {
  const users = await pool.query('SELECT id, name, github_id FROM users');
  console.log('Users:', users.rows);
  const profiles = await pool.query('SELECT user_id, target_role FROM career_profiles');
  console.log('Profiles:', profiles.rows);
  process.exit(0);
}
run().catch(console.error);
