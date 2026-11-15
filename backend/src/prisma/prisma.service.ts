import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();

    // Auto-retry Proxy: gracefully recovers from serverless cold-starts and dropped TCP sockets
    return new Proxy(this, {
      get: (target: any, prop: string | symbol) => {
        const orig = target[prop];
        if (typeof orig === 'object' && orig !== null && !String(prop).startsWith('$')) {
          return new Proxy(orig, {
            get: (modelTarget: any, modelProp: string | symbol) => {
              const modelMethod = modelTarget[modelProp];
              if (typeof modelMethod === 'function') {
                return async (...args: any[]) => {
                  let retries = 2;
                  while (retries >= 0) {
                    try {
                      return await modelMethod.apply(modelTarget, args);
                    } catch (error: any) {
                      const isTransient =
                        error?.code === 'P1001' || // Can't reach database server (cold start / asleep)
                        error?.code === 'P1017' || // Server has closed the connection
                        error?.code === 'P2024' || // Connection pool timeout
                        error?.message?.includes("Can't reach database server") ||
                        error?.message?.includes('Server has closed the connection');

                      if (isTransient && retries > 0) {
                        this.logger.warn(
                          `Transient database error (${error?.code || 'CONN'}). Reconnecting in 1s... (${retries} attempts left)`,
                        );
                        retries--;
                        await new Promise((r) => setTimeout(r, 1000));
                        try {
                          await target.$connect();
                        } catch {}
                        continue;
                      }
                      throw error;
                    }
                  }
                };
              }
              return modelMethod;
            },
          });
        }
        return orig;
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Successfully connected to TiDB MySQL database via Prisma');
    } catch (err: any) {
      this.logger.error(`❌ Database connection failed: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
