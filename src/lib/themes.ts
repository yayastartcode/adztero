export interface Theme {
    id: string;
    name: string;
    description: string;
    colors: {
        primary: string;
        primaryDark: string;
        secondary: string;
        background: string;
        surface: string;
        text: string;
        textLight: string;
        accent: string;
        border: string;
    };
    fonts: {
        heading: string;
        body: string;
    };
}

export const themes: Record<string, Theme> = {
    ocean: {
        id: 'ocean',
        name: 'Ocean Breeze',
        description: 'Calm blues and teals inspired by the ocean',
        colors: {
            primary: '#0ea5e9',
            primaryDark: '#0284c7',
            secondary: '#06b6d4',
            background: '#f0f9ff',
            surface: '#ffffff',
            text: '#0c4a6e',
            textLight: '#64748b',
            accent: '#06b6d4',
            border: '#bae6fd',
        },
        fonts: {
            heading: 'Inter, sans-serif',
            body: 'Inter, sans-serif',
        },
    },

    sunset: {
        id: 'sunset',
        name: 'Sunset Glow',
        description: 'Warm oranges and pinks like a beautiful sunset',
        colors: {
            primary: '#f97316',
            primaryDark: '#ea580c',
            secondary: '#fb923c',
            background: '#fff7ed',
            surface: '#ffffff',
            text: '#7c2d12',
            textLight: '#78716c',
            accent: '#fb923c',
            border: '#fed7aa',
        },
        fonts: {
            heading: 'Outfit, sans-serif',
            body: 'Inter, sans-serif',
        },
    },

    forest: {
        id: 'forest',
        name: 'Forest Green',
        description: 'Natural greens inspired by lush forests',
        colors: {
            primary: '#10b981',
            primaryDark: '#059669',
            secondary: '#34d399',
            background: '#f0fdf4',
            surface: '#ffffff',
            text: '#064e3b',
            textLight: '#6b7280',
            accent: '#34d399',
            border: '#bbf7d0',
        },
        fonts: {
            heading: 'Space Grotesk, sans-serif',
            body: 'Inter, sans-serif',
        },
    },

    midnight: {
        id: 'midnight',
        name: 'Midnight Dark',
        description: 'Sleek dark theme with purple accents',
        colors: {
            primary: '#8b5cf6',
            primaryDark: '#7c3aed',
            secondary: '#a78bfa',
            background: '#0f172a',
            surface: '#1e293b',
            text: '#f1f5f9',
            textLight: '#cbd5e1',
            accent: '#a78bfa',
            border: '#334155',
        },
        fonts: {
            heading: 'Poppins, sans-serif',
            body: 'Inter, sans-serif',
        },
    },

    cherry: {
        id: 'cherry',
        name: 'Cherry Blossom',
        description: 'Soft pinks and rose tones',
        colors: {
            primary: '#ec4899',
            primaryDark: '#db2777',
            secondary: '#f472b6',
            background: '#fdf2f8',
            surface: '#ffffff',
            text: '#831843',
            textLight: '#78716c',
            accent: '#f472b6',
            border: '#fbcfe8',
        },
        fonts: {
            heading: 'Playfair Display, serif',
            body: 'Inter, sans-serif',
        },
    },

    slate: {
        id: 'slate',
        name: 'Minimalist Slate',
        description: 'Clean and minimal gray tones',
        colors: {
            primary: '#475569',
            primaryDark: '#334155',
            secondary: '#64748b',
            background: '#f8fafc',
            surface: '#ffffff',
            text: '#0f172a',
            textLight: '#64748b',
            accent: '#3b82f6',
            border: '#e2e8f0',
        },
        fonts: {
            heading: 'Inter, sans-serif',
            body: 'Inter, sans-serif',
        },
    },

    golden: {
        id: 'golden',
        name: 'Golden Luxury',
        description: 'Elegant gold and brown tones',
        colors: {
            primary: '#d97706',
            primaryDark: '#b45309',
            secondary: '#f59e0b',
            background: '#fffbeb',
            surface: '#ffffff',
            text: '#78350f',
            textLight: '#78716c',
            accent: '#fbbf24',
            border: '#fde68a',
        },
        fonts: {
            heading: 'Merriweather, serif',
            body: 'Lora, serif',
        },
    },

    cyber: {
        id: 'cyber',
        name: 'Cyberpunk',
        description: 'Neon cyan and magenta',
        colors: {
            primary: '#06b6d4',
            primaryDark: '#0891b2',
            secondary: '#ec4899',
            background: '#020617',
            surface: '#0f172a',
            text: '#f0f9ff',
            textLight: '#94a3b8',
            accent: '#ec4899',
            border: '#1e293b',
        },
        fonts: {
            heading: 'Orbitron, sans-serif',
            body: 'Roboto Mono, monospace',
        },
    },

    lavender: {
        id: 'lavender',
        name: 'Lavender Dream',
        description: 'Soft purples and lavender tones',
        colors: {
            primary: '#a855f7',
            primaryDark: '#9333ea',
            secondary: '#c084fc',
            background: '#faf5ff',
            surface: '#ffffff',
            text: '#581c87',
            textLight: '#6b7280',
            accent: '#c084fc',
            border: '#e9d5ff',
        },
        fonts: {
            heading: 'Quicksand, sans-serif',
            body: 'Inter, sans-serif',
        },
    },

    earth: {
        id: 'earth',
        name: 'Earthy Terracotta',
        description: 'Warm earth tones and terracotta',
        colors: {
            primary: '#b45309',
            primaryDark: '#92400e',
            secondary: '#d97706',
            background: '#fef3c7',
            surface: '#ffffff',
            text: '#451a03',
            textLight: '#78716c',
            accent: '#f59e0b',
            border: '#fcd34d',
        },
        fonts: {
            heading: 'Josefin Sans, sans-serif',
            body: 'Source Sans Pro, sans-serif',
        },
    },

    arctic: {
        id: 'arctic',
        name: 'Arctic White',
        description: 'Cool whites and icy blues',
        colors: {
            primary: '#0891b2',
            primaryDark: '#0e7490',
            secondary: '#06b6d4',
            background: '#ecfeff',
            surface: '#ffffff',
            text: '#164e63',
            textLight: '#64748b',
            accent: '#22d3ee',
            border: '#cffafe',
        },
        fonts: {
            heading: 'Raleway, sans-serif',
            body: 'Open Sans, sans-serif',
        },
    },

    royal: {
        id: 'royal',
        name: 'Royal Purple',
        description: 'Regal purples and deep blues',
        colors: {
            primary: '#6366f1',
            primaryDark: '#4f46e5',
            secondary: '#818cf8',
            background: '#eef2ff',
            surface: '#ffffff',
            text: '#312e81',
            textLight: '#64748b',
            accent: '#818cf8',
            border: '#c7d2fe',
        },
        fonts: {
            heading: 'Montserrat, sans-serif',
            body: 'Nunito, sans-serif',
        },
    },
};

export const defaultTheme = themes.ocean;

export function getTheme(themeId?: string): Theme {
    if (!themeId) return defaultTheme;
    return themes[themeId] || defaultTheme;
}

export function getAllThemes(): Theme[] {
    return Object.values(themes);
}
