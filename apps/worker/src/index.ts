import { pollStubSources } from './connectors';
import { scoreFetchedItem } from './scoring';

async function main() {
  const fetched = await pollStubSources();
  const first = fetched.items[0];

  if (!first) {
    console.log('No opportunities returned from stub source.');
    return;
  }

  const result = await scoreFetchedItem(first, 'Stub RSS Source');

  console.log('Fetched items:', fetched.items.length);
  console.log('Normalized opportunity:');
  console.log(JSON.stringify(result.normalized, null, 2));
  console.log('OpenClaw-ready analysis result:');
  console.log(JSON.stringify(result.analysis, null, 2));
  console.log('High-signal alert preview:');
  console.log(JSON.stringify(result.alert, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
