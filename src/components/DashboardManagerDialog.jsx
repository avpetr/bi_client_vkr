import React, { useState, useRef } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    List, ListItem, ListItemButton, ListItemText, ListItemSecondaryAction,
    IconButton, TextField, Box, Typography, Chip, Divider, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import AddIcon from '@mui/icons-material/Add';
import DashboardIcon from '@mui/icons-material/Dashboard';

const DashboardManagerDialog = ({ open, onClose, dashboards, currentDashboardId, onSelect, onCreate, onDelete, onRename, onDuplicate, onExport, onImport }) => {
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [importError, setImportError] = useState(null);
    const fileInputRef = useRef(null);

    const handleStartEdit = (dashboard) => {
        setEditingId(dashboard.id);
        setEditName(dashboard.name);
    };

    const handleSaveEdit = (id) => {
        if (editName.trim()) {
            onRename(id, editName.trim());
        }
        setEditingId(null);
        setEditName('');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImportError(null);

        try {
            const text = await file.text();
            const dashboard = await onImport(text);
            if (dashboard) {
                onSelect(dashboard.id);
                onClose();
            }
        } catch (error) {
            setImportError(error.message || 'Ошибка при импорте дашборда');
        }

        // Reset file input
        event.target.value = '';
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <DashboardIcon />
                    <Typography variant="h6">Управление дашбордами</Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            const newDashboard = onCreate();
                            if (newDashboard) {
                                onSelect(newDashboard.id);
                            }
                        }}
                        fullWidth
                    >
                        Создать новый дашборд
                    </Button>
                    
                    <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        onClick={handleImportClick}
                        fullWidth
                    >
                        Импортировать дашборд
                    </Button>
                    
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                </Box>

                {importError && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setImportError(null)}>
                        {importError}
                    </Alert>
                )}

                <Divider sx={{ my: 2 }} />

                {dashboards.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="textSecondary">
                            Нет сохраненных дашбордов
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            Создайте новый дашборд для начала работы
                        </Typography>
                    </Box>
                ) : (
                    <List>
                        {dashboards.map((dashboard) => (
                            <ListItem
                                key={dashboard.id}
                                sx={{
                                    border: '1px solid',
                                    borderColor: dashboard.id === currentDashboardId ? 'primary.main' : 'divider',
                                    borderRadius: 1,
                                    mb: 1,
                                    p: 0
                                }}
                                secondaryAction={
                                    editingId === dashboard.id ? (
                                        <Box>
                                            <Button
                                                size="small"
                                                onClick={() => handleSaveEdit(dashboard.id)}
                                            >
                                                Сохранить
                                            </Button>
                                            <Button
                                                size="small"
                                                onClick={handleCancelEdit}
                                            >
                                                Отмена
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Box>
                                            <IconButton
                                                edge="end"
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStartEdit(dashboard);
                                                }}
                                                title="Переименовать"
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                edge="end"
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDuplicate(dashboard.id);
                                                }}
                                                title="Дублировать"
                                            >
                                                <FileCopyIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                edge="end"
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onExport(dashboard.id);
                                                }}
                                                title="Экспортировать"
                                            >
                                                <DownloadIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                edge="end"
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm(`Удалить дашборд "${dashboard.name}"?`)) {
                                                        onDelete(dashboard.id);
                                                    }
                                                }}
                                                title="Удалить"
                                                color="error"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    )
                                }
                            >
                                <ListItemButton
                                    selected={dashboard.id === currentDashboardId}
                                    onClick={() => {
                                        if (editingId !== dashboard.id) {
                                            onSelect(dashboard.id);
                                            onClose();
                                        }
                                    }}
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: 'action.hover'
                                        }
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            editingId === dashboard.id ? (
                                                <TextField
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleSaveEdit(dashboard.id);
                                                        }
                                                    }}
                                                    size="small"
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                    fullWidth
                                                />
                                            ) : (
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Typography variant="subtitle1">
                                                        {dashboard.name}
                                                    </Typography>
                                                    {dashboard.id === currentDashboardId && (
                                                        <Chip label="Активный" size="small" color="primary" />
                                                    )}
                                                </Box>
                                            )
                                        }
                                        secondary={
                                            <Typography variant="caption" display="block" component="span">
                                                Виджетов: {dashboard.widgets?.length || 0} • 
                                                Обновлен: {formatDate(dashboard.updatedAt)}
                                            </Typography>
                                        }
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose}>Закрыть</Button>
            </DialogActions>
        </Dialog>
    );
};

export default DashboardManagerDialog;

