import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  // This app renders only its own components (+ adkit's unstyled ones), so we
  // scan only this repo's source. The theme below maps Tailwind tokens onto the
  // app-owned CSS variables defined in src/styles/index.css. Nothing here is
  // inherited from @fretwork/lib (that lib is logic-only — no styling).
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // App-owned accent palette (per-theme values in src/styles/index.css).
        beat: 'hsl(var(--beat) / <alpha-value>)',
        pop: 'hsl(var(--pop) / <alpha-value>)',
        info: 'hsl(var(--info) / <alpha-value>)',
        mint: 'hsl(var(--mint) / <alpha-value>)',
        // Rock Mode (concert takeover): a theme-invariant punk/glam neon palette
        // (Bowie / Sex Pistols / Sgt-Pepper) — same loud colors in both themes,
        // sitting on the near-black `rk-ink` stage. Values in src/styles/index.css.
        'rk-pink': 'hsl(var(--rk-pink) / <alpha-value>)',
        'rk-blue': 'hsl(var(--rk-blue) / <alpha-value>)',
        'rk-yellow': 'hsl(var(--rk-yellow) / <alpha-value>)',
        'rk-red': 'hsl(var(--rk-red) / <alpha-value>)',
        'rk-cyan': 'hsl(var(--rk-cyan) / <alpha-value>)',
        'rk-ink': 'hsl(var(--rk-ink) / <alpha-value>)',
        'rk-ink-2': 'hsl(var(--rk-ink-2) / <alpha-value>)',
        'rk-outline': 'hsl(var(--rk-outline) / <alpha-value>)', // punk black cut-out outline/shadow
        'rk-paper': 'hsl(var(--rk-paper) / <alpha-value>)', // ransom-note white

        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        card: 'hsl(var(--card) / <alpha-value>)',
        'card-foreground': 'hsl(var(--card-foreground) / <alpha-value>)',
        popover: 'hsl(var(--popover) / <alpha-value>)',
        'popover-foreground': 'hsl(var(--popover-foreground) / <alpha-value>)',
        primary: 'hsl(var(--primary) / <alpha-value>)',
        'primary-foreground': 'hsl(var(--primary-foreground) / <alpha-value>)',
        secondary: 'hsl(var(--secondary) / <alpha-value>)',
        'secondary-foreground': 'hsl(var(--secondary-foreground) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        'muted-foreground': 'hsl(var(--muted-foreground) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
        'accent-foreground': 'hsl(var(--accent-foreground) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        overlay: 'hsl(var(--overlay) / <alpha-value>)',
        'pop-foreground': 'hsl(var(--pop-foreground) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        // Rounded display face for both "fun" themes' wordmark. Body/control type
        // is swapped to Fredoka/Baloo via the :root.theme-* overrides in index.css.
        display: ['Fredoka', '"Baloo 2"', 'ui-rounded', 'system-ui', 'sans-serif'],
        // Condensed heavy poster face for Rock Mode's punk lettering (ransom notes,
        // countdown, STOP). Falls back to Impact-class faces before generic sans.
        punk: ['Anton', 'Impact', '"Arial Narrow"', 'ui-sans-serif', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // App-owned size tokens (the lib provides no size system beyond --radius).
      boxShadow: {
        // 3D "chunky" control depths (the offset color is the themed --shadow).
        btn: '0 3px 0 hsl(var(--shadow))',
        transport: '0 5px 0 hsl(var(--shadow))',
        'transport-play': '0 6px 0 hsl(var(--primary-foreground))',
        'transport-play-active': '0 1px 0 hsl(var(--primary-foreground))',
        // Beat-pill glows.
        'glow-primary': '0 0 22px -2px hsl(var(--primary))',
        'glow-pop': '0 0 22px -2px hsl(var(--pop))',
        'glow-beat': '0 0 18px -4px hsl(var(--beat))',
        'glow-beat-sm': '0 0 10px -3px hsl(var(--beat))',
        // Slider thumb (used by the shadcn Slider).
        thumb: '0 1px 3px hsl(var(--shadow) / 0.8)',
        // Upward shadow lifting the docked control deck off the screen.
        deck: '0 -8px 24px -12px hsl(var(--shadow))',
      },
      fontSize: {
        '2xs': '0.625rem', // 10px — eyebrow/overline labels
      },
      letterSpacing: {
        label: '0.3em', // footer eyebrow labels
        'label-sm': '0.2em', // tighter eyebrow (calibration title)
      },
      translate: {
        press: '3px', // 3D control "press-down" travel
        'press-lg': '5px', // transport press travel
      },
      borderWidth: {
        thumb: '3px', // slider thumb ring
      },
      maxWidth: {
        arc: '300px', // beat-arc / readout column (deck expanded)
        'arc-lg': '380px', // larger beat-arc when the deck is collapsed (pulse fills the space)
        'arc-compact': '170px', // arc when the hero is enlarged
      },
      maxHeight: {
        dialog: '85vh', // scrollable dialog content
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'beat-pop': {
          '0%': { transform: 'scale(0.82)' },
          '60%': { transform: 'scale(1.06)' },
          '100%': { transform: 'scale(1)' },
        },
        // Tempo-trainer "reached target" cue on the BPM readout (beat → pop → beat).
        'bpm-flash': {
          '0%, 100%': { color: 'hsl(var(--beat))' },
          '50%': { color: 'hsl(var(--pop))' },
        },
        // Rock Mode (punk/glam concert takeover).
        'rock-spin': { to: { transform: 'rotate(360deg)' } }, // comic speed-lines
        'rock-throb': {
          // downbeat brightness kick on the speed-lines / bolts
          '0%': { filter: 'brightness(1)' },
          '30%': { filter: 'brightness(2.2)' },
          '100%': { filter: 'brightness(1)' },
        },
        'rock-count': {
          '0%': { opacity: '0', transform: 'scale(2.4) rotate(-6deg)' },
          '40%': { opacity: '1', transform: 'scale(1) rotate(-3deg)' },
          '100%': { opacity: '1', transform: 'scale(0.94) rotate(-3deg)' },
        },
        'rock-go': {
          '0%': { opacity: '0', transform: 'scale(0.4) rotate(-3deg)' },
          '45%': { opacity: '1', transform: 'scale(1.25) rotate(-3deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(-3deg)' },
        },
        // Level-up ransom flare — flashes in, then reverts to its base opacity-0
        // (no forwards fill), so it only shows on an actual milestone bump.
        'rock-flare': {
          '0%': { opacity: '0', transform: 'translateY(14px) scale(0.7)' },
          '25%': { opacity: '1', transform: 'translateY(0) scale(1.06)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'rock-victory': {
          '0%': { opacity: '0', transform: 'scale(0.5) rotate(-4deg)' },
          '50%': { transform: 'scale(1.12) rotate(2deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        // Mascot: beat-synced headbang, pendulum swing (pivots at the base), strum.
        'rock-headbang': {
          '0%, 100%': { transform: 'rotate(-7deg)' },
          '50%': { transform: 'rotate(7deg) translateY(-3px)' },
        },
        'rock-swing': {
          '0%, 100%': { transform: 'rotate(14deg)' },
          '50%': { transform: 'rotate(-14deg)' },
        },
        'rock-strum': {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        'rock-fall': {
          '0%': { transform: 'translateY(-30px) rotate(0)' },
          '100%': { transform: 'translateY(860px) rotate(720deg)' },
        },
        'rock-pulse': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
        'rock-boltpulse': {
          '0%, 100%': { opacity: '0.82', filter: 'brightness(1)' },
          '50%': { opacity: '1', filter: 'brightness(1.4)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 120ms ease-out',
        'beat-pop': 'beat-pop 140ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'bpm-flash': 'bpm-flash 600ms ease-in-out',
        'rock-spin': 'rock-spin 18s linear infinite',
        'rock-spin-rev': 'rock-spin 30s linear infinite reverse',
        'rock-count': 'rock-count 580ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'rock-go': 'rock-go 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'rock-flare': 'rock-flare 900ms ease-out',
        'rock-victory': 'rock-victory 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        // Duration is overridden inline from the live BPM (see RockstarMascot).
        'rock-headbang': 'rock-headbang 480ms ease-in-out infinite',
        'rock-swing': 'rock-swing 960ms ease-in-out infinite',
        'rock-strum': 'rock-strum 240ms ease-in-out infinite',
        'rock-fall': 'rock-fall 2400ms linear forwards',
        'rock-pulse': 'rock-pulse 1000ms ease-in-out infinite',
        'rock-boltpulse': 'rock-boltpulse 1200ms ease-in-out infinite',
      },
    },
  },
  plugins: [animate],
};

export default config;
