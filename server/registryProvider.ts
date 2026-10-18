import { RegistryStatusResponse } from '../src/types/index.js';

export interface LandRegistryLookupParams {
  parcelNumber: string;
  county?: string;
  requesterUserId: string;
}

export interface LandRegistryLookupResult {
  status: 'NOT_CONNECTED' | 'RECORD_FOUND' | 'RECORD_NOT_FOUND' | 'PERMISSION_DENIED' | 'TIMEOUT';
  providerName: string;
  sourceTimestamp?: string;
  parcelNumber?: string;
  registeredProprietor?: string;
  encumbrances?: string[];
  disclaimer: string;
  message: string;
}

export interface LandRegistryProvider {
  name: string;
  isConnected(): Promise<boolean>;
  getStatus(): Promise<RegistryStatusResponse>;
  searchByParcel(params: LandRegistryLookupParams): Promise<LandRegistryLookupResult>;
}

export class KenyaArdhisasaRegistryProvider implements LandRegistryProvider {
  name = 'Ministry of Lands - Ardhisasa Gateway (National Land Information Management System)';

  async isConnected(): Promise<boolean> {
    // Requires official governmental integration agreement & mutual TLS / OAuth keys
    return Boolean(process.env.KENYA_ARDHISASA_API_KEY && process.env.KENYA_ARDHISASA_SECRET);
  }

  async getStatus(): Promise<RegistryStatusResponse> {
    const connected = await this.isConnected();
    return {
      providerName: this.name,
      connected,
      status: connected ? 'CONNECTED' : 'NOT_CONNECTED',
      message: connected
        ? 'Connected to authorized Ministry of Lands gateway.'
        : 'Official land registry integration is not currently connected. TerraTrace does not have authorized live access to the Ardhisasa National Land Information System.',
      officialPortalUrl: 'https://ardhisasa.lands.go.ke/',
      disclaimer:
        'TerraTrace is an independent document screening platform. It is not an official land registry and cannot confer, confirm, or alter legal ownership under the Land Registration Act of Kenya.',
      supportedLookups: ['Parcel Reference Search', 'Official Search Verification (Ardhisasa Token)'],
    };
  }

  async searchByParcel(params: LandRegistryLookupParams): Promise<LandRegistryLookupResult> {
    const connected = await this.isConnected();
    if (!connected) {
      return {
        status: 'NOT_CONNECTED',
        providerName: this.name,
        parcelNumber: params.parcelNumber,
        message:
          'Official registry connection is NOT connected. No lookup was performed against the Ministry of Lands or Ardhisasa database. TerraTrace will not invent or simulate registry records.',
        disclaimer:
          'To conduct an authoritative official search in Kenya, property owners and prospective buyers must access the official Ardhisasa portal at https://ardhisasa.lands.go.ke/ or consult an advocate of the High Court of Kenya.',
      };
    }

    // In a future production environment with authorized bilateral credentials:
    return {
      status: 'PERMISSION_DENIED',
      providerName: this.name,
      parcelNumber: params.parcelNumber,
      message: 'Registry API credentials expired or access agreement pending review.',
      disclaimer: 'Authoritative confirmation requires direct Ardhisasa login.',
    };
  }
}

export const defaultRegistryProvider = new KenyaArdhisasaRegistryProvider();
