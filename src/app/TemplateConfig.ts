import { type GamePolicy } from '@fnx/sl-engine';

/**
 * Global Template Configuration
 */
export const TemplateConfig = {
    /** Run in developer mode (enhanced logging, debug tools) */
    DEV_MODE: false,

    /** Use fixtures instead of real backend outcomes */
    useFixtures: true,
    fixturePath: 'assets/fixtures/reference_p0.json',

    /** Base URL for the casino backend */
    backendUrl: 'https://api.casino.com/v1',

    /** Default Compliance & Operator Policy */
    policy: {
        allowAutoplay: false,
        allowQuickSpin: true,
        allowSlamStop: true,
        minBet: 0.1,
        maxBet: 100.0,
        minSpinDurationMs: 0,
    } as GamePolicy,
};

export default TemplateConfig;
