import React, { useEffect, useMemo, useState } from 'react';
import { Box, Grid, Paper, Typography, Chip, Select, MenuItem, FormControl, InputLabel, Stack, IconButton, Tooltip, Button, TextField, Autocomplete } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import TimelineIcon from '@mui/icons-material/Timeline';
import DownloadIcon from '@mui/icons-material/Download';
import { alpha } from '@mui/material/styles';
import { apiService } from '../lib/apiService';

// Placeholder tipizzato per serie chart (in attesa di Chart.js/ApexCharts)
type Serie = Array<{ x: string|number; y: number }>; 

export default function Statistiche() {
  const [periodo, setPeriodo] = useState<'oggi'|'settimana'|'mese'|'anno'>('mese');
  const [loading, setLoading] = useState(false);

  // Dati mock finché non connettiamo le query specifiche
  const [venduto, setVenduto] = useState({ oggi: 0, ieri: 0, settimana: 0, mese: 0, anno: 0 });
  const [kpi, setKpi] = useState({ articoliVenduti: 0, ricaricoNettoEuro: 0, ricaricoPercent: 0, invenduti: 0, margineMedio: 0, operazioni: 0, clientiUnici: 0 });

  const [serieVenduto, setSerieVenduto] = useState<Serie>([]);
  const [serieRicarico, setSerieRicarico] = useState<Serie>([]);
  const [topArticoli, setTopArticoli] = useState<Array<{ nome: string; valore: number }>>([]);
  const [topClienti, setTopClienti] = useState<Array<{ nome: string; valore: number }>>([]);
  const [categorie, setCategorie] = useState<Array<{ nome: string; valore: number }>>([]);
  const [distruzioni, setDistruzioni] = useState<Array<any>>([]);

  // Ricerca approfondita
  const [articoliVenduti, setArticoliVenduti] = useState<Array<any>>([]);
  const [clientiVenduto, setClientiVenduto] = useState<Array<any>>([]);
  const [filtriDett, setFiltriDett] = useState<{ from?: string; to?: string; clienteId?: number; gruppoId?: number; prodottoId?: number }>({});
  const [clienti, setClienti] = useState<Array<{ id: number; nome: string }>>([]);
  const [gruppi, setGruppi] = useState<Array<{ id: number; nome: string }>>([]);
  const [prodotti, setProdotti] = useState<Array<{ id: number; nome: string }>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Lookup per nomi
        const [gr, pr, cl] = await Promise.all([
          (apiService as any).getGruppi?.() ?? [],
          (apiService as any).getProdotti?.() ?? [],
          (apiService as any).getClienti?.() ?? [],
        ]);
        setGruppi(gr as any); setProdotti(pr as any); setClienti(cl as any);

        // 1) Serie venduto (sintetica)
        const from = filtriDett.from; const to = filtriDett.to;
        const vendutoArt = await apiService.getVendutoArticoli({ from, to });
        const perGiorno = vendutoArt.reduce<Record<string, number>>((acc, r) => {
          const d = r.data || '';
          acc[d] = (acc[d] || 0) + (r.prezzo_medio_vendita * r.quantita);
          return acc;
        }, {});
        const giorni = Object.keys(perGiorno).sort();
        setSerieVenduto(giorni.map((g, i) => ({ x: g || i + 1, y: perGiorno[g] })));

        // 2) KPI
        const totaleMese = vendutoArt.reduce((s, r) => s + r.prezzo_medio_vendita * r.quantita, 0);
        const qtaTot = vendutoArt.reduce((s, r) => s + r.quantita, 0);
        const ricTot = vendutoArt.reduce((s, r) => s + r.ricarico_euro, 0);
        const ricPerc = vendutoArt.length ? Math.round((ricTot / Math.max(totaleMese - ricTot, 1)) * 100) : 0;
        setVenduto(v => ({ ...v, mese: Math.round(totaleMese) }));
        setKpi({ articoliVenduti: qtaTot, ricaricoNettoEuro: Math.round(ricTot), ricaricoPercent: ricPerc, invenduti: 0, margineMedio: ricPerc, operazioni: vendutoArt.length, clientiUnici: new Set(vendutoArt.map(r=>r.cliente_id)).size || 0 });

        // 3) Top articoli
        const byArt = vendutoArt.reduce<Record<string, number>>((acc, r)=>{ acc[r.nome] = (acc[r.nome]||0) + r.prezzo_medio_vendita * r.quantita; return acc; }, {});
        setTopArticoli(Object.entries(byArt).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([nome, valore])=>({ nome, valore })));

        // 4) Top clienti reali
        const clienti = await apiService.getVendutoClienti({ from, to });
        const byCli = clienti.reduce<Record<string, number>>((acc, r)=>{ acc[r.cliente_nome] = (acc[r.cliente_nome]||0) + r.valore; return acc; }, {});
        setTopClienti(Object.entries(byCli).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([nome, valore])=>({ nome, valore })));

        // 5) Distruzioni reali
        const dist = await apiService.getDistruzioniArticoli({ from, to });
        setDistruzioni(dist);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [periodo, filtriDett.from, filtriDett.to]);

  const loadDettagli = async () => {
    try {
      const [a, c] = await Promise.all([
        apiService.getVendutoArticoli({ from: filtriDett.from, to: filtriDett.to, clienteId: filtriDett.clienteId, gruppoId: filtriDett.gruppoId, prodottoId: filtriDett.prodottoId }),
        apiService.getVendutoClienti({ from: filtriDett.from, to: filtriDett.to, clienteId: filtriDett.clienteId }),
      ]);
      setArticoliVenduti(a);
      setClientiVenduto(c);
    } catch (e) { /* noop */ }
  };

  const card = (title: string, value: string|number, icon: React.ReactNode, trend?: 'up'|'down') => (
    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack spacing={0.5}>
          <Typography variant="overline" sx={{ color: 'grey.600' }}>{title}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{value}</Typography>
        </Stack>
        <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'grey.50' }}>{icon}</Box>
      </Stack>
      {trend && (
        <Chip
          size="small"
          sx={{ mt: 1, bgcolor: trend === 'up' ? alpha('#22c55e', 0.12) : alpha('#ef4444', 0.12), color: trend === 'up' ? '#16a34a' : '#dc2626' }}
          icon={trend === 'up' ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
          label={trend === 'up' ? '+5% su periodo' : '-5% su periodo'}
        />
      )}
    </Paper>
  );

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 2 }}>
      {/* Toolbar filtri */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'grey.200' }}>
        <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Panoramica vendite</Typography>
          <Box sx={{ flex: 1 }} />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Periodo</InputLabel>
            <Select label="Periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value as any)}>
              <MenuItem value="oggi">Oggi</MenuItem>
              <MenuItem value="settimana">Settimana</MenuItem>
              <MenuItem value="mese">Mese</MenuItem>
              <MenuItem value="anno">Anno</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Esporta CSV">
            <IconButton color="primary"><DownloadIcon /></IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {/* KPI principali */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={6} md={3}>{card('Venduto mese', `€ ${venduto.mese.toLocaleString('it-IT')}`, <MonetizationOnIcon color="success" />)}</Grid>
        <Grid item xs={12} sm={6} md={3}>{card('Articoli venduti', kpi.articoliVenduti, <ShoppingCartIcon color="primary" />)}</Grid>
        <Grid item xs={12} sm={6} md={3}>{card('Ricarico netto', `€ ${kpi.ricaricoNettoEuro} (${kpi.ricaricoPercent}%)`, <TrendingUpIcon color="success" />)}</Grid>
        <Grid item xs={12} sm={6} md={3}>{card('Clienti unici', kpi.clientiUnici, <PeopleIcon color="secondary" />)}</Grid>
        <Grid item xs={12} sm={6} md={3}>{card('Margine medio', `${kpi.margineMedio}%`, <TimelineIcon color="info" />)}</Grid>
        <Grid item xs={12} sm={6} md={3}>{card('Operazioni', kpi.operazioni, <DonutSmallIcon color="warning" />)}</Grid>
        <Grid item xs={12} sm={6} md={3}>{card('Articoli invenduti', kpi.invenduti, <InventoryIcon color="error" />)}</Grid>
        <Grid item xs={12} sm={6} md={3}>{card('Venduto anno', `€ ${venduto.anno.toLocaleString('it-IT')}`, <MonetizationOnIcon color="success" />)}</Grid>
      </Grid>

      {/* Grafici placeholder (sostituire con Chart.js/ApexCharts) */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'grey.700' }}>Venduto per giorno</Typography>
            <Box sx={{ height: 260, display: 'grid', gridTemplateColumns: `repeat(${serieVenduto.length}, 1fr)`, alignItems: 'end', gap: 2 }}>
              {serieVenduto.map((p, idx) => (
                <Box key={idx} sx={{ height: (p.y/600)*240 + 10, bgcolor: alpha('#7c3aed', 0.3), borderRadius: 1 }} />
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'grey.700' }}>Categorie più vendute</Typography>
            <Stack spacing={1}>
              {categorie.map((c, i) => (
                <Stack key={i} direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: ['#f59e0b','#7c3aed','#10b981'][i%3] }} />
                  <Typography variant="body2" sx={{ flex: 1 }}>{c.nome}</Typography>
                  <Typography variant="body2" sx={{ color: 'grey.600' }}>{c.valore}%</Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'grey.700' }}>Top articoli</Typography>
            <Stack spacing={1}>
              {topArticoli.map((a, i) => (
                <Stack key={i} direction="row" alignItems="center">
                  <Typography variant="body2" sx={{ flex: 1 }}>{a.nome}</Typography>
                  <Chip size="small" label={`€ ${a.valore}`} />
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'grey.700' }}>Top clienti</Typography>
            <Stack spacing={1}>
              {topClienti.map((a, i) => (
                <Stack key={i} direction="row" alignItems="center">
                  <Typography variant="body2" sx={{ flex: 1 }}>{a.nome}</Typography>
                  <Chip size="small" color="primary" label={`€ ${a.valore}`} />
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Analisi approfondita (placeholder) */}
      <Paper elevation={0} sx={{ p: 2, mt: 2, border: '1px solid', borderColor: 'grey.200' }}>
        <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Analisi approfondita</Typography>
          <Box sx={{ flex: 1 }} />
          <TextField size="small" type="date" label="Dal" InputLabelProps={{ shrink: true }} value={filtriDett.from || ''} onChange={(e)=>setFiltriDett(s=>({ ...s, from: e.target.value }))} />
          <TextField size="small" type="date" label="Al" InputLabelProps={{ shrink: true }} value={filtriDett.to || ''} onChange={(e)=>setFiltriDett(s=>({ ...s, to: e.target.value }))} />
          <Autocomplete size="small" sx={{ minWidth: 220 }} options={clienti as any} getOptionLabel={(o:any)=>o.nome} onChange={(e,v)=>setFiltriDett(s=>({ ...s, clienteId: v?.id }))} renderInput={(p)=> <TextField {...p} label="Cliente" />} />
          <Autocomplete size="small" sx={{ minWidth: 200 }} options={gruppi as any} getOptionLabel={(o:any)=>o.nome} onChange={(e,v)=>setFiltriDett(s=>({ ...s, gruppoId: v?.id }))} renderInput={(p)=> <TextField {...p} label="Gruppo" />} />
          <Autocomplete size="small" sx={{ minWidth: 200 }} options={prodotti as any} getOptionLabel={(o:any)=>o.nome} onChange={(e,v)=>setFiltriDett(s=>({ ...s, prodottoId: v?.id }))} renderInput={(p)=> <TextField {...p} label="Prodotto" />} />
          <Button variant="contained" size="small" onClick={loadDettagli}>Applica</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>Export CSV</Button>
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'grey.700' }}>Distruzioni (storico)</Typography>
            <Box sx={{ maxHeight: 260, overflow: 'auto', pr: 1 }}>
              <Grid container sx={{ fontSize: '0.8rem', color: 'grey.700', mb: 1 }}>
                <Grid item xs={5}>Articolo</Grid>
                <Grid item xs={3}>Data</Grid>
                <Grid item xs={2}>Qta</Grid>
                <Grid item xs={2}>Costo</Grid>
              </Grid>
              {distruzioni.map((r, i)=> (
                <Grid key={i} container sx={{ py: 0.75, borderTop: '1px solid', borderColor: 'grey.100', alignItems: 'center' }}>
                  <Grid item xs={5}><Typography variant="body2">{r.articolo_nome || '-'}</Typography></Grid>
                  <Grid item xs={3}><Typography variant="body2">{r.data}</Typography></Grid>
                  <Grid item xs={2}><Typography variant="body2">{r.quantita}</Typography></Grid>
                  <Grid item xs={2}><Chip size="small" color="error" label={`€ ${r.costo_totale}`} /></Grid>
                </Grid>
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'grey.700' }}>Venduto per articolo</Typography>
            <Box sx={{ maxHeight: 260, overflow: 'auto', pr: 1 }}>
              <Grid container sx={{ fontSize: '0.8rem', color: 'grey.700', mb: 1 }}>
                <Grid item xs={4}>Articolo</Grid>
                <Grid item xs={2}>Qta</Grid>
                <Grid item xs={2}>Prezzo Acq.</Grid>
                <Grid item xs={2}>Prezzo Vend.</Grid>
                <Grid item xs={2}>Ricarico</Grid>
              </Grid>
              {articoliVenduti.map((r, i)=> (
                <Grid key={i} container sx={{ py: 0.75, borderTop: '1px solid', borderColor: 'grey.100', alignItems: 'center' }}>
                  <Grid item xs={4}><Typography variant="body2">{r.nome}</Typography></Grid>
                  <Grid item xs={2}><Typography variant="body2">{r.quantita}</Typography></Grid>
                  <Grid item xs={2}><Typography variant="body2">€ {r.prezzo_medio_acquisto?.toFixed(2)}</Typography></Grid>
                  <Grid item xs={2}><Typography variant="body2">€ {r.prezzo_medio_vendita?.toFixed(2)}</Typography></Grid>
                  <Grid item xs={2}><Chip size="small" color={r.ricarico_euro>=0?'success':'error'} label={`€ ${r.ricarico_euro.toFixed(2)}`} /></Grid>
                </Grid>
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'grey.700' }}>Clienti e acquisti</Typography>
            <Box sx={{ maxHeight: 260, overflow: 'auto', pr: 1 }}>
              <Grid container sx={{ fontSize: '0.8rem', color: 'grey.700', mb: 1 }}>
                <Grid item xs={5}>Cliente</Grid>
                <Grid item xs={3}>Articolo</Grid>
                <Grid item xs={2}>Qta</Grid>
                <Grid item xs={2}>Valore</Grid>
              </Grid>
              {clientiVenduto.map((r, i)=> (
                <Grid key={i} container sx={{ py: 0.75, borderTop: '1px solid', borderColor: 'grey.100', alignItems: 'center' }}>
                  <Grid item xs={5}><Typography variant="body2">{r.cliente_nome}</Typography></Grid>
                  <Grid item xs={3}><Typography variant="body2">{r.articolo_nome}</Typography></Grid>
                  <Grid item xs={2}><Typography variant="body2">{r.quantita}</Typography></Grid>
                  <Grid item xs={2}><Chip size="small" label={`€ ${r.valore}`} /></Grid>
                </Grid>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}


