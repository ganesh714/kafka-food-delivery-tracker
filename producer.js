const { Kafka } = require('kafkajs');
const fixtures = require('./fixtures.json');

const kafka = new Kafka({
  clientId: 'producer-app',
  brokers: ['localhost:9092'],
  retry: {
    initialRetryTime: 1000,
    retries: 3
  }
});

const producer = kafka.producer();

const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const statuses = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

async function run() {
  await producer.connect();
  console.log('Producer connected to Kafka.');

  const args = process.argv.slice(2);
  const ordersArgIndex = args.indexOf('--orders');
  const numOrders = (ordersArgIndex !== -1 && args[ordersArgIndex + 1]) ? parseInt(args[ordersArgIndex + 1], 10) : 10;

  console.log(`Simulating ${numOrders} orders...`);

  for (let i = 1; i <= numOrders; i++) {
    const orderId = `ORD-${Date.now().toString().slice(-6)}-${i.toString().padStart(3, '0')}`;
    const customer = getRandomItem(fixtures.customers);
    const restaurant = getRandomItem(fixtures.restaurants);
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items = Array.from({ length: numItems }, () => getRandomItem(fixtures.items));

    for (const status of statuses) {
      const message = {
        order_id: orderId,
        customer_name: customer,
        restaurant: restaurant,
        items: items,
        status: status,
        timestamp: new Date().toISOString(),
        estimated_delivery_minutes: Math.floor(Math.random() * 30) + 15
      };

      try {
        await producer.send({
          topic: 'order-events',
          messages: [
            { key: orderId, value: JSON.stringify(message) }
          ]
        });
        console.log(`[SENT] ${orderId} -> ${status}`);
      } catch (error) {
        console.error(`Error sending ${orderId} -> ${status}:`, error);
      }

      // Random delay between 2-8 seconds
      if (status !== 'DELIVERED') {
        const delay = Math.floor(Math.random() * 6000) + 2000;
        await sleep(delay);
      }
    }
  }

  await producer.disconnect();
  console.log('Producer finished and disconnected.');
}

run().catch(console.error);
