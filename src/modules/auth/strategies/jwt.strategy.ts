import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisService } from '../../../common/redis/redis.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly redis: RedisService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'default-secret',
    });
  }

  async validate(payload: any) {
    try {
      if (payload.type !== 'access') {
        throw new UnauthorizedException();
      }

      const sessionRaw = await this.redis.redisClient.get(
        `auth:session:${payload.sid}`,
      );

      if (!sessionRaw) {
        throw new UnauthorizedException("Session doesn't exist");
      }

      const session = JSON.parse(sessionRaw);
      if (session.userId !== payload.sub) {
        throw new UnauthorizedException("Session doesn't belong to user");
      }
      return payload;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
