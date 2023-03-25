import * as amqp from "amqplib/callback_api";

export class AMQP {
  channel: amqp.Channel;
  connection: amqp.Connection;

  constructor() {}

  init() {
    return this.connect().then((connection: amqp.Connection)=>{
      this.connection = connection;
      return this.createChannel(connection);
    }).then((channel: amqp.Channel)=>{
      this.channel = channel;
      return channel;
    });
  }

  private connect() {
    return new Promise((resolve, rejected)=>{
      amqp.connect("amqp://localhost", function (error, connection) {
        if (error) {
          rejected(error);
          throw error;
        }
        resolve(connection);
      });
    });
  }

  private createChannel(connection: amqp.Connection) {
    return new Promise((resolve, rejected)=>{
      connection.createChannel(function (error, channel) {
        if (error) {
          rejected(error);
          throw error;
        }
        resolve(channel);
      });
    });
  }

  produce(queue: string = '', message: string = '') {
    this.channel?.assertQueue(queue, {
      durable: true,
    });

    this.channel?.sendToQueue(queue, Buffer.from(message), { persistent: true });
    console.log(" [x] Produce %s in queue: %s", message, queue);
  }

  consume(queue: string = '') {
    this.channel?.consume(
      queue,
      (msg) => {
        console.log(" [x] Received %s in queue: %s", msg?.content.toString(), queue);
        setTimeout(()=>{
          this.channel.deleteQueue(queue);
        }, 100);
      },
      {
        noAck: true,
      }
    );
  }
}

