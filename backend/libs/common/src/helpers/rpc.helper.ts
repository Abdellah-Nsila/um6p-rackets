import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom, lastValueFrom, timeout } from "rxjs";

export const rpc = <T>(client: ClientProxy, pattern: string, payload: unknown, ms = 5000) =>
    firstValueFrom(client.send<T>(pattern, payload).pipe(timeout(ms)));

export const emitEvent = (client: ClientProxy, pattern: string, payload: unknown, ms = 5000) =>
  lastValueFrom(client.emit<void>(pattern, payload).pipe(timeout(ms)), {
    defaultValue: undefined,
  });