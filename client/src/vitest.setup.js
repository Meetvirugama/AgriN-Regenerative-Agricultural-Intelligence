import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Automatically clean up the DOM after each test to prevent state leakage
afterEach(() => {
  cleanup();
});
