import React from 'react';
import {
  Box, Stepper, Step, StepLabel, Button, Typography, Grid, TextField, Autocomplete,
  Paper, IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiService, type Cliente, type Gruppo, type Prodotto, type Colore, type Imballo, type Altezza, type OrdineVenditaRiga } from '../../lib/apiService';
import DeleteIcon from '@mui/icons-material/Delete';

const steps = ['Cliente & Date', 'Articoli', 'Riepilogo'];

export default function OrdineWizard() {
  const navigate = useNavigate();
  const [active, setActive] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Dati base
  const [clienti, setClienti] = React.useState<Cliente[]>([]);
  const [gruppi, setGruppi] = React.useState<Gruppo[]>([]);
  const [prodotti, setProdotti] = React.useState<Prodotto[]>([]);
  const [colori, setColori] = React.useState<Colore[]>([]);
  const [imballi, setImballi] = React.useState<Imballo[]>([]);
  const [altezze, setAltezze] = React.useState<Altezza[]>([]);

  const [cliente, setCliente] = React.useState<Cliente | null>(null);
  const [dataOrdine, setDataOrdine] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const [note, setNote] = React.useState('');

  type RigaUI = {
    gruppo?: Gruppo | null; prodotto?: Prodotto | null; colore?: Colore | null; imballo?: Imballo | null; altezza?: Altezza | null;
    quantita: string; prezzo: string; sconto: string;
  }
  const [righe, setRighe] = React.useState<RigaUI[]>([{ quantita: '1', prezzo: '0', sconto: '0' }]);

  React.useEffect(() => {
    Promise.all([
      apiService.getClienti(), apiService.getGruppi(), apiService.getProdotti(), apiService.getColori(), apiService.getImballaggi(), apiService.getAltezze()
    ]).then(([cl, gr, pr, co, im, al]) => {
      setClienti(cl); setGruppi(gr); setProdotti(pr); setColori(co); setImballi(im); setAltezze(al);
    }).catch(e => setError(e.message || 'Errore caricamento dati base'));
  }, []);

  const toPayloadRighe = (): Array<Omit<OrdineVenditaRiga, 'id' | 'ordine_id' | 'prezzo_finale'>> => {
    return righe.map(r => ({
      gruppo_id: r.gruppo?.id || undefined,
      prodotto_id: r.prodotto?.id || undefined,
      colore_id: r.colore?.id || undefined,
      imballo_id: r.imballo?.id || undefined,
      altezza_id: r.altezza?.id || undefined,
      quantita: Number(r.quantita || 0),
      prezzo_unitario: Number(r.prezzo || 0),
      sconto_percentuale: Number(r.sconto || 0)
    }));
  };

  const handleSave = async () => {
    if (!cliente) { setError('Seleziona un cliente'); return; }
    try {
      setSaving(true); setError(null);
      await apiService.createOrdineVendita({
        cliente_id: cliente.id,
        data_ordine: dataOrdine,
        stato: 'bozza',
        sconto_percentuale: 0,
        note
      } as any, toPayloadRighe());
      navigate('/vendite');
    } catch (e: any) { setError(e.message || 'Errore salvataggio ordine'); } finally { setSaving(false); }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>Nuovo Ordine Cliente</Typography>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stepper activeStep={active} alternativeLabel>
          {steps.map(s => (<Step key={s}><StepLabel>{s}</StepLabel></Step>))}
        </Stepper>
      </Paper>

      {active === 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Autocomplete options={clienti} value={cliente} onChange={(_,v)=>setCliente(v)} getOptionLabel={o=>o?.nome||''}
                renderInput={(p)=><TextField {...p} label="Cliente" />} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Data ordine" type="date" value={dataOrdine} onChange={e=>setDataOrdine(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Note" value={note} onChange={e=>setNote(e.target.value)} />
            </Grid>
          </Grid>
        </Paper>
      )}

      {active === 1 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          {righe.map((r, idx) => (
            <Grid key={idx} container spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Grid item xs={12} md={2}><Autocomplete options={gruppi} value={r.gruppo||null} getOptionLabel={o=>o?.nome||''} onChange={(_,v)=>{
                const rows=[...righe]; rows[idx]={...rows[idx], gruppo:v}; setRighe(rows);
              }} renderInput={(p)=><TextField {...p} label="Gruppo" />} /></Grid>
              <Grid item xs={12} md={2}><Autocomplete options={prodotti} value={r.prodotto||null} getOptionLabel={o=>o?.nome||''} onChange={(_,v)=>{
                const rows=[...righe]; rows[idx]={...rows[idx], prodotto:v}; setRighe(rows);
              }} renderInput={(p)=><TextField {...p} label="Prodotto" />} /></Grid>
              <Grid item xs={12} md={2}><Autocomplete options={colori} value={r.colore||null} getOptionLabel={o=>o?.nome||''} onChange={(_,v)=>{ const rows=[...righe]; rows[idx]={...rows[idx], colore:v}; setRighe(rows); }} renderInput={(p)=><TextField {...p} label="Colore" />} /></Grid>
              <Grid item xs={12} md={2}><Autocomplete options={altezze} value={r.altezza||null} getOptionLabel={o=>String(o?.cm||'')} onChange={(_,v)=>{ const rows=[...righe]; rows[idx]={...rows[idx], altezza:v}; setRighe(rows); }} renderInput={(p)=><TextField {...p} label="Altezza" />} /></Grid>
              <Grid item xs={12} md={2}><Autocomplete options={imballi} value={r.imballo||null} getOptionLabel={o=>o?.nome||''} onChange={(_,v)=>{ const rows=[...righe]; rows[idx]={...rows[idx], imballo:v}; setRighe(rows); }} renderInput={(p)=><TextField {...p} label="Imballo" />} /></Grid>
              <Grid item xs={12} md={1}><TextField label="Qta" type="number" value={r.quantita} onChange={e=>{ const rows=[...righe]; rows[idx]={...rows[idx], quantita:e.target.value}; setRighe(rows); }} /></Grid>
              <Grid item xs={12} md={1}><TextField label="Prezzo" type="number" value={r.prezzo} onChange={e=>{ const rows=[...righe]; rows[idx]={...rows[idx], prezzo:e.target.value}; setRighe(rows); }} /></Grid>
              <Grid item xs={12} md={1}><TextField label="Sconto %" type="number" value={r.sconto} onChange={e=>{ const rows=[...righe]; rows[idx]={...rows[idx], sconto:e.target.value}; setRighe(rows); }} /></Grid>
              <Grid item xs={12} md={'auto' as any}><IconButton onClick={()=>{ const rows=[...righe]; rows.splice(idx,1); setRighe(rows); }}><DeleteIcon /></IconButton></Grid>
            </Grid>
          ))}
          <Button onClick={()=>setRighe([...righe, { quantita:'1', prezzo:'0', sconto:'0' }])}>Aggiungi riga</Button>
        </Paper>
      )}

      {active === 2 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Riepilogo</Typography>
          <Typography variant="body2">Cliente: {cliente?.nome}</Typography>
          <Typography variant="body2">Righe: {righe.length}</Typography>
          <Typography variant="body2">Totale: € {righe.reduce((s,r)=> s + Number(r.quantita||0)*Number(r.prezzo||0)*(1-Number(r.sconto||0)/100), 0).toFixed(2)}</Typography>
          {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
        </Paper>
      )}

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={()=> active===0 ? navigate('/vendite') : setActive(active-1)}>Indietro</Button>
        {active < steps.length-1 && <Button variant="contained" onClick={()=>setActive(active+1)}>Avanti</Button>}
        {active === steps.length-1 && <Button variant="contained" onClick={handleSave} disabled={saving}>Conferma</Button>}
      </Box>
    </Box>
  );
}


