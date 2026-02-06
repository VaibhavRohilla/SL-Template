

interface SpinRequest {
    credit: number;
    isBuyFeature?: boolean;
    seed?: string;
    persistentData?: Record<string, unknown>;
    force?: unknown[];
}

import { TemplateConfig } from '../../app/TemplateConfig';

/**
 * ReferenceBackendClient
 * 
 * Networking wrapper for the "wildvodu" reference game API.
 * Returns RAW JSON responses.
 */
export class ReferenceBackendClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = TemplateConfig.backendUrl || 'http://10.70.6.20:5000/api/v1/wildvodu';
    }

    public async config(): Promise<unknown> {
        return this.get(`${this.baseUrl}/config`);
    }

    public async init(): Promise<unknown> {
        if (TemplateConfig.useFixtures) {
            console.log('[RefClient] Returning Mock Init State');
            // Return a "base-lose" equivalent (idle state)
            return {
                success: true,
                balance: 1000,
                results: {
                    "init": {
                        data: {
                            gameType: "wildvodu",
                            betAmount: 10,
                            currentSpinWon: 0,
                            totalWon: 0,
                            current: { next: 1 },
                            spinResult: {
                                grid: [
                                    [5, 6, 7, 8],
                                    [1, 2, 3, 4],
                                    [5, 6, 7, 8],
                                    [1, 2, 3, 4],
                                    [5, 6, 7, 8]
                                ],
                                lines: [],
                                scatterCount: 0,
                                scatterPositions: [],
                                triggerFreeGame: false,
                                stickyWilds: {}
                            }
                        }
                    }
                }
            };
        }
        // Fallback to config or dedicated init if available
        return this.get(`${this.baseUrl}/init`).catch(() => this.config());
    }

    public async spin(request: SpinRequest): Promise<unknown> {
        if (TemplateConfig.useFixtures) {
            // Emulate slight network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            // In a real runner, we'd pick from the fixture pack.
            // For P0 CustomGameScene usage, we accept we might need the Runner output.
            // But if CustomGameScene calls this directly, we return a mock spin.
            // Let's return a WIN spin for variety if using fixtures
            return {
                success: true,
                balance: 1050,
                results: {
                    "req-1": {
                        data: {
                            gameType: "wildvodu",
                            betAmount: 10,
                            currentSpinWon: 50,
                            totalWon: 50,
                            current: { next: 1 },
                            spinResult: {
                                grid: [[1, 1, 1, 1], [2, 2, 2, 2], [3, 3, 3, 3], [4, 4, 4, 4], [5, 5, 5, 5]],
                                lines: [{ s: 1, w: 50, mc: 5, p: [0, 0, 0, 0, 0] }],
                                scatterCount: 0,
                                scatterPositions: [],
                                triggerFreeGame: false,
                                stickyWilds: {}
                            }
                        }
                    }
                }
            };
        }
        return this.post(`${this.baseUrl}/play`, request);
    }

    private async get(url: string): Promise<unknown> {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`ReferenceClient GET ${url} failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }

    private async post(url: string, body: unknown): Promise<unknown> {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`ReferenceClient POST ${url} failed: ${response.status} ${text.substring(0, 100)}`);
        }
        return response.json();
    }
}
