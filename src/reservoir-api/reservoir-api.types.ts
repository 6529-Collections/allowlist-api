export interface ReservoirCollectionsResponse {
  collections: ReservoirCollection[];
  continuation: string;
}

export interface ReservoirCollection {
  id: string;
  slug: string;
  createdAt: Date;
  name: string;
  image: null | string;
  banner: null | string;
  discordUrl: null | string;
  externalUrl: null | string;
  twitterUsername: null | string;
  openseaVerificationStatus: ReservoirCollectionOpenseaVerificationStatus | null;
  description: null | string;
  sampleImages: string[];
  tokenCount: string;
  onSaleCount: string;
  primaryContract: string;
  tokenSetId: null | string;
  creator: null;
  royalties: ReservoirCollectionRoyalties;
  allRoyalties: ReservoirCollectionAllRoyalties | null;
  floorAsk: ReservoirCollectionFloorAsk;
  topBid: ReservoirCollectionTopBid;
  rank: { [key: string]: number | null };
  volume: { [key: string]: number | null };
  volumeChange: { [key: string]: number | null };
  floorSale: { [key: string]: number | null };
  floorSaleChange: { [key: string]: number | null };
  collectionBidSupported: boolean;
  ownerCount: number;
  contractKind: ReservoirCollectionContractKind;
  mintedTimestamp: number | null;
  mintStages: any[];
}

export interface ReservoirCollectionAllRoyalties {
  onchain?: ReservoirCollectionBreakdown[];
  opensea?: ReservoirCollectionBreakdown[];
  eip2981?: ReservoirCollectionBreakdown[];
  custom?: ReservoirCollectionBreakdown[];
}

export interface ReservoirCollectionBreakdown {
  bps: number;
  recipient: string;
}

export enum ReservoirCollectionContractKind {
  Erc1155 = 'erc1155',
  Erc721 = 'erc721',
}

export interface ReservoirCollectionFloorAsk {
  id: null | string;
  sourceDomain: ReservoirCollectionSourceDomain;
  price: ReservoirCollectionFloorAskPrice | null;
  maker: null | string;
  validFrom: number;
  validUntil: number | null;
  token: ReservoirCollectionToken | null;
}

export interface ReservoirCollectionFloorAskPrice {
  currency: ReservoirCollectionCurrency;
  amount: ReservoirCollectionAmount;
}

export interface ReservoirCollectionAmount {
  raw: string;
  decimal: number;
  usd: number;
  native: number;
}

export interface ReservoirCollectionCurrency {
  contract: string;
  name: string;
  symbol: string;
  decimals: number;
}

export enum ReservoirCollectionSourceDomain {
  BlurIo = 'blur.io',
  FoundationApp = 'foundation.app',
  OpenseaIo = 'opensea.io',
  ReservoirTools = 'reservoir.tools',
}

export interface ReservoirCollectionToken {
  contract: string;
  tokenId: string;
  name: string;
  image: string;
}

export enum ReservoirCollectionOpenseaVerificationStatus {
  Approved = 'approved',
  NotRequested = 'not_requested',
  Requested = 'requested',
  Verified = 'verified',
}

export interface ReservoirCollectionRoyalties {
  recipient: null | string;
  breakdown: ReservoirCollectionBreakdown[];
  bps: number;
}

export interface ReservoirCollectionTopBid {
  id: null | string;
  sourceDomain: ReservoirCollectionSourceDomain | null;
  price: ReservoirCollectionTopBidPrice | null;
  maker: null | string;
  validFrom: number | null;
  validUntil: number | null;
}

export interface ReservoirCollectionTopBidPrice {
  currency: ReservoirCollectionCurrency;
  amount: ReservoirCollectionAmount;
  netAmount: ReservoirCollectionAmount;
}
