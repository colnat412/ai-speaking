import { Injectable } from '@nestjs/common';
import Hashids from 'hashids';

@Injectable()
export class HashidsService {
  private readonly hashids: Hashids;

  constructor() {
    const salt = process.env.HASHIDS_SALT || '6d8a1d503a90486cd6cef4fb216faabf';
    const minLength = Number(process.env.HASHIDS_MIN_LENGTH || 8);
    this.hashids = new Hashids(salt, minLength);
  }

  encode(id: number | string | bigint): string {
    if (id == null) return '';
    const num = typeof id === 'number' ? id : Number(id);
    if (isNaN(num)) return '';
    return this.hashids.encode(num);
  }

  decode(hashId: string | number): number | null {
    if (hashId == null) return null;
    const str = String(hashId).trim();
    if (!str) return null;

    const decoded = this.hashids.decode(str);
    if (decoded && decoded.length > 0) {
      return Number(decoded[0]);
    }

    if (/^\d+$/.test(str)) {
      return Number(str);
    }

    return null;
  }

  encodeDatabaseId(id: string): string {
    if (!/^[1-9]\d*$/.test(id)) {
      throw new Error('Database ID must be a positive integer');
    }

    return this.hashids.encode(BigInt(id));
  }

  decodeDatabaseId(hashId: string): string | null {
    if (!hashId) return null;

    const values = this.hashids.decode(hashId);

    if (values.length !== 1) return null;

    const id = String(values[0]);

    if (!/^[1-9]\d*$/.test(id)) return null;

    if (BigInt(id) > BigInt('9223372036854775807')) {
      return null;
    }

    if (this.encodeDatabaseId(id) !== hashId) {
      return null;
    }

    return id;
  }
}
