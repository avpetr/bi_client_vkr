/**
 * filterApplicator.js
 *
 * Применение фильтров дашборда к данным виджетов.
 *
 * Семантика:
 *   • между разными фильтрами — AND (все должны выполняться)
 *   • внутри одного фильтра с несколькими колонками — OR (хотя бы одна колонка проходит)
 *   • фильтр применяется только к виджету с совпадающим datasetId
 */

const lc = (v) => String(v ?? '').toLowerCase();

const matchesCell = (cellValue, operator, value, valueTo, type) => {
    if (value === undefined || value === null || value === '') return true;
    if (cellValue === undefined || cellValue === null)         return false;

    if (type === 'number') {
        const v  = parseFloat(value);
        const v2 = parseFloat(valueTo);
        const c  = parseFloat(cellValue);
        if (isNaN(v) || isNaN(c)) return false;

        switch (operator) {
            case 'equals':          return c === v;
            case 'notEquals':       return c !== v;
            case 'greaterThan':     return c >  v;
            case 'lessThan':        return c <  v;
            case 'greaterOrEqual':  return c >= v;
            case 'lessOrEqual':     return c <= v;
            case 'between':         return !isNaN(v2) && c >= Math.min(v, v2) && c <= Math.max(v, v2);
            default:                return true;
        }
    }

    const c = lc(cellValue);
    const v = lc(value);
    switch (operator) {
        case 'equals':      return c === v;
        case 'notEquals':   return c !== v;
        case 'contains':    return c.includes(v);
        case 'startsWith':  return c.startsWith(v);
        case 'endsWith':    return c.endsWith(v);
        default:            return true;
    }
};

const rowMatchesFilter = (row, filter) => {
    // OR между колонками одного фильтра
    return filter.columns.some(col =>
        matchesCell(row[col.name], filter.operator, filter.value, filter.valueTo, col.type)
    );
};

/**
 * Применяет все фильтры, относящиеся к датасету виджета.
 */
export const applyFilters = (data, filters, datasetId) => {
    if (!filters || !data?.length) return data;
    const relevant = Object.values(filters).filter(f => f.dataset === datasetId);
    if (relevant.length === 0) return data;
    return data.filter(row => relevant.every(f => rowMatchesFilter(row, f)));
};

/**
 * Возвращает массив фильтров, влияющих на конкретный виджет (по datasetId).
 */
export const filtersAffectingWidget = (filters, datasetId) => {
    if (!filters) return [];
    return Object.values(filters).filter(f => f.dataset === datasetId);
};

/**
 * Сколько виджетов на дашборде затрагивает данный фильтр.
 */
export const countWidgetsAffected = (filter, widgets) =>
    (widgets || []).filter(w => w.datasetId === filter.dataset).length;
