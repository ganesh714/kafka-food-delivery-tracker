# Kafka Learning Checkpoints

### Offset Experiment Findings

**Experiment:** Stopping Consumer A, generating more data, and restarting Consumer A.
- **What happens when Consumer A restarts? Does it process the messages that were sent while it was offline? Why or why not?**
  Yes, Consumer A processes all the messages that were sent while it was offline. It does this because Kafka durably stores the messages in its topic log. The consumer group (`status-tracker`) tracks its "offset" (the position of the last successfully processed message). When it restarts, it reads its committed offset and simply resumes processing from the exact point it left off.

- **Research and Explain: What is a consumer offset? Where does Kafka store it?**
  A consumer offset is a unique, sequential number assigned to every message within a partition. It acts as a bookmark for consumers. Kafka stores consumer offsets in an internal topic called `__consumer_offsets`. When a consumer acknowledges (commits) a message, it writes its new offset to this internal topic.

- **Experiment: auto.offset.reset policy (earliest vs latest)**
  - `latest`: A brand-new consumer (with a new group ID) will only see *new* messages that arrive *after* it has started. It ignores the history.
  - `earliest`: A brand-new consumer will start reading from the very beginning of the partition, processing all historical messages still retained in the topic.

- **Theoretical: What would happen if both Consumer A and Consumer B shared the same consumer group ID? How would the messages be distributed between them?**
  If they shared the same group ID, Kafka would distribute the topic's partitions between them (e.g., Consumer A might get partition 0 and 1, and Consumer B might get partition 2). Each message would only be processed by *one* of the consumers. This would break our architecture because the Status Tracker would miss half the events, and the Analytics Engine would miss the other half. By using different group IDs, both applications get their own independent copy of the full event stream.

### Guided Checkpoints
- **Understanding consumer groups vs queue:** Traditional queues (like RabbitMQ in default configurations) pop and remove messages after consumption. Kafka is an immutable log; multiple consumer groups can read the exact same message without interfering with each other.
- **Partitions & Parallelism:** 3 partitions mean we can have a maximum of 3 concurrent consumer instances *per consumer group* processing messages simultaneously.
