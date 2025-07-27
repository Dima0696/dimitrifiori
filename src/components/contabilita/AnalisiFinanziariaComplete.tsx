import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, 
  Paper, Stack, Avatar, Grid, FormControl, InputLabel, Select,
  MenuItem, Alert, Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, LinearProgress, Divider
} from '@mui/material';
import {
  ShowChart as GraficiIcon, TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon, Assessment as AnalisiIcon,
  BarChart as BarChartIcon, PieChart as PieChartIcon,
  Timeline as TimelineIcon, ExpandMore as ExpandMoreIcon,
  FileDownload as ExportIcon, Refresh as RefreshIcon,
  CompareArrows as CompareIcon, AccountBalance as FinanceIcon
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

interface DatiFinanziari {
  periodo: string;
  ricavi: number;
  costi: number;
  profitto: number;
  margine: number;
  liquidita: number;
  crediti: number;
  debiti: number;
}

interface IndicatoreKPI {
  nome: string;
  valore: number;
  unita: string;
  variazione: number;
  target?: number;
  categoria: 'redditività' | 'liquidità' | 'efficienza' | 'crescita';
}

interface PrevisionaleBudget {
  categoria: string;
  budgetPrevisto: number;
  effettivo: number;
  scostamento: number;
  percentualeRealizzazione: number;
}

export default function AnalisiFinanziariaComplete() {
  const theme = useTheme();
  const [periodoAnalisi, setPeriodoAnalisi] = useState('mensile');
  const [tipoGrafico, setTipoGrafico] = useState('trend');
  const [datiFinanziari, setDatiFinanziari] = useState<DatiFinanziari[]>([]);
  const [indicatoriKPI, setIndicatoriKPI] = useState<IndicatoreKPI[]>([]);
  const [budgetAnalisi, setBudgetAnalisi] = useState<PrevisionaleBudget[]>([]);

  // Dati mock iniziali
  useEffect(() => {
    const datiMock: DatiFinanziari[] = [
      {
        periodo: '2024-01',
        ricavi: 28750.00,
        costi: 15420.50,
        profitto: 13329.50,
        margine: 46.3,
        liquidita: 25000.00,
        crediti: 8500.00,
        debiti: 12300.00
      },
      {
        periodo: '2023-12',
        ricavi: 22300.00,
        costi: 18900.00,
        profitto: 3400.00,
        margine: 15.2,
        liquidita: 18500.00,
        crediti: 12000.00,
        debiti: 15600.00
      },
      {
        periodo: '2023-11',
        ricavi: 19800.00,
        costi: 17200.00,
        profitto: 2600.00,
        margine: 13.1,
        liquidita: 15200.00,
        crediti: 9800.00,
        debiti: 16800.00
      },
      {
        periodo: '2023-10',
        ricavi: 24500.00,
        costi: 19100.00,
        profitto: 5400.00,
        margine: 22.0,
        liquidita: 21000.00,
        crediti: 11200.00,
        debiti: 14500.00
      },
      {
        periodo: '2023-09',
        ricavi: 27100.00,
        costi: 20800.00,
        profitto: 6300.00,
        margine: 23.2,
        liquidita: 19800.00,
        crediti: 13500.00,
        debiti: 17200.00
      },
      {
        periodo: '2023-08',
        ricavi: 31200.00,
        costi: 22400.00,
        profitto: 8800.00,
        margine: 28.2,
        liquidita: 24300.00,
        crediti: 15800.00,
        debiti: 19100.00
      }
    ];

    const kpiMock: IndicatoreKPI[] = [
      {
        nome: 'ROI',
        valore: 18.5,
        unita: '%',
        variazione: 12.3,
        target: 15.0,
        categoria: 'redditività'
      },
      {
        nome: 'Margine Lordo',
        valore: 46.3,
        unita: '%',
        variazione: 8.7,
        target: 40.0,
        categoria: 'redditività'
      },
      {
        nome: 'Liquidità Corrente',
        valore: 2.1,
        unita: 'ratio',
        variazione: 15.2,
        target: 1.5,
        categoria: 'liquidità'
      },
      {
        nome: 'Giorni Incasso Crediti',
        valore: 28,
        unita: 'giorni',
        variazione: -5.2,
        target: 30,
        categoria: 'efficienza'
      },
      {
        nome: 'Crescita Ricavi',
        valore: 28.9,
        unita: '%',
        variazione: 22.1,
        target: 20.0,
        categoria: 'crescita'
      },
      {
        nome: 'Rotazione Magazzino',
        valore: 8.2,
        unita: 'volte/anno',
        variazione: 3.8,
        target: 6.0,
        categoria: 'efficienza'
      }
    ];

    const budgetMock: PrevisionaleBudget[] = [
      {
        categoria: 'Ricavi Vendite',
        budgetPrevisto: 25000.00,
        effettivo: 28750.00,
        scostamento: 3750.00,
        percentualeRealizzazione: 115.0
      },
      {
        categoria: 'Costi Merce',
        budgetPrevisto: 12000.00,
        effettivo: 8420.50,
        scostamento: -3579.50,
        percentualeRealizzazione: 70.2
      },
      {
        categoria: 'Spese Personale',
        budgetPrevisto: 8500.00,
        effettivo: 8500.00,
        scostamento: 0,
        percentualeRealizzazione: 100.0
      },
      {
        categoria: 'Spese Generali',
        budgetPrevisto: 4200.00,
        effettivo: 5200.00,
        scostamento: 1000.00,
        percentualeRealizzazione: 123.8
      },
      {
        categoria: 'Marketing',
        budgetPrevisto: 2000.00,
        effettivo: 1500.00,
        scostamento: -500.00,
        percentualeRealizzazione: 75.0
      }
    ];

    setDatiFinanziari(datiMock);
    setIndicatoriKPI(kpiMock);
    setBudgetAnalisi(budgetMock);
  }, []);

  // Calcoli analisi
  const periodoCorrente = datiFinanziari[0];
  const periodoPrecedente = datiFinanziari[1];
  
  const variazioneProfitto = periodoPrecedente ? 
    ((periodoCorrente.profitto - periodoPrecedente.profitto) / periodoPrecedente.profitto) * 100 : 0;
  
  const variazioneRicavi = periodoPrecedente ? 
    ((periodoCorrente.ricavi - periodoPrecedente.ricavi) / periodoPrecedente.ricavi) * 100 : 0;

  // Categorizzazione KPI
  const kpiPerCategoria = {
    redditività: indicatoriKPI.filter(kpi => kpi.categoria === 'redditività'),
    liquidità: indicatoriKPI.filter(kpi => kpi.categoria === 'liquidità'),
    efficienza: indicatoriKPI.filter(kpi => kpi.categoria === 'efficienza'),
    crescita: indicatoriKPI.filter(kpi => kpi.categoria === 'crescita')
  };

  // Simulazione grafici (normalmente useresti una libreria come Chart.js o Recharts)
  const SimulaGrafico = ({ tipo, title }: { tipo: string, title: string }) => (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {title}
        </Typography>
        <Box 
          sx={{ 
            height: 200, 
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}
        >
          <GraficiIcon sx={{ fontSize: 48, color: alpha(theme.palette.primary.main, 0.5), mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Grafico {tipo} - {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Integrazione con libreria grafici
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          📊 Analisi Finanziaria Avanzata
        </Typography>
        
        {/* Controlli */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Periodo</InputLabel>
            <Select
              value={periodoAnalisi}
              onChange={(e) => setPeriodoAnalisi(e.target.value)}
            >
              <MenuItem value="mensile">Mensile</MenuItem>
              <MenuItem value="trimestrale">Trimestrale</MenuItem>
              <MenuItem value="annuale">Annuale</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Tipo Grafico</InputLabel>
            <Select
              value={tipoGrafico}
              onChange={(e) => setTipoGrafico(e.target.value)}
            >
              <MenuItem value="trend">Trend</MenuItem>
              <MenuItem value="comparativo">Comparativo</MenuItem>
              <MenuItem value="budget">Budget vs Effettivo</MenuItem>
            </Select>
          </FormControl>
          
          <Button startIcon={<RefreshIcon />} variant="outlined">
            Aggiorna Dati
          </Button>
          
          <Button startIcon={<ExportIcon />} variant="outlined">
            Esporta Report
          </Button>
        </Stack>

        {/* KPI Principali */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.05)})`,
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
            }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      PROFITTO CORRENTE
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="success.main">
                      €{periodoCorrente?.profitto.toLocaleString('it-IT')}
                    </Typography>
                    <Typography variant="caption" color={variazioneProfitto >= 0 ? 'success.main' : 'error.main'}>
                      {variazioneProfitto >= 0 ? '+' : ''}{variazioneProfitto.toFixed(1)}% vs precedente
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    {variazioneProfitto >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)})`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
            }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      MARGINE %
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="primary.main">
                      {periodoCorrente?.margine.toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Target: 40%
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <AnalisiIcon />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.info.main, 0.05)})`,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
            }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      LIQUIDITÀ
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="info.main">
                      €{periodoCorrente?.liquidita.toLocaleString('it-IT')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Crediti: €{periodoCorrente?.crediti.toLocaleString('it-IT')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <FinanceIcon />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)}, ${alpha(theme.palette.warning.main, 0.05)})`,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
            }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      CRESCITA RICAVI
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="warning.main">
                      {variazioneRicavi.toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      vs mese precedente
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <TrendingUpIcon />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Grafici principali */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} md={8}>
          <SimulaGrafico tipo="lineare" title="Trend Ricavi e Profitti (6 mesi)" />
        </Grid>
        <Grid xs={12} md={4}>
          <SimulaGrafico tipo="torta" title="Composizione Costi" />
        </Grid>
      </Grid>

      {/* Indicatori KPI per categoria */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Object.entries(kpiPerCategoria).map(([categoria, kpis]) => (
          <Grid xs={12} md={6} key={categoria}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ textTransform: 'capitalize' }}>
                  📈 {categoria.replace('à', 'a')}
                </Typography>
                <Stack spacing={2}>
                  {kpis.map((kpi) => (
                    <Box key={kpi.nome}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {kpi.nome}
                        </Typography>
                        <Stack alignItems="flex-end">
                          <Typography variant="h6" fontWeight={700} color="primary.main">
                            {kpi.valore}{kpi.unita}
                          </Typography>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography 
                              variant="caption" 
                              color={kpi.variazione >= 0 ? 'success.main' : 'error.main'}
                            >
                              {kpi.variazione >= 0 ? '+' : ''}{kpi.variazione.toFixed(1)}%
                            </Typography>
                            {kpi.variazione >= 0 ? 
                              <TrendingUpIcon fontSize="small" color="success" /> : 
                              <TrendingDownIcon fontSize="small" color="error" />
                            }
                          </Stack>
                        </Stack>
                      </Stack>
                      
                      {kpi.target && (
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((kpi.valore / kpi.target) * 100, 100)}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              bgcolor: kpi.valore >= kpi.target ? 'success.main' : 'primary.main',
                              borderRadius: 3
                            }
                          }}
                        />
                      )}
                      
                      {kpi.target && (
                        <Typography variant="caption" color="text.secondary">
                          Target: {kpi.target}{kpi.unita} 
                          {kpi.valore >= kpi.target ? ' ✅ Raggiunto' : ` (${((kpi.valore / kpi.target) * 100).toFixed(0)}%)`}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Analisi Budget vs Effettivo */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CompareIcon />
            <Typography variant="h6" fontWeight={600}>Analisi Budget vs Effettivo</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Paper sx={{ overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                    <TableCell><strong>Categoria</strong></TableCell>
                    <TableCell><strong>Budget Previsto</strong></TableCell>
                    <TableCell><strong>Effettivo</strong></TableCell>
                    <TableCell><strong>Scostamento</strong></TableCell>
                    <TableCell><strong>% Realizzazione</strong></TableCell>
                    <TableCell><strong>Performance</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {budgetAnalisi.map((item) => (
                    <TableRow key={item.categoria} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {item.categoria}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          €{item.budgetPrevisto.toLocaleString('it-IT')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          €{item.effettivo.toLocaleString('it-IT')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          fontWeight={700}
                          color={item.scostamento >= 0 ? 
                            (item.categoria.includes('Ricavi') ? 'success.main' : 'error.main') :
                            (item.categoria.includes('Ricavi') ? 'error.main' : 'success.main')
                          }
                        >
                          {item.scostamento >= 0 ? '+' : ''}€{item.scostamento.toLocaleString('it-IT')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {item.percentualeRealizzazione.toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            item.categoria.includes('Ricavi') ? 
                              (item.percentualeRealizzazione >= 100 ? 'Superato' : 'Sotto target') :
                              (item.percentualeRealizzazione <= 100 ? 'Sotto budget' : 'Sforato')
                          }
                          size="small"
                          color={
                            item.categoria.includes('Ricavi') ? 
                              (item.percentualeRealizzazione >= 100 ? 'success' : 'warning') :
                              (item.percentualeRealizzazione <= 100 ? 'success' : 'error')
                          }
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

      {/* Trend storico */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <TimelineIcon />
            <Typography variant="h6" fontWeight={600}>Trend Storico Performance</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Paper sx={{ overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    <TableCell><strong>Periodo</strong></TableCell>
                    <TableCell><strong>Ricavi</strong></TableCell>
                    <TableCell><strong>Costi</strong></TableCell>
                    <TableCell><strong>Profitto</strong></TableCell>
                    <TableCell><strong>Margine %</strong></TableCell>
                    <TableCell><strong>Liquidità</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datiFinanziari.map((dato) => (
                    <TableRow key={dato.periodo} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {new Date(dato.periodo + '-01').toLocaleDateString('it-IT', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="success.main" fontWeight={600}>
                          €{dato.ricavi.toLocaleString('it-IT')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="error.main" fontWeight={600}>
                          €{dato.costi.toLocaleString('it-IT')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          fontWeight={700}
                          color={dato.profitto >= 0 ? 'primary.main' : 'warning.main'}
                        >
                          €{dato.profitto.toLocaleString('it-IT')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${dato.margine.toFixed(1)}%`}
                          size="small"
                          color={dato.margine >= 30 ? 'success' : dato.margine >= 15 ? 'warning' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="info.main" fontWeight={600}>
                          €{dato.liquidita.toLocaleString('it-IT')}
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

      {/* Raccomandazioni automatiche */}
      <Card sx={{ 
        background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)}, ${alpha(theme.palette.warning.main, 0.05)})`,
        border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
      }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            🎯 Raccomandazioni Strategiche
          </Typography>
          
          <Stack spacing={2}>
            <Alert severity="success">
              <strong>Ottima Performance:</strong> Il margine di profitto del 46.3% supera il target del 40%. 
              Considerare investimenti per crescita.
            </Alert>
            
            <Alert severity="info">
              <strong>Liquidità Solida:</strong> La posizione di liquidità è buona (€{periodoCorrente?.liquidita.toLocaleString('it-IT')}). 
              Valutare opportunità di investimento.
            </Alert>
            
            <Alert severity="warning">
              <strong>Monitoraggio Crediti:</strong> I crediti rappresentano il {((periodoCorrente?.crediti / periodoCorrente?.ricavi) * 100).toFixed(1)}% dei ricavi. 
              Ottimizzare la gestione incassi.
            </Alert>
            
            {variazioneRicavi > 20 && (
              <Alert severity="success">
                <strong>Crescita Eccellente:</strong> Crescita ricavi del {variazioneRicavi.toFixed(1)}% vs periodo precedente. 
                Trend molto positivo.
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
} 