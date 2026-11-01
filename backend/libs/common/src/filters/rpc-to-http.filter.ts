import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { toFullString } from '../dates.js';

@Catch()
export class RpcToHttpFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcToHttpFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 1. Extract the clean data using our helper
    const errorData = this.extractErrorData(exception);

    // 2. Return the standardized response
    response.status(errorData.statusCode).json({
      ...errorData,
      path: request.url,
      timestamp:  toFullString(new Date()),
    });
  }

  private extractErrorData(exception: any) {
    if (exception instanceof HttpException) {
      return this.formatHttpException(exception);
    }

    const payload = this.unwrapRpcPayload(exception);
    if (this.isValidRpcPayload(payload)) {
      return {
        statusCode: payload.statusCode || payload.status,
        message: payload.message,
        error: payload.error || 'RPC Error',
      };
    }

    // Fallback for fatal crashes
    this.logger.error(exception?.message || String(exception), exception?.stack);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Error',
    };
  }

  private formatHttpException(exception: HttpException) {
    const response = exception.getResponse() as any;
    return {
      statusCode: exception.getStatus(),
      message: response.message ?? exception.message,
      error: response.error ?? 'HTTP Error',
    };
  }

  private unwrapRpcPayload(exception: any): any {
    if (exception instanceof RpcException) return exception.getError();
    if (exception instanceof Error && (exception as any).error) return (exception as any).error;
    return exception;
  }

  private isValidRpcPayload(payload: any): boolean {
    const status = payload?.statusCode || payload?.status;
    return typeof payload === 'object' && payload !== null && Number.isInteger(status) && status >= 400;
  }
}