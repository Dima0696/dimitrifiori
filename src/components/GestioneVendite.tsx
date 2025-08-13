import React from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Button,
  Chip,
  Stack,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Tooltip,
  useMediaQuery,
  useTheme,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaidIcon from '@mui/icons-material/Paid';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
// import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptIcon from '@mui/icons-material/ReceiptLong';
import PrintIcon from '@mui/icons-material/Print';
import AddCardIcon from '@mui/icons-material/AddCard';
import SummarizeIcon from '@mui/icons-material/Summarize';
import EventIcon from '@mui/icons-material/Event';
import { apiService, type OrdineVendita, type DdtVendita, type FatturaVendita, type NotaCreditoVendita, type Cliente } from '../lib/apiService';
import ModernSearchBar from './ui/ModernSearchBar';
import SegmentedControl from './ui/SegmentedControl';
import EmailIcon from '@mui/icons-material/Email';
import { useNavigate } from 'react-router-dom';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileCopyIcon from '@mui/icons-material/FileCopyOutlined';
import CancelIcon from '@mui/icons-material/CancelOutlined';

function StatCard({ title, value, subtitle, color }: { title: string; value: string | number; subtitle?: string; color: string }) {
  return (
    <Box sx={{
      p: 2.5,
      borderRadius: '12px',
      background: `linear-gradient(135deg, ${color}10, ${color}05)`,
      backdropFilter: 'blur(10px)',
      border: `1px solid ${color}22`,
      position: 'relative'
    }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color }}>{value}</Typography>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>{subtitle || title}</Typography>
    </Box>
  );
}

export default function GestioneVendite() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tab, setTab] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ordini, setOrdini] = React.useState<OrdineVendita[]>([]);
  const [ddt, setDdt] = React.useState<DdtVendita[]>([]);
  const [fatture, setFatture] = React.useState<FatturaVendita[]>([]);
  const [scadenziario, setScadenziario] = React.useState<Array<{ fattura_id: number; numero_fattura: string; cliente_nome: string; totale: number; incassato: number; residuo: number; data_fattura: string }>>([]);
  const [noteCredito, setNoteCredito] = React.useState<NotaCreditoVendita[]>([]);
  const [clienti, setClienti] = React.useState<Cliente[]>([]);
  const [dialogIncasso, setDialogIncasso] = React.useState<{ open: boolean; fattura?: FatturaVendita | null; importo: string }>({ open: false, fattura: null, importo: '' });
  const [q, setQ] = React.useState('');
  const [clienteFiltro, setClienteFiltro] = React.useState<Cliente | null>(null);
  const [statoFiltro, setStatoFiltro] = React.useState<string>('');
  const [periodo, setPeriodo] = React.useState<'oggi'|'settimana'|'mese'|'anno'|'tutto'>('tutto');
  const [dataDa, setDataDa] = React.useState<string>('');
  const [dataA, setDataA] = React.useState<string>('');
  const [soloResiduo, setSoloResiduo] = React.useState<boolean>(false);
  const [tipoFatturaFiltro, setTipoFatturaFiltro] = React.useState<'tutte'|'immediata'|'differita'>('tutte');
  const [selectedDdt, setSelectedDdt] = React.useState<DdtVendita | null>(null);
  const [selectedFattura, setSelectedFattura] = React.useState<FatturaVendita | null>(null);
  const [savedViews, setSavedViews] = React.useState<Array<{ name: string; scope: 'ddt'|'fatture'; payload: any }>>(()=>{
    try { return JSON.parse(localStorage.getItem('venditeSavedViews') || '[]'); } catch { return []; }
  });
  const [dialogOrdine, setDialogOrdine] = React.useState<{ open: boolean; cliente: Cliente | null; data: string; note: string; righe: Array<{ quantita: string; prezzo: string; sconto: string }>; }>({ open: false, cliente: null, data: new Date().toISOString().slice(0,10), note: '', righe: [{ quantita: '1', prezzo: '0', sconto: '0' }] });
  const [dialogDDT, setDialogDDT] = React.useState<{ open: boolean; cliente: Cliente | null; data: string; note: string; righe: Array<{ quantita: string; prezzo: string }>; }>({ open: false, cliente: null, data: new Date().toISOString().slice(0,10), note: '', righe: [{ quantita: '1', prezzo: '0' }] });
  const [dialogFattura, setDialogFattura] = React.useState<{ open: boolean; cliente: Cliente | null; data: string; note: string; righe: Array<{ quantita: string; prezzo: string }>; }>({ open: false, cliente: null, data: new Date().toISOString().slice(0,10), note: '', righe: [{ quantita: '1', prezzo: '0' }] });

  const colors = {
    primary: '#f59e0b',
    sales: '#7c3aed',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: 'rgba(148, 163, 184, 0.25)'
  };

  // Stile coerente con GestioneMagazzino
  const modernColors = {
    background: 'rgba(255, 255, 255, 0.95)',
    glass: 'rgba(255, 255, 255, 0.8)',
    primary: '#f59e0b',
    secondary: '#6b7280',
    neutral: '#94a3b8',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: 'rgba(148, 163, 184, 0.25)',
    gradient: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%)',
    accent1: '#f59e0b',
    accent2: '#10b981',
    accent3: '#fb923c',
    accent4: '#111827',
  } as const;

  const btnSx = { borderRadius: 0 } as const;
  const chipSx = { borderRadius: 0 } as const;

  const formatEuro = React.useCallback((n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n || 0), []);
  const inPeriodo = React.useCallback((dateStr?: string | null) => {
    if (!dateStr) return false;
    const d = dateStr;
    if (dataDa && d < dataDa) return false;
    if (dataA && d > dataA) return false;
    if (periodo === 'tutto') return true;
    if (periodo === 'oggi') return d === new Date().toISOString().slice(0, 10);
    if (periodo === 'settimana') {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return d >= start.toISOString().slice(0, 10) && d <= today.toISOString().slice(0, 10);
    }
    if (periodo === 'mese') return d.slice(0, 7) === new Date().toISOString().slice(0, 7);
    if (periodo === 'anno') return d.slice(0, 4) === new Date().getFullYear().toString();
    return true;
  }, [dataDa, dataA, periodo]);

  const scadMap = React.useMemo(() => new Map(scadenziario.map(r => [r.fattura_id, r])), [scadenziario]);

  const statusOptions = React.useMemo(() => {
    if (tab === 1) return ['da_fatturare','fatturato'];
    if (tab === 2) return ['non_pagata','parzialmente_pagata','pagata'];
    return [] as string[];
  }, [tab]);

  const filteredOrdini = React.useMemo(() => (
    ordini
      .filter(o => (q === '' || String(o.numero_ordine || o.id).includes(q) || (o.cliente_nome || '').toLowerCase().includes(q.toLowerCase())))
      .filter(o => (!clienteFiltro || o.cliente_id === clienteFiltro.id))
      .filter(o => (!statoFiltro || o.stato === statoFiltro))
      .filter(o => inPeriodo(o.data_ordine))
  ), [ordini, q, clienteFiltro, statoFiltro, inPeriodo]);

  const filteredDdt = React.useMemo(() => (
    ddt
      .filter(d => (q === '' || String(d.numero_ddt || d.id).includes(q) || (d.cliente_nome || '').toLowerCase().includes(q.toLowerCase())))
      .filter(d => (!clienteFiltro || d.cliente_id === clienteFiltro.id))
      .filter(d => (!statoFiltro || d.stato === statoFiltro))
      .filter(d => inPeriodo(d.data_ddt))
  ), [ddt, q, clienteFiltro, statoFiltro, inPeriodo]);

  const filteredFatture = React.useMemo(() => (
    fatture
      .filter(f => (q === '' || String(f.numero_fattura || f.id).includes(q) || (f.cliente_nome || '').toLowerCase().includes(q.toLowerCase())))
      .filter(f => (!clienteFiltro || f.cliente_id === clienteFiltro.id))
      .filter(f => (!statoFiltro || f.stato === statoFiltro))
      .filter(f => (!soloResiduo || ((scadMap.get(f.id)?.residuo || 0) > 0)))
      .filter(f => (tipoFatturaFiltro === 'tutte' ? true : ((f as any).tipo_fattura || 'immediata') === tipoFatturaFiltro))
      .filter(f => inPeriodo(f.data_fattura))
  ), [fatture, q, clienteFiltro, statoFiltro, inPeriodo, soloResiduo, tipoFatturaFiltro, scadMap]);

  

  const loadAll = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [o, d, f, s, nc, cl] = await Promise.all([
        apiService.getOrdiniVendita(),
        apiService.getDDTVendita(),
        apiService.getFattureVendita(),
        apiService.getScadenziarioClienti(),
        apiService.getNoteCreditoVendita(),
        apiService.getClienti()
      ]);
      setOrdini(o);
      setDdt(d);
      setFatture(f);
      setScadenziario(s);
      setNoteCredito(nc);
      setClienti(cl);
    } catch (err: any) {
      setError(err.message || 'Errore nel caricamento dati vendite');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleGeneraFattura = async (id: number) => {
    try {
      setLoading(true);
      await apiService.generaFatturaVenditaDaDDT(id);
      await loadAll();
    } catch (e: any) {
      setError(e.message || 'Errore generazione fattura');
    } finally {
      setLoading(false);
    }
  };

  const handleAnnullaDDT = async (id: number) => {
    if (!confirm("Confermi l'annullamento del DDT?")) return;
    try {
      setLoading(true);
      await apiService.annullaDDTVendita(id);
      await loadAll();
    } catch (e: any) {
      setError(e.message || 'Errore annullamento DDT');
    } finally { setLoading(false); }
  };

  const handleAnnullaFattura = async (fattura: FatturaVendita) => {
    if (!confirm("Confermi l'annullamento della fattura?")) return;
    try {
      setLoading(true);
      // Per sicurezza ricarico la fattura dal DB (la lista potrebbe non avere tipo_fattura/created_at)
      let reintegra = true; // default: immediate
      try {
        const { fattura: fDett } = await (apiService as any).getFatturaVenditaById(fattura.id);
        const tipo = (fDett && (fDett as any).tipo_fattura) || (fattura as any).tipo_fattura || 'immediata';
        reintegra = tipo === 'immediata';
      } catch {}

      await apiService.annullaFatturaVendita(fattura.id, reintegra);
      await loadAll();
    } catch (e: any) {
      setError(e.message || 'Errore annullamento fattura');
    } finally { setLoading(false); }
  };

  const handleStampaDDT = async (id: number) => {
    try {
      const [{ ddt: d, righe }, gruppi, prodotti, colori, altezze, imballi] = await Promise.all([
        apiService.getDDTVenditaById(id),
        apiService.getGruppi(),
        apiService.getProdotti(),
        apiService.getColori(),
        apiService.getAltezze(),
        apiService.getImballaggi()
      ]);
      const gMap = new Map(gruppi.map((x:any)=>[x.id, x.nome]));
      const pMap = new Map(prodotti.map((x:any)=>[x.id, x.nome]));
      const cMap = new Map(colori.map((x:any)=>[x.id, x.nome]));
      const aMap = new Map(altezze.map((x:any)=>[x.id, x.altezza_cm]));
      const iMap = new Map(imballi.map((x:any)=>[x.id, x.nome]));
      const clienteDett = clienti.find(c => c.id === d.cliente_id) || null;
      const w = window.open('', '_blank');
      if (!w) return;
      const rows = (righe || [])
        .map((r: any) => {
          const gruppo = gMap.get(r.gruppo_id) || '';
          const prodotto = pMap.get(r.prodotto_id) || '';
          const colore = cMap.get(r.colore_id) || '';
          const altezza = aMap.get(r.altezza_id) || '';
          const imballo = iMap.get(r.imballo_id) || '';
          const titolo = `${String(gruppo).toUpperCase()} - ${String(prodotto).toUpperCase()}`;
          const sotto = `${colore} • ${altezza}${altezza ? 'cm' : ''} • ${imballo}`;
          const prezzo = (r.prezzo_unitario ?? r.prezzo_finale ?? 0);
          const imponibileRiga = (Number(r.quantita||0) * Number(prezzo||0));
          return `<tr>
            <td>
              <div style="font-weight:700">${titolo}</div>
              <div style="color:#64748b;font-size:12px">${sotto}</div>
            </td>
            <td style="text-align:right">${r.quantita}</td>
            <td style="text-align:right">€ ${Number(prezzo||0).toFixed(3)}</td>
            <td style="text-align:right">€ ${imponibileRiga.toFixed(2)}</td>
          </tr>`;
        })
        .join('');
      const totImponibile = (righe||[]).reduce((s:any, r:any)=> s + Number(r.quantita||0)*Number(r.prezzo_unitario ?? r.prezzo_finale ?? 0), 0);
      w.document.write(`
        <html><head><title>DDT ${d.numero_ddt || d.id}</title>
        <style>
          *{box-sizing:border-box}
          body{font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial; padding:28px; color:#0f172a}
          h1{margin:0 0 2px}
          .muted{color:#64748b}
          .header{display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #f59e0b; padding-bottom:8px; margin-bottom:12px}
          .badge{background:#f59e0b; color:white; padding:4px 8px; font-weight:700; letter-spacing:.5px}
          table{width:100%;border-collapse:collapse;margin-top:12px}
          th,td{border:1px solid #e5e7eb;padding:8px 10px;text-align:left;vertical-align:top}
          thead th{background:#fff7ed}
          .totali{margin-top:12px; display:flex; gap:16px; justify-content:flex-end}
          .tot-card{border:1px solid #e5e7eb; padding:10px 12px; min-width:220px}
          .label{color:#64748b; font-size:12px}
        </style>
        </head><body>
        <div class="header">
          <div>
            <div class="badge">DOCUMENTO DI TRASPORTO</div>
            <h1>DDT ${d.numero_ddt || d.id}</h1>
            <div class="muted">Data: ${d.data_ddt}</div>
          </div>
          <div>
            <div style="font-weight:700">${d.cliente_nome || clienteDett?.nome || d.cliente_id || ''}</div>
            <div class="muted">${clienteDett?.ragione_sociale || ''}</div>
            <div class="muted">${[clienteDett?.indirizzo, clienteDett?.cap, clienteDett?.citta, clienteDett?.provincia].filter(Boolean).join(' ')}</div>
            <div class="muted">P.IVA: ${clienteDett?.partita_iva || '-'} • CF: ${clienteDett?.codice_fiscale || '-'}</div>
            <div class="muted">Destinazione: ${d.destinazione || '-'}</div>
            <div class="muted">Spedizioniere: ${d.spedizioniere || '-'}</div>
            ${d.note ? `<div class="muted">Note: ${d.note}</div>` : ''}
          </div>
        </div>
        <table>
          <thead><tr><th>Articolo</th><th style="text-align:right">Qta</th><th style="text-align:right">Prezzo</th><th style="text-align:right">Imponibile</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totali">
          <div class="tot-card">
            <div class="label">Totale Imponibile</div>
            <div style="font-weight:800">€ ${totImponibile.toFixed(2)}</div>
          </div>
        </div>
        <script>window.onload=()=>window.print()</script>
        </body></html>`);
      w.document.close();
    } catch (e) {
      alert('Errore stampa DDT');
    }
  };

  const handleStampaFattura = async (id: number) => {
    try {
      const [{ fattura: f, righe }, gruppi, prodotti, colori, altezze, imballi, clientiAll] = await Promise.all([
        apiService.getFatturaVenditaById(id),
        apiService.getGruppi(),
        apiService.getProdotti(),
        apiService.getColori(),
        apiService.getAltezze(),
        apiService.getImballaggi(),
        apiService.getClienti()
      ]);
      const gMap = new Map(gruppi.map((x:any)=>[x.id, x.nome]));
      const pMap = new Map(prodotti.map((x:any)=>[x.id, x.nome]));
      const cMap = new Map(colori.map((x:any)=>[x.id, x.nome]));
      const aMap = new Map(altezze.map((x:any)=>[x.id, x.altezza_cm]));
      const iMap = new Map(imballi.map((x:any)=>[x.id, x.nome]));
      const clienteDett = (clientiAll || []).find((c:any)=>c.id===f.cliente_id) || null;
      const w = window.open('', '_blank');
      if (!w) return;
      const rows = (righe || [])
        .map((r: any) => {
          const gruppo = gMap.get(r.gruppo_id) || '';
          const prodotto = pMap.get(r.prodotto_id) || '';
          const colore = cMap.get(r.colore_id) || '';
          const altezza = aMap.get(r.altezza_id) || '';
          const imballo = iMap.get(r.imballo_id) || '';
          const titolo = `${String(gruppo).toUpperCase()} - ${String(prodotto).toUpperCase()}`;
          const sotto = `${colore} • ${altezza}${altezza ? 'cm' : ''} • ${imballo}`;
          const pu = Number(r.prezzo_unitario||0) * (1 - Number(r.sconto_percentuale||0)/100);
          const imponibileRiga = Number(r.quantita||0) * pu;
          const ivaRiga = Number(r.iva_percentuale||0) * imponibileRiga / 100;
          const totaleRiga = imponibileRiga + ivaRiga;
          return `<tr>
            <td>
              <div style="font-weight:700">${titolo}</div>
              <div style="color:#64748b;font-size:12px">${sotto}</div>
            </td>
            <td style="text-align:right">${r.quantita}</td>
            <td style="text-align:right">€ ${pu.toFixed(3)}</td>
            <td style="text-align:right">${r.sconto_percentuale? r.sconto_percentuale+'%' : ''}</td>
            <td style="text-align:right">${r.iva_percentuale||0}%</td>
            <td style="text-align:right">€ ${imponibileRiga.toFixed(2)}</td>
            <td style="text-align:right">€ ${ivaRiga.toFixed(2)}</td>
            <td style="text-align:right">€ ${totaleRiga.toFixed(2)}</td>
          </tr>`;
        })
        .join('');
      const totImponibile = (righe||[]).reduce((s:any, r:any)=> s + Number(r.quantita||0)* (Number(r.prezzo_unitario||0) * (1-Number(r.sconto_percentuale||0)/100)), 0);
      const totIva = (righe||[]).reduce((s:any, r:any)=> {
        const base = Number(r.quantita||0)* (Number(r.prezzo_unitario||0) * (1-Number(r.sconto_percentuale||0)/100));
        return s + base * (Number(r.iva_percentuale||0)/100);
      }, 0);
      const tot = totImponibile + totIva;
      w.document.write(`
        <html><head><title>Fattura ${f.numero_fattura || f.id}</title>
        <style>
          *{box-sizing:border-box}
          body{font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial; padding:28px; color:#0f172a}
          h1{margin:0 0 2px}
          .muted{color:#64748b}
          .header{display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #f59e0b; padding-bottom:8px; margin-bottom:12px}
          .badge{background:#f59e0b; color:white; padding:4px 8px; font-weight:700; letter-spacing:.5px}
          table{width:100%;border-collapse:collapse;margin-top:12px}
          th,td{border:1px solid #e5e7eb;padding:8px 10px;text-align:left;vertical-align:top}
          thead th{background:#fff7ed}
          .totali{margin-top:12px; display:flex; gap:16px; justify-content:flex-end}
          .tot-card{border:1px solid #e5e7eb; padding:10px 12px; min-width:220px}
          .label{color:#64748b; font-size:12px}
        </style>
        </head><body>
        <div class="header">
          <div>
            <div class="badge">FATTURA</div>
            <h1>${f.numero_fattura || f.id}</h1>
            <div class="muted">Data: ${f.data_fattura}</div>
          </div>
          <div>
            <div style="font-weight:700">${f.cliente_nome || clienteDett?.nome || f.cliente_id || ''}</div>
            <div class="muted">${clienteDett?.ragione_sociale || ''}</div>
            <div class="muted">${[clienteDett?.indirizzo, clienteDett?.cap, clienteDett?.citta, clienteDett?.provincia].filter(Boolean).join(' ')}</div>
            <div class="muted">P.IVA: ${clienteDett?.partita_iva || '-'} • CF: ${clienteDett?.codice_fiscale || '-'}</div>
            <div class="muted">Stato: ${f.stato}</div>
            ${f.note ? `<div class=\"muted\">Note: ${f.note}</div>` : ''}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Articolo</th>
              <th style="text-align:right">Qta</th>
              <th style="text-align:right">Prezzo</th>
              <th style="text-align:right">Sconto</th>
              <th style="text-align:right">IVA</th>
              <th style="text-align:right">Imponibile</th>
              <th style="text-align:right">IVA</th>
              <th style="text-align:right">Totale</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totali">
          <div class="tot-card"><div class="label">Imponibile</div><div style="font-weight:800">€ ${totImponibile.toFixed(2)}</div></div>
          <div class="tot-card"><div class="label">IVA</div><div style="font-weight:800">€ ${totIva.toFixed(2)}</div></div>
          <div class="tot-card"><div class="label">Totale</div><div style="font-weight:800">€ ${tot.toFixed(2)}</div></div>
        </div>
        <script>window.onload=()=>window.print()</script>
        </body></html>`);
      w.document.close();
    } catch (e) {
      alert('Errore stampa Fattura');
    }
  };

  const handleEliminaFattura = async (id: number) => {
    if (!confirm('Eliminare la fattura selezionata?')) return;
    try {
      setLoading(true);
      await apiService.eliminaFatturaVendita(id);
      await loadAll();
    } catch (e: any) {
      setError(e.message || 'Errore eliminazione fattura');
    } finally {
      setLoading(false);
    }
  };

  const handleApriIncasso = (f: FatturaVendita) => setDialogIncasso({ open: true, fattura: f, importo: String(f.totale - (f as any).incassato || 0) });
  const handleRegistraIncasso = async () => {
    if (!dialogIncasso.fattura) return;
    const importo = Number(dialogIncasso.importo || 0);
    if (!(importo > 0)) return;
    try {
      setLoading(true);
      await apiService.registraIncassoVendita({
        fattura_id: dialogIncasso.fattura.id,
        data_pagamento: new Date().toISOString().slice(0, 10),
        importo,
        metodo: 'bonifico',
        note: 'Incasso rapido'
      });
      setDialogIncasso({ open: false, fattura: null, importo: '' });
      await loadAll();
    } catch (e: any) {
      setError(e.message || 'Errore registrazione incasso');
    } finally { setLoading(false); }
  };
  const handleCreaOrdine = async () => {
    if (!dialogOrdine.cliente) return;
    const righePayload = dialogOrdine.righe.map(r => ({
      quantita: Number(r.quantita || 0),
      prezzo_unitario: Number(r.prezzo || 0),
      sconto_percentuale: Number(r.sconto || 0)
    }));
    try {
      setLoading(true);
      await apiService.createOrdineVendita({
        cliente_id: dialogOrdine.cliente.id,
        data_ordine: dialogOrdine.data,
        stato: 'bozza',
        sconto_percentuale: 0,
        note: dialogOrdine.note
      } as any, righePayload as any);
      setDialogOrdine({ open: false, cliente: null, data: new Date().toISOString().slice(0,10), note: '', righe: [{ quantita: '1', prezzo: '0', sconto: '0' }] });
      await loadAll();
    } catch (e: any) { setError(e.message || 'Errore creazione ordine'); } finally { setLoading(false); }
  };
  const handleCreaDDT = async () => {
    if (!dialogDDT.cliente) return;
    const righePayload = dialogDDT.righe.map(r => ({
      quantita: Number(r.quantita || 0),
      prezzo_unitario: Number(r.prezzo || 0),
      prezzo_finale: Number(r.prezzo || 0)
    }));
    try {
      setLoading(true);
      await apiService.createDDTVendita({
        cliente_id: dialogDDT.cliente.id,
        data_ddt: dialogDDT.data,
        stato: 'da_fatturare',
        note: dialogDDT.note
      } as any, righePayload as any);
      setDialogDDT({ open: false, cliente: null, data: new Date().toISOString().slice(0,10), note: '', righe: [{ quantita: '1', prezzo: '0' }] });
      await loadAll();
    } catch (e: any) { setError(e.message || 'Errore creazione DDT'); } finally { setLoading(false); }
  };
  const handleCreaFattura = async () => {
    if (!dialogFattura.cliente) return;
    const righePayload = dialogFattura.righe.map(r => ({
      quantita: Number(r.quantita || 0),
      prezzo_unitario: Number(r.prezzo || 0),
      prezzo_finale: Number(r.prezzo || 0)
    }));
    try {
      setLoading(true);
      await apiService.createFatturaVendita({
        cliente_id: dialogFattura.cliente.id,
        data_fattura: dialogFattura.data,
        stato: 'non_pagata',
        imponibile: 0,
        iva: 0,
        totale: righePayload.reduce((s, r) => s + (r.quantita * r.prezzo_finale), 0),
        note: dialogFattura.note
      } as any, righePayload as any);
      setDialogFattura({ open: false, cliente: null, data: new Date().toISOString().slice(0,10), note: '', righe: [{ quantita: '1', prezzo: '0' }] });
      await loadAll();
    } catch (e: any) { setError(e.message || 'Errore creazione fattura'); } finally { setLoading(false); }
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', mt: 1, background: modernColors.gradient, minHeight: '100vh', p: 2 }}>
      {/* Header glass */}
      <Box sx={{
        mb: 2,
        p: { xs: 2, md: 3 },
        borderRadius: '16px',
        background: modernColors.glass,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${modernColors.border}`,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
      }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: modernColors.text }}>Gestione Vendite</Typography>
          <Typography variant="body2" sx={{ color: modernColors.textSecondary, fontWeight: 500 }}>Ordini, DDT, Fatture e Incassi</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button onClick={() => navigate('/vendite/nuova-fattura')} variant="contained" sx={{
            bgcolor: colors.sales,
            borderRadius: 0,
            color: 'white',
            '&:hover': { bgcolor: '#6d28d9' }
          }}>Nuova Fattura</Button>
          <Button onClick={() => navigate('/vendite/nuovo-ddt')} variant="outlined" sx={{
            borderColor: colors.sales,
            color: colors.sales,
            borderRadius: 0,
            '&:hover': { borderColor: '#6d28d9', bgcolor: '#7c3aed14' }
          }}>Nuovo DDT</Button>
          <Button onClick={() => navigate('/vendite/nuovo-ordine')} variant="outlined" sx={{
            borderColor: modernColors.border,
            color: modernColors.text,
            borderRadius: 0,
            '&:hover': { bgcolor: '#00000007' }
          }}>Nuovo Ordine</Button>
          <Button onClick={() => navigate('/vendite/nuovo-reso')} variant="outlined" sx={{
            borderColor: modernColors.border,
            color: modernColors.text,
            borderRadius: 0,
            '&:hover': { bgcolor: '#00000007' }
          }} startIcon={<AssignmentReturnIcon />}>Reso/NC</Button>
        </Stack>
      </Box>

      <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}><StatCard title="Ordini aperti" value={ordini.filter(o => o.stato !== 'annullato' && o.stato !== 'fatturato').length} color={modernColors.accent1} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="DDT da fatturare" value={ddt.filter(x => x.stato === 'da_fatturare').length} color={modernColors.accent2} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Fatture" value={fatture.filter(f=>f.stato!=='annullata').length} color={modernColors.accent3} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Residuo da incassare" value={scadenziario.reduce((s,x)=>s+(x.residuo||0),0).toFixed(2)} color={modernColors.accent4} /></Grid>
      </Grid>
      </Box>

      {/* Contenitore Tabs in vetro */}
      <Box sx={{ borderRadius: '16px', overflow: 'hidden', background: modernColors.glass, backdropFilter: 'blur(20px)', border: `1px solid ${modernColors.border}`, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              py: 1.75,
              minHeight: 'auto',
              fontWeight: 600,
              fontSize: '0.92rem',
              textTransform: 'none',
              color: modernColors.textSecondary,
              letterSpacing: '-0.01em',
              transition: 'all 0.25s ease',
              borderRight: `1px solid ${modernColors.border}`,
              borderRadius: 0,
              '&.Mui-selected': {
                color: modernColors.text,
                fontWeight: 700,
                background: `${modernColors.primary}14`,
                outline: `2px solid ${modernColors.primary}`,
                outlineOffset: '-2px',
              },
              '&:hover': { color: modernColors.text, background: `${modernColors.primary}10` }
            },
            '& .MuiTabs-indicator': { display: 'none' }
          }}
        >
          <Tab icon={<PointOfSaleIcon />} iconPosition="start" label="Preventivi/Ordini" />
          <Tab icon={<LocalShippingIcon />} iconPosition="start" label="Picking & DDT" />
          <Tab icon={<ReceiptLongIcon />} iconPosition="start" label="Fatture" />
          <Tab icon={<PaidIcon />} iconPosition="start" label="Incassi" />
          <Tab icon={<AssignmentReturnIcon />} iconPosition="start" label="Resi / Note di credito" />
        </Tabs>

        {/* Toolbar filtri sticky */}
        <Box sx={{ p: 2.5, position: 'sticky', top: 0, zIndex: 1, background: modernColors.background, backdropFilter: 'blur(10px)', borderBottom: `1px solid ${modernColors.border}` }}>
          {loading && <CircularProgress size={24} />}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <ModernSearchBar
            placeholder={tab===0?'Cerca ordini...':tab===1?'Cerca DDT...':tab===2?'Cerca fatture...':'Cerca...'}
            value={q}
            onChange={setQ}
            onClear={()=>setQ('')}
            chips={[
              { label: 'Tutti', onClick: ()=>{ setStatoFiltro(''); setClienteFiltro(null); setSoloResiduo(false); setTipoFatturaFiltro('tutte'); } },
              ...(tab===2 ? [
                { label: soloResiduo ? 'Residuo > 0 (ON)' : 'Residuo > 0', onClick: ()=> setSoloResiduo(v=>!v) },
                { label: tipoFatturaFiltro==='immediata' ? 'Immediata (ON)' : 'Immediata', onClick: ()=> setTipoFatturaFiltro(v=> v==='immediata' ? 'tutte' : 'immediata') },
                { label: tipoFatturaFiltro==='differita' ? 'Differita (ON)' : 'Differita', onClick: ()=> setTipoFatturaFiltro(v=> v==='differita' ? 'tutte' : 'differita') },
              ] : [])
            ].concat(savedViews
              .filter(v => (tab===1 && v.scope==='ddt') || (tab===2 && v.scope==='fatture'))
              .map(v => ({ label: `↺ ${v.name}`, onClick: ()=>{
                const p = v.payload||{};
                setQ(p.q||''); setClienteFiltro(p.clienteId ? (clienti.find(c=>c.id===p.clienteId)||null) : null);
                setStatoFiltro(p.stato||''); setPeriodo(p.periodo||'tutto'); setDataDa(p.dataDa||''); setDataA(p.dataA||'');
                setSoloResiduo(!!p.soloResiduo); setTipoFatturaFiltro(p.tipo||'tutte');
              }}))
            )}
            extra={
              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'nowrap', overflowX: 'auto', '::-webkit-scrollbar': { display: 'none' } }}>
                <Autocomplete size="small" sx={{ minWidth: 180 }} options={clienti} value={clienteFiltro}
                  onChange={(_,v)=>setClienteFiltro(v)} getOptionLabel={(o)=>o?.nome||''}
                  renderInput={(p)=><TextField {...p} label="Cliente" />}
                />
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="stato-label">Stato</InputLabel>
                  <Select labelId="stato-label" label="Stato" value={statoFiltro} onChange={(e)=>setStatoFiltro(e.target.value)}>
                    <MenuItem value=""><em>Tutti</em></MenuItem>
                    {statusOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
                <SegmentedControl
                  value={periodo}
                  onChange={(v)=>setPeriodo(v as any)}
                  options={[
                    { label:'Oggi', value:'oggi' },
                    { label:'Sett.', value:'settimana' },
                    { label:'Mese', value:'mese' },
                    { label:'Anno', value:'anno' },
                    { label:'Tutto', value:'tutto' },
                  ]}
                />
                <TextField size="small" type="date" label="Da" value={dataDa} onChange={(e)=>setDataDa(e.target.value)} InputLabelProps={{ shrink:true }} sx={{ width: 150 }} />
                <TextField size="small" type="date" label="A" value={dataA} onChange={(e)=>setDataA(e.target.value)} InputLabelProps={{ shrink:true }} sx={{ width: 150 }} />
                <Button size="small" variant="outlined" onClick={loadAll} sx={btnSx}>Aggiorna</Button>
                {tab!==0 && (
                  <Button size="small" variant="outlined" onClick={()=>{
                    const rows = tab===1 ? filteredDdt : (tab===2 ? filteredFatture : (tab===3 ? scadenziario : noteCredito));
                    const headers = tab===1
                      ? ['numero_ddt','data_ddt','cliente','stato']
                      : tab===2
                        ? ['numero_fattura','data_fattura','cliente','totale','stato','residuo']
                        : tab===3
                          ? ['numero_fattura','data_fattura','cliente','totale','incassato','residuo']
                          : ['numero_nota','data_nota','cliente','totale','stato'];
                    const csv = [headers.join(',')].concat((rows as any[]).map((r:any)=>{
                      if (tab===1) return [r.numero_ddt||r.id, r.data_ddt, (r.cliente_nome||r.cliente_id), r.stato].join(',');
                      if (tab===2) {
                        const residuo = (scadMap.get(r.id)?.residuo || 0);
                        return [r.numero_fattura||r.id, r.data_fattura, (r.cliente_nome||r.cliente_id), Number(r.totale||0).toFixed(2), r.stato, residuo.toFixed(2)].join(',');
                      }
                      if (tab===3) {
                        return [r.numero_fattura, r.data_fattura, r.cliente_nome, Number(r.totale||0).toFixed(2), Number(r.incassato||0).toFixed(2), Number(r.residuo||0).toFixed(2)].join(',');
                      }
                      // tab===4 note credito
                      return [r.numero_nota||r.id, r.data_nota, (r.cliente_nome||r.cliente_id), Number(r.totale||0).toFixed(2), r.stato].join(',');
                    })).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    const name = tab===1 ? 'ddt' : (tab===2 ? 'fatture' : (tab===3 ? 'incassi' : 'note_credito'));
                    a.href = url; a.download = `${name}.csv`; a.click(); URL.revokeObjectURL(url);
                  }} sx={btnSx}>Export CSV</Button>
                )}
                {tab!==0 && (
                  <Button size="small" variant="contained" onClick={()=>{
                    const payload = { q, clienteId: clienteFiltro?.id, stato: statoFiltro, periodo, dataDa, dataA, soloResiduo, tipo: tipoFatturaFiltro };
                    const name = prompt('Nome vista salvata');
                    if (!name) return;
                    const scope = tab===1 ? 'ddt' : 'fatture';
                    const updated = [...savedViews.filter(v=>!(v.name===name && v.scope===scope)), { name, scope, payload }];
                    setSavedViews(updated); localStorage.setItem('venditeSavedViews', JSON.stringify(updated));
                  }} sx={btnSx}>Salva</Button>
                )}
              </Stack>
            }
          />
        </Box>

        <Box sx={{ p: 2.5, background: modernColors.background }}>
          {tab === 0 && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: colors.text }}>Ordini cliente</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={9}>
                  <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>N.</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Stato</TableCell>
                    <TableCell align="right">Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrdini
                    .map(o => (
                    <TableRow key={o.id} hover>
                      <TableCell>{o.numero_ordine || o.id}</TableCell>
                      <TableCell>{o.data_ordine}</TableCell>
                      <TableCell>{o.cliente_nome || o.cliente_id}</TableCell>
                      <TableCell><Chip size="small" label={o.stato} sx={{ borderRadius: 0 }} /></TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton size="small" title="Apri">
                            <PointOfSaleIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                  </Table>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Stack spacing={1.25} sx={{ position: { md:'sticky' }, top: { md: 16 }, p: { md: 0 } }}>
                    <StatCard title="Ordini filtrati" value={filteredOrdini.length} color={colors.sales} />
                    <StatCard title="Aperti" value={filteredOrdini.filter(o=>o.stato!=='annullato' && o.stato!=='fatturato').length} color="#0ea5e9" />
                    <StatCard title="Annullati" value={filteredOrdini.filter(o=>o.stato==='annullato').length} color="#ef4444" />
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          )}
          {tab === 1 && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: colors.text }}>Picking e DDT</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={9}>
                  <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>N.</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Stato</TableCell>
                    <TableCell align="right">Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDdt
                    .map(d => (
                    <TableRow key={d.id} hover selected={selectedDdt?.id===d.id} onClick={()=>setSelectedDdt(d)} sx={{ cursor:'pointer' }}>
                      <TableCell>{d.numero_ddt || d.id}</TableCell>
                      <TableCell>{d.data_ddt}</TableCell>
                      <TableCell>{d.cliente_nome || d.cliente_id}</TableCell>
                      <TableCell>
                        <Chip size="small" label={d.stato}
                          sx={{ borderRadius: 0 }}
                          color={d.stato==='da_fatturare' ? 'warning' : d.stato==='annullato' ? 'error' : 'success'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton size="small" title="Stampa DDT" onClick={(e) => { e.stopPropagation(); handleStampaDDT(d.id); }} disabled={d.stato!=='da_fatturare'}>
                            <PrintIcon fontSize="small" />
                          </IconButton>
                          <Button size="small" variant="outlined" onClick={(e)=>{ e.stopPropagation(); navigate(`/vendite/nuovo-ddt?id=${d.id}`); }} sx={btnSx} disabled={d.stato!=='da_fatturare'}>Modifica</Button>
                          <IconButton size="small" title="Genera Fattura" onClick={(e) => { e.stopPropagation(); handleGeneraFattura(d.id); }} disabled={d.stato !== 'da_fatturare'}>
                            <ReceiptIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" title="Annulla DDT" onClick={(e) => { e.stopPropagation(); handleAnnullaDDT(d.id); }} disabled={d.stato !== 'da_fatturare'}>
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                  </Table>
                </Grid>
                <Grid item xs={12} md={3}>
                  {selectedDdt ? (
                    <Paper elevation={0} sx={{ p:2, border:`1px solid ${modernColors.border}`, background: modernColors.glass, backdropFilter: 'blur(10px)' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight:700, mb:1 }}>Dettagli DDT</Typography>
                      <Stack spacing={0.75} sx={{ mb:1 }}>
                        <Typography variant="body2">N.: <b>{selectedDdt.numero_ddt || selectedDdt.id}</b></Typography>
                        <Typography variant="body2">Data: {selectedDdt.data_ddt}</Typography>
                        <Typography variant="body2">Cliente: {selectedDdt.cliente_nome || selectedDdt.cliente_id}</Typography>
                        <Chip size="small" label={selectedDdt.stato} sx={{ borderRadius:0, width:'fit-content' }} />
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap={'wrap'}>
                        <Button size="small" variant="outlined" onClick={()=>handleStampaDDT(selectedDdt.id)} sx={btnSx} disabled={selectedDdt.stato!=='da_fatturare'}>Stampa</Button>
                        <Button size="small" variant="outlined" onClick={()=>navigate(`/vendite/nuovo-ddt?id=${selectedDdt.id}`)} sx={btnSx} disabled={selectedDdt.stato!=='da_fatturare'}>Modifica</Button>
                        <Button size="small" variant="contained" onClick={()=>handleGeneraFattura(selectedDdt.id)} sx={btnSx} disabled={selectedDdt.stato!=='da_fatturare'}>Fattura</Button>
                        <Button size="small" variant="outlined" color="error" onClick={()=>handleAnnullaDDT(selectedDdt.id)} sx={btnSx} disabled={selectedDdt.stato!=='da_fatturare'}>Annulla</Button>
                      </Stack>
                    </Paper>
                  ) : (
                    <Stack spacing={1.25} sx={{ position: { md:'sticky' }, top: { md: 16 } }}>
                      <StatCard title="DDT filtrati" value={filteredDdt.length} color={colors.sales} />
                      <StatCard title="Da fatturare" value={filteredDdt.filter(x=>x.stato==='da_fatturare').length} color="#0ea5e9" />
                      <StatCard title="Fatturati" value={filteredDdt.filter(x=>x.stato==='fatturato').length} color="#10b981" />
                    </Stack>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
          {tab === 2 && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: colors.text }}>Fatture vendita</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={9}>
                  <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>N.</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell align="right">Totale</TableCell>
                    <TableCell>Stato</TableCell>
                    <TableCell align="right">Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFatture
                    .map(f => (
                    <TableRow key={f.id} hover selected={selectedFattura?.id===f.id} onClick={()=>setSelectedFattura(f)} sx={{ cursor:'pointer' }}>
                      <TableCell>{f.numero_fattura || f.id}</TableCell>
                      <TableCell>{f.data_fattura}</TableCell>
                      <TableCell>{f.cliente_nome || f.cliente_id}</TableCell>
                      <TableCell align="right">€ {Number(f.totale || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip size="small" label={f.stato}
                            sx={{ borderRadius: 0 }}
                            color={f.stato==='annullata' ? 'error' : f.stato==='pagata' ? 'success' : 'default'}
                          />
                          {f.tipo_fattura==='differita' && (
                            <Chip size="small" label="Differita" color="info" variant="outlined" sx={{ borderRadius: 0 }} />
                          )}
                          {!!(f as any).trasmessa_ade_at && (
                            <Chip size="small" label="Inviata ADE" color="success" variant="outlined" sx={{ borderRadius: 0 }} />
                          )}
                          {(!(f as any).trasmessa_ade_at && f.tipo_fattura==='immediata') && (
                            <Chip size="small"
                              label={((new Date().getTime() - new Date((f as any).created_at || f.data_fattura).getTime()) <= 48*3600*1000) ? 'Modificabile <48h' : 'Bloccata >48h'}
                              color={((new Date().getTime() - new Date((f as any).created_at || f.data_fattura).getTime()) <= 48*3600*1000) ? 'warning' : 'default'}
                              variant="outlined"
                              sx={{ borderRadius: 0 }}
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton size="small" title="Stampa/PDF" onClick={(e) => { e.stopPropagation(); handleStampaFattura(f.id); }}>
                            <PrintIcon fontSize="small" />
                          </IconButton>
                          <Button size="small" variant="outlined" onClick={(e)=>{ e.stopPropagation(); navigate(`/vendite/nuova-fattura?id=${f.id}`); }} sx={btnSx}
                            disabled={f.tipo_fattura==='differita' || !!f.trasmessa_ade_at || ((new Date().getTime() - new Date(f.created_at || f.data_fattura).getTime()) > 48*3600*1000)}
                          >Modifica</Button>
                          <IconButton size="small" title="Registra Incasso" onClick={(e) => { e.stopPropagation(); handleApriIncasso(f); }} disabled={f.stato==='annullata'}>
                            <AddCardIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" title="Invia Email" onClick={(e) => { e.stopPropagation();
                            const subject = encodeURIComponent(`Fattura ${f.numero_fattura||f.id}`);
                            const body = encodeURIComponent(`Buongiorno,\n\nLe inviamo il riepilogo della fattura ${f.numero_fattura||f.id} del ${f.data_fattura}.\nTotale: € ${Number(f.totale||0).toFixed(2)}\n\nCordiali saluti.`);
                            window.location.href = `mailto:?subject=${subject}&body=${body}`;
                          }}>
                            <EmailIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" title="Annulla Fattura" onClick={(e) => { e.stopPropagation(); handleAnnullaFattura(f); }}
                            disabled={f.stato==='annullata' || f.tipo_fattura==='differita' || !!f.trasmessa_ade_at || ((new Date().getTime() - new Date(f.created_at || f.data_fattura).getTime()) > 48*3600*1000)}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                          {/* Rimosso Elimina su richiesta: si utilizza solo Annulla */}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                  </Table>
                </Grid>
                <Grid item xs={12} md={3}>
                  {selectedFattura ? (
                    <Paper elevation={0} sx={{ p:2, border:`1px solid ${modernColors.border}`, background: modernColors.glass, backdropFilter: 'blur(10px)' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight:700, mb:1 }}>Dettagli Fattura</Typography>
                      <Stack spacing={0.75} sx={{ mb:1 }}>
                        <Typography variant="body2">N.: <b>{selectedFattura.numero_fattura || selectedFattura.id}</b></Typography>
                        <Typography variant="body2">Data: {selectedFattura.data_fattura}</Typography>
                        <Typography variant="body2">Cliente: {selectedFattura.cliente_nome || selectedFattura.cliente_id}</Typography>
                        <Typography variant="body2">Totale: {formatEuro(Number(selectedFattura.totale||0))}</Typography>
                        <Chip size="small" label={selectedFattura.stato} sx={{ borderRadius:0, width:'fit-content' }} />
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap={'wrap'}>
                        <Button size="small" variant="outlined" onClick={()=>handleStampaFattura(selectedFattura.id)} sx={btnSx}>Stampa</Button>
                        <Button size="small" variant="outlined" onClick={()=>navigate(`/vendite/nuova-fattura?id=${selectedFattura.id}`)} sx={btnSx}
                          disabled={selectedFattura.tipo_fattura==='differita' || !!(selectedFattura as any).trasmessa_ade_at || ((new Date().getTime() - new Date((selectedFattura as any).created_at || selectedFattura.data_fattura).getTime()) > 48*3600*1000)}
                        >Modifica</Button>
                        <Button size="small" variant="contained" onClick={()=>handleApriIncasso(selectedFattura)} sx={btnSx} disabled={selectedFattura.stato==='annullata'}>Incasso</Button>
                        <Button size="small" variant="outlined" color="error" onClick={()=>handleAnnullaFattura(selectedFattura)} sx={btnSx}
                          disabled={selectedFattura.stato==='annullata' || selectedFattura.tipo_fattura==='differita' || !!(selectedFattura as any).trasmessa_ade_at || ((new Date().getTime() - new Date((selectedFattura as any).created_at || selectedFattura.data_fattura).getTime()) > 48*3600*1000)}
                        >Annulla</Button>
                      </Stack>
                    </Paper>
                  ) : (
                    <Stack spacing={1.25} sx={{ position: { md:'sticky' }, top: { md: 16 } }}>
                      <StatCard title="Fatture filtrate" value={filteredFatture.length} color={colors.sales} />
                      <StatCard title="Totale (filtrate)" value={formatEuro(filteredFatture.reduce((s,f)=>s+Number(f.totale||0),0))} color="#10b981" />
                      <StatCard title="Residuo (filtrate)" value={formatEuro(filteredFatture.reduce((s,f)=> s + (scadMap.get(f.id)?.residuo || 0), 0))} color="#ef4444" />
                    </Stack>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
          {tab === 3 && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: colors.text }}>Incassi</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>N. Fattura</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell align="right">Totale</TableCell>
                    <TableCell align="right">Incassato</TableCell>
                    <TableCell align="right">Residuo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scadenziario.map(r => (
                    <TableRow key={r.fattura_id} hover>
                      <TableCell>{r.numero_fattura}</TableCell>
                      <TableCell>{r.data_fattura}</TableCell>
                      <TableCell>{r.cliente_nome}</TableCell>
                      <TableCell align="right">€ {Number(r.totale || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">€ {Number(r.incassato || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">€ {Number(r.residuo || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
          {tab === 4 && (
            <Box>
              <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: colors.text }}>Resi e Note di credito</Typography>
                <Button size="small" variant="outlined" startIcon={<AssignmentReturnIcon />} onClick={()=>navigate('/vendite/nuovo-reso')} sx={{ borderRadius: 0 }}>Nuovo Reso/NC</Button>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>N. Nota</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell align="right">Totale</TableCell>
                    <TableCell>Stato</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {noteCredito.map(n => (
                    <TableRow key={n.id} hover>
                      <TableCell>{n.numero_nota || n.id}</TableCell>
                      <TableCell>{n.data_nota}</TableCell>
                      <TableCell>{n.cliente_nome || n.cliente_id}</TableCell>
                      <TableCell align="right">€ {Number(n.totale || 0).toFixed(2)}</TableCell>
                      <TableCell><Chip size="small" label={n.stato} sx={{ borderRadius: 0 }} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      </Box>

      {/* Fatturazione differita */}
      <Box sx={{ mt: 2, display: tab===1 ? 'block':'none' }}>
        <Paper elevation={0} sx={{ p: 2, border: `1px solid ${modernColors.border}`, background: modernColors.glass, backdropFilter: 'blur(10px)' }}>
          <Stack direction={{ xs:'column', md:'row' }} spacing={1} alignItems={{ md:'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: colors.text }}>Fatturazione differita</Typography>
            <TextField size="small" label="Anno" defaultValue={new Date().getFullYear()} id="diff-anno" />
            <TextField size="small" label="Mese (1-12)" defaultValue={new Date().getMonth()+1} id="diff-mese" />
            <Autocomplete size="small" options={clienti} getOptionLabel={(o)=>o.nome||''} onChange={(_,v:any)=>((window as any).__diffCliente=v)} renderInput={(p)=><TextField {...p} label="Cliente (opzionale)" />} sx={{ minWidth: 260 }} />
            <Button variant="outlined" startIcon={<EventIcon />} sx={{ borderRadius: 0 }} onClick={async()=>{
              const anno = Number((document.getElementById('diff-anno') as HTMLInputElement)?.value||0);
              const mese = Number((document.getElementById('diff-mese') as HTMLInputElement)?.value||0);
              const cliente = (window as any).__diffCliente; 
              try {
                await apiService.generaFattureDifferite(anno,mese,cliente?.id);
                await loadAll();
                alert('Fatture differite generate');
              } catch(e:any){ alert(e.message||'Errore fatturazione differita'); }
            }}>Genera fatture</Button>
          </Stack>
        </Paper>
      </Box>

      <Dialog open={dialogIncasso.open} onClose={() => setDialogIncasso({ open: false, fattura: null, importo: '' })}>
        <DialogTitle>Registra incasso</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>Fattura: {dialogIncasso.fattura?.numero_fattura}</Typography>
          <TextField
            fullWidth
            label="Importo"
            type="number"
            value={dialogIncasso.importo}
            onChange={(e) => setDialogIncasso(v => ({ ...v, importo: e.target.value }))}
            inputProps={{ step: '0.01', min: '0' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogIncasso({ open: false, fattura: null, importo: '' })}>Annulla</Button>
          <Button variant="contained" onClick={handleRegistraIncasso} sx={{ borderRadius: 0 }}>Conferma</Button>
        </DialogActions>
      </Dialog>

      {/* Nuovo Ordine */}
      <Dialog open={dialogOrdine.open} onClose={() => setDialogOrdine(v => ({ ...v, open: false }))} fullWidth maxWidth="sm">
        <DialogTitle>Nuovo Ordine</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={clienti}
            getOptionLabel={(o) => o.nome || ''}
            value={dialogOrdine.cliente}
            onChange={(_, val) => setDialogOrdine(v => ({ ...v, cliente: val }))}
            renderInput={(p) => <TextField {...p} label="Cliente" margin="dense" />}
          />
          <TextField fullWidth margin="dense" label="Data" type="date" value={dialogOrdine.data} onChange={(e)=>setDialogOrdine(v=>({...v,data:e.target.value}))} InputLabelProps={{ shrink: true }} />
          <TextField fullWidth margin="dense" label="Note" value={dialogOrdine.note} onChange={(e)=>setDialogOrdine(v=>({...v,note:e.target.value}))} />
          {dialogOrdine.righe.map((r,idx)=> (
            <Stack key={idx} direction="row" spacing={1} sx={{ mt: 1 }}>
              <TextField label="Qta" type="number" value={r.quantita} onChange={(e)=>{ const val=e.target.value; setDialogOrdine(v=>{ const righe=[...v.righe]; righe[idx]={...righe[idx], quantita: val}; return {...v, righe}; }); }} />
              <TextField label="Prezzo" type="number" value={r.prezzo} onChange={(e)=>{ const val=e.target.value; setDialogOrdine(v=>{ const righe=[...v.righe]; righe[idx]={...righe[idx], prezzo: val}; return {...v, righe}; }); }} />
              <TextField label="Sconto %" type="number" value={r.sconto} onChange={(e)=>{ const val=e.target.value; setDialogOrdine(v=>{ const righe=[...v.righe]; righe[idx]={...righe[idx], sconto: val}; return {...v, righe}; }); }} />
            </Stack>
          ))}
          <Button size="small" onClick={()=>setDialogOrdine(v=>({...v, righe:[...v.righe, { quantita:'1', prezzo:'0', sconto:'0'}]}))}>Aggiungi riga</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setDialogOrdine(v=>({...v, open:false}))}>Annulla</Button>
          <Button variant="contained" onClick={handleCreaOrdine} sx={{ borderRadius: 0 }}>Crea</Button>
        </DialogActions>
      </Dialog>

      {/* Nuovo DDT */}
      <Dialog open={dialogDDT.open} onClose={() => setDialogDDT(v => ({ ...v, open: false }))} fullWidth maxWidth="sm">
        <DialogTitle>Nuovo DDT</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={clienti}
            getOptionLabel={(o) => o.nome || ''}
            value={dialogDDT.cliente}
            onChange={(_, val) => setDialogDDT(v => ({ ...v, cliente: val }))}
            renderInput={(p) => <TextField {...p} label="Cliente" margin="dense" />}
          />
          <TextField fullWidth margin="dense" label="Data" type="date" value={dialogDDT.data} onChange={(e)=>setDialogDDT(v=>({...v,data:e.target.value}))} InputLabelProps={{ shrink: true }} />
          <TextField fullWidth margin="dense" label="Note" value={dialogDDT.note} onChange={(e)=>setDialogDDT(v=>({...v,note:e.target.value}))} />
          {dialogDDT.righe.map((r,idx)=> (
            <Stack key={idx} direction="row" spacing={1} sx={{ mt: 1 }}>
              <TextField label="Qta" type="number" value={r.quantita} onChange={(e)=>{ const val=e.target.value; setDialogDDT(v=>{ const righe=[...v.righe]; righe[idx]={...righe[idx], quantita: val}; return {...v, righe}; }); }} />
              <TextField label="Prezzo" type="number" value={r.prezzo} onChange={(e)=>{ const val=e.target.value; setDialogDDT(v=>{ const righe=[...v.righe]; righe[idx]={...righe[idx], prezzo: val}; return {...v, righe}; }); }} />
            </Stack>
          ))}
          <Button size="small" onClick={()=>setDialogDDT(v=>({...v, righe:[...v.righe, { quantita:'1', prezzo:'0'}]}))}>Aggiungi riga</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setDialogDDT(v=>({...v, open:false}))}>Annulla</Button>
          <Button variant="contained" onClick={handleCreaDDT} sx={{ borderRadius: 0 }}>Crea</Button>
        </DialogActions>
      </Dialog>

      {/* Nuova Fattura */}
      <Dialog open={dialogFattura.open} onClose={() => setDialogFattura(v => ({ ...v, open: false }))} fullWidth maxWidth="sm">
        <DialogTitle>Nuova Fattura</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={clienti}
            getOptionLabel={(o) => o.nome || ''}
            value={dialogFattura.cliente}
            onChange={(_, val) => setDialogFattura(v => ({ ...v, cliente: val }))}
            renderInput={(p) => <TextField {...p} label="Cliente" margin="dense" />}
          />
          <TextField fullWidth margin="dense" label="Data" type="date" value={dialogFattura.data} onChange={(e)=>setDialogFattura(v=>({...v,data:e.target.value}))} InputLabelProps={{ shrink: true }} />
          <TextField fullWidth margin="dense" label="Note" value={dialogFattura.note} onChange={(e)=>setDialogFattura(v=>({...v,note:e.target.value}))} />
          {dialogFattura.righe.map((r,idx)=> (
            <Stack key={idx} direction="row" spacing={1} sx={{ mt: 1 }}>
              <TextField label="Qta" type="number" value={r.quantita} onChange={(e)=>{ const val=e.target.value; setDialogFattura(v=>{ const righe=[...v.righe]; righe[idx]={...righe[idx], quantita: val}; return {...v, righe}; }); }} />
              <TextField label="Prezzo" type="number" value={r.prezzo} onChange={(e)=>{ const val=e.target.value; setDialogFattura(v=>{ const righe=[...v.righe]; righe[idx]={...righe[idx], prezzo: val}; return {...v, righe}; }); }} />
            </Stack>
          ))}
          <Button size="small" onClick={()=>setDialogFattura(v=>({...v, righe:[...v.righe, { quantita:'1', prezzo:'0'}]}))}>Aggiungi riga</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setDialogFattura(v=>({...v, open:false}))}>Annulla</Button>
          <Button variant="contained" onClick={handleCreaFattura} sx={{ borderRadius: 0 }}>Crea</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


