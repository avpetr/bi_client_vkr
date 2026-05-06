/**
 * useRealTimeData.js
 *
 * React-хук для получения данных из источника реального времени с автоопросом.
 *
 * Использование:
 *   const { data, loading, error, lastUpdated, refresh, refreshInterval, setRefreshInterval } =
 *     useRealTimeData('weatherMoscow', { interval: 60000 });
 *
 * Параметры:
 *   @param {string|null} sourceId  — ID источника (из realTimeDataService). null отключает хук.
 *   @param {object}      options
 *     interval {number}  — интервал опроса в мс (по умолчанию 60 000)
 *     enabled  {boolean} — можно принудительно отключить опрос (по умолчанию true)
 *
 * Возвращает:
 *   data              {Array|null}  — последние полученные данные
 *   loading           {boolean}    — идёт ли сейчас загрузка
 *   error             {Error|null} — последняя ошибка (или null)
 *   lastUpdated       {Date|null}  — когда данные были обновлены последний раз
 *   refresh           {Function}   — принудительное ручное обновление
 *   refreshInterval   {number}     — текущий интервал в мс
 *   setRefreshInterval{Function}   — изменить интервал на лету
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchFromSource } from '../services/realTimeDataService';

export function useRealTimeData(sourceId, { interval = 60_000, enabled = true } = {}) {
    const [data, setData]               = useState(null);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [refreshInterval, setRefreshInterval] = useState(interval);

    const timerRef     = useRef(null);
    const mountedRef   = useRef(true);

    // Синхронизируем внешний interval → внутренний state (при изменении пропа)
    useEffect(() => {
        setRefreshInterval(interval);
    }, [interval]);

    const doFetch = useCallback(async () => {
        if (!sourceId || !enabled) return;
        setLoading(true);
        try {
            const result = await fetchFromSource(sourceId);
            if (!mountedRef.current) return;
            setData(result);
            setLastUpdated(new Date());
            setError(null);
        } catch (err) {
            if (!mountedRef.current) return;
            setError(err);
            console.error(`[useRealTimeData] Ошибка получения данных из "${sourceId}":`, err);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [sourceId, enabled]);

    // Запускаем/перезапускаем таймер при изменении интервала, источника, enabled
    useEffect(() => {
        mountedRef.current = true;

        if (!sourceId || !enabled) {
            setData(null);
            setError(null);
            return;
        }

        // Немедленный первый запрос
        doFetch();

        // Периодический опрос
        timerRef.current = setInterval(doFetch, refreshInterval);

        return () => {
            clearInterval(timerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sourceId, enabled, refreshInterval]);

    // Cleanup при размонтировании
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            clearInterval(timerRef.current);
        };
    }, []);

    return {
        data,
        loading,
        error,
        lastUpdated,
        refresh: doFetch,
        refreshInterval,
        setRefreshInterval,
    };
}
