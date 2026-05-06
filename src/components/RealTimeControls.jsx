/**
 * RealTimeControls.jsx
 *
 * Панель управления обновлением данных в реальном времени.
 * Отображается в шапке виджета когда датасет является real-time источником.
 */

import React, { useState, useEffect } from 'react';
import {
    Box, IconButton, Select, MenuItem, Typography, CircularProgress,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

// Варианты интервалов (label → мс)
export const INTERVAL_OPTIONS = [
    { label: '5 сек',   value: 5_000 },
    { label: '15 сек',  value: 15_000 },
    { label: '30 сек',  value: 30_000 },
    { label: '1 мин',   value: 60_000 },
    { label: '5 мин',   value: 300_000 },
    { label: '10 мин',  value: 600_000 },
    { label: '30 мин',  value: 1_800_000 },
];

function formatLastUpdated(date) {
    if (!date) return null;
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 5)  return 'только что';
    if (diffSec < 60) return `${diffSec} сек назад`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} мин назад`;
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

const stopProp = (e) => e.stopPropagation();

const RealTimeControls = ({
    loading,
    error,
    lastUpdated,
    refreshInterval,
    onRefresh,
    onIntervalChange,
}) => {
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTick(t => t + 1), 10_000);
        return () => clearInterval(id);
    }, []);

    // tick используется только для того, чтобы React перерендерил время
    void tick;

    const lastUpdatedText = formatLastUpdated(lastUpdated);
    const hasError = Boolean(error);
    const indicatorTitle = hasError
        ? `Ошибка: ${error?.message}`
        : lastUpdatedText
            ? `Обновлено: ${lastUpdatedText}`
            : 'Ожидание первого обновления';

    return (
        <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            onMouseDown={stopProp}
            onTouchStart={stopProp}
        >
            {/* ── Индикатор LIVE / загрузка ── */}
            {loading ? (
                <CircularProgress size={12} thickness={5} sx={{ mx: 0.5 }} />
            ) : (
                /* Tooltip требует forwardRef от дочернего элемента.
                   FiberManualRecordIcon его поддерживает, но бросает warning button=true
                   когда Tooltip пытается добавить tabIndex. Оборачиваем в span без button-пропов. */
                <Box
                    component="span"
                    title={indicatorTitle}
                    sx={{ display: 'inline-flex', alignItems: 'center', cursor: 'default' }}
                >
                    <FiberManualRecordIcon
                        sx={{
                            fontSize: 10,
                            color: hasError ? 'error.main' : 'success.main',
                            animation: hasError ? 'none' : 'rttPulse 2s ease-in-out infinite',
                            '@keyframes rttPulse': {
                                '0%, 100%': { opacity: 1 },
                                '50%':      { opacity: 0.3 },
                            },
                        }}
                    />
                </Box>
            )}

            {/* ── Метка времени ── */}
            {lastUpdatedText && !loading && (
                <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', fontSize: '0.65rem', userSelect: 'none' }}
                >
                    {lastUpdatedText}
                </Typography>
            )}

            {/* ── Кнопка ручного обновления ── */}
            <IconButton
                size="small"
                title="Обновить сейчас"
                onClick={(e) => { e.stopPropagation(); onRefresh(); }}
                disabled={loading}
                sx={{ padding: '2px', '&:hover': { color: 'primary.main' } }}
            >
                <RefreshIcon sx={{ fontSize: 14 }} />
            </IconButton>

            {/* ── Выбор интервала ── */}
            <Select
                value={refreshInterval}
                onChange={(e) => onIntervalChange(Number(e.target.value))}
                size="small"
                variant="standard"
                disableUnderline
                onClick={stopProp}
                title="Частота обновления"
                sx={{
                    fontSize: '0.65rem',
                    '.MuiSelect-select': { py: 0, pr: '16px !important', pl: 0.5 },
                    '.MuiSelect-icon': { fontSize: 14, top: 'calc(50% - 7px)' },
                    minWidth: 52,
                }}
            >
                {INTERVAL_OPTIONS.map(opt => (
                    <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.8rem' }}>
                        {opt.label}
                    </MenuItem>
                ))}
            </Select>
        </Box>
    );
};

export default RealTimeControls;
