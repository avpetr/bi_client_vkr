import React, { useState, useEffect, useRef } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import {
    Container, Button, Box, Typography, Paper, Chip,
    IconButton, Tooltip, Menu, MenuItem, Divider, Avatar,
    useMediaQuery, useTheme
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import AddIcon from '@mui/icons-material/Add';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import FolderIcon from '@mui/icons-material/Folder';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import StorageIcon from '@mui/icons-material/Storage';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';
import PaletteIcon from '@mui/icons-material/Palette';
import FilterListIcon from '@mui/icons-material/FilterList';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

// Импорт стилей
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './InteractiveDashboard.css';
import './InteractiveDashboard.responsive.css';

import SmartWidget from '../components/SmartWidget';
import AddWidgetDialog from '../components/AddWidgetDialog';
import DashboardManagerDialog from '../components/DashboardManagerDialog';
import CSVUploadDialog from '../components/CSVUploadDialog';
import DataSourceDialog from '../components/DataSourceDialog';
import FilterSidebar, { SIDEBAR_WIDTH } from '../components/FilterSidebar';
import UserProfileDialog from '../components/UserProfileDialog';
import DashboardStyleDialog from '../components/DashboardStyleDialog';
import { useThemeMode } from '../context/ThemeContext';
import {
    getAllDashboards,
    getCurrentDashboardId,
    setCurrentDashboardId,
    getDashboardById,
    saveDashboard,
    createDashboard,
    deleteDashboard,
    renameDashboard,
    duplicateDashboard,
    exportDashboard,
    importDashboard
} from '../services/dashboardStorage';
import {
    getUserProfile,
    getUserDisplayName,
    canCreate,
    canEdit,
    canDelete,
    canUploadCSV,
    canManageDashboards,
    canConfigureWidgets
} from '../services/userProfile';

const ResponsiveGridLayout = WidthProvider(Responsive);

const InteractiveDashboard = () => {
    // Theme mode
    const { mode, toggleTheme } = useThemeMode();
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

    // Dashboard management state
    const [allDashboards, setAllDashboards] = useState(() => getAllDashboards());
    const [currentDashboardId, setCurrentDashboard] = useState(() => {
        const savedId = getCurrentDashboardId();
        const dashboards = getAllDashboards();

        // If saved ID exists and is valid, use it
        if (savedId && dashboards.find(d => d.id === savedId)) {
            return savedId;
        }

        // Otherwise, use first dashboard or create new one
        if (dashboards.length > 0) {
            setCurrentDashboardId(dashboards[0].id);
            return dashboards[0].id;
        }

        // Create first dashboard
        const newDashboard = createDashboard('Мой дашборд');
        setCurrentDashboardId(newDashboard.id);
        return newDashboard.id;
    });

    const currentDashboard = getDashboardById(currentDashboardId) || {
        id: currentDashboardId,
        name: 'Мой дашборд',
        layouts: { lg: [] },
        widgets: [],
        filters: {},
        style: {}
    };

    // State from current dashboard
    const [layouts, setLayouts] = useState(currentDashboard.layouts || { lg: [] });
    const [widgets, setWidgets] = useState(currentDashboard.widgets || []);
    const [filters, setFilters] = useState(currentDashboard.filters || {});
    const [dashboardStyle, setDashboardStyle] = useState(currentDashboard.style || {
        horizontalMargin: 10,
        verticalMargin: 10
    });

    // User state
    const [userProfile, setUserProfile] = useState(getUserProfile());

    // UI state
    const [isModalOpen, setModalOpen] = useState(false);
    const [isDashboardManagerOpen, setDashboardManagerOpen] = useState(false);
    const [isCSVUploadOpen, setCSVUploadOpen] = useState(false);
    const [isDataSourceOpen, setDataSourceOpen] = useState(false);
    const [isProfileOpen, setProfileOpen] = useState(false);
    const [isStyleOpen, setStyleOpen] = useState(false);
    const [isFilterSidebarOpen, setFilterSidebarOpen] = useState(false);
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);

    // Grid interaction state
    const [isDragging, setIsDragging] = useState(false);
    const [resizingId, setResizingId] = useState(null); // id виджета, размеры которого сейчас меняют
    const isResizing = resizingId !== null;

    // Ref на обёртку сетки + ResizeObserver для синхронизации CSS-переменных
    // с реальными параметрами react-grid-layout (чтобы фоновая сетка совпадала)
    const gridWrapperRef   = useRef(null);
    const updateGridVarsRef = useRef(null);
    useEffect(() => {
        const wrapper = gridWrapperRef.current;
        if (!wrapper) return;

        const cols    = isMobile ? 2  : (dashboardStyle.gridCols ?? 12);
        const rowH    = isMobile ? 80 : 60;
        const hMargin = isMobile ? 6  : (dashboardStyle.horizontalMargin ?? 10);
        const vMargin = isMobile ? 6  : (dashboardStyle.verticalMargin   ?? 10);
        const padding = isMobile ? 4  : 16;

        const updateVars = () => {
            const grid = wrapper.querySelector('.react-grid-layout');
            if (!grid) return;
            const w = grid.clientWidth;
            if (!w) return;
            const cellW = (w - 2 * padding - (cols - 1) * hMargin) / cols;
            grid.style.setProperty('--cell-w',   `${cellW}px`);
            grid.style.setProperty('--row-h',    `${rowH}px`);
            grid.style.setProperty('--h-margin', `${hMargin}px`);
            grid.style.setProperty('--v-margin', `${vMargin}px`);
            grid.style.setProperty('--padding',  `${padding}px`);
        };

        updateGridVarsRef.current = updateVars;
        // несколько попыток — react-grid-layout рендерится не сразу
        updateVars();
        const t1 = setTimeout(updateVars, 0);
        const t2 = setTimeout(updateVars, 100);

        const ro = new ResizeObserver(updateVars);
        ro.observe(wrapper);
        return () => {
            ro.disconnect();
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [isMobile, dashboardStyle.gridCols, dashboardStyle.horizontalMargin, dashboardStyle.verticalMargin, widgets.length]);

    // Нормализуем layout: задаём минимальные размеры по типу виджета
    const normalizeLayouts = (rawLayouts, widgetsArr) => {
        if (!rawLayouts) return { lg: [] };
        const typeByI = Object.fromEntries((widgetsArr || []).map(w => [w.i, w.type]));
        const normalizeItem = (item) => {
            const t = typeByI[item.i];
            const defMinH = t === 'card' ? 2 : 3;
            const defMinW = 2;
            return {
                ...item,
                minH: item.minH ?? defMinH,
                minW: item.minW ?? defMinW,
            };
        };
        const out = {};
        for (const bp of Object.keys(rawLayouts)) {
            out[bp] = (rawLayouts[bp] || []).map(normalizeItem);
        }
        return out;
    };

    // Load dashboard when currentDashboardId changes
    useEffect(() => {
        const loadDashboard = () => {
            const dashboard = getDashboardById(currentDashboardId);
            if (dashboard) {
                setLayouts(normalizeLayouts(dashboard.layouts || { lg: [] }, dashboard.widgets));
                setWidgets(dashboard.widgets || []);
                setFilters(dashboard.filters || {});
                setDashboardStyle(dashboard.style || {});
            }
        };
        loadDashboard();
    }, [currentDashboardId]);

    // Auto-save dashboard on changes
    useEffect(() => {
        const dashboard = getDashboardById(currentDashboardId);
        if (currentDashboardId && dashboard && (layouts.lg.length > 0 || widgets.length > 0)) {
            const updatedDashboard = {
                id: currentDashboardId,
                name: dashboard.name,
                layouts,
                widgets,
                filters,
                style: dashboardStyle,
                createdAt: dashboard.createdAt,
                updatedAt: new Date().toISOString()
            };
            saveDashboard(updatedDashboard);
        }
    }, [layouts, widgets, filters, dashboardStyle, currentDashboardId]);

    // Save dashboard explicitly
    const handleSaveDashboard = () => {
        const dashboard = {
            ...currentDashboard,
            layouts,
            widgets,
            filters,
            style: dashboardStyle,
            updatedAt: new Date().toISOString()
        };
        saveDashboard(dashboard);
        console.log('Dashboard saved!');
    };

    // Handle dashboard style save
    const handleStyleSave = (newStyle) => {
        setDashboardStyle(newStyle);
    };

    // Handle profile save
    const handleProfileSave = (profile) => {
        setUserProfile(profile);
    };

    // Dashboard management handlers
    const handleCreateDashboard = () => {
        const newDashboard = createDashboard();
        setAllDashboards(getAllDashboards());
        setCurrentDashboard(newDashboard.id);
        return newDashboard;
    };

    const handleSelectDashboard = (id) => {
        setCurrentDashboard(id);
        setCurrentDashboardId(id);
    };

    const handleDeleteDashboard = (id) => {
        deleteDashboard(id);
        const remaining = getAllDashboards();
        setAllDashboards(remaining);

        if (id === currentDashboardId) {
            if (remaining.length > 0) {
                handleSelectDashboard(remaining[0].id);
            } else {
                // Create new dashboard if all deleted
                const newDashboard = createDashboard();
                setAllDashboards(getAllDashboards());
                setCurrentDashboard(newDashboard.id);
            }
        }
    };

    const handleRenameDashboard = (id, newName) => {
        renameDashboard(id, newName);
        setAllDashboards(getAllDashboards());
    };

    const handleDuplicateDashboard = (id) => {
        const duplicated = duplicateDashboard(id);
        setAllDashboards(getAllDashboards());
        if (duplicated) {
            setCurrentDashboard(duplicated.id);
        }
    };

    const handleExportDashboard = (id) => {
        exportDashboard(id);
    };

    const handleImportDashboard = async (jsonString) => {
        const newDashboard = importDashboard(jsonString);
        setAllDashboards(getAllDashboards());
        return newDashboard;
    };

    // Load example dashboard — связная история «Анализ продаж за год»
    const handleLoadExample = () => {
        // ── Уровень 1: ключевые цифры (KPI) ─────────────────────────────────
        const kpiId       = uuidv4();
        // ── Уровень 2: динамика — как менялись показатели во времени ───────
        const trendId     = uuidv4();
        const breakdownId = uuidv4();
        // ── Уровень 3: разрезы — кто, где, откуда ──────────────────────────
        const regionsId   = uuidv4();
        const usersId     = uuidv4();
        // ── Уровень 4: финансы + источники трафика ─────────────────────────
        const financialId = uuidv4();
        const trafficId   = uuidv4();
        // ── Уровень 5: детальная таблица + real-time курсы валют ──────────
        const tableId     = uuidv4();
        const currencyId  = uuidv4();

        const exampleWidgets = [
            // KPI: годовые итоги
            {
                i: kpiId,
                title: 'Итоги за год',
                type: 'card',
                datasetId: 'salesPerformance',
                dataKeys: ['revenue', 'sales', 'profit', 'expenses'],
                settings: { cardAggregate: 'sum' },
            },
            // Динамика
            {
                i: trendId,
                title: 'Динамика продаж и прибыли по месяцам',
                type: 'line',
                datasetId: 'salesPerformance',
                dataKeys: ['sales', 'profit', 'revenue'],
                settings: { showDataLabels: true },
            },
            {
                i: breakdownId,
                title: 'Структура продаж по категориям',
                type: 'pie',
                datasetId: 'productCategories',
                dataKeys: ['value'],
            },
            // Разрезы
            {
                i: regionsId,
                title: 'Продажи по регионам',
                type: 'bar',
                datasetId: 'regionalSales',
                dataKeys: ['sales', 'customers'],
            },
            {
                i: usersId,
                title: 'Рост аудитории',
                type: 'area',
                datasetId: 'userAnalytics',
                dataKeys: ['activeUsers', 'newUsers'],
            },
            // Финансы и трафик
            {
                i: financialId,
                title: 'Квартальные финансовые показатели',
                type: 'composed',
                datasetId: 'financialMetrics',
                dataKeys: ['revenue', 'costs', 'profit'],
            },
            {
                i: trafficId,
                title: 'Источники трафика',
                type: 'bar',
                datasetId: 'trafficSources',
                dataKeys: ['visitors', 'bounceRate'],
            },
            // Таблица с деталями
            {
                i: tableId,
                title: 'Детальные данные по месяцам',
                type: 'table',
                datasetId: 'salesPerformance',
                dataKeys: [],
            },
            // Real-time таблица курсов валют к рублю
            {
                i: currencyId,
                title: 'Курсы валют к рублю (live)',
                type: 'table',
                datasetId: 'currenciesInRub',
                dataKeys: [],
            },
        ];

        const COMMON_CHART = { minW: 2, minH: 3 };
        const COMMON_CARD  = { minW: 2, minH: 2 };
        const COMMON_TABLE = { minW: 2, minH: 3 };

        const exampleLayouts = {
            lg: [
                // Ряд 1: KPI полной шириной — низкие тесные карточки
                { i: kpiId,       x: 0,  y: 0,  w: 12, h: 2, ...COMMON_CARD },
                // Ряд 2: динамика трендов и pie-разбивка
                { i: trendId,     x: 0,  y: 2,  w: 8,  h: 4, ...COMMON_CHART },
                { i: breakdownId, x: 8,  y: 2,  w: 4,  h: 4, ...COMMON_CHART },
                // Ряд 3: регионы и пользователи
                { i: regionsId,   x: 0,  y: 6,  w: 6,  h: 4, ...COMMON_CHART },
                { i: usersId,     x: 6,  y: 6,  w: 6,  h: 4, ...COMMON_CHART },
                // Ряд 4: финансы и трафик
                { i: financialId, x: 0,  y: 10, w: 8,  h: 4, ...COMMON_CHART },
                { i: trafficId,   x: 8,  y: 10, w: 4,  h: 4, ...COMMON_CHART },
                // Ряд 5: таблица деталей + live курсы валют
                { i: tableId,     x: 0,  y: 14, w: 8,  h: 5, ...COMMON_TABLE },
                { i: currencyId,  x: 8,  y: 14, w: 4,  h: 5, ...COMMON_TABLE },
            ],
        };

        setWidgets(exampleWidgets);
        setLayouts(exampleLayouts);
    };

    // Автозагрузка примера при первом визите — пустой дашборд → грузим демо
    // Флаг в localStorage гарантирует, что после удаления виджетов пример не вернётся
    useEffect(() => {
        if (localStorage.getItem('bi_example_loaded')) return;
        if (widgets.length > 0) return;
        if ((layouts.lg || []).length > 0) return;
        handleLoadExample();
        localStorage.setItem('bi_example_loaded', 'true');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // CSV upload handler
    const handleCSVUploadSuccess = (dataset) => {
        console.log('CSV uploaded successfully:', dataset);
        // Optionally, auto-add a widget with the new dataset
    };

    // Filters handler
    const handleFiltersChange = (newFilters) => {
        setFilters(newFilters);
    };

    // Добавление нового виджета
    const handleAddWidget = (config) => {
        const newId = uuidv4();

        // Минимальные размеры (в ячейках сетки) по типу виджета
        const isCard  = config.type === 'card';
        const isTable = config.type === 'table';
        const minH = isCard ? 2 : isTable ? 3 : 3;
        const minW = isCard ? 2 : 2;

        const newLayoutItem = {
            i: newId,
            x: (widgets.length * 4) % 12,
            y: Infinity,
            w: isCard ? 6 : isTable ? 12 : (config.type === 'pie' ? 4 : 6),
            h: isCard ? 3 : isTable ? 5 : 4,
            minW, minH,
        };

        // Сохраняем конфиг (что рисовать)
        const newWidgetConfig = {
            i: newId,
            ...config // title, type, datasetId, dataKeys
        };

        setLayouts(prev => ({ ...prev, lg: [...(prev.lg || []), newLayoutItem] }));
        setWidgets(prev => [...prev, newWidgetConfig]);
    };

    // Удаление виджета
    const handleRemoveWidget = (id) => {
        setWidgets(prev => prev.filter(w => w.i !== id));
        setLayouts(prev => ({
            ...prev,
            lg: prev.lg.filter(l => l.i !== id)
        }));
    };

    // Обновление виджета
    const handleUpdateWidget = (updatedConfig) => {
        setWidgets(prev => prev.map(w =>
            w.i === updatedConfig.i ? updatedConfig : w
        ));
    };

    // Обработка изменения макета (перетаскивание/ресайз)
    const onLayoutChange = (currentLayout, allLayouts) => {
        setLayouts(allLayouts);
    };

    // Count widgets by dataset
    const datasetStats = {};
    widgets.forEach(w => {
        datasetStats[w.datasetId] = (datasetStats[w.datasetId] || 0) + 1;
    });

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Filter Sidebar */}
            {canEdit() && (
                <FilterSidebar
                    open={isFilterSidebarOpen}
                    onClose={() => setFilterSidebarOpen(false)}
                    filters={filters}
                    onChange={handleFiltersChange}
                    onApply={() => console.log('Filters applied')}
                    widgets={widgets}
                />
            )}

            {/* Main Content — persistent Drawer уже занимает flex-слот слева, marginLeft не нужен */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    minWidth: 0,
                    overflow: 'hidden'
                }}
            >
                {/* Top Toolbar */}
                <Paper
                    className="dashboard-header"
                    sx={{
                        p: { xs: 0.75, sm: 1.5, md: 2 },
                        borderRadius: 0,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1100,
                        bgcolor: 'background.paper'
                    }}
                    elevation={2}
                >
                    <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                        {/* Left: filter + title */}
                        <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            {canEdit() && (
                                <Tooltip title={isFilterSidebarOpen ? "Скрыть фильтры" : "Показать фильтры"}>
                                    <IconButton
                                        size="small"
                                        onClick={() => setFilterSidebarOpen(!isFilterSidebarOpen)}
                                        color={isFilterSidebarOpen ? 'primary' : 'default'}
                                        sx={{ border: '1px solid', borderColor: isFilterSidebarOpen ? 'primary.main' : 'divider', flexShrink: 0 }}
                                    >
                                        <FilterListIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            <Box sx={{ minWidth: 0 }}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    <DashboardIcon sx={{ fontSize: { xs: 18, sm: 24 }, color: 'primary.main', flexShrink: 0 }} />
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 'bold',
                                            fontSize: { xs: '0.85rem', sm: '1.1rem', md: '1.25rem' },
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                    >
                                        {currentDashboard.name || 'BI Конструктор'}
                                    </Typography>
                                    <Chip
                                        label={`${widgets.length}`}
                                        size="small"
                                        variant="outlined"
                                        sx={{ display: { xs: 'none', sm: 'inline-flex' }, flexShrink: 0 }}
                                    />
                                </Box>
                                <Typography variant="caption" color="textSecondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                    {getUserDisplayName()} • {userProfile.role === 'creator' ? 'Создатель' : 'Наблюдатель'}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Right: actions */}
                        <Box display="flex" gap={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                            <Tooltip title="Профиль пользователя">
                                <IconButton
                                    onClick={() => setProfileOpen(true)}
                                    size="small"
                                    sx={{ border: '1px solid', borderColor: 'divider' }}
                                >
                                    <Avatar sx={{ width: { xs: 24, sm: 32 }, height: { xs: 24, sm: 32 }, fontSize: '0.75rem' }}>
                                        {userProfile.firstName?.charAt(0)}{userProfile.lastName?.charAt(0)}
                                    </Avatar>
                                </IconButton>
                            </Tooltip>

                            {canEdit() && (
                                <>
                                    {/* Palette: icon-only, hidden on mobile */}
                                    <Tooltip title="Стиль дашборда">
                                        <IconButton size="small" onClick={() => setStyleOpen(true)} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                                            <PaletteIcon />
                                        </IconButton>
                                    </Tooltip>

                                    {/* Dashboards: button on desktop, icon on mobile */}
                                    <Tooltip title="Управление дашбордами">
                                        <span>
                                            <IconButton size="small" onClick={() => setDashboardManagerOpen(true)} disabled={!canManageDashboards()} sx={{ display: { xs: 'inline-flex', sm: 'none' } }}>
                                                <FolderIcon fontSize="small" />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Button variant="outlined" startIcon={<FolderIcon />} onClick={() => setDashboardManagerOpen(true)} size="small" disabled={!canManageDashboards()} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                                        Дашборды
                                    </Button>

                                    {/* CSV: button on desktop, icon on mobile */}
                                    <Tooltip title="Загрузить CSV">
                                        <span>
                                            <IconButton size="small" onClick={() => setCSVUploadOpen(true)} disabled={!canUploadCSV()} sx={{ display: { xs: 'inline-flex', sm: 'none' } }}>
                                                <CloudUploadIcon fontSize="small" />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => setCSVUploadOpen(true)} size="small" disabled={!canUploadCSV()} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                                        CSV
                                    </Button>

                                </>
                            )}

                            {/* Data Sources — видно всем ролям */}
                            <Tooltip title="Источники данных (БД и API)">
                                <IconButton size="small" onClick={() => setDataSourceOpen(true)} sx={{ display: { xs: 'inline-flex', sm: 'none' }, border: '1px solid', borderColor: 'divider' }}>
                                    <StorageIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Button variant="outlined" startIcon={<StorageIcon />} onClick={() => setDataSourceOpen(true)} size="small" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                                Источники
                            </Button>

                            <Tooltip title={mode === 'dark' ? 'Светлая тема' : 'Темная тема'}>
                                <IconButton size="small" onClick={toggleTheme} color="inherit">
                                    {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                                </IconButton>
                            </Tooltip>

                            <IconButton size="small" onClick={(e) => setMenuAnchorEl(e.currentTarget)}>
                                <MoreVertIcon />
                            </IconButton>

                            <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={() => setMenuAnchorEl(null)}>
                                {canEdit() && [
                                    isMobile && (
                                        <MenuItem key="style" onClick={() => { setStyleOpen(true); setMenuAnchorEl(null); }}>
                                            <PaletteIcon fontSize="small" sx={{ mr: 1 }} />
                                            Стиль дашборда
                                        </MenuItem>
                                    ),
                                    <MenuItem key="load" onClick={() => { handleLoadExample(); setMenuAnchorEl(null); }}>
                                        <RestoreIcon fontSize="small" sx={{ mr: 1 }} />
                                        Загрузить пример
                                    </MenuItem>,
                                    <MenuItem key="save" onClick={() => { handleSaveDashboard(); setMenuAnchorEl(null); }}>
                                        <SaveIcon fontSize="small" sx={{ mr: 1 }} />
                                        Сохранить вручную
                                    </MenuItem>,
                                    <Divider key="divider1" />
                                ]}
                                <MenuItem key="datasource" onClick={() => { setDataSourceOpen(true); setMenuAnchorEl(null); }}>
                                    <StorageIcon fontSize="small" sx={{ mr: 1 }} />
                                    Источники данных
                                </MenuItem>
                                <MenuItem key="export" onClick={() => { handleExportDashboard(currentDashboardId); setMenuAnchorEl(null); }}>
                                    Экспортировать дашборд
                                </MenuItem>
                                <MenuItem key="profile" onClick={() => { setProfileOpen(true); setMenuAnchorEl(null); }}>
                                    <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                                    Профиль пользователя
                                </MenuItem>
                            </Menu>

                            {/* Add widget: button on desktop, icon on mobile */}
                            {canCreate() && (
                                <>
                                    <Tooltip title="Добавить график">
                                        <IconButton
                                            size="small"
                                            onClick={() => setModalOpen(true)}
                                            sx={{ display: { xs: 'inline-flex', sm: 'none' }, bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }}
                                        >
                                            <AddIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                                        Добавить график
                                    </Button>
                                </>
                            )}
                        </Box>
                    </Box>
                </Paper>

                {/* Dashboard Content Area */}
                <Box sx={{ flex: 1, p: { xs: 0.5, sm: 1.5, md: 3 }, overflowY: 'auto' }}>

                    {/* Сетка Drag-and-Drop */}
                    <Paper
                        ref={gridWrapperRef}
                        sx={{
                            // Заметный серый фон контрастирует с белыми карточками виджетов.
                            // Тёмная тема — оставляем темный background.default.
                            bgcolor: dashboardStyle.backgroundColor
                                || (muiTheme.palette.mode === 'dark' ? 'background.default' : '#e4e7eb'),
                            minHeight: 'calc(100vh - 180px)',
                            borderRadius: dashboardStyle.widgetBorderRadius || 2,
                            p: dashboardStyle.compactMode ? 1 : 2
                        }}
                        elevation={0}
                    >
                        {widgets.length === 0 && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '70vh',
                                    gap: 2
                                }}
                            >
                                <DashboardIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.3 }} />
                                <Typography variant="h6" color="textSecondary" align="center">
                                    Дашборд пуст
                                </Typography>
                                <Typography variant="body2" color="textSecondary" align="center">
                                    Нажмите "Добавить график" или "Пример", чтобы начать анализ данных
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => setModalOpen(true)}
                                    size="large"
                                >
                                    Добавить первый график
                                </Button>
                            </Box>
                        )}

                        <ResponsiveGridLayout
                            className={`layout ${isDragging ? 'dragging-active' : ''} ${isResizing ? 'resizing-active' : ''}`}
                            layouts={layouts}
                            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                            cols={{
                                lg: dashboardStyle.gridCols ?? 12,
                                md: dashboardStyle.gridCols ?? 12,
                                sm: 6, xs: 2, xxs: 2,
                            }}
                            rowHeight={isMobile ? 80 : 60}
                            margin={isMobile ? [6, 6] : [dashboardStyle.horizontalMargin || 10, dashboardStyle.verticalMargin || 10]}
                            containerPadding={isMobile ? [4, 4] : [16, 16]}
                            draggableHandle=".grid-drag-handle"
                            onLayoutChange={onLayoutChange}
                            onDragStart={() => { setIsDragging(true); updateGridVarsRef.current?.(); }}
                            onDragStop={() => setIsDragging(false)}
                            onResizeStart={(layout, oldItem, newItem) => {
                                setResizingId(newItem.i);
                                updateGridVarsRef.current?.();
                            }}
                            onResizeStop={() => setResizingId(null)}
                            compactType="vertical"
                            preventCollision={false}
                            isDraggable={true}
                            isResizable={true}
                            resizeHandles={['se']}
                            useCSSTransforms={true}
                        >
                            {widgets.map((widget) => (
                                <div
                                    key={widget.i}
                                    style={{
                                        display: 'flex',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <SmartWidget
                                        config={widget}
                                        filters={filters}
                                        isResizing={resizingId === widget.i}
                                        onDelete={canDelete() ? handleRemoveWidget : null}
                                        onUpdate={canConfigureWidgets() ? handleUpdateWidget : null}
                                    />
                                </div>
                            ))}
                        </ResponsiveGridLayout>
                    </Paper>
                </Box>
            </Box>

            {/* Диалог создания виджета */}
            <AddWidgetDialog
                open={isModalOpen}
                onClose={() => setModalOpen(false)}
                onAdd={handleAddWidget}
            />

            {/* Диалог управления дашбордами */}
            <DashboardManagerDialog
                open={isDashboardManagerOpen}
                onClose={() => setDashboardManagerOpen(false)}
                dashboards={allDashboards}
                currentDashboardId={currentDashboardId}
                onSelect={handleSelectDashboard}
                onCreate={handleCreateDashboard}
                onDelete={handleDeleteDashboard}
                onRename={handleRenameDashboard}
                onDuplicate={handleDuplicateDashboard}
                onExport={handleExportDashboard}
                onImport={handleImportDashboard}
            />

            {/* Диалог загрузки CSV */}
            <CSVUploadDialog
                open={isCSVUploadOpen}
                onClose={() => setCSVUploadOpen(false)}
                onUploadSuccess={handleCSVUploadSuccess}
            />

            {/* Диалог источников данных (БД и API) */}
            <DataSourceDialog
                open={isDataSourceOpen}
                onClose={() => setDataSourceOpen(false)}
                onDatasetSaved={handleCSVUploadSuccess}
            />

            {/* Диалог профиля пользователя */}
            <UserProfileDialog
                open={isProfileOpen}
                onClose={() => setProfileOpen(false)}
                onSave={handleProfileSave}
            />

            {/* Диалог стиля дашборда */}
            <DashboardStyleDialog
                open={isStyleOpen}
                onClose={() => setStyleOpen(false)}
                currentStyle={dashboardStyle}
                onSave={handleStyleSave}
            />
        </Box>
    );
};

export default InteractiveDashboard;