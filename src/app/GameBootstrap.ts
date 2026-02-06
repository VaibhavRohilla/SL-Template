import {
    PhaseController,
    ActionGate,
    PolicyEnforcer,
    SkipController,
    RecoveryHydrator,
    OutcomeAdapterRegistry,
    globalAdapterRegistry,
    normalizePolicy,
    capabilityFromGamePolicy,
    type ServerRoundState,
    OutcomeReplayRunner,
    type AdapterContext,
    type CascadeOutcome
} from '@fnx/sl-engine';
import { TemplateConfig } from './TemplateConfig.js';
import { ReferenceOutcomeAdapter } from '../adapters/reference/ReferenceOutcomeAdapter.js';
import { ReferenceBackendClient } from '../infra/networking/ReferenceBackendClient.js';
import fixturePack from '../assets/fixtures/reference_p0.json';

/**
 * GameBootstrap
 * 
 * Single source of truth for SDK services used by the template.
 */
export class GameBootstrap {
    private static instance: GameBootstrap;

    private phase: PhaseController;
    private gate: ActionGate;
    private policy: PolicyEnforcer;
    private skip: SkipController;
    private recovery: RecoveryHydrator;
    private adapters: OutcomeAdapterRegistry;

    // P0: Backend & Fixture Services
    private backend: ReferenceBackendClient;
    private replayRunner?: OutcomeReplayRunner;

    private initialized = false;

    private constructor() {
        // Core services setup
        this.phase = new PhaseController();
        this.adapters = globalAdapterRegistry; // Use global or new OutcomeAdapterRegistry() depending on scope

        // Register Reference Adapter
        this.adapters.register(new ReferenceOutcomeAdapter());

        // Initialize Backend Client
        this.backend = new ReferenceBackendClient();

        // Initialize Fixture Runner if needed
        if (TemplateConfig.useFixtures && TemplateConfig.fixturePath) {
            console.log('[Bootstrap] Initializing Fixture Runner with', TemplateConfig.fixturePath);
            this.replayRunner = new OutcomeReplayRunner(this.adapters);
            // Load the imported fixture pack
            this.replayRunner.load(fixturePack as any);
        }

        // Policy Layer
        const rawPolicy = normalizePolicy(TemplateConfig.policy);
        this.policy = new PolicyEnforcer(rawPolicy);

        // Action Gate
        this.gate = new ActionGate(() => this.phase.getPhase(), {
            policyEnforcer: this.policy
        });

        // Skip Controller
        this.skip = new SkipController(
            () => this.phase.getPhase(),
            capabilityFromGamePolicy(rawPolicy)
        );

        // Recovery Hydrator
        this.recovery = new RecoveryHydrator({
            phaseController: this.phase,
            adapterRegistry: this.adapters,
            skipController: this.skip
        });
    }

    public static getInstance(): GameBootstrap {
        if (!GameBootstrap.instance) {
            GameBootstrap.instance = new GameBootstrap();
        }
        return GameBootstrap.instance;
    }

    public static get(): GameBootstrap {
        return this.getInstance();
    }

    /**
     * Initialize services
     */
    public async initialize(): Promise<void> {
        if (this.initialized) return;

        if (TemplateConfig.DEV_MODE) {
            console.log('[Bootstrap] SDK services initialized');
        }

        try {
            // P0: Fetch Init State
            const initRaw = await this.backend.init() as any;

            // Map to ServerRoundState
            // We reuse the adapter. Init response in our mock looks like a spin response with "init" key
            // We need to shape it so toNormalized can read it.
            // Our Mock Init has results.init.data... but Adapter expects results["request-id"]
            // Let's shim it or ensure Adapter can handle "init" or any key

            // For P0, we assume the adapter handles standard TSpinResponse structure.
            // If the mock uses "init" key, we might need to tell adapter to look for it, 
            // OR just fix the mock/adapter to be robust. 
            // In ReferenceOutcomeAdapter, it explicitly looks for "req-1".
            // Implementation Detail: We'll fix the adapter to look for *any* key or "init" if "req-1" missing.

            // But for now, let's just use the adapter instance we registered
            // const adapter = this.adapters.get('reference:wildvodu'); // Hard validation
            // const normalized = adapter.toNormalized(initRaw, { gameId: 'wildvodu' });

            // Actually, we should use the adapter properly.
            // For P0 speed, we will hydrate IF we got valid data.
            // Use a quick check for success.
            if (initRaw && initRaw.success) {
                const results = initRaw.results;
                const initKey = Object.keys(results)[0];
                if (initKey && results[initKey]) {
                    const adapter = this.adapters.get('reference:wildvodu');
                    if (adapter) {
                        const ctx: AdapterContext = { gameId: 'wildvodu' };
                        const normalized = adapter.toNormalized(initRaw, ctx) as CascadeOutcome;

                        // Hydrate stores from the last step of the init outcome
                        const lastStep = normalized.steps[normalized.steps.length - 1];
                        if (lastStep && lastStep.meta) {
                            // Manual hydration if we don't have a ServerRoundState yet
                            // This bridges P0 legacy init to the new Snapshot system
                            const PersistentStoreManager = (await import('../game/persistence/PersistentStoreManager.js')).PersistentStoreManager;
                            PersistentStoreManager.getInstance().hydrateAll({
                                sticky_wilds: { wilds: Object.keys((lastStep.meta as any).stickyWilds || {}) }
                            });
                        }

                        if (TemplateConfig.DEV_MODE) {
                            console.log('[Bootstrap] Hydrated from init state');
                        }
                    }
                }
            }

        } catch (e) {
            console.warn('[Bootstrap] Init failed, starting fresh', e);
        }

        this.initialized = true;
    }

    /**
     * Perform recovery/hydration from server state
     */
    public async hydrate(serverState: ServerRoundState): Promise<void> {
        if (TemplateConfig.DEV_MODE) {
            console.log('[Bootstrap] Hydrating from server state...');
        }
        try {
            const result = await this.recovery.hydrate(serverState);
            if (TemplateConfig.DEV_MODE) {
                console.log('[Bootstrap] Hydration successful. Final phase:', result.finalPhase);
            }
        } catch (error) {
            console.error('[Bootstrap] Hydration failed:', error);
            // In a real app, show fatal error overlay here
        }
    }

    /**
     * Getters for UI and other modules
     */
    public getPhase() { return this.phase; }
    public getGate() { return this.gate; }
    public getPolicy() { return this.policy; }
    public getSkip() { return this.skip; }
    public getRecovery() { return this.recovery; }
    public getAdapters() { return this.adapters; }
    public getBackend() { return this.backend; }
    public getReplayRunner() { return this.replayRunner; }

    /**
     * Dispose of services (cleanup)
     */
    public dispose(): void {
        console.log('[Bootstrap] Disposing SDK services');
        // Add specific cleanup if needed (e.g., unsubscribing from events)
    }
}
