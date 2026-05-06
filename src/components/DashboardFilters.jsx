import React, { useState } from 'react';
import {
    Box, Chip, IconButton, Popover, TextField, Button, FormControl,
    InputLabel, Select, MenuItem, Typography, Divider
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

const DashboardFilters = ({ filters = {}, onChange }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [filterKey, setFilterKey] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [filterType, setFilterType] = useState('text');

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setFilterKey('');
        setFilterValue('');
        setFilterType('text');
    };

    const handleAddFilter = () => {
        if (filterKey.trim() && filterValue.trim()) {
            const newFilters = {
                ...filters,
                [filterKey.trim()]: {
                    value: filterValue.trim(),
                    type: filterType
                }
            };
            onChange(newFilters);
            handleClose();
        }
    };

    const handleRemoveFilter = (key) => {
        const newFilters = { ...filters };
        delete newFilters[key];
        onChange(newFilters);
    };

    const open = Boolean(anchorEl);
    const filterCount = Object.keys(filters).length;

    // Predefined filter templates
    const filterTemplates = [
        { key: 'год', label: 'Год', type: 'number' },
        { key: 'месяц', label: 'Месяц', type: 'text' },
        { key: 'категория', label: 'Категория', type: 'text' },
        { key: 'регион', label: 'Регион', type: 'text' },
        { key: 'статус', label: 'Статус', type: 'text' },
    ];

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <IconButton
                size="small"
                onClick={handleOpen}
                color={filterCount > 0 ? 'primary' : 'default'}
                title="Фильтры дашборда"
            >
                <FilterListIcon />
            </IconButton>

            {Object.entries(filters).map(([key, filter]) => (
                <Chip
                    key={key}
                    label={`${key}: ${filter.value}`}
                    onDelete={() => handleRemoveFilter(key)}
                    size="small"
                    color="primary"
                    variant="outlined"
                />
            ))}

            {filterCount === 0 && (
                <Typography variant="caption" color="textSecondary">
                    Нет активных фильтров
                </Typography>
            )}

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
            >
                <Box sx={{ p: 2, minWidth: 300 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Добавить фильтр
                    </Typography>
                    
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                        Фильтры применяются ко всем виджетам на этом дашборде
                    </Typography>

                    {filterTemplates.length > 0 && (
                        <>
                            <Typography variant="caption" gutterBottom>
                                Быстрые шаблоны:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                                {filterTemplates.map((template) => (
                                    <Chip
                                        key={template.key}
                                        label={template.label}
                                        size="small"
                                        onClick={() => {
                                            setFilterKey(template.key);
                                            setFilterType(template.type);
                                        }}
                                        variant={filterKey === template.key ? 'filled' : 'outlined'}
                                    />
                                ))}
                            </Box>
                            <Divider sx={{ my: 2 }} />
                        </>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Название фильтра"
                            value={filterKey}
                            onChange={(e) => setFilterKey(e.target.value)}
                            size="small"
                            fullWidth
                            placeholder="например: год, регион"
                        />

                        <FormControl size="small" fullWidth>
                            <InputLabel>Тип фильтра</InputLabel>
                            <Select
                                value={filterType}
                                label="Тип фильтра"
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <MenuItem value="text">Текст</MenuItem>
                                <MenuItem value="number">Число</MenuItem>
                                <MenuItem value="date">Дата</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Значение"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            size="small"
                            fullWidth
                            type={filterType === 'number' ? 'number' : filterType === 'date' ? 'date' : 'text'}
                            InputLabelProps={filterType === 'date' ? { shrink: true } : {}}
                        />

                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button onClick={handleClose} size="small">
                                Отмена
                            </Button>
                            <Button
                                onClick={handleAddFilter}
                                variant="contained"
                                size="small"
                                startIcon={<AddIcon />}
                                disabled={!filterKey.trim() || !filterValue.trim()}
                            >
                                Добавить
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Popover>
        </Box>
    );
};

export default DashboardFilters;




