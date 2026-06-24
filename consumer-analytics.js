const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'analytics-app',
  brokers: ['localhost:9092']
});

// Different consumer group!
const consumer = kafka.consumer({ groupId: 'analytics' });

let restaurantCounts = {};
let statusCounts = {};

async function run() {
  await consumer.connect();
  console.log('Analytics Consumer connected.');
  
  await consumer.subscribe({ topic: 'order-events', fromBeginning: true });

  // Periodically print stats
  setInterval(() => {
    console.log('\n--- Analytics Snapshot ---');
    console.log('Orders per Restaurant:', restaurantCounts);
    console.log('Messages per Status:', statusCounts);
    console.log('--------------------------\n');
  }, 15000);

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const value = JSON.parse(message.value.toString());
        const { restaurant, status } = value;
        
        // Count statuses
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        
        // Count restaurants (only on PLACED so we don't count the same order 5 times)
        if (status === 'PLACED') {
          restaurantCounts[restaurant] = (restaurantCounts[restaurant] || 0) + 1;
        }
      } catch (err) {
        console.error('Error processing message:', err);
      }
    },
  });
}

run().catch(console.error);
