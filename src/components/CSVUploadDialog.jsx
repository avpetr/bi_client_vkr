import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, Typography, TextField, Alert, LinearProgress, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { processCSVFile, createDatasetFromCSV, saveCustomDataset } from '../services/csvParser';

const CSVUploadDialog = ({ open, onClose, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [datasetName, setDatasetName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleFileChange = async (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setDatasetName(selectedFile.name.replace('.csv', ''));
            setError(null);
            
            // Generate preview
            try {
                setLoading(true);
                const csvData = await processCSVFile(selectedFile);
                setPreview({
                    headers: csvData.headers,
                    rows: csvData.data.slice(0, 5), // Show first 5 rows
                    totalRows: csvData.data.length
                });
            } catch (err) {
                setError(err.message);
                setPreview(null);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Выберите файл для загрузки');
            return;
        }

        if (!datasetName.trim()) {
            setError('Введите название набора данных');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Process CSV file
            const csvData = await processCSVFile(file);

            // Create dataset
            const dataset = createDatasetFromCSV(csvData, datasetName);

            // Save to localStorage
            saveCustomDataset(dataset);

            // Notify parent
            if (onUploadSuccess) {
                onUploadSuccess(dataset);
            }

            // Close dialog
            handleClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setDatasetName('');
        setError(null);
        setPreview(null);
        setLoading(false);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <CloudUploadIcon />
                    <Typography variant="h6">Загрузить CSV файл</Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <Alert severity="info">
                        Загрузите CSV файл с данными (максимум 5MB). Первая строка должна содержать заголовки столбцов.
                    </Alert>

                    {error && (
                        <Alert severity="error" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    <Box>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<CloudUploadIcon />}
                            fullWidth
                            disabled={loading}
                        >
                            {file ? `Файл: ${file.name}` : 'Выбрать CSV файл'}
                            <input
                                type="file"
                                accept=".csv"
                                hidden
                                onChange={handleFileChange}
                            />
                        </Button>
                    </Box>

                    {file && (
                        <TextField
                            label="Название набора данных"
                            value={datasetName}
                            onChange={(e) => setDatasetName(e.target.value)}
                            fullWidth
                            required
                            helperText="Укажите понятное название для вашего набора данных"
                        />
                    )}

                    {loading && <LinearProgress />}

                    {preview && (
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Предпросмотр данных (первые 5 строк из {preview.totalRows}):
                            </Typography>
                            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            {preview.headers.map((header, idx) => (
                                                <TableCell key={idx} sx={{ fontWeight: 'bold', backgroundColor: 'primary.light', color: 'white' }}>
                                                    {header}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {preview.rows.map((row, rowIdx) => (
                                            <TableRow key={rowIdx}>
                                                {preview.headers.map((header, cellIdx) => (
                                                    <TableCell key={cellIdx}>
                                                        {row[header] !== null && row[header] !== undefined 
                                                            ? String(row[header]) 
                                                            : '-'}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} disabled={loading}>
                    Отмена
                </Button>
                <Button
                    onClick={handleUpload}
                    variant="contained"
                    disabled={!file || !datasetName.trim() || loading}
                >
                    Загрузить
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CSVUploadDialog;




