import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, TextField, IconButton, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Alert, CircularProgress, Autocomplete, MenuItem, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../lib/apiService';
import { useMagazzinoEmitter } from '../lib/magazzinoEvents';
import DownloadIcon from '@mui/icons-material/Download';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';

// Tipi
interface ProdottoFattura {
  id: string;
  gruppo: string;
  prodotto: string;
  varieta: string;
  colore: string;
  altezza: string;
  qualita: string;
  provenienza: string;
  imballo: number;
  quantita: number;
  prezzoAcquisto: number;
  totale: number;
}

// Definizione tipo Fornitore
interface Fornitore {
  id: number;
  nome: string;
  [key: string]: any;
}

// Componente principale per la scelta del tipo di inserimento
export function SceltaInserimentoFattura() {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Indietro',
      icon: <ArrowBackIcon />,
      color: 'primary' as const,
      onClick: () => window.history.back(),
      tooltip: 'Torna indietro'
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="contained"
            color={action.color}
            startIcon={action.icon}
            onClick={action.onClick}
            title={action.tooltip}
          >
            {action.label}
          </Button>
        ))}
      </Box>
      <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>Inserimento Fattura</Typography>
          <InserimentoFatturaManuale />
        </Paper>
      </Box>
    </Box>
  );
}

// Componente per inserimento manuale
export function InserimentoFatturaManuale() {
  const emitter = useMagazzinoEmitter();
  
  const [manuale, setManuale] = useState<{
    fornitore: Fornitore | null;
    numero: string;
    data: string;
  }>({
    fornitore: null,
    numero: '',
    data: new Date().toISOString().split('T')[0]
  });
  const [prodotti, setProdotti] = useState<ProdottoFattura[]>([]);
  const [nuovoProdotto, setNuovoProdotto] = useState({
    gruppo: '',
    prodotto: '',
    varieta: '',
    colore: '',
    altezza: '',
    qualita: '',
    provenienza: '',
    imballo: 1,
    quantita: 0,
    prezzoAcquisto: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [quantitaValida, setQuantitaValida] = useState(true);
  const [quantitaSuggerita, setQuantitaSuggerita] = useState<number | null>(null);
  const [campiBloccati, setCampiBloccati] = useState(false);
  
  // Stati per memoria e suggerimenti
  const [varietaStoriche, setVarietaStoriche] = useState<any[]>([]);
  const [imballiComuni, setImballiComuni] = useState<{ [key: string]: number }>({});
  const [coloriComuni, setColoriComuni] = useState<string[]>([]);
  const [prodottiComuni, setProdottiComuni] = useState<string[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Funzione per suggerire il gruppo dalla varietà
  const suggerisciGruppo = (varieta: string): string | null => {
    const varietaLower = varieta.toLowerCase();
    
    if (varietaLower.includes('rosa') || varietaLower.includes('rose')) {
      return 'Rose';
    } else if (varietaLower.includes('tulip')) {
      return 'Tulipani';
    } else if (varietaLower.includes('girasol')) {
      return 'Girasoli';
    } else if (varietaLower.includes('orchid')) {
      return 'Orchidee';
    } else if (varietaLower.includes('peon')) {
      return 'Peonie';
    } else if (varietaLower.includes('garofan') || varietaLower.includes('carnation')) {
      return 'Garofani';
    } else if (varietaLower.includes('crisante') || varietaLower.includes('chrysant')) {
      return 'Crisantemi';
    } else if (varietaLower.includes('giglio') || varietaLower.includes('lily')) {
      return 'Gigli';
    } else if (varietaLower.includes('anthurium')) {
      return 'Anthurium';
    } else if (varietaLower.includes('gerbera')) {
      return 'Gerbere';
    }
    
    return null;
  };

  const loadInitialData = async () => {
    try {
      // Carica fornitori
      const fornitoriData = await apiService.getFornitori();
      setFornitori(fornitoriData);
      
      // Carica varietà storiche per suggerimenti
      const varietaData = await apiService.getVarieta(false); // Solo varietà con giacenza > 0
      setVarietaStoriche(varietaData);
      
      // Carica giacenze per analizzare imballi e colori più usati
      const giacenzeData = await apiService.getGiacenze();
      
      // Analizza imballi comuni
      const imballiFreq: { [key: string]: { count: number; imballo: number } } = {};
      giacenzeData.forEach((g: any) => {
        const key = `${g.varieta_nome}`;
        if (!imballiFreq[key] || imballiFreq[key].count < 1) {
          imballiFreq[key] = { count: 1, imballo: g.imballo || 1 };
        }
      });
      
      const imballiMap: { [key: string]: number } = {};
      Object.keys(imballiFreq).forEach(key => {
        imballiMap[key] = imballiFreq[key].imballo;
      });
      setImballiComuni(imballiMap);
      
      // Estrai colori comuni dalla storia
      const coloriSet = new Set<string>();
      varietaData.forEach((v: any) => {
        if (v.nome) {
          const coloreMatch = v.nome.match(/(ROSSO|ROSA|BIANCO|GIALLO|VERDE|VIOLA|BLU|ARANCIO|FUCSIA|CREMA|NERO)/i);
          if (coloreMatch) {
            coloriSet.add(coloreMatch[1].toLowerCase());
          }
        }
      });
      setColoriComuni(Array.from(coloriSet));
      
      // Carica sempre i gruppi dal database
      const gruppiData = await apiService.getGruppi();
      const gruppiNomi = gruppiData.map((g: any) => g.nome);
      
      // Estrai prodotti dalle giacenze
      const prodottiSet = new Set<string>();
      giacenzeData.forEach((g: any) => {
        if (g.prodotto_nome) prodottiSet.add(g.prodotto_nome);
      });
      
      // Aggiungi sempre tutti i gruppi disponibili
      gruppiNomi.forEach(gruppo => prodottiSet.add(gruppo));
      
      setProdottiComuni(Array.from(prodottiSet));
      
      console.log(`📚 Caricati dati storici: ${varietaData.length} varietà, ${Array.from(coloriSet).length} colori, ${Array.from(prodottiSet).length} prodotti/gruppi`);
    } catch (err) {
      console.error('Errore nel caricamento dati storici:', err);
    }
  };

  const handleManualeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManuale(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFornitoreChange = (event: React.SyntheticEvent, value: any) => {
    setManuale(prev => ({ ...prev, fornitore: value }));
  };

  const handleNuovoProdottoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Gestione specifica per i campi numerici
    let nuovoValore;
    if (name === 'imballo' || name === 'quantita') {
      nuovoValore = value === '' ? 0 : Math.max(0, parseInt(value) || 0);
    } else if (name === 'prezzoAcquisto') {
      if (value === '') {
        nuovoValore = 0;
      } else {
        const normalizedValue = value.replace(',', '.');
        nuovoValore = Math.max(0, parseFloat(normalizedValue) || 0);
      }
    } else {
      nuovoValore = value;
    }
    
    setNuovoProdotto(prev => {
      const updated = { ...prev, [name]: nuovoValore };
      
      // 🧠 LOGICA INTELLIGENTE PER SUGGERIMENTI
      
      // Se l'utente ha inserito una varietà, suggerisci imballo e colore
      if (name === 'varieta' && value.length > 2) {
        // Cerca imballo comune per questa varietà
        const imballoSuggerito = imballiComuni[value];
        if (imballoSuggerito && imballoSuggerito !== updated.imballo) {
          console.log(`💡 Imballo suggerito per "${value}": ${imballoSuggerito}`);
          updated.imballo = imballoSuggerito;
        }
        
        // Suggerisci colore se presente nel nome
        if (!updated.colore) {
          const coloreTrovato = coloriComuni.find(c => 
            value.toLowerCase().includes(c) || 
            value.toLowerCase().includes(c.substring(0, 4))
          );
          if (coloreTrovato) {
            console.log(`🎨 Colore suggerito per "${value}": ${coloreTrovato}`);
            updated.colore = coloreTrovato;
          }
        }
        
        // Suggerisci gruppo se riconoscibile
        if (!updated.gruppo) {
          const gruppoSuggerito = suggerisciGruppo(value);
          if (gruppoSuggerito) {
            console.log(`📁 Gruppo suggerito per "${value}": ${gruppoSuggerito}`);
            updated.gruppo = gruppoSuggerito;
            updated.prodotto = value; // Il prodotto è spesso uguale alla varietà
          }
        }
      }
      
      // Validazione quantità/imballo
      if (name === 'imballo' || name === 'quantita') {
        const imballo = Number(name === 'imballo' ? nuovoValore : updated.imballo);
        const quantita = Number(name === 'quantita' ? nuovoValore : updated.quantita);
        
        if (imballo > 0 && quantita > 0 && quantita % imballo !== 0) {
          setQuantitaValida(false);
          setQuantitaSuggerita(Math.round(quantita / imballo) * imballo);
        } else {
          setQuantitaValida(true);
          setQuantitaSuggerita(null);
        }
      }
      
      return updated;
    });
  };

  const aggiungiProdotto = () => {
    // Controlli più user-friendly
    const campiMancanti: string[] = [];
    if (!nuovoProdotto.gruppo) campiMancanti.push('Gruppo');
    if (!nuovoProdotto.prodotto) campiMancanti.push('Prodotto');
    if (!nuovoProdotto.varieta) campiMancanti.push('Varietà');
    if (!nuovoProdotto.colore) campiMancanti.push('Colore');
    if (!nuovoProdotto.quantita || nuovoProdotto.quantita <= 0) campiMancanti.push('Quantità');
    if (!nuovoProdotto.prezzoAcquisto || nuovoProdotto.prezzoAcquisto <= 0) campiMancanti.push('Prezzo di Acquisto');
    
    if (campiMancanti.length > 0) {
      setError(`Campi obbligatori mancanti: ${campiMancanti.join(', ')}`);
      return;
    }
    
    if (!quantitaValida) {
      setError(`La quantità deve essere un multiplo di ${nuovoProdotto.imballo}. Quantità suggerita: ${quantitaSuggerita}`);
      return;
    }
    const prodotto: ProdottoFattura = {
      id: Date.now().toString(),
      ...nuovoProdotto,
      totale: nuovoProdotto.quantita * nuovoProdotto.prezzoAcquisto
    };
    setProdotti(prev => [...prev, prodotto]);
    if (prodotti.length === 0) setCampiBloccati(true);
    setNuovoProdotto({
      gruppo: '',
      prodotto: '',
      varieta: '',
      colore: '',
      altezza: '',
      qualita: '',
      provenienza: '',
      imballo: 1,
      quantita: 0,
      prezzoAcquisto: 0
    });
    setError(null);
  };

  const rimuoviProdotto = (id: string) => {
    setProdotti(prev => prev.filter(p => p.id !== id));
  };

  const salvaFattura = async () => {
    if (!manuale.fornitore || !manuale.numero || !manuale.data) {
      setError('Compila tutti i dati della fattura');
      return;
    }
    if (prodotti.length === 0) {
      setError('Aggiungi almeno un prodotto');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const totale = prodotti.reduce((sum, p) => sum + p.totale, 0);
      
      // 1. Salva la fattura
      const fatturaData = {
        numero: manuale.numero,
        tipo: 'acquisto' as const,
        fornitore_id: manuale.fornitore?.id,
        data: manuale.data,
        totale: totale,
        stato: 'emessa',
        note: `Fattura di acquisto da ${manuale.fornitore?.nome}`
      };

      const fatturaSalvata = await apiService.createFattura(fatturaData);
      console.log('✅ Fattura salvata:', fatturaSalvata);

      // 2. Per ogni prodotto, gestisci le giacenze e i movimenti
      for (const prodotto of prodotti) {
        try {
          // 1. Crea o trova il gruppo
          let gruppo = await apiService.createGruppo(prodotto.gruppo, `Gruppo per ${prodotto.gruppo}`);
          
          // 2. Crea o trova il prodotto collegato al gruppo
          let prodottoDB = await apiService.createProdotto({
            nome: prodotto.prodotto,
            gruppo_id: gruppo.id,
            descrizione: `Prodotto ${prodotto.prodotto} del gruppo ${prodotto.gruppo}`
          });
          
          // 3. Crea o trova la varietà collegata al prodotto
          console.log(`🌱 Creando varietà: ${prodotto.varieta} per prodotto ID: ${prodottoDB.id}`);
          const varieta = await apiService.createVarieta({
            nome: prodotto.varieta,
            prodotto_id: prodottoDB.id,
            prezzo_acquisto: prodotto.prezzoAcquisto,
            prezzo_vendita: prodotto.prezzoAcquisto * 1.3 // 30% di markup
          });
          console.log(`✅ Varietà creata:`, varieta);
          console.log(`🔍 ID varietà che verrà usato per giacenza: ${varieta.id}`);

          // Crea il dettaglio fattura
          const dettaglioFattura = await apiService.createDettaglioFattura(fatturaSalvata.id, {
            varieta_id: varieta.id,
            quantita: prodotto.quantita,
            prezzo_unitario: prodotto.prezzoAcquisto,
            totale: prodotto.totale,
            imballo: prodotto.imballo
          });
          console.log(`📋 Dettaglio fattura creato:`, dettaglioFattura);

          // La giacenza viene aggiornata automaticamente dal backend quando si crea il dettaglio fattura
          // Non serve chiamare incrementaGiacenza manualmente

          // Emetti evento giacenza aggiornata
          emitter.emitGiacenzaAggiornata({
            varieta_id: varieta.id,
            quantita: prodotto.quantita,
            prezzo_acquisto: prodotto.prezzoAcquisto
          });

          // Il movimento viene creato automaticamente dal backend quando si crea il dettaglio fattura
          // Non serve chiamare createMovimento manualmente

          // Emetti evento movimento creato
          emitter.emitMovimentoCreato({
            varieta_id: varieta.id,
            tipo: 'carico',
            quantita: prodotto.quantita
          });

          console.log(`✅ Prodotto ${prodotto.varieta} caricato in magazzino con movimento e giacenza aggiornati automaticamente`);
        } catch (err) {
          console.error(`❌ Errore nel caricamento prodotto ${prodotto.varieta}:`, err);
          // Continua con gli altri prodotti anche se uno fallisce
        }
      }

      setSuccess('✅ Fattura salvata, prodotti caricati in magazzino e movimenti registrati con successo!');
      
      // Emetti eventi di sincronizzazione completa
      emitter.emitFatturaCreata(fatturaSalvata);
      emitter.emitAcquistoCompletato(fatturaSalvata.id, totale);
      emitter.emitStatisticheAggiornate('acquisto');
      emitter.emitSyncRichiesta('InserimentoFattura');
      
      setProdotti([]);
      setManuale({
        fornitore: null,
        numero: '',
        data: new Date().toISOString().split('T')[0]
      });
    } catch (err: any) {
      console.error('❌ Errore nel salvataggio fattura:', err);
      setError('Errore nel salvataggio: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>Inserimento Manuale Fattura</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Autocomplete
              options={fornitori}
              getOptionLabel={option => option.nome || ''}
              value={manuale.fornitore}
              onChange={handleFornitoreChange}
              disabled={campiBloccati}
              renderInput={(params) => (
                <TextField {...params} label="Fornitore" required size="small" sx={{ flex: 1 }} helperText={campiBloccati ? "Bloccato dopo l'aggiunta del primo prodotto" : ""} />
              )}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
            />
            <TextField label="Numero Fattura" name="numero" value={manuale.numero} onChange={handleManualeChange} required size="small" sx={{ flex: 1 }} disabled={campiBloccati} helperText={campiBloccati ? "Bloccato dopo l'aggiunta del primo prodotto" : ""} />
            <TextField label="Data" name="data" type="date" value={manuale.data} onChange={handleManualeChange} required size="small" sx={{ flex: 1 }} disabled={campiBloccati} helperText={campiBloccati ? "Bloccato dopo l'aggiunta del primo prodotto" : ""} />
            {campiBloccati && (
              <Button variant="outlined" color="warning" onClick={() => {
                setCampiBloccati(false);
                setProdotti([]);
              }} sx={{ height: 40 }}>
                Sblocca/Reset Fattura
              </Button>
            )}
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>💡 Suggerimenti Intelligenti Attivi:</strong><br/>
              • Inserisci la <strong>varietà</strong> per primo - il sistema suggerirà automaticamente gruppo, colore e imballo<br/>
              • I <strong>colori</strong> si auto-completano da varietà già usate<br/>
              • Gli <strong>imballi</strong> si ricordano dalle importazioni precedenti<br/>
              • Tutti i campi contrassegnati con (*) sono obbligatori
            </Typography>
          </Alert>
          
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Prodotti</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2 }}>
            <Autocomplete
              freeSolo
              size="small"
              options={prodottiComuni}
              value={nuovoProdotto.gruppo}
              onInputChange={(_, newValue) => {
                setNuovoProdotto(prev => ({ ...prev, gruppo: newValue || '' }));
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Gruppo *" 
                  required 
                  helperText="🧠 Suggerimento automatico"
                />
              )}
            />
            
            <TextField 
              label="Prodotto *" 
              name="prodotto" 
              value={nuovoProdotto.prodotto} 
              onChange={handleNuovoProdottoChange} 
              required 
              size="small"
              helperText="Si auto-compila dalla varietà"
            />
            
            <TextField 
              label="Varietà *" 
              name="varieta" 
              value={nuovoProdotto.varieta} 
              onChange={handleNuovoProdottoChange} 
              required 
              size="small"
              helperText="🎯 Inserisci il nome del fiore"
            />
            
            <Autocomplete
              freeSolo
              size="small"
              options={coloriComuni}
              value={nuovoProdotto.colore}
              onInputChange={(_, newValue) => {
                setNuovoProdotto(prev => ({ ...prev, colore: newValue || '' }));
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Colore *" 
                  required 
                  helperText="🎨 Suggerimento automatico"
                />
              )}
            />
            <TextField label="Altezza" name="altezza" value={nuovoProdotto.altezza} onChange={handleNuovoProdottoChange} size="small" />
            <TextField label="Qualità" name="qualita" value={nuovoProdotto.qualita} onChange={handleNuovoProdottoChange} size="small" />
            <TextField label="Provenienza" name="provenienza" value={nuovoProdotto.provenienza} onChange={handleNuovoProdottoChange} size="small" />
            <TextField 
              label="Imballo" 
              name="imballo" 
              type="number" 
              value={nuovoProdotto.imballo} 
              onChange={handleNuovoProdottoChange} 
              size="small"
              helperText="💡 Si auto-compila dalla varietà"
              inputProps={{ 
                min: 1,
                step: 1,
                style: { textAlign: 'right' }
              }}
            />
            <Box>
              <TextField 
                label="Quantità" 
                name="quantita" 
                type="number" 
                value={nuovoProdotto.quantita} 
                onChange={handleNuovoProdottoChange} 
                required 
                size="small" 
                error={!quantitaValida} 
                helperText={!quantitaValida ? `La quantità deve essere multiplo di ${nuovoProdotto.imballo}. Es: ${quantitaSuggerita}` : ''}
                inputProps={{ 
                  min: 1,
                  step: 1,
                  style: { textAlign: 'right' }
                }}
                fullWidth
              />
              {!quantitaValida && quantitaSuggerita && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => setNuovoProdotto(prev => ({ ...prev, quantita: quantitaSuggerita! }))}
                  sx={{ mt: 1, width: '100%' }}
                >
                  Usa {quantitaSuggerita}
                </Button>
              )}
            </Box>
            <TextField 
              label="Prezzo Acquisto" 
              name="prezzoAcquisto" 
              type="number" 
              value={nuovoProdotto.prezzoAcquisto} 
              onChange={handleNuovoProdottoChange} 
              required 
              size="small"
              InputProps={{
                startAdornment: <span style={{ marginRight: 8 }}>€</span>,
              }}
              inputProps={{ 
                min: 0,
                step: 0.01,
                style: { textAlign: 'right' }
              }}
              helperText="Usa punto (.) o virgola (,) come separatore decimale"
            />
          </Box>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Button variant="contained" onClick={aggiungiProdotto} startIcon={<AddIcon />}>
              Aggiungi Prodotto
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => {
                console.log('📊 Dati suggerimenti caricati:');
                console.log(`🎨 Colori: ${coloriComuni.join(', ')}`);
                console.log(`📦 Imballi memorizzati: ${Object.keys(imballiComuni).length}`);
                console.log(`🌱 Varietà storiche: ${varietaStoriche.length}`);
              }}
              size="small"
            >
              🔍 Debug Suggerimenti
            </Button>
          </Stack>
          {prodotti.length > 0 && (
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Gruppo</TableCell>
                    <TableCell>Prodotto</TableCell>
                    <TableCell>Varietà</TableCell>
                    <TableCell>Colore</TableCell>
                    <TableCell>Quantità</TableCell>
                    <TableCell>Prezzo</TableCell>
                    <TableCell>Totale</TableCell>
                    <TableCell>Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prodotti.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.gruppo}</TableCell>
                      <TableCell>{p.prodotto}</TableCell>
                      <TableCell>{p.varieta}</TableCell>
                      <TableCell>{p.colore}</TableCell>
                      <TableCell>{p.quantita}</TableCell>
                      <TableCell>€{p.prezzoAcquisto.toFixed(2)}</TableCell>
                      <TableCell>€{p.totale.toFixed(2)}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => rimuoviProdotto(p.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Totale: €{prodotti.reduce((sum, p) => sum + p.totale, 0).toFixed(2)}
            </Typography>
            <Button variant="contained" onClick={salvaFattura} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Salva Fattura'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
} 

// Componente per lo storico delle fatture acquisto
export function StoricoFattureAcquisto() {
  const [fatture, setFatture] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fornitori, setFornitori] = useState<any[]>([]);
  const [filtri, setFiltri] = useState({
    fornitore_id: '',
    data_inizio: '',
    data_fine: '',
    numero: ''
  });
  const [fatturaSelezionata, setFatturaSelezionata] = useState<any>(null);
  const [dettagliFattura, setDettagliFattura] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editDettaglio, setEditDettaglio] = useState<any>(null);

  useEffect(() => {
    caricaFatture();
    caricaFornitori();
  }, [filtri]);

  const caricaFatture = async () => {
    try {
      setLoading(true);
      const response = await apiService.getFatture('acquisto');
      
      // Applica i filtri lato client per ora
      let fattureFiltrate = response;
      
      if (filtri.fornitore_id) {
        fattureFiltrate = fattureFiltrate.filter(f => f.fornitore_id === parseInt(filtri.fornitore_id));
      }
      
      if (filtri.data_inizio) {
        fattureFiltrate = fattureFiltrate.filter(f => new Date(f.data) >= new Date(filtri.data_inizio));
      }
      
      if (filtri.data_fine) {
        fattureFiltrate = fattureFiltrate.filter(f => new Date(f.data) <= new Date(filtri.data_fine));
      }
      
      if (filtri.numero) {
        fattureFiltrate = fattureFiltrate.filter(f => 
          f.numero.toLowerCase().includes(filtri.numero.toLowerCase())
        );
      }
      
      console.log('🔍 Fatture caricate:', response);
      console.log('🔍 Fatture filtrate:', fattureFiltrate);
      setFatture(fattureFiltrate);
    } catch (err: any) {
      console.error('❌ Errore nel caricamento fatture:', err);
      setError('Errore nel caricamento fatture: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const caricaFornitori = async () => {
    try {
      const response = await apiService.getFornitori();
      setFornitori(response);
    } catch (err: any) {
      console.error('Errore nel caricamento fornitori:', err);
    }
  };

  const caricaDettagliFattura = async (fatturaId: number) => {
    try {
      const response = await apiService.getDettagliFattura(fatturaId);
      setDettagliFattura(response);
    } catch (err: any) {
      console.error('Errore nel caricamento dettagli:', err);
    }
  };

  const handleFiltroChange = (campo: string, valore: string) => {
    setFiltri(prev => ({ ...prev, [campo]: valore }));
  };

  const handleSelezionaFattura = async (fattura: any) => {
    setFatturaSelezionata(fattura);
    await caricaDettagliFattura(fattura.id);
  };

  const handleModificaDettaglio = (dettaglio: any) => {
    setEditDettaglio(dettaglio);
    setEditMode(true);
  };

  const handleSalvaModifica = async () => {
    try {
      // Se la quantità è 0, cancella il dettaglio invece di aggiornarlo
      if (editDettaglio.quantita === 0) {
        const response = await apiService.deleteDettaglioFattura(editDettaglio.id);
        
        if (response.fattura_cancellata) {
          setError(`✅ Articolo cancellato. La fattura ${fatturaSelezionata.numero} è stata cancellata automaticamente perché rimasta senza articoli.`);
          setFatturaSelezionata(null);
          setDettagliFattura([]);
          await caricaFatture();
        } else {
          await caricaDettagliFattura(fatturaSelezionata.id);
        }
      } else {
        await apiService.updateDettaglioFattura(editDettaglio.id, {
          quantita: editDettaglio.quantita,
          prezzo_unitario: editDettaglio.prezzo_unitario,
          totale: editDettaglio.quantita * editDettaglio.prezzo_unitario
        });
        
        // Ricarica i dettagli
        await caricaDettagliFattura(fatturaSelezionata.id);
      }
      
      setEditMode(false);
      setEditDettaglio(null);
    } catch (err: any) {
      setError('Errore nel salvataggio: ' + (err.message || err));
    }
  };

  const handleCancellaDettaglio = async (dettaglio: any) => {
    try {
      // Verifica se può essere cancellato
      const statoScarico = await apiService.getStatoScaricoDettaglio(dettaglio.id);
      
      if (!statoScarico.puo_essere_cancellato) {
        setError(`Impossibile cancellare: ${dettaglio.varieta_nome} è già stato scaricato (${statoScarico.quantita_scaricata} pezzi)`);
        return;
      }
      
      const response = await apiService.deleteDettaglioFattura(dettaglio.id);
      
      if (response.fattura_cancellata) {
        // La fattura è stata cancellata automaticamente
        setError(`✅ Articolo cancellato. La fattura ${fatturaSelezionata.numero} è stata cancellata automaticamente perché rimasta senza articoli.`);
        setFatturaSelezionata(null);
        setDettagliFattura([]);
        // Ricarica la lista fatture
        await caricaFatture();
      } else {
        // Solo il dettaglio è stato cancellato
        await caricaDettagliFattura(fatturaSelezionata.id);
      }
    } catch (err: any) {
      setError('Errore nella cancellazione: ' + (err.message || err));
    }
  };

  const handleCancellaFattura = async (fattura: any) => {
    // Chiedi conferma prima di cancellare
    const conferma = window.confirm(
      `Sei sicuro di voler cancellare la fattura ${fattura.numero}?\n\n` +
      `Questa azione cancellerà:\n` +
      `• Tutti gli articoli della fattura\n` +
      `• Tutti i movimenti di magazzino associati\n` +
      `• Le giacenze dei fiori inseriti tramite questa fattura\n\n` +
      `⚠️ ATTENZIONE: La fattura non può essere cancellata se ha movimenti di vendita o distruzione.\n\n` +
      `L'operazione non può essere annullata.`
    );
    
    if (!conferma) return;
    
    try {
      const response = await apiService.deleteFattura(fattura.id);
      setError(`✅ Fattura ${fattura.numero} cancellata con successo!\n` +
        `• Articoli rimossi: ${response.dettagli_cancellati}\n` +
        `• Movimenti cancellati: ${response.movimenti_cancellati}\n` +
        `• Giacenze cancellate: ${response.giacenze_cancellate || 0}`);
      
      // Se la fattura cancellata era quella selezionata, resetta la selezione
      if (fatturaSelezionata?.id === fattura.id) {
        setFatturaSelezionata(null);
        setDettagliFattura([]);
      }
      
      // Ricarica la lista fatture
      await caricaFatture();
    } catch (err: any) {
      setError('Errore nella cancellazione fattura: ' + (err.message || err));
    }
  };

  const getFornitoreNome = (fornitoreId: number) => {
    const fornitore = fornitori.find(f => f.id === fornitoreId);
    return fornitore ? fornitore.nome : 'Fornitore non trovato';
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} gutterBottom>Storico Fatture Acquisto</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* Filtri */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Filtri</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            select
            label="Fornitore"
            value={filtri.fornitore_id}
            onChange={(e) => handleFiltroChange('fornitore_id', e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Tutti i fornitori</MenuItem>
            {fornitori.map(f => (
              <MenuItem key={f.id} value={f.id}>{f.nome}</MenuItem>
            ))}
          </TextField>
          <TextField
            type="date"
            label="Data inizio"
            value={filtri.data_inizio}
            onChange={(e) => handleFiltroChange('data_inizio', e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            label="Data fine"
            value={filtri.data_fine}
            onChange={(e) => handleFiltroChange('data_fine', e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Numero fattura"
            value={filtri.numero}
            onChange={(e) => handleFiltroChange('numero', e.target.value)}
            size="small"
          />
        </Box>
      </Paper>

      {/* Lista fatture */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Fatture ({fatture.length})
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Numero</TableCell>
                  <TableCell>Fornitore</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell align="right">Totale</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell>Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fatture.map(fattura => (
                  <TableRow 
                    key={fattura.id}
                    sx={{ 
                      bgcolor: fatturaSelezionata?.id === fattura.id ? '#e3f2fd' : 'inherit',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSelezionaFattura(fattura)}
                  >
                    <TableCell>{fattura.numero}</TableCell>
                    <TableCell>{getFornitoreNome(fattura.fornitore_id)}</TableCell>
                    <TableCell>{new Date(fattura.data).toLocaleDateString('it-IT')}</TableCell>
                    <TableCell align="right">€ {fattura.totale.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={fattura.stato || 'Emessa'} 
                        color={fattura.stato === 'pagata' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelezionaFattura(fattura);
                          }}
                          title="Visualizza dettagli"
                        >
                          <DownloadIcon />
                        </IconButton>
                        <IconButton 
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancellaFattura(fattura);
                          }}
                          title="Cancella fattura"
                        >
                          <CancelIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Dettagli fattura selezionata */}
      {fatturaSelezionata && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Dettagli Fattura {fatturaSelezionata.numero} - {getFornitoreNome(fatturaSelezionata.fornitore_id)}
          </Typography>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Varietà</TableCell>
                  <TableCell align="right">Quantità</TableCell>
                  <TableCell align="right">Prezzo Unit.</TableCell>
                  <TableCell align="right">Totale</TableCell>
                  <TableCell>Stato Scarico</TableCell>
                  <TableCell>Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dettagliFattura.map(dettaglio => (
                  <TableRow key={dettaglio.id}>
                    <TableCell>{dettaglio.varieta_nome || 'Varietà non trovata'}</TableCell>
                    <TableCell align="right">
                      {editMode && editDettaglio?.id === dettaglio.id ? (
                        <TextField
                          type="number"
                          value={editDettaglio.quantita}
                          onChange={(e) => setEditDettaglio(prev => ({
                            ...prev,
                            quantita: parseInt(e.target.value) || 0
                          }))}
                          size="small"
                          sx={{ width: 80 }}
                        />
                      ) : (
                        dettaglio.quantita
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {editMode && editDettaglio?.id === dettaglio.id ? (
                        <TextField
                          type="number"
                          value={editDettaglio.prezzo_unitario}
                          onChange={(e) => setEditDettaglio(prev => ({
                            ...prev,
                            prezzo_unitario: parseFloat(e.target.value) || 0
                          }))}
                          size="small"
                          sx={{ width: 80 }}
                        />
                      ) : (
                        `€ ${dettaglio.prezzo_unitario.toFixed(2)}`
                      )}
                    </TableCell>
                    <TableCell align="right">
                      € {(editMode && editDettaglio?.id === dettaglio.id 
                        ? editDettaglio.quantita * editDettaglio.prezzo_unitario 
                        : dettaglio.totale).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={dettaglio.quantita_scaricata > 0 ? `Scaricato ${dettaglio.quantita_scaricata}` : 'Non scaricato'}
                        color={dettaglio.quantita_scaricata > 0 ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {editMode && editDettaglio?.id === dettaglio.id ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={handleSalvaModifica}
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => {
                              setEditMode(false);
                              setEditDettaglio(null);
                            }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small"
                            onClick={() => handleModificaDettaglio(dettaglio)}
                            disabled={dettaglio.quantita_scaricata > 0}
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton 
                            size="small"
                            color="error"
                            onClick={() => handleCancellaDettaglio(dettaglio)}
                            disabled={dettaglio.quantita_scaricata > 0}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
} 