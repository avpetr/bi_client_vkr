/**
 * realTimeAdapters.js
 *
 * Адаптеры для источников данных реального времени.
 * Все API бесплатны, не требуют ключей и поддерживают CORS.
 */

// ─────────────────────────────────────────────────────────────────────────────
// АДАПТЕР 1: Курсы валют — open.er-api.com
// https://open.er-api.com — бесплатно, без ключа, CORS OK
// Текущие курсы 10 основных валют к USD
// ─────────────────────────────────────────────────────────────────────────────

const MAJOR_CURRENCIES = ['EUR', 'GBP', 'JPY', 'CNY', 'CHF', 'CAD', 'AUD', 'HKD', 'SEK', 'NOK'];

export const currencyRatesFetcher = async () => {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) throw new Error(`Exchange Rate API: ${response.status}`);
    const raw = await response.json();
    if (raw.result !== 'success') throw new Error('Exchange Rate API вернул ошибку');

    return MAJOR_CURRENCIES.map(code => ({
        name: code,
        rate: parseFloat(raw.rates[code]?.toFixed(4) ?? 0),
        // JPY и HKD — крупные числа, остальные — дробные; нормализуем для читаемости
        rateNorm: code === 'JPY' ? parseFloat((raw.rates[code] / 100).toFixed(4))
                : code === 'HKD' ? parseFloat((raw.rates[code] / 10).toFixed(4))
                : parseFloat(raw.rates[code]?.toFixed(4) ?? 0),
    })).filter(d => d.rate > 0);
};

export const currencyRatesDataset = {
    id: 'currencyRates',
    name: 'Курсы валют к USD',
    description: 'Текущие курсы EUR, GBP, JPY, CNY и других к доллару США — open.er-api.com',
    isRealTime: true,
    sourceId: 'currencyRates',
    defaultInterval: 60_000,
    metrics: [
        { key: 'rate',     label: 'Курс к USD',             color: '#8884d8' },
        { key: 'rateNorm', label: 'Курс (JPY÷100, HKD÷10)', color: '#82ca9d' },
    ],
    xAxisKey: 'name',
};

// ─────────────────────────────────────────────────────────────────────────────
// АДАПТЕР 2: Криптовалюты — CoinCap API
// https://api.coincap.io — реальное время, бесплатно, без ключа, CORS OK
// Цены и изменения топ-10 криптовалют, обновляются каждые ~30 сек
// ─────────────────────────────────────────────────────────────────────────────

export const cryptoPricesFetcher = async () => {
    const response = await fetch('https://api.coincap.io/v2/assets?limit=10');
    if (!response.ok) throw new Error(`CoinCap API: ${response.status}`);
    const raw = await response.json();

    return raw.data.map(coin => ({
        name:      coin.symbol,                                             // BTC, ETH …
        price:     parseFloat(parseFloat(coin.priceUsd).toFixed(2)),
        change24h: parseFloat(parseFloat(coin.changePercent24Hr).toFixed(2)),
        volume24h: parseFloat((parseFloat(coin.volumeUsd24Hr) / 1_000_000).toFixed(1)), // в млн $
    }));
};

export const cryptoPricesDataset = {
    id: 'cryptoPrices',
    name: 'Криптовалюты топ-10 (CoinCap)',
    description: 'Цена, изменение за 24 ч и объём торгов — обновляется каждые 30 сек',
    isRealTime: true,
    sourceId: 'cryptoPrices',
    defaultInterval: 30_000,
    metrics: [
        { key: 'price',    label: 'Цена (USD)',        color: '#8884d8' },
        { key: 'change24h',label: 'Изменение 24 ч (%)', color: '#82ca9d' },
        { key: 'volume24h',label: 'Объём (млн USD)',    color: '#ffc658' },
    ],
    xAxisKey: 'name',
};

// ─────────────────────────────────────────────────────────────────────────────
// АДАПТЕР 3: Землетрясения — USGS Earthquake Hazards Program
// https://earthquake.usgs.gov/ — реальное время, бесплатно, CORS OK
// ─────────────────────────────────────────────────────────────────────────────

export const earthquakesFetcher = async () => {
    const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
    const response = await fetch(url);
    if (!response.ok) throw new Error(`USGS API: ${response.status}`);
    const raw = await response.json();

    const byHour = {};
    for (const feature of raw.features) {
        const mag = feature.properties.mag;
        if (mag == null) continue;
        const d = new Date(feature.properties.time);
        const key = `${String(d.getUTCHours()).padStart(2, '0')}:00`;
        if (!byHour[key]) byHour[key] = { name: key, count: 0, maxMag: 0, avgMag: 0, _sum: 0 };
        byHour[key].count += 1;
        byHour[key]._sum += mag;
        byHour[key].maxMag = Math.max(byHour[key].maxMag, parseFloat(mag.toFixed(1)));
        byHour[key].avgMag = parseFloat((byHour[key]._sum / byHour[key].count).toFixed(2));
    }

    return Object.values(byHour).sort((a, b) => a.name.localeCompare(b.name));
};

export const earthquakesDataset = {
    id: 'earthquakes',
    name: 'Землетрясения сегодня (USGS)',
    description: 'Количество и магнитуда землетрясений за 24 ч по часам UTC',
    isRealTime: true,
    sourceId: 'earthquakes',
    defaultInterval: 300_000,
    metrics: [
        { key: 'count',  label: 'Количество',       color: '#ff7c7c' },
        { key: 'maxMag', label: 'Макс. магнитуда',   color: '#ffc658' },
        { key: 'avgMag', label: 'Средняя магнитуда', color: '#8884d8' },
    ],
    xAxisKey: 'name',
};

// ─────────────────────────────────────────────────────────────────────────────
// АДАПТЕР 4: Симулированные котировки (демо без внешнего API)
// ─────────────────────────────────────────────────────────────────────────────

const stockState = { AAPL: 185.0, MSFT: 420.0, GOOGL: 175.0, AMZN: 195.0 };
const randomStep = (prev, vol = 0.005) =>
    parseFloat((prev + prev * vol * (Math.random() * 2 - 1)).toFixed(2));
const stockHistory = [];
const MAX_HISTORY = 30;

export const simulatedStocksFetcher = async () => {
    for (const k of Object.keys(stockState)) stockState[k] = randomStep(stockState[k]);
    const point = {
        name: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        AAPL: stockState.AAPL,
        MSFT: stockState.MSFT,
        GOOGL: stockState.GOOGL,
        AMZN: stockState.AMZN,
    };
    stockHistory.push(point);
    if (stockHistory.length > MAX_HISTORY) stockHistory.shift();
    return [...stockHistory];
};

export const simulatedStocksDataset = {
    id: 'simulatedStocks',
    name: 'Котировки акций (симуляция)',
    description: 'Демо: случайное блуждание цен AAPL, MSFT, GOOGL, AMZN в реальном времени',
    isRealTime: true,
    sourceId: 'simulatedStocks',
    defaultInterval: 5_000,
    metrics: [
        { key: 'AAPL',  label: 'Apple',    color: '#8884d8' },
        { key: 'MSFT',  label: 'Microsoft', color: '#82ca9d' },
        { key: 'GOOGL', label: 'Google',    color: '#ffc658' },
        { key: 'AMZN',  label: 'Amazon',    color: '#ff7c7c' },
    ],
    xAxisKey: 'name',
};

// ─────────────────────────────────────────────────────────────────────────────
// Реестр всех real-time датасетов
// ─────────────────────────────────────────────────────────────────────────────

export const getRealtimeDatasets = () => ({
    currencyRates:   currencyRatesDataset,
    cryptoPrices:    cryptoPricesDataset,
    earthquakes:     earthquakesDataset,
    simulatedStocks: simulatedStocksDataset,
});
