import { createClient } from '@supabase/supabase-js';

const url = 'https://canosehsuigyjqmfrcxi.supabase.co';
const key = 'sb_publishable_4pzCVGDn377SnY23tEvW1A_Cu4sHQhI';

console.log('Testing Supabase client creation...');
const supabase = createClient(url, key);

const channel = supabase.channel('test-room', {
  config: { broadcast: { self: true } }
});

channel.on('broadcast', { event: 'ping' }, (payload) => {
  console.log('✓ Received broadcast ping successfully:', payload);
  channel.unsubscribe().then(() => {
    console.log('✓ Test completed cleanly!');
    process.exit(0);
  });
});

channel.subscribe((status) => {
  console.log('Subscription status:', status);
  if (status === 'SUBSCRIBED') {
    console.log('✓ Connected to Supabase Realtime WebSocket successfully!');
    channel.send({
      type: 'broadcast',
      event: 'ping',
      payload: { message: 'hello from pen-fight!', timestamp: Date.now() }
    });
  }
});

setTimeout(() => {
  console.error('Timed out after 10s');
  process.exit(1);
}, 10000);
