import { Catch, RpcExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class AllRpcExceptionsFilter implements RpcExceptionFilter {
  private readonly logger = new Logger(AllRpcExceptionsFilter.name);

  catch(exception: any): Observable<any> {
    const payload = this.createPayload(exception);
    return throwError(() => payload);
  }

  private createPayload(exception: any) {
    // 1. Native NestJS Validation / HTTP Errors
    if (exception instanceof HttpException) {
      const res = exception.getResponse() as any;
      return {
        statusCode: exception.getStatus(),
        message: res.message || exception.message,
        error: res.error || exception.name,
      };
    }

    // 2. Custom rpcError() Helper
    if (exception instanceof RpcException) {
      const res = exception.getError() as any;
      return {
        statusCode: res.status || res.statusCode || HttpStatus.BAD_REQUEST,
        message: res.message || 'RPC Error',
        error: res.error || 'RpcException',
      };
    }

    // 3. Prisma Known Database Errors (Using Duck-Typing to avoid imports in shared libs)
    if (exception?.name === 'PrismaClientKnownRequestError') {
      switch (exception.code) {
        case 'P2002': // Unique constraint violation
          return {
            statusCode: HttpStatus.CONFLICT,
            message: 'A record with this value already exists. Please choose a unique value.',
            error: 'Conflict',
          };
        case 'P2025': // Record not found
          return {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'The requested database record was not found.',
            error: 'Not Found',
          };
        case 'P2003': // Foreign key constraint failed
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'A referenced record does not exist (e.g., invalid relation ID).',
            error: 'Bad Request',
          };
        case 'P2000': // Value too long for column
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Input value is too long for one or more database fields.',
            error: 'Bad Request',
          };
        default:
          this.logger.error(`Unhandled Prisma Code ${exception.code}: ${exception.message}`);
          break; // Fall through to standard 500 error
      }
    }

    // 4. Prisma Type/Validation Errors (Developer/Payload schema mismatch)
    if (exception?.name === 'PrismaClientValidationError') {
      this.logger.error(`Prisma Validation Error: ${exception.message}`);
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Database schema validation failed. Invalid data format.',
        error: 'Bad Request',
      };
    }

    // 4. Fatal Crashes
    this.logger.error(`Unhandled Exception: ${exception?.message}`, exception?.stack);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Error',
    };
  }
}