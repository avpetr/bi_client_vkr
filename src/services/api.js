import axios from 'axios';

// Базовый URL вашего Django API
const API_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// API функции для будущего бэкенда
export const saveDashboardConfig = async (dashboardConfig) => {
    try {
        // В реальном приложении: 
        // const response = await apiClient.post('/dashboards', dashboardConfig);
        // return response.data;

        // ДЛЯ ПРОТОТИПА: Имитация сохранения
        console.log('Saving dashboard config:', dashboardConfig);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, id: Date.now() });
            }, 300);
        });
    } catch (error) {
        console.error("Ошибка сохранения дашборда:", error);
        throw error;
    }
};

export const loadDashboardConfig = async (id) => {
    try {
        // В реальном приложении: 
        // const response = await apiClient.get(`/dashboards/${id}`);
        // return response.data;

        // ДЛЯ ПРОТОТИПА: Имитация загрузки
        console.log('Loading dashboard:', id);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(null); // Вернет null если нет сохраненного дашборда
            }, 300);
        });
    } catch (error) {
        console.error("Ошибка загрузки дашборда:", error);
        throw error;
    }
};

export const fetchMetrics = async (datasetId, filters = {}) => {
    try {
        // В реальном приложении здесь будет запрос к ClickHouse/Postgres: 
        // const response = await apiClient.get(`/metrics/${datasetId}`, { params: filters });
        // return response.data;

        // ДЛЯ ПРОТОТИПА: Данные загружаются из mockDatasets.js
        console.log('Fetching metrics for:', datasetId, 'with filters:', filters);
        return null;
    } catch (error) {
        console.error("Ошибка загрузки метрик:", error);
        throw error;
    }
};

// Export apiClient for potential future use
export { apiClient };