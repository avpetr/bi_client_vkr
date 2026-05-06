/**
 * Column Type Manager
 * Handles column type detection, conversion, and date parsing
 */

// Available column types
export const COLUMN_TYPES = {
    STRING: 'string',
    NUMBER: 'number',
    DATE: 'date',
    BOOLEAN: 'boolean',
    CATEGORICAL: 'categorical'
};

// Store column type overrides
const COLUMN_TYPES_KEY = 'bi_column_types';

// Get column type overrides from localStorage
export const getColumnTypes = () => {
    try {
        const stored = localStorage.getItem(COLUMN_TYPES_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error('Error loading column types:', error);
        return {};
    }
};

// Save column type override
export const saveColumnType = (datasetId, columnName, type) => {
    try {
        const columnTypes = getColumnTypes();
        if (!columnTypes[datasetId]) {
            columnTypes[datasetId] = {};
        }
        columnTypes[datasetId][columnName] = type;
        localStorage.setItem(COLUMN_TYPES_KEY, JSON.stringify(columnTypes));
        return true;
    } catch (error) {
        console.error('Error saving column type:', error);
        return false;
    }
};

// Get column type for a specific column
export const getColumnType = (datasetId, columnName, defaultType = COLUMN_TYPES.STRING) => {
    const columnTypes = getColumnTypes();
    return columnTypes[datasetId]?.[columnName] || defaultType;
};

// Auto-detect column type from data
export const detectColumnType = (values) => {
    if (!values || values.length === 0) return COLUMN_TYPES.STRING;
    
    const sampleValues = values.slice(0, Math.min(100, values.length)).filter(v => v != null && v !== '');
    if (sampleValues.length === 0) return COLUMN_TYPES.STRING;
    
    // Check for boolean
    const booleanValues = sampleValues.filter(v => 
        typeof v === 'boolean' || 
        (typeof v === 'string' && ['true', 'false', 'yes', 'no', '1', '0'].includes(v.toLowerCase()))
    );
    if (booleanValues.length === sampleValues.length) {
        return COLUMN_TYPES.BOOLEAN;
    }
    
    // Check for number
    const numericValues = sampleValues.filter(v => {
        const num = Number(v);
        return !isNaN(num) && isFinite(num);
    });
    if (numericValues.length / sampleValues.length > 0.8) {
        return COLUMN_TYPES.NUMBER;
    }
    
    // Check for date
    const dateValues = sampleValues.filter(v => {
        const date = parseDate(v);
        return date !== null;
    });
    if (dateValues.length / sampleValues.length > 0.8) {
        return COLUMN_TYPES.DATE;
    }
    
    // Check for categorical (limited unique values)
    const uniqueValues = new Set(sampleValues);
    if (uniqueValues.size < Math.min(20, sampleValues.length / 2)) {
        return COLUMN_TYPES.CATEGORICAL;
    }
    
    return COLUMN_TYPES.STRING;
};

// Intelligent date parsing
export const parseDate = (value) => {
    if (!value) return null;
    
    try {
        // Try native Date parsing
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date;
        }
        
        // Try common date formats
        const formats = [
            // ISO formats
            /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
            /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
            
            // Common formats
            /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY or MM/DD/YYYY
            /^\d{2}-\d{2}-\d{4}$/,   // DD-MM-YYYY or MM-DD-YYYY
            /^\d{2}\.\d{2}\.\d{4}$/, // DD.MM.YYYY
            
            // With time
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO with time
            /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/, // YYYY-MM-DD HH:MM:SS
        ];
        
        const strValue = String(value).trim();
        
        for (const format of formats) {
            if (format.test(strValue)) {
                const parsed = new Date(strValue);
                if (!isNaN(parsed.getTime())) {
                    return parsed;
                }
            }
        }
        
        // Try timestamp
        const timestamp = Number(value);
        if (!isNaN(timestamp) && timestamp > 0) {
            // Check if it's milliseconds or seconds
            const date = new Date(timestamp > 10000000000 ? timestamp : timestamp * 1000);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        
        return null;
    } catch (error) {
        return null;
    }
};

// Convert column data to specified type
export const convertColumnData = (data, columnName, targetType) => {
    const results = {
        success: true,
        convertedData: [],
        errors: [],
        warnings: []
    };
    
    try {
        results.convertedData = data.map((row, index) => {
            const value = row[columnName];
            let convertedValue = value;
            
            try {
                switch (targetType) {
                    case COLUMN_TYPES.NUMBER:
                        convertedValue = convertToNumber(value);
                        if (convertedValue === null && value != null && value !== '') {
                            results.errors.push({
                                row: index,
                                value: value,
                                message: `Cannot convert "${value}" to number`
                            });
                        }
                        break;
                        
                    case COLUMN_TYPES.DATE:
                        convertedValue = parseDate(value);
                        if (convertedValue === null && value != null && value !== '') {
                            results.errors.push({
                                row: index,
                                value: value,
                                message: `Cannot parse "${value}" as date`
                            });
                        }
                        break;
                        
                    case COLUMN_TYPES.BOOLEAN:
                        convertedValue = convertToBoolean(value);
                        break;
                        
                    case COLUMN_TYPES.STRING:
                    case COLUMN_TYPES.CATEGORICAL:
                        convertedValue = String(value);
                        break;
                        
                    default:
                        convertedValue = value;
                }
            } catch (error) {
                results.errors.push({
                    row: index,
                    value: value,
                    message: error.message
                });
                convertedValue = value; // Keep original on error
            }
            
            return { ...row, [columnName]: convertedValue };
        });
        
        if (results.errors.length > 0) {
            results.success = false;
            results.warnings.push(`${results.errors.length} value(s) could not be converted`);
        }
        
    } catch (error) {
        results.success = false;
        results.errors.push({ message: error.message });
        results.convertedData = data; // Return original data on error
    }
    
    return results;
};

// Helper: Convert to number
const convertToNumber = (value) => {
    if (value == null || value === '') return null;
    
    // Remove common number formatting
    const cleaned = String(value)
        .replace(/,/g, '') // Remove commas
        .replace(/\s/g, '') // Remove spaces
        .trim();
    
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
};

// Helper: Convert to boolean
const convertToBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (value == null || value === '') return null;
    
    const str = String(value).toLowerCase().trim();
    if (['true', 'yes', '1', 'on'].includes(str)) return true;
    if (['false', 'no', '0', 'off'].includes(str)) return false;
    
    return null;
};

// Get unique values for categorical columns
export const getUniqueValues = (data, columnName, maxValues = 100) => {
    const values = data
        .map(row => row[columnName])
        .filter(v => v != null && v !== '');
    
    const unique = [...new Set(values)].slice(0, maxValues);
    return unique.sort();
};

// Get numeric range for a column
export const getNumericRange = (data, columnName) => {
    const values = data
        .map(row => {
            const val = row[columnName];
            return typeof val === 'number' ? val : convertToNumber(val);
        })
        .filter(v => v !== null && !isNaN(v));
    
    if (values.length === 0) {
        return { min: 0, max: 100 };
    }
    
    return {
        min: Math.min(...values),
        max: Math.max(...values)
    };
};

// Get date range for a column
export const getDateRange = (data, columnName) => {
    const dates = data
        .map(row => parseDate(row[columnName]))
        .filter(d => d !== null);
    
    if (dates.length === 0) {
        const now = new Date();
        return {
            min: new Date(now.getFullYear(), 0, 1),
            max: new Date(now.getFullYear(), 11, 31)
        };
    }
    
    return {
        min: new Date(Math.min(...dates.map(d => d.getTime()))),
        max: new Date(Math.max(...dates.map(d => d.getTime())))
    };
};

// Validate column type conversion
export const validateTypeConversion = (data, columnName, targetType) => {
    const sampleSize = Math.min(100, data.length);
    const sample = data.slice(0, sampleSize);
    
    let successCount = 0;
    const errors = [];
    
    sample.forEach((row, index) => {
        const value = row[columnName];
        if (value == null || value === '') {
            return; // Skip null/empty values
        }
        
        try {
            let converted;
            switch (targetType) {
                case COLUMN_TYPES.NUMBER:
                    converted = convertToNumber(value);
                    break;
                case COLUMN_TYPES.DATE:
                    converted = parseDate(value);
                    break;
                case COLUMN_TYPES.BOOLEAN:
                    converted = convertToBoolean(value);
                    break;
                default:
                    converted = value;
            }
            
            if (converted !== null) {
                successCount++;
            } else {
                errors.push({ row: index, value });
            }
        } catch (error) {
            errors.push({ row: index, value, error: error.message });
        }
    });
    
    const successRate = successCount / sample.filter(r => r[columnName] != null && r[columnName] !== '').length;
    
    return {
        canConvert: successRate > 0.8,
        successRate,
        errors: errors.slice(0, 10), // Return first 10 errors
        message: successRate > 0.8 
            ? `${Math.round(successRate * 100)}% of values can be converted`
            : `Only ${Math.round(successRate * 100)}% of values can be converted. This may cause data loss.`
    };
};




