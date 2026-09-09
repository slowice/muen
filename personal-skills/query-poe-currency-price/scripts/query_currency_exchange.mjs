#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const USAGE = `Usage:
  node query_currency_exchange.mjs --metadata-id <Metadata/Items/...> [options]

Options:
  --league <name>          League name (default: Standard)
  --hours <1-168>          Number of completed hours to query (default: 1)
  --realm <pc|xbox|sony|poe2>  Realm (default: pc)
  --end-change-id <unix>   Last hourly Unix timestamp to query
  --output <path>          Save JSON result to this path
  --help                   Show this help
`;

function parseArgs(argv) {
  const options = {
    league: 'Standard',
    hours: 1,
    realm: 'pc',
    metadataId: '',
    endChangeId: null,
    output: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help') {
      options.help = true;
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${arg}`);
    }
    if (arg === '--metadata-id') options.metadataId = value;
    else if (arg === '--league') options.league = value;
    else if (arg === '--hours') options.hours = Number(value);
    else if (arg === '--realm') options.realm = value;
    else if (arg === '--end-change-id') options.endChangeId = Number(value);
    else if (arg === '--output') options.output = value;
    else throw new Error(`Unknown option: ${arg}`);
    index += 1;
  }

  return options;
}

function validateOptions(options) {
  if (options.help) return;
  if (!options.metadataId.startsWith('Metadata/Items/')) {
    throw new Error('--metadata-id must start with Metadata/Items/');
  }
  if (!Number.isInteger(options.hours) || options.hours < 1 || options.hours > 168) {
    throw new Error('--hours must be an integer between 1 and 168');
  }
  if (!['pc', 'xbox', 'sony', 'poe2'].includes(options.realm)) {
    throw new Error('--realm must be one of: pc, xbox, sony, poe2');
  }
  if (options.endChangeId !== null &&
      (!Number.isInteger(options.endChangeId) || options.endChangeId <= 0 || options.endChangeId % 3600 !== 0)) {
    throw new Error('--end-change-id must be a positive Unix timestamp divisible by 3600');
  }
}

function endpointFor(realm, changeId) {
  const base = 'https://web.poecdn.com/api/currency-exchange';
  return realm === 'pc' ? `${base}/${changeId}` : `${base}/${realm}/${changeId}`;
}

async function fetchHour(options, changeId) {
  const url = endpointFor(options.realm, changeId);
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'RestX-PoE-Currency-Skill/1.0 (local data query)',
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  const body = await response.json();
  if (!Array.isArray(body.markets)) {
    throw new Error('Response does not contain a markets array');
  }

  const leagueMarkets = body.markets.filter((market) => market.league === options.league);
  const matchedMarkets = leagueMarkets.filter(
    (market) => Array.isArray(market.market_pair) && market.market_pair.includes(options.metadataId),
  );

  return {
    change_id: changeId,
    interval_start_utc: new Date(changeId * 1000).toISOString(),
    interval_end_utc: new Date((changeId + 3600) * 1000).toISOString(),
    next_change_id: body.next_change_id,
    all_market_count: body.markets.length,
    league_market_count: leagueMarkets.length,
    matched_market_count: matchedMarkets.length,
    matched_markets: matchedMarkets,
    endpoint: url,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  validateOptions(options);
  if (options.help) {
    process.stdout.write(USAGE);
    return;
  }

  const currentHour = Math.floor(Date.now() / 3_600_000) * 3600;
  const endChangeId = options.endChangeId ?? currentHour - 3600;
  const results = [];
  const failures = [];

  for (let offset = options.hours - 1; offset >= 0; offset -= 1) {
    const changeId = endChangeId - offset * 3600;
    try {
      results.push(await fetchHour(options, changeId));
    } catch (error) {
      failures.push({
        change_id: changeId,
        endpoint: endpointFor(options.realm, changeId),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const output = {
    generated_at: new Date().toISOString(),
    query: {
      metadata_id: options.metadataId,
      league: options.league,
      realm: options.realm,
      hours: options.hours,
      end_change_id: endChangeId,
    },
    summary: {
      requested_hours: options.hours,
      successful_hours: results.length,
      failed_hours: failures.length,
      matched_markets: results.reduce((total, result) => total + result.matched_market_count, 0),
    },
    results,
    failures,
  };

  const json = `${JSON.stringify(output, null, 2)}\n`;
  if (options.output) {
    const resolvedOutput = path.resolve(options.output);
    await fs.mkdir(path.dirname(resolvedOutput), { recursive: true });
    await fs.writeFile(resolvedOutput, json, 'utf8');
    process.stderr.write(`Saved ${resolvedOutput}\n`);
  } else {
    process.stdout.write(json);
  }

  if (failures.length === options.hours) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n\n${USAGE}`);
  process.exitCode = 1;
});
