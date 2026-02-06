import { type IPersistentFeatureStore, type IPersistentStoreRegistry } from '@fnx/sl-engine';

/**
 * PersistentStoreManager
 * 
 * Manages a collection of persistent feature stores.
 * Facilitates centralized serialization and hydration for recovery snapshots.
 */
export class PersistentStoreManager implements IPersistentStoreRegistry {
    private static instance: PersistentStoreManager;
    private readonly stores: Map<string, IPersistentFeatureStore<any>> = new Map();

    private constructor() { }

    public static getInstance(): PersistentStoreManager {
        if (!PersistentStoreManager.instance) {
            PersistentStoreManager.instance = new PersistentStoreManager();
        }
        return PersistentStoreManager.instance;
    }

    public register<TState>(key: string, store: IPersistentFeatureStore<TState>): void {
        this.stores.set(key, store);
    }

    public get<TState>(key: string): IPersistentFeatureStore<TState> | undefined {
        return this.stores.get(key);
    }

    public serializeAll(): Record<string, any> {
        const state: Record<string, any> = {};
        this.stores.forEach((store, key) => {
            state[key] = store.serialize();
        });
        return state;
    }

    public hydrateAll(state: Record<string, any>): void {
        if (!state) return;
        this.stores.forEach((store, key) => {
            if (state[key] !== undefined) {
                store.hydrate(state[key]);
            }
        });
    }

    public resetAll(): void {
        this.stores.forEach((store) => {
            store.reset?.();
        });
    }
}
