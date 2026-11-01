import { RpcException } from '@nestjs/microservices';

export interface RpcErrorPayload {
  status: number;      // HTTP-like code: 400, 401, 404, 409, ...
  message: string;
  error?: string;
}


export const rpcError = (status: number, message: string, error: string) =>
  new RpcException({ status, message, error });

// // usage
// throw rpcError(404, 'Club not found', 'Not Found');