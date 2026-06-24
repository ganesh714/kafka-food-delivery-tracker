# Food Delivery Order Tracker (Kafka)

A real-time order tracking system built with Apache Kafka, Node.js, and React.

## System Architecture
- **Kafka Cluster:** Managed via Docker Compose (Broker, Zookeeper, Kafdrop).
- **Producer:** Simulates orders and publishes to `order-events` topic.
- **Consumer A (Status Tracker):** Tracks order state, saves to `state.json`, and serves a REST API at `/state`.
- **Consumer B (Analytics Engine):** Independently computes real-time statistics.
- **Frontend Board:** React app to visualize order progression.

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- Docker Desktop

### 1. Start Kafka Cluster
```bash
docker-compose up -d
```
You can view Kafdrop UI at http://localhost:9000.

### 2. Install Backend Dependencies
```bash
npm install
```

### 3. Create Kafka Topic
```bash
node setup-topic.js
```

### 4. Run the Components
Run these in separate terminal windows:
```bash
# Run the Status Tracker API (Port 5000)
node consumer-status.js

# Run the Analytics Engine
node consumer-analytics.js

# Produce some test orders
node producer.js --orders 5
```

### 5. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open the provided local URL (typically http://localhost:5173).

---

### Message Key Rationale

For the `order-events` topic, we use the `order_id` as the message key.

**Why?**
Kafka guarantees that all messages with the same key will be sent to the exact same partition. Since order statuses must be processed chronologically (e.g., `PLACED` -> `CONFIRMED` -> `PREPARING` -> `OUT_FOR_DELIVERY` -> `DELIVERED`), it is critical that they go to the same partition. If they were spread across different partitions, consumers might read them out of order (e.g., seeing `DELIVERED` before `PREPARING`), which would corrupt the system state. By keying on `order_id`, we guarantee ordering guarantees per individual order.
