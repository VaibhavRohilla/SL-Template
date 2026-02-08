/**
 * Reference Asset Mapping
 * 
 * Maps logical UI keys to actual texture/font identifiers from the reference assets.
 */

export const UI_ASSETS = {
    // Spritesheets
    PANELS_ATLAS: 'uiPanels_0__1x',
    POST_INTRO_ATLAS: 'post_intro_assets_1x',

    // Loading Screen
    LOADING: {
        BACKGROUND: 'Locker',
        BACKGROUND_PORTRAIT: 'LoadingScreenBg_Portrait',
        BAR: 'Loading_Bar',
        LOGO: 'Logo',
        LOGO_PORTRAIT: 'Logo_Portrait',
        SPINNER: 'loading'
    },

    // UI Buttons
    SPIN_BTN: {
        IDLE: 'SPIN',
        OVER: 'SPIN_mouse-ver',
        DOWN: 'SPIN_pressed',
        DISABLED: 'SPIN_disabled'
    },
    STOP_BTN: {
        IDLE: 'STOP',
        OVER: 'STOP_mouse-ver',
        DOWN: 'STOP_pressed',
        DISABLED: 'STOP_disabled'
    },
    AUTO_BTN: {
        IDLE: 'AUTOSPIN',
        OVER: 'AUTOSPIN_mouse-ver',
        DOWN: 'AUTOSPIN_pressed',
        DISABLED: 'AUTOSPIN_disabled'
    },
    TURBO_BTN: {
        ON: 'TURBO_ON',
        OFF: 'TURBO_OFF',
        OVER_ON: 'TURBO_ON_mouse-ver',
        OVER_OFF: 'TURBO_OFF_mouse-ver'
    },
    BET_CONTROLS: {
        MINUS: 'Left_arrow',
        PLUS: 'Right_arrow',
        MINUS_OVER: 'Left_arrow_mouse-ver',
        PLUS_OVER: 'Right_arrow_mouse-ver'
    },

    // UI Icons / Overlays
    ICONS: {
        HOME: 'Home',
        INFO: 'I',
        SOUND_ON: 'SOUND_ON',
        SOUND_OFF: 'SOUND_OFF'
    },

    // Backgrounds / Frames
    SCENE: {
        BACKGROUND: 'Background',
        BACKGROUND_PORTRAIT: 'Background_portrait',
        FRAME: 'Reel',
        CONSOLE_BAND: 'Band'
    },

    // Common UI Assets (usually in atlas)
    COMMON: {
        CELL: 'GameTable/Common/cell',
        CELL_RED: 'GameTable/Common/red_cell',
        STAR_YELLOW: 'GameTable/Common/yellow_star',
        STAR_GREEN: 'GameTable/Common/green_star'
    },

    // Effects
    EFFECTS: {
        DRAGON_APPEAR: 'GameTable/Table/dragon_appear/appear_'
    },

    // Labels
    LABELS: {
        BALANCE: 'balance',
        BET: 'bet',
        WIN: 'win'
    },

    // Fonts
    FONTS: {
        MAIN: 'fonts/MotleyForces',
        SECONDARY: 'fonts/MotleyForces' // Fallback if Gang is missing or mapped here
    },

    // Audio Keys (from SFX sprite)
    AUDIO: {
        SPIN: 'spin_start',
        WHEEL_STOP: 'reel_stop',
        WIN_SMALL: 'win_low',
        WIN_BIG: 'win_high',
        CLICK: 'button_click'
    }
} as const;

export type UIAssetKey = keyof typeof UI_ASSETS;
