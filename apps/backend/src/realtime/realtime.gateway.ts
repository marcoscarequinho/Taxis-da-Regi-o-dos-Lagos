import { Inject, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import {
  DriverLocationEvent,
  RideOfferEvent,
  RideStatus,
  REALTIME_EVENTS,
} from "@moveapp/shared";
import { JwtPayload } from "../auth/jwt-payload.interface";
import { REDIS_CLIENT } from "../redis/redis.module";
import type Redis from "ioredis";
import { ONLINE_DRIVERS_GEO_KEY } from "../matching/matching.constants";

@WebSocketGateway({
  namespace: "/realtime",
  cors: { origin: "*" },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly userSockets = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = (client.handshake.auth?.token ?? client.handshake.query?.token) as string;
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.config.get<string>("jwt.accessSecret"),
      });
      client.data.userId = payload.sub;
      this.userSockets.set(payload.sub, client.id);
      client.join(`user:${payload.sub}`);
    } catch {
      this.logger.warn(`Conexão rejeitada: token inválido (socket ${client.id})`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (userId && this.userSockets.get(userId) === client.id) {
      this.userSockets.delete(userId);
    }
  }

  @SubscribeMessage(REALTIME_EVENTS.RIDE_JOIN)
  handleJoinRide(@ConnectedSocket() client: Socket, @MessageBody() body: { rideId: string }) {
    client.join(`ride:${body.rideId}`);
  }

  @SubscribeMessage(REALTIME_EVENTS.DRIVER_LOCATION)
  async handleDriverLocation(@ConnectedSocket() client: Socket, @MessageBody() body: DriverLocationEvent) {
    const driverId = client.data.userId as string;
    if (!driverId) return;

    await this.redis.geoadd(ONLINE_DRIVERS_GEO_KEY, body.lng, body.lat, driverId);

    if (body.rideId) {
      this.server.to(`ride:${body.rideId}`).emit(REALTIME_EVENTS.RIDE_DRIVER_LOCATION, {
        ...body,
        driverId,
      });
    }
  }

  emitRideStatus(rideId: string, status: RideStatus, driverId?: string | null) {
    this.server.to(`ride:${rideId}`).emit(REALTIME_EVENTS.RIDE_STATUS, { rideId, status, driverId });
  }

  /** Sends a ride offer to a specific driver and waits (with timeout) for accept/reject. */
  async sendRideOffer(driverId: string, offer: RideOfferEvent, timeoutMs: number): Promise<boolean> {
    const socketId = this.userSockets.get(driverId);
    if (!socketId) return false;

    const socket = this.server.sockets.sockets.get(socketId);
    if (!socket) return false;

    return new Promise<boolean>((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      }, timeoutMs);

      socket.emit(REALTIME_EVENTS.RIDE_OFFER, offer, (ack: { accepted: boolean }) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(Boolean(ack?.accepted));
        }
      });
    });
  }

  isDriverOnline(driverId: string): boolean {
    return this.userSockets.has(driverId);
  }
}
