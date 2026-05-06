// CSV Parser Service - handles CSV file uploads and parsing

// Parse CSV string to array of objects
export const parseCSV = (csvString) => {
    const lines = csvString.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        throw new Error('CSV файл пуст');
    }
    
    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    // Parse rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                // Try to parse as number
                const value = values[index];
                row[header] = isNaN(value) ? value : parseFloat(value);
            });
            data.push(row);
        }
    }
    
    return { headers, data };
};

// Advanced CSV parser with options
export const parseCSVAdvanced = (csvString, options = {}) => {
    const {
        delimiter = ',',
        hasHeader = true,
        trimValues = true,
        skipEmptyLines = true
    } = options;
    
    let lines = csvString.split('\n');
    
    if (skipEmptyLines) {
        lines = lines.filter(line => line.trim());
    }
    
    if (lines.length === 0) {
        throw new Error('CSV файл пуст');
    }
    
    const parseRow = (line) => {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === delimiter && !inQuotes) {
                values.push(trimValues ? current.trim() : current);
                current = '';
            } else {
                current += char;
            }
        }
        values.push(trimValues ? current.trim() : current);
        
        return values;
    };
    
    const headers = hasHeader ? parseRow(lines[0]) : null;
    const startIndex = hasHeader ? 1 : 0;
    
    const data = [];
    for (let i = startIndex; i < lines.length; i++) {
        const values = parseRow(lines[i]);
        
        if (headers) {
            const row = {};
            headers.forEach((header, index) => {
                const value = values[index] || '';
                // Try to parse as number
                row[header] = isNaN(value) || value === '' ? value : parseFloat(value);
            });
            data.push(row);
        } else {
            data.push(values);
        }
    }
    
    return { headers, data };
};

// Read file as text
export const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            resolve(event.target.result);
        };
        
        reader.onerror = (error) => {
            reject(error);
        };
        
        reader.readAsText(file);
    });
};

// Process CSV file
export const processCSVFile = async (file) => {
    try {
        // Validate file type
        if (!file.name.endsWith('.csv')) {
            throw new Error('Поддерживаются только CSV файлы');
        }
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new Error('Файл слишком большой (максимум 5MB)');
        }
        
        // Read file
        const csvString = await readFileAsText(file);
        
        // Parse CSV
        const { headers, data } = parseCSVAdvanced(csvString);
        
        if (data.length === 0) {
            throw new Error('CSV файл не содержит данных');
        }
        
        return {
            fileName: file.name,
            headers,
            data,
            rowCount: data.length,
            size: file.size
        };
    } catch (error) {
        console.error('Error processing CSV file:', error);
        throw error;
    }
};

// Infer data types from CSV data
export const inferDataTypes = (data, headers) => {
    const types = {};
    
    headers.forEach(header => {
        const values = data.map(row => row[header]).filter(v => v !== null && v !== undefined && v !== '');
        
        if (values.length === 0) {
            types[header] = 'string';
            return;
        }
        
        // Check if all numeric
        const allNumeric = values.every(v => !isNaN(v) && typeof v === 'number');
        if (allNumeric) {
            types[header] = 'number';
            return;
        }
        
        // Check if date
        const datePattern = /^\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/;
        const allDates = values.every(v => datePattern.test(String(v)));
        if (allDates) {
            types[header] = 'date';
            return;
        }
        
        types[header] = 'string';
    });
    
    return types;
};

// Create dataset from CSV data
export const createDatasetFromCSV = (csvData, datasetName) => {
    const { headers, data } = csvData;
    const dataTypes = inferDataTypes(data, headers);
    
    // Determine which columns are metrics (numeric)
    const metrics = headers
        .filter(h => dataTypes[h] === 'number')
        .map((header, idx) => ({
            key: header,
            label: header,
            color: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347'][idx % 7]
        }));
    
    // Find the first string column for x-axis, or use first column
    const xAxisKey = headers.find(h => dataTypes[h] === 'string') || headers[0];
    
    return {
        id: `csv_${Date.now()}`,
        name: datasetName || 'CSV Dataset',
        description: `Загружено из ${csvData.fileName || 'CSV файла'}`,
        data: data,
        metrics: metrics,
        xAxisKey: xAxisKey,
        isCustom: true,
        uploadedAt: new Date().toISOString()
    };
};

// Save custom dataset to localStorage
const CUSTOM_DATASETS_KEY = 'bi_custom_datasets';

export const saveCustomDataset = (dataset) => {
    try {
        const datasets = getCustomDatasets();
        const existingIndex = datasets.findIndex(d => d.id === dataset.id);
        
        if (existingIndex >= 0) {
            datasets[existingIndex] = dataset;
        } else {
            datasets.push(dataset);
        }
        
        localStorage.setItem(CUSTOM_DATASETS_KEY, JSON.stringify(datasets));
        return dataset;
    } catch (error) {
        console.error('Error saving custom dataset:', error);
        throw error;
    }
};

export const getCustomDatasets = () => {
    try {
        const data = localStorage.getItem(CUSTOM_DATASETS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading custom datasets:', error);
        return [];
    }
};

export const deleteCustomDataset = (id) => {
    try {
        const datasets = getCustomDatasets();
        const filtered = datasets.filter(d => d.id !== id);
        localStorage.setItem(CUSTOM_DATASETS_KEY, JSON.stringify(filtered));
        return filtered;
    } catch (error) {
        console.error('Error deleting custom dataset:', error);
        throw error;
    }
};




