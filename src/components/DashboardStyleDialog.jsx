import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Box, Typography, FormControl, InputLabel, Select,
    MenuItem, Divider, FormControlLabel, Switch
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';

const DashboardStyleDialog = ({ open, onClose, currentStyle, onSave }) => {
    const [style, setStyle] = useState({
        backgroundColor: currentStyle?.backgroundColor || '#f4f6f8',
        gridGap: currentStyle?.gridGap || 16,
        gridCols: currentStyle?.gridCols ?? 12,
        horizontalMargin: currentStyle?.horizontalMargin || 10,
        verticalMargin: currentStyle?.verticalMargin || 10,
        widgetElevation: currentStyle?.widgetElevation || 3,
        widgetBorderRadius: currentStyle?.widgetBorderRadius || 4,
        defaultFontSize: currentStyle?.defaultFontSize || 12,
        defaultAnimationDuration: currentStyle?.defaultAnimationDuration || 400,
        defaultStrokeWidth: currentStyle?.defaultStrokeWidth || 2,
        showGridLines: currentStyle?.showGridLines !== false,
        compactMode: currentStyle?.compactMode || false,
        theme: currentStyle?.theme || 'light'
    });

    const handleChange = (field, value) => {
        setStyle(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(style);
        onClose();
    };

    const handleReset = () => {
        setStyle({
            backgroundColor: '#f4f6f8',
            gridGap: 16,
            gridCols: 12,
            horizontalMargin: 10,
            verticalMargin: 10,
            widgetElevation: 3,
            widgetBorderRadius: 4,
            defaultFontSize: 12,
            defaultAnimationDuration: 400,
            defaultStrokeWidth: 2,
            showGridLines: true,
            compactMode: false,
            theme: 'light'
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <PaletteIcon />
                    <Typography variant="h6">Стиль дашборда</Typography>
                </Box>
                <Typography variant="caption" color="textSecondary">
                    Настройки применяются ко всем виджетам на этом дашборде
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                    {/* Layout Settings */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Макет и расположение
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>Делений сетки (колонок)</InputLabel>
                                <Select
                                    value={style.gridCols}
                                    label="Делений сетки (колонок)"
                                    onChange={(e) => handleChange('gridCols', e.target.value)}
                                >
                                    {[4, 6, 8, 12, 16, 24].map(n => (
                                        <MenuItem key={n} value={n}>{n} колонок</MenuItem>
                                    ))}
                                </Select>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, px: 1.5 }}>
                                    Больше колонок = тоньше шаг snap при изменении размера
                                </Typography>
                            </FormControl>

                            <TextField
                                label="Цвет фона дашборда"
                                type="color"
                                value={style.backgroundColor}
                                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />

                            <TextField
                                label="Горизонтальный отступ между графиками (px)"
                                type="number"
                                value={style.horizontalMargin}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (!isNaN(value) && value >= 0 && value <= 100) {
                                        handleChange('horizontalMargin', value);
                                    }
                                }}
                                inputProps={{ min: 0, max: 100, step: 5 }}
                                fullWidth
                                helperText="Расстояние между графиками по горизонтали"
                            />

                            <TextField
                                label="Вертикальный отступ между графиками (px)"
                                type="number"
                                value={style.verticalMargin}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (!isNaN(value) && value >= 0 && value <= 100) {
                                        handleChange('verticalMargin', value);
                                    }
                                }}
                                inputProps={{ min: 0, max: 100, step: 5 }}
                                fullWidth
                                helperText="Расстояние между графиками по вертикали"
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={style.compactMode}
                                        onChange={(e) => handleChange('compactMode', e.target.checked)}
                                    />
                                }
                                label="Компактный режим (меньше отступов)"
                            />
                        </Box>
                    </Box>

                    <Divider />

                    {/* Widget Style */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Стиль виджетов
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                            <TextField
                                label="Глубина тени виджетов"
                                type="number"
                                value={style.widgetElevation}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (!isNaN(value) && value >= 0 && value <= 24) {
                                        handleChange('widgetElevation', value);
                                    }
                                }}
                                inputProps={{ min: 0, max: 24, step: 1 }}
                                fullWidth
                                helperText="0 = без тени, 24 = максимальная тень"
                            />

                            <TextField
                                label="Скругление углов виджетов (px)"
                                type="number"
                                value={style.widgetBorderRadius}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (!isNaN(value) && value >= 0 && value <= 20) {
                                        handleChange('widgetBorderRadius', value);
                                    }
                                }}
                                inputProps={{ min: 0, max: 20, step: 2 }}
                                fullWidth
                            />
                        </Box>
                    </Box>

                    <Divider />

                    {/* Default Chart Settings */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Параметры графиков по умолчанию
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                            <TextField
                                label="Размер шрифта по умолчанию (px)"
                                type="number"
                                value={style.defaultFontSize}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (!isNaN(value) && value >= 8 && value <= 16) {
                                        handleChange('defaultFontSize', value);
                                    }
                                }}
                                inputProps={{ min: 8, max: 16, step: 1 }}
                                fullWidth
                            />

                            <TextField
                                label="Длительность анимации по умолчанию (мс)"
                                type="number"
                                value={style.defaultAnimationDuration}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (!isNaN(value) && value >= 0 && value <= 2000) {
                                        handleChange('defaultAnimationDuration', value);
                                    }
                                }}
                                inputProps={{ min: 0, max: 2000, step: 100 }}
                                fullWidth
                                helperText="Применяется к новым виджетам"
                            />

                            <TextField
                                label="Толщина линий по умолчанию (px)"
                                type="number"
                                value={style.defaultStrokeWidth}
                                onChange={(e) => {
                                    const value = parseFloat(e.target.value);
                                    if (!isNaN(value) && value >= 1 && value <= 5) {
                                        handleChange('defaultStrokeWidth', value);
                                    }
                                }}
                                inputProps={{ min: 1, max: 5, step: 0.5 }}
                                fullWidth
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={style.showGridLines}
                                        onChange={(e) => handleChange('showGridLines', e.target.checked)}
                                    />
                                }
                                label="Показывать сетку на графиках по умолчанию"
                            />
                        </Box>
                    </Box>

                    <Divider />

                    {/* Theme */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Тема оформления
                        </Typography>
                        
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Тема</InputLabel>
                            <Select
                                value={style.theme}
                                label="Тема"
                                onChange={(e) => handleChange('theme', e.target.value)}
                            >
                                <MenuItem value="light">Светлая</MenuItem>
                                <MenuItem value="dark">Темная (в разработке)</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleReset} color="secondary">
                    Сбросить по умолчанию
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

export default DashboardStyleDialog;

