import { Kafka, logLevel, Partitioners, CompressionTypes } from "kafkajs";
import { request } from 'http';
import axios from 'axios';
import fetch from 'node-fetch';
import * as jwt from 'jose';
import { v4 as uuidv4 } from 'uuid';

import net from 'net';
import tls from 'tls';

const myCustomSocketFactory = ({ host, port, ssl, onConnect }) => {
  const socket = ssl
    ? tls.connect(
        Object.assign({ host, port }, ssl),
        onConnect
      )
    : net.connect(
        { host, port },
        onConnect
      )

  socket.setKeepAlive(true, 30000)

  return socket
}

const processHandler = async () => {
  await new Promise((resole, reject)=>{
    setTimeout(()=>{
      resole(true);
    }, 1000 * 10);
  });
}

export const func_kafka = async () => {

  const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092", "localhost:9092"],
    retry: {
      
    },
    logLevel: logLevel.ERROR,
    socketFactory: myCustomSocketFactory
    /*
    async () => {
       //await axios.get('https://kafka-rest:8082/v3/clusters', { headers: { 'headers': 'application/vnd.api+json' } }).then(response => response.data.json());
      // await request('https://kafka-rest:8082/v3/clusters', { headers: { 'headers': 'application/vnd.api+json' } }, () => { });

      const clusterResponse: any = await fetch('https://kafka-rest:8082/v3/clusters', { headers: { 'headers': 'application/vnd.api+json' } }).then(response => response.json());
      console.log('clusterResponse->', clusterResponse);

      const clusterUrl = clusterResponse.data[0].links.self;
      const brokersResponse:any = await fetch(`${clusterUrl}/brokers`, { headers: { 'headers': 'application/vnd.api+json' } }).then(response => response.json());
      console.log('brokersResponse->', brokersResponse);
      const brokers = brokersResponse.data.map(broker => {
        const { host, port } = broker.attributes
        return `${host}:${port}`
      })
  
      return brokers

    } 
    */
   /*
    ssl: true,
    sasl: {
      mechanism: 'plain',
      username: 'my-username',
      password: 'my-password',
      authenticationProvider: async () => {
        // Use an unsecured token...
        const token = jwt.sign({ sub: 'test' }, 'abc', { algorithm: 'none' })
  
        // ...or, more realistically, grab the token from some OAuth endpoint
  
        return {
          value: token
        }
      }
    }
  */
  });

  const myPartitioner = () => {
    return ({ topic, partitionMetadata, message }) => {
      console.log('topic', topic);
      console.log('partitionMetaData', partitionMetadata);
      console.log('message', message);

      return 0;
    }
  };

  const producer = kafka.producer({
    transactionalId: uuidv4(),
    createPartitioner: Partitioners.DefaultPartitioner,
    maxInFlightRequests: 1,
    idempotent: true
  });

  await producer.connect();
  await producer.send({
    topic: 'test-topic',
    compression: CompressionTypes.GZIP,   
    messages: [
      {
        value: 'hello kafka!',
      },
    ],
  });

  await producer.send({
    topic: "quickstart-events",
    compression: CompressionTypes.GZIP,
    messages: [
      {
        value: 'hello kafka!',
      },
    ],
  });
  

  const transaction = await producer.transaction();

  try {
    await transaction.send({ topic: 'test-topic', messages: [{ value: Buffer.from('hello-from-transaction') }] });
    // await transaction.sendOffsets({ topics: [{ topic: 'test-topic', partitions: [{ partition: 1, offset: '10' }] }], consumerGroupId: 'test-group' });
    await transaction.commit();
  } catch(e) {
    await transaction.abort();
    throw new Error(e);
  }
  await producer.disconnect();

  const consumer = kafka.consumer({
    groupId: 'test-group',
    // sessionTimeout: 500,
    heartbeatInterval: 1000,
    retry: {
      restartOnFailure: async () => {
        return new Promise((resolve, rejected)=>{

        });
      }
    }
  });
  consumer.connect();
  
  consumer.subscribe({ topic: 'test-topic', fromBeginning: true });

  await consumer.run({
    // partitionsConsumedConcurrently: 3,
    autoCommit: true,
    // eachMessage: async ({ topic, partition, message }) => {
    //   // consumer.pause([{ topic: 'test-topic', partitions: [] }]);
    //   console.log("message--->", {
    //     value: message.value?.toString(),
    //   });
    // },
    eachBatchAutoResolve: true,
    eachBatch: async({ batch, resolveOffset, heartbeat,commitOffsetsIfNecessary, uncommittedOffsets, isRunning, isStale, pause }) => {
      console.log('eachBatch: batch.messages->', batch.messages.length);
      try {
        for(let message of batch.messages) {
          console.log({
            topic: batch.topic,
            partition: batch.partition,
            highWatermark: batch.highWatermark,
            message: {
                offset: message.offset,
                key: message.key?.toString(),
                value: message.value?.toString(),
                headers: message.headers,
            }
          });
          await processHandler();
          resolveOffset(message.offset);
          await heartbeat();
        }
        process.exit();
      } catch(e) {
        consumer.pause([{ topic: batch.topic, partitions: [ batch.partition ] }]);
        setTimeout(()=>{
          consumer.resume([{ topic: batch.topic, partitions: [ batch.partition ] }]);
        }, e.retryAfter * 1000);
      }
    }
  });



  const admin = kafka.admin();
  await admin.createTopics({ topics: [ { topic: 'topic-admin-created' }] });
  await admin.createPartitions({
    topicPartitions: [
      {
        topic: 'topic-admin-created',
        count: 10
      }
    ]
  });

  const topics = await admin.listTopics();

  console.log('topics->', topics);

  const offsets = await admin.fetchTopicOffsets('topic-admin-created');
  console.log('offsets->', offsets);

  
};