# 🚀 Welcome to RabbitMQ&Kafka project!

This project has been created using **webpack-cli**, you can now run

```
npm run build
```

or

```
yarn build
```

to bundle your application

## start server
```
./sbin/rabbitmq-server
```

```
rabbitmqctl stop_app
rabbitmqctl reset    # Be sure you really want to do this!
rabbitmqctl start_app
```
```
rabbitmqadmin delete queue name=name_of_queue
```
```
rabbitmqctl list_queues
```

```
rabbitmqctl list_queues name messages_ready messages_unacknowledged
```

```
rabbitmqctl list_exchanges
```

```
rabbitmqctl list_bindings
```

```
rabbitmq-plugins enable rabbitmq_management
```

## stop port process
```
lsof -i :25672
kill PID
```

## Management UI Access
```
#create a user
rabbitmqctl add_user full_access s3crEt
#tag the user with "administrator" for full management UI and HTTP API access
rabbitmqctl set_user_tags full_access administrator
```

# Principles
## RabbitMQ
![rabbitMQ-mindmap](/assets/images/rabbitMQ-mindmap.png)

![rabbitMQ-routingKey](/assets/images/rabbitMQ-routingKey.png)

![topic](/assets/images/rabbitMQ-topic.png)

![topic](/assets/images/correlation-reply.png)

## Kafka

![kafka](/assets/images/kafka-mindmap.png)

![kafka](/assets/images/kafka-topic%26partitions.png)