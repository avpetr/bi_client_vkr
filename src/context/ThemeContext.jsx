import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { 
    getAllThemes, 
    getThemeById, 
    getActiveThemeId, 
    setActiveTheme,
    saveCustomTheme,
    deleteCustomTheme,
    exportTheme,
    importTheme,
    initializeCustomCSS
} from '../services/themeStorage';

const ThemeContext = createContext();

export const useThemeMode = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeMode must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    // Load active theme
    const [currentThemeId, setCurrentThemeId] = useState(() => getActiveThemeId());
    const [allThemes, setAllThemes] = useState(() => getAllThemes());
    
    const currentThemeConfig = getThemeById(currentThemeId);

    // Initialize custom CSS on mount
    useEffect(() => {
        initializeCustomCSS();
    }, []);

    // Save theme preference and update body attribute
    useEffect(() => {
        setActiveTheme(currentThemeId);
        document.body.setAttribute('data-theme', currentThemeConfig.mode);
        document.documentElement.setAttribute('data-theme', currentThemeConfig.mode);
        
        // Apply theme colors as CSS variables for custom CSS use
        document.documentElement.style.setProperty('--primary-color', currentThemeConfig.colors.primary);
        document.documentElement.style.setProperty('--secondary-color', currentThemeConfig.colors.secondary);
        document.documentElement.style.setProperty('--background-color', currentThemeConfig.colors.background);
        document.documentElement.style.setProperty('--paper-color', currentThemeConfig.colors.paper);
        document.documentElement.style.setProperty('--text-primary-color', currentThemeConfig.colors.textPrimary);
        document.documentElement.style.setProperty('--text-secondary-color', currentThemeConfig.colors.textSecondary);
    }, [currentThemeId, currentThemeConfig]);

    const switchTheme = (themeId) => {
        setCurrentThemeId(themeId);
    };

    const toggleTheme = () => {
        // Toggle between light and dark built-in themes
        setCurrentThemeId(prevId => {
            const currentTheme = getThemeById(prevId);
            return currentTheme.mode === 'light' ? 'dark' : 'light';
        });
    };

    const saveTheme = (themeData) => {
        const saved = saveCustomTheme(themeData);
        setAllThemes(getAllThemes());
        return saved;
    };

    const deleteTheme = (themeId) => {
        const result = deleteCustomTheme(themeId);
        setAllThemes(getAllThemes());
        return result;
    };

    const theme = useMemo(
        () => {
            const colors = currentThemeConfig.colors;
            const mode = currentThemeConfig.mode;
            
            return createTheme({
                palette: {
                    mode,
                    primary: {
                        main: colors.primary,
                        light: adjustColor(colors.primary, 20),
                        dark: adjustColor(colors.primary, -20),
                    },
                    secondary: {
                        main: colors.secondary,
                        light: adjustColor(colors.secondary, 20),
                        dark: adjustColor(colors.secondary, -20),
                    },
                    background: {
                        default: colors.background,
                        paper: colors.paper,
                    },
                    text: {
                        primary: colors.textPrimary,
                        secondary: colors.textSecondary,
                    },
                    divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                    action: mode === 'dark' ? {
                        active: colors.primary,
                        hover: 'rgba(255, 255, 255, 0.08)',
                        selected: 'rgba(255, 255, 255, 0.16)',
                        disabled: 'rgba(255, 255, 255, 0.3)',
                        disabledBackground: 'rgba(255, 255, 255, 0.12)',
                    } : {
                        active: 'rgba(0, 0, 0, 0.54)',
                        hover: 'rgba(0, 0, 0, 0.04)',
                        selected: 'rgba(0, 0, 0, 0.08)',
                        disabled: 'rgba(0, 0, 0, 0.26)',
                        disabledBackground: 'rgba(0, 0, 0, 0.12)',
                    },
                },
                typography: {
                    fontFamily: [
                        '-apple-system',
                        'BlinkMacSystemFont',
                        '"Segoe UI"',
                        'Roboto',
                        '"Helvetica Neue"',
                        'Arial',
                        'sans-serif',
                    ].join(','),
                },
                components: {
                    MuiCssBaseline: {
                        styleOverrides: {
                            body: {
                                backgroundColor: colors.background,
                                color: colors.textPrimary,
                                transition: 'background-color 0.3s ease, color 0.3s ease',
                            },
                        },
                    },
                    MuiPaper: {
                        styleOverrides: {
                            root: {
                                backgroundImage: 'none',
                                backgroundColor: colors.paper,
                                color: colors.textPrimary,
                            },
                        },
                    },
                    MuiCard: {
                        styleOverrides: {
                            root: {
                                backgroundImage: 'none',
                                backgroundColor: colors.paper,
                            },
                        },
                    },
                    MuiAppBar: {
                        styleOverrides: {
                            root: {
                                backgroundImage: 'none',
                                backgroundColor: colors.paper,
                            },
                        },
                    },
                    MuiDrawer: {
                        styleOverrides: {
                            paper: {
                                backgroundImage: 'none',
                                backgroundColor: colors.paper,
                                borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                            },
                        },
                    },
                    MuiDialog: {
                        styleOverrides: {
                            paper: {
                                backgroundImage: 'none',
                                backgroundColor: colors.paper,
                            },
                        },
                    },
                    MuiTableCell: {
                        styleOverrides: {
                            root: {
                                borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                            },
                            head: {
                                backgroundColor: colors.background,
                                color: colors.primary,
                                fontWeight: 600,
                            },
                        },
                    },
                    MuiButton: {
                        styleOverrides: {
                            root: {
                                textTransform: 'none',
                                borderRadius: 8,
                                fontWeight: 500,
                            },
                            contained: {
                                boxShadow: mode === 'dark' 
                                    ? `0 2px 8px ${colors.primary}40`
                                    : '0 2px 8px rgba(0, 0, 0, 0.15)',
                                '&:hover': {
                                    boxShadow: mode === 'dark'
                                        ? `0 4px 16px ${colors.primary}60`
                                        : '0 4px 16px rgba(0, 0, 0, 0.25)',
                                },
                            },
                        },
                    },
                    MuiChip: {
                        styleOverrides: {
                            root: {
                                borderRadius: 6,
                            },
                        },
                    },
                    MuiTooltip: {
                        styleOverrides: {
                            tooltip: {
                                borderRadius: 8,
                                fontSize: '0.875rem',
                            },
                        },
                    },
                },
            });
        },
        [currentThemeConfig]
    );

    const value = {
        mode: currentThemeConfig.mode,
        currentThemeId,
        currentTheme: currentThemeConfig,
        allThemes,
        toggleTheme,
        switchTheme,
        saveTheme,
        deleteTheme,
        exportTheme,
        importTheme: (jsonString) => {
            const imported = importTheme(jsonString);
            setAllThemes(getAllThemes());
            return imported;
        },
        refreshThemes: () => setAllThemes(getAllThemes()),
    };

    return (
        <ThemeContext.Provider value={value}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};

// Helper function to adjust color brightness
function adjustColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
}
