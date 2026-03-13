import { AllowlistCreator } from '@6529-collections/allowlist-lib/allowlist/allowlist-creator';
import { LoggerFactory } from '@6529-collections/allowlist-lib/logging/logging-emitter';
import { getArweaveFallbackUrls } from '@6529-collections/allowlist-lib/services/seize/seize.api';
import { parseCsv } from '@6529-collections/allowlist-lib/utils/csv';
import axios from 'axios';

const CSV_CONTENT_TYPES = [
  'text/csv',
  'application/csv',
  'application/x-csv',
  'text/x-csv',
  'text/comma-separated-values',
  'application/vnd.ms-excel',
  'text/plain',
  'application/octet-stream',
];

type SeizeUploadsPage = {
  readonly data: Array<{
    readonly block: number;
    readonly url: string;
  }>;
};

type PatchedSeizeApi = {
  readonly apiUri?: string;
  readonly apiToken?: string;
  __allowlistApiTimeoutPatchApplied?: boolean;
  getDataForBlock(params: { path: string; blockId: number }): Promise<any[]>;
};

export function parseTimeoutMs(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function patchAllowlistCreatorSeizeApi(params: {
  readonly allowlistCreator: AllowlistCreator;
  readonly loggerFactory: LoggerFactory;
  readonly seizeMetadataTimeoutMs: number;
  readonly arweaveDownloadTimeoutMs: number;
}) {
  const seizeApi = (params.allowlistCreator as any).seizeApi as PatchedSeizeApi;
  if (!seizeApi || seizeApi.__allowlistApiTimeoutPatchApplied) {
    return;
  }

  const logger = params.loggerFactory.create('SeizeApi');
  const apiUri = seizeApi.apiUri;
  const apiToken = seizeApi.apiToken;

  seizeApi.getDataForBlock = async function ({
    path,
    blockId,
  }: {
    readonly path: string;
    readonly blockId: number;
  }): Promise<any[]> {
    const headers = apiToken ? { 'x-6529-auth': apiToken } : undefined;
    const endpoint = `${apiUri}${path}?block=${blockId}&page_size=1`;
    logger.info(`Fetching Seize metadata from ${endpoint}`);

    const apiResponseData = await fetchJson<SeizeUploadsPage>({
      endpoint,
      headers,
      timeoutMs: params.seizeMetadataTimeoutMs,
      timeoutLabel: 'Seize metadata fetch',
    });
    const tdhUrl = getClosestTdh(apiResponseData, blockId);
    if (!tdhUrl) {
      throw new Error(`No TDH found for block ${blockId}`);
    }

    return await downloadAndParseCsvWithFallback({
      url: tdhUrl,
      timeoutMs: params.arweaveDownloadTimeoutMs,
      logger,
    });
  };

  seizeApi.__allowlistApiTimeoutPatchApplied = true;
}

async function fetchJson<T>({
  endpoint,
  headers,
  timeoutMs,
  timeoutLabel,
}: {
  readonly endpoint: string;
  readonly headers?: Record<string, string>;
  readonly timeoutMs: number;
  readonly timeoutLabel: string;
}): Promise<T> {
  try {
    const response = await axios.get<T>(endpoint, {
      headers,
      timeout: timeoutMs,
    });
    return response.data;
  } catch (error) {
    throw toTimeoutAwareError({
      error,
      endpoint,
      timeoutMs,
      timeoutLabel,
    });
  }
}

async function downloadAndParseCsvWithFallback({
  url,
  timeoutMs,
  logger,
}: {
  readonly url: string;
  readonly timeoutMs: number;
  readonly logger: { info(message: string): void; error(message: string): void };
}): Promise<any[]> {
  const urls = getArweaveFallbackUrls(url);
  const candidates =
    urls.length > 0 ? Array.from(new Set(urls)) : Array.from(new Set([url]));
  let lastError: Error;

  for (const candidate of candidates) {
    logger.info(`Downloading from URL: ${candidate}`);
    try {
      return await fetchCsv({ endpoint: candidate, timeoutMs });
    } catch (error) {
      const normalizedError = normalizeError(error);
      lastError = normalizedError;
      logger.error(
        `Failed to download from URL: ${candidate} because of error: ${normalizedError.message}`,
      );
    }
  }

  if (candidates.length > 1) {
    throw new Error(
      `Arweave: all ${candidates.length} gateways failed. Last: ${lastError.message}`,
    );
  }
  throw lastError;
}

async function fetchCsv({
  endpoint,
  timeoutMs,
}: {
  readonly endpoint: string;
  readonly timeoutMs: number;
}): Promise<any[]> {
  try {
    const response = await axios.get<string>(endpoint, {
      responseType: 'text',
      timeout: timeoutMs,
      transformResponse: [(data) => data],
    });
    assertCsvResponse({ endpoint, response });
    return await parseCsv(response.data, { delimiter: ',' }, mapCsvRecords);
  } catch (error) {
    throw toTimeoutAwareError({
      error,
      endpoint,
      timeoutMs,
      timeoutLabel: 'Arweave CSV download',
    });
  }
}

function toTimeoutAwareError({
  error,
  endpoint,
  timeoutMs,
  timeoutLabel,
}: {
  readonly error: unknown;
  readonly endpoint: string;
  readonly timeoutMs: number;
  readonly timeoutLabel: string;
}): Error {
  if (axios.isAxiosError(error)) {
    if (
      error.code === 'ECONNABORTED' ||
      error.message.toLowerCase().includes('timeout')
    ) {
      return new Error(
        `${timeoutLabel} timed out after ${timeoutMs}ms for ${endpoint}`,
      );
    }
    return new Error(
      `${timeoutLabel} failed for ${endpoint}: ${error.message}`,
    );
  }
  return normalizeError(error);
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

function assertCsvResponse({
  endpoint,
  response,
}: {
  readonly endpoint: string;
  readonly response: {
    readonly headers: Record<string, any>;
    readonly data: string;
  };
}) {
  const contentType = getHeaderValue(response.headers, 'content-type');
  if (!hasCsvCompatibleContentType(contentType)) {
    throw new Error(
      `Unexpected content-type for ${endpoint}: ${contentType ?? 'missing'}`,
    );
  }
  if (looksLikeHtml(response.data)) {
    throw new Error(`Unexpected HTML response for ${endpoint}`);
  }
}

function getClosestTdh(apiResponseData: SeizeUploadsPage, blockId: number) {
  return [...apiResponseData.data]
    .sort((a, b) => a.block - b.block)
    .filter((item) => item.block <= blockId)
    .at(-1)?.url;
}

function getHeaderValue(
  headers: Record<string, any>,
  headerName: string,
): string | undefined {
  const match = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === headerName.toLowerCase(),
  )?.[1];
  if (Array.isArray(match)) {
    return match.join(', ');
  }
  return match;
}

function hasCsvCompatibleContentType(contentType: string | undefined): boolean {
  if (!contentType) {
    return true;
  }
  const normalized = contentType.split(';', 1)[0].trim().toLowerCase();
  return CSV_CONTENT_TYPES.includes(normalized);
}

function looksLikeHtml(body: string): boolean {
  const normalized = body.trimStart().toLowerCase();
  return normalized.startsWith('<!doctype html') || normalized.startsWith('<html');
}

function mapCsvRecords(records: string[][]) {
  const lines = [];
  const header = records[0];
  for (let index = 1; index < records.length; index++) {
    const row = {};
    for (let headerIndex = 0; headerIndex < header.length; headerIndex++) {
      row[header[headerIndex]] = records[index][headerIndex];
    }
    lines.push(row);
  }
  return lines;
}
