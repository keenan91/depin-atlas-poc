//Temporary shim – once Relay confirms location encoding,
export function decodeRelayLocation(_raw: unknown) {
  // return null for “unknown / unasserted”
  return null as {lat: number; lon: number} | null
}
