/**
 * formulaEvaluator.js
 *
 * Движок вычисляемых метрик для BI-дашборда.
 *
 * Поддерживаемый синтаксис:
 *   Арифметика:  +  -  *  /  %  **  ( )
 *   Сравнения:   >  <  >=  <=  ==  !=
 *   Логика:      &&  ||  !
 *   Функции:     round(x, d)  abs(x)  min(a,b)  max(a,b)  sqrt(x)
 *                floor(x)  ceil(x)  log(x)  pow(b,e)  clamp(x,lo,hi)
 *   Условие:     IF(условие, если_да, если_нет)
 *   Нормировка:  PERCENT(поле)  — % от суммы по всему датасету
 *   Агрегация:   SUM(поле)  AVG(поле)  MAXV(поле)  MINV(поле)  — по всему датасету
 *
 * Пример формул:
 *   profit / revenue * 100
 *   round(sales / 1000, 1)
 *   IF(profit > 0, profit, 0)
 *   PERCENT(sales)
 *   (revenue - costs) / revenue * 100
 */

// ─── Функции доступные в формулах ─────────────────────────────────────────────

const SAFE_MATH = {
    round:  (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d,
    abs:    Math.abs,
    min:    Math.min,
    max:    Math.max,
    sqrt:   Math.sqrt,
    log:    Math.log,
    pow:    Math.pow,
    floor:  Math.floor,
    ceil:   Math.ceil,
    clamp:  (x, lo, hi) => Math.min(Math.max(x, lo), hi),
    IF:     (cond, a, b) => (cond ? a : b),
};

// ─── Вычисление одной формулы для одной строки ────────────────────────────────

/**
 * Вычисляет формулу для одной строки данных.
 * @param {string} formula   — формула, напр. "profit / revenue * 100"
 * @param {object} row       — одна запись данных, напр. { name:'Янв', profit:1000, revenue:5000 }
 * @param {object} aggregate — заранее вычисленные агрегаты { SUM_sales, AVG_profit, … }
 * @returns {number|null}
 */
export const evaluateFormula = (formula, row, aggregate = {}) => {
    try {
        const rowKeys    = Object.keys(row);
        const rowVals    = rowKeys.map(k => (typeof row[k] === 'number' ? row[k] : 0));
        const mathKeys   = Object.keys(SAFE_MATH);
        const mathVals   = Object.values(SAFE_MATH);
        const aggKeys    = Object.keys(aggregate);
        const aggVals    = aggKeys.map(k => aggregate[k]);

        // eslint-disable-next-line no-new-func
        const fn = new Function(
            ...rowKeys,
            ...mathKeys,
            ...aggKeys,
            `"use strict"; return (${formula});`
        );

        const result = fn(...rowVals, ...mathVals, ...aggVals);
        return typeof result === 'number' && isFinite(result)
            ? parseFloat(result.toFixed(6))
            : result ?? null;
    } catch {
        return null;
    }
};

// ─── Предварительное вычисление агрегатов для датасета ───────────────────────

const buildAggregate = (data, formula) => {
    if (!data?.length) return {};
    const agg = {};
    const sample = data[0];
    const numericKeys = Object.keys(sample).filter(k => typeof sample[k] === 'number');

    for (const key of numericKeys) {
        const vals = data.map(r => r[key] ?? 0);
        const sum  = vals.reduce((a, b) => a + b, 0);
        agg[`SUM`]  = (field) => data.reduce((s, r) => s + (r[field] ?? 0), 0);
        agg[`AVG`]  = (field) => data.reduce((s, r) => s + (r[field] ?? 0), 0) / data.length;
        agg[`MAXV`] = (field) => Math.max(...data.map(r => r[field] ?? 0));
        agg[`MINV`] = (field) => Math.min(...data.map(r => r[field] ?? 0));
        agg[`PERCENT`] = (field) => {
            const total = data.reduce((s, r) => s + (r[field] ?? 0), 0);
            return total; // возвращаем total; строка сама делит себя на него
        };
        break; // достаточно одного прохода — функции одинаковые
    }
    return agg;
};

// ─── Применение вычисляемых метрик ко всему датасету ─────────────────────────

/**
 * Добавляет вычисляемые поля к каждой строке датасета.
 * @param {Array}  data               — исходные данные
 * @param {Array}  calculatedMetrics  — [{key, label, formula, color}]
 * @returns {Array} новый массив с добавленными полями
 */
export const applyCalculatedMetrics = (data, calculatedMetrics) => {
    if (!calculatedMetrics?.length || !data?.length) return data;

    const agg = buildAggregate(data);

    return data.map(row => {
        const newRow = { ...row };
        for (const cm of calculatedMetrics) {
            if (!cm.formula?.trim()) continue;
            newRow[cm.key] = evaluateFormula(cm.formula, newRow, agg);
        }
        return newRow;
    });
};

// ─── Тестирование формулы (возвращает превью для первой строки) ───────────────

/**
 * Быстрая проверка формулы: возвращает { ok, value, error }.
 */
export const testFormula = (formula, data) => {
    if (!formula?.trim()) return { ok: false, error: 'Формула пустая' };
    if (!data?.length)    return { ok: false, error: 'Нет данных для теста' };

    const agg = buildAggregate(data);
    try {
        const value = evaluateFormula(formula, data[0], agg);
        if (value === null) return { ok: false, error: 'Результат не является числом' };
        return { ok: true, value };
    } catch (e) {
        return { ok: false, error: e.message };
    }
};

// ─── Список доступных функций для подсказок в редакторе ──────────────────────

export const FORMULA_FUNCTIONS = [
    { fn: 'round(x, 2)',      desc: 'Округление до N знаков' },
    { fn: 'abs(x)',           desc: 'Модуль числа' },
    { fn: 'sqrt(x)',          desc: 'Квадратный корень' },
    { fn: 'pow(x, 2)',        desc: 'Возведение в степень' },
    { fn: 'min(a, b)',        desc: 'Минимум из двух значений' },
    { fn: 'max(a, b)',        desc: 'Максимум из двух значений' },
    { fn: 'clamp(x, 0, 100)', desc: 'Ограничить диапазон' },
    { fn: 'floor(x)',         desc: 'Округление вниз' },
    { fn: 'ceil(x)',          desc: 'Округление вверх' },
    { fn: 'IF(x > 0, x, 0)', desc: 'Условное выражение' },
    { fn: 'SUM("поле")',      desc: 'Сумма поля по датасету' },
    { fn: 'AVG("поле")',      desc: 'Среднее поля по датасету' },
    { fn: 'MAXV("поле")',     desc: 'Максимум поля по датасету' },
    { fn: 'MINV("поле")',     desc: 'Минимум поля по датасету' },
];
