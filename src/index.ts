import { catchError, delay, interval, map, timeInterval } from "rxjs";
import * as casual from "casual";
import { v4 as uuidv4 } from 'uuid';

import { AMQP } from "./rabbitMQ/broker";
import { func_kafka } from "./kafka/server";
import { errorTrack } from './utils';

const newTask = (amqp: AMQP, queueName: string, msg: string) => {
  amqp.channel.sendToQueue(queueName, Buffer.from(msg), { persistent: true });
};

const worker = (amqp: AMQP, queueName: string) => {
  amqp.channel.consume(
    queueName,
    (msg) => {
      const secs = Number(msg.content.toString().split("-")[1]);
      console.log(" [x] Received %s", msg.content.toString());
    },
    {
      noAck: false,
    }
  );
};

const start = async () => {
  const amqp = new AMQP();
  await amqp.init();
  const queueName = "task_queue";

  amqp.channel.assertQueue(queueName, { durable: true });

  for(let i = 0; i < 10; i++) {
    amqp.channel.assertQueue(`QUEUE${i}`, { durable: true });
  }

  const exchangeFanout = 'log-fanout';
  const exchangeDirect = 'log-direct';
  const exchangeTopic = 'log-topic';
  const exchange = exchangeTopic;
  const exchangeType: 'direct' | 'fanout' | 'headers'| 'topic' = 'topic';
  new Promise((resolve, reject)=>{
    amqp.channel.assertQueue('', { exclusive: true }, (err, ok) => {
      const queueName: string = ok.queue;
      amqp.channel.assertExchange(exchange, exchangeType, { durable: false }, (err, ok)=>{
        if (err) {
          throw Error(err);
        }

        amqp.channel.bindQueue(queueName, exchange, 'red', {}, (err, ok)=>{
          if (err) {
            throw Error(err);
          }
          console.log(`bind ${queueName} to ${exchange}, ok->`, ok);
        });
        for(let i = 0; i < 10; i++) {
          amqp.channel.bindQueue(`QUEUE${i}`, exchange, '*.blue', {}, (err, ok)=>{});
        }
        resolve(queueName);
      });
    });
  }).then((queueName) => {
    amqp.channel.publish(exchange, 'red', Buffer.from('word->0'), { contentType: 'application/json' });
    return queueName;
  }).then((queueName: string) => {
    amqp.channel.consume(queueName, (message) => {
      console.log('message-->0', message.content.toString());
    }, { noAck: true }, () => {});
  
    amqp.channel.publish(exchange, '.blue', Buffer.from('word->1'));
    for(let i = 0; i < 10; i++) {
      amqp.channel.consume(`QUEUE${i}`, (message) => {
        console.log('message-->1', message.content.toString());
      }, { noAck: true }, () => {});
    }
  
  });

  function fibonacci(n): number {
    if (n > 10 || n < 0) return n;
    if (n == 0 || n == 1)
      return n;
    else
      return fibonacci(n - 1) + fibonacci(n - 2);
  }

  const rpc = 'rpc-queue';
  new Promise((resolve, reject)=>{
    amqp.channel.assertQueue(rpc, { durable: false }, (err, ok) => {
      amqp.channel.prefetch(1);
      if (err) {
        reject(err);
      }
      amqp.channel.consume(rpc, (msg) => {
        const str = msg.content.toString();
        const value = fibonacci(Number(str));
        console.log('value->', value);
        amqp.channel.sendToQueue(
          msg.properties.replyTo, 
          Buffer.from(value.toString()), 
          { 
            correlationId: msg.properties.correlationId
          }
        );

        amqp.channel.ack(msg);
        resolve(true);
      },{},
      (err, ok) => {
        if (err) {
          reject(err);
        }
      }
      );
    });
  });

  new Promise((resolve, reject)=>{
    amqp.channel.assertQueue('', { exclusive: true }, (err, ok) => {
      if (err) {
        reject(err);
      }
      const correlationId = uuidv4();
      amqp.channel.consume(ok.queue, (msg) => {
        if (msg.properties.correlationId.toString() === correlationId) {
          // amqp.connection.close();
          // process.exit();
        }
      }, { noAck: true });

      amqp.channel.sendToQueue(rpc, Buffer.from('10'), { correlationId, replyTo: ok.queue });
      resolve(true);
    });
  });

};

start();
func_kafka();
errorTrack();
