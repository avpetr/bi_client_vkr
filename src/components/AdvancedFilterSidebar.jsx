import React, { useState, useEffect, useMemo } from 'react';
import {
    Drawer, Box, Typography, IconButton, Button, TextField,
    FormControl, InputLabel, Select, MenuItem, Divider, Chip,
    Paper, Slider, Checkbox, FormControlLabel, Stack, Autocomplete,
    List, ListItem, ListItemText, Collapse, Alert, FormGroup
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import DatasetIcon from '@mui/icons-material/Dataset';
import { 
    COLUMN_TYPES, 
    getColumnType, 
    saveColumnType,
    detectColumnType,
    getUniqueValues,
    getNumericRange,
    getDateRange,
    parseDate
} from '../services/columnTypeManager';
import { getDatasetOptions, getDataById } from '../services/mockDatasets';

const SIDEBAR_WIDTH = 400;

/**
 * Advanced Filter Sidebar with Real-time Filtering
 * Features:
 * - Real-time filter updates (no Apply button)
 * - Range sliders for numeric columns
 * - Date pickers for date columns
 * - Multi-select for categorical columns
 * - Per-dataset filter organization
 */
const AdvancedFilterSidebar = ({ open, onClose, filters, onChange, widgets, onFiltersApply }) => {
    const [expandedDatasets, setExpandedDatasets] = useState({});
    const [columnTypes, setColumnTypes] = useState({});

    // Get datasets from widgets
    const datasetsInUse = useMemo(() => {
        const datasetIds = new Set();
        widgets.forEach(widget => {
            if (widget.datasetId) {
                datasetIds.add(widget.datasetId);
            }
        });

        const allDatasets = getDatasetOptions();
        return allDatasets.filter(ds => datasetIds.has(ds.value)).map(ds => {
            const data = getDataById(ds.value);
            return {
                id: ds.value,
                name: ds.label,
                data: data,
                columns: data && data.length > 0 ? extractColumns(data, ds.value) : []
            };
        });
    }, [widgets]);

    // Extract columns from dataset
    const extractColumns = (data, datasetId) => {
        if (!data || data.length === 0) return [];

        const firstRow = data[0];
        return Object.keys(firstRow).map(columnName => {
            const values = data.map(row => row[columnName]);
            const detectedType = detectColumnType(values);
            const savedType = getColumnType(datasetId, columnName, detectedType);

            return {
                name: columnName,
                displayName: columnName.charAt(0).toUpperCase() + columnName.slice(1).replace(/([A-Z])/g, ' $1'),
                type: savedType,
                values: values
            };
        });
    };

    // Toggle dataset expansion
    const toggleDataset = (datasetId) => {
        setExpandedDatasets(prev => ({
            ...prev,
            [datasetId]: !prev[datasetId]
        }));
    };

    // Real-time filter update
    const updateFilter = (datasetId, columnName, filterConfig) => {
        const filterId = `${datasetId}_${columnName}`;
        
        const newFilters = { ...filters };
        
        if (filterConfig === null || filterConfig.disabled) {
            // Remove filter
            delete newFilters[filterId];
        } else {
            // Add/update filter
            newFilters[filterId] = {
                datasetId,
                columnName,
                ...filterConfig
            };
        }
        
        // Update immediately
        onChange(newFilters);
        
        // Apply filters to visualizations in real-time
        if (onFiltersApply) {
            onFiltersApply(newFilters);
        }
    };

    // Clear all filters
    const clearAllFilters = () => {
        onChange({});
        if (onFiltersApply) {
            onFiltersApply({});
        }
    };

    // Get active filter for column
    const getActiveFilter = (datasetId, columnName) => {
        const filterId = `${datasetId}_${columnName}`;
        return filters[filterId];
    };

    // Render filter control based on column type
    const renderFilterControl = (dataset, column) => {
        const activeFilter = getActiveFilter(dataset.id, column.name);
        
        switch (column.type) {
            case COLUMN_TYPES.NUMBER:
                return (
                    <NumberRangeFilter
                        dataset={dataset}
                        column={column}
                        activeFilter={activeFilter}
                        onUpdate={(config) => updateFilter(dataset.id, column.name, config)}
                    />
                );
                
            case COLUMN_TYPES.DATE:
                return (
                    <DateRangeFilter
                        dataset={dataset}
                        column={column}
                        activeFilter={activeFilter}
                        onUpdate={(config) => updateFilter(dataset.id, column.name, config)}
                    />
                );
                
            case COLUMN_TYPES.CATEGORICAL:
            case COLUMN_TYPES.STRING:
                return (
                    <MultiSelectFilter
                        dataset={dataset}
                        column={column}
                        activeFilter={activeFilter}
                        onUpdate={(config) => updateFilter(dataset.id, column.name, config)}
                    />
                );
                
            case COLUMN_TYPES.BOOLEAN:
                return (
                    <BooleanFilter
                        dataset={dataset}
                        column={column}
                        activeFilter={activeFilter}
                        onUpdate={(config) => updateFilter(dataset.id, column.name, config)}
                    />
                );
                
            default:
                return (
                    <TextFilter
                        dataset={dataset}
                        column={column}
                        activeFilter={activeFilter}
                        onUpdate={(config) => updateFilter(dataset.id, column.name, config)}
                    />
                );
        }
    };

    const activeFiltersCount = Object.keys(filters).length;

    return (
        <Drawer
            anchor="left"
            open={open}
            onClose={onClose}
            variant={{
                xs: 'temporary',
                md: 'persistent'
            }}
            sx={{
                width: SIDEBAR_WIDTH,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: { xs: '90vw', sm: '420px', md: SIDEBAR_WIDTH },
                    maxWidth: SIDEBAR_WIDTH,
                    boxSizing: 'border-box',
                    mt: { xs: '56px', sm: '64px' },
                    height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
                    borderRight: '2px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.default'
                },
            }}
        >
            <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FilterListIcon color="primary" />
                        <Typography variant="h6">Filters</Typography>
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

                {activeFiltersCount > 0 && (
                    <Alert severity="info" sx={{ mb: 2 }} icon={false}>
                        <Typography variant="caption">
                            🔄 Filters update visualizations in real-time
                        </Typography>
                    </Alert>
                )}

                <Divider sx={{ mb: 2 }} />

                {/* Filters by Dataset */}
                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                    {datasetsInUse.length === 0 ? (
                        <Alert severity="info">
                            Add widgets to your dashboard to enable filtering
                        </Alert>
                    ) : (
                        <List dense sx={{ p: 0 }}>
                            {datasetsInUse.map(dataset => (
                                <Paper key={dataset.id} elevation={2} sx={{ mb: 2, overflow: 'hidden' }}>
                                    {/* Dataset Header */}
                                    <ListItem
                                        button
                                        onClick={() => toggleDataset(dataset.id)}
                                        sx={{
                                            bgcolor: 'primary.main',
                                            color: 'primary.contrastText',
                                            '&:hover': {
                                                bgcolor: 'primary.dark'
                                            }
                                        }}
                                    >
                                        <DatasetIcon sx={{ mr: 1 }} />
                                        <ListItemText 
                                            primary={dataset.name}
                                            secondary={
                                                <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.8 }}>
                                                    {dataset.columns.length} columns
                                                </Typography>
                                            }
                                        />
                                        {expandedDatasets[dataset.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </ListItem>

                                    {/* Dataset Columns */}
                                    <Collapse in={expandedDatasets[dataset.id]} timeout="auto">
                                        <Box sx={{ p: 2 }}>
                                            <Stack spacing={3}>
                                                {dataset.columns.map(column => (
                                                    <Box key={column.name}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                            <Typography variant="subtitle2" fontWeight="bold">
                                                                {column.displayName}
                                                            </Typography>
                                                            <Chip 
                                                                label={column.type}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ fontSize: '0.7rem' }}
                                                            />
                                                        </Box>
                                                        {renderFilterControl(dataset, column)}
                                                        <Divider sx={{ mt: 2 }} />
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Box>
                                    </Collapse>
                                </Paper>
                            ))}
                        </List>
                    )}
                </Box>

                {/* Clear All Button */}
                {activeFiltersCount > 0 && (
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<ClearAllIcon />}
                        onClick={clearAllFilters}
                        fullWidth
                        sx={{ mt: 2 }}
                    >
                        Clear All Filters
                    </Button>
                )}
            </Box>
        </Drawer>
    );
};

// Number Range Filter Component
const NumberRangeFilter = ({ dataset, column, activeFilter, onUpdate }) => {
    const range = useMemo(() => getNumericRange(dataset.data, column.name), [dataset.data, column.name]);
    const [enabled, setEnabled] = useState(!!activeFilter);
    const [value, setValue] = useState(activeFilter?.value || [range.min, range.max]);

    useEffect(() => {
        if (enabled) {
            onUpdate({
                type: 'numberRange',
                value: value,
                min: range.min,
                max: range.max
            });
        } else {
            onUpdate(null);
        }
    }, [enabled, value]);

    return (
        <Box>
            <FormControlLabel
                control={<Checkbox checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
                label="Enable range filter"
            />
            {enabled && (
                <Box sx={{ px: 2, pt: 1 }}>
                    <Slider
                        value={value}
                        onChange={(e, newValue) => setValue(newValue)}
                        valueLabelDisplay="auto"
                        min={range.min}
                        max={range.max}
                        step={(range.max - range.min) / 100}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption">Min: {value[0].toFixed(2)}</Typography>
                        <Typography variant="caption">Max: {value[1].toFixed(2)}</Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

// Date Range Filter Component
const DateRangeFilter = ({ dataset, column, activeFilter, onUpdate }) => {
    const range = useMemo(() => getDateRange(dataset.data, column.name), [dataset.data, column.name]);
    const [enabled, setEnabled] = useState(!!activeFilter);
    const [startDate, setStartDate] = useState(
        activeFilter?.startDate || range.min.toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(
        activeFilter?.endDate || range.max.toISOString().split('T')[0]
    );

    useEffect(() => {
        if (enabled) {
            onUpdate({
                type: 'dateRange',
                startDate,
                endDate
            });
        } else {
            onUpdate(null);
        }
    }, [enabled, startDate, endDate]);

    return (
        <Box>
            <FormControlLabel
                control={<Checkbox checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
                label="Enable date range filter"
            />
            {enabled && (
                <Stack spacing={1} sx={{ mt: 1 }}>
                    <TextField
                        label="Start Date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="End Date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                </Stack>
            )}
        </Box>
    );
};

// Multi-Select Filter Component
const MultiSelectFilter = ({ dataset, column, activeFilter, onUpdate }) => {
    const uniqueValues = useMemo(() => getUniqueValues(dataset.data, column.name), [dataset.data, column.name]);
    const [enabled, setEnabled] = useState(!!activeFilter);
    const [selectedValues, setSelectedValues] = useState(activeFilter?.values || []);

    useEffect(() => {
        if (enabled && selectedValues.length > 0) {
            onUpdate({
                type: 'multiSelect',
                values: selectedValues
            });
        } else {
            onUpdate(null);
        }
    }, [enabled, selectedValues]);

    return (
        <Box>
            <FormControlLabel
                control={<Checkbox checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
                label="Enable multi-select filter"
            />
            {enabled && (
                <Box sx={{ mt: 1 }}>
                    <Autocomplete
                        multiple
                        options={uniqueValues}
                        value={selectedValues}
                        onChange={(e, newValue) => setSelectedValues(newValue)}
                        renderInput={(params) => (
                            <TextField {...params} label="Select values" size="small" />
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip
                                    key={index}
                                    label={option}
                                    {...getTagProps({ index })}
                                    size="small"
                                />
                            ))
                        }
                        limitTags={3}
                    />
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                        {selectedValues.length} of {uniqueValues.length} selected
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

// Boolean Filter Component
const BooleanFilter = ({ dataset, column, activeFilter, onUpdate }) => {
    const [enabled, setEnabled] = useState(!!activeFilter);
    const [value, setValue] = useState(activeFilter?.value !== undefined ? activeFilter.value : null);

    useEffect(() => {
        if (enabled && value !== null) {
            onUpdate({
                type: 'boolean',
                value: value
            });
        } else {
            onUpdate(null);
        }
    }, [enabled, value]);

    return (
        <Box>
            <FormControlLabel
                control={<Checkbox checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
                label="Enable boolean filter"
            />
            {enabled && (
                <FormControl component="fieldset" sx={{ mt: 1 }}>
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={value === true}
                                    onChange={(e) => setValue(e.target.checked ? true : null)}
                                />
                            }
                            label="True"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={value === false}
                                    onChange={(e) => setValue(e.target.checked ? false : null)}
                                />
                            }
                            label="False"
                        />
                    </FormGroup>
                </FormControl>
            )}
        </Box>
    );
};

// Text Filter Component  
const TextFilter = ({ dataset, column, activeFilter, onUpdate }) => {
    const [enabled, setEnabled] = useState(!!activeFilter);
    const [searchText, setSearchText] = useState(activeFilter?.searchText || '');

    useEffect(() => {
        if (enabled && searchText.trim()) {
            onUpdate({
                type: 'text',
                searchText: searchText
            });
        } else {
            onUpdate(null);
        }
    }, [enabled, searchText]);

    return (
        <Box>
            <FormControlLabel
                control={<Checkbox checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
                label="Enable text search"
            />
            {enabled && (
                <TextField
                    label="Search text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    size="small"
                    fullWidth
                    placeholder="Contains..."
                    sx={{ mt: 1 }}
                />
            )}
        </Box>
    );
};

export default AdvancedFilterSidebar;
export { SIDEBAR_WIDTH };




