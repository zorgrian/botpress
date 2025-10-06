#!/usr/bin/env node

/**
 * Script to search for similar repositories to Botpress
 * Usage: node scripts/find-similar-repos.js [search-term]
 * 
 * Example: node scripts/find-similar-repos.js "chatbot framework"
 */

const https = require('https');

const searchQueries = [
  'chatbot framework language:typescript stars:>100',
  'conversational ai platform stars:>50',
  'bot builder nlp stars:>100',
  'multi-agent framework ai stars:>50',
];

function searchGitHub(query) {
  return new Promise((resolve, reject) => {
    const encodedQuery = encodeURIComponent(query);
    const options = {
      hostname: 'api.github.com',
      path: `/search/repositories?q=${encodedQuery}&per_page=10&sort=stars&order=desc`,
      method: 'GET',
      headers: {
        'User-Agent': 'Botpress-Similar-Repos-Finder',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

function formatRepo(repo) {
  return `
  📦 ${repo.full_name}
     ⭐ ${repo.stargazers_count.toLocaleString()} stars | 🍴 ${repo.forks_count.toLocaleString()} forks
     📝 ${repo.description || 'No description'}
     🔗 ${repo.html_url}
     ${repo.language ? `💻 ${repo.language}` : ''}
     ${repo.topics && repo.topics.length > 0 ? `🏷️  ${repo.topics.slice(0, 5).join(', ')}` : ''}
  `;
}

async function main() {
  const customQuery = process.argv[2];
  const queries = customQuery ? [customQuery] : searchQueries;

  console.log('🔍 Searching for similar repositories to Botpress...\n');
  console.log('=' .repeat(80));

  for (const query of queries) {
    try {
      console.log(`\n📊 Query: "${query}"\n`);
      const result = await searchGitHub(query);
      
      if (result.items && result.items.length > 0) {
        console.log(`Found ${result.total_count} repositories (showing top ${result.items.length}):\n`);
        
        result.items.forEach((repo, index) => {
          console.log(`${index + 1}.${formatRepo(repo)}`);
        });
      } else {
        console.log('No repositories found for this query.');
      }
      
      console.log('\n' + '='.repeat(80));
      
      // Rate limiting - wait a bit between requests
      if (queries.indexOf(query) < queries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Error searching for "${query}":`, error.message);
    }
  }

  console.log('\n✨ Search complete!');
  console.log('\n💡 For more information, see SIMILAR_REPOS.md in the repository root.');
  console.log('💬 Join our Discord community: https://discord.gg/botpress\n');
}

main().catch(console.error);
