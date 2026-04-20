declare module "ulid" {
  export function ulid(seedTime?: number): string;
  export function decodeTime(id: string): number;
  export function monotonicFactory(
    prng?: () => number,
  ): (seedTime?: number) => string;
}
