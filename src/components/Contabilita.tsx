import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Grid, Paper, Typography, Tabs, Tab, Stack, Chip, Button, TextField, Select, MenuItem, InputLabel, FormControl, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import DownloadIcon from '@mui/icons-material/Download';
import { alpha } from '@mui/material/styles';
import { apiService } from '../lib/apiService';
import jsPDF from 'jspdf';

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportToCsv(filename: string, headers: string[], rows: string[][]) {
  const bom = '\ufeff';
  const csv = [headers.join(';'), ...rows.map(r => r.map(v => String(v ?? '')).join(';'))].join('\n');
  downloadTextFile(filename, bom + csv);
}
  function exportFatturaPassivaCsv(f: any) {
    const headers = ['Campo','Valore'];
    const rows: string[][] = [
      ['Numero', f.numero || ''],
      ['Data', f.data || ''],
      ['Fornitore', f.fornitori?.nome || ''],
      ['Totale', (Number(f.totale||0)).toFixed(2).replace('.',',')],
      ['Pagato', (Number(f.pagato||0)).toFixed(2).replace('.',',')],
      ['Residuo', (Number(f.residuo||0)).toFixed(2).replace('.',',')],
    ];
    rows.push(['', '']);
    rows.push(['Pagamenti', '']);
    (f.pagamenti_fornitori||[]).forEach((p:any)=>{
      rows.push([`${p.data_pagamento} • ${p.metodo}`, (Number(p.importo||0)).toFixed(2).replace('.',',')]);
    });
    exportToCsv(`fattura_passiva_${f.numero||f.id}.csv`, headers, rows);
  }
  function exportFatturaPassivaPdf(f: any) {
    const doc = new jsPDF();
    let y = 15;
    doc.setFontSize(14); doc.text('Fattura Passiva', 14, y); y += 8;
    doc.setFontSize(11);
    doc.text(`Numero: ${f.numero||''}`, 14, y); y += 6;
    doc.text(`Data: ${f.data||''}`, 14, y); y += 6;
    doc.text(`Fornitore: ${f.fornitori?.nome||''}`, 14, y); y += 6;
    doc.text(`Totale: ${(Number(f.totale||0)).toLocaleString('it-IT',{style:'currency',currency:'EUR'})}`, 14, y); y += 6;
    doc.text(`Pagato: ${(Number(f.pagato||0)).toLocaleString('it-IT',{style:'currency',currency:'EUR'})}`, 14, y); y += 6;
    doc.text(`Residuo: ${(Number(f.residuo||0)).toLocaleString('it-IT',{style:'currency',currency:'EUR'})}`, 14, y); y += 10;
    doc.setFontSize(12); doc.text('Pagamenti', 14, y); y += 6; doc.setFontSize(11);
    (f.pagamenti_fornitori||[]).forEach((p:any)=>{
      doc.text(`${p.data_pagamento} • ${p.metodo} • ${(Number(p.importo||0)).toLocaleString('it-IT',{style:'currency',currency:'EUR'})}`, 14, y);
      y += 6;
      if (y > 280) { doc.addPage(); y = 15; }
    });
    doc.save(`fattura_passiva_${f.numero||f.id}.pdf`);
  }

export default function Contabilita() {
  const [tab, setTab] = useState(0);
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [fatture, setFatture] = useState<any[]>([]); // attive
  const [passive, setPassive] = useState<any[]>([]);
  const [statoPassive, setStatoPassive] = useState<string>('');
  const [pagaDialog, setPagaDialog] = useState<{ open: boolean; fattura?: any }>({ open: false });
  const [pagaForm, setPagaForm] = useState<{ data: string; importo: string; metodo: string; note: string }>({ data: '', importo: '', metodo: 'bonifico', note: '' });
  const [incassoDialog, setIncassoDialog] = useState<{ open: boolean; fattura?: any }>({ open: false });
  const [incassoForm, setIncassoForm] = useState<{ data: string; importo: string; metodo: string; note: string }>({ data: '', importo: '', metodo: 'bonifico', note: '' });
  const [fornitoreFilter, setFornitoreFilter] = useState<number|undefined>();
  const [refresh, setRefresh] = useState(0);
  const [fornitori, setFornitori] = useState<Array<{ id: number; nome: string }>>([]);
  const [registroRowsForExport, setRegistroRowsForExport] = useState<any[]>([]);
  const [cassaTipo, setCassaTipo] = useState<string>('');
  const [cassaMetodo, setCassaMetodo] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const [fatt, pass] = await Promise.all([
        apiService.getFattureVenditaConIncassi({ from, to }),
        apiService.getFatturePassiveContabilita({ from, to, stato: statoPassive || undefined, fornitoreId: fornitoreFilter }),
      ]);
      setFatture(fatt);
      setPassive(pass);
    };
    load();
  }, [from, to, statoPassive, fornitoreFilter, refresh]);

  useEffect(() => {
    const loadFornitori = async () => {
      try {
        const data = await apiService.getFornitori();
        setFornitori(data.map((f:any)=>({ id: f.id, nome: f.nome })));
      } catch (e) {}
    };
    loadFornitori();
  }, []);

  const card = (title: string, value: string|number, color: 'success'|'error'|'info'='success') => (
    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack>
          <Typography variant="overline" sx={{ color: 'grey.600' }}>{title}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{value}</Typography>
        </Stack>
        <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: alpha('#0ea5e9', 0.08) }}>
          <MonetizationOnIcon color={color} />
        </Box>
      </Stack>
    </Paper>
  );

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 2 }}>
      {/* 1) Riepilogo Contabile */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Riepilogo Contabile</Typography>
        {(() => {
          const residuoClienti = (fatture||[]).reduce((s:number, r:any)=> s + Number(r.residuo||0), 0);
          const residuoFornitori = (passive||[]).reduce((s:number, r:any)=> s + Number(r.residuo||0), 0);
          return (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>{card('Incassare clienti', residuoClienti.toLocaleString('it-IT',{style:'currency',currency:'EUR'}), 'info')}</Grid>
              <Grid item xs={12} sm={6} md={3}>{card('Residuo fornitori', residuoFornitori.toLocaleString('it-IT',{style:'currency',currency:'EUR'}), 'error')}</Grid>
              <Grid item xs={12} sm={6} md={3}>{card('Saldo netto', (0).toLocaleString('it-IT',{style:'currency',currency:'EUR'}), 'info')}</Grid>
              <Grid item xs={12} sm={6} md={3}>{card('IVA stimata', (0).toLocaleString('it-IT',{style:'currency',currency:'EUR'}))}</Grid>
            </Grid>
          );
        })()}
      </Paper>

      {/* Toolbar filtri generali */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'grey.200' }}>
        <Stack direction="row" alignItems="center" gap={2} flexWrap="wrap">
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Documenti</Typography>
          <Box sx={{ flex: 1 }} />
          <TextField size="small" type="date" label="Dal" InputLabelProps={{ shrink: true }} value={from} onChange={(e)=>setFrom(e.target.value)} />
          <TextField size="small" type="date" label="Al" InputLabelProps={{ shrink: true }} value={to} onChange={(e)=>setTo(e.target.value)} />
          <Button startIcon={<DownloadIcon />} variant="outlined" size="small" onClick={()=>{
            const byCliente: Record<string, { nome: string; residuo: number; count: number }> = {};
            (fatture||[]).forEach((f:any)=>{
              const id = String(f.cliente_id||f.cliente_nome||'');
              const nome = f.cliente_nome || `Cliente ${id}`;
              const res = Number(f.residuo||0);
              if (res <= 0) return;
              if (!byCliente[id]) byCliente[id] = { nome, residuo: 0, count: 0 };
              byCliente[id].residuo += res;
              byCliente[id].count += 1;
            });
            const entries = Object.values(byCliente).sort((a,b)=> b.residuo - a.residuo);
            const headers = ['Cliente','Residuo','N.Fatture'];
            const rows = entries.map(e=>[ e.nome, e.residuo.toFixed(2).replace('.',','), String(e.count) ]);
            exportToCsv(`clienti_residuo_${from||'all'}_${to||'all'}.csv`, headers, rows);
          }}>Residuo Clienti CSV</Button>
          <Button startIcon={<DownloadIcon />} variant="outlined" size="small" onClick={async ()=>{
            const list = await apiService.getFattureVenditaConIncassi({ from, to });
            const headers = ['Data','Cliente','Numero Fattura','Metodo','Importo'];
            const rows: string[][] = [];
            (list||[]).forEach((f:any)=>{
              (f.pagamenti_vendita||[]).forEach((p:any)=>{
                rows.push([
                  p.data_pagamento,
                  f.cliente_nome,
                  f.numero_fattura,
                  p.metodo,
                  Number(p.importo||0).toFixed(2).replace('.',','),
                ]);
              });
            });
            exportToCsv(`incassi_clienti_${from||'all'}_${to||'all'}.csv`, headers, rows);
          }}>Incassi Clienti CSV</Button>
          <Button startIcon={<DownloadIcon />} variant="outlined" size="small" onClick={()=>{
            const byForn: Record<string, { nome: string; residuo: number; count: number }> = {};
            (passive||[]).forEach((f:any)=>{
              const id = String(f.fornitore_id||f.fornitori?.id||'');
              const nome = f.fornitori?.nome || `Fornitore ${id}`;
              const res = Number(f.residuo||0);
              if (res <= 0) return;
              if (!byForn[id]) byForn[id] = { nome, residuo: 0, count: 0 };
              byForn[id].residuo += res;
              byForn[id].count += 1;
            });
            const entries = Object.values(byForn).sort((a,b)=> b.residuo - a.residuo);
            const headers = ['Fornitore','Residuo','N.Fatture'];
            const rows = entries.map(e=>[ e.nome, e.residuo.toFixed(2).replace('.',','), String(e.count) ]);
            exportToCsv(`fornitori_residuo_${from||'all'}_${to||'all'}.csv`, headers, rows);
          }}>Residuo Fornitori CSV</Button>
          <Button startIcon={<DownloadIcon />} variant="outlined" size="small" onClick={async ()=>{
            const rowsData = await apiService.getRegistroCassa({ from, to });
            const headers = ['Data','Causale','Rif.Tipo','Rif.ID','Tipo','Metodo','Importo'];
            const rows = rowsData.map((r:any)=>[
              r.data_operazione,
              r.causale,
              r.riferimento_tipo || '',
              r.riferimento_id || '',
              r.tipo,
              r.metodo,
              Number(r.importo||0).toFixed(2).replace('.',','),
            ]);
            exportToCsv(`dettaglio_pagamenti_${from||'all'}_${to||'all'}.csv`, headers, rows);
          }}>Dettaglio Pagamenti CSV</Button>
          <Button startIcon={<DownloadIcon />} variant="outlined" size="small">Export</Button>
        </Stack>
      </Paper>

      {/* Tabs principali */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
        <Tabs value={tab} onChange={(e,v)=>setTab(v)} variant="scrollable" scrollButtons allowScrollButtonsMobile>
          <Tab label="Fatture Attive" />
          <Tab label="Fatture Passive" />
          <Tab label="Flussi di Cassa" />
          <Tab label="Registri IVA" />
          <Tab label="Scadenze" />
          <Tab label="Redditività" />
          <Tab label="Clienti / Fornitori" />
        </Tabs>
        <Box sx={{ p: 2 }}>
          {tab === 0 && (
            <Box>
              <Grid container sx={{ fontSize: '0.8rem', color: 'grey.700', mb: 1 }}>
                <Grid item xs={2}>Data</Grid>
                <Grid item xs={3}>Cliente</Grid>
                <Grid item xs={2}>Numero</Grid>
                <Grid item xs={2}>Totale</Grid>
                <Grid item xs={3}>Incassato / Residuo</Grid>
              </Grid>
              {fatture.map((f)=> (
                <Grid key={f.id} container sx={{ py: 0.75, borderTop: '1px solid', borderColor: 'grey.100' }}>
                  <Grid item xs={2}><Typography variant="body2">{f.data_fattura}</Typography></Grid>
                  <Grid item xs={3}><Typography variant="body2"><Link to={`/clienti?id=${f.cliente_id}`} style={{ textDecoration: 'none' }}>{f.cliente_nome}</Link></Typography></Grid>
                  <Grid item xs={2}><Typography variant="body2">{f.numero_fattura}</Typography></Grid>
                  <Grid item xs={2}><Typography variant="body2">{Number(f.totale||0).toLocaleString('it-IT', { style:'currency', currency:'EUR' })}</Typography></Grid>
                  <Grid item xs={3}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                      <Typography variant="body2">{Number(f.incassato||0).toLocaleString('it-IT', { style:'currency', currency:'EUR' })} / {Number(f.residuo||0).toLocaleString('it-IT', { style:'currency', currency:'EUR' })}</Typography>
                      {Number(f.residuo||0) > 0 && (
                        <Button size="small" variant="outlined" onClick={()=>{
                          setIncassoDialog({ open: true, fattura: f });
                          setIncassoForm({ data: new Date().toISOString().slice(0,10), importo: String(f.residuo||f.totale), metodo: 'bonifico', note: '' });
                        }}>Registra incasso</Button>
                      )}
                    </Stack>
                  </Grid>
                  {/* Storico incassi per fattura attiva (se disponibile in view) */}
                  {f.pagamenti_vendita && f.pagamenti_vendita.length > 0 && (
                    <Grid item xs={12} sx={{ pl: 2 }}>
                      <Stack sx={{ mt: 0.5, pl: 1, borderLeft: '2px solid', borderColor: 'grey.100' }} spacing={0.25}>
                        {f.pagamenti_vendita.map((p:any)=> (
                          <Stack key={p.id} direction="row" alignItems="center" spacing={1}>
                            <Typography variant="caption" sx={{ color: 'grey.600' }}>{p.data_pagamento} • {p.metodo}</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>{Number(p.importo||0).toLocaleString('it-IT', { style:'currency', currency:'EUR' })}</Typography>
                            <Button size="small" color="error" variant="text" onClick={async ()=>{
                              await apiService.annullaIncassoVendita(p.id);
                              setRefresh(v=>v+1);
                            }}>Elimina</Button>
                          </Stack>
                        ))}
                      </Stack>
                    </Grid>
                  )}
                </Grid>
              ))}
            </Box>
          )}
          {tab === 1 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'grey.700' }}>Fatture Passive (con costi spalmati)</Typography>
              <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Stato</InputLabel>
                  <Select value={statoPassive} label="Stato" onChange={(e)=>setStatoPassive(e.target.value)}>
                    <MenuItem value="">Tutti</MenuItem>
                    <MenuItem value="bozza">Bozza</MenuItem>
                    <MenuItem value="confermata">Confermata</MenuItem>
                    <MenuItem value="pagata">Pagata</MenuItem>
                    <MenuItem value="annullata">Annullata</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel>Fornitore</InputLabel>
                  <Select value={fornitoreFilter ?? ''} label="Fornitore" onChange={(e)=>{
                    const v = e.target.value as any;
                    setFornitoreFilter(v === '' ? undefined : Number(v));
                  }}>
                    <MenuItem value="">Tutti</MenuItem>
                    {fornitori.map(f => (
                      <MenuItem key={f.id} value={f.id}>{f.nome}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box sx={{ flex: 1 }} />
                <Button size="small" variant="outlined" onClick={()=>{
                  const headers = ['Data','Fornitore','Numero','Totale','Costi','Pagato','Residuo','Stato'];
                  const rows = passive.map((f:any)=>[
                    f.data,
                    f.fornitori?.nome || '',
                    f.numero,
                    Number(f.totale||0).toFixed(2).replace('.',','),
                    Number(f.totale_costi_spalmati||0).toFixed(2).replace('.',','),
                    Number(f.pagato||0).toFixed(2).replace('.',','),
                    Number(f.residuo||0).toFixed(2).replace('.',','),
                    f.stato_pagamento || '',
                  ]);
                  exportToCsv(`fatture_passive_${from||'all'}_${to||'all'}.csv`, headers, rows);
                }}>Export CSV</Button>
              </Stack>
              <Grid container sx={{ fontSize: '0.8rem', color: 'grey.700', mb: 1 }}>
                <Grid item xs={2}>Data</Grid>
                <Grid item xs={3}>Fornitore</Grid>
                <Grid item xs={2}>Numero</Grid>
                <Grid item xs={2}>Totale</Grid>
                <Grid item xs={3}>Costi / Pagamenti</Grid>
              </Grid>
              {passive.map((f:any)=> {
                const residuo = Number(f.residuo || 0);
                return (
                  <Grid key={f.id} container sx={{ py: 0.75, borderTop: '1px solid', borderColor: 'grey.100' }}>
                    <Grid item xs={2}><Typography variant="body2">{f.data}</Typography></Grid>
                    <Grid item xs={3}><Typography variant="body2"><Link to={`/fornitori?id=${f.fornitore_id}`} style={{ textDecoration: 'none' }}>{f.fornitori?.nome || ''}</Link></Typography></Grid>
                    <Grid item xs={2}><Typography variant="body2">{f.numero}</Typography></Grid>
                    <Grid item xs={2}><Typography variant="body2">{Number(f.totale||0).toLocaleString('it-IT', { style:'currency', currency:'EUR' })}</Typography></Grid>
                    <Grid item xs={3}>
                      <Stack spacing={0.5}>
                        {(f.costi_fattura||[]).map((c:any, idx:number)=> (
                          <Typography key={idx} variant="caption" sx={{ color: 'grey.700' }}>{c.fornitore_costo?.nome || 'Altro'}: {Number(c.importo||0).toLocaleString('it-IT', { style:'currency', currency:'EUR' })}</Typography>
                        ))}
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>Costi: {Number(f.totale_costi_spalmati||0).toLocaleString('it-IT', { style:'currency', currency:'EUR' })} | Pagato: {Number(f.pagato||0).toLocaleString('it-IT', { style:'currency', currency:'EUR' })} | Residuo: {residuo.toLocaleString('it-IT', { style:'currency', currency:'EUR' })}</Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Tooltip title={`Da pagare: ${residuo.toLocaleString('it-IT', { style:'currency', currency:'EUR' })}`}>
                            <Chip size="small" color={residuo>0?'error':'success'} label={residuo>0?`Da pagare: ${residuo.toLocaleString('it-IT', { style:'currency', currency:'EUR' })}`:'Saldo'} />
                          </Tooltip>
                          {residuo > 0 && (
                            <Button size="small" variant="outlined" onClick={()=>{ setPagaDialog({ open: true, fattura: f }); setPagaForm({ data: new Date().toISOString().slice(0,10), importo: String(residuo || f.totale), metodo: 'bonifico', note: '' }); }}>Registra pagamento</Button>
                          )}
                          <IconButton size="small" color="primary" onClick={()=> exportFatturaPassivaPdf(f)}><PictureAsPdfIcon /></IconButton>
                          <Button size="small" variant="text" onClick={()=> exportFatturaPassivaCsv(f)}>CSV</Button>
                        </Stack>
                        {/* Storico pagamenti */}
                        {(f.pagamenti_fornitori && f.pagamenti_fornitori.length > 0) && (
                          <Stack sx={{ mt: 0.5, pl: 1, borderLeft: '2px solid', borderColor: 'grey.100' }} spacing={0.25}>
                            {f.pagamenti_fornitori.map((p:any)=> (
                              <Stack key={p.id} direction="row" alignItems="center" spacing={1}>
                                <Typography variant="caption" sx={{ color: 'grey.600' }}>{p.data_pagamento} • {p.metodo}</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>{Number(p.importo||0).toLocaleString('it-IT', { style:'currency', currency:'EUR' })}</Typography>
                                <Button size="small" color="error" variant="text" onClick={async ()=>{
                                  await apiService.annullaPagamentoFornitore(p.id);
                                  setRefresh(v=>v+1);
                                }}>Elimina</Button>
                              </Stack>
                            ))}
                          </Stack>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                );
              })}
            </Box>
          )}
          {/* Dialog pagamento */}
          <Dialog open={pagaDialog.open} onClose={()=>setPagaDialog({ open:false })} maxWidth="sm" fullWidth>
            <DialogTitle>Registra pagamento • Fattura {pagaDialog.fattura?.numero}</DialogTitle>
            <DialogContent>
              <Stack direction={{ xs:'column', sm:'row' }} gap={2} alignItems="center" sx={{ mt: 1 }}>
                <TextField fullWidth size="small" type="date" label="Data" InputLabelProps={{ shrink: true }} value={pagaForm.data} onChange={(e)=>setPagaForm(s=>({ ...s, data: e.target.value }))} />
                <TextField fullWidth size="small" label={`Importo (Residuo ${(Number(pagaDialog.fattura?.residuo||0)).toLocaleString('it-IT',{style:'currency',currency:'EUR'})})`} value={pagaForm.importo} onChange={(e)=>setPagaForm(s=>({ ...s, importo: e.target.value }))} />
              </Stack>
              <Stack direction={{ xs:'column', sm:'row' }} gap={2} alignItems="center" sx={{ mt: 2 }}>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Metodo</InputLabel>
                  <Select label="Metodo" value={pagaForm.metodo} onChange={(e)=>setPagaForm(s=>({ ...s, metodo: e.target.value }))}>
                    <MenuItem value="bonifico">Bonifico</MenuItem>
                    <MenuItem value="contanti">Contanti</MenuItem>
                    <MenuItem value="pos">POS</MenuItem>
                    <MenuItem value="assegno">Assegno</MenuItem>
                    <MenuItem value="paypal">PayPal</MenuItem>
                    <MenuItem value="altro">Altro</MenuItem>
                  </Select>
                </FormControl>
                <TextField fullWidth size="small" label="Note (opzionale)" value={pagaForm.note} onChange={(e)=>setPagaForm(s=>({ ...s, note: e.target.value }))} />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={()=>setPagaDialog({ open:false })}>Annulla</Button>
              <Button variant="contained" onClick={async ()=>{
                try {
                  await apiService.registraPagamentoFornitore({
                    fattura_acquisto_id: pagaDialog.fattura.id,
                    data_pagamento: pagaForm.data,
                    importo: Number(pagaForm.importo||0),
                    metodo: pagaForm.metodo as any,
                    note: pagaForm.note
                  });
                  setPagaDialog({ open:false });
                  setRefresh(v=>v+1);
                } catch (e) {
                  console.error('Errore pagamento fornitore', e);
                }
              }}>Registra</Button>
            </DialogActions>
          </Dialog>
          {/* Dialog incasso attive */}
          <Dialog open={incassoDialog.open} onClose={()=>setIncassoDialog({ open:false })} maxWidth="sm" fullWidth>
            <DialogTitle>Registra incasso • Fattura {incassoDialog.fattura?.numero_fattura}</DialogTitle>
            <DialogContent>
              <Stack direction={{ xs:'column', sm:'row' }} gap={2} alignItems="center" sx={{ mt: 1 }}>
                <TextField fullWidth size="small" type="date" label="Data" InputLabelProps={{ shrink: true }} value={incassoForm.data} onChange={(e)=>setIncassoForm(s=>({ ...s, data: e.target.value }))} />
                <TextField fullWidth size="small" label={`Importo (Residuo ${(Number(incassoDialog.fattura?.residuo||0)).toLocaleString('it-IT',{style:'currency',currency:'EUR'})})`} value={incassoForm.importo} onChange={(e)=>setIncassoForm(s=>({ ...s, importo: e.target.value }))} />
              </Stack>
              <Stack direction={{ xs:'column', sm:'row' }} gap={2} alignItems="center" sx={{ mt: 2 }}>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Metodo</InputLabel>
                  <Select label="Metodo" value={incassoForm.metodo} onChange={(e)=>setIncassoForm(s=>({ ...s, metodo: e.target.value }))}>
                    <MenuItem value="bonifico">Bonifico</MenuItem>
                    <MenuItem value="contanti">Contanti</MenuItem>
                    <MenuItem value="pos">POS</MenuItem>
                    <MenuItem value="assegno">Assegno</MenuItem>
                    <MenuItem value="paypal">PayPal</MenuItem>
                    <MenuItem value="altro">Altro</MenuItem>
                  </Select>
                </FormControl>
                <TextField fullWidth size="small" label="Note (opzionale)" value={incassoForm.note} onChange={(e)=>setIncassoForm(s=>({ ...s, note: e.target.value }))} />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={()=>setIncassoDialog({ open:false })}>Annulla</Button>
              <Button variant="contained" onClick={async ()=>{
                try {
                  await apiService.registraIncassoVendita({
                    fattura_id: incassoDialog.fattura.id,
                    data_pagamento: incassoForm.data,
                    importo: Number(incassoForm.importo||0),
                    metodo: incassoForm.metodo as any,
                    note: incassoForm.note
                  } as any);
                  setIncassoDialog({ open:false });
                  setRefresh(v=>v+1);
                } catch (e) {
                  console.error('Errore incasso cliente', e);
                }
              }}>Registra</Button>
            </DialogActions>
          </Dialog>
          {tab === 2 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'grey.700' }}>Flussi di Cassa</Typography>
              <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
                <TextField size="small" type="date" label="Dal" InputLabelProps={{ shrink: true }} value={from} onChange={(e)=>setFrom(e.target.value)} />
                <TextField size="small" type="date" label="Al" InputLabelProps={{ shrink: true }} value={to} onChange={(e)=>setTo(e.target.value)} />
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select value={cassaTipo} label="Tipo" onChange={(e)=>setCassaTipo(e.target.value)}>
                    <MenuItem value="">Tutti</MenuItem>
                    <MenuItem value="entrata">Entrata</MenuItem>
                    <MenuItem value="uscita">Uscita</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Metodo</InputLabel>
                  <Select value={cassaMetodo} label="Metodo" onChange={(e)=>setCassaMetodo(e.target.value)}>
                    <MenuItem value="">Tutti</MenuItem>
                    <MenuItem value="bonifico">Bonifico</MenuItem>
                    <MenuItem value="contanti">Contanti</MenuItem>
                    <MenuItem value="pos">POS</MenuItem>
                    <MenuItem value="assegno">Assegno</MenuItem>
                    <MenuItem value="paypal">PayPal</MenuItem>
                    <MenuItem value="altro">Altro</MenuItem>
                  </Select>
                </FormControl>
                <Box sx={{ flex: 1 }} />
                <Button size="small" variant="outlined" onClick={()=>{
                  const headers = ['Data','Causale','Metodo','Tipo','Importo'];
                  const rows = registroRowsForExport.map(r=>[
                    r.data_operazione,
                    r.causale,
                    r.metodo,
                    r.tipo,
                    Number(r.importo||0).toFixed(2).replace('.',','),
                  ]);
                  exportToCsv(`registro_cassa_${from||'all'}_${to||'all'}_${cassaTipo||'all'}_${cassaMetodo||'all'}.csv`, headers, rows);
                }}>Export CSV</Button>
              </Stack>
              {/* KPI cassa periodo */}
              {(() => {
                const totEntrate = registroRowsForExport.filter(r=>r.tipo==='entrata').reduce((s:number,r:any)=> s + Number(r.importo||0), 0);
                const totUscite = registroRowsForExport.filter(r=>r.tipo==='uscita').reduce((s:number,r:any)=> s + Number(r.importo||0), 0);
                const incassiPeriodo = registroRowsForExport.filter(r=>r.tipo==='entrata' && r.riferimento_tipo==='fattura_vendita').reduce((s:number,r:any)=> s + Number(r.importo||0), 0);
                const saldo = totEntrate - totUscite;
                return (
                  <Grid container spacing={2} sx={{ mb: 1 }}>
                    <Grid item xs={12} sm={3}>{card('Entrate periodo', totEntrate.toLocaleString('it-IT',{style:'currency',currency:'EUR'}), 'success')}</Grid>
                    <Grid item xs={12} sm={3}>{card('Incassi periodo', incassiPeriodo.toLocaleString('it-IT',{style:'currency',currency:'EUR'}), 'success')}</Grid>
                    <Grid item xs={12} sm={3}>{card('Uscite periodo', totUscite.toLocaleString('it-IT',{style:'currency',currency:'EUR'}), 'error')}</Grid>
                    <Grid item xs={12} sm={3}>{card('Saldo periodo', saldo.toLocaleString('it-IT',{style:'currency',currency:'EUR'}), 'info')}</Grid>
                  </Grid>
                );
              })()}
              {/* Totali per metodo */}
              {(() => {
                const gruppi: Record<string, { entrate: number; uscite: number }> = {};
                registroRowsForExport.forEach((r:any)=>{
                  const key = r.metodo || 'altro';
                  if (!gruppi[key]) gruppi[key] = { entrate: 0, uscite: 0 };
                  if (r.tipo === 'entrata') gruppi[key].entrate += Number(r.importo||0);
                  if (r.tipo === 'uscita') gruppi[key].uscite += Number(r.importo||0);
                });
                const methods = Object.keys(gruppi);
                if (methods.length === 0) return null;
                return (
                  <Paper elevation={0} sx={{ p: 2, mb: 1, border: '1px dashed', borderColor: 'grey.200' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'grey.700' }}>Totali per metodo</Typography>
                    <Grid container spacing={2}>
                      {methods.map(m => (
                        <Grid key={m} item xs={12} sm={6} md={4} lg={3}>
                          <Paper elevation={0} sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.100' }}>
                            <Typography variant="caption" sx={{ color: 'grey.600' }}>{m.toUpperCase()}</Typography>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2">Entrate</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{gruppi[m].entrate.toLocaleString('it-IT',{style:'currency',currency:'EUR'})}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2">Uscite</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{gruppi[m].uscite.toLocaleString('it-IT',{style:'currency',currency:'EUR'})}</Typography>
                            </Stack>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                );
              })()}
              <RegistroCassa from={from} to={to} tipo={cassaTipo || undefined} metodo={cassaMetodo || undefined} onRows={(rows)=> setRegistroRowsForExport(rows)} />
            </Box>
          )}
          {tab === 3 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'grey.700' }}>Registri IVA (riepilogo mensile semplice)</Typography>
              {(() => {
                const toMonth = (d:string) => d?.slice(0,7) || '';
                const venditeByM: Record<string, number> = {};
                const acquistiByM: Record<string, number> = {};
                (fatture||[]).forEach((f:any)=>{
                  if (!f.data_fattura) return; const m = toMonth(f.data_fattura);
                  venditeByM[m] = (venditeByM[m]||0) + Number(f.totale||0);
                });
                (passive||[]).forEach((p:any)=>{
                  if (!p.data) return; const m = toMonth(p.data);
                  acquistiByM[m] = (acquistiByM[m]||0) + Number(p.totale||0);
                });
                const months = Array.from(new Set([...Object.keys(venditeByM), ...Object.keys(acquistiByM)])).sort();
                return (
                  <Box>
                    <Grid container sx={{ fontSize: '0.8rem', color: 'grey.700', mb: 1 }}>
                      <Grid item xs={3}>Mese</Grid>
                      <Grid item xs={3}>Vendite (totale)</Grid>
                      <Grid item xs={3}>Acquisti (totale)</Grid>
                      <Grid item xs={3}>Saldo</Grid>
                    </Grid>
                    {months.map(m => (
                      <Grid key={m} container sx={{ py: 0.75, borderTop: '1px solid', borderColor: 'grey.100' }}>
                        <Grid item xs={3}><Typography variant="body2">{m}</Typography></Grid>
                        <Grid item xs={3}><Typography variant="body2">{(venditeByM[m]||0).toLocaleString('it-IT',{style:'currency',currency:'EUR'})}</Typography></Grid>
                        <Grid item xs={3}><Typography variant="body2">{(acquistiByM[m]||0).toLocaleString('it-IT',{style:'currency',currency:'EUR'})}</Typography></Grid>
                        <Grid item xs={3}><Typography variant="body2">{(((venditeByM[m]||0) - (acquistiByM[m]||0))).toLocaleString('it-IT',{style:'currency',currency:'EUR'})}</Typography></Grid>
                      </Grid>
                    ))}
                    {months.length===0 && (
                      <Typography variant="body2" sx={{ color: 'grey.500' }}>Nessun dato nel periodo selezionato.</Typography>
                    )}
                  </Box>
                );
              })()}
            </Box>
          )}
          {tab === 4 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'grey.700' }}>Scadenze (da incassare / da pagare)</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Clienti da incassare</Typography>
                    {(fatture||[]).filter((f:any)=> Number(f.residuo||0) > 0).sort((a:any,b:any)=> String(a.data_fattura).localeCompare(String(b.data_fattura))).map((f:any)=> (
                      <Stack key={f.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 0.5, borderTop: '1px solid', borderColor: 'grey.100' }}>
                        <Typography variant="body2">{f.data_fattura} • {f.cliente_nome} • {f.numero_fattura}</Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip size="small" color="error" label={Number(f.residuo||0).toLocaleString('it-IT',{style:'currency',currency:'EUR'})} />
                          <Button size="small" variant="outlined" onClick={()=>{ setIncassoDialog({ open: true, fattura: f }); setIncassoForm({ data: new Date().toISOString().slice(0,10), importo: String(f.residuo||f.totale), metodo: 'bonifico', note: '' }); }}>Incassa</Button>
                        </Stack>
                      </Stack>
                    ))}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Fornitori da pagare</Typography>
                    {(passive||[]).filter((p:any)=> Number(p.residuo||0) > 0).sort((a:any,b:any)=> String(a.data).localeCompare(String(b.data))).map((p:any)=> (
                      <Stack key={p.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 0.5, borderTop: '1px solid', borderColor: 'grey.100' }}>
                        <Typography variant="body2">{p.data} • {p.fornitori?.nome || ''} • {p.numero}</Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip size="small" color="error" label={Number(p.residuo||0).toLocaleString('it-IT',{style:'currency',currency:'EUR'})} />
                          <Button size="small" variant="outlined" onClick={()=>{ setPagaDialog({ open: true, fattura: p }); setPagaForm({ data: new Date().toISOString().slice(0,10), importo: String(p.residuo||p.totale), metodo: 'bonifico', note: '' }); }}>Paga</Button>
                        </Stack>
                      </Stack>
                    ))}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
          {tab === 5 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'grey.700' }}>Redditività</Typography>
              <Typography variant="body2" sx={{ color: 'grey.500', mb: 1 }}>Indicatori avanzati (MOL, ricarico medio, utili) verranno integrati dopo definizione completa IVA/costi. Webshop Next.js sarà integrato nei ricavi.</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>{card('Vendite periodo', (fatture||[]).reduce((s:number,f:any)=> s + Number(f.totale||0), 0).toLocaleString('it-IT',{style:'currency',currency:'EUR'}), 'success')}</Grid>
                <Grid item xs={12} sm={6} md={4}>{card('Acquisti periodo', (passive||[]).reduce((s:number,p:any)=> s + Number(p.totale||0), 0).toLocaleString('it-IT',{style:'currency',currency:'EUR'}), 'error')}</Grid>
                <Grid item xs={12} sm={6} md={4}>{card('Differenza', (((fatture||[]).reduce((s:number,f:any)=> s + Number(f.totale||0), 0)) - ((passive||[]).reduce((s:number,p:any)=> s + Number(p.totale||0), 0))).toLocaleString('it-IT',{style:'currency',currency:'EUR'}), 'info')}</Grid>
              </Grid>
            </Box>
          )}
          {tab === 6 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'grey.700' }}>Clienti / Fornitori - Contabilità separata</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2">Clienti (esposizione)</Typography>
                      <Button size="small" variant="outlined" onClick={()=>{
                        const byCli: Record<string, { nome: string; totale: number; incassato: number; residuo: number }> = {};
                        (fatture||[]).forEach((f:any)=>{
                          const id = String(f.cliente_id||'');
                          const nome = f.cliente_nome||id;
                          if (!byCli[id]) byCli[id] = { nome, totale: 0, incassato: 0, residuo: 0 };
                          byCli[id].totale += Number(f.totale||0);
                          byCli[id].incassato += Number(f.incassato||0);
                          byCli[id].residuo += Number(f.residuo||0);
                        });
                        const rows = Object.values(byCli).sort((a,b)=> b.residuo - a.residuo).map(e=>[
                          e.nome,
                          e.totale.toFixed(2).replace('.',','),
                          e.incassato.toFixed(2).replace('.',','),
                          e.residuo.toFixed(2).replace('.',','),
                        ]);
                        exportToCsv(`clienti_esposizione_${from||'all'}_${to||'all'}.csv`, ['Cliente','Totale','Incassato','Residuo'], rows);
                      }}>Export CSV</Button>
                    </Stack>
                    <Grid container sx={{ fontSize: '0.8rem', color: 'grey.700', mb: 1 }}>
                      <Grid item xs={6}>Cliente</Grid>
                      <Grid item xs={2}>Totale</Grid>
                      <Grid item xs={2}>Incassato</Grid>
                      <Grid item xs={2}>Residuo</Grid>
                    </Grid>
                    {(() => {
                      const byCli: Record<string, { nome: string; totale: number; incassato: number; residuo: number }> = {};
                      (fatture||[]).forEach((f:any)=>{
                        const id = String(f.cliente_id||'');
                        const nome = f.cliente_nome||id;
                        if (!byCli[id]) byCli[id] = { nome, totale: 0, incassato: 0, residuo: 0 };
                        byCli[id].totale += Number(f.totale||0);
                        byCli[id].incassato += Number(f.incassato||0);
                        byCli[id].residuo += Number(f.residuo||0);
                      });
                      const list = Object.values(byCli).sort((a,b)=> b.residuo - a.residuo);
                      return list.map((e, idx)=> (
                        <Grid key={idx} container sx={{ py: 0.75, borderTop: '1px solid', borderColor: 'grey.100' }}>
                          <Grid item xs={6}><Typography variant="body2">{e.nome}</Typography></Grid>
                          <Grid item xs={2}><Typography variant="body2">{e.totale.toLocaleString('it-IT',{style:'currency',currency:'EUR'})}</Typography></Grid>
                          <Grid item xs={2}><Typography variant="body2">{e.incassato.toLocaleString('it-IT',{style:'currency',currency:'EUR'})}</Typography></Grid>
                          <Grid item xs={2}><Typography variant="body2">{e.residuo.toLocaleString('it-IT',{style:'currency',currency:'EUR'})}</Typography></Grid>
                        </Grid>
                      ));
                    })()}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2">Fornitori (esposizione)</Typography>
                      <Button size="small" variant="outlined" onClick={()=>{
                        const byFor: Record<string, { nome: string; totale: number; pagato: number; residuo: number }> = {};
                        (passive||[]).forEach((p:any)=>{
                          const id = String(p.fornitore_id||p.fornitori?.id||'');
                          const nome = p.fornitori?.nome||id;
                          if (!byFor[id]) byFor[id] = { nome, totale: 0, pagato: 0, residuo: 0 };
                          byFor[id].totale += Number(p.totale||0);
                          byFor[id].pagato += Number(p.pagato||0);
                          byFor[id].residuo += Number(p.residuo||0);
                        });
                        const rows = Object.values(byFor).sort((a,b)=> b.residuo - a.residuo).map(e=>[
                          e.nome,
                          e.totale.toFixed(2).replace('.',','),
                          e.pagato.toFixed(2).replace('.',','),
                          e.residuo.toFixed(2).replace('.',','),
                        ]);
                        exportToCsv(`fornitori_esposizione_${from||'all'}_${to||'all'}.csv`, ['Fornitore','Totale','Pagato','Residuo'], rows);
                      }}>Export CSV</Button>
                    </Stack>
                    <Grid container sx={{ fontSize: '0.8rem', color: 'grey.700', mb: 1 }}>
                      <Grid item xs={6}>Fornitore</Grid>
                      <Grid item xs={2}>Totale</Grid>
                      <Grid item xs={2}>Pagato</Grid>
                      <Grid item xs={2}>Residuo</Grid>
                    </Grid>
                    {(() => {
                      const byFor: Record<string, { nome: string; totale: number; pagato: number; residuo: number }> = {};
                      (passive||[]).forEach((p:any)=>{
                        const id = String(p.fornitore_id||p.fornitori?.id||'');
                        const nome = p.fornitori?.nome||id;
                        if (!byFor[id]) byFor[id] = { nome, totale: 0, pagato: 0, residuo: 0 };
                        byFor[id].totale += Number(p.totale||0);
                        byFor[id].pagato += Number(p.pagato||0);
                        byFor[id].residuo += Number(p.residuo||0);
                      });
                      const list = Object.values(byFor).sort((a,b)=> b.residuo - a.residuo);
                      return list.map((e, idx)=> (
                        <Grid key={idx} container sx={{ py: 0.75, borderTop: '1px solid', borderColor: 'grey.100' }}>
                          <Grid item xs={6}><Typography variant="body2">{e.nome}</Typography></Grid>
                          <Grid item xs={2}><Typography variant="body2">{e.totale.toLocaleString('it-IT',{style:'currency',currency:'EUR'})}</Typography></Grid>
                          <Grid item xs={2}><Typography variant="body2">{e.pagato.toLocaleString('it-IT',{style:'currency',currency:'EUR'})}</Typography></Grid>
                          <Grid item xs={2}><Typography variant="body2">{e.residuo.toLocaleString('it-IT',{style:'currency',currency:'EUR'})}</Typography></Grid>
                        </Grid>
                      ));
                    })()}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

function RegistroCassa({ from, to, tipo, metodo, onRows }: { from?: string; to?: string; tipo?: string; metodo?: string; onRows?: (rows:any[])=>void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiService.getRegistroCassa({ from, to, tipo: tipo as any, metodo: metodo as any });
        setRows(data);
        onRows && onRows(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [from, to, tipo, metodo]);
  return (
    <Box>
      <Grid container sx={{ fontSize: '0.8rem', color: 'grey.700', mb: 1 }}>
        <Grid item xs={2}>Data</Grid>
        <Grid item xs={5}>Causale</Grid>
        <Grid item xs={2}>Metodo</Grid>
        <Grid item xs={1}>Tipo</Grid>
        <Grid item xs={2}>Importo</Grid>
      </Grid>
      {rows.map((r:any)=>(
        <Grid key={r.id} container sx={{ py: 0.75, borderTop: '1px solid', borderColor: 'grey.100' }}>
          <Grid item xs={2}><Typography variant="body2">{r.data_operazione}</Typography></Grid>
          <Grid item xs={5}><Typography variant="body2">{r.causale}</Typography></Grid>
          <Grid item xs={2}><Typography variant="body2">{r.metodo}</Typography></Grid>
          <Grid item xs={1}><Chip size="small" color={r.tipo==='entrata'?'success':'error'} label={r.tipo} /></Grid>
          <Grid item xs={2}><Typography variant="body2" sx={{ fontWeight: 700 }}>{Number(r.importo||0).toLocaleString('it-IT', { style:'currency', currency:'EUR' })}</Typography></Grid>
        </Grid>
      ))}
      {(!rows || rows.length===0) && !loading && (
        <Typography variant="body2" sx={{ color: 'grey.500' }}>Nessun movimento nel periodo selezionato.</Typography>
      )}
    </Box>
  );
}


