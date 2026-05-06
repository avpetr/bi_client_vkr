import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Box, Typography, FormControl, InputLabel, Select,
    MenuItem, Avatar, Divider, Alert
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { getUserProfile, saveUserProfile, UserRoles } from '../services/userProfile';

const UserProfileDialog = ({ open, onClose, onSave }) => {
    const currentProfile = getUserProfile();
    
    const [profile, setProfile] = useState({
        firstName: currentProfile.firstName || '',
        lastName: currentProfile.lastName || '',
        username: currentProfile.username || '',
        role: currentProfile.role || UserRoles.CREATOR,
        email: currentProfile.email || ''
    });

    const handleChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        const updatedProfile = {
            ...currentProfile,
            ...profile,
            updatedAt: new Date().toISOString()
        };
        
        saveUserProfile(updatedProfile);
        
        if (onSave) {
            onSave(updatedProfile);
        }
        
        onClose();
    };

    const handleCancel = () => {
        // Reset to current profile
        setProfile({
            firstName: currentProfile.firstName || '',
            lastName: currentProfile.lastName || '',
            username: currentProfile.username || '',
            role: currentProfile.role || UserRoles.CREATOR,
            email: currentProfile.email || ''
        });
        onClose();
    };

    const getInitials = () => {
        const first = profile.firstName?.charAt(0) || '';
        const last = profile.lastName?.charAt(0) || '';
        return (first + last).toUpperCase() || 'U';
    };

    return (
        <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon />
                    <Typography variant="h6">Профиль пользователя</Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                    {/* Avatar */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <Avatar 
                            sx={{ 
                                width: 80, 
                                height: 80, 
                                fontSize: '2rem',
                                bgcolor: 'primary.main'
                            }}
                        >
                            {getInitials()}
                        </Avatar>
                    </Box>

                    <Alert severity="info" sx={{ mb: 1 }}>
                        В продакшен-версии данные профиля будут загружаться с сервера.
                        Сейчас они хранятся локально в браузере.
                    </Alert>

                    <Divider />

                    {/* Personal Information */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                            Личная информация
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Имя"
                                value={profile.firstName}
                                onChange={(e) => handleChange('firstName', e.target.value)}
                                fullWidth
                                required
                            />

                            <TextField
                                label="Фамилия"
                                value={profile.lastName}
                                onChange={(e) => handleChange('lastName', e.target.value)}
                                fullWidth
                                required
                            />

                            <TextField
                                label="Имя пользователя"
                                value={profile.username}
                                onChange={(e) => handleChange('username', e.target.value)}
                                fullWidth
                                required
                                helperText="Уникальный идентификатор пользователя"
                            />

                            <TextField
                                label="Email (опционально)"
                                type="email"
                                value={profile.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                fullWidth
                            />
                        </Box>
                    </Box>

                    <Divider />

                    {/* Role & Permissions */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                            Роль и права доступа
                        </Typography>

                        <FormControl fullWidth>
                            <InputLabel>Роль пользователя</InputLabel>
                            <Select
                                value={profile.role}
                                label="Роль пользователя"
                                onChange={(e) => handleChange('role', e.target.value)}
                            >
                                <MenuItem value={UserRoles.CREATOR}>
                                    <Box>
                                        <Typography variant="body1">Создатель (Creator)</Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            Полный доступ: создание, редактирование, удаление
                                        </Typography>
                                    </Box>
                                </MenuItem>
                                <MenuItem value={UserRoles.VIEWER}>
                                    <Box>
                                        <Typography variant="body1">Наблюдатель (Viewer)</Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            Только просмотр дашбордов
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>

                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }} display="block" gutterBottom>
                                Права выбранной роли:
                            </Typography>
                            {profile.role === UserRoles.CREATOR ? (
                                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                    <Typography component="li" variant="caption">✓ Создание дашбордов и графиков</Typography>
                                    <Typography component="li" variant="caption">✓ Редактирование виджетов</Typography>
                                    <Typography component="li" variant="caption">✓ Загрузка CSV файлов</Typography>
                                    <Typography component="li" variant="caption">✓ Управление фильтрами</Typography>
                                    <Typography component="li" variant="caption">✓ Удаление элементов</Typography>
                                </Box>
                            ) : (
                                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                    <Typography component="li" variant="caption">✓ Просмотр дашбордов</Typography>
                                    <Typography component="li" variant="caption">✗ Создание и редактирование</Typography>
                                    <Typography component="li" variant="caption">✗ Загрузка файлов</Typography>
                                    <Typography component="li" variant="caption">✗ Удаление элементов</Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>

                    {/* Metadata */}
                    {currentProfile.createdAt && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                                Профиль создан: {new Date(currentProfile.createdAt).toLocaleString('ru-RU')}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleCancel}>
                    Отмена
                </Button>
                <Button 
                    onClick={handleSave} 
                    variant="contained"
                    disabled={!profile.firstName || !profile.lastName || !profile.username}
                >
                    Сохранить
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserProfileDialog;




