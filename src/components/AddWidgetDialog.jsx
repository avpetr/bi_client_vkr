import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    Select, MenuItem, FormControl, InputLabel, Typography, Box, Chip
} from '@mui/material';
import { getDatasetOptions, getMetricsForDataset } from '../services/mockDatasets';

const AddWidgetDialog = ({ open, onClose, onAdd }) => {
    const [title, setTitle] = useState('');
    const [type, setType] = useState('line');
    const [datasetId, setDatasetId] = useState('salesPerformance');
    const [dataKeys, setDataKeys] = useState(['sales']);

    const datasets = getDatasetOptions();
    const availableMetrics = getMetricsForDataset(datasetId);

    // Auto-generate title when dataset or type changes
    useEffect(() => {
        if (!title || title === 'Новый график' || title.startsWith('График')) {
            const datasetName = datasets.find(ds => ds.value === datasetId)?.label || '';
            const chartTypeNames = {
                line:     'Линейный',
                bar:      'Столбчатый',
                area:     'Площадной',
                pie:      'Круговая диаграмма',
                scatter:  'Точечный',
                composed: 'Комбинированный',
                card:     'KPI карточка',
                table:    'Таблица',
            };
            setTitle(`${chartTypeNames[type]} - ${datasetName}`);
        }
    }, [datasetId, type, datasets]);

    // Reset dataKeys when dataset changes
    useEffect(() => {
        if (availableMetrics.length > 0) {
            setDataKeys([availableMetrics[0].key]);
        }
    }, [datasetId]);

    const handleAdd = () => {
        onAdd({
            title,
            type,
            datasetId,
            dataKeys
        });
        // Reset form
        setTitle('');
        setType('line');
        setDatasetId('salesPerformance');
        setDataKeys(['sales']);
        onClose();
    };

    const handleMetricToggle = (metricKey) => {
        if (type === 'pie') {
            // Pie charts only support one metric
            setDataKeys([metricKey]);
        } else {
            setDataKeys(prev =>
                prev.includes(metricKey)
                    ? prev.filter(k => k !== metricKey)
                    : [...prev, metricKey]
            );
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Добавить график на дашборд</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                <TextField
                    label="Название графика"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    fullWidth
                    helperText="Название будет отображаться в заголовке виджета"
                />

                <FormControl fullWidth>
                    <InputLabel>Источник данных</InputLabel>
                    <Select
                        value={datasetId}
                        label="Источник данных"
                        onChange={(e) => setDatasetId(e.target.value)}
                    >
                        {datasets.map(ds => (
                            <MenuItem key={ds.value} value={ds.value}>
                                {ds.label}
                            </MenuItem>
                        ))}
                    </Select>
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, px: 1.5 }}>
                        {datasets.find(ds => ds.value === datasetId)?.description}
                    </Typography>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel>Тип визуализации</InputLabel>
                    <Select value={type} label="Тип визуализации" onChange={(e) => setType(e.target.value)}>
                        <MenuItem value="card">🔢 KPI карточка</MenuItem>
                        <MenuItem value="line">📈 Линейный график</MenuItem>
                        <MenuItem value="bar">📊 Столбчатая диаграмма</MenuItem>
                        <MenuItem value="area">📉 Площадной график</MenuItem>
                        <MenuItem value="pie">🥧 Круговая диаграмма</MenuItem>
                        <MenuItem value="scatter">🔵 Точечная диаграмма</MenuItem>
                        <MenuItem value="composed">📊 Комбинированный</MenuItem>
                        <MenuItem value="table">📋 Таблица</MenuItem>
                    </Select>
                </FormControl>

                {type !== 'table' && (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Метрики для отображения {type === 'pie' ? '(выберите одну)' : '(можно несколько)'}:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            {availableMetrics.map(metric => (
                                <Chip
                                    key={metric.key}
                                    label={metric.label}
                                    onClick={() => handleMetricToggle(metric.key)}
                                    color={dataKeys.includes(metric.key) ? 'primary' : 'default'}
                                    variant={dataKeys.includes(metric.key) ? 'filled' : 'outlined'}
                                    sx={{
                                        borderColor: metric.color,
                                        ...(dataKeys.includes(metric.key) && {
                                            bgcolor: metric.color + '33',
                                            color: metric.color,
                                            fontWeight: 'bold'
                                        })
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                )}
                {type === 'table' && (
                    <Typography variant="caption" color="text.secondary">
                        Таблица отображает все колонки датасета — выбирать метрики не нужно.
                    </Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose}>Отмена</Button>
                <Button
                    onClick={handleAdd}
                    variant="contained"
                    disabled={type !== 'table' && dataKeys.length === 0}
                >
                    Добавить
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddWidgetDialog;