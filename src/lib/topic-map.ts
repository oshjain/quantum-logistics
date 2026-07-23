// Maps game paths to their topic/category name
const TOPIC_MAP: Record<string, string> = {
  "/container-stack": "Shipping Lines",
  "/vessel-stowage": "Shipping Lines",
  "/empty-container": "Shipping Lines",
  "/berth-race": "Shipping Lines",
  "/trip-chain": "Trucking",
  "/cross-dock": "Trucking",
  "/intermodal": "Freight Forwarders",
  "/spot-bid": "Freight Forwarders",
  "/uld-loading": "Air Cargo",
  "/flight-capacity": "Air Cargo",
  "/delivery": "Logistics Basics",
  "/dock": "Logistics Basics",
  "/bb84": "Quantum Algorithms",
  "/grovers": "Quantum Algorithms",
  "/quantum-shipment": "Featured",
};

export function getTopicForGame(path: string): string | undefined {
  return TOPIC_MAP[path];
}
