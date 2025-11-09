import type { Server as SocketIOServer } from "socket.io";

declare global {
  namespace Express {
    interface Request {
      user?: {
        regnumber: string;
        role?: string;
        id?: string;
        isDemo?: boolean;
        devBypass?: boolean;
      };
      io?: SocketIOServer;
    }
  }
}

export {};

