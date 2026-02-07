/**
 * RealmsRPG Environment Configuration
 * =====================================
 * SINGLE SOURCE OF TRUTH for all environment-specific variables.
 * 
 * This file auto-detects the current environment (prod vs test) based on the hostname.
 * When copying this codebase to your test repository, you only need to update
 * the values in the TEST configuration below.
 * 
 * IMPORTANT: This file does NOT contain secrets (like API secret keys).
 * Real secrets are stored in Google Cloud Secret Manager and accessed via Cloud Functions.
 * The values here are PUBLIC (safe to commit) like reCAPTCHA site keys, domain names, etc.
 */

// =============================================================================
// ENVIRONMENT CONFIGURATIONS
// =============================================================================

/**
 * PRODUCTION Environment Configuration
 * These values are for your production Firebase project: realmsrpg
 */
const PROD_CONFIG = {
    // Environment identifier
    ENV_NAME: 'production',
    
    // Custom auth domain (your production custom domain)
    AUTH_DOMAIN: 'realmsroleplaygame.com',
    
    // reCAPTCHA v3 Site Key - set via inject script: npm run inject-env-vanilla
    RECAPTCHA_SITE_KEY: '__RECAPTCHA_SITE_KEY_PROD__',
    
    // Production hostnames that should use this config
    // Add all domains/subdomains that serve your production site
    HOSTNAMES: [
        'realmsroleplaygame.com',
        'www.realmsroleplaygame.com',
        'realmsrpg.web.app',
        'realmsrpg.firebaseapp.com'
    ]
};

/**
 * TEST/STAGING Environment Configuration
 * These values are for your test Firebase project: realmsrpg-test
 */
const TEST_CONFIG = {
    // Environment identifier
    ENV_NAME: 'test',
    
    // Auth domain for test Firebase project
    AUTH_DOMAIN: 'realmsrpg-test.firebaseapp.com',
    
    // reCAPTCHA v3 Site Key - set via inject script: npm run inject-env-vanilla
    RECAPTCHA_SITE_KEY: '__RECAPTCHA_SITE_KEY_TEST__',
    
    // Test/staging hostnames that should use this config
    HOSTNAMES: [
        'localhost',
        '127.0.0.1',
        'realmsrpg-test.web.app',
        'realmsrpg-test.firebaseapp.com',
        'test.realmsroleplaygame.com'
    ]
};

// =============================================================================
// ENVIRONMENT DETECTION
// =============================================================================

/**
 * Detects the current environment based on the hostname.
 * Returns 'production', 'test', or 'unknown'
 */
function detectEnvironment() {
    const hostname = window.location.hostname.toLowerCase();
    
    // Check if hostname matches production
    if (PROD_CONFIG.HOSTNAMES.some(h => hostname === h.toLowerCase())) {
        return 'production';
    }
    
    // Check if hostname matches test
    if (TEST_CONFIG.HOSTNAMES.some(h => hostname === h.toLowerCase())) {
        return 'test';
    }
    
    // Default to test for unknown hostnames (safer for development)
    console.warn(`[Environment] Unknown hostname: ${hostname}. Defaulting to test environment.`);
    return 'test';
}

/**
 * Gets the configuration for the current environment.
 * @returns {Object} The environment configuration object
 */
function getConfig() {
    const env = detectEnvironment();
    const config = env === 'production' ? PROD_CONFIG : TEST_CONFIG;
    
    // Log environment detection (helpful for debugging)
    console.debug(`[Environment] Detected: ${config.ENV_NAME} (hostname: ${window.location.hostname})`);
    
    return config;
}

// =============================================================================
// EXPORTS - Use these throughout the application
// =============================================================================

// Get the current environment config (cached)
const ENV = getConfig();

/**
 * Current environment name: 'production' or 'test'
 */
export const ENV_NAME = ENV.ENV_NAME;

/**
 * The auth domain to use for Firebase Authentication
 */
export const AUTH_DOMAIN = ENV.AUTH_DOMAIN;

/**
 * The reCAPTCHA v3 site key for App Check
 */
export const RECAPTCHA_SITE_KEY = ENV.RECAPTCHA_SITE_KEY;

/**
 * Whether this is the production environment
 */
export const IS_PRODUCTION = ENV.ENV_NAME === 'production';

/**
 * Whether this is the test environment
 */
export const IS_TEST = ENV.ENV_NAME === 'test';

/**
 * Get the full environment config object
 * @returns {Object} The current environment configuration
 */
export function getEnvironmentConfig() {
    return { ...ENV };
}

/**
 * Utility to check if running locally
 */
export const IS_LOCAL = ['localhost', '127.0.0.1'].includes(window.location.hostname.toLowerCase());

// =============================================================================
// GLOBAL EXPOSURE FOR NON-MODULE SCRIPTS (compat SDK pattern)
// =============================================================================
// Some pages use Firebase compat SDK via script tags and can't import ES modules.
// This makes the config available globally for those cases.
window.RealmsEnv = {
    ENV_NAME,
    AUTH_DOMAIN,
    RECAPTCHA_SITE_KEY,
    IS_PRODUCTION,
    IS_TEST,
    IS_LOCAL,
    getEnvironmentConfig
};

// Export default for convenience
export default {
    ENV_NAME,
    AUTH_DOMAIN,
    RECAPTCHA_SITE_KEY,
    IS_PRODUCTION,
    IS_TEST,
    IS_LOCAL,
    getEnvironmentConfig
};
