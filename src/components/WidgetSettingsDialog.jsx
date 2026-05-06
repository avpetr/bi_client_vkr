import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    FormControl, FormControlLabel, Switch, Typography, Box,
    Divider, Select, MenuItem, InputLabel, TextField
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

const WidgetSettingsDialog = ({ open, onClose, config, onSave }) => {
    const [settings, setSettings] = useState({
        showLegend: config.settings?.showLegend ?? true,
        showGrid: config.settings?.showGrid ?? true,
        showTooltip: config.settings?.showTooltip ?? true,
        showXAxis: config.settings?.showXAxis ?? true,
        showYAxis: config.settings?.showYAxis ?? true,
        showDataLabels: config.settings?.showDataLabels ?? false,
        animationDuration: config.settings?.animationDuration ?? 400,
        curveType: config.settings?.curveType ?? 'monotone',
        strokeWidth: config.settings?.strokeWidth ?? 2,
        fillOpacity: config.settings?.fillOpacity ?? 0.6,
        fontSize: config.settings?.fontSize ?? 12,
    });

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        onSave({ ...config, settings });
        onClose();
    };

    const handleReset = () => {
        setSettings({
            showLegend: true,
            showGrid: true,
            showTooltip: true,
            showXAxis: true,
            showYAxis: true,
            showDataLabels: false,
            animationDuration: 400,
            curveType: 'monotone',
            strokeWidth: 2,
            fillOpacity: 0.6,
            fontSize: 12,
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <SettingsIcon />
                    <Typography variant="h6">Настройки графика</Typography>
                </Box>
                <Typography variant="caption" color="textSecondary">
                    {config.title}
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                    {/* Visibility Options */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Отображение элементов
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 1 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.showLegend}
                                        onChange={(e) => handleChange('showLegend', e.target.checked)}
                                    />
                                }
                                label="Показывать легенду"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.showGrid}
                                        onChange={(e) => handleChange('showGrid', e.target.checked)}
                                    />
                                }
                                label="Показывать сетку"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.showTooltip}
                                        onChange={(e) => handleChange('showTooltip', e.target.checked)}
                                    />
                                }
                                label="Показывать подсказки"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.showXAxis}
                                        onChange={(e) => handleChange('showXAxis', e.target.checked)}
                                    />
                                }
                                label="Показывать ось X"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.showYAxis}
                                        onChange={(e) => handleChange('showYAxis', e.target.checked)}
                                    />
                                }
                                label="Показывать ось Y"
                            />
                            {config.type !== 'pie' && (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.showDataLabels}
                                            onChange={(e) => handleChange('showDataLabels', e.target.checked)}
                                        />
                                    }
                                    label="Показывать значения на графике"
                                />
                            )}
                        </Box>
                    </Box>

                    <Divider />

                    {/* Style Options */}
                    {(config.type === 'line' || config.type === 'area' || config.type === 'composed') && (
                        <>
                            <Box>
                                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    Стиль линии
                                </Typography>
                                <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                                    <InputLabel>Тип кривой</InputLabel>
                                    <Select
                                        value={settings.curveType}
                                        label="Тип кривой"
                                        onChange={(e) => handleChange('curveType', e.target.value)}
                                    >
                                        <MenuItem value="monotone">Плавная (monotone)</MenuItem>
                                        <MenuItem value="linear">Линейная (linear)</MenuItem>
                                        <MenuItem value="step">Ступенчатая (step)</MenuItem>
                                        <MenuItem value="stepBefore">Ступень перед (stepBefore)</MenuItem>
                                        <MenuItem value="stepAfter">Ступень после (stepAfter)</MenuItem>
                                        <MenuItem value="basis">Базовая кривая (basis)</MenuItem>
                                        <MenuItem value="natural">Естественная (natural)</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Толщина линии (px)"
                                    type="number"
                                    value={settings.strokeWidth}
                                    onChange={(e) => {
                                        const value = parseFloat(e.target.value);
                                        if (!isNaN(value) && value >= 1 && value <= 5) {
                                            handleChange('strokeWidth', value);
                                        }
                                    }}
                                    inputProps={{ min: 1, max: 5, step: 0.5 }}
                                    size="small"
                                    fullWidth
                                    sx={{ mt: 2 }}
                                />
                            </Box>
                            <Divider />
                        </>
                    )}

                    {config.type === 'area' && (
                        <>
                            <Box>
                                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    Прозрачность заливки
                                </Typography>
                                <TextField
                                    label="Непрозрачность (%)"
                                    type="number"
                                    value={Math.round(settings.fillOpacity * 100)}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        if (!isNaN(value) && value >= 10 && value <= 100) {
                                            handleChange('fillOpacity', value / 100);
                                        }
                                    }}
                                    inputProps={{ min: 10, max: 100, step: 10 }}
                                    size="small"
                                    fullWidth
                                />
                            </Box>
                            <Divider />
                        </>
                    )}

                    {/* Animation Options */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Анимация
                        </Typography>
                        <TextField
                            label="Длительность анимации (мс)"
                            type="number"
                            value={settings.animationDuration}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (!isNaN(value) && value >= 0 && value <= 2000) {
                                    handleChange('animationDuration', value);
                                }
                            }}
                            inputProps={{ min: 0, max: 2000, step: 100 }}
                            size="small"
                            fullWidth
                            helperText="0 = без анимации, 400 = по умолчанию"
                        />
                    </Box>

                    <Divider />

                    {/* Font Size */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Размер шрифта
                        </Typography>
                        <TextField
                            label="Размер шрифта (px)"
                            type="number"
                            value={settings.fontSize}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (!isNaN(value) && value >= 8 && value <= 16) {
                                    handleChange('fontSize', value);
                                }
                            }}
                            inputProps={{ min: 8, max: 16, step: 1 }}
                            size="small"
                            fullWidth
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleReset} color="secondary">
                    Сбросить
                </Button>
                <Box sx={{ flex: 1 }} />
                <Button onClick={onClose}>
                    Отмена
                </Button>
                <Button onClick={handleSave} variant="contained">
                    Применить
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default WidgetSettingsDialog;

