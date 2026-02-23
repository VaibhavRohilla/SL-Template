/**
 * Main Entry Point
 * 
 * Simple wrapper that calls bootstrap.
 */

import { bootstrap } from './bootstrap/bootstrap.js';

// Start when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
}

export { bootstrap };
