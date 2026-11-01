# RMQ: the hidden reply path and `noAck`

## The one thing to remember

A request/response (`client.send`) uses **two** paths, not one:

```
gateway ──request──► [ club_queue ] ──► club-service
                     real queue

gateway ◄──reply──── [ amq.rabbitmq.reply-to ] ◄── club-service
                     built into RabbitMQ
```

- `club_queue`: a real queue. You declare it, club-service listens to it.
- `amq.rabbitmq.reply-to`: the **reply path**. You never create it. RabbitMQ has it built in, and Nest's client just listens on it. It stores nothing, it hands the answer straight back to whoever asked, (ist can't use noAck: false, because it can't store queued messages).

## What I did not know

I thought `noAck` only affected `club_queue`. It is set **per listener (consumer)**, and the gateway client has its own listener on the reply path:

```
gateway client options  { queue: 'club_queue', noAck: ? }
  ├─ sends requests to  club_queue            (noAck not used)
  └─ listens for replies on amq.rabbitmq.reply-to   (noAck is used here!)

club-service options    { queue: 'club_queue', noAck: ? }
  └─ listens on club_queue                    (noAck is used here)
```

## Rules

```
gateway client   noAck: true     always
club-service     noAck: true     for request/response (client.send)
                 noAck: false    only for events that must not be lost
```

Why the gateway must use `true`: the reply path stores nothing, so there is nothing to acknowledge. RabbitMQ refuses `false`:

```
noAck: false on the gateway client
  └─► 406 PRECONDITION_FAILED - reply consumer cannot acknowledge
      └─► channel closes, gateway crashes
```

## What `noAck` means

```
noAck: true    message is deleted the moment it is delivered. Nobody acks.
noAck: false   message is kept until your code calls ack(). If the service
               crashes before that, the message goes back to the queue.
```

## Both sides must share

```
- the queue name       (QUEUES.CLUB)
- the queue options    (durable, arguments)
```

`noAck` does not have to match between the two sides.