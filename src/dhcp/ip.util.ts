export function ipToInt(ip: string): number {
  const parts = ip.split(".").map((x) => Number(x));
  if (parts.length !== 4 || parts.some((x) => Number.isNaN(x) || x < 0 || x > 255)) {
    throw new Error(`Invalid IPv4: ${ip}`);
  }
  // >>> 0 to keep unsigned
  return (((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0);
}

export function intToIp(n: number): string {
  const x = n >>> 0;
  return [
    (x >>> 24) & 255,
    (x >>> 16) & 255,
    (x >>> 8) & 255,
    x & 255,
  ].join(".");
}

export function isIpInRange(ip: string, start: string, end: string): boolean {
  const i = ipToInt(ip);
  return i >= ipToInt(start) && i <= ipToInt(end);
}
