// Dashboard Storage Service - manages multiple dashboards in localStorage

const STORAGE_KEY = 'bi_dashboards';
const CURRENT_DASHBOARD_KEY = 'bi_current_dashboard';

// Старые дефолты, которые когда-то записывались автоматически. Их нужно
// убирать при чтении — иначе фолбэк темы не сработает.
const LEGACY_BG_DEFAULTS = new Set(['#f4f6f8', '#fafafa', '#ffffff', '#fff']);

const migrateDashboard = (d) => {
    if (d?.style?.backgroundColor && LEGACY_BG_DEFAULTS.has(d.style.backgroundColor.toLowerCase())) {
        delete d.style.backgroundColor;
    }
    return d;
};

// Get all dashboards
export const getAllDashboards = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        const dashboards = JSON.parse(data).map(migrateDashboard);
        // Перезаписываем — миграция должна быть одноразовой
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards));
        return dashboards;
    } catch (error) {
        console.error('Error loading dashboards:', error);
        return [];
    }
};

// Get current dashboard ID
export const getCurrentDashboardId = () => {
    return localStorage.getItem(CURRENT_DASHBOARD_KEY);
};

// Set current dashboard ID
export const setCurrentDashboardId = (id) => {
    localStorage.setItem(CURRENT_DASHBOARD_KEY, id);
};

// Get dashboard by ID
export const getDashboardById = (id) => {
    const dashboards = getAllDashboards();
    return dashboards.find(d => d.id === id);
};

// Save dashboard
export const saveDashboard = (dashboard) => {
    try {
        const dashboards = getAllDashboards();
        const existingIndex = dashboards.findIndex(d => d.id === dashboard.id);
        
        const updatedDashboard = {
            ...dashboard,
            updatedAt: new Date().toISOString()
        };
        
        if (existingIndex >= 0) {
            dashboards[existingIndex] = updatedDashboard;
        } else {
            dashboards.push(updatedDashboard);
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards));
        return updatedDashboard;
    } catch (error) {
        console.error('Error saving dashboard:', error);
        throw error;
    }
};

// Create new dashboard
export const createDashboard = (name = 'Новый дашборд') => {
    const newDashboard = {
        id: `dashboard_${Date.now()}`,
        name: name,
        layouts: { lg: [] },
        widgets: [],
        filters: {},
        style: {
            // backgroundColor намеренно не задан — фолбэк InteractiveDashboard
            // подберёт цвет в зависимости от темы (светлая/тёмная).
            gridGap: 16,
            widgetElevation: 3,
            widgetBorderRadius: 4,
            defaultFontSize: 12,
            defaultAnimationDuration: 400,
            defaultStrokeWidth: 2,
            showGridLines: true,
            compactMode: false,
            theme: 'light'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    return saveDashboard(newDashboard);
};

// Delete dashboard
export const deleteDashboard = (id) => {
    try {
        const dashboards = getAllDashboards();
        const filtered = dashboards.filter(d => d.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        
        // If deleting current dashboard, clear current
        if (getCurrentDashboardId() === id) {
            localStorage.removeItem(CURRENT_DASHBOARD_KEY);
        }
        
        return filtered;
    } catch (error) {
        console.error('Error deleting dashboard:', error);
        throw error;
    }
};

// Rename dashboard
export const renameDashboard = (id, newName) => {
    const dashboard = getDashboardById(id);
    if (dashboard) {
        dashboard.name = newName;
        return saveDashboard(dashboard);
    }
    return null;
};

// Duplicate dashboard
export const duplicateDashboard = (id) => {
    const dashboard = getDashboardById(id);
    if (dashboard) {
        const duplicate = {
            ...dashboard,
            id: `dashboard_${Date.now()}`,
            name: `${dashboard.name} (копия)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        return saveDashboard(duplicate);
    }
    return null;
};

// Export dashboard as JSON
export const exportDashboard = (id) => {
    const dashboard = getDashboardById(id);
    if (dashboard) {
        const dataStr = JSON.stringify(dashboard, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${dashboard.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }
};

// Import dashboard from JSON
export const importDashboard = (jsonString) => {
    try {
        const dashboard = JSON.parse(jsonString);
        // Generate new ID to avoid conflicts
        dashboard.id = `dashboard_${Date.now()}`;
        dashboard.name = `${dashboard.name} (импортированный)`;
        dashboard.createdAt = new Date().toISOString();
        dashboard.updatedAt = new Date().toISOString();
        return saveDashboard(dashboard);
    } catch (error) {
        console.error('Error importing dashboard:', error);
        throw new Error('Неверный формат файла дашборда');
    }
};

// Get dashboard statistics
export const getDashboardStats = () => {
    const dashboards = getAllDashboards();
    return {
        total: dashboards.length,
        totalWidgets: dashboards.reduce((sum, d) => sum + (d.widgets?.length || 0), 0),
        lastUpdated: dashboards.length > 0 
            ? dashboards.reduce((latest, d) => {
                const date = new Date(d.updatedAt);
                return date > latest ? date : latest;
            }, new Date(0))
            : null
    };
};

