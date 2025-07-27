import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, 
  Paper, Stack, Avatar, Grid, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, FormControl, InputLabel, Select, MenuItem,
  LinearProgress, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  TrendingUp as ProfittoIcon, TrendingDown as PerditaIcon,
  AccountBalance as BilanciIcon, Assessment as ReportIcon,
  ShowChart as GraficiIcon, CalendarToday as CalendarIcon,
  ExpandMore as ExpandMoreIcon, FileDownload as ExportIcon,
  MonetizationOn as RicaviIcon, Payment as CostiIcon
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

interface MovimentoContabile {
  id: string;
  data: string;
  descrizione: string;
  categoria: string;
  tipo: 'ricavo' | 'costo';
  importo: number;
  fonte: 'vendite' | 'spese_generali' | 'trasporti' | 'fornitori' | 'altro';
}

interface RiepilogoMensile {
  mese: string;
  ricavi: number;
  costi: number;
  profitto: number;
  margine: number;
}

interface AnalisiCategoria {
  categoria: string;
  importoTotale: number;
  percentuale: number;
  variazione: number;
}

export default function CalcoloProfittiPerditeComplete() {
  const theme = useTheme();
  const [movimenti, setMovimenti] = useState<MovimentoContabile[]>([]);
  const [periodoSelezionato, setPeriodoSelezionato] = useState('2024-01');
  const [tipoAnalisi, setTipoAnalisi] = useState('mensile');

  // Dati mock
  useEffect(() => {
    const movimentiMock: MovimentoContabile[] = [
      // Ricavi
      { id: '1', data: '2024-01-15', descrizione: 'Vendita Fioreria Bella Vista', categoria: 'Vendite Rivenditori', tipo: 'ricavo', importo: 3050.00, fonte: 'vendite' },
      { id: '2', data: '2024-01-20', descrizione: 'Vendita Hotel Palace', categoria: 'Vendite Aziende', tipo: 'ricavo', importo: 2861.21, fonte: 'vendite' },
      { id: '3', data: '2024-01-25', descrizione: 'Vendita privati vari', categoria: 'Vendite Retail', tipo: 'ricavo', importo: 1250.00, fonte: 'vendite' },
      
      // Costi
      { id: '4', data: '2024-01-01', descrizione: 'Affitto magazzino', categoria: 'Affitti', tipo: 'costo', importo: 2500.00, fonte: 'spese_generali' },
      { id: '5', data: '2024-01-15', descrizione: 'Fornitura fiori Vivai Torriani', categoria: 'Acquisti Merce', tipo: 'costo', importo: 1464.00, fonte: 'fornitori' },
      { id: '6', data: '2024-01-31', descrizione: 'Stipendi gennaio', categoria: 'Personale', tipo: 'costo', importo: 8500.00, fonte: 'spese_generali' },
      { id: '7', data: '2024-01-15', descrizione: 'Carburante consegne', categoria: 'Trasporti', tipo: 'costo', importo: 385.50, fonte: 'trasporti' },
      { id: '8', data: '2024-01-15', descrizione: 'Bolletta elettrica', categoria: 'Utenze', tipo: 'costo', importo: 850.50, fonte: 'spese_generali' }
    ];
    setMovimenti(movimentiMock);
  }, []);

  // Calcoli principali
  const totaleRicavi = movimenti
    .filter(m => m.tipo === 'ricavo')
    .reduce((sum, m) => sum + m.importo, 0);

  const totaleCosti = movimenti
    .filter(m => m.tipo === 'costo')
    .reduce((sum, m) => sum + m.importo, 0);

  const profittoNetto = totaleRicavi - totaleCosti;
  const marginePercentuale = totaleRicavi > 0 ? (profittoNetto / totaleRicavi) * 100 : 0;

  // Analisi per categoria - Ricavi
  const ricaviPerCategoria: AnalisiCategoria[] = [];
  const categorieRicavi = [...new Set(movimenti.filter(m => m.tipo === 'ricavo').map(m => m.categoria))];
  categorieRicavi.forEach(categoria => {
    const importo = movimenti
      .filter(m => m.tipo === 'ricavo' && m.categoria === categoria)
      .reduce((sum, m) => sum + m.importo, 0);
    ricaviPerCategoria.push({
      categoria,
      importoTotale: importo,
      percentuale: totaleRicavi > 0 ? (importo / totaleRicavi) * 100 : 0,
      variazione: Math.random() * 20 - 10 // Mock variazione
    });
  });

  // Analisi per categoria - Costi
  const costiPerCategoria: AnalisiCategoria[] = [];
  const categorieCosti = [...new Set(movimenti.filter(m => m.tipo === 'costo').map(m => m.categoria))];
  categorieCosti.forEach(categoria => {
    const importo = movimenti
      .filter(m => m.tipo === 'costo' && m.categoria === categoria)
      .reduce((sum, m) => sum + m.importo, 0);
    costiPerCategoria.push({
      categoria,
      importoTotale: importo,
      percentuale: totaleCosti > 0 ? (importo / totaleCosti) * 100 : 0,
      variazione: Math.random() * 20 - 10 // Mock variazione
    });
  });

  // Riepiloghi mensili (mock)
  const riepiloghiMensili: RiepilogoMensile[] = [
    { mese: '2024-01', ricavi: totaleRicavi, costi: totaleCosti, profitto: profittoNetto, margine: marginePercentuale },
    { mese: '2023-12', ricavi: 6500.00, costi: 12800.00, profitto: -6300.00, margine: -96.9 },
    { mese: '2023-11', ricavi: 8200.00, costi: 13200.00, profitto: -5000.00, margine: -61.0 },
    { mese: '2023-10', ricavi: 9800.00, costi: 14100.00, profitto: -4300.00, margine: -43.9 }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          📊 Calcolo Profitti e Perdite
        </Typography>
        
        {/* Controlli periodo */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Periodo</InputLabel>
            <Select
              value={periodoSelezionato}
              onChange={(e) => setPeriodoSelezionato(e.target.value)}
            >
              <MenuItem value="2024-01">Gennaio 2024</MenuItem>
              <MenuItem value="2023-12">Dicembre 2023</MenuItem>
              <MenuItem value="2023-11">Novembre 2023</MenuItem>
              <MenuItem value="2023">Anno 2023</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Tipo Analisi</InputLabel>
            <Select
              value={tipoAnalisi}
              onChange={(e) => setTipoAnalisi(e.target.value)}
            >
              <MenuItem value="mensile">Mensile</MenuItem>
              <MenuItem value="trimestrale">Trimestrale</MenuItem>
              <MenuItem value="annuale">Annuale</MenuItem>
            </Select>
          </FormControl>
          
          <Button startIcon={<ExportIcon />} variant="outlined">
            Esporta Report
          </Button>
        </Stack>

        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.05)})`,
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
            }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      RICAVI TOTALI
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="success.main">
                      €{totaleRicavi.toLocaleString('it-IT')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <RicaviIcon />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)}, ${alpha(theme.palette.error.main, 0.05)})`,
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
            }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      COSTI TOTALI
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="error.main">
                      €{totaleCosti.toLocaleString('it-IT')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'error.main' }}>
                    <CostiIcon />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${alpha(profittoNetto >= 0 ? theme.palette.primary.main : theme.palette.warning.main, 0.1)}, ${alpha(profittoNetto >= 0 ? theme.palette.primary.main : theme.palette.warning.main, 0.05)})`,
              border: `1px solid ${alpha(profittoNetto >= 0 ? theme.palette.primary.main : theme.palette.warning.main, 0.2)}`
            }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {profittoNetto >= 0 ? 'PROFITTO NETTO' : 'PERDITA NETTA'}
                    </Typography>
                    <Typography 
                      variant="h5" 
                      fontWeight={700} 
                      color={profittoNetto >= 0 ? 'primary.main' : 'warning.main'}
                    >
                      €{Math.abs(profittoNetto).toLocaleString('it-IT')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: profittoNetto >= 0 ? 'primary.main' : 'warning.main' }}>
                    {profittoNetto >= 0 ? <ProfittoIcon /> : <PerditaIcon />}
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.info.main, 0.05)})`,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
            }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      MARGINE %
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="info.main">
                      {marginePercentuale.toFixed(1)}%
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <BilanciIcon />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Alert per situazione finanziaria */}
        {profittoNetto < 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <strong>Attenzione!</strong> Il periodo selezionato mostra una perdita di €{Math.abs(profittoNetto).toLocaleString('it-IT')}. 
            È necessario rivedere i costi o incrementare i ricavi.
          </Alert>
        )}
      </Box>

      {/* Analisi dettagliata */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Ricavi per categoria */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                📈 Ricavi per Categoria
              </Typography>
              <Stack spacing={2}>
                {ricaviPerCategoria.map((categoria) => (
                  <Box key={categoria.categoria}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {categoria.categoria}
                      </Typography>
                      <Stack alignItems="flex-end">
                        <Typography variant="body2" fontWeight={700} color="success.main">
                          €{categoria.importoTotale.toLocaleString('it-IT')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {categoria.percentuale.toFixed(1)}%
                        </Typography>
                      </Stack>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={categoria.percentuale}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: 'success.main',
                          borderRadius: 4
                        }
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Costi per categoria */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                📉 Costi per Categoria
              </Typography>
              <Stack spacing={2}>
                {costiPerCategoria.map((categoria) => (
                  <Box key={categoria.categoria}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {categoria.categoria}
                      </Typography>
                      <Stack alignItems="flex-end">
                        <Typography variant="body2" fontWeight={700} color="error.main">
                          €{categoria.importoTotale.toLocaleString('it-IT')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {categoria.percentuale.toFixed(1)}%
                        </Typography>
                      </Stack>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={categoria.percentuale}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: 'error.main',
                          borderRadius: 4
                        }
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trend mensili */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CalendarIcon />
            <Typography variant="h6" fontWeight={600}>Trend Mensili</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Paper sx={{ overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    <TableCell><strong>Mese</strong></TableCell>
                    <TableCell><strong>Ricavi</strong></TableCell>
                    <TableCell><strong>Costi</strong></TableCell>
                    <TableCell><strong>Risultato</strong></TableCell>
                    <TableCell><strong>Margine %</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {riepiloghiMensili.map((riepilongo) => (
                    <TableRow key={riepilongo.mese} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {new Date(riepilongo.mese + '-01').toLocaleDateString('it-IT', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="success.main" fontWeight={600}>
                          €{riepilongo.ricavi.toLocaleString('it-IT')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="error.main" fontWeight={600}>
                          €{riepilongo.costi.toLocaleString('it-IT')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          fontWeight={700}
                          color={riepilongo.profitto >= 0 ? 'primary.main' : 'warning.main'}
                        >
                          {riepilongo.profitto >= 0 ? '+' : ''}€{riepilongo.profitto.toLocaleString('it-IT')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${riepilongo.margine.toFixed(1)}%`}
                          size="small"
                          color={riepilongo.margine >= 0 ? 'success' : 'error'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </AccordionDetails>
      </Accordion>

      {/* Dettaglio movimenti */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ReportIcon />
            <Typography variant="h6" fontWeight={600}>Dettaglio Movimenti</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Paper sx={{ overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    <TableCell><strong>Data</strong></TableCell>
                    <TableCell><strong>Descrizione</strong></TableCell>
                    <TableCell><strong>Categoria</strong></TableCell>
                    <TableCell><strong>Tipo</strong></TableCell>
                    <TableCell><strong>Importo</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movimenti
                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                    .map((movimento) => (
                    <TableRow key={movimento.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(movimento.data).toLocaleDateString('it-IT')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {movimento.descrizione}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={movimento.categoria} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={movimento.tipo === 'ricavo' ? 'Ricavo' : 'Costo'}
                          size="small"
                          color={movimento.tipo === 'ricavo' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          fontWeight={700}
                          color={movimento.tipo === 'ricavo' ? 'success.main' : 'error.main'}
                        >
                          {movimento.tipo === 'ricavo' ? '+' : '-'}€{movimento.importo.toLocaleString('it-IT')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
} 