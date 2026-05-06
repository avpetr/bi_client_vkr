/**
 * DataSourceDialog.jsx
 *
 * Диалог управления внешними источниками данных.
 * Вкладки:
 *   1. Базы данных — настройка подключения, редактор SQL-запросов, предпросмотр
 *   2. API         — настройка REST-эндпоинта, тест, сохранение как датасет
 *   3. Сохранённые — список всех подключений и API-источников
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, Tabs, Tab, TextField,
    Select, MenuItem, FormControl, InputLabel, IconButton,
    Divider, Alert, Chip, CircularProgress, Tooltip,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Switch, FormControlLabel, List,
    ListItem, ListItemText, ListItemSecondaryAction,
    Accordion, AccordionSummary, AccordionDetails,
    InputAdornment,
} from '@mui/material';
import StorageIcon       from '@mui/icons-material/Storage';
import ApiIcon           from '@mui/icons-material/Api';
import BookmarksIcon     from '@mui/icons-material/Bookmarks';
import AddIcon           from '@mui/icons-material/Add';
import DeleteIcon        from '@mui/icons-material/Delete';
import PlayArrowIcon     from '@mui/icons-material/PlayArrow';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import ErrorIcon         from '@mui/icons-material/Error';
import ExpandMoreIcon    from '@mui/icons-material/ExpandMore';
import ContentCopyIcon   from '@mui/icons-material/ContentCopy';
import VisibilityIcon    from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import {
    getDbConnections, saveDbConnection, deleteDbConnection, createDbConnection, defaultPort,
    getApiSources,    saveApiSource,    deleteApiSource,    createApiSource,
} from '../services/dataSourceStorage';
import { saveCustomDataset } from '../services/csvParser';

// ─────────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────────

const TabPanel = ({ children, value, index }) =>
    value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;

/** Пытается получить вложенное значение по пути вида "data.items" */
const resolvePath = (obj, path) => {
    if (!path) return obj;
    return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
};

/** Преобразует произвольный массив объектов в датасет для SmartWidget */
const arrayToDataset = (arr, name) => {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const sample = arr[0];
    const keys = Object.keys(sample);
    const numericKeys = keys.filter(k => typeof sample[k] === 'number');
    const xKey = keys.find(k => typeof sample[k] === 'string') || keys[0];

    return {
        id: `api_ds_${Date.now()}`,
        name,
        description: `Данные из API: ${name}`,
        isCustom: true,
        data: arr,
        metrics: numericKeys.map((k, i) => ({
            key: k, label: k,
            color: ['#8884d8','#82ca9d','#ffc658','#ff7c7c','#8dd1e1','#d084d0'][i % 6],
        })),
        xAxisKey: xKey,
    };
};

const DB_TYPES = [
    { value: 'postgresql', label: 'PostgreSQL' },
    { value: 'clickhouse', label: 'ClickHouse' },
    { value: 'mysql',      label: 'MySQL' },
    { value: 'mssql',      label: 'MS SQL Server' },
];

const SQL_EXAMPLES = {
    postgresql:  'SELECT\n  date_trunc(\'month\', created_at) AS name,\n  COUNT(*) AS value\nFROM orders\nGROUP BY 1\nORDER BY 1\nLIMIT 12;',
    clickhouse:  'SELECT\n  toStartOfMonth(created_at) AS name,\n  count() AS value\nFROM orders\nGROUP BY name\nORDER BY name\nLIMIT 12',
    mysql:       'SELECT\n  DATE_FORMAT(created_at, \'%Y-%m\') AS name,\n  COUNT(*) AS value\nFROM orders\nGROUP BY name\nORDER BY name\nLIMIT 12;',
    mssql:       'SELECT TOP 12\n  FORMAT(created_at, \'yyyy-MM\') AS name,\n  COUNT(*) AS value\nFROM orders\nGROUP BY FORMAT(created_at, \'yyyy-MM\')\nORDER BY name;',
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1 — Database connections
// ─────────────────────────────────────────────────────────────────────────────

const DbTab = ({ onDatasetSaved }) => {
    const [connections, setConnections] = useState(getDbConnections);
    const [selected,    setSelected]    = useState(null);   // connection id
    const [form,        setForm]        = useState(null);   // current edit object
    const [showPass,    setShowPass]    = useState(false);
    const [sql,         setSql]         = useState('');
    const [testState,   setTestState]   = useState(null);  // null | 'ok' | 'err'
    const [testMsg,     setTestMsg]     = useState('');
    const [queryState,  setQueryState]  = useState(null);  // null | 'running' | 'ok' | 'err'
    const [queryResult, setQueryResult] = useState(null);
    const [datasetName, setDatasetName] = useState('');

    const handleNew = () => {
        const c = createDbConnection();
        setForm(c);
        setSelected(c.id);
        setSql(SQL_EXAMPLES[c.type]);
        setTestState(null); setQueryResult(null);
    };

    const handleSelect = (conn) => {
        setForm({ ...conn });
        setSelected(conn.id);
        setSql(SQL_EXAMPLES[conn.type] || '');
        setTestState(null); setQueryResult(null);
    };

    const handleChange = (field, value) => {
        setForm(prev => {
            const next = { ...prev, [field]: value };
            if (field === 'type') { next.port = defaultPort[value]; setSql(SQL_EXAMPLES[value] || ''); }
            return next;
        });
    };

    const handleSave = () => {
        if (!form) return;
        saveDbConnection(form);
        const updated = getDbConnections();
        setConnections(updated);
    };

    const handleDelete = (id) => {
        deleteDbConnection(id);
        setConnections(getDbConnections());
        if (selected === id) { setForm(null); setSelected(null); }
    };

    // Тест подключения — стаб (требует бэкенд)
    const handleTest = async () => {
        handleSave();
        setTestState('pending');
        await new Promise(r => setTimeout(r, 800));
        // В реальном приложении: POST /api/db/test { ...form }
        setTestState('err');
        setTestMsg('Тестирование подключения требует бэкенд-сервер (Django/FastAPI). Конфигурация сохранена и готова к использованию.');
    };

    // Выполнение запроса — стаб
    const handleRunQuery = async () => {
        if (!sql.trim()) return;
        handleSave();
        setQueryState('running');
        setQueryResult(null);
        await new Promise(r => setTimeout(r, 1000));
        // В реальном приложении: POST /api/db/query { connectionId: form.id, sql }
        setQueryState('err');
        setQueryResult({ error: 'Выполнение SQL-запросов требует бэкенд-сервер. Подключение сохранено — после настройки сервера запрос будет выполнен автоматически.' });
    };

    return (
        <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
            {/* ── Список соединений ── */}
            <Box sx={{ width: 220, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider', pr: 2 }}>
                <Button size="small" startIcon={<AddIcon />} fullWidth onClick={handleNew} variant="outlined" sx={{ mb: 1 }}>
                    Новое подключение
                </Button>
                {connections.length === 0 && (
                    <Typography variant="caption" color="text.secondary">Нет сохранённых подключений</Typography>
                )}
                {connections.map(c => (
                    <Box
                        key={c.id}
                        onClick={() => handleSelect(c)}
                        sx={{
                            p: 1, borderRadius: 1, cursor: 'pointer', mb: 0.5,
                            bgcolor: selected === c.id ? 'action.selected' : 'transparent',
                            '&:hover': { bgcolor: 'action.hover' },
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" noWrap fontWeight={selected === c.id ? 700 : 400}>{c.name}</Typography>
                            <Chip label={c.type} size="small" sx={{ fontSize: '0.6rem', height: 16, mt: 0.3 }} />
                        </Box>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Box>
                ))}
            </Box>

            {/* ── Форма и редактор ── */}
            <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {!form ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                        <Typography color="text.secondary">Выберите подключение или создайте новое</Typography>
                    </Box>
                ) : (
                    <>
                        {/* Connection form */}
                        <Accordion defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight={600}>Параметры подключения</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                    <TextField
                                        label="Название" fullWidth value={form.name}
                                        onChange={e => handleChange('name', e.target.value)}
                                    />
                                    <FormControl fullWidth>
                                        <InputLabel>Тип СУБД</InputLabel>
                                        <Select value={form.type} label="Тип СУБД" onChange={e => handleChange('type', e.target.value)}>
                                            {DB_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        label="Хост" fullWidth value={form.host}
                                        onChange={e => handleChange('host', e.target.value)}
                                    />
                                    <TextField
                                        label="Порт" type="number" fullWidth value={form.port}
                                        onChange={e => handleChange('port', Number(e.target.value))}
                                    />
                                    <TextField
                                        label="База данных" fullWidth value={form.database}
                                        onChange={e => handleChange('database', e.target.value)}
                                    />
                                    <TextField
                                        label="Пользователь" fullWidth value={form.username}
                                        onChange={e => handleChange('username', e.target.value)}
                                    />
                                    <TextField
                                        label="Пароль" fullWidth
                                        type={showPass ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={e => handleChange('password', e.target.value)}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton size="small" onClick={() => setShowPass(v => !v)}>
                                                        {showPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                    <FormControlLabel
                                        control={<Switch checked={form.ssl} onChange={e => handleChange('ssl', e.target.checked)} />}
                                        label="SSL"
                                    />
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                    <Button variant="contained" onClick={handleSave}>Сохранить</Button>
                                    <Button variant="outlined" onClick={handleTest} startIcon={
                                        testState === 'pending' ? <CircularProgress size={14} /> :
                                        testState === 'ok' ? <CheckCircleIcon color="success" fontSize="small" /> :
                                        testState === 'err' ? <ErrorIcon color="error" fontSize="small" /> : null
                                    }>
                                        Тест подключения
                                    </Button>
                                </Box>

                                {testState && testState !== 'pending' && (
                                    <Alert severity={testState === 'ok' ? 'success' : 'warning'} sx={{ mt: 1 }}>
                                        {testMsg}
                                    </Alert>
                                )}
                            </AccordionDetails>
                        </Accordion>

                        {/* SQL editor */}
                        <Accordion defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight={600}>SQL-редактор</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Alert severity="info" sx={{ mb: 1 }}>
                                    Запросы выполняются через бэкенд-сервер. Ниже — пример запроса для выбранного типа БД.
                                </Alert>
                                <TextField
                                    multiline minRows={6} fullWidth
                                    value={sql}
                                    onChange={e => setSql(e.target.value)}
                                    inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
                                    placeholder="SELECT ..."
                                />
                                <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <Button
                                        variant="contained" startIcon={<PlayArrowIcon />}
                                        onClick={handleRunQuery}
                                        disabled={queryState === 'running'}
                                    >
                                        {queryState === 'running' ? 'Выполняется...' : 'Выполнить'}
                                    </Button>
                                    <Tooltip title="Скопировать SQL">
                                        <IconButton size="small" onClick={() => navigator.clipboard.writeText(sql)}>
                                            <ContentCopyIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Button size="small" onClick={() => setSql(SQL_EXAMPLES[form.type] || '')}>
                                        Вставить пример
                                    </Button>
                                </Box>

                                {/* Query result / error */}
                                {queryResult?.error && (
                                    <Alert severity="warning" sx={{ mt: 1 }}>{queryResult.error}</Alert>
                                )}
                                {queryResult?.rows && (
                                    <>
                                        <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 1, alignItems: 'center' }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Строк: {queryResult.rows.length}
                                            </Typography>
                                            <TextField
                                                size="small" label="Название датасета"
                                                value={datasetName}
                                                onChange={e => setDatasetName(e.target.value)}
                                                sx={{ ml: 2 }}
                                            />
                                            <Button
                                                size="small" variant="outlined"
                                                disabled={!datasetName.trim()}
                                                onClick={() => {
                                                    const ds = arrayToDataset(queryResult.rows, datasetName);
                                                    if (ds) { saveCustomDataset(ds); onDatasetSaved?.(ds); }
                                                }}
                                            >
                                                Сохранить как датасет
                                            </Button>
                                        </Box>
                                        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 240 }}>
                                            <Table size="small" stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        {Object.keys(queryResult.rows[0]).map(k => (
                                                            <TableCell key={k} sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>{k}</TableCell>
                                                        ))}
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {queryResult.rows.map((row, i) => (
                                                        <TableRow key={i}>
                                                            {Object.values(row).map((v, j) => (
                                                                <TableCell key={j}>{String(v ?? '')}</TableCell>
                                                            ))}
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </>
                                )}
                            </AccordionDetails>
                        </Accordion>
                    </>
                )}
            </Box>
        </Box>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2 — API sources
// ─────────────────────────────────────────────────────────────────────────────

const ApiTab = ({ onDatasetSaved }) => {
    const [sources,  setSources]  = useState(getApiSources);
    const [selected, setSelected] = useState(null);
    const [form,     setForm]     = useState(null);
    const [fetching, setFetching] = useState(false);
    const [fetchResult, setFetchResult] = useState(null);  // { raw, resolved, error }
    const [datasetName, setDatasetName] = useState('');
    const [showBody, setShowBody] = useState(false);

    const handleNew = () => {
        const s = createApiSource();
        setForm(s); setSelected(s.id);
        setFetchResult(null);
    };

    const handleSelect = (src) => {
        setForm({ ...src }); setSelected(src.id);
        setFetchResult(null);
    };

    const handleChange = (field, value) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleHeaderChange = (idx, key, value) =>
        setForm(prev => {
            const headers = [...prev.headers];
            headers[idx] = { ...headers[idx], [key]: value };
            return { ...prev, headers };
        });

    const handleAddHeader = () =>
        setForm(prev => ({ ...prev, headers: [...prev.headers, { key: '', value: '' }] }));

    const handleRemoveHeader = (idx) =>
        setForm(prev => ({ ...prev, headers: prev.headers.filter((_, i) => i !== idx) }));

    const handleSave = () => {
        if (!form) return;
        saveApiSource(form);
        setSources(getApiSources());
    };

    const handleDelete = (id) => {
        deleteApiSource(id);
        setSources(getApiSources());
        if (selected === id) { setForm(null); setSelected(null); }
    };

    const handleFetch = useCallback(async () => {
        if (!form?.url) return;
        handleSave();
        setFetching(true);
        setFetchResult(null);

        try {
            const headers = {};
            form.headers.forEach(h => { if (h.key) headers[h.key] = h.value; });

            if (form.authType === 'bearer') headers['Authorization'] = `Bearer ${form.authToken}`;
            if (form.authType === 'basic')  headers['Authorization'] = `Basic ${btoa(`${form.authUser}:${form.authPass}`)}`;

            const opts = { method: form.method, headers };
            if (form.method !== 'GET' && form.body) opts.body = form.body;

            const response = await fetch(form.url, opts);
            if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

            const raw = await response.json();
            let resolved = resolvePath(raw, form.dataPath);

            // Если пришёл объект (не массив) — конвертируем в [{name, value}]
            if (resolved !== null && !Array.isArray(resolved) && typeof resolved === 'object') {
                resolved = Object.entries(resolved).map(([key, val]) => ({
                    name: key,
                    value: typeof val === 'number' ? val : (typeof val === 'object' ? JSON.stringify(val) : val),
                }));
            }

            setFetchResult({ raw, resolved, error: null });
            setDatasetName(form.name || 'API данные');
        } catch (err) {
            setFetchResult({ raw: null, resolved: null, error: err.message });
        } finally {
            setFetching(false);
        }
    }, [form]);

    const resolvedIsArray = Array.isArray(fetchResult?.resolved);

    return (
        <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
            {/* ── Список источников ── */}
            <Box sx={{ width: 220, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider', pr: 2 }}>
                <Button size="small" startIcon={<AddIcon />} fullWidth onClick={handleNew} variant="outlined" sx={{ mb: 1 }}>
                    Новый источник
                </Button>
                {sources.length === 0 && (
                    <Typography variant="caption" color="text.secondary">Нет сохранённых источников</Typography>
                )}
                {sources.map(s => (
                    <Box
                        key={s.id}
                        onClick={() => handleSelect(s)}
                        sx={{
                            p: 1, borderRadius: 1, cursor: 'pointer', mb: 0.5,
                            bgcolor: selected === s.id ? 'action.selected' : 'transparent',
                            '&:hover': { bgcolor: 'action.hover' },
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" noWrap fontWeight={selected === s.id ? 700 : 400}>{s.name}</Typography>
                            <Chip label={s.method} size="small" color="primary" sx={{ fontSize: '0.6rem', height: 16, mt: 0.3 }} />
                        </Box>
                        <IconButton size="small" onClick={e => { e.stopPropagation(); handleDelete(s.id); }}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Box>
                ))}
            </Box>

            {/* ── Форма ── */}
            <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {!form ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                        <Typography color="text.secondary">Выберите источник или создайте новый</Typography>
                    </Box>
                ) : (
                    <>
                        {/* Request config */}
                        <Accordion defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight={600}>Запрос</Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                                {/* ── Готовые примеры ── */}
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                        Готовые примеры (бесплатные API без ключа):
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {[
                                            {
                                                label: 'Крипто топ-10',
                                                name: 'Криптовалюты (CoinCap)',
                                                url: 'https://api.coincap.io/v2/assets?limit=10',
                                                dataPath: 'data',
                                            },
                                            {
                                                label: 'Курсы валют',
                                                name: 'Курсы валют к USD',
                                                url: 'https://open.er-api.com/v6/latest/USD',
                                                dataPath: 'rates',
                                            },
                                            {
                                                label: 'Погода Москва',
                                                name: 'Погода Москва (Open-Meteo)',
                                                url: 'https://api.open-meteo.com/v1/forecast?latitude=55.75&longitude=37.62&hourly=temperature_2m,precipitation_probability&forecast_days=3&timezone=Europe%2FMoscow',
                                                dataPath: '',
                                            },
                                            {
                                                label: 'Землетрясения USGS',
                                                name: 'Землетрясения (USGS)',
                                                url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
                                                dataPath: 'features',
                                            },
                                        ].map(ex => (
                                            <Chip
                                                key={ex.label}
                                                label={ex.label}
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                                clickable
                                                onClick={() => {
                                                    handleChange('name', ex.name);
                                                    handleChange('url', ex.url);
                                                    handleChange('dataPath', ex.dataPath);
                                                    handleChange('method', 'GET');
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Box>

                                <TextField
                                    label="Название источника" fullWidth value={form.name}
                                    onChange={e => handleChange('name', e.target.value)}
                                />
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <FormControl sx={{ width: 110 }}>
                                        <InputLabel>Метод</InputLabel>
                                        <Select value={form.method} label="Метод" onChange={e => handleChange('method', e.target.value)}>
                                            {['GET','POST','PUT','PATCH'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        label="URL" fullWidth value={form.url}
                                        onChange={e => handleChange('url', e.target.value)}
                                        placeholder="https://api.example.com/data"
                                    />
                                </Box>

                                {/* Auth */}
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <FormControl sx={{ minWidth: 150 }}>
                                        <InputLabel>Авторизация</InputLabel>
                                        <Select value={form.authType} label="Авторизация" onChange={e => handleChange('authType', e.target.value)}>
                                            <MenuItem value="none">Нет</MenuItem>
                                            <MenuItem value="bearer">Bearer Token</MenuItem>
                                            <MenuItem value="basic">Basic Auth</MenuItem>
                                        </Select>
                                    </FormControl>
                                    {form.authType === 'bearer' && (
                                        <TextField
                                            label="Token" value={form.authToken} type="password"
                                            onChange={e => handleChange('authToken', e.target.value)}
                                            sx={{ flex: 1 }}
                                        />
                                    )}
                                    {form.authType === 'basic' && <>
                                        <TextField label="Логин" value={form.authUser} onChange={e => handleChange('authUser', e.target.value)} sx={{ flex: 1 }} />
                                        <TextField label="Пароль" type="password" value={form.authPass} onChange={e => handleChange('authPass', e.target.value)} sx={{ flex: 1 }} />
                                    </>}
                                </Box>

                                {/* Headers */}
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                        <Typography variant="subtitle2">Заголовки (Headers)</Typography>
                                        <Button size="small" startIcon={<AddIcon />} onClick={handleAddHeader}>Добавить</Button>
                                    </Box>
                                    {form.headers.map((h, i) => (
                                        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                            <TextField size="small" label="Ключ" value={h.key}    onChange={e => handleHeaderChange(i, 'key', e.target.value)} sx={{ flex: 1 }} />
                                            <TextField size="small" label="Значение" value={h.value} onChange={e => handleHeaderChange(i, 'value', e.target.value)} sx={{ flex: 1 }} />
                                            <IconButton size="small" onClick={() => handleRemoveHeader(i)}><DeleteIcon fontSize="small" /></IconButton>
                                        </Box>
                                    ))}
                                </Box>

                                {/* Body */}
                                {form.method !== 'GET' && (
                                    <TextField
                                        label="Тело запроса (JSON)" multiline minRows={3} fullWidth
                                        value={form.body}
                                        onChange={e => handleChange('body', e.target.value)}
                                        inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
                                        placeholder='{"key": "value"}'
                                    />
                                )}
                            </AccordionDetails>
                        </Accordion>

                        {/* Data mapping */}
                        <Accordion defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight={600}>Маппинг данных</Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Путь к массиву данных (JSON-path)"
                                    fullWidth value={form.dataPath}
                                    onChange={e => handleChange('dataPath', e.target.value)}
                                    helperText='Путь к массиву или объекту: "data", "data.items", "rates". Объект {key: value} автоматически превращается в [{name, value}]'
                                    placeholder="data.items"
                                />
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button variant="contained" onClick={handleSave}>Сохранить</Button>
                                    <Button
                                        variant="contained" color="success"
                                        startIcon={fetching ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
                                        onClick={handleFetch}
                                        disabled={!form.url || fetching}
                                    >
                                        {fetching ? 'Загрузка...' : 'Выполнить запрос'}
                                    </Button>
                                </Box>
                            </AccordionDetails>
                        </Accordion>

                        {/* Result */}
                        {fetchResult && (
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                {fetchResult.error ? (
                                    <Alert severity="error">Ошибка: {fetchResult.error}</Alert>
                                ) : (
                                    <>
                                        {resolvedIsArray ? (
                                            <>
                                                <Alert severity="success" sx={{ mb: 1 }}>
                                                    Получено {fetchResult.resolved.length} записей
                                                </Alert>
                                                {/* Preview table */}
                                                <TableContainer sx={{ maxHeight: 200, mb: 2 }}>
                                                    <Table size="small" stickyHeader>
                                                        <TableHead>
                                                            <TableRow>
                                                                {Object.keys(fetchResult.resolved[0] || {}).map(k => (
                                                                    <TableCell key={k} sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>{k}</TableCell>
                                                                ))}
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {fetchResult.resolved.slice(0, 10).map((row, i) => (
                                                                <TableRow key={i}>
                                                                    {Object.values(row).map((v, j) => (
                                                                        <TableCell key={j}>{String(v ?? '')}</TableCell>
                                                                    ))}
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                    <TextField
                                                        size="small" label="Название датасета"
                                                        value={datasetName}
                                                        onChange={e => setDatasetName(e.target.value)}
                                                    />
                                                    <Button
                                                        variant="contained"
                                                        disabled={!datasetName.trim()}
                                                        onClick={() => {
                                                            const ds = arrayToDataset(fetchResult.resolved, datasetName);
                                                            if (ds) { saveCustomDataset(ds); onDatasetSaved?.(ds); }
                                                        }}
                                                    >
                                                        Сохранить как датасет
                                                    </Button>
                                                </Box>
                                            </>
                                        ) : (
                                            <>
                                                <Alert severity="warning" sx={{ mb: 1 }}>
                                                    Ответ API не является массивом. Укажите корректный путь к массиву данных или проверьте структуру ответа.
                                                </Alert>
                                                <Button size="small" onClick={() => setShowBody(v => !v)}>
                                                    {showBody ? 'Скрыть' : 'Показать'} сырой ответ
                                                </Button>
                                                {showBody && (
                                                    <Box
                                                        component="pre"
                                                        sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1, fontSize: 12, overflow: 'auto', maxHeight: 200 }}
                                                    >
                                                        {JSON.stringify(fetchResult.raw, null, 2)}
                                                    </Box>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                            </Paper>
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3 — Saved sources overview
// ─────────────────────────────────────────────────────────────────────────────

const SavedTab = ({ onTabChange }) => {
    const dbs  = getDbConnections();
    const apis = getApiSources();

    const Section = ({ title, items, icon, tab }) => (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {icon}
                <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
                <Chip label={items.length} size="small" />
            </Box>
            {items.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    Нет сохранённых {title.toLowerCase()}. <Button size="small" onClick={() => onTabChange(tab)}>Добавить</Button>
                </Typography>
            ) : (
                <List dense>
                    {items.map(item => (
                        <ListItem key={item.id} divider>
                            <ListItemText
                                primary={item.name}
                                secondary={
                                    item.type
                                        ? `${item.type} · ${item.host}:${item.port} · ${item.database}`
                                        : `${item.method} ${item.url}`
                                }
                            />
                            <Chip
                                label={item.type || item.method}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 1 }}
                            />
                        </ListItem>
                    ))}
                </List>
            )}
        </Box>
    );

    return (
        <Box>
            <Section title="Подключения к БД" items={dbs}  icon={<StorageIcon color="primary" />} tab={0} />
            <Divider sx={{ my: 2 }} />
            <Section title="API-источники"    items={apis} icon={<ApiIcon color="secondary" />}    tab={1} />
        </Box>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────

const DataSourceDialog = ({ open, onClose, onDatasetSaved }) => {
    const [tab, setTab] = useState(0);

    const handleDatasetSaved = (ds) => {
        onDatasetSaved?.(ds);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
            PaperProps={{ sx: { height: '85vh' } }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorageIcon color="primary" />
                    <Typography variant="h6">Источники данных</Typography>
                </Box>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 1 }}>
                    <Tab icon={<StorageIcon fontSize="small" />} iconPosition="start" label="База данных" />
                    <Tab icon={<ApiIcon fontSize="small" />}     iconPosition="start" label="API" />
                    <Tab icon={<BookmarksIcon fontSize="small" />} iconPosition="start" label="Сохранённые" />
                </Tabs>
            </DialogTitle>

            <DialogContent dividers sx={{ overflow: 'auto' }}>
                <TabPanel value={tab} index={0}>
                    <DbTab onDatasetSaved={handleDatasetSaved} />
                </TabPanel>
                <TabPanel value={tab} index={1}>
                    <ApiTab onDatasetSaved={handleDatasetSaved} />
                </TabPanel>
                <TabPanel value={tab} index={2}>
                    <SavedTab onTabChange={setTab} />
                </TabPanel>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                    Сохранённые источники данных доступны при добавлении виджетов на дашборд
                </Typography>
                <Button onClick={onClose}>Закрыть</Button>
            </DialogActions>
        </Dialog>
    );
};

export default DataSourceDialog;
