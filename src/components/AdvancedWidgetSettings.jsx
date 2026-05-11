import React, { useState, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, Typography, TextField, FormControl, InputLabel, Select,
    MenuItem, IconButton, Switch, FormControlLabel, Tabs, Tab,
    Chip, Alert, Tooltip, Divider, Paper,
} from '@mui/material';
import SettingsIcon        from '@mui/icons-material/Settings';
import DeleteIcon          from '@mui/icons-material/Delete';
import ArrowUpwardIcon     from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon   from '@mui/icons-material/ArrowDownward';
import AddIcon             from '@mui/icons-material/Add';
import PlayArrowIcon       from '@mui/icons-material/PlayArrow';
import FunctionsIcon       from '@mui/icons-material/Functions';
import EditIcon            from '@mui/icons-material/Edit';

import { getDatasetOptions, getMetricsForDataset, getDatasetById } from '../services/mockDatasets';
import { testFormula, FORMULA_FUNCTIONS, applyCalculatedMetrics } from '../services/formulaEvaluator';

// ─── helpers ──────────────────────────────────────────────────────────────────

const genKey = () => `calc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

const emptyCalcMetric = () => ({
    key:     genKey(),
    label:   'Новая метрика',
    formula: '',
    color:   '#8884d8',
});

// ─── CalcMetricEditor ─────────────────────────────────────────────────────────

const CalcMetricEditor = ({ metric, datasetId, onSave, onCancel }) => {
    const [label,   setLabel]   = useState(metric.label);
    const [formula, setFormula] = useState(metric.formula);
    const [color,   setColor]   = useState(metric.color || '#8884d8');
    const [preview, setPreview] = useState(null); // { ok, value, error }

    const dataset        = getDatasetById(datasetId);
    const datasetMetrics = getMetricsForDataset(datasetId);
    const sampleFields   = datasetMetrics.map(m => m.key);

    const insertToken = (token) => setFormula(f => f ? `${f} ${token}` : token);

    const handleTest = useCallback(() => {
        const rawData = dataset.data ?? [];
        setPreview(testFormula(formula, rawData));
    }, [formula, dataset]);

    const handleSave = () => {
        if (!label.trim() || !formula.trim()) return;
        onSave({ ...metric, label: label.trim(), formula: formula.trim(), color });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Name + color */}
            <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                    label="Название метрики" size="small" sx={{ flex: 1 }}
                    value={label} onChange={e => setLabel(e.target.value)}
                />
                <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.3 }}>
                        Цвет
                    </Typography>
                    <input
                        type="color" value={color}
                        onChange={e => setColor(e.target.value)}
                        style={{ width: 48, height: 36, cursor: 'pointer', border: 'none', padding: 0, borderRadius: 4 }}
                    />
                </Box>
            </Box>

            {/* Available fields */}
            <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Доступные поля (нажмите — вставит в формулу):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {sampleFields.map(f => (
                        <Chip
                            key={f} label={f} size="small" variant="outlined" color="primary"
                            clickable onClick={() => insertToken(f)}
                        />
                    ))}
                </Box>
            </Box>

            {/* Formula input */}
            <TextField
                label="Формула" size="small" fullWidth multiline minRows={2}
                value={formula} onChange={e => setFormula(e.target.value)}
                placeholder="Например: profit / revenue * 100"
                inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
                helperText="Используйте названия полей, арифметику и функции"
            />

            {/* Quick-insert operators */}
            <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Операторы:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {['+', '-', '*', '/', '%', '**', '(', ')', '>', '<', '==', '!='].map(op => (
                        <Chip
                            key={op} label={op} size="small" variant="outlined"
                            clickable onClick={() => insertToken(op)}
                            sx={{ fontFamily: 'monospace', fontWeight: 700 }}
                        />
                    ))}
                </Box>
            </Box>

            {/* Functions reference */}
            <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Функции (нажмите — вставит шаблон):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {FORMULA_FUNCTIONS.map(({ fn, desc }) => (
                        <Tooltip key={fn} title={desc} placement="top">
                            <Chip
                                label={fn.split('(')[0] + '(…)'} size="small"
                                color="secondary" variant="outlined" clickable
                                onClick={() => insertToken(fn)}
                                sx={{ fontFamily: 'monospace' }}
                            />
                        </Tooltip>
                    ))}
                </Box>
            </Box>

            {/* Examples */}
            <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Примеры формул:
                </Typography>
                {[
                    ['Маржа прибыли (%)',   'profit / revenue * 100'],
                    ['Прибыль на клиента',  'profit / customers'],
                    ['Рост (абс.)',         'IF(profit > 0, profit, 0)'],
                    ['Округлённые продажи', 'round(sales / 1000, 1)'],
                    ['Доля от суммы (%)',   'sales / SUM("sales") * 100'],
                ].map(([name, ex]) => (
                    <Box
                        key={ex}
                        sx={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            py: 0.3, cursor: 'pointer', '&:hover': { color: 'primary.main' },
                        }}
                        onClick={() => { setFormula(ex); setLabel(prev => prev === 'Новая метрика' ? name : prev); }}
                    >
                        <Typography variant="caption">{name}</Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                            {ex}
                        </Typography>
                    </Box>
                ))}
            </Paper>

            {/* Test + preview */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <Button
                    size="small" variant="outlined" startIcon={<PlayArrowIcon />}
                    onClick={handleTest} disabled={!formula.trim()}
                >
                    Проверить
                </Button>
                {preview && (
                    <Alert severity={preview.ok ? 'success' : 'error'} sx={{ flex: 1, py: 0 }}>
                        {preview.ok
                            ? `Результат для первой строки: ${preview.value}`
                            : `Ошибка: ${preview.error}`
                        }
                    </Alert>
                )}
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button size="small" onClick={onCancel}>Отмена</Button>
                <Button
                    size="small" variant="contained"
                    disabled={!label.trim() || !formula.trim()}
                    onClick={handleSave}
                >
                    Сохранить метрику
                </Button>
            </Box>
        </Box>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

const AdvancedWidgetSettings = ({ open, onClose, config, onSave }) => {
    const [tabValue, setTabValue] = useState(0);
    const [settings, setSettings] = useState({
        datasetId:         config.datasetId || 'salesPerformance',
        dataKeys:          config.dataKeys  || ['sales'],
        xAxisKey:          config.xAxisKey  || null,    // null → берётся из dataset.xAxisKey
        sortByX:           config.sortByX   ?? false,    // сортировать по X (для временных рядов)
        showLegend:        config.settings?.showLegend        ?? true,
        showGrid:          config.settings?.showGrid          ?? true,
        showTooltip:       config.settings?.showTooltip       ?? true,
        showXAxis:         config.settings?.showXAxis         ?? true,
        showYAxis:         config.settings?.showYAxis         ?? true,
        showDataLabels:    config.settings?.showDataLabels    ?? false,
        animationDuration: config.settings?.animationDuration ?? 400,
        curveType:         config.settings?.curveType         ?? 'monotone',
        strokeWidth:       config.settings?.strokeWidth       ?? 2,
        fillOpacity:       config.settings?.fillOpacity       ?? 0.6,
        fontSize:          config.settings?.fontSize          ?? 12,
        seriesConfig:      config.settings?.seriesConfig      || {},
        calculatedMetrics: config.calculatedMetrics           || [],
    });

    // Editing state for calculated metrics
    const [editingCalc, setEditingCalc] = useState(null); // metric object or null

    const datasets        = getDatasetOptions();
    const datasetMetrics  = getMetricsForDataset(settings.datasetId);
    const datasetFull     = getDatasetById(settings.datasetId);

    // All selectable metrics = dataset metrics + calculated metrics
    const allMetrics = [
        ...datasetMetrics,
        ...settings.calculatedMetrics.map(cm => ({
            key:          cm.key,
            label:        cm.label,
            color:        cm.color || '#8884d8',
            isCalculated: true,
        })),
    ];

    // Для таблицы серии = ВСЕ колонки датасета (вкл. xAxisKey) + вычисляемые,
    // чтобы можно было переименовать каждый заголовок.
    const tableColumns = (() => {
        const firstRow = datasetFull?.data?.[0];
        if (!firstRow) return [];
        return Object.keys(firstRow).map(key => {
            const metric = allMetrics.find(m => m.key === key);
            return {
                key,
                label: metric?.label || key,
                color: metric?.color,
                isCalculated: metric?.isCalculated,
            };
        });
    })();

    const handleChange = (field, value) =>
        setSettings(prev => ({ ...prev, [field]: value }));

    const handleSeriesConfigChange = (metricKey, field, value) =>
        setSettings(prev => ({
            ...prev,
            seriesConfig: {
                ...prev.seriesConfig,
                [metricKey]: { ...prev.seriesConfig[metricKey], [field]: value },
            },
        }));

    const handleDatasetChange = (newDatasetId) => {
        const newMetrics = getMetricsForDataset(newDatasetId);
        setSettings(prev => ({
            ...prev,
            datasetId:         newDatasetId,
            dataKeys:          newMetrics.length > 0 ? [newMetrics[0].key] : [],
            calculatedMetrics: [],
        }));
    };

    const handleToggleMetric = (metricKey) => {
        if (config.type === 'pie') {
            setSettings(prev => ({ ...prev, dataKeys: [metricKey] }));
        } else {
            setSettings(prev => ({
                ...prev,
                dataKeys: prev.dataKeys.includes(metricKey)
                    ? prev.dataKeys.filter(k => k !== metricKey)
                    : [...prev.dataKeys, metricKey],
            }));
        }
    };

    const handleMoveMetric = (metricKey, direction) => {
        const idx = settings.dataKeys.indexOf(metricKey);
        if (idx === -1) return;
        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= settings.dataKeys.length) return;
        const arr = [...settings.dataKeys];
        [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
        setSettings(prev => ({ ...prev, dataKeys: arr }));
    };

    // Calculated metrics CRUD
    const handleSaveCalcMetric = (metric) => {
        setSettings(prev => {
            const existing = prev.calculatedMetrics.findIndex(m => m.key === metric.key);
            const updated  = existing >= 0
                ? prev.calculatedMetrics.map((m, i) => (i === existing ? metric : m))
                : [...prev.calculatedMetrics, metric];
            // Auto-add to dataKeys if new
            const dataKeys = prev.dataKeys.includes(metric.key)
                ? prev.dataKeys
                : [...prev.dataKeys, metric.key];
            return { ...prev, calculatedMetrics: updated, dataKeys };
        });
        setEditingCalc(null);
    };

    const handleDeleteCalcMetric = (key) => {
        setSettings(prev => ({
            ...prev,
            calculatedMetrics: prev.calculatedMetrics.filter(m => m.key !== key),
            dataKeys:          prev.dataKeys.filter(k => k !== key),
        }));
    };

    const handleSave = () => {
        onSave({
            ...config,
            datasetId:         settings.datasetId,
            dataKeys:          settings.dataKeys,
            xAxisKey:          settings.xAxisKey,
            sortByX:           settings.sortByX,
            calculatedMetrics: settings.calculatedMetrics,
            settings: {
                showLegend:        settings.showLegend,
                showGrid:          settings.showGrid,
                showTooltip:       settings.showTooltip,
                showXAxis:         settings.showXAxis,
                showYAxis:         settings.showYAxis,
                showDataLabels:    settings.showDataLabels,
                animationDuration: settings.animationDuration,
                curveType:         settings.curveType,
                strokeWidth:       settings.strokeWidth,
                fillOpacity:       settings.fillOpacity,
                fontSize:          settings.fontSize,
                seriesConfig:      settings.seriesConfig,
            },
        });
        onClose();
    };

    const getSeriesConfig = (metricKey) => {
        const metric = allMetrics.find(m => m.key === metricKey);
        return { ...metric, ...settings.seriesConfig[metricKey] };
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <SettingsIcon />
                    <Typography variant="h6">Настройки графика</Typography>
                </Box>
                <Typography variant="caption" color="textSecondary">{config.title}</Typography>
            </DialogTitle>

            <DialogContent>
                <Tabs
                    value={tabValue}
                    onChange={(_, v) => setTabValue(v)}
                    sx={{ mb: 2 }}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label="Данные" />
                    <Tab label="Серии" />
                    <Tab label="Вычисления" icon={<FunctionsIcon fontSize="small" />} iconPosition="end" />
                    <Tab label="Отображение" />
                    <Tab label="Стиль" />
                </Tabs>

                {/* ── Tab 0: Data source + metric selection ── */}
                {tabValue === 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>Источник данных</InputLabel>
                            <Select
                                value={settings.datasetId}
                                label="Источник данных"
                                onChange={e => handleDatasetChange(e.target.value)}
                            >
                                {datasets.map(ds => (
                                    <MenuItem key={ds.value} value={ds.value}>
                                        <Box>
                                            {ds.label}
                                            {ds.isRealTime && (
                                                <Chip label="Real-time" size="small" color="success" sx={{ ml: 1, fontSize: '0.6rem', height: 16 }} />
                                            )}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Выбор колонки оси X — только для типов с осями */}
                        {!['pie', 'card', 'table', 'scatter'].includes(config.type) && (() => {
                            const allColumns = (() => {
                                const firstRow = datasetFull?.data?.[0];
                                if (!firstRow) return [];
                                return Object.keys(firstRow);
                            })();
                            if (allColumns.length === 0) return null;
                            const currentX = settings.xAxisKey || datasetFull?.xAxisKey || allColumns[0];
                            return (
                                <Box>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Колонка для оси X</InputLabel>
                                        <Select
                                            value={currentX}
                                            label="Колонка для оси X"
                                            onChange={e => handleChange('xAxisKey', e.target.value)}
                                        >
                                            {allColumns.map(col => {
                                                const firstRow = datasetFull?.data?.[0];
                                                const isNumber = typeof firstRow?.[col] === 'number';
                                                return (
                                                    <MenuItem key={col} value={col}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <span style={{ fontFamily: 'monospace' }}>{col}</span>
                                                            <Chip
                                                                label={isNumber ? '№' : 'A'}
                                                                size="small"
                                                                color={isNumber ? 'primary' : 'default'}
                                                                sx={{ fontSize: '0.6rem', height: 16, minWidth: 28 }}
                                                            />
                                                        </Box>
                                                    </MenuItem>
                                                );
                                            })}
                                        </Select>
                                    </FormControl>
                                    <FormControlLabel
                                        sx={{ mt: 1 }}
                                        control={
                                            <Switch
                                                size="small"
                                                checked={settings.sortByX}
                                                onChange={e => handleChange('sortByX', e.target.checked)}
                                            />
                                        }
                                        label={<Typography variant="caption">Сортировать данные по оси X (для временных рядов)</Typography>}
                                    />
                                </Box>
                            );
                        })()}

                        <Typography variant="subtitle2">Выберите метрики:</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {allMetrics.map(metric => (
                                <Box
                                    key={metric.key}
                                    onClick={() => handleToggleMetric(metric.key)}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 1, p: 1,
                                        border: '1px solid',
                                        borderColor: settings.dataKeys.includes(metric.key) ? 'primary.main' : 'divider',
                                        borderRadius: 1, cursor: 'pointer',
                                        bgcolor: settings.dataKeys.includes(metric.key) ? 'action.selected' : 'transparent',
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                >
                                    <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: metric.color, flexShrink: 0 }} />
                                    <Typography variant="body2" sx={{ flex: 1 }}>{metric.label}</Typography>
                                    {metric.isCalculated && (
                                        <Chip label="вычисл." size="small" color="secondary" sx={{ fontSize: '0.6rem', height: 16 }} />
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}

                {/* ── Tab 1: Series config — для таблицы: переименование колонок ── */}
                {tabValue === 1 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {config.type === 'table' ? (
                            <>
                                <Typography variant="body2" color="text.secondary">
                                    Переименуйте заголовки колонок таблицы
                                </Typography>
                                {tableColumns.length === 0 ? (
                                    <Typography variant="body2" align="center" color="text.secondary">
                                        Нет данных для отображения колонок
                                    </Typography>
                                ) : (
                                    tableColumns.map(col => {
                                        const customLabel = settings.seriesConfig[col.key]?.label;
                                        return (
                                            <Paper key={col.key} variant="outlined" sx={{ p: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Box sx={{ minWidth: 0, flex: '0 0 auto' }}>
                                                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', display: 'block' }}>
                                                            {col.key}
                                                        </Typography>
                                                        {col.isCalculated && (
                                                            <Chip label="вычисл." size="small" color="secondary" sx={{ fontSize: '0.6rem', height: 16 }} />
                                                        )}
                                                    </Box>
                                                    <TextField
                                                        label="Заголовок в таблице" size="small" sx={{ flex: 1 }}
                                                        value={customLabel ?? col.label}
                                                        onChange={e => handleSeriesConfigChange(col.key, 'label', e.target.value)}
                                                        placeholder={col.label}
                                                    />
                                                </Box>
                                            </Paper>
                                        );
                                    })
                                )}
                            </>
                        ) : (
                            <>
                                <Typography variant="body2" color="text.secondary">
                                    Переименуйте, измените цвет и порядок серий
                                </Typography>

                                {settings.dataKeys.length === 0 ? (
                                    <Typography variant="body2" align="center" color="text.secondary">
                                        Выберите метрики на вкладке «Данные»
                                    </Typography>
                                ) : (
                                    settings.dataKeys.map((metricKey, index) => {
                                        const sc = getSeriesConfig(metricKey);
                                        return (
                                            <Paper key={metricKey} variant="outlined" sx={{ p: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: sc.color || '#8884d8' }} />
                                                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                                            {metricKey}
                                                        </Typography>
                                                    </Box>
                                                    <Box>
                                                        <IconButton size="small" onClick={() => handleMoveMetric(metricKey, 'up')}  disabled={index === 0}>
                                                            <ArrowUpwardIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" onClick={() => handleMoveMetric(metricKey, 'down')} disabled={index === settings.dataKeys.length - 1}>
                                                            <ArrowDownwardIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </Box>

                                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 2, alignItems: 'end' }}>
                                                    <TextField
                                                        label="Название в легенде" size="small" fullWidth
                                                        value={sc.label || metricKey}
                                                        onChange={e => handleSeriesConfigChange(metricKey, 'label', e.target.value)}
                                                    />
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.3 }}>
                                                            Цвет
                                                        </Typography>
                                                        <input
                                                            type="color"
                                                            value={sc.color || '#8884d8'}
                                                            onChange={e => handleSeriesConfigChange(metricKey, 'color', e.target.value)}
                                                            style={{ width: 48, height: 36, cursor: 'pointer', border: 'none', padding: 0, borderRadius: 4 }}
                                                        />
                                                    </Box>
                                                </Box>

                                                {config.type === 'composed' && (
                                                    <FormControl size="small" fullWidth sx={{ mt: 2 }}>
                                                        <InputLabel>Тип графика</InputLabel>
                                                        <Select
                                                            value={sc.chartType || 'bar'} label="Тип графика"
                                                            onChange={e => handleSeriesConfigChange(metricKey, 'chartType', e.target.value)}
                                                        >
                                                            <MenuItem value="bar">Столбцы</MenuItem>
                                                            <MenuItem value="line">Линия</MenuItem>
                                                            <MenuItem value="area">Область</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                )}

                                                <FormControlLabel
                                                    sx={{ mt: 1 }}
                                                    control={
                                                        <Switch
                                                            size="small"
                                                            checked={sc.showDataLabels ?? false}
                                                            onChange={e => handleSeriesConfigChange(metricKey, 'showDataLabels', e.target.checked)}
                                                        />
                                                    }
                                                    label="Подписи значений"
                                                />
                                            </Paper>
                                        );
                                    })
                                )}
                            </>
                        )}
                    </Box>
                )}

                {/* ── Tab 2: Calculated metrics ── */}
                {tabValue === 2 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {editingCalc ? (
                            <CalcMetricEditor
                                metric={editingCalc}
                                datasetId={settings.datasetId}
                                onSave={handleSaveCalcMetric}
                                onCancel={() => setEditingCalc(null)}
                            />
                        ) : (
                            <>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Создайте метрики на основе формул. Они добавятся в список доступных серий.
                                    </Typography>
                                    <Button
                                        size="small" variant="contained" startIcon={<AddIcon />}
                                        onClick={() => setEditingCalc(emptyCalcMetric())}
                                    >
                                        Добавить
                                    </Button>
                                </Box>

                                {settings.calculatedMetrics.length === 0 ? (
                                    <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                                        <FunctionsIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.4, mb: 1, display: 'block', mx: 'auto' }} />
                                        <Typography variant="body2" color="text.secondary">
                                            Нет вычисляемых метрик
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Примеры: маржа прибыли, % от суммы, нормированные значения
                                        </Typography>
                                    </Paper>
                                ) : (
                                    settings.calculatedMetrics.map(cm => (
                                        <Paper key={cm.key} variant="outlined" sx={{ p: 1.5 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                                                    <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: cm.color, flexShrink: 0 }} />
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="body2" fontWeight={600} noWrap>{cm.label}</Typography>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{ fontFamily: 'monospace', color: 'text.secondary', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                        >
                                                            = {cm.formula}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', flexShrink: 0 }}>
                                                    <IconButton size="small" onClick={() => setEditingCalc({ ...cm })}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => handleDeleteCalcMetric(cm.key)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        </Paper>
                                    ))
                                )}
                            </>
                        )}
                    </Box>
                )}

                {/* ── Tab 3: Display toggles ── */}
                {tabValue === 3 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {[
                            ['showLegend',     'Показывать легенду'],
                            ['showGrid',       'Показывать сетку'],
                            ['showTooltip',    'Показывать подсказки'],
                            ['showXAxis',      'Показывать ось X'],
                            ['showYAxis',      'Показывать ось Y'],
                            ['showDataLabels', 'Подписи значений на всех сериях'],
                        ].map(([field, label]) => (
                            <FormControlLabel
                                key={field}
                                control={<Switch checked={settings[field]} onChange={e => handleChange(field, e.target.checked)} />}
                                label={label}
                            />
                        ))}
                    </Box>
                )}

                {/* ── Tab 4: Style ── */}
                {tabValue === 4 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {(config.type === 'line' || config.type === 'area' || config.type === 'composed') && (
                            <>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Тип кривой</InputLabel>
                                    <Select value={settings.curveType} label="Тип кривой" onChange={e => handleChange('curveType', e.target.value)}>
                                        <MenuItem value="monotone">Плавная</MenuItem>
                                        <MenuItem value="linear">Линейная</MenuItem>
                                        <MenuItem value="step">Ступенчатая</MenuItem>
                                        <MenuItem value="natural">Естественная</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Толщина линии (px)" type="number" size="small" fullWidth
                                    value={settings.strokeWidth}
                                    onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 1 && v <= 5) handleChange('strokeWidth', v); }}
                                    inputProps={{ min: 1, max: 5, step: 0.5 }}
                                />
                            </>
                        )}
                        {config.type === 'area' && (
                            <TextField
                                label="Непрозрачность (%)" type="number" size="small" fullWidth
                                value={Math.round(settings.fillOpacity * 100)}
                                onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 10 && v <= 100) handleChange('fillOpacity', v / 100); }}
                                inputProps={{ min: 10, max: 100, step: 10 }}
                            />
                        )}
                        <TextField
                            label="Длительность анимации (мс)" type="number" size="small" fullWidth
                            value={settings.animationDuration}
                            onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 0 && v <= 2000) handleChange('animationDuration', v); }}
                            inputProps={{ min: 0, max: 2000, step: 100 }}
                            helperText="0 = без анимации"
                        />
                        <TextField
                            label="Размер шрифта (px)" type="number" size="small" fullWidth
                            value={settings.fontSize}
                            onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 8 && v <= 20) handleChange('fontSize', v); }}
                            inputProps={{ min: 8, max: 20, step: 1 }}
                        />
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose}>Отмена</Button>
                <Button onClick={handleSave} variant="contained" disabled={settings.dataKeys.length === 0}>
                    Применить
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AdvancedWidgetSettings;
