import React from 'react';
import { Box, Stepper, Step, StepLabel, Button, Typography, Grid, TextField, Autocomplete, Paper, Select, MenuItem, InputLabel, FormControl, Chip, Stack } from '@mui/material';
import { apiService, type Cliente } from '../../lib/apiService';
import { useNavigate } from 'react-router-dom';
import { safeBack } from '../../lib/navigation';

type Esito = 'reintegro' | 'distruzione';

type RigaUI = {
  giacenza: any | null;
  quantita: string;
  esito: Esito;
  prezzo_unitario: string;
  fattura_riga_id?: number | null;
};

export default function ResoWizard() {
  const navigate = useNavigate();
  const [active, setActive] = React.useState(0);
  const [clienti, setClienti] = React.useState<Cliente[]>([]);
  const [giacenze, setGiacenze] = React.useState<any[]>([]);
  const [cliente, setCliente] = React.useState<Cliente | null>(null);
  const [origineTipo, setOrigineTipo] = React.useState<'fattura'|'ddt'>('fattura');
  const [origineId, setOrigineId] = React.useState<string>('');
  const [note, setNote] = React.useState('');
  const [righe, setRighe] = React.useState<RigaUI[]>([{ giacenza: null, quantita: '1', esito: 'reintegro', prezzo_unitario: '0' }]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(()=>{
    Promise.all([
      apiService.getClienti(),
      apiService.getGiacenzeMagazzino()
    ]).then(([cl, gz])=>{ setClienti(cl); setGiacenze(gz); }).catch(e=>setError(e.message||'Errore caricamento'));
  },[]);

  const steps = ['Origine & Cliente', 'Articoli Reso', 'Riepilogo'];

  const handleSave = async () => {
    if (!cliente) { setError('Seleziona un cliente'); return; }
    if (!origineId) { setError('Inserisci documento origine'); return; }
    try {
      setSaving(true); setError(null);
      const payload = righe.map(r => ({
        fattura_riga_id: r.fattura_riga_id || null,
        articolo_ref: {
          articolo_id: r.giacenza?.articolo_id ?? null,
          gruppo_id: r.giacenza?.gruppo_id ?? null,
          prodotto_id: r.giacenza?.prodotto_id ?? null,
          colore_id: r.giacenza?.colore_id ?? null,
          provenienza_id: r.giacenza?.provenienza_id ?? null,
          foto_id: r.giacenza?.foto_id ?? null,
          imballo_id: r.giacenza?.imballo_id ?? null,
          altezza_id: r.giacenza?.altezza_id ?? null,
          qualita_id: r.giacenza?.qualita_id ?? null,
        },
        quantita: Number(r.quantita||0),
        esito: r.esito,
        prezzo_unitario: Number(r.prezzo_unitario||0)
      }));
      await apiService.creaReso({ tipo: origineTipo, id: Number(origineId) }, cliente.id, payload);
      window.history.back();
    } catch (e: any) { setError(e.message || 'Errore salvataggio reso'); } finally { setSaving(false); }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>Nuovo Reso / Nota di credito</Typography>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stepper activeStep={active} alternativeLabel>
          {['Origine & Cliente','Articoli Reso','Riepilogo'].map(s => (<Step key={s}><StepLabel>{s}</StepLabel></Step>))}
        </Stepper>
      </Paper>

      {active===0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Origine</InputLabel>
                <Select label="Origine" value={origineTipo} onChange={(e)=>setOrigineTipo(e.target.value as any)}>
                  <MenuItem value="fattura">Fattura</MenuItem>
                  <MenuItem value="ddt">DDT</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label={`ID ${origineTipo.toUpperCase()}`} value={origineId} onChange={e=>setOrigineId(e.target.value)} /></Grid>
            <Grid item xs={12} md={6}><Autocomplete options={clienti} value={cliente} onChange={(_,v)=>setCliente(v)} getOptionLabel={o=>o?.nome||''} renderInput={(p)=><TextField {...p} label="Cliente" />} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Note" value={note} onChange={e=>setNote(e.target.value)} /></Grid>
          </Grid>
        </Paper>
      )}

      {active===1 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          {righe.map((r,idx)=> (
            <Grid key={idx} container spacing={1} alignItems="center" sx={{ mb:1 }}>
              <Grid item xs={12} md={4}>
                <Autocomplete options={giacenze} value={r.giacenza}
                  onChange={(_,v)=>{ const arr=[...righe]; arr[idx]={...arr[idx], giacenza:v, prezzo_unitario:String(v?.prezzo_vendita_1||0)}; setRighe(arr); }}
                  getOptionLabel={(o:any)=>`${o.gruppo_nome || ''} - ${o.prodotto_nome || ''} • ${o.colore_nome || ''} • ${o.altezza_cm || ''}cm • ${o.imballo_nome || ''}`}
                  renderInput={(p)=><TextField {...p} label="Articolo (da giacenze)" />} />
              </Grid>
              <Grid item xs={6} md={2}><TextField label="Qta" type="number" value={r.quantita} onChange={e=>{ const arr=[...righe]; arr[idx]={...arr[idx], quantita:e.target.value}; setRighe(arr);} } /></Grid>
              <Grid item xs={6} md={2}><TextField label="Prezzo" type="number" value={r.prezzo_unitario} onChange={e=>{ const arr=[...righe]; arr[idx]={...arr[idx], prezzo_unitario:e.target.value}; setRighe(arr);} } /></Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Esito</InputLabel>
                  <Select label="Esito" value={r.esito} onChange={(e)=>{ const arr=[...righe]; arr[idx]={...arr[idx], esito:e.target.value as Esito}; setRighe(arr);} }>
                    <MenuItem value="reintegro">Reintegro</MenuItem>
                    <MenuItem value="distruzione">Distruzione</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={'auto' as any}>
                <Button size="small" color="error" onClick={()=>{ const arr=[...righe]; arr.splice(idx,1); setRighe(arr); }}>Rimuovi</Button>
              </Grid>
              <Grid item xs={12}>
                <Chip size="small" label={`Subtotale riga: € ${(Number(r.quantita||0)*Number(r.prezzo_unitario||0)).toFixed(2)} • ${r.esito}`} />
              </Grid>
            </Grid>
          ))}
          <Button size="small" onClick={()=>setRighe([...righe, { giacenza: null, quantita: '1', esito: 'reintegro', prezzo_unitario: '0' }])}>Aggiungi riga</Button>
        </Paper>
      )}

      {active===2 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight:700, mb:1 }}>Riepilogo</Typography>
          <Typography variant="body2">Origine: {origineTipo.toUpperCase()} #{origineId}</Typography>
          <Typography variant="body2">Cliente: {cliente?.nome}</Typography>
          <Typography variant="body2">Righe: {righe.length}</Typography>
          {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
        </Paper>
      )}

      <Box sx={{ mt:2, display:'flex', justifyContent:'space-between' }}>
        <Button onClick={()=> active===0 ? safeBack(navigate, '/vendite') : setActive(active-1)}>Indietro</Button>
        {active < steps.length-1 && <Button variant="contained" onClick={()=>setActive(active+1)} sx={{ borderRadius: 0 }}>Avanti</Button>}
        {active === steps.length-1 && <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ borderRadius: 0 }}>Conferma</Button>}
      </Box>
    </Box>
  );
}


