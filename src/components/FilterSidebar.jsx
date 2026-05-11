import React, { useState, useEffect } from 'react';
import {
    Drawer, Box, Typography, IconButton, Button, TextField,
    FormControl, InputLabel, Select, MenuItem, Divider, Chip,
    List, Paper, Tabs, Tab, Checkbox, FormGroup, FormControlLabel,
    Alert, Stack, useMediaQuery, useTheme
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import DatasetIcon from '@mui/icons-material/Dataset';
import { getDatasetOptions, getDataById } from '../services/mockDatasets';
import { countWidgetsAffected } from '../services/filterApplicator';

const SIDEBAR_WIDTH = 320;

/**
 * Advanced Column-based Filter Sidebar for BI Dashboard
 * Features:
 * - Per-column per-dataset filtering
 * - Multi-column filtering for same-type columns
 * - Clear dataset labels and organization
 * - Step-by-step filter creation
 */
const FilterSidebar = ({ open, onClose, filters, onChange, onApply, widgets }) => {
    const [tabValue, setTabValue] = useState(0);
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
    
    // Filter creation state
    const [selectedDataset, setSelectedDataset] = useState('');
    const [availableColumns, setAvailableColumns] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [filterOperator, setFilterOperator] = useState('equals');
    const [filterValue, setFilterValue] = useState('');
    const [filterValueTo, setFilterValueTo] = useState('');
    const [error, setError] = useState('');

    // Extract columns from all datasets in widgets
    useEffect(() => {
        if (!selectedDataset) {
            setAvailableColumns([]);
            return;
        }

        const data = getDataById(selectedDataset);
        if (!data || data.length === 0) {
            setAvailableColumns([]);
            return;
        }

        const firstRow = data[0];
        const columns = Object.keys(firstRow).map(key => {
            const value = firstRow[key];
            return {
                name: key,
                type: typeof value === 'number' ? 'number' : 'text',
                displayName: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
            };
        });

        setAvailableColumns(columns);
    }, [selectedDataset]);

    // Get dataset options from widgets
    const getDatasetOptionsFromWidgets = () => {
        const datasetIds = new Set();
        widgets.forEach(widget => {
            if (widget.datasetId) {
                datasetIds.add(widget.datasetId);
            }
        });

        const allDatasets = getDatasetOptions();
        return allDatasets.filter(ds => datasetIds.has(ds.value));
    };

    const datasetOptions = getDatasetOptionsFromWidgets();

    const handleColumnToggle = (column) => {
        setError('');
        const isSelected = selectedColumns.some(col => col.name === column.name);
        
        let newSelection;
        if (isSelected) {
            newSelection = selectedColumns.filter(col => col.name !== column.name);
        } else {
            newSelection = [...selectedColumns, column];
        }

        // Validate all columns have same type
        if (newSelection.length > 1) {
            const types = new Set(newSelection.map(col => col.type));
            if (types.size > 1) {
                setError('Все выбранные колонки должны быть одного типа (все числовые или все текстовые)');
                return;
            }
        }

        setSelectedColumns(newSelection);
        
        // Update operator based on type
        if (newSelection.length > 0) {
            setFilterOperator(newSelection[0].type === 'number' ? 'equals' : 'contains');
        }
    };

    const handleAddFilter = () => {
        if (!selectedDataset || selectedColumns.length === 0 || !filterValue) {
            setError('Заполните все обязательные поля');
            return;
        }

        const datasetInfo = getDatasetOptions().find(ds => ds.value === selectedDataset);
        const filterId = `filter_${Date.now()}`;
        
        const newFilter = {
            id: filterId,
            dataset: selectedDataset,
            datasetLabel: datasetInfo?.label || selectedDataset,
            columns: selectedColumns.map(col => ({
                name: col.name,
                type: col.type,
                displayName: col.displayName
            })),
            operator: filterOperator,
            value: filterValue,
            valueTo: (filterOperator === 'between') ? filterValueTo : null
        };

        onChange({
            ...filters,
            [filterId]: newFilter
        });

        // Reset form
        setSelectedDataset('');
        setSelectedColumns([]);
        setFilterValue('');
        setFilterValueTo('');
        setError('');
        setTabValue(0); // Switch to active filters tab
    };

    const handleRemoveFilter = (key) => {
        const newFilters = { ...filters };
        delete newFilters[key];
        onChange(newFilters);
    };

    const handleUpdateFilterValue = (key, value, valueTo = null) => {
        const newFilters = {
            ...filters,
            [key]: {
                ...filters[key],
                value,
                valueTo
            }
        };
        onChange(newFilters);
    };

    const handleClearAll = () => {
        onChange({});
    };

    const getOperatorOptions = (columnType) => {
        if (columnType === 'number') {
            return [
                { value: 'equals', label: 'Равно (=)' },
                { value: 'notEquals', label: 'Не равно (≠)' },
                { value: 'greaterThan', label: 'Больше (>)' },
                { value: 'lessThan', label: 'Меньше (<)' },
                { value: 'greaterOrEqual', label: 'Больше или равно (≥)' },
                { value: 'lessOrEqual', label: 'Меньше или равно (≤)' },
                { value: 'between', label: 'Между (⟷)' }
            ];
        } else {
            return [
                { value: 'equals', label: 'Равно (=)' },
                { value: 'notEquals', label: 'Не равно (≠)' },
                { value: 'contains', label: 'Содержит (⊃)' },
                { value: 'startsWith', label: 'Начинается с (→)' },
                { value: 'endsWith', label: 'Заканчивается на (←)' }
            ];
        }
    };

    const renderFilterValueInput = (filter, key) => {
        const isBetween = filter.operator === 'between';
        const inputType = filter.columns[0].type === 'number' ? 'number' : 'text';

        return (
            <Stack spacing={1}>
                <TextField
                    label={isBetween ? "От" : "Значение"}
                    type={inputType}
                    value={filter.value || ''}
                    onChange={(e) => handleUpdateFilterValue(key, e.target.value, filter.valueTo)}
                    size="small"
                    fullWidth
                />
                {isBetween && (
                    <TextField
                        label="До"
                        type="number"
                        value={filter.valueTo || ''}
                        onChange={(e) => handleUpdateFilterValue(key, filter.value, e.target.value)}
                        size="small"
                        fullWidth
                    />
                )}
            </Stack>
        );
    };

    const activeFiltersCount = Object.keys(filters).length;

    return (
        <Drawer
            anchor="left"
            open={open}
            onClose={onClose}
            variant={isMobile ? 'temporary' : 'persistent'}
            sx={{
                width: open && !isMobile ? SIDEBAR_WIDTH : 0,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: isMobile ? '85vw' : SIDEBAR_WIDTH,
                    maxWidth: SIDEBAR_WIDTH,
                    boxSizing: 'border-box',
                    mt: { xs: '56px', sm: '64px' },
                    height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                },
            }}
        >
            <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FilterListIcon color="primary" />
                        <Typography variant="h6">Фильтры</Typography>
                        {activeFiltersCount > 0 && (
                            <Chip 
                                label={activeFiltersCount} 
                                size="small" 
                                color="primary"
                            />
                        )}
                    </Box>
                    <IconButton size="small" onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Tabs */}
                <Tabs 
                    value={tabValue} 
                    onChange={(e, v) => setTabValue(v)} 
                    sx={{ mb: 2, minHeight: 40 }}
                    variant="fullWidth"
                >
                    <Tab label="Активные" sx={{ minHeight: 40, py: 1 }} />
                    <Tab label="Добавить" sx={{ minHeight: 40, py: 1 }} />
                </Tabs>

                {/* Tab Content */}
                <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
                    {tabValue === 0 ? (
                        /* Active Filters Tab */
                        <>
                            {activeFiltersCount === 0 ? (
                                <Box sx={{ textAlign: 'center', mt: 4 }}>
                                    <FilterListIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Активных фильтров нет
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Перейдите на вкладку "Добавить"
                                    </Typography>
                                </Box>
                            ) : (
                                <List dense sx={{ p: 0 }}>
                                    {Object.entries(filters).map(([key, filter]) => (
                                        <Paper
                                            key={key}
                                            elevation={3}
                                            sx={{
                                                p: 2,
                                                mb: 2,
                                                border: '1px solid',
                                                borderColor: 'primary.main',
                                                borderRadius: 2,
                                                bgcolor: 'background.paper'
                                            }}
                                        >
                                            {/* Filter Header */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <Chip
                                                        icon={<DatasetIcon />}
                                                        label={filter.datasetLabel}
                                                        size="small"
                                                        color="primary"
                                                        sx={{ mb: 1 }}
                                                    />
                                                    {(() => {
                                                        const n = countWidgetsAffected(filter, widgets);
                                                        return (
                                                            <Typography variant="caption" display="block" color={n > 0 ? 'success.main' : 'text.disabled'} sx={{ fontWeight: 600 }}>
                                                                {n > 0
                                                                    ? `▸ Применяется к ${n} виджет${n === 1 ? 'у' : (n < 5 ? 'ам' : 'ам')}`
                                                                    : '▸ Нет виджетов с этим датасетом'}
                                                            </Typography>
                                                        );
                                                    })()}
                                                </Box>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRemoveFilter(key)}
                                                    sx={{ color: 'error.main' }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                            
                                            {/* Columns */}
                                            <Box sx={{ mb: 1.5 }}>
                                                {filter.columns.map((col, idx) => (
                                                    <Chip
                                                        key={idx}
                                                        label={col.displayName}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ mr: 0.5, mb: 0.5 }}
                                                    />
                                                ))}
                                            </Box>

                                            {/* Operator */}
                                            <Typography variant="caption" display="block" color="textSecondary" sx={{ mb: 1 }}>
                                                {getOperatorOptions(filter.columns[0].type).find(op => op.value === filter.operator)?.label || filter.operator}
                                            </Typography>
                                            
                                            {/* Value Inputs */}
                                            {renderFilterValueInput(filter, key)}
                                        </Paper>
                                    ))}
                                </List>
                            )}
                        </>
                    ) : (
                        /* Add Filter Tab */
                        <>
                            {datasetOptions.length === 0 ? (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    Добавьте виджеты на дашборд, чтобы использовать фильтры по колонкам данных
                                </Alert>
                            ) : (
                                <Stack spacing={3}>
                                    {/* Step 1: Select Dataset */}
                                    <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ 
                                                width: 24, 
                                                height: 24, 
                                                borderRadius: '50%', 
                                                bgcolor: 'primary.main', 
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold'
                                            }}>
                                                1
                                            </Box>
                                            Выберите датасет
                                        </Typography>
                                        <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                                            <InputLabel>Датасет</InputLabel>
                                            <Select
                                                value={selectedDataset}
                                                label="Датасет"
                                                onChange={(e) => {
                                                    setSelectedDataset(e.target.value);
                                                    setSelectedColumns([]);
                                                    setError('');
                                                }}
                                            >
                                                {datasetOptions.map(ds => (
                                                    <MenuItem key={ds.value} value={ds.value}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <DatasetIcon fontSize="small" />
                                                            {ds.label}
                                                        </Box>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Paper>

                                    {/* Step 2: Select Columns */}
                                    {selectedDataset && availableColumns.length > 0 && (
                                        <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ 
                                                    width: 24, 
                                                    height: 24, 
                                                    borderRadius: '50%', 
                                                    bgcolor: 'primary.main', 
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold'
                                                }}>
                                                    2
                                                </Box>
                                                Выберите колонки
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
                                                Можно выбрать несколько колонок одного типа
                                            </Typography>
                                            <FormGroup>
                                                {availableColumns.map(column => (
                                                    <FormControlLabel
                                                        key={column.name}
                                                        control={
                                                            <Checkbox
                                                                checked={selectedColumns.some(col => col.name === column.name)}
                                                                onChange={() => handleColumnToggle(column)}
                                                                size="small"
                                                            />
                                                        }
                                                        label={
                                                            <Box>
                                                                <Typography variant="body2">{column.displayName}</Typography>
                                                                <Typography variant="caption" color="textSecondary">
                                                                    {column.type === 'number' ? '📊 Числовое' : '📝 Текстовое'}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                    />
                                                ))}
                                            </FormGroup>
                                        </Paper>
                                    )}

                                    {/* Step 3: Set Condition */}
                                    {selectedColumns.length > 0 && (
                                        <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ 
                                                    width: 24, 
                                                    height: 24, 
                                                    borderRadius: '50%', 
                                                    bgcolor: 'primary.main', 
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold'
                                                }}>
                                                    3
                                                </Box>
                                                Задайте условие
                                            </Typography>
                                            <Stack spacing={2} sx={{ mt: 1 }}>
                                                <FormControl size="small" fullWidth>
                                                    <InputLabel>Условие</InputLabel>
                                                    <Select
                                                        value={filterOperator}
                                                        label="Условие"
                                                        onChange={(e) => setFilterOperator(e.target.value)}
                                                    >
                                                        {getOperatorOptions(selectedColumns[0].type).map(op => (
                                                            <MenuItem key={op.value} value={op.value}>
                                                                {op.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>

                                                <TextField
                                                    label={filterOperator === 'between' ? "От" : "Значение"}
                                                    type={selectedColumns[0].type === 'number' ? 'number' : 'text'}
                                                    value={filterValue}
                                                    onChange={(e) => setFilterValue(e.target.value)}
                                                    size="small"
                                                    fullWidth
                                                    required
                                                />

                                                {filterOperator === 'between' && (
                                                    <TextField
                                                        label="До"
                                                        type="number"
                                                        value={filterValueTo}
                                                        onChange={(e) => setFilterValueTo(e.target.value)}
                                                        size="small"
                                                        fullWidth
                                                        required
                                                    />
                                                )}

                                                {error && (
                                                    <Alert severity="error" onClose={() => setError('')}>
                                                        {error}
                                                    </Alert>
                                                )}

                                                <Button
                                                    variant="contained"
                                                    onClick={handleAddFilter}
                                                    disabled={!filterValue}
                                                    fullWidth
                                                    startIcon={<AddIcon />}
                                                    size="large"
                                                >
                                                    Добавить фильтр
                                                </Button>
                                            </Stack>
                                        </Paper>
                                    )}
                                </Stack>
                            )}
                        </>
                    )}
                </Box>

                {/* Action Buttons */}
                {activeFiltersCount > 0 && (
                    <Stack spacing={1}>
                        <Alert severity="success" sx={{ py: 0.5 }}>
                            Фильтры применяются автоматически
                        </Alert>
                        <Button
                            variant="outlined"
                            onClick={handleClearAll}
                            fullWidth
                            color="error"
                            startIcon={<DeleteIcon />}
                        >
                            Очистить все ({activeFiltersCount})
                        </Button>
                    </Stack>
                )}
            </Box>
        </Drawer>
    );
};

export default FilterSidebar;
export { SIDEBAR_WIDTH };
