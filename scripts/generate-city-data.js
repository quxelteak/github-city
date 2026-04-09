// scripts/generate-city-data.js
// Run by GitHub Actions. Writes city-data.json to repo root.
// Requires env vars: GITHUB_TOKEN, GITHUB_USERNAME

const fs = require("fs");

const USERNAME = process.env.GITHUB_USERNAME;
const TOKEN    = process.env.GITHUB_TOKEN;

if (!USERNAME || !TOKEN) {
  console.error("Missing GITHUB_USERNAME or GITHUB_TOKEN");
  process.exit(1);
}

// ─── GraphQL query ────────────────────────────────────────────────────────────
// Fetches up to 100 repos + total commit count via defaultBranchRef history
const QUERY = `
query($login: String!, $after: String) {
  user(login: $login) {
    repositories(
      first: 100
      after: $after
      ownerAffiliations: OWNER
      isFork: false
      orderBy: { field: PUSHED_AT, direction: DESC }
    ) {
      pageInfo { hasNextPage endCursor }
      nodes {
        name
        description
        url
        stargazerCount
        primaryLanguage { name color }
        pushedAt
        isArchived
        repositoryTopics(first: 5) {
          nodes { topic { name } }
        }
        defaultBranchRef {
          target {
            ... on Commit {
              history { totalCount }
            }
          }
        }
      }
    }
  }
}`;

async function gql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

// ─── Zone classification ──────────────────────────────────────────────────────
function classifyZone(repo, commits) {
  const topics = repo.repositoryTopics.nodes.map(n => n.topic.name.toLowerCase());
  const name   = repo.name.toLowerCase();
  const desc   = (repo.description || "").toLowerCase();

  const isEvent =
    topics.some(t => ["hackathon","workshop","event","competition","challenge","advent"].includes(t)) ||
    /hackathon|devfest|advent|challenge|workshop/.test(name + " " + desc);

  const isIndustrial =
    topics.some(t => ["backend","api","microservice","infrastructure","devops","database","ml","ai"].includes(t)) ||
    /api|server|service|pipeline|infra|backend|ml|ai|bot/.test(name + " " + desc);

  if (isEvent)      return "event";
  if (commits >= 150) return "skyscraper";
  if (isIndustrial || commits >= 60) return "industrial";
  return "suburb";
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Fetching repos for @${USERNAME}…`);

  let allRepos = [];
  let after    = null;

  // Paginate through all repos (100 at a time)
  do {
    const data = await gql(QUERY, { login: USERNAME, after });
    const page = data.user.repositories;
    allRepos = allRepos.concat(page.nodes);
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);

  console.log(`  Found ${allRepos.length} repos`);

  // Build city buildings
  const buildings = allRepos
    .filter(r => !r.isArchived)
    .map(r => {
      const commits = r.defaultBranchRef?.target?.history?.totalCount ?? 0;
      const monthsAgo = (Date.now() - new Date(r.pushedAt)) / (1000 * 60 * 60 * 24 * 30);
      return {
        name:     r.name,
        desc:     r.description || "",
        url:      r.url,
        commits,
        stars:    r.stargazerCount,
        language: r.primaryLanguage?.name  ?? null,
        langColor:r.primaryLanguage?.color ?? null,
        type:     classifyZone(r, commits),
        active:   monthsAgo < 3,          // pushed within last 3 months
        topics:   r.repositoryTopics.nodes.map(n => n.topic.name),
      };
    })
    .filter(b => b.commits > 0)           // skip empty repos
    .sort((a, b) => b.commits - a.commits);

  const out = {
    user:      USERNAME,
    generated: new Date().toISOString(),
    buildings,
  };

  fs.writeFileSync("city-data.json", JSON.stringify(out, null, 2));
  console.log(`  Wrote city-data.json with ${buildings.length} buildings`);
  console.log("  Zone breakdown:");
  ["skyscraper","industrial","event","suburb"].forEach(z => {
    console.log(`    ${z}: ${buildings.filter(b=>b.type===z).length}`);
  });
}

main().catch(e => { console.error(e); process.exit(1); });
