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
  Stack
} from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiService, type Cliente } from '../../lib/apiService';
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
};

export default function SalesDocWizardCore({ mode, existing }: { mode: Mode; existing?: { id: number; ddt?: any; righe?: any[] } }) {
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

  React.useEffect(()=>{
    Promise.all([
      apiService.getClienti(),
      apiService.getGiacenzeMagazzino()
    ]).then(([cl, gz])=>{ setClienti(cl); setGiacenze(gz); }).catch(e=>setError(e.message||'Errore caricamento dati'));
  },[]);

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

  // Quando ho clienti caricati, imposto il cliente del DDT esistente
  React.useEffect(()=>{
    if (mode !== 'ddt' || !existing?.ddt) return;
    const found = clienti.find(c => c.id === existing.ddt.cliente_id) || null;
    if (found) setCliente(found);
  }, [clienti, existing, mode]);

  // Righe precompilate quando ho giacenze caricate
  React.useEffect(()=>{
    if (mode !== 'ddt' || !existing?.righe) return;
    const rows = (existing.righe || []).map((r: any) => {
      const match = giacenze.find((g: any) => g.articolo_id === r.articolo_id) || null;
      const imballo = Number(match?.imballo_quantita || 1);
      return {
        giacenza: match,
        quantita: String(r.quantita || imballo),
        livello: 'L1' as const,
        prezzo: String(r.prezzo_unitario ?? r.prezzo_finale ?? 0),
        sconto: '0',
        iva: String(r.iva_percentuale ?? 10),
        imballoQuant: imballo
      };
    });
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

  const isImballoInvalid = (r: RigaUI) => {
    if (!r.giacenza) return true;
    const q = Number(r.quantita || 0);
    const imballo = Number(r.imballoQuant || r.giacenza?.imballo_quantita || 1);
    return q <= 0 || q % imballo !== 0;
  };
  const validRows = React.useMemo(() => righe.filter(r => !!r.giacenza && Number(r.quantita || 0) > 0), [righe]);
  const canProceed = !!cliente && validRows.length > 0 && validRows.every(r => !isImballoInvalid(r));

  const imponibile = validRows.reduce((s, r) => {
    const q = Number(r.quantita||0);
    const p = Number(r.prezzo||0);
    const sc = Number(r.sconto||0);
    return s + (q * p * (1 - sc/100));
  }, 0);
  const totaleIva = validRows.reduce((s, r) => {
    const q = Number(r.quantita||0);
    const p = Number(r.prezzo||0);
    const sc = Number(r.sconto||0);
    const ivaPerc = Number(r.iva||0);
    const base = q * p * (1 - sc/100);
    return s + base * (ivaPerc/100);
  }, 0);
  const totale = imponibile + (mode==='fattura' ? totaleIva : 0);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = `Documento di vendita (${mode.toUpperCase()})\nCliente: ${cliente?.nome || ''}\nData: ${data}\nTotale: € ${totale.toFixed(2)}`;
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: `Documento ${mode}`, text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      alert('Dettagli copiati negli appunti');
    }
  };

  // Scadenze per DDT non salvate come campi: annotiamo in note (usate poi per differita)

  const handleSave = async () => {
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
        } else {
          await apiService.createDDTVendita({
            cliente_id: cliente.id,
            data_ddt: data,
            stato: 'da_fatturare',
            destinazione: destinazione || null,
            spedizioniere: spedizioniere || null,
            note: note ? `${note} | Scadenza: ${dataScadenza}` : `Scadenza: ${dataScadenza}`
          } as any, payload as any);
        }
      } else {
        const payload = validRows.map(r => ({
          quantita: Number(r.quantita||0),
          prezzo_unitario: Number(r.prezzo||0),
          sconto_percentuale: Number(r.sconto||0),
          prezzo_finale: Number(r.prezzo||0) * (1 - Number(r.sconto||0)/100),
          iva_percentuale: Number(r.iva||0),
          articolo_id: r.giacenza?.articolo_id ?? null,
          gruppo_id: r.giacenza?.gruppo_id ?? null,
          prodotto_id: r.giacenza?.prodotto_id ?? null,
          colore_id: r.giacenza?.colore_id ?? null,
          imballo_id: r.giacenza?.imballo_id ?? null,
          altezza_id: r.giacenza?.altezza_id ?? null,
          qualita_id: r.giacenza?.qualita_id ?? null,
        }));
        await apiService.createFatturaVendita({
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
        {active === 2 && (
          <Stack direction="row" spacing={1}>
            <Button startIcon={<PrintIcon />} onClick={handlePrint} sx={{ borderRadius: 0 }} variant="outlined">Stampa</Button>
            <Button startIcon={<ShareIcon />} onClick={handleShare} sx={{ borderRadius: 0 }} variant="outlined">Condividi</Button>
          </Stack>
        )}
      </Box>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stepper activeStep={active} alternativeLabel>
          {steps.map(s => (<Step key={s}><StepLabel>{s}</StepLabel></Step>))}
        </Stepper>
      </Paper>

      {active===0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}><Autocomplete options={clienti} value={cliente} onChange={(_,v)=>setCliente(v)} getOptionLabel={o=>o?.nome||''} renderInput={(p)=><TextField {...p} label="Cliente" />} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label={mode==='ddt' ? 'Data DDT' : 'Data Fattura'} type="date" value={data} onChange={e=>setData(e.target.value)} InputLabelProps={{ shrink:true }} /></Grid>
          </Grid>
        </Paper>
      )}

      {active===1 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2} sx={{ mb: 1 }}>
            {mode==='ddt' && (
              <>
                <Grid item xs={12} md={4}><TextField fullWidth label="Scadenza" type="date" value={dataScadenza} onChange={e=>setDataScadenza(e.target.value)} InputLabelProps={{ shrink:true }} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Destinazione" value={destinazione} onChange={e=>setDestinazione(e.target.value)} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Spedizioniere" value={spedizioniere} onChange={e=>setSpedizioniere(e.target.value)} /></Grid>
              </>
            )}
            {/* Metodo pagamento spostato nel riepilogo come richiesto */}
            <Grid item xs={12}><TextField fullWidth label="Note" value={note} onChange={e=>setNote(e.target.value)} /></Grid>
          </Grid>
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
                  error={!!r.giacenza && (Number(r.quantita||0) % Number(r.imballoQuant || r.giacenza?.imballo_quantita || 1) !== 0)}
                  helperText={r.giacenza ? `Imballo: ${r.imballoQuant || r.giacenza?.imballo_quantita || 1} steli` : ''}
                />
              </Grid>
              <Grid item xs={6} md={1.5 as any}><TextField label="Prezzo" type="number" value={r.prezzo} onChange={e=>{ const arr=[...righe]; arr[idx]={...arr[idx], prezzo:e.target.value}; setRighe(arr);} } /></Grid>
              <Grid item xs={6} md={1.5 as any}><TextField label="Sconto %" type="number" value={r.sconto} onChange={e=>{ const arr=[...righe]; arr[idx]={...arr[idx], sconto:e.target.value}; setRighe(arr);} } /></Grid>
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
                <Grid item xs={6} md={1.5 as any}><TextField label="IVA %" type="number" value={r.iva} onChange={e=>{ const arr=[...righe]; arr[idx]={...arr[idx], iva:e.target.value}; setRighe(arr);} } /></Grid>
              )}
              <Grid item xs={12} md={'auto' as any}>
                <IconButton onClick={()=>removeRiga(idx)}><DeleteIcon /></IconButton>
              </Grid>
              <Grid item xs={12}>
                <Chip size="small" color={r.giacenza && (Number(r.quantita||0) % Number(r.imballoQuant || r.giacenza?.imballo_quantita || 1) !== 0) ? 'error' : 'default'} label={`Subtotale riga: € ${(Number(r.quantita||0)*Number(r.prezzo||0)*(1-Number(r.sconto||0)/100)).toFixed(2)}${r.giacenza ? ` • Imballo x${r.imballoQuant || r.giacenza?.imballo_quantita || 1}` : ''}`} />
              </Grid>
            </Grid>
          ))}
          <Button size="small" onClick={addRiga}>Aggiungi riga</Button>
        </Paper>
      )}

      {active===2 && (
        <Paper variant="outlined" sx={{ p: 2 }} ref={summaryRef}>
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

      <Box sx={{ mt:2, display:'flex', justifyContent:'space-between' }}>
        <Button onClick={()=> active===0 ? safeBack(navigate, '/vendite') : setActive(active-1)}>Indietro</Button>
        {active < steps.length-1 && <Button variant="contained" onClick={()=>setActive(active+1)} disabled={(active===0 && !cliente) || (active===1 && !canProceed)} sx={{ borderRadius: 0 }}>Avanti</Button>}
        {active === steps.length-1 && (
          <Stack direction="row" spacing={1}>
            {mode==='ddt' && existing?.id && (
              <Button color="error" variant="outlined" onClick={async()=>{ try{ setSaving(true); await apiService.annullaDDTVendita(existing.id); safeBack(navigate,'/vendite'); } finally{ setSaving(false);} }} sx={{ borderRadius:0 }}>Annulla DDT</Button>
            )}
            <Button variant="contained" onClick={handleSave} disabled={saving || !canProceed} sx={{ borderRadius: 0 }}>
              {mode==='ddt' && existing?.id ? 'Salva modifiche' : 'Conferma'}
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  );
}


