export interface OutdatedInfo {
  current: string;
  wanted: string;
  latest: string;
}

export interface PlannedUpdate {
  name: string;
  section:
    | 'dependencies'
    | 'devDependencies'
    | 'peerDependencies'
    | 'optionalDependencies'
    | 'config';
  currentRange: string;
  latest: string;
  nextRange: string;
}

export function buildUpdatedRange(currentRange: string, latestVersion: string): string;

export function planUpdates(
  packageJson: Record<string, unknown>,
  outdatedMap: Record<string, OutdatedInfo>
): PlannedUpdate[];

export function applyUpdates(packageJsonPath: string, updates: PlannedUpdate[]): Promise<void>;

export function parseConfigDependencyRanges(configContent: string): Record<string, string>;

export function planConfigUpdates(
  configContent: string,
  outdatedMap: Record<string, OutdatedInfo>
): PlannedUpdate[];

export function applyConfigUpdates(configPath: string, updates: PlannedUpdate[]): Promise<void>;

export function findPackageJsonPaths(rootDir: string): string[];

export function collectUpdateTargets(
  rootDir: string,
  configOnly?: boolean
): Promise<Array<{
  kind: 'package-json' | 'config';
  absolutePath: string;
  relativePath: string;
  updates: PlannedUpdate[];
}>>;
