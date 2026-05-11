import React, { useState } from 'react';
import {
    ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
    PieChart, Pie, Cell, ScatterChart, Scatter, ComposedChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, Label, LabelList
} from 'recharts';
import {
    Paper, Typography, Box, IconButton, useTheme, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import TrendingUpIcon   from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import DeleteIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import { getDatasetById } from '../services/mockDatasets';
import AdvancedWidgetSettings from './AdvancedWidgetSettings';
import { applyCalculatedMetrics } from '../services/formulaEvaluator';
import { applyFilters, filtersAffectingWidget } from '../services/filterApplicator';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { Badge, Tooltip as MuiTooltip } from '@mui/material';

const OPERATOR_LABELS = {
    equals:         '=',
    notEquals:      '≠',
    greaterThan:    '>',
    lessThan:       '<',
    greaterOrEqual: '≥',
    lessOrEqual:    '≤',
    between:        'между',
    contains:       'содержит',
    startsWith:     'начинается с',
    endsWith:       'заканчивается на',
};

const formatFilterValue = (filter) =>
    filter.operator === 'between'
        ? `${filter.value} … ${filter.valueTo}`
        : String(filter.value);
import { useRealTimeData } from '../hooks/useRealTimeData';
import RealTimeControls from './RealTimeControls';

// Predefined colors for multiple data series
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347'];

// Компонент, который рендерит нужный тип графика
const SmartWidget = ({ config, onDelete, onUpdate, filters, isResizing, style, className, ...props }) => {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const theme = useTheme();
    const textColor = theme.palette.text.primary;
    const gridColor = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
    const tooltipBg = theme.palette.background.paper;
    const tooltipBorder = theme.palette.divider;

    // Get dataset and its data
    const dataset = getDatasetById(config.datasetId || 'salesPerformance');
    // Колонка оси X: приоритет — настройка виджета, потом datasetXAxisKey, потом 'name'
    const xAxisKey = config.xAxisKey || dataset.xAxisKey || 'name';

    // ── Реальное время ──────────────────────────────────────────────────────
    const isRealTime = Boolean(dataset.isRealTime);
    const rtInterval = config.realTime?.interval ?? dataset.defaultInterval ?? 60_000;

    const {
        data: liveData,
        loading: rtLoading,
        error: rtError,
        lastUpdated: rtLastUpdated,
        refresh: rtRefresh,
        refreshInterval,
        setRefreshInterval,
    } = useRealTimeData(isRealTime ? dataset.sourceId : null, {
        interval: rtInterval,
        enabled: isRealTime,
    });

    // Если датасет real-time и данные уже пришли — используем их; иначе статика
    // Пока первый запрос не завершился — пустой массив (чтобы графики не падали)
    const rawData = (isRealTime && liveData) ? liveData : (dataset.data ?? []);

    // 1) Применяем фильтры дашборда → 2) Вычисляемые метрики → 3) Опц. сортировка по X
    const filteredData = applyFilters(rawData, filters, config.datasetId);
    const enrichedData = applyCalculatedMetrics(filteredData, config.calculatedMetrics);
    const data = config.sortByX
        ? [...enrichedData].sort((a, b) => {
              const av = a[xAxisKey], bv = b[xAxisKey];
              if (typeof av === 'number' && typeof bv === 'number') return av - bv;
              return String(av ?? '').localeCompare(String(bv ?? ''));
          })
        : enrichedData;

    // Сколько фильтров реально влияет на этот виджет (для индикатора)
    const affectingFilters = filtersAffectingWidget(filters, config.datasetId);

    // Когда пользователь меняет интервал через RealTimeControls → сохраняем в конфиге
    const handleIntervalChange = (ms) => {
        setRefreshInterval(ms);
        if (onUpdate) {
            onUpdate({ ...config, realTime: { ...config.realTime, interval: ms } });
        }
    };
    // ───────────────────────────────────────────────────────────────────────

    // Get metrics configuration — датасетные + вычисляемые метрики
    const dataKeys = config.dataKeys || [config.dataKey] || ['sales'];
    const calcMetrics = (config.calculatedMetrics || []).map(cm => ({
        key: cm.key, label: cm.label, color: cm.color || '#8884d8',
    }));
    const metrics = [...dataset.metrics, ...calcMetrics].filter(m => dataKeys.includes(m.key));

    // Get series configuration
    const seriesConfig = config.settings?.seriesConfig || {};
    const getSeriesSettings = (metricKey) => {
        const defaultMetric = metrics.find(m => m.key === metricKey);
        return {
            ...defaultMetric,
            ...seriesConfig[metricKey]
        };
    };

    // Get settings with defaults
    const settings = config.settings || {};
    const showLegend = settings.showLegend ?? true;
    const showGrid = settings.showGrid ?? true;
    const showTooltip = settings.showTooltip ?? true;
    const showXAxis = settings.showXAxis ?? true;
    const showYAxis = settings.showYAxis ?? true;
    const showDataLabels = settings.showDataLabels ?? false;
    const animationDuration = settings.animationDuration ?? 400;
    const curveType = settings.curveType ?? 'monotone';
    const strokeWidth = settings.strokeWidth ?? 2;
    const fillOpacity = settings.fillOpacity ?? 0.6;
    const fontSize = settings.fontSize ?? 12;

    // Выбор типа графика
    const renderChart = () => {
        const commonProps = {
            data: data,
            margin: { top: 10, right: 30, left: 0, bottom: 0 }
        };

        const animationProps = {
            isAnimationActive: animationDuration > 0,
            animationDuration: animationDuration
        };

        const axisProps = {
            tick: { fill: textColor, fontSize },
            stroke: gridColor,
        };

        const tooltipProps = {
            contentStyle: {
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                color: textColor,
            },
            labelStyle: { color: textColor },
        };

        const legendStyle = { fontSize: `${fontSize}px`, color: textColor };

        // ── KPI card: большие числа сверху по выбранным метрикам ────────────
        if (config.type === 'card') {
            const aggregate = settings.cardAggregate || 'last'; // last | sum | avg | max | min
            const formatNum = (n) => {
                if (n == null || isNaN(n)) return '—';
                const abs = Math.abs(n);
                if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2) + ' млн';
                if (abs >= 1_000)     return (n / 1_000).toFixed(1)     + ' тыс';
                return Math.abs(n) < 10 ? n.toFixed(2) : Math.round(n).toLocaleString('ru-RU');
            };
            const computeAgg = (key) => {
                const nums = data.map(r => parseFloat(r[key])).filter(v => !isNaN(v));
                if (nums.length === 0) return null;
                switch (aggregate) {
                    case 'sum': return nums.reduce((a, b) => a + b, 0);
                    case 'avg': return nums.reduce((a, b) => a + b, 0) / nums.length;
                    case 'max': return Math.max(...nums);
                    case 'min': return Math.min(...nums);
                    case 'last':
                    default:    return nums[nums.length - 1];
                }
            };
            const computeDelta = (key) => {
                const nums = data.map(r => parseFloat(r[key])).filter(v => !isNaN(v));
                if (nums.length < 2) return null;
                const first = nums[0], last = nums[nums.length - 1];
                if (first === 0) return null;
                return ((last - first) / Math.abs(first)) * 100;
            };
            const AGGREGATE_LABELS = { last: 'последнее', sum: 'сумма', avg: 'среднее', max: 'максимум', min: 'минимум' };

            return (
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min(dataKeys.length, 4)}, minmax(0, 1fr))`,
                    gap: 1, height: '100%', width: '100%',
                }}>
                    {dataKeys.map((key, idx) => {
                        const series = getSeriesSettings(key);
                        const value  = computeAgg(key);
                        const delta  = computeDelta(key);
                        const color  = series.color || COLORS[idx % COLORS.length];
                        const TrendIcon = delta == null ? null : (delta > 0.1 ? TrendingUpIcon : delta < -0.1 ? TrendingDownIcon : TrendingFlatIcon);
                        const trendColor = delta == null ? 'text.secondary' : (delta > 0.1 ? 'success.main' : delta < -0.1 ? 'error.main' : 'text.secondary');

                        return (
                            <Box key={key} sx={{
                                containerType: 'size',
                                borderRadius: 1.5,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderLeft: `3px solid ${color}`,
                                bgcolor: theme.palette.mode === 'dark' ? `${color}14` : `${color}0d`,
                                px: 1.25, py: 1,
                                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                                minWidth: 0, minHeight: 0,
                                overflow: 'hidden',
                            }}>
                                <Typography color="text.secondary" noWrap sx={{
                                    textTransform: 'uppercase', letterSpacing: 0.5,
                                    fontSize: 'clamp(0.55rem, 11cqh, 0.7rem)',
                                    lineHeight: 1.1,
                                }}>
                                    {series.label || key}
                                </Typography>
                                <Typography noWrap sx={{
                                    fontWeight: 700, color, lineHeight: 1.15,
                                    fontSize: 'clamp(0.9rem, 30cqh, 1.6rem)',
                                    mt: 0.25,
                                }}>
                                    {formatNum(value)}
                                </Typography>
                                <Box sx={{
                                    display: 'flex', alignItems: 'center', gap: 0.3, mt: 0.25,
                                    '@container (max-height: 70px)': { display: 'none' },
                                }}>
                                    {TrendIcon && <TrendIcon sx={{
                                        color: trendColor,
                                        fontSize: 'clamp(0.65rem, 12cqh, 0.85rem)',
                                    }} />}
                                    <Typography noWrap sx={{
                                        color: trendColor,
                                        fontSize: 'clamp(0.55rem, 10cqh, 0.7rem)',
                                        lineHeight: 1.2,
                                    }}>
                                        {delta == null ? AGGREGATE_LABELS[aggregate]
                                            : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            );
        }

        // ── Table: таблица всех строк датасета ──────────────────────────────
        if (config.type === 'table') {
            const columns = data.length > 0 ? Object.keys(data[0]) : [];
            // Тип колонки определяем по первой строке (число / текст)
            const colType = (c) => {
                const sample = data.find(r => r[c] != null);
                return sample && typeof sample[c] === 'number' ? 'number' : 'text';
            };
            // Подпись колонки: пользовательская из seriesConfig → label метрики из датасета → сам ключ
            const headerLabel = (c) => {
                const custom = seriesConfig[c]?.label;
                if (custom) return custom;
                const datasetMetric = dataset.metrics?.find(m => m.key === c);
                if (datasetMetric?.label) return datasetMetric.label;
                return c;
            };
            const formatCell = (v) => {
                if (v == null) return '—';
                if (typeof v === 'number') {
                    return Math.abs(v) >= 1000 ? v.toLocaleString('ru-RU') : Number.isInteger(v) ? v : v.toFixed(2);
                }
                return String(v);
            };
            return (
                <TableContainer sx={{ height: '100%', overflow: 'auto' }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                {columns.map(c => (
                                    <TableCell key={c} sx={{
                                        fontWeight: 700,
                                        bgcolor: 'background.paper',
                                        whiteSpace: 'nowrap',
                                        textAlign: colType(c) === 'number' ? 'right' : 'left',
                                    }}>
                                        {headerLabel(c)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((row, i) => (
                                <TableRow key={i} hover>
                                    {columns.map(c => (
                                        <TableCell key={c} sx={{
                                            fontSize: `${fontSize - 1}px`,
                                            textAlign: colType(c) === 'number' ? 'right' : 'left',
                                            fontVariantNumeric: 'tabular-nums',
                                        }}>
                                            {formatCell(row[c])}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            );
        }

        switch (config.type) {
            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />}
                        {showXAxis && <XAxis dataKey={xAxisKey} {...axisProps} />}
                        {showYAxis && <YAxis {...axisProps} />}
                        {showTooltip && <Tooltip {...tooltipProps} />}
                        {showLegend && <Legend wrapperStyle={legendStyle} />}
                        {dataKeys.map((key, idx) => {
                            const series = getSeriesSettings(key);
                            const shouldShowLabels = series.showDataLabels ?? showDataLabels;
                            return (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={series.color || COLORS[idx % COLORS.length]}
                                    name={series.label}
                                    {...animationProps}
                                >
                                    {shouldShowLabels && <LabelList position="top" fontSize={fontSize - 2} fill={textColor} />}
                                </Bar>
                            );
                        })}
                    </BarChart>
                );

            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />}
                        {showXAxis && <XAxis dataKey={xAxisKey} {...axisProps} />}
                        {showYAxis && <YAxis {...axisProps} />}
                        {showTooltip && <Tooltip {...tooltipProps} />}
                        {showLegend && <Legend wrapperStyle={legendStyle} />}
                        {dataKeys.map((key, idx) => {
                            const series = getSeriesSettings(key);
                            const shouldShowLabels = series.showDataLabels ?? showDataLabels;
                            return (
                                <Area
                                    key={key}
                                    type={curveType}
                                    dataKey={key}
                                    stroke={series.color || COLORS[idx % COLORS.length]}
                                    fill={series.color || COLORS[idx % COLORS.length]}
                                    fillOpacity={fillOpacity}
                                    strokeWidth={strokeWidth}
                                    name={series.label}
                                    {...animationProps}
                                >
                                    {shouldShowLabels && <LabelList position="top" fontSize={fontSize - 2} fill={textColor} />}
                                </Area>
                            );
                        })}
                    </AreaChart>
                );

            case 'pie': {
                // Pie chart uses the first metric only
                const pieMetric = metrics[0];
                return (
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={showDataLabels}
                            label={showDataLabels ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey={pieMetric.key}
                            {...animationProps}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        {showTooltip && <Tooltip {...tooltipProps} />}
                        {showLegend && <Legend wrapperStyle={legendStyle} />}
                    </PieChart>
                );
            }

            case 'scatter': {
                // For scatter, use first two metrics as x and y
                const xMetric = metrics[0];
                const yMetric = metrics[1] || metrics[0];
                return (
                    <ScatterChart {...commonProps}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />}
                        {showXAxis && (
                            <XAxis
                                type="number"
                                dataKey={xMetric.key}
                                name={xMetric.label}
                                {...axisProps}
                            />
                        )}
                        {showYAxis && (
                            <YAxis
                                type="number"
                                dataKey={yMetric.key}
                                name={yMetric.label}
                                {...axisProps}
                            />
                        )}
                        {showTooltip && <Tooltip cursor={{ strokeDasharray: '3 3' }} {...tooltipProps} />}
                        {showLegend && <Legend wrapperStyle={legendStyle} />}
                        <Scatter
                            name={`${xMetric.label} vs ${yMetric.label}`}
                            data={data}
                            fill={xMetric.color || '#8884d8'}
                            {...animationProps}
                        />
                    </ScatterChart>
                );
            }

            case 'composed':
                return (
                    <ComposedChart {...commonProps}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />}
                        {showXAxis && <XAxis dataKey={xAxisKey} {...axisProps} />}
                        {showYAxis && <YAxis {...axisProps} />}
                        {showTooltip && <Tooltip {...tooltipProps} />}
                        {showLegend && <Legend wrapperStyle={legendStyle} />}
                        {dataKeys.map((key, idx) => {
                            const series = getSeriesSettings(key);
                            const shouldShowLabels = series.showDataLabels ?? showDataLabels;
                            const chartType = series.chartType || (idx % 3 === 0 ? 'bar' : idx % 3 === 1 ? 'line' : 'area');

                            if (chartType === 'bar') {
                                return (
                                    <Bar
                                        key={key}
                                        dataKey={key}
                                        fill={series.color || COLORS[idx % COLORS.length]}
                                        name={series.label}
                                        {...animationProps}
                                    >
                                        {shouldShowLabels && <LabelList position="top" fontSize={fontSize - 2} fill={textColor} />}
                                    </Bar>
                                );
                            } else if (chartType === 'line') {
                                return (
                                    <Line
                                        key={key}
                                        type={curveType}
                                        dataKey={key}
                                        stroke={series.color || COLORS[idx % COLORS.length]}
                                        strokeWidth={strokeWidth}
                                        name={series.label}
                                        {...animationProps}
                                    >
                                        {shouldShowLabels && <LabelList position="top" fontSize={fontSize - 2} fill={textColor} />}
                                    </Line>
                                );
                            } else {
                                return (
                                    <Area
                                        key={key}
                                        type={curveType}
                                        dataKey={key}
                                        stroke={series.color || COLORS[idx % COLORS.length]}
                                        fill={series.color || COLORS[idx % COLORS.length]}
                                        fillOpacity={fillOpacity}
                                        strokeWidth={strokeWidth}
                                        name={series.label}
                                        {...animationProps}
                                    />
                                );
                            }
                        })}
                    </ComposedChart>
                );

            case 'line':
            default:
                return (
                    <LineChart {...commonProps}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />}
                        {showXAxis && <XAxis dataKey={xAxisKey} {...axisProps} />}
                        {showYAxis && <YAxis {...axisProps} />}
                        {showTooltip && <Tooltip {...tooltipProps} />}
                        {showLegend && <Legend wrapperStyle={legendStyle} />}
                        {dataKeys.map((key, idx) => {
                            const series = getSeriesSettings(key);
                            const shouldShowLabels = series.showDataLabels ?? showDataLabels;
                            return (
                                <Line
                                    key={key}
                                    type={curveType}
                                    dataKey={key}
                                    stroke={series.color || COLORS[idx % COLORS.length]}
                                    name={series.label}
                                    strokeWidth={strokeWidth}
                                    {...animationProps}
                                >
                                    {shouldShowLabels && <LabelList position="top" fontSize={fontSize - 2} fill={textColor} />}
                                </Line>
                            );
                        })}
                    </LineChart>
                );
        }
    };

    return (
        // style, className и props прокидываются от react-grid-layout для корректного позиционирования
        <Paper
            style={{
                ...style,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: '100%',
                overflow: 'hidden'
            }}
            className={className}
            {...props}
            elevation={3}
        >
            {/* Шапка виджета с кнопкой удаления */}
            <Box
                sx={{
                    p: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'move',
                    bgcolor: 'background.paper',
                    flexShrink: 0
                }}
                className="grid-drag-handle"
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {config.title}
                    </Typography>
                    {affectingFilters.length > 0 && (
                        <MuiTooltip
                            arrow
                            placement="bottom-start"
                            title={
                                <Box sx={{ p: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                                        Применённые фильтры
                                    </Typography>
                                    {affectingFilters.map(f => (
                                        <Box key={f.id} sx={{ mb: 0.5 }}>
                                            <Typography variant="caption" sx={{ display: 'block', opacity: 0.85 }}>
                                                {f.columns.map(c => c.displayName || c.name).join(' / ')}
                                            </Typography>
                                            <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace' }}>
                                                {OPERATOR_LABELS[f.operator] || f.operator} {formatFilterValue(f)}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            }
                        >
                            <Badge badgeContent={affectingFilters.length} color="primary">
                                <FilterAltIcon fontSize="small" color="primary" sx={{ opacity: 0.85 }} />
                            </Badge>
                        </MuiTooltip>
                    )}
                </Box>
                <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                >
                    {/* Панель управления реальным временем */}
                    {isRealTime && (
                        <RealTimeControls
                            loading={rtLoading}
                            error={rtError}
                            lastUpdated={rtLastUpdated}
                            refreshInterval={refreshInterval}
                            onRefresh={rtRefresh}
                            onIntervalChange={handleIntervalChange}
                        />
                    )}

                    {onUpdate && (
                        <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); setSettingsOpen(true); }}
                            sx={{ '&:hover': { color: 'primary.main' }, padding: { xs: '8px', sm: '4px' } }}
                            title="Настройки графика"
                        >
                            <SettingsIcon fontSize="small" />
                        </IconButton>
                    )}
                    {onDelete && (
                        <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); onDelete(config.i); }}
                            sx={{ '&:hover': { color: 'error.main' }, padding: { xs: '8px', sm: '4px' } }}
                            title="Удалить график"
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            </Box>

            {/* Область графика */}
            <Box sx={{
                flex: 1,
                p: config.type === 'card' ? 1 : (config.type === 'table' ? 0 : 1.5),
                minHeight: 0,
                minWidth: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}>
                <Box sx={{ flex: 1, minHeight: 0, width: '100%', height: '100%' }}>
                    {/* Первичная загрузка real-time источника */}
                    {isRealTime && rtLoading && data.length === 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <CircularProgress size={32} />
                        </Box>
                    ) : isResizing ? (
                        // Во время resize не перерисовываем график — экономим CPU
                        <Box sx={{
                            width: '100%', height: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px dashed', borderColor: 'divider', borderRadius: 1,
                            bgcolor: 'action.hover',
                        }}>
                            <Typography variant="caption" color="text.secondary">
                                Изменение размера…
                            </Typography>
                        </Box>
                    ) : config.type === 'card' ? (
                        <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                            {renderChart()}
                        </Box>
                    ) : config.type === 'table' ? (
                        <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
                            {renderChart()}
                        </Box>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            {renderChart()}
                        </ResponsiveContainer>
                    )}
                </Box>
            </Box>

            {/* Settings Dialog */}
            {onUpdate && (
                <AdvancedWidgetSettings
                    open={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    config={config}
                    onSave={onUpdate}
                />
            )}
        </Paper>
    );
};

export default SmartWidget;