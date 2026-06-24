const { Kafka } = require('kafkajs');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const kafka = new Kafka({
  clientId: 'status-tracker-app',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'status-tracker' });
const app = express();
const port = 5000;
const stateFile = path.join(__dirname, 'state.json');

app.use(cors());

let orderState = {};

// Load existing state if it exists
if (fs.existsSync(stateFile)) {
  try {
    const data = fs.readFileSync(stateFile, 'utf8');
    orderState = JSON.parse(data);
    console.log('Loaded existing state from state.json');
  } catch (err) {
    console.error('Error loading state file:', err);
  }
}

// HTTP Endpoint
app.get('/state', (req, res) => {
  res.json(orderState);
});

// Periodically save state to file
setInterval(() => {
  fs.writeFile(stateFile, JSON.stringify(orderState, null, 2), (err) => {
    if (err) console.error('Error saving state:', err);
  });
}, 10000);

async function run() {
  await consumer.connect();
  console.log('Status Tracker Consumer connected.');
  
  await consumer.subscribe({ topic: 'order-events', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const value = JSON.parse(message.value.toString());
        const { order_id, status, restaurant, estimated_delivery_minutes } = value;
        
        const previousStatus = orderState[order_id] ? orderState[order_id].status : 'NEW';
        
        orderState[order_id] = value;
        
        console.log(`[UPDATE] ${order_id}: ${previousStatus} -> ${status}`);
        
        if (status === 'DELIVERED') {
          console.log(`[COMPLETE] ${order_id} | ${restaurant} | ~${estimated_delivery_minutes} min.`);
          delete orderState[order_id];
        }
      } catch (err) {
        console.error('Error processing message:', err);
      }
    },
  });

  app.listen(port, () => {
    console.log(`Status Tracker API listening at http://localhost:${port}`);
  });
}

run().catch(console.error);
