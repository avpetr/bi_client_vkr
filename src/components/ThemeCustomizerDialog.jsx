import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, Typography, TextField, IconButton, Tabs, Tab,
    List, ListItem, ListItemText, ListItemSecondaryAction,
    Chip, Divider, Alert, Stack, FormControl, InputLabel,
    Select, MenuItem, Paper, Grid, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PaletteIcon from '@mui/icons-material/Palette';
import CodeIcon from '@mui/icons-material/Code';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useThemeMode } from '../context/ThemeContext';
import { getCustomCSS, saveCustomCSS, clearCustomCSS } from '../services/themeStorage';

const ThemeCustomizerDialog = ({ open, onClose }) => {
    const { 
        allThemes, 
        currentThemeId, 
        currentTheme,
        switchTheme, 
        saveTheme, 
        deleteTheme, 
        exportTheme,
        importTheme 
    } = useThemeMode();
    
    const [tabValue, setTabValue] = useState(0);
    const [editingTheme, setEditingTheme] = useState(null);
    const [customCSS, setCustomCSS] = useState(() => getCustomCSS());
    const [error, setError] = useState('');
    
    // Form state for new/edit theme
    const [themeName, setThemeName] = useState('');
    const [themeMode, setThemeMode] = useState('light');
    const [colors, setColors] = useState({
        primary: '#1976d2',
        secondary: '#dc004e',
        background: '#f5f7fa',
        paper: '#ffffff',
        textPrimary: 'rgba(0, 0, 0, 0.87)',
        textSecondary: 'rgba(0, 0, 0, 0.6)',
    });

    const handleStartEdit = (theme) => {
        setEditingTheme(theme);
        setThemeName(theme.name);
        setThemeMode(theme.mode);
        setColors(theme.colors);
        setTabValue(1); // Switch to create/edit tab
    };

    const handleStartNew = () => {
        setEditingTheme(null);
        setThemeName('');
        setThemeMode('light');
        setColors({
            primary: '#1976d2',
            secondary: '#dc004e',
            background: '#f5f7fa',
            paper: '#ffffff',
            textPrimary: 'rgba(0, 0, 0, 0.87)',
            textSecondary: 'rgba(0, 0, 0, 0.6)',
        });
    };

    const handleSaveTheme = () => {
        if (!themeName.trim()) {
            setError('Theme name is required');
            return;
        }

        const themeData = {
            id: editingTheme ? editingTheme.id : `custom_${Date.now()}`,
            name: themeName.trim(),
            mode: themeMode,
            colors: colors,
        };

        try {
            saveTheme(themeData);
            setError('');
            handleStartNew();
            setTabValue(0); // Switch back to themes list
        } catch (err) {
            setError(err.message || 'Failed to save theme');
        }
    };

    const handleColorChange = (colorKey, value) => {
        setColors(prev => ({
            ...prev,
            [colorKey]: value
        }));
    };

    const handleDeleteTheme = (themeId) => {
        if (window.confirm('Are you sure you want to delete this theme?')) {
            deleteTheme(themeId);
        }
    };

    const handleSaveCustomCSS = () => {
        try {
            saveCustomCSS(customCSS);
            setError('');
            alert('Custom CSS saved successfully!');
        } catch (err) {
            setError('Failed to save custom CSS');
        }
    };

    const handleClearCustomCSS = () => {
        if (window.confirm('Are you sure you want to clear all custom CSS?')) {
            clearCustomCSS();
            setCustomCSS('');
        }
    };

    const handleImportTheme = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = importTheme(e.target.result);
                alert(`Theme "${imported.name}" imported successfully!`);
                event.target.value = '';
            } catch (err) {
                setError(err.message || 'Failed to import theme');
            }
        };
        reader.readAsText(file);
    };

    const themesList = Object.values(allThemes);

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
                sx: { height: '90vh' }
            }}
        >
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        <PaletteIcon />
                        <Typography variant="h6">Theme Customizer</Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                    value={tabValue} 
                    onChange={(e, v) => setTabValue(v)}
                    variant="fullWidth"
                >
                    <Tab label="Themes" icon={<PaletteIcon />} iconPosition="start" />
                    <Tab label="Create/Edit" icon={<AddIcon />} iconPosition="start" />
                    <Tab label="Custom CSS" icon={<CodeIcon />} iconPosition="start" />
                </Tabs>
            </Box>

            <DialogContent>
                {error && (
                    <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Tab 1: Themes List */}
                {tabValue === 0 && (
                    <Box>
                        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    handleStartNew();
                                    setTabValue(1);
                                }}
                                fullWidth
                            >
                                Create New Theme
                            </Button>
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<UploadIcon />}
                            >
                                Import
                                <input
                                    type="file"
                                    accept=".json"
                                    hidden
                                    onChange={handleImportTheme}
                                />
                            </Button>
                        </Box>

                        <List>
                            {themesList.map(theme => (
                                <Paper 
                                    key={theme.id} 
                                    elevation={theme.id === currentThemeId ? 3 : 1}
                                    sx={{ 
                                        mb: 1, 
                                        p: 2,
                                        border: theme.id === currentThemeId ? '2px solid' : '1px solid',
                                        borderColor: theme.id === currentThemeId ? 'primary.main' : 'divider'
                                    }}
                                >
                                    <ListItem sx={{ p: 0 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                            {/* Color Preview */}
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <Box sx={{ 
                                                    width: 24, 
                                                    height: 24, 
                                                    bgcolor: theme.colors.primary,
                                                    borderRadius: 1,
                                                    border: '1px solid rgba(0,0,0,0.1)'
                                                }} />
                                                <Box sx={{ 
                                                    width: 24, 
                                                    height: 24, 
                                                    bgcolor: theme.colors.secondary,
                                                    borderRadius: 1,
                                                    border: '1px solid rgba(0,0,0,0.1)'
                                                }} />
                                            </Box>
                                            
                                            <ListItemText
                                                primary={
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        {theme.name}
                                                        {theme.isBuiltIn && (
                                                            <Chip label="Built-in" size="small" />
                                                        )}
                                                        {theme.id === currentThemeId && (
                                                            <CheckCircleIcon color="primary" fontSize="small" />
                                                        )}
                                                    </Box>
                                                }
                                                secondary={`Mode: ${theme.mode}`}
                                            />
                                        </Box>
                                        <ListItemSecondaryAction>
                                            <Tooltip title="Apply Theme">
                                                <IconButton 
                                                    onClick={() => switchTheme(theme.id)}
                                                    color={theme.id === currentThemeId ? 'primary' : 'default'}
                                                    size="small"
                                                >
                                                    <CheckCircleIcon />
                                                </IconButton>
                                            </Tooltip>
                                            {!theme.isBuiltIn && (
                                                <>
                                                    <Tooltip title="Edit Theme">
                                                        <IconButton 
                                                            onClick={() => handleStartEdit(theme)}
                                                            size="small"
                                                        >
                                                            <PaletteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Theme">
                                                        <IconButton 
                                                            onClick={() => handleDeleteTheme(theme.id)}
                                                            size="small"
                                                            color="error"
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                            <Tooltip title="Export Theme">
                                                <IconButton 
                                                    onClick={() => exportTheme(theme.id)}
                                                    size="small"
                                                >
                                                    <DownloadIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                </Paper>
                            ))}
                        </List>
                    </Box>
                )}

                {/* Tab 2: Create/Edit Theme */}
                {tabValue === 1 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            {editingTheme ? `Edit: ${editingTheme.name}` : 'Create New Theme'}
                        </Typography>

                        <Stack spacing={3} sx={{ mt: 2 }}>
                            <TextField
                                label="Theme Name"
                                value={themeName}
                                onChange={(e) => setThemeName(e.target.value)}
                                fullWidth
                                required
                            />

                            <FormControl fullWidth>
                                <InputLabel>Mode</InputLabel>
                                <Select
                                    value={themeMode}
                                    label="Mode"
                                    onChange={(e) => setThemeMode(e.target.value)}
                                >
                                    <MenuItem value="light">Light</MenuItem>
                                    <MenuItem value="dark">Dark</MenuItem>
                                </Select>
                            </FormControl>

                            <Divider />

                            <Typography variant="subtitle1" fontWeight="bold">Colors</Typography>

                            <Grid container spacing={2}>
                                {Object.entries(colors).map(([key, value]) => (
                                    <Grid item xs={12} sm={6} key={key}>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <input
                                                type="color"
                                                value={value.startsWith('rgba') ? '#000000' : value}
                                                onChange={(e) => handleColorChange(key, e.target.value)}
                                                style={{ 
                                                    width: 50, 
                                                    height: 50, 
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                            <TextField
                                                label={key.replace(/([A-Z])/g, ' $1').trim()}
                                                value={value}
                                                onChange={(e) => handleColorChange(key, e.target.value)}
                                                fullWidth
                                                size="small"
                                            />
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>

                            {/* Theme Preview */}
                            <Paper 
                                elevation={3} 
                                sx={{ 
                                    p: 3, 
                                    bgcolor: colors.background,
                                    color: colors.textPrimary
                                }}
                            >
                                <Typography variant="h6" gutterBottom>Theme Preview</Typography>
                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                    <Button variant="contained" size="small" sx={{ bgcolor: colors.primary }}>
                                        Primary
                                    </Button>
                                    <Button variant="contained" size="small" sx={{ bgcolor: colors.secondary }}>
                                        Secondary
                                    </Button>
                                </Box>
                                <Paper sx={{ p: 2, bgcolor: colors.paper }}>
                                    <Typography color={colors.textPrimary}>
                                        Primary Text
                                    </Typography>
                                    <Typography color={colors.textSecondary}>
                                        Secondary Text
                                    </Typography>
                                </Paper>
                            </Paper>

                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button 
                                    variant="contained" 
                                    onClick={handleSaveTheme}
                                    fullWidth
                                >
                                    {editingTheme ? 'Update Theme' : 'Save Theme'}
                                </Button>
                                {editingTheme && (
                                    <Button 
                                        variant="outlined" 
                                        onClick={() => {
                                            handleStartNew();
                                            setTabValue(0);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </Box>
                        </Stack>
                    </Box>
                )}

                {/* Tab 3: Custom CSS */}
                {tabValue === 2 && (
                    <Box>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                                You can add custom CSS here to further personalize your dashboard.
                                Use CSS variables like <code>var(--primary-color)</code> for theme colors.
                            </Typography>
                        </Alert>

                        <TextField
                            label="Custom CSS"
                            value={customCSS}
                            onChange={(e) => setCustomCSS(e.target.value)}
                            multiline
                            rows={20}
                            fullWidth
                            placeholder="/* Add your custom CSS here */
.dashboard-container {
  /* Your styles */
}

.custom-class {
  color: var(--primary-color);
}"
                            InputProps={{
                                sx: { fontFamily: 'monospace', fontSize: '0.9rem' }
                            }}
                        />

                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Button 
                                variant="contained" 
                                onClick={handleSaveCustomCSS}
                                fullWidth
                            >
                                Apply Custom CSS
                            </Button>
                            <Button 
                                variant="outlined" 
                                color="error"
                                onClick={handleClearCustomCSS}
                            >
                                Clear
                            </Button>
                        </Box>

                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Available CSS Variables:
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                                <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
{`--primary-color
--secondary-color
--background-color
--paper-color
--text-primary-color
--text-secondary-color`}
                                </Typography>
                            </Paper>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ThemeCustomizerDialog;




