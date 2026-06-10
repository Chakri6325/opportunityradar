const https = require('https');

function getRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          if (url.endsWith('.json') || res.headers['content-type']?.includes('application/json')) {
            resolve(JSON.parse(data));
          } else {
            resolve(data);
          }
        } catch (e) {
          resolve(data); // Return raw text if not JSON
        }
      });
    }).on('error', reject);
  });
}

// Simple XML parser to extract items from RSS
function parseRSS(xml) {
  const items = [];
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const itemXml of itemMatches) {
    const title = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ||
                  itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1] || 'Opportunity';
    const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '';
    const description = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
                        itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '';
    items.push({ title, link, description });
  }
  return items;
}

async function run() {
  console.log('--- Testing Competitions (Codeforces API) ---');
  try {
    const cfData = await getRequest('https://codeforces.com/api/contest.list');
    if (cfData && cfData.status === 'OK') {
      const upcoming = cfData.result.filter(c => c.phase === 'BEFORE').slice(0, 5);
      console.log(`Found ${upcoming.length} upcoming Codeforces contests:`);
      upcoming.forEach(c => {
        const date = new Date(c.startTimeSeconds * 1000).toLocaleString();
        console.log(`- ${c.name} | Starts: ${date} | Link: https://codeforces.com/contests/${c.id}`);
      });
    }
  } catch (err) {
    console.error('Codeforces API failed:', err.message);
  }

  console.log('\n--- Testing Hackathons (HNRSS Query) ---');
  try {
    const xml = await getRequest('https://hnrss.org/newest?q=hackathon');
    const items = parseRSS(xml).slice(0, 3);
    console.log(`Found ${items.length} hackathon posts:`);
    items.forEach(i => console.log(`- ${i.title} => Link: ${i.link}`));
  } catch (err) {
    console.error('Hackathon RSS failed:', err.message);
  }

  console.log('\n--- Testing Scholarships (HNRSS Query) ---');
  try {
    const xml = await getRequest('https://hnrss.org/newest?q=scholarship');
    const items = parseRSS(xml).slice(0, 3);
    console.log(`Found ${items.length} scholarship posts:`);
    items.forEach(i => console.log(`- ${i.title} => Link: ${i.link}`));
  } catch (err) {
    console.error('Scholarship RSS failed:', err.message);
  }

  console.log('\n--- Testing Research (HNRSS Query) ---');
  try {
    const xml = await getRequest('https://hnrss.org/newest?q=research+internship');
    const items = parseRSS(xml).slice(0, 3);
    console.log(`Found ${items.length} research posts:`);
    items.forEach(i => console.log(`- ${i.title} => Link: ${i.link}`));
  } catch (err) {
    console.error('Research RSS failed:', err.message);
  }
}

run();
