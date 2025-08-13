import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Grid,
  TextField,
  Autocomplete,
  Paper,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  IconButton,
  Chip,
  Stack,
  Tooltip,
  Divider
} from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { apiService, type Cliente } from '../../lib/apiService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';
import { safeBack } from '../../lib/navigation';

type Mode = 'ddt' | 'fattura';

type RigaUI = {
  giacenza: any | null;
  quantita: string; // in steli, multipli di imballo
  livello: 'L1'|'L2'|'L3';
  prezzo: string;
  sconto: string;
  iva: string;
  imballoQuant?: number;
  // Metadati per modifiche: servono per consentire reintegro dal lotto originale
  originaleQuantita?: number;
  originalDocumentoCaricoId?: number;
};

export default function SalesDocWizardCore({ mode, existing }: { mode: Mode; existing?: { id: number; ddt?: any; righe?: any[]; fattura?: any } }) {
  const navigate = useNavigate();
  const [active, setActive] = React.useState(0);
  const [clienti, setClienti] = React.useState<Cliente[]>([]);
  const [giacenze, setGiacenze] = React.useState<any[]>([]);
  const [cliente, setCliente] = React.useState<Cliente | null>(null);
  const [data, setData] = React.useState<string>(new Date().toISOString().slice(0,10));
  const [note, setNote] = React.useState('');
  const [destinazione, setDestinazione] = React.useState('');
  const [spedizioniere, setSpedizioniere] = React.useState('');
  const [metodoPagamento, setMetodoPagamento] = React.useState<'contanti'|'pos'|'assegno'>('contanti');
  const [dataScadenza, setDataScadenza] = React.useState<string>(new Date().toISOString().slice(0,10));
  const [righe, setRighe] = React.useState<RigaUI[]>([
    { giacenza: null, quantita: '1', livello: 'L1', prezzo: '0', sconto: '0', iva: '10' }
  ]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const summaryRef = React.useRef<HTMLDivElement>(null);
  const [quickEdit, setQuickEdit] = React.useState<boolean>(true);
  const [savedId, setSavedId] = React.useState<number | undefined>(existing?.id);

  React.useEffect(() => {
    // Rende disponibile html2canvas a jsPDF.html
    (window as any).html2canvas = html2canvas;
  }, []);

  const accent = '#7c3aed';
  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 0,
      background: 'rgba(255,255,255,0.9)'
    },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124,58,237,0.25)' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124,58,237,0.45)' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: accent, boxShadow: `0 0 0 2px ${accent}33` },
  } as const;

  React.useEffect(()=>{
    Promise.all([
      apiService.getClienti(),
      apiService.getGiacenzeMagazzino()
    ]).then(([cl, gz])=>{ setClienti(cl); setGiacenze(gz); }).catch(e=>setError(e.message||'Errore caricamento dati'));
  },[]);

  // Flag stato documento per banner e readonly
  const isFattura = mode === 'fattura';
  const f: any = existing?.fattura || null;
  const d: any = existing?.ddt || null;
  const annullato = isFattura ? (f?.stato === 'annullata') : (d?.stato === 'annullato');
  const differita = isFattura && f?.tipo_fattura === 'differita';
  const inviataADE = isFattura && !!f?.trasmessa_ade_at;
  const oltre48h = isFattura && f?.tipo_fattura === 'immediata' && (() => {
    try {
      const created = new Date(f?.created_at || f?.data_fattura).getTime();
      return (Date.now() - created) > (48*3600*1000);
    } catch { return false; }
  })();
  const readOnly = !!(annullato || differita || inviataADE || oltre48h);

  // Prefill in modalità modifica DDT
  React.useEffect(()=>{
    if (mode !== 'ddt' || !existing) return;
    const d = existing.ddt;
    if (d) {
      setData(d.data_ddt || new Date().toISOString().slice(0,10));
      setDestinazione(d.destinazione || '');
      setSpedizioniere(d.spedizioniere || '');
      setNote(d.note || '');
    }
  }, [mode, existing]);

  // Prefill in modalità modifica Fattura
  React.useEffect(()=>{
    if (mode !== 'fattura' || !existing?.fattura) return;
    const f = existing.fattura;
    setData(f.data_fattura || new Date().toISOString().slice(0,10));
    setNote(f.note || '');
  }, [mode, existing]);

  // Quando ho clienti caricati, imposto il cliente della FATTURA esistente
  React.useEffect(()=>{
    if (mode !== 'fattura' || !existing?.fattura) return;
    const found = clienti.find(c => c.id === existing.fattura.cliente_id) || null;
    if (found) setCliente(found);
  }, [clienti, existing, mode]);

  // Righe precompilate per FATTURA quando ho giacenze caricate
  React.useEffect(()=>{
    if (mode !== 'fattura' || !existing?.righe) return;
    (async () => {
      // Crea fallback articolo anche se non più in giacenza (>0)
      let gMap = new Map<number,string>();
      let pMap = new Map<number,string>();
      let cMap = new Map<number,string>();
      let aMap = new Map<number, any>();
      let iName = new Map<number,string>();
      let iQty = new Map<number, number>();
      try {
        const [gruppi, prodotti, colori, altezze, imballi] = await Promise.all([
          apiService.getGruppi(),
          apiService.getProdotti(),
          apiService.getColori(),
          apiService.getAltezze(),
          apiService.getImballaggi()
        ]);
        gMap = new Map(gruppi.map((x:any)=>[x.id, x.nome]));
        pMap = new Map(prodotti.map((x:any)=>[x.id, x.nome]));
        cMap = new Map(colori.map((x:any)=>[x.id, x.nome]));
        aMap = new Map(altezze.map((x:any)=>[x.id, x.altezza_cm]));
        iName = new Map(imballi.map((x:any)=>[x.id, x.nome]));
        iQty = new Map(imballi.map((x:any)=>[x.id, x.quantita || x.qta || 1]));
      } catch {}

      const rawRows = (existing.righe || []).map((r: any) => {
        let match = giacenze.find((g: any) => g.articolo_id === r.articolo_id) || null;
        if (!match) {
          // Fallback sintetico per visualizzazione/modifica
          match = {
            articolo_id: r.articolo_id,
            gruppo_id: r.gruppo_id,
            prodotto_id: r.prodotto_id,
            colore_id: r.colore_id,
            imballo_id: r.imballo_id,
            altezza_id: r.altezza_id,
            qualita_id: r.qualita_id,
            carico_id: r.documento_carico_id || null,
            gruppo_nome: gMap.get(r.gruppo_id) || '',
            prodotto_nome: pMap.get(r.prodotto_id) || '',
            colore_nome: cMap.get(r.colore_id) || '',
            imballo_nome: iName.get(r.imballo_id) || '',
            altezza_cm: aMap.get(r.altezza_id) || '',
            imballo_quantita: iQty.get(r.imballo_id) || 1,
            quantita_giacenza: 0
          } as any;
        }
        const imballo = Number(match?.imballo_quantita || 1);
        const prezzoBase = (typeof r.prezzo_unitario === 'number' ? r.prezzo_unitario : (typeof r.prezzo_finale === 'number' ? r.prezzo_finale : 0));
        return {
          giacenza: match,
          quantita: String(r.quantita || imballo),
          livello: 'L1' as const,
          prezzo: String(prezzoBase || 0),
          sconto: String(r.sconto_percentuale ?? 0),
          iva: String(r.iva_percentuale ?? 10),
          imballoQuant: imballo,
          originaleQuantita: Number(r.quantita || 0),
          originalDocumentoCaricoId: Number(r.documento_carico_id || 0)
        } as RigaUI;
      });
      // Dedupe: una sola riga per documento_carico_id (o articolo)
      const map = new Map<string, RigaUI>();
      rawRows.forEach((rw, idx) => {
        const key = String(rw.giacenza?.carico_id ?? `art-${rw.giacenza?.articolo_id ?? idx}`);
        map.set(key, rw); // mantiene l'ultima occorrenza
      });
      const rows = Array.from(map.values());
      if (rows.length) setRighe(rows);
    })();
  }, [giacenze, existing, mode]);

  // Quando ho clienti caricati, imposto il cliente del DDT esistente
  React.useEffect(()=>{
    if (mode !== 'ddt' || !existing?.ddt) return;
    const found = clienti.find(c => c.id === existing.ddt.cliente_id) || null;
    if (found) setCliente(found);
  }, [clienti, existing, mode]);

  // Righe precompilate quando ho giacenze caricate (DDT)
  React.useEffect(()=>{
    if (mode !== 'ddt' || !existing?.righe) return;
    const rawRows = (existing.righe || []).map((r: any) => {
      let match = giacenze.find((g: any) => g.articolo_id === r.articolo_id) || null;
      if (!match) {
        match = {
          articolo_id: r.articolo_id,
          gruppo_id: r.gruppo_id,
          prodotto_id: r.prodotto_id,
          colore_id: r.colore_id,
          imballo_id: r.imballo_id,
          altezza_id: r.altezza_id,
          qualita_id: r.qualita_id,
          carico_id: r.documento_carico_id || null,
          gruppo_nome: '',
          prodotto_nome: '',
          colore_nome: '',
          imballo_nome: '',
          altezza_cm: '',
          imballo_quantita: 1,
          quantita_giacenza: 0
        } as any;
      }
      const imballo = Number(match?.imballo_quantita || 1);
      return {
        giacenza: match,
        quantita: String(r.quantita || imballo),
        livello: 'L1' as const,
        prezzo: String(r.prezzo_unitario ?? r.prezo_finale ?? r.prezzo_finale ?? 0),
        sconto: '0',
        iva: String(r.iva_percentuale ?? 10),
        imballoQuant: imballo,
        originaleQuantita: Number(r.quantita || 0),
        originalDocumentoCaricoId: Number(r.documento_carico_id || 0)
      } as RigaUI;
    });
    const map = new Map<string, RigaUI>();
    rawRows.forEach((rw, idx) => {
      const key = String(rw.giacenza?.carico_id ?? `art-${rw.giacenza?.articolo_id ?? idx}`);
      map.set(key, rw);
    });
    const rows = Array.from(map.values());
    if (rows.length) setRighe(rows);
  }, [giacenze, existing, mode]);

  const steps = [
    'Cliente',
    mode === 'ddt' ? 'Articoli & Scadenza' : 'Articoli & Pagamento',
    'Riepilogo'
  ];

  const handleListinoChange = (idx: number, livello: 'L1'|'L2'|'L3') => {
    const arr = [...righe];
    const g = arr[idx].giacenza;
    const prezzoDefault = g ? (livello==='L1'?g.prezzo_vendita_1:livello==='L2'?g.prezzo_vendita_2:g.prezzo_vendita_3) : arr[idx].prezzo;
    arr[idx] = { ...arr[idx], livello, prezzo: String(prezzoDefault || 0) };
    setRighe(arr);
  };

  const handleSelectGiacenza = (idx: number, giacenza: any | null) => {
    const arr = [...righe];
    const livello = arr[idx].livello;
    const prezzo = giacenza ? (livello==='L1'?giacenza.prezzo_vendita_1:livello==='L2'?giacenza.prezzo_vendita_2:giacenza.prezzo_vendita_3) : 0;
    const imballo = Number(giacenza?.imballo_quantita || 1);
    arr[idx] = { ...arr[idx], giacenza, prezzo: String(prezzo || 0), imballoQuant: imballo, quantita: String(imballo) };
    setRighe(arr);
  };

  const addRiga = () => setRighe([...righe, { giacenza: null, quantita: '1', livello: 'L1', prezzo: '0', sconto: '0', iva: '10' }]);
  const removeRiga = (idx: number) => { const arr=[...righe]; arr.splice(idx,1); setRighe(arr); };

  const getDisponibilitaEffettiva = (r: RigaUI) => {
    if (!r.giacenza) return true;
    const q = Number(r.quantita || 0);
    const imballo = Number(r.imballoQuant || r.giacenza?.imballo_quantita || 1);
    const available = Number(r.giacenza?.quantita_giacenza || 0);
    const bonus = (r.originalDocumentoCaricoId && r.giacenza?.carico_id === r.originalDocumentoCaricoId) ? Number(r.originaleQuantita || 0) : 0;
    const effective = available + bonus;
    if (q <= 0 || q % imballo !== 0) return 0; // segnaliamo invalido tramite 0
    return effective;
  };
  const isImballoInvalid = (r: RigaUI) => {
    if (!r.giacenza) return true;
    const q = Number(r.quantita || 0);
    const imballo = Number(r.imballoQuant || r.giacenza?.imballo_quantita || 1);
    const effective = getDisponibilitaEffettiva(r);
    if (effective === 0) return true;
    const exceeds = q > effective;
    return q <= 0 || q % imballo !== 0 || exceeds;
  };
  const validRows = React.useMemo(() => righe.filter(r => !!r.giacenza && Number(r.quantita || 0) > 0), [righe]);
  const canProceed = !!cliente && validRows.length > 0 && validRows.every(r => !isImballoInvalid(r));

  const imponibile = validRows.reduce((s, r) => {
    const q = Number(r.quantita||0);
    const p = Number(r.prezzo||0);
    return s + (q * p);
  }, 0);
  const totaleIva = validRows.reduce((s, r) => {
    const q = Number(r.quantita||0);
    const p = Number(r.prezzo||0);
    const ivaPerc = Number(r.iva||0);
    const base = q * p;
    return s + base * (ivaPerc/100);
  }, 0);
  const totale = imponibile + (mode==='fattura' ? totaleIva : 0);

  // KPI: ricarico medio (markup) e globale
  const kpi = React.useMemo(() => {
    let qtyTot = 0;
    let markupWeightedSum = 0;
    let totalCost = 0;
    validRows.forEach(r => {
      const q = Number(r.quantita||0);
      const costUnit = Number(r.giacenza?.prezzo_costo_finale_per_stelo || r.giacenza?.prezzo_acquisto_per_stelo || 0);
      const priceUnit = Number(r.prezzo||0);
      if (q > 0 && costUnit > 0) {
        qtyTot += q;
        markupWeightedSum += ((priceUnit - costUnit) / costUnit) * 100 * q;
        totalCost += costUnit * q;
      }
    });
    const markupWeighted = qtyTot > 0 ? (markupWeightedSum / qtyTot) : 0;
    const markupGlobal = totalCost > 0 ? ((imponibile - totalCost) / totalCost) * 100 : 0;
    return { qtyTot, markupWeighted, markupGlobal, totalCost };
  }, [validRows, imponibile]);

  const handlePrint = () => {
    window.print();
  };

  const buildDDTHtmlById = async (ddtId: number): Promise<{ html: string; fileName: string }> => {
    try {
      const [{ ddt, righe }, gruppi, prodotti, colori, altezze, imballi] = await Promise.all([
        apiService.getDDTVenditaById(ddtId),
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
      const clienteDett = clienti.find(c => c.id === ddt.cliente_id) || null;
      const rows = (righe || []).map((r: any) => {
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
          <td><div style="font-weight:700">${titolo}</div><div style=\"color:#64748b;font-size:12px\">${sotto}</div></td>
          <td style=\"text-align:right\">${r.quantita}</td>
          <td style=\"text-align:right\">€ ${Number(prezzo||0).toFixed(3)}</td>
          <td style=\"text-align:right\">€ ${imponibileRiga.toFixed(2)}</td>
        </tr>`;
      }).join('');
      const totImponibile = (righe||[]).reduce((s:any, r:any)=> s + Number(r.quantita||0)*Number(r.prezzo_unitario ?? r.prezzo_finale ?? 0), 0);
      const html = `
        <div data-doc-root>
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
        <div class="header">
          <div>
            <div class="badge">DOCUMENTO DI TRASPORTO</div>
            <h1>DDT ${ddt.numero_ddt || ddt.id}</h1>
            <div class="muted">Data: ${ddt.data_ddt}</div>
          </div>
          <div>
            <div style="font-weight:700">${ddt.cliente_nome || clienteDett?.nome || ddt.cliente_id || ''}</div>
            <div class="muted">${clienteDett?.ragione_sociale || ''}</div>
            <div class="muted">${[clienteDett?.indirizzo, clienteDett?.cap, clienteDett?.citta, clienteDett?.provincia].filter(Boolean).join(' ')}</div>
            <div class="muted">P.IVA: ${clienteDett?.partita_iva || '-'} • CF: ${clienteDett?.codice_fiscale || '-'}</div>
            <div class="muted">Destinazione: ${ddt.destinazione || '-'}</div>
            <div class="muted">Spedizioniere: ${ddt.spedizioniere || '-'}</div>
            ${ddt.note ? `<div class="muted">Note: ${ddt.note}</div>` : ''}
          </div>
        </div>
        <table>
          <thead><tr><th>Articolo</th><th style=\"text-align:right\">Qta</th><th style=\"text-align:right\">Prezzo</th><th style=\"text-align:right\">Imponibile</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totali">
          <div class="tot-card"><div class="label">Totale Imponibile</div><div style="font-weight:800">€ ${totImponibile.toFixed(2)}</div></div>
        </div>
        </div>`;
      return { html, fileName: `DDT-${ddt.numero_ddt || ddt.id}.pdf` };
    } catch { return { html: '<div />', fileName: 'DDT.pdf' }; }
  };

  const stampaDDTById = async (ddtId: number) => {
    const built = await buildDDTHtmlById(ddtId);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${built.fileName.replace(/\.pdf$/, '')}</title></head><body>${built.html}<script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  const buildFatturaHtmlById = async (fatturaId: number): Promise<{ html: string; fileName: string }> => {
    try {
      const [{ fattura: f, righe }, gruppi, prodotti, colori, altezze, imballi] = await Promise.all([
        apiService.getFatturaVenditaById(fatturaId),
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
      const clienteDett = clienti.find(c => c.id === f.cliente_id) || null;
      const rows = (righe || []).map((r: any) => {
        const gruppo = gMap.get(r.gruppo_id) || '';
        const prodotto = pMap.get(r.prodotto_id) || '';
        const colore = cMap.get(r.colore_id) || '';
        const altezza = aMap.get(r.altezza_id) || '';
        const imballo = iMap.get(r.imballo_id) || '';
        const titolo = `${String(gruppo).toUpperCase()} - ${String(prodotto).toUpperCase()}`;
        const sotto = `${colore} • ${altezza}${altezza ? 'cm' : ''} • ${imballo}`;
      const pu = Number(r.prezzo_unitario||0);
        const imponibileRiga = Number(r.quantita||0) * pu;
        const ivaRiga = Number(r.iva_percentuale||0) * imponibileRiga / 100;
        const totaleRiga = imponibileRiga + ivaRiga;
        return `<tr>
          <td><div style=\"font-weight:700\">${titolo}</div><div style=\"color:#64748b;font-size:12px\">${sotto}</div></td>
          <td style=\"text-align:right\">${r.quantita}</td>
          <td style=\"text-align:right\">€ ${pu.toFixed(3)}</td>
          
          <td style=\"text-align:right\">${r.iva_percentuale||0}%</td>
          <td style=\"text-align:right\">€ ${imponibileRiga.toFixed(2)}</td>
          <td style=\"text-align:right\">€ ${ivaRiga.toFixed(2)}</td>
          <td style=\"text-align:right\">€ ${totaleRiga.toFixed(2)}</td>
        </tr>`;
      }).join('');
      const totImponibile = (righe||[]).reduce((s:any, r:any)=> s + Number(r.quantita||0)* Number(r.prezzo_unitario||0), 0);
      const totIva = (righe||[]).reduce((s:any, r:any)=> {
        const base = Number(r.quantita||0)* Number(r.prezzo_unitario||0);
        return s + base * (Number(r.iva_percentuale||0)/100);
      }, 0);
      const tot = totImponibile + totIva;
      const html = `
        <div data-doc-root>
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
            ${f.note ? `<div class="muted">Note: ${f.note}</div>` : ''}
          </div>
        </div>
        <table>
          <thead><tr><th>Articolo</th><th style=\"text-align:right\">Qta</th><th style=\"text-align:right\">Prezzo</th><th style=\"text-align:right\">IVA %</th><th style=\"text-align:right\">Imponibile</th><th style=\"text-align:right\">IVA</th><th style=\"text-align:right\">Totale</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totali">
          <div class="tot-card"><div class="label">Imponibile</div><div style="font-weight:800">€ ${totImponibile.toFixed(2)}</div></div>
          <div class="tot-card"><div class="label">IVA</div><div style="font-weight:800">€ ${totIva.toFixed(2)}</div></div>
          <div class="tot-card"><div class="label">Totale</div><div style="font-weight:800">€ ${tot.toFixed(2)}</div></div>
        </div>
        </div>`;
      return { html, fileName: `FATTURA-${f.numero_fattura || f.id}.pdf` };
    } catch { return { html: '<div />', fileName: 'FATTURA.pdf' }; }
  };

  const stampaFatturaById = async (fatturaId: number) => {
    const built = await buildFatturaHtmlById(fatturaId);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${built.fileName.replace(/\.pdf$/, '')}</title></head><body>${built.html}<script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  const htmlToPdfBlob = async (html: string): Promise<Blob> => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '794px'; /* ~A4 @96dpi */
    container.style.background = '#ffffff';
    container.style.padding = '28px';
    container.innerHTML = html;
    document.body.appendChild(container);
    try {
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = canvas.height * (imgWidth / canvas.width);

      let y = 0;
      pdf.addImage(imgData, 'JPEG', 0, y, imgWidth, imgHeight);
      // Aggiungi pagine extra se serve (cropping tramite y negativo)
      let remaining = imgHeight - pageHeight;
      while (remaining > 0) {
        pdf.addPage();
        y = - (imgHeight - remaining);
        pdf.addImage(imgData, 'JPEG', 0, y, imgWidth, imgHeight);
        remaining -= pageHeight;
      }
      return pdf.output('blob');
    } finally {
      document.body.removeChild(container);
    }
  };

  const saveOrUpdateAndReturnId = async (): Promise<number | undefined> => {
    if (!cliente) { setError('Seleziona un cliente'); return; }
    if (validRows.length === 0) { setError('Aggiungi almeno una riga valida'); return; }
    try {
      setSaving(true); setError(null);
      // Normalizzazione: una sola riga per ciascun documento_carico_id (o articolo_id)
      const normalizeRows = (rows: RigaUI[]) => {
        const map = new Map<string, RigaUI>();
        rows.forEach((r, idx) => {
          const key = String(r.giacenza?.carico_id ?? `art-${r.giacenza?.articolo_id ?? idx}`);
          map.set(key, r); // tiene l'ultima occorrenza (modifica), elimina duplicati
        });
        return Array.from(map.values());
      };
      const rowsForSave = normalizeRows(validRows);
      if (mode === 'ddt') {
        const payload = rowsForSave.map(r => ({
          quantita: Number(r.quantita||0),
          prezzo_unitario: Number(r.prezzo||0),
          prezzo_finale: Number(r.prezzo||0),
          iva_percentuale: Number(r.iva||0),
          documento_carico_id: r.giacenza?.carico_id ?? null,
          articolo_id: r.giacenza?.articolo_id ?? null,
          gruppo_id: r.giacenza?.gruppo_id ?? null,
          prodotto_id: r.giacenza?.prodotto_id ?? null,
          colore_id: r.giacenza?.colore_id ?? null,
          imballo_id: r.giacenza?.imballo_id ?? null,
          altezza_id: r.giacenza?.altezza_id ?? null,
          qualita_id: r.giacenza?.qualita_id ?? null,
        }));
        if (existing?.id) {
          await apiService.updateDDTVendita(existing.id, {
            cliente_id: cliente.id,
            data_ddt: data,
            destinazione: destinazione || null,
            spedizioniere: spedizioniere || null,
            note: (() => {
              const tag = `Scadenza: ${dataScadenza}`;
              const base = note || '';
              return base.includes('Scadenza:') ? base.replace(/Scadenza:[^|]*/g, tag) : (base ? `${base} | ${tag}` : tag);
            })()
          } as any);
          await apiService.replaceDDTRighe(existing.id, payload as any);
          setSavedId(existing.id);
          return existing.id;
        } else {
          const newId = await apiService.createDDTVendita({
            cliente_id: cliente.id,
            data_ddt: data,
            stato: 'da_fatturare',
            destinazione: destinazione || null,
            spedizioniere: spedizioniere || null,
            note: note ? `${note} | Scadenza: ${dataScadenza}` : `Scadenza: ${dataScadenza}`
          } as any, payload as any);
          setSavedId(newId);
          return newId;
        }
      } else {
        const payload = rowsForSave.map(r => ({
          quantita: Number(r.quantita||0),
          prezzo_unitario: Number(r.prezzo||0),
          prezzo_finale: Number(r.prezzo||0),
          iva_percentuale: Number(r.iva||0),
          documento_carico_id: r.giacenza?.carico_id ?? null,
          articolo_id: r.giacenza?.articolo_id ?? null,
          gruppo_id: r.giacenza?.gruppo_id ?? null,
          prodotto_id: r.giacenza?.prodotto_id ?? null,
          colore_id: r.giacenza?.colore_id ?? null,
          imballo_id: r.giacenza?.imballo_id ?? null,
          altezza_id: r.giacenza?.altezza_id ?? null,
          qualita_id: r.giacenza?.qualita_id ?? null,
        }));
        if (existing?.id && existing.fattura) {
          await apiService.updateFatturaVendita(existing.id, {
            cliente_id: cliente.id,
            data_fattura: data,
            stato: existing.fattura.stato || 'non_pagata',
            imponibile,
            iva: totaleIva,
            totale,
            note: (() => {
              const tag = metodoPagamento==='nessuno' ? null : `Metodo: ${metodoPagamento}`;
              let base = note || '';
              if (tag) {
                base = base.includes('Metodo:') ? base.replace(/Metodo:[^|]*/g, tag) : (base ? `${base} | ${tag}` : tag);
              }
              return base;
            })(),
          } as any);
          await apiService.replaceFatturaRighe(existing.id, payload as any);
          setSavedId(existing.id);
          return existing.id;
        } else {
          const newId = await apiService.createFatturaVendita({
            cliente_id: cliente.id,
            data_fattura: data,
            stato: 'non_pagata',
            imponibile,
            iva: totaleIva,
            totale,
            note: (() => {
              const tag = metodoPagamento==='nessuno' ? null : `Metodo: ${metodoPagamento}`;
              return tag ? (note ? `${note} | ${tag}` : tag) : (note || '');
            })(),
          } as any, payload as any);
          setSavedId(newId);
          return newId;
        }
      }
    } catch (e: any) {
      setError(e.message || 'Errore salvataggio');
      return undefined;
    } finally {
      setSaving(false);
    }
  };

  const handleShareWhatsAppPdf = async () => {
    try {
      // Assicura salvataggio su DB e ottieni ID
      const id = existing?.id || await saveOrUpdateAndReturnId();
      if (!id) return;
      // Costruisci HTML ufficiale per il documento e genera PDF
      const built = mode==='fattura' ? await buildFatturaHtmlById(id) : await buildDDTHtmlById(id);
      const pdfBlob = await htmlToPdfBlob(built.html);
      const fileName = built.fileName;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Preferisci condivisione diretta del file (mobile supportato)
      const n: any = navigator;
      if (n.canShare && n.canShare({ files: [pdfFile] })) {
        try {
          await n.share({ files: [pdfFile], title: fileName.replace(/\.pdf$/, '') });
          return;
        } catch {}
      }

      // Fallback: upload su Supabase Storage e condividi link via WhatsApp
      const publicUrl = await apiService.uploadPdf(pdfBlob, fileName);
      const text = `Ecco il PDF ${mode==='fattura' ? 'Fattura' : 'DDT'}: ${publicUrl}`;
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    } catch (e: any) {
      setError(e.message || 'Errore condivisione PDF');
    }
  };

  const handleShare = async () => {
    try {
      const id = existing?.id || savedId || await saveOrUpdateAndReturnId();
      if (!id) return;
      const built = mode==='fattura' ? await buildFatturaHtmlById(id) : await buildDDTHtmlById(id);
      const pdfBlob = await htmlToPdfBlob(built.html);
      const fileName = built.fileName;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      const n: any = navigator;
      if (n.canShare && n.canShare({ files: [pdfFile] })) {
        try { await n.share({ files: [pdfFile], title: fileName.replace(/\.pdf$/, '') }); return; } catch {}
      }
      const publicUrl = await apiService.uploadPdf(pdfBlob, fileName);
      if (n.share) {
        try { await n.share({ title: fileName.replace(/\.pdf$/, ''), text: publicUrl, url: publicUrl }); return; } catch {}
      }
      await navigator.clipboard.writeText(publicUrl);
      alert('Link al PDF copiato negli appunti');
    } catch (e: any) {
      setError(e.message || 'Errore condivisione PDF');
    }
  };

  const handleWhatsApp = () => {
    const rowsText = validRows.map(r => {
      const g = r.giacenza || {} as any;
      const q = Number(r.quantita||0);
      const unit = Number(r.prezzo||0);
      return `- ${g.gruppo_nome || ''} ${g.prodotto_nome || ''} ${g.colore_nome || ''} ${g.altezza_cm || ''}cm x${q} a €${unit.toFixed(3)}`;
    }).join('%0A');
    const msg = `*${mode==='ddt' ? 'DDT' : 'Fattura'} in preparazione*%0ACliente: ${encodeURIComponent(cliente?.nome || '')}%0AData: ${data}%0A%0A${rowsText}%0A%0ATotale: € ${totale.toFixed(2)}%0ARicarico medio: ${kpi.markupWeighted.toFixed(1)}%`;
    const url = `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  const handleCopyRecap = async () => {
    const lines = validRows.map(r => {
      const g = r.giacenza || {} as any;
      const q = Number(r.quantita||0);
      const unit = Number(r.prezzo||0);
      return `- ${g.gruppo_nome || ''} ${g.prodotto_nome || ''} ${g.colore_nome || ''} ${g.altezza_cm || ''}cm x${q} a €${unit.toFixed(3)}`;
    }).join('\n');
    const txt = `${mode==='ddt' ? 'DDT' : 'Fattura'}\nCliente: ${cliente?.nome || ''}\nData: ${data}\n\n${lines}\n\nImponibile: € ${imponibile.toFixed(2)}\nTotale: € ${totale.toFixed(2)}\nRicarico medio: ${kpi.markupWeighted.toFixed(1)}% (globale ${kpi.markupGlobal.toFixed(1)}%)`;
    await navigator.clipboard.writeText(txt);
  };

  // Scadenze per DDT non salvate come campi: annotiamo in note (usate poi per differita)

  const handleSave = async (postAction: 'none'|'print'|'whatsapp'|'email' = 'none') => {
    if (saving) return;
    if (!cliente) { setError('Seleziona un cliente'); return; }
    if (righe.length === 0) { setError('Aggiungi almeno una riga'); return; }
    try {
      setSaving(true); setError(null);
      if (mode === 'ddt') {
        const payload = validRows.map(r => ({
          quantita: Number(r.quantita||0),
          prezzo_unitario: Number(r.prezzo||0),
          prezzo_finale: Number(r.prezzo||0),
          iva_percentuale: Number(r.iva||0),
          documento_carico_id: r.giacenza?.carico_id ?? null,
          articolo_id: r.giacenza?.articolo_id ?? null,
          gruppo_id: r.giacenza?.gruppo_id ?? null,
          prodotto_id: r.giacenza?.prodotto_id ?? null,
          colore_id: r.giacenza?.colore_id ?? null,
          imballo_id: r.giacenza?.imballo_id ?? null,
          altezza_id: r.giacenza?.altezza_id ?? null,
          qualita_id: r.giacenza?.qualita_id ?? null,
        }));
        if (existing?.id) {
          await apiService.updateDDTVendita(existing.id, {
            cliente_id: cliente.id,
            data_ddt: data,
            destinazione: destinazione || null,
            spedizioniere: spedizioniere || null,
            note: note ? `${note} | Scadenza: ${dataScadenza}` : `Scadenza: ${dataScadenza}`
          } as any);
          await apiService.replaceDDTRighe(existing.id, payload as any);
          if (postAction === 'print') await stampaDDTById(existing.id);
        } else {
          const newId = await apiService.createDDTVendita({
            cliente_id: cliente.id,
            data_ddt: data,
            stato: 'da_fatturare',
            destinazione: destinazione || null,
            spedizioniere: spedizioniere || null,
            note: note ? `${note} | Scadenza: ${dataScadenza}` : `Scadenza: ${dataScadenza}`
          } as any, payload as any);
          if (postAction === 'print') await stampaDDTById(newId);
        }
        } else {
        const payload = validRows.map(r => ({
          quantita: Number(r.quantita||0),
          prezzo_unitario: Number(r.prezzo||0),
          prezzo_finale: Number(r.prezzo||0),
          iva_percentuale: Number(r.iva||0),
          documento_carico_id: r.giacenza?.carico_id ?? null,
          articolo_id: r.giacenza?.articolo_id ?? null,
          gruppo_id: r.giacenza?.gruppo_id ?? null,
          prodotto_id: r.giacenza?.prodotto_id ?? null,
          colore_id: r.giacenza?.colore_id ?? null,
          imballo_id: r.giacenza?.imballo_id ?? null,
          altezza_id: r.giacenza?.altezza_id ?? null,
          qualita_id: r.giacenza?.qualita_id ?? null,
        }));
        if (existing?.id && existing.fattura) {
          await apiService.updateFatturaVendita(existing.id, {
            cliente_id: cliente.id,
            data_fattura: data,
            stato: existing.fattura.stato || 'non_pagata',
            imponibile,
            iva: totaleIva,
            totale,
            note: metodoPagamento==='nessuno'
              ? (note || '')
              : (note ? `${note} | Metodo: ${metodoPagamento}` : `Metodo: ${metodoPagamento}`),
          } as any);
          await apiService.replaceFatturaRighe(existing.id, payload as any);
          if (postAction === 'print') await stampaFatturaById(existing.id);
        } else {
          const newId = await apiService.createFatturaVendita({
            cliente_id: cliente.id,
            data_fattura: data,
            stato: 'non_pagata',
            imponibile,
            iva: totaleIva,
            totale,
            note: metodoPagamento==='nessuno'
              ? (note || '')
              : (note ? `${note} | Metodo: ${metodoPagamento}` : `Metodo: ${metodoPagamento}`),
          } as any, payload as any);
          if (postAction === 'print') await stampaFatturaById(newId);
        }
      }
      window.history.back();
    } catch (e: any) {
      setError(e.message || 'Errore salvataggio');
    } finally { setSaving(false); }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          {mode === 'ddt' ? (existing?.id ? 'Modifica DDT' : 'Nuovo DDT') : 'Nuova Fattura'}
        </Typography>
        
      </Box>
      {/* Banner stato documento */}
      {existing?.id && annullato && (
        <Paper variant="outlined" sx={{ p:1.5, mb:2, borderRadius:0, borderColor:'#ef4444', background:'#fef2f2' }}>
          <Typography variant="body2" sx={{ fontWeight:700, color:'#b91c1c' }}>Documento annullato</Typography>
          <Typography variant="caption" sx={{ color:'#7f1d1d' }}>Questo documento è in sola lettura. Le modifiche non sono consentite.</Typography>
        </Paper>
      )}
      {existing?.id && !annullato && readOnly && (
        <Paper variant="outlined" sx={{ p:1.5, mb:2, borderRadius:0, borderColor:'#f59e0b', background:'#fffbeb' }}>
          <Typography variant="body2" sx={{ fontWeight:700, color:'#92400e' }}>
            {differita ? 'Fattura differita non modificabile' : inviataADE ? 'Fattura inviata ad ADE: blocco modifiche' : 'Blocco modifiche > 48h'}
          </Typography>
          <Typography variant="caption" sx={{ color:'#7c2d12' }}>Non è possibile modificare questo documento.</Typography>
        </Paper>
      )}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 0 }}>
        <Stepper activeStep={active} alternativeLabel>
          {steps.map(s => (<Step key={s}><StepLabel>{s}</StepLabel></Step>))}
        </Stepper>
      </Paper>

      {/* KPI header */}
      <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', md:'1fr 1fr 1fr 1fr'}, gap:1, mb:2 }}>
        <Paper variant="outlined" sx={{ p:1.5, borderLeft:`4px solid ${accent}`, borderRadius:0 }}>
          <Typography variant="caption" sx={{ color:'#64748b' }}>Steli totali</Typography>
          <Typography variant="h6" sx={{ fontWeight:800 }}>{kpi.qtyTot}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p:1.5, borderLeft:`4px solid ${kpi.markupWeighted>=50?'#16a34a':kpi.markupWeighted>=20?'#f59e0b':'#ef4444'}`, borderRadius:0 }}>
          <Typography variant="caption" sx={{ color:'#64748b' }}>Ricarico medio ponderato</Typography>
          <Typography variant="h6" sx={{ fontWeight:800, color: kpi.markupWeighted>=50?'#16a34a':kpi.markupWeighted>=20?'#b45309':'#b91c1c' }}>{kpi.markupWeighted.toFixed(1)}%</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p:1.5, borderLeft:`4px solid ${kpi.markupGlobal>=50?'#16a34a':kpi.markupGlobal>=20?'#f59e0b':'#ef4444'}`, borderRadius:0 }}>
          <Typography variant="caption" sx={{ color:'#64748b' }}>Ricarico globale</Typography>
          <Typography variant="h6" sx={{ fontWeight:800, color: kpi.markupGlobal>=50?'#16a34a':kpi.markupGlobal>=20?'#b45309':'#b91c1c' }}>{kpi.markupGlobal.toFixed(1)}%</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p:1.5, borderLeft:`4px solid ${accent}`, borderRadius:0 }}>
          <Typography variant="caption" sx={{ color:'#64748b' }}>Totale documento</Typography>
          <Typography variant="h6" sx={{ fontWeight:800 }}>€ {totale.toFixed(2)}</Typography>
        </Paper>
      </Box>

      {active===0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}><Autocomplete options={clienti} value={cliente} onChange={(_,v)=>setCliente(v)} getOptionLabel={o=>o?.nome||''} renderInput={(p)=><TextField {...p} label="Cliente" />} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label={mode==='ddt' ? 'Data DDT' : 'Data Fattura'} type="date" value={data} onChange={e=>setData(e.target.value)} InputLabelProps={{ shrink:true }} /></Grid>
          </Grid>
        </Paper>
      )}

      {active===1 && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 0 }}>
          <Grid container spacing={2} sx={{ mb: 1 }}>
            {mode==='ddt' && (
              <>
                <Grid item xs={12} md={4}><TextField fullWidth label="Scadenza" type="date" value={dataScadenza} onChange={e=>setDataScadenza(e.target.value)} InputLabelProps={{ shrink:true }} sx={fieldSx} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Destinazione" value={destinazione} onChange={e=>setDestinazione(e.target.value)} sx={fieldSx} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Spedizioniere" value={spedizioniere} onChange={e=>setSpedizioniere(e.target.value)} sx={fieldSx} /></Grid>
              </>
            )}
            {/* Metodo pagamento spostato nel riepilogo come richiesto */}
            <Grid item xs={12}><TextField fullWidth label="Note" value={note} onChange={e=>setNote(e.target.value)} sx={fieldSx} /></Grid>
          </Grid>
          <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip size="small" label={quickEdit ? 'Correzione rapida: ON' : 'Correzione rapida: OFF'} color={quickEdit ? 'primary':'default'} onClick={()=>setQuickEdit(v=>!v)} />
              <Typography variant="caption" sx={{ color:'#64748b' }}>Incrementi/decrementi in multipli di imballo</Typography>
            </Stack>
            <Typography variant="caption" sx={{ color:'#64748b' }}>Suggerimento: usa i chip L1/L2/L3 per riempire i prezzi</Typography>
          </Box>
          {righe.map((r,idx)=> (
            <Grid key={idx} container spacing={1} alignItems="center" sx={{ mb:1 }}>
              <Grid item xs={12} md={4}>
                <Autocomplete options={giacenze} value={r.giacenza}
                  onChange={(_,v)=>handleSelectGiacenza(idx, v)}
                  getOptionLabel={(o:any)=>`${o.gruppo_nome || ''} - ${o.prodotto_nome || ''} • ${o.colore_nome || ''} • ${o.altezza_cm || ''}cm • ${o.imballo_nome || ''}`}
                  filterOptions={createFilterOptions({
                    stringify: (option: any) => [
                      option.gruppo_nome,
                      option.prodotto_nome,
                      option.colore_nome,
                      option.imballo_nome,
                      option.altezza_cm,
                    ].filter(Boolean).join(' ')
                  })}
                  renderOption={(props, option: any) => {
                    const { key, ...rest } = props as any;
                    return (
                      <li key={key} {...rest}>
                        <Box sx={{ display:'flex', flexDirection:'column' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{option.gruppo_nome} - {option.prodotto_nome}</Typography>
                          <Typography variant="caption" color="text.secondary">{option.colore_nome} • {option.altezza_cm}cm • {option.imballo_nome} (x{option.imballo_quantita}) • Disp.: {option.quantita_giacenza}</Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(p)=><TextField {...p} label="Articolo (da giacenze reali)" />} />
              </Grid>
              <Grid item xs={6} md={1.5 as any}>
                  <TextField label="Qta" type="number" value={r.quantita}
                  onChange={e=>{ const arr=[...righe]; arr[idx]={...arr[idx], quantita:e.target.value}; setRighe(arr);} }
                  inputProps={{ min: r.imballoQuant || r.giacenza?.imballo_quantita || 1, step: r.imballoQuant || r.giacenza?.imballo_quantita || 1 }}
                   error={!!r.giacenza && isImballoInvalid(r)}
                   helperText={r.giacenza ? (()=>{
                     const base = Number(r.giacenza?.quantita_giacenza || 0);
                     const bonus = (r.originalDocumentoCaricoId && r.giacenza?.carico_id === r.originalDocumentoCaricoId) ? Number(r.originaleQuantita || 0) : 0;
                     const eff = base + bonus;
                     return `Imballo: ${r.imballoQuant || r.giacenza?.imballo_quantita || 1} • Disponibile: ${eff}${bonus?` (base ${base} + vecchia riga ${bonus})`:''}`;
                   })() : ''}
                  sx={fieldSx}
                />
              </Grid>
              {quickEdit && (
                <Grid item xs={12} md={'auto' as any}>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="- imballo"><span><IconButton onClick={()=>{ const arr=[...righe]; const step=Number(r.imballoQuant || r.giacenza?.imballo_quantita || 1); const cur=Number(r.quantita||0); const next=Math.max(0, cur-step); arr[idx]={...arr[idx], quantita:String(next)}; setRighe(arr); }}><RemoveCircleOutlineIcon /></IconButton></span></Tooltip>
                    <Tooltip title="+ imballo"><span><IconButton color="success" onClick={()=>{ const arr=[...righe]; const step=Number(r.imballoQuant || r.giacenza?.imballo_quantita || 1); const cur=Number(r.quantita||0); const next=cur+step; arr[idx]={...arr[idx], quantita:String(next)}; setRighe(arr); }}><AddCircleOutlineIcon /></IconButton></span></Tooltip>
                  </Stack>
                </Grid>
              )}
              <Grid item xs={6} md={1.5 as any}><TextField label="Prezzo" type="number" value={r.prezzo} onChange={e=>{ const arr=[...righe]; arr[idx]={...arr[idx], prezzo:e.target.value}; setRighe(arr);} } sx={fieldSx} /></Grid>
              {/* Sconto rimosso: il prezzo è sempre manuale o da listino */}
              <Grid item xs={6} md={1.5 as any}>
                <FormControl fullWidth size="small">
                  <InputLabel>Listino</InputLabel>
                  <Select label="Listino" value={r.livello} onChange={(e)=>handleListinoChange(idx, e.target.value as any)}>
                    <MenuItem value="L1">L1</MenuItem>
                    <MenuItem value="L2">L2</MenuItem>
                    <MenuItem value="L3">L3</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Stack direction="row" spacing={1}>
                  {(['L1','L2','L3'] as const).map(lv => (
                    <Chip key={lv} size="small" label={lv}
                      color={r.livello===lv ? 'warning' : 'default'}
                      onClick={()=>{
                        const arr=[...righe];
                        const g=arr[idx].giacenza;
                        const prezzo = g ? (lv==='L1'?g.prezzo_vendita_1:lv==='L2'?g.prezzo_vendita_2:g.prezzo_vendita_3) : arr[idx].prezzo;
                        arr[idx] = { ...arr[idx], livello: lv, prezzo: String(prezzo||0) };
                        setRighe(arr);
                      }}
                    />
                  ))}
                </Stack>
              </Grid>
              {mode==='fattura' && (
                <Grid item xs={6} md={1.5 as any}><TextField label="IVA %" type="number" value={r.iva} onChange={e=>{ const arr=[...righe]; arr[idx]={...arr[idx], iva:e.target.value}; setRighe(arr);} } sx={fieldSx} /></Grid>
              )}
              <Grid item xs={12} md={'auto' as any}>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Duplica riga"><span><IconButton onClick={()=>{ const arr=[...righe]; arr.splice(idx+1,0,{...r}); setRighe(arr); }}><ContentCopyIcon fontSize="small" /></IconButton></span></Tooltip>
                  <Tooltip title="Elimina riga"><span><IconButton onClick={()=>removeRiga(idx)}><DeleteIcon /></IconButton></span></Tooltip>
                </Stack>
              </Grid>
              <Grid item xs={12}>
              {(() => {
                  const q = Number(r.quantita||0);
                  const pu = Number(r.prezzo||0);
                  const cu = Number(r.giacenza?.prezzo_costo_finale_per_stelo || r.giacenza?.prezzo_acquisto_per_stelo || 0);
                  const subtotal = q*pu;
                  const markup = cu>0 ? ((pu-cu)/cu)*100 : 0;
                  const color = markup>=50?'success':markup>=20?'warning':'error';
                  return (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" color={r.giacenza && (Number(r.quantita||0) % Number(r.imballoQuant || r.giacenza?.imballo_quantita || 1) !== 0) ? 'error' : 'default'} label={`Subtotale riga: € ${subtotal.toFixed(2)}${r.giacenza ? ` • Imballo x${r.imballoQuant || r.giacenza?.imballo_quantita || 1}` : ''}`} />
                      <Chip size="small" color={color as any} label={`Ricarico riga: ${markup.toFixed(1)}%`} />
                    </Stack>
                  );
                })()}
              </Grid>
            </Grid>
          ))}
          <Divider sx={{ my:1 }} />
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={addRiga} variant="outlined" sx={{ borderRadius:0, borderColor:accent, color:accent }}>Aggiungi riga</Button>
            <Chip size="small" variant="outlined" label={`Costo totale: € ${kpi.totalCost.toFixed(2)}`} />
            <Chip size="small" color={(kpi.markupGlobal>=50?'success':kpi.markupGlobal>=20?'warning':'error') as any} label={`Ricarico globale: ${kpi.markupGlobal.toFixed(1)}%`} />
          </Stack>
        </Paper>
      )}

      {active===2 && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 0 }} ref={summaryRef}>
          <Typography variant="subtitle1" sx={{ fontWeight:700, mb:1 }}>Riepilogo</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">Cliente: {cliente?.nome}</Typography>
              <Typography variant="body2">Data: {data}</Typography>
              {mode==='ddt' && <>
                <Typography variant="body2">Destinazione: {destinazione || '-'}</Typography>
                <Typography variant="body2">Spedizioniere: {spedizioniere || '-'}</Typography>
              </>}
              {mode==='fattura' && <Typography variant="body2">Pagamento: {metodoPagamento==='nessuno' ? 'Nessuno (aperta)' : metodoPagamento.toUpperCase()}</Typography>}
              <Typography variant="body2">Note: {note || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">Righe: {righe.length}</Typography>
              <Typography variant="body2">Imponibile: € {imponibile.toFixed(2)}</Typography>
              {mode==='fattura' && <Typography variant="body2">IVA: € {totaleIva.toFixed(2)}</Typography>}
              <Typography variant="h6" sx={{ fontWeight:800, mt:1 }}>Totale: € {totale.toFixed(2)}</Typography>
              {mode==='ddt' && <Typography variant="body2">Scadenza: {dataScadenza}</Typography>}
              <Box sx={{ mt:1, display:'flex', gap:1, flexWrap:'wrap' }}>
                <Chip size="small" label={`Ricarico medio: ${kpi.markupWeighted.toFixed(1)}%`} color={(kpi.markupWeighted>=50?'success':kpi.markupWeighted>=20?'warning':'error') as any} />
                <Chip size="small" label={`Ricarico globale: ${kpi.markupGlobal.toFixed(1)}%`} variant="outlined" />
              </Box>
              {mode==='fattura' && (
                <Box sx={{ display:'flex', gap:1, alignItems:'center', mt: 1 }}>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Metodo pagamento</InputLabel>
                    <Select label="Metodo pagamento" value={metodoPagamento} onChange={(e)=>setMetodoPagamento(e.target.value as any)}>
                      <MenuItem value="nessuno">Nessuno (rimane aperta)</MenuItem>
                      <MenuItem value="contanti">Contanti</MenuItem>
                      <MenuItem value="pos">POS</MenuItem>
                      <MenuItem value="assegno">Assegno</MenuItem>
                    </Select>
                  </FormControl>
                  <Chip size="small" label={metodoPagamento==='nessuno' ? 'Stato: non pagata' : 'Pagamento al salvataggio'} />
                </Box>
              )}
            </Grid>
          </Grid>
          {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
        </Paper>
      )}

      <Box sx={{ mt:2, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button onClick={()=> active===0 ? safeBack(navigate, '/vendite') : setActive(active-1)}>Indietro</Button>
          {mode==='ddt' && existing?.id && (
            <Button color="error" variant="outlined" onClick={async()=>{ try{ setSaving(true); await apiService.annullaDDTVendita(existing.id); safeBack(navigate,'/vendite'); } finally{ setSaving(false);} }} sx={{ borderRadius:0 }}>Annulla DDT</Button>
          )}
        </Stack>
        <Stack direction="row" spacing={1}>
          {active < steps.length-1 && (
            <Button variant="contained" onClick={()=>setActive(active+1)} disabled={readOnly || (active===0 && !cliente) || (active===1 && !canProceed)} sx={{ borderRadius: 0 }}>Avanti</Button>
          )}
          {active === steps.length-1 && (
            <>
              <Button variant="contained" onClick={async()=>{ const id = await saveOrUpdateAndReturnId(); if (id) { setSavedId(id); safeBack(navigate, '/vendite'); } }} disabled={readOnly || saving || !canProceed} sx={{ borderRadius: 0 }}>
                Salva
              </Button>
              <Button variant="outlined" onClick={async()=>{ const id = existing?.id || await saveOrUpdateAndReturnId(); if (!id) return; if (mode==='fattura') await stampaFatturaById(id); else await stampaDDTById(id); }} disabled={readOnly || saving || !canProceed} sx={{ borderRadius: 0 }}>
                Stampa
              </Button>
              <Button variant="outlined" color="success" startIcon={<WhatsAppIcon />} onClick={handleShareWhatsAppPdf} disabled={readOnly || saving || !canProceed} sx={{ borderRadius: 0 }}>
                WhatsApp
              </Button>
              <Button variant="outlined" startIcon={<ShareIcon />} onClick={handleShare} disabled={readOnly} sx={{ borderRadius: 0 }}>
                Condividi
              </Button>
              <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={handleCopyRecap} sx={{ borderRadius: 0 }}>
                Copia
              </Button>
            </>
          )}
        </Stack>
      </Box>
    </Box>
  );
}


