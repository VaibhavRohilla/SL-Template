export interface TLine {
    s: number;         // Symbol ID
    l: number[];       // Symbols in the line
    mc: number;        // Match count
    w: number;         // Win amount
    p: number[];       // Positions (row index per col, length = cols)
}

export interface TStickyWilds {
    [key: string]: number; // Format: "row,col": 1 (or "col,row", need to verify, but treating as string key for P0)
}

export interface TSpinResult {
    grid: number[][]; // [col][row] Column-Major
    lines: TLine[];
    scatterCount: number;
    scatterPositions: number[][]; // [col, row]
    triggerFreeGame: boolean;
    respinsOffer?: number;
    stickyWilds: TStickyWilds;
}

export interface TGameData {
    gameType: string;
    betAmount: number;
    spinResult: TSpinResult;
    current: { next: number };
    currentSpinWon: number;
    totalWon: number;
}

export interface TResultsMap {
    [key: string]: {
        data: TGameData | TGameData[];
    };
}

export interface TSpinResponse {
    success: boolean;
    balance: number;
    results: TResultsMap;
    session?: unknown;
}
