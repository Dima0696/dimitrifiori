import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Upload,
  Visibility,
  Check,
  Edit,
  Save,
  Delete,
  ExpandMore,
  Info,
  Map as MapIcon,
  AutoFixHigh
} from '@mui/icons-material';
import { apiService } from '../lib/apiService';

interface PDFParsingInterattivoProps {
  fornitoreId: number;
  onParsedData: (data: any) => void;
  onClose: () => void;
}

const campiDisponibili = [
  { id: 'quantita', label: 'Quantità', tipo: 'numerico' },
  { id: 'nome', label: 'Nome Articolo', tipo: 'testo' },
  { id: 'prezzo_unitario', label: 'Prezzo Unitario', tipo: 'numerico' },
  { id: 'totale', label: 'Totale Riga', tipo: 'numerico' },
  { id: 'varieta', label: 'Varietà', tipo: 'testo' },
  { id: 'prodotto', label: 'Prodotto', tipo: 'testo' },
  { id: 'gruppo', label: 'Gruppo', tipo: 'testo' },
  { id: 'qualita', label: 'Qualità', tipo: 'testo' },
  { id: 'altezza', label: 'Altezza', tipo: 'testo' },
  { id: 'colore', label: 'Colore', tipo: 'testo' },
  { id: 'provenienza', label: 'Provenienza', tipo: 'testo' },
  { id: 'imballo', label: 'Imballo', tipo: 'numerico' }
];

export default function PDFParsingInterattivo({ fornitoreId, onParsedData, onClose }: PDFParsingInterattivoProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Stato per il PDF caricato
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfStructure, setPdfStructure] = useState<any>(null);
  const [autoParsingAttempt, setAutoParsingAttempt] = useState<any>(null);
  
  // Stato per la mappatura
  const [selectedTable, setSelectedTable] = useState<number>(0);
  const [fieldMapping, setFieldMapping] = useState<any>({});
  const [headerMapping, setHeaderMapping] = useState<any>({});
  const [mappingName, setMappingName] = useState('');
  
  // Stato per mappature salvate
  const [savedMappings, setSavedMappings] = useState<any[]>([]);
  const [showSavedMappings, setShowSavedMappings] = useState(false);
  
  // Stato per anteprima
  const [parsedData, setParsedData] = useState<any>(null);

  useEffect(() => {
    loadSavedMappings();
  }, [fornitoreId]);

  const loadSavedMappings = async () => {
    try {
      const mappings = await apiService.getPDFMappings(fornitoreId);
      setSavedMappings(mappings);
    } catch (error) {
      console.error('Errore caricamento mappature:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      setError('Seleziona un file PDF valido');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.uploadPDF(file, fornitoreId);
      
      setPdfFile(file);
      setPdfStructure(result.pdfStructure);
      setAutoParsingAttempt(result.autoParsingAttempt);
      setActiveStep(1);
      
      console.log('📊 Struttura PDF:', result.pdfStructure);
      console.log('🤖 Tentativo parsing automatico:', result.autoParsingAttempt);
      
    } catch (error) {
      setError('Errore durante il caricamento del PDF');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelection = (tableIndex: number) => {
    setSelectedTable(tableIndex);
    setActiveStep(2);
  };

  const handleFieldMapping = (field: string, columnIndex: number) => {
    setFieldMapping({
      ...fieldMapping,
      [field]: { index: columnIndex }
    });
  };

  const handleHeaderMapping = (field: string, lineIndex: number, regex: string) => {
    setHeaderMapping({
      ...headerMapping,
      [field]: { lineIndex, regex }
    });
  };

  const previewParsing = async () => {
    if (!pdfStructure || !fieldMapping) return;

    setLoading(true);
    try {
      const mapping = {
        table: { index: selectedTable },
        columns: fieldMapping,
        header: headerMapping
      };

      const result = await apiService.parseWithMapping(pdfStructure, mapping);
      setParsedData(result.parsedData);
      setActiveStep(3);
      
    } catch (error) {
      setError('Errore durante l\'anteprima del parsing');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveMapping = async () => {
    if (!mappingName.trim()) {
      setError('Inserisci un nome per la mappatura');
      return;
    }

    try {
      const mapping = {
        table: { index: selectedTable },
        columns: fieldMapping,
        header: headerMapping
      };

      await apiService.savePDFMapping(fornitoreId, mapping, mappingName);
      await loadSavedMappings();
      setMappingName('');
      
    } catch (error) {
      setError('Errore durante il salvataggio della mappatura');
      console.error(error);
    }
  };

  const loadMapping = (mappingData: any) => {
    const mapping = mappingData.mapping;
    setSelectedTable(mapping.table?.index || 0);
    setFieldMapping(mapping.columns || {});
    setHeaderMapping(mapping.header || {});
    setShowSavedMappings(false);
    setActiveStep(2);
  };

  const confirmParsing = () => {
    if (parsedData) {
      onParsedData(parsedData);
      onClose();
    }
  };

  const renderTablePreview = (table: any[], tableIndex: number) => (
    <Card 
      key={tableIndex}
      sx={{ 
        mb: 2, 
        cursor: 'pointer',
        border: selectedTable === tableIndex ? '2px solid #1976d2' : '1px solid #ddd',
        '&:hover': { boxShadow: 3 }
      }}
      onClick={() => handleTableSelection(tableIndex)}
    >
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Tabella {tableIndex + 1} ({table.length} righe)
        </Typography>
        
        {/* Mostra header della tabella */}
        {table[0] && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Colonne identificate:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {table[0].columns.map((col: any, colIndex: number) => (
                <Chip 
                  key={colIndex}
                  label={`Col ${colIndex + 1}: ${col.content.substring(0, 20)}${col.content.length > 20 ? '...' : ''}`}
                  variant="outlined"
                  size="small"
                  color={col.isNumeric ? 'primary' : col.isText ? 'secondary' : 'default'}
                />
              ))}
            </Box>
          </Box>
        )}
        
        {/* Anteprima prime 3 righe */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableBody>
              {table.slice(0, 3).map((row: any, rowIndex: number) => (
                <TableRow key={rowIndex}>
                  {row.columns.map((col: any, colIndex: number) => (
                    <TableCell key={colIndex} sx={{ fontSize: '0.75rem', maxWidth: '100px' }}>
                      {col.content.length > 15 ? `${col.content.substring(0, 15)}...` : col.content}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {table.length > 3 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            ... e altre {table.length - 3} righe
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const renderFieldMapping = () => {
    if (!pdfStructure?.tables[selectedTable]) return null;
    
    const table = pdfStructure.tables[selectedTable];
    const sampleRow = table[0];
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Mappa i Campi alle Colonne
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Seleziona per ogni campo quale colonna contiene il dato corrispondente.
          Ogni colonna mostra un esempio del contenuto trovato.
        </Alert>
        
        <Grid container spacing={2}>
          {campiDisponibili.map((campo) => (
            <Grid item xs={12} md={6} key={campo.id}>
              <FormControl fullWidth>
                <InputLabel>{campo.label}</InputLabel>
                <Select
                  value={fieldMapping[campo.id]?.index ?? ''}
                  label={campo.label}
                  onChange={(e) => handleFieldMapping(campo.id, e.target.value as number)}
                >
                  <MenuItem value="">
                    <em>Non mappare</em>
                  </MenuItem>
                  {sampleRow?.columns.map((col: any, index: number) => (
                    <MenuItem key={index} value={index}>
                      Colonna {index + 1}: {col.content.substring(0, 30)}
                      {col.content.length > 30 ? '...' : ''}
                      {col.isNumeric && <Chip label="Numerico" size="small" sx={{ ml: 1 }} />}
                      {col.isText && <Chip label="Testo" size="small" sx={{ ml: 1 }} />}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          ))}
        </Grid>
        
        {/* Mappatura header opzionale */}
        <Accordion sx={{ mt: 3 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Mappatura Header (Opzionale)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configura l'estrazione di numero fattura, data e totale dalle righe dell'header.
            </Typography>
            
            {['numero_fattura', 'data_fattura', 'totale'].map((field) => (
              <Box key={field} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Riga</InputLabel>
                      <Select
                        value={headerMapping[field]?.lineIndex ?? ''}
                        label="Riga"
                        onChange={(e) => handleHeaderMapping(field, e.target.value as number, headerMapping[field]?.regex || '')}
                      >
                        {pdfStructure?.lines.slice(0, 20).map((line: any, index: number) => (
                          <MenuItem key={index} value={index}>
                            Riga {index + 1}: {line.content.substring(0, 40)}...
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Regex Pattern"
                      placeholder="es: Fattura\s+(\S+)"
                      value={headerMapping[field]?.regex || ''}
                      onChange={(e) => handleHeaderMapping(field, headerMapping[field]?.lineIndex || 0, e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MapIcon />
          Parsing PDF Interattivo
          {savedMappings.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowSavedMappings(true)}
            >
              Carica Mappatura Salvata ({savedMappings.length})
            </Button>
          )}
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ minHeight: '70vh' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Step 1: Upload PDF */}
          <Step>
            <StepLabel>Carica PDF</StepLabel>
            <StepContent>
              <Box sx={{ my: 2 }}>
                <input
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  id="pdf-upload"
                  type="file"
                  onChange={handleFileUpload}
                />
                <label htmlFor="pdf-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<Upload />}
                    disabled={loading}
                  >
                    {loading ? 'Caricamento...' : 'Seleziona PDF'}
                  </Button>
                </label>
                
                {pdfFile && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    File selezionato: {pdfFile.name}
                  </Typography>
                )}
                
                {loading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography variant="body2">Analisi del PDF in corso...</Typography>
                  </Box>
                )}
              </Box>
            </StepContent>
          </Step>
          
          {/* Step 2: Seleziona Tabella */}
          <Step>
            <StepLabel>Seleziona Tabella Dati</StepLabel>
            <StepContent>
              <Box sx={{ my: 2 }}>
                {pdfStructure?.tables?.length === 0 ? (
                  <Alert severity="warning">
                    Nessuna tabella strutturata trovata nel PDF. 
                    Prova con un PDF diverso o contatta il supporto.
                  </Alert>
                ) : (
                  <>
                    <Typography variant="body1" gutterBottom>
                      Sono state trovate {pdfStructure?.tables?.length || 0} tabelle nel PDF.
                      Seleziona quella che contiene gli articoli della fattura:
                    </Typography>
                    
                    {/* Mostra tentativo di parsing automatico se disponibile */}
                    {autoParsingAttempt?.articoli?.length > 0 && (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">
                          Parsing automatico riuscito: {autoParsingAttempt.articoli.length} articoli trovati!
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => {
                            setParsedData(autoParsingAttempt);
                            setActiveStep(3);
                          }}
                          sx={{ mt: 1 }}
                          startIcon={<AutoFixHigh />}
                        >
                          Usa Parsing Automatico
                        </Button>
                      </Alert>
                    )}
                    
                    {pdfStructure?.tables?.map((table: any[], index: number) => 
                      renderTablePreview(table, index)
                    )}
                  </>
                )}
              </Box>
            </StepContent>
          </Step>
          
          {/* Step 3: Mappa Campi */}
          <Step>
            <StepLabel>Mappa Campi</StepLabel>
            <StepContent>
              <Box sx={{ my: 2 }}>
                {renderFieldMapping()}
                
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={previewParsing}
                    disabled={Object.keys(fieldMapping).length === 0 || loading}
                    startIcon={<Visibility />}
                  >
                    {loading ? 'Elaborazione...' : 'Anteprima'}
                  </Button>
                  
                  <TextField
                    size="small"
                    placeholder="Nome mappatura"
                    value={mappingName}
                    onChange={(e) => setMappingName(e.target.value)}
                  />
                  <Button
                    variant="outlined"
                    onClick={saveMapping}
                    disabled={!mappingName.trim()}
                    startIcon={<Save />}
                  >
                    Salva Mappatura
                  </Button>
                </Box>
              </Box>
            </StepContent>
          </Step>
          
          {/* Step 4: Anteprima e Conferma */}
          <Step>
            <StepLabel>Anteprima Risultati</StepLabel>
            <StepContent>
              <Box sx={{ my: 2 }}>
                {parsedData && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Dati Estratti dal PDF
                    </Typography>
                    
                    {/* Header Info */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={4}>
                        <Typography variant="subtitle2">Numero Fattura</Typography>
                        <Typography>{parsedData.numero_fattura || 'Non trovato'}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="subtitle2">Data</Typography>
                        <Typography>{parsedData.data_fattura || 'Non trovata'}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="subtitle2">Totale</Typography>
                        <Typography>{parsedData.totale ? `€ ${parsedData.totale}` : 'Non trovato'}</Typography>
                      </Grid>
                    </Grid>
                    
                    {/* Articoli */}
                    <Typography variant="h6" gutterBottom>
                      Articoli ({parsedData.articoli?.length || 0})
                    </Typography>
                    
                    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Quantità</TableCell>
                            <TableCell>Nome</TableCell>
                            <TableCell>Varietà</TableCell>
                            <TableCell>Prezzo</TableCell>
                            <TableCell>Totale</TableCell>
                            <TableCell>Qualità</TableCell>
                            <TableCell>Colore</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {parsedData.articoli?.map((articolo: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{articolo.quantita}</TableCell>
                              <TableCell>{articolo.nome}</TableCell>
                              <TableCell>{articolo.varieta || articolo.prodotto}</TableCell>
                              <TableCell>€ {articolo.prezzo_unitario}</TableCell>
                              <TableCell>€ {articolo.totale}</TableCell>
                              <TableCell>{articolo.qualita}</TableCell>
                              <TableCell>{articolo.colore}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    <Box sx={{ mt: 3 }}>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={confirmParsing}
                        startIcon={<Check />}
                        size="large"
                      >
                        Conferma e Usa Questi Dati
                      </Button>
                    </Box>
                  </>
                )}
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
      </DialogActions>
      
      {/* Dialog per mappature salvate */}
      <Dialog open={showSavedMappings} onClose={() => setShowSavedMappings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mappature Salvate</DialogTitle>
        <DialogContent>
          <List>
            {savedMappings.map((mapping) => (
              <ListItem key={mapping.id} disablePadding>
                <ListItemButton onClick={() => loadMapping(mapping)}>
                  <ListItemText
                    primary={mapping.name}
                    secondary={`Creata: ${new Date(mapping.created_at).toLocaleDateString()}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSavedMappings(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
} 