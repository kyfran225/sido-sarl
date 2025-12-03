export interface Bon {
  code: string;
  clientSid: string;
  stationId: string;
  montantFCFA: number;
  generatedByTransaction: string;
  status: 'available' | 'used' | 'expired' | 'cancelled';
  dateGenerated: string;
  dateUsed?: string;
  dateExpiry?: string;
  ruleVersion?: string;
}

export interface UseBonRequest {
  code: string;
}
