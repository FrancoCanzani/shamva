export interface HeartbeatFormData {
  name: string;
  expectedLapseMs: number;
  gracePeriodMs: number;
  workspaceId: string;
  pingId: string;
}
