import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { OnModuleInit } from '@nestjs/common';
import appConfig from 'src/config/app.config';
import Redis from 'ioredis';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit
{
  @WebSocketServer()
  server: Server;

  private redisPubClient: Redis;
  private redisSubClient: Redis;

  // Map to store connected clients
  private clients = new Map<string, string>(); // userId -> socketId

  constructor(private readonly notificationService: NotificationService) {}

  onModuleInit() {
    this.redisPubClient = new Redis({
      host: appConfig().redis.host,
      port: Number(appConfig().redis.port),
      password: appConfig().redis.password,
    });

    this.redisSubClient = new Redis({
      host: appConfig().redis.host,
      port: Number(appConfig().redis.port),
      password: appConfig().redis.password,
    });

    this.redisSubClient.subscribe('notification');
    
    this.redisSubClient.on('message', (channel: string, message: string) => {
      if (channel === 'notification') {
        const data = JSON.parse(message);
        // Target specific user based on userId in the data
        const targetSocketId = this.clients.get(data.userId);
        if (targetSocketId) {
          this.server.to(targetSocketId).emit('receiveNotification', data);
        }
      }
    });
  }

  afterInit(server: Server) {
    console.log('Websocket server started');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    // console.log('new connection!', client.id);
    const userId = client.handshake.query.userId as string; // User ID passed as query parameter
    if (userId) {
      this.clients.set(userId, client.id);
      console.log(`User ${userId} connected with socket ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    // console.log('client disconnected!', client.id);
    const userId = [...this.clients.entries()].find(
      ([, socketId]) => socketId === client.id,
    )?.[0];
    if (userId) {
      this.clients.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  }

  // @SubscribeMessage('joinRoom')
  // handleRoomJoin(client: Socket, room: string) {
  //   client.join(room);
  //   client.emit('joinedRoom', room);
  // }

  @SubscribeMessage('sendNotification')
  async handleNotification(@MessageBody() data: any) {
    console.log(`Received notification: ${JSON.stringify(data)}`);
    
    // Target specific user instead of broadcasting to all
    const targetSocketId = this.clients.get(data.userId);
    if (targetSocketId) {
      // Send to specific user
      this.server.to(targetSocketId).emit('receiveNotification', data);
      
      // Also publish to Redis for distributed systems
      await this.redisPubClient.publish('notification', JSON.stringify(data));
      
      console.log(`Notification sent to user ${data.userId}`);
    } else {
      console.log(`User ${data.userId} not connected`);
    }
  }

  @SubscribeMessage('createNotification')
  create(@MessageBody() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  @SubscribeMessage('findAllNotification')
  findAll(@MessageBody() data: any) {
    return this.notificationService.findAll(data.userId);
  }

  @SubscribeMessage('findOneNotification')
  findOne(@MessageBody() id: number) {
    return this.notificationService.findOne(id);
  }

  @SubscribeMessage('updateNotification')
  update(@MessageBody() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationService.update(
      updateNotificationDto.id,
      updateNotificationDto,
    );
  }

  @SubscribeMessage('removeNotification')
  remove(@MessageBody() data: any) {
    return this.notificationService.remove(data.id, data.userId);
  }
}
