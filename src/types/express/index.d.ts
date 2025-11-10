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
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination?: string;
        filename?: string;
        path?: string;
        buffer?: Buffer;
      }
    }
  }
}

export {};

