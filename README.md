# BI Dashboard Constructor

Интерактивный конструктор дашбордов для бизнес-аналитики на React: drag-and-drop сетка виджетов, шесть типов графиков, real-time источники данных, вычисляемые метрики и поддержка собственных API.

Учебный прототип в рамках ВКР.

## Возможности

### Визуализация
- **6 типов графиков** — линейный, столбчатый, площадной, круговой, точечный, комбинированный
- **Drag-and-Drop сетка** на `react-grid-layout` с произвольным изменением размера виджетов
- **Адаптивность** — компактная вёрстка на мобильных, 2 колонки сетки вместо 12
- **Темы** — светлая, тёмная, четыре встроенные палитры (Midnight, Forest, Ocean…) и редактор собственных тем

### Работа с данными
- **8 встроенных датасетов** — продажи, аналитика пользователей, финансы, региональные данные и др.
- **CSV-импорт** — загрузка собственных таблиц с авто-определением типов колонок
- **Real-time источники** с автообновлением и ручным refresh:
  - Курсы валют (open.er-api.com)
  - Криптовалюты топ-10 (CoinCap, обновление ~30 сек)
  - Землетрясения за 24 ч (USGS)
  - Симулированные котировки акций
- **Произвольные API** — диалог настройки REST-эндпоинтов с авторизацией, заголовками, путём к данным, тестированием и сохранением как датасет
- **БД-подключения** — UI для PostgreSQL/ClickHouse/MySQL/MSSQL (требует backend)

### Аналитика
- **Вычисляемые метрики** — собственные формулы на основе полей датасета:
  - Арифметика: `+ - * / % **`
  - Сравнения и логика: `> < >= <= == != && || !`
  - Функции: `round, abs, min, max, sqrt, pow, floor, ceil, clamp`
  - Условия: `IF(условие, да, нет)`
  - Агрегаты по датасету: `SUM, AVG, MAXV, MINV`
  - Живой превью результата на первой строке данных
- **Фильтры** — боковая панель с фильтрацией по столбцам датасета
- **Множественные метрики** на одном графике
- **Переименование серий** и кастомные цвета для каждой

### Управление
- **Несколько дашбордов** — менеджер с созданием, переименованием, дублированием, экспортом и импортом JSON
- **Автосохранение** в `localStorage`
- **Профили пользователей** — роли creator/viewer с разграничением действий
- **Стилизация дашборда** — отступы, скругления, фон, компактный режим

## Технологический стек

| Слой | Используется |
|---|---|
| UI | React 19, Material-UI v7, Emotion |
| Графики | Recharts |
| Сетка | react-grid-layout (legacy) |
| Сборка | Vite |
| HTTP | Fetch API + Axios (для backend, если будет) |
| Хранение | localStorage |

## Установка и запуск

```bash
npm install
npm run dev          # dev-режим
npm run build        # production-сборка
npm run preview      # предпросмотр сборки
npm run lint         # ESLint
```

## Структура проекта

```
bi-client/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                              # точка входа React
    ├── App.jsx                               # корневой компонент + ThemeProvider
    │
    ├── pages/
    │   ├── InteractiveDashboard.jsx          # главная страница
    │   ├── InteractiveDashboard.css          # анимации сетки, скроллбары
    │   └── InteractiveDashboard.responsive.css  # медиазапросы для мобильных
    │
    ├── components/
    │   ├── SmartWidget.jsx                   # виджет графика (рендер всех типов)
    │   ├── AddWidgetDialog.jsx               # диалог создания виджета
    │   ├── AdvancedWidgetSettings.jsx        # настройки: данные, серии, формулы, стиль
    │   ├── DataSourceDialog.jsx              # БД и API источники
    │   ├── DashboardManagerDialog.jsx        # CRUD дашбордов
    │   ├── DashboardStyleDialog.jsx          # глобальный стиль дашборда
    │   ├── CSVUploadDialog.jsx               # импорт CSV
    │   ├── FilterSidebar.jsx                 # боковая панель фильтров
    │   ├── AdvancedFilterSidebar.jsx         # расширенный режим фильтров
    │   ├── RealTimeControls.jsx              # выбор интервала + кнопка refresh
    │   ├── ThemeCustomizerDialog.jsx         # редактор кастомных тем
    │   └── UserProfileDialog.jsx             # профиль и роли
    │
    ├── context/
    │   └── ThemeContext.jsx                  # MUI ThemeProvider + переключение тем
    │
    ├── hooks/
    │   └── useRealTimeData.js                # автоопрос источника с интервалом
    │
    └── services/
        ├── mockDatasets.js                   # 8 встроенных датасетов + реестр
        ├── formulaEvaluator.js               # движок вычисляемых метрик
        ├── realTimeAdapters.js               # адаптеры внешних API
        ├── realTimeDataService.js            # реестр real-time источников
        ├── csvParser.js                      # парсинг и сохранение CSV-датасетов
        ├── columnTypeManager.js              # авто-детект типов колонок CSV
        ├── dashboardStorage.js               # CRUD дашбордов в localStorage
        ├── dataSourceStorage.js              # хранение БД- и API-конфигов
        ├── themeStorage.js                   # темы по умолчанию + кастомные
        ├── userProfile.js                    # профиль и проверки прав
        └── api.js                            # шаблон Axios-клиента (для будущего backend)
```

## Встроенные датасеты

| ID | Описание | Поля |
|---|---|---|
| `salesPerformance` | Продажи по месяцам | sales, profit, expenses, revenue |
| `userAnalytics` | Аналитика пользователей | activeUsers, newUsers, churnedUsers, sessions |
| `productCategories` | Категории товаров | value, orders, avgPrice |
| `trafficSources` | Источники трафика | value, visitors, bounceRate |
| `regionalSales` | Региональные продажи | sales, customers, avgOrder |
| `financialMetrics` | Финансы по кварталам | revenue, costs, profit, margin |
| `customerSatisfaction` | Удовлетворённость клиентов | satisfaction, nps, responses, complaints |
| `employeePerformance` | Эффективность отделов | productivity, satisfaction, headcount |

## Real-time источники

Зарегистрированы в [`src/services/realTimeAdapters.js`](src/services/realTimeAdapters.js):

| Источник | API | Интервал по умолчанию |
|---|---|---|
| Курсы валют к USD | `open.er-api.com` | 60 сек |
| Криптовалюты топ-10 | `api.coincap.io` | 30 сек |
| Землетрясения 24ч | `earthquake.usgs.gov` | 5 мин |
| Симулированные акции | локальная генерация | 5 сек |

В шапке виджета real-time источника появляется панель `RealTimeControls`: индикатор времени последнего обновления, выбор интервала и кнопка ручного обновления.

## Вычисляемые метрики

В диалоге настроек графика → вкладка «Вычисления» можно создать собственное поле на основе формулы:

```
profit / revenue * 100              # маржа в процентах
IF(profit > 0, profit, 0)           # отрицательные прибыли заменяем на 0
sales / SUM("sales") * 100          # доля от общего объёма
round(revenue / 1000, 1)            # тысячи рублей с одним знаком
```

Метрика автоматически добавляется в список доступных серий и пересчитывается при каждом изменении данных.

## Подключение собственного API

Диалог «Источники данных» → вкладка «API»:

1. Нажать «Новый источник» или выбрать готовый пример (Криптовалюты, Курсы валют, Погода, Землетрясения)
2. Указать URL, метод, заголовки и авторизацию
3. Поле «Путь к данным» — JSON-path до массива (например `data.items`). Если ответ — объект `{key: value}`, он автоматически разворачивается в `[{name, value}]`
4. «Выполнить запрос» → предпросмотр в таблице → «Сохранить как датасет»

Сохранённый источник появляется в выборе датасета при создании виджета.

## Будущая интеграция с backend

В `src/services/api.js` подготовлен Axios-клиент для подключения серверной части. Планируемые эндпоинты:

- `POST /api/dashboards` / `GET /api/dashboards/:id` — конфиги дашбордов
- `POST /api/db/test`, `POST /api/db/query` — выполнение SQL через бэкенд
- `GET /api/metrics/:datasetId` — данные из ClickHouse/PostgreSQL
- `GET /api/datasets` — список источников

Сейчас сохранение полностью клиентское (`localStorage`).

## Лицензия

MIT.

---

*Создано как часть выпускной квалификационной работы.*
