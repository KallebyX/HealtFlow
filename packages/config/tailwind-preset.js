/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  darkMode: ['class'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // ═══════════════════════════════════════════════════════════════════════
      // COLORS - HealthFlow Brand + shadcn/ui Compatible
      // ═══════════════════════════════════════════════════════════════════════
      colors: {
        // shadcn/ui CSS Variables
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          // HealthFlow Green Scale
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          // Slate Scale
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          // Purple Scale for accents
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
          950: '#4a044e',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Healthcare-specific Colors
        triage: {
          emergency: '#dc2626',    // Red - Emergência
          urgent: '#f97316',       // Orange - Urgente
          priority: '#eab308',     // Yellow - Prioritário
          standard: '#22c55e',     // Green - Padrão
          nonurgent: '#3b82f6',    // Blue - Não Urgente
        },
        status: {
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
          pending: '#8b5cf6',
        },
        medical: {
          blood: '#dc2626',
          oxygen: '#3b82f6',
          heart: '#ec4899',
          bone: '#f5f5f4',
          muscle: '#b91c1c',
          nerve: '#fbbf24',
        },
        appointment: {
          scheduled: '#3b82f6',
          confirmed: '#22c55e',
          inProgress: '#f59e0b',
          completed: '#6b7280',
          cancelled: '#ef4444',
          noShow: '#9333ea',
        },
      },

      // ═══════════════════════════════════════════════════════════════════════
      // TYPOGRAPHY
      // ═══════════════════════════════════════════════════════════════════════
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        '3xs': ['0.5rem', { lineHeight: '0.625rem' }],
      },
      letterSpacing: {
        tightest: '-0.05em',
      },

      // ═══════════════════════════════════════════════════════════════════════
      // SPACING & SIZING
      // ═══════════════════════════════════════════════════════════════════════
      spacing: {
        4.5: '1.125rem',
        5.5: '1.375rem',
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
        144: '36rem',
      },
      width: {
        'sidebar-collapsed': '4.5rem',
        'sidebar-expanded': '16rem',
      },
      height: {
        'header': '4rem',
        'screen-minus-header': 'calc(100vh - 4rem)',
      },
      minHeight: {
        'screen-minus-header': 'calc(100vh - 4rem)',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },

      // ═══════════════════════════════════════════════════════════════════════
      // BORDERS & SHADOWS
      // ═══════════════════════════════════════════════════════════════════════
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-lg': '0 0 30px rgba(34, 197, 94, 0.4)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },

      // ═══════════════════════════════════════════════════════════════════════
      // ANIMATIONS
      // ═══════════════════════════════════════════════════════════════════════
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-out': 'fadeOut 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.2s ease-in',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-soft': 'bounceSoft 1s infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        'typing': 'typing 3s steps(30, end)',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.1)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.1)' },
          '70%': { transform: 'scale(1)' },
        },
        typing: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },

      // ═══════════════════════════════════════════════════════════════════════
      // TRANSITIONS
      // ═══════════════════════════════════════════════════════════════════════
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // ═══════════════════════════════════════════════════════════════════════
      // Z-INDEX
      // ═══════════════════════════════════════════════════════════════════════
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'drawer': '1040',
        'modal-backdrop': '1050',
        'modal': '1060',
        'popover': '1070',
        'tooltip': '1080',
        'toast': '1090',
      },

      // ═══════════════════════════════════════════════════════════════════════
      // BACKGROUNDS
      // ═══════════════════════════════════════════════════════════════════════
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-healthflow': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        'gradient-medical': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        'mesh-gradient': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
      },

      // ═══════════════════════════════════════════════════════════════════════
      // GRID
      // ═══════════════════════════════════════════════════════════════════════
      gridTemplateColumns: {
        'sidebar': '16rem 1fr',
        'sidebar-collapsed': '4.5rem 1fr',
        'form-2': 'repeat(2, minmax(0, 1fr))',
        'form-3': 'repeat(3, minmax(0, 1fr))',
        'dashboard': 'repeat(auto-fit, minmax(300px, 1fr))',
      },
      gridTemplateRows: {
        'app': 'auto 1fr auto',
      },

      // ═══════════════════════════════════════════════════════════════════════
      // ASPECT RATIOS
      // ═══════════════════════════════════════════════════════════════════════
      aspectRatio: {
        'portrait': '3/4',
        'landscape': '4/3',
        'ultrawide': '21/9',
      },
    },
  },
  plugins: [
    // Add base layer styles for shadcn/ui compatibility
    function({ addBase }) {
      addBase({
        ':root': {
          '--background': '0 0% 100%',
          '--foreground': '222.2 84% 4.9%',
          '--card': '0 0% 100%',
          '--card-foreground': '222.2 84% 4.9%',
          '--popover': '0 0% 100%',
          '--popover-foreground': '222.2 84% 4.9%',
          '--primary': '142.1 76.2% 36.3%',
          '--primary-foreground': '355.7 100% 97.3%',
          '--secondary': '210 40% 96.1%',
          '--secondary-foreground': '222.2 47.4% 11.2%',
          '--muted': '210 40% 96.1%',
          '--muted-foreground': '215.4 16.3% 46.9%',
          '--accent': '210 40% 96.1%',
          '--accent-foreground': '222.2 47.4% 11.2%',
          '--destructive': '0 84.2% 60.2%',
          '--destructive-foreground': '210 40% 98%',
          '--border': '214.3 31.8% 91.4%',
          '--input': '214.3 31.8% 91.4%',
          '--ring': '142.1 76.2% 36.3%',
          '--radius': '0.5rem',
        },
        '.dark': {
          '--background': '222.2 84% 4.9%',
          '--foreground': '210 40% 98%',
          '--card': '222.2 84% 4.9%',
          '--card-foreground': '210 40% 98%',
          '--popover': '222.2 84% 4.9%',
          '--popover-foreground': '210 40% 98%',
          '--primary': '142.1 70.6% 45.3%',
          '--primary-foreground': '144.9 80.4% 10%',
          '--secondary': '217.2 32.6% 17.5%',
          '--secondary-foreground': '210 40% 98%',
          '--muted': '217.2 32.6% 17.5%',
          '--muted-foreground': '215 20.2% 65.1%',
          '--accent': '217.2 32.6% 17.5%',
          '--accent-foreground': '210 40% 98%',
          '--destructive': '0 62.8% 30.6%',
          '--destructive-foreground': '210 40% 98%',
          '--border': '217.2 32.6% 17.5%',
          '--input': '217.2 32.6% 17.5%',
          '--ring': '142.4 71.8% 29.2%',
        },
      });
    },
    // Add component utilities
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'hsl(var(--border))',
            borderRadius: '3px',
          },
        },
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.drag-none': {
          '-webkit-user-drag': 'none',
          '-khtml-user-drag': 'none',
          '-moz-user-drag': 'none',
          '-o-user-drag': 'none',
          'user-drag': 'none',
        },
        '.glass': {
          'background': 'rgba(255, 255, 255, 0.8)',
          'backdrop-filter': 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
        },
        '.glass-dark': {
          'background': 'rgba(15, 23, 42, 0.8)',
          'backdrop-filter': 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
        },
      });
    },
  ],
};
