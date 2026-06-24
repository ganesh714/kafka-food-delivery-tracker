const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'admin-app',
  brokers: ['localhost:9092']
});

async function setupTopic() {
  const admin = kafka.admin();
  try {
    console.log('Connecting to Kafka Admin...');
    await admin.connect();
    console.log('Connected!');

    console.log('Creating topic "order-events"...');
    const created = await admin.createTopics({
      topics: [{
        topic: 'order-events',
        numPartitions: 3,
        replicationFactor: 1,
        configEntries: [
          { name: 'retention.ms', value: '3600000' }
        ]
      }]
    });

    if (created) {
      console.log('Topic "order-events" created successfully.');
    } else {
      console.log('Topic "order-events" already exists.');
    }
  } catch (error) {
    console.error('Error creating topic:', error);
  } finally {
    await admin.disconnect();
    console.log('Disconnected from Kafka Admin.');
  }
}

setupTopic();
