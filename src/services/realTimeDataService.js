/**
 * realTimeDataService.js
 *
 * Реестр адаптеров для источников данных реального времени.
 *
 * КАК ДОБАВИТЬ НОВЫЙ ИСТОЧНИК:
 *   1. Создайте адаптер в realTimeAdapters.js
 *   2. Добавьте его в adapterRegistry ниже
 *   3. Добавьте описание датасета в getRealtimeDatasets() в realTimeAdapters.js
 */

import {
    currenciesInRubFetcher,
    currencyRatesFetcher,
    cryptoPricesFetcher,
    earthquakesFetcher,
    simulatedStocksFetcher,
} from './realTimeAdapters';

// Реестр: sourceId -> async () => DataPoint[]
const adapterRegistry = {
    currenciesInRub: currenciesInRubFetcher,
    currencyRates:   currencyRatesFetcher,
    cryptoPrices:    cryptoPricesFetcher,
    earthquakes:     earthquakesFetcher,
    simulatedStocks: simulatedStocksFetcher,
};

/**
 * Выполняет запрос данных из зарегистрированного источника.
 * @param {string} sourceId
 * @returns {Promise<Array>} массив точек данных для графика
 */
export const fetchFromSource = async (sourceId) => {
    const adapter = adapterRegistry[sourceId];
    if (!adapter) {
        throw new Error(`Адаптер реального времени не найден: "${sourceId}". Зарегистрируйте его в realTimeDataService.js`);
    }
    return await adapter();
};

/**
 * Проверяет, зарегистрирован ли источник.
 * @param {string} sourceId
 * @returns {boolean}
 */
export const hasSource = (sourceId) => Boolean(adapterRegistry[sourceId]);

/**
 * Возвращает список всех зарегистрированных sourceId.
 * @returns {string[]}
 */
export const getRegisteredSources = () => Object.keys(adapterRegistry);
