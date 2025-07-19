import '@testing-library/jest-dom'

// Mock environment variables for tests
(process.env as any).NODE_ENV = 'test';
(process.env as any).NEXT_PUBLIC_API_URL = 'http://localhost:3001';
(process.env as any).NEXT_PUBLIC_STORAGE_URL = 'http://localhost:9000';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const React = require('react');
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', { ...props, alt: props.alt || '' });
  },
}))

// Mock Web APIs that might be missing in test environment
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock Audio API for audio components
global.HTMLMediaElement.prototype.play = jest.fn()
global.HTMLMediaElement.prototype.pause = jest.fn()
global.HTMLMediaElement.prototype.load = jest.fn()

// Mock WaveSurfer.js
jest.mock('wavesurfer.js', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      load: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      stop: jest.fn(),
      destroy: jest.fn(),
      setVolume: jest.fn(),
      setPlaybackRate: jest.fn(),
      getDuration: jest.fn(() => 100),
      getCurrentTime: jest.fn(() => 0),
      on: jest.fn(),
      un: jest.fn(),
    })),
  },
}))

// Mock Tone.js
jest.mock('tone', () => ({
  Player: jest.fn().mockImplementation(() => ({
    load: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    dispose: jest.fn(),
  })),
  Transport: {
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
  },
}))