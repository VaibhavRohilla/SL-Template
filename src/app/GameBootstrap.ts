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
    type ServerRoundState
} from '@fnx/sl-engine';
import { TemplateConfig } from './TemplateConfig.js';

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

    private initialized = false;

    private constructor() {
        // Core services setup
        this.phase = new PhaseController();
        this.adapters = globalAdapterRegistry;

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

    /**
     * Dispose of services (cleanup)
     */
    public dispose(): void {
        console.log('[Bootstrap] Disposing SDK services');
        // Add specific cleanup if needed (e.g., unsubscribing from events)
    }
}
