/**
 * Theme Storage Service
 * Manages custom themes in localStorage
 */

const THEMES_STORAGE_KEY = 'bi_custom_themes';
const ACTIVE_THEME_KEY = 'bi_active_theme';
const CUSTOM_CSS_KEY = 'bi_custom_css';

// Default theme templates
export const defaultThemes = {
    light: {
        id: 'light',
        name: 'Light Theme',
        mode: 'light',
        isBuiltIn: true,
        colors: {
            primary: '#1976d2',
            secondary: '#dc004e',
            background: '#f5f7fa',
            paper: '#ffffff',
            textPrimary: 'rgba(0, 0, 0, 0.87)',
            textSecondary: 'rgba(0, 0, 0, 0.6)',
        }
    },
    dark: {
        id: 'dark',
        name: 'Dark Theme',
        mode: 'dark',
        isBuiltIn: true,
        colors: {
            primary: '#64b5f6',
            secondary: '#f48fb1',
            background: '#1a1d2e',      // Lighter than before
            paper: '#242940',           // Better contrast
            textPrimary: '#e4e6eb',
            textSecondary: '#b0b3b8',
        }
    },
    midnight: {
        id: 'midnight',
        name: 'Midnight Blue',
        mode: 'dark',
        isBuiltIn: true,
        colors: {
            primary: '#4fc3f7',
            secondary: '#ba68c8',
            background: '#0d1117',
            paper: '#161b22',
            textPrimary: '#f0f6fc',
            textSecondary: '#8b949e',
        }
    },
    forest: {
        id: 'forest',
        name: 'Forest Green',
        mode: 'dark',
        isBuiltIn: true,
        colors: {
            primary: '#66bb6a',
            secondary: '#ffb74d',
            background: '#1b2a1f',
            paper: '#243329',
            textPrimary: '#e8f5e9',
            textSecondary: '#a5d6a7',
        }
    },
    ocean: {
        id: 'ocean',
        name: 'Ocean Blue',
        mode: 'light',
        isBuiltIn: true,
        colors: {
            primary: '#0288d1',
            secondary: '#26c6da',
            background: '#e1f5fe',
            paper: '#ffffff',
            textPrimary: '#01579b',
            textSecondary: '#0277bd',
        }
    }
};

// Get all themes (built-in + custom)
export const getAllThemes = () => {
    try {
        const customThemesJson = localStorage.getItem(THEMES_STORAGE_KEY);
        const customThemes = customThemesJson ? JSON.parse(customThemesJson) : [];
        
        return {
            ...defaultThemes,
            ...customThemes.reduce((acc, theme) => {
                acc[theme.id] = theme;
                return acc;
            }, {})
        };
    } catch (error) {
        console.error('Error loading themes:', error);
        return defaultThemes;
    }
};

// Get a specific theme by ID
export const getThemeById = (themeId) => {
    const allThemes = getAllThemes();
    return allThemes[themeId] || defaultThemes.light;
};

// Get active theme ID
export const getActiveThemeId = () => {
    return localStorage.getItem(ACTIVE_THEME_KEY) || 'light';
};

// Set active theme
export const setActiveTheme = (themeId) => {
    localStorage.setItem(ACTIVE_THEME_KEY, themeId);
};

// Save a custom theme
export const saveCustomTheme = (theme) => {
    try {
        const customThemesJson = localStorage.getItem(THEMES_STORAGE_KEY);
        const customThemes = customThemesJson ? JSON.parse(customThemesJson) : [];
        
        // Check if theme already exists
        const existingIndex = customThemes.findIndex(t => t.id === theme.id);
        
        if (existingIndex >= 0) {
            // Update existing theme
            customThemes[existingIndex] = {
                ...theme,
                updatedAt: new Date().toISOString()
            };
        } else {
            // Add new theme
            customThemes.push({
                ...theme,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isBuiltIn: false
            });
        }
        
        localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(customThemes));
        return theme;
    } catch (error) {
        console.error('Error saving theme:', error);
        throw error;
    }
};

// Delete a custom theme
export const deleteCustomTheme = (themeId) => {
    try {
        const customThemesJson = localStorage.getItem(THEMES_STORAGE_KEY);
        const customThemes = customThemesJson ? JSON.parse(customThemesJson) : [];
        
        const filtered = customThemes.filter(t => t.id !== themeId);
        localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(filtered));
        
        // If deleted theme was active, switch to light theme
        if (getActiveThemeId() === themeId) {
            setActiveTheme('light');
        }
        
        return true;
    } catch (error) {
        console.error('Error deleting theme:', error);
        return false;
    }
};

// Export theme to JSON
export const exportTheme = (themeId) => {
    const theme = getThemeById(themeId);
    if (!theme) return;
    
    const dataStr = JSON.stringify(theme, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${theme.name.replace(/[^a-z0-9]/gi, '_')}_theme.json`;
    link.click();
    URL.revokeObjectURL(url);
};

// Import theme from JSON
export const importTheme = (jsonString) => {
    try {
        const theme = JSON.parse(jsonString);
        
        // Validate theme structure
        if (!theme.name || !theme.colors) {
            throw new Error('Invalid theme format');
        }
        
        // Generate new ID
        theme.id = `custom_${Date.now()}`;
        theme.name = `${theme.name} (Imported)`;
        
        return saveCustomTheme(theme);
    } catch (error) {
        console.error('Error importing theme:', error);
        throw new Error('Invalid theme file');
    }
};

// Custom CSS management
export const getCustomCSS = () => {
    return localStorage.getItem(CUSTOM_CSS_KEY) || '';
};

export const saveCustomCSS = (css) => {
    localStorage.setItem(CUSTOM_CSS_KEY, css);
    applyCustomCSS(css);
};

export const clearCustomCSS = () => {
    localStorage.removeItem(CUSTOM_CSS_KEY);
    const styleElement = document.getElementById('custom-css-injection');
    if (styleElement) {
        styleElement.remove();
    }
};

export const applyCustomCSS = (css) => {
    let styleElement = document.getElementById('custom-css-injection');
    
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'custom-css-injection';
        document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = css;
};

// Initialize custom CSS on page load
export const initializeCustomCSS = () => {
    const customCSS = getCustomCSS();
    if (customCSS) {
        applyCustomCSS(customCSS);
    }
};




