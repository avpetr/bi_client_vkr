import React, { useState } from 'react';
import {
    ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
    PieChart, Pie, Cell, ScatterChart, Scatter, ComposedChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, Label, LabelList
} from 'recharts';
import { Paper, Typography, Box, IconButton, useTheme, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import { getDatasetById } from '../services/mockDatasets';
import AdvancedWidgetSettings from './AdvancedWidgetSettings';
import { applyCalculatedMetrics } from '../services/formulaEvaluator';
import { useRealTimeData } from '../hooks/useRealTimeData';
import RealTimeControls from './RealTimeControls';

// Predefined colors for multiple data series
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347'];

// Компонент, который рендерит нужный тип графика
const SmartWidget = ({ config, onDelete, onUpdate, style, className, ...props }) => {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const theme = useTheme();
    const textColor = theme.palette.text.primary;
    const gridColor = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
    const tooltipBg = theme.palette.background.paper;
    const tooltipBorder = theme.palette.divider;

    // Get dataset and its data
    const dataset = getDatasetById(config.datasetId || 'salesPerformance');
    const xAxisKey = dataset.xAxisKey || 'name';

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

    // Применяем вычисляемые метрики из конфига виджета
    const data = applyCalculatedMetrics(rawData, config.calculatedMetrics);

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
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                    {config.title}
                </Typography>
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
                p: 1.5,
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
                    ) : (
                        <ResponsiveContainer width="100%" height="100%" minHeight={160}>
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