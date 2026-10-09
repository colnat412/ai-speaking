import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const OPTIONAL_AUTH_KEY = 'optionalAuth';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const OptionalAuth = () => SetMetadata(OPTIONAL_AUTH_KEY, true);
