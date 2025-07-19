import { Request, Response, NextFunction } from 'express';

export interface VersionedRequest extends Request {
  apiVersion: string;
  isVersionSupported: boolean;
  deprecationWarnings?: string[];
}

const SUPPORTED_VERSIONS = ['v1'] as const;
const DEPRECATED_VERSIONS = [] as const;
const DEFAULT_VERSION = 'v1';

export type ApiVersion = typeof SUPPORTED_VERSIONS[number];

export const versioningMiddleware = (req: VersionedRequest, res: Response, next: NextFunction) => {
  // Check for version in header, query param, or URL path
  let version = req.headers['api-version'] as string ||
                req.query.version as string ||
                extractVersionFromPath(req.path);

  // Default to v1 if no version specified
  if (!version) {
    version = DEFAULT_VERSION;
  }

  // Normalize version format (ensure it starts with 'v')
  if (!version.startsWith('v')) {
    version = `v${version}`;
  }

  req.apiVersion = version;
  req.isVersionSupported = SUPPORTED_VERSIONS.includes(version as ApiVersion);
  req.deprecationWarnings = [];

  // Check if version is deprecated
  if (DEPRECATED_VERSIONS.includes(version as never)) {
    const warning = `API version ${version} is deprecated. Please upgrade to v${SUPPORTED_VERSIONS[SUPPORTED_VERSIONS.length - 1]}.`;
    req.deprecationWarnings.push(warning);
    res.setHeader('Warning', `299 - "${warning}"`);
    res.setHeader('Sunset', getSunsetDate(version));
  }

  // Add version info to response headers
  res.setHeader('API-Version', version);
  res.setHeader('Supported-Versions', SUPPORTED_VERSIONS.join(', '));

  // If version is not supported, return 400
  if (!req.isVersionSupported) {
    return res.status(400).json({
      error: 'Unsupported API Version',
      message: `API version ${version} is not supported. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
      statusCode: 400,
      timestamp: new Date().toISOString(),
      supportedVersions: SUPPORTED_VERSIONS,
    });
  }

  next();
};

function extractVersionFromPath(path: string): string | null {
  const versionMatch = path.match(/^\/api\/v(\d+)/);
  return versionMatch ? `v${versionMatch[1]}` : null;
}

function getSunsetDate(version: string): string {
  // Return sunset date 6 months from now for deprecated versions
  const sunsetDate = new Date();
  sunsetDate.setMonth(sunsetDate.getMonth() + 6);
  return sunsetDate.toUTCString();
}

// Middleware to enforce specific version requirements
export const requireVersion = (minVersion: ApiVersion) => {
  return (req: VersionedRequest, res: Response, next: NextFunction) => {
    const currentVersionNum = parseInt(req.apiVersion.replace('v', ''));
    const minVersionNum = parseInt(minVersion.replace('v', ''));

    if (currentVersionNum < minVersionNum) {
      return res.status(400).json({
        error: 'Insufficient API Version',
        message: `This endpoint requires API version ${minVersion} or higher. Current version: ${req.apiVersion}`,
        statusCode: 400,
        timestamp: new Date().toISOString(),
        requiredVersion: minVersion,
        currentVersion: req.apiVersion,
      });
    }

    next();
  };
};

// Helper function to get version-specific response format
export const getVersionedResponse = (data: any, version: string) => {
  switch (version) {
    case 'v1':
    default:
      return data;
  }
};

// Middleware to add version-specific transformations
export const versionTransform = (req: VersionedRequest, res: Response, next: NextFunction) => {
  const originalJson = res.json;

  res.json = function(data: any) {
    const transformedData = getVersionedResponse(data, req.apiVersion);
    return originalJson.call(this, transformedData);
  };

  next();
};