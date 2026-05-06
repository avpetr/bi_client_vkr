/**
 * dataSourceStorage.js
 * Хранение конфигураций источников данных (БД-подключения и API-эндпоинты) в localStorage.
 */

const DB_CONNECTIONS_KEY = 'bi_db_connections';
const API_SOURCES_KEY    = 'bi_api_sources';

// ─── DB Connections ───────────────────────────────────────────────────────────

export const getDbConnections = () => {
    try {
        return JSON.parse(localStorage.getItem(DB_CONNECTIONS_KEY)) || [];
    } catch {
        return [];
    }
};

export const saveDbConnection = (conn) => {
    const all = getDbConnections();
    const idx = all.findIndex(c => c.id === conn.id);
    if (idx >= 0) all[idx] = conn;
    else all.push(conn);
    localStorage.setItem(DB_CONNECTIONS_KEY, JSON.stringify(all));
    return conn;
};

export const deleteDbConnection = (id) => {
    const all = getDbConnections().filter(c => c.id !== id);
    localStorage.setItem(DB_CONNECTIONS_KEY, JSON.stringify(all));
};

export const createDbConnection = (partial = {}) => ({
    id: `db_${Date.now()}`,
    name: 'Новое подключение',
    type: 'postgresql',   // postgresql | clickhouse | mysql | mssql
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
    ssl: false,
    createdAt: new Date().toISOString(),
    ...partial,
});

// ─── API Sources ──────────────────────────────────────────────────────────────

export const getApiSources = () => {
    try {
        return JSON.parse(localStorage.getItem(API_SOURCES_KEY)) || [];
    } catch {
        return [];
    }
};

export const saveApiSource = (src) => {
    const all = getApiSources();
    const idx = all.findIndex(s => s.id === src.id);
    if (idx >= 0) all[idx] = src;
    else all.push(src);
    localStorage.setItem(API_SOURCES_KEY, JSON.stringify(all));
    return src;
};

export const deleteApiSource = (id) => {
    const all = getApiSources().filter(s => s.id !== id);
    localStorage.setItem(API_SOURCES_KEY, JSON.stringify(all));
};

export const createApiSource = (partial = {}) => ({
    id: `api_${Date.now()}`,
    name: 'Новый API-источник',
    url: '',
    method: 'GET',
    headers: [],          // [{key, value}]
    authType: 'none',     // none | bearer | basic
    authToken: '',
    authUser: '',
    authPass: '',
    body: '',
    dataPath: '',         // JSON-path к массиву данных, напр. "data.items"
    createdAt: new Date().toISOString(),
    ...partial,
});

// ─── DEFAULT PORT PER DB TYPE ─────────────────────────────────────────────────

export const defaultPort = {
    postgresql: 5432,
    clickhouse: 8123,
    mysql: 3306,
    mssql: 1433,
};
