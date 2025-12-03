export interface Client {
  sid: string;
  firstName: string;
  lastName?: string;
  phone: string;
  segment: 'general' | 'premium' | 'vip';
  stationEnrolment: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientRequest {
  firstName: string;
  lastName: string;
  phone: string;
  segment?: 'general' | 'premium' | 'vip';
  stationEnrolment: string;
}

export interface SearchClientsParams {
  query?: string;
  phone?: string;
  sid?: string;
  limit?: number;
  offset?: number;
}
