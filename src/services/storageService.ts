import {
  BaselineLineTemplate,
  DirectRouteConnection,
  DistanceMatrix,
  Facility,
  FacilityRelationship,
  ForbiddenRouteRule,
  MatrixData,
  OptimizationParameters,
  PlanningExecutionResult,
  SpecialDistanceLocation,
  VehicleTypeConfig,
} from '../types/logistics';
import {
  INITIAL_BASELINE_LINES,
  INITIAL_DIRECT_ROUTES,
  INITIAL_FACILITIES,
  INITIAL_FACILITY_RELATIONSHIPS,
  INITIAL_FORBIDDEN_ROUTES,
  INITIAL_OPTIMIZATION_PARAMETERS,
  INITIAL_SPECIAL_LOCATIONS,
  INITIAL_VEHICLES,
  buildInitialDistanceMatrix,
  buildReferenceCoefficients,
  buildReferenceDesiMatrix,
  buildReferencePackageMatrix,
} from '../data/referenceDataset';

export interface PersistentDatabaseState {
  version: number;
  facilities: Facility[];
  vehicles: VehicleTypeConfig[];
  optParams: OptimizationParameters;
  forbiddenRules: ForbiddenRouteRule[];
  directRoutes: DirectRouteConnection[];
  facilityRelationships: FacilityRelationship[];
  specialLocations: SpecialDistanceLocation[];
  packageMatrix: MatrixData;
  desiMatrix: MatrixData;
  packageShareMatrix: MatrixData;
  desiPerPackageMatrix: MatrixData;
  distanceMatrix: DistanceMatrix;
  baselineTemplates: BaselineLineTemplate[];
  planningHistory: PlanningExecutionResult[];
}

const DB_NAME = 'LogisticsAISmartRouteDB';
const DB_VERSION = 2;
const STORE_NAME = 'appStateStore';
const STATE_KEY = 'LOGISTICS_MASTER_STATE_V2';

export function buildDefaultDatabaseState(): PersistentDatabaseState {
  const { packageShareMatrix, desiPerPackageMatrix } = buildReferenceCoefficients();
  return {
    version: 2,
    facilities: INITIAL_FACILITIES,
    vehicles: INITIAL_VEHICLES,
    optParams: INITIAL_OPTIMIZATION_PARAMETERS,
    forbiddenRules: INITIAL_FORBIDDEN_ROUTES,
    directRoutes: INITIAL_DIRECT_ROUTES,
    facilityRelationships: INITIAL_FACILITY_RELATIONSHIPS,
    specialLocations: INITIAL_SPECIAL_LOCATIONS,
    packageMatrix: buildReferencePackageMatrix(),
    desiMatrix: buildReferenceDesiMatrix(),
    packageShareMatrix,
    desiPerPackageMatrix,
    distanceMatrix: buildInitialDistanceMatrix(),
    baselineTemplates: INITIAL_BASELINE_LINES,
    planningHistory: [],
  };
}

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB desteklenmiyor'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadDatabaseState(): Promise<PersistentDatabaseState> {
  try {
    const db = await openIndexedDB();
    const record = await new Promise<PersistentDatabaseState | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(STATE_KEY);
      getReq.onsuccess = () => resolve(getReq.result as PersistentDatabaseState | undefined);
      getReq.onerror = () => reject(getReq.error);
    });
    if (record && record.facilities && record.desiMatrix) {
      // Merge in any newly introduced collections if missing in stored state
      return {
        ...record,
        directRoutes: record.directRoutes || INITIAL_DIRECT_ROUTES,
        facilityRelationships: record.facilityRelationships || INITIAL_FACILITY_RELATIONSHIPS,
        specialLocations: record.specialLocations || INITIAL_SPECIAL_LOCATIONS,
      };
    }
  } catch {
    // Fallback to localStorage
  }

  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistentDatabaseState;
      if (parsed && parsed.facilities && parsed.desiMatrix) {
        return {
          ...parsed,
          directRoutes: parsed.directRoutes || INITIAL_DIRECT_ROUTES,
          facilityRelationships: parsed.facilityRelationships || INITIAL_FACILITY_RELATIONSHIPS,
          specialLocations: parsed.specialLocations || INITIAL_SPECIAL_LOCATIONS,
        };
      }
    }
  } catch {
    // Ignore parse errors
  }

  const defaults = buildDefaultDatabaseState();
  await saveDatabaseState(defaults);
  return defaults;
}

export async function saveDatabaseState(state: PersistentDatabaseState): Promise<void> {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors on localStorage
  }

  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put(state, STATE_KEY);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
  } catch {
    // Fallback already saved to localStorage
  }
}
