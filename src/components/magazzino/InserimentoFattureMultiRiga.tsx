import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Card,
  CardContent,
  Chip,
  Fade,
  Slide,
  Grow,
  alpha,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  Assessment as StatsIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  CloudUpload as CloudUploadIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../../lib/apiService';
import { supabase } from '../../lib/apiService';

interface RigaFattura {
  // 8 caratteristiche per ogni riga (aggiunta qualità)
  id_gruppo: number;
  nome_prodotto: string;
  id_colore: number;
  id_provenienza: number;
  id_foto: number;
  id_imballo: number;
  id_altezza: number;
  id_qualita: number;  // NUOVA: 8ª caratteristica
  
  // Dati di carico per ogni riga
  quantita: number;
  prezzo_acquisto_per_stelo: number;
  
  // Totale riga (solo costo acquisto)
  totale_riga: number;
}

interface PrezzoVendita {
  // Percentuali di ricarico
  percentuale_ricarico_1: number;
  percentuale_ricarico_2: number;
  percentuale_ricarico_3: number;
  
  // Prezzi finali calcolati (costo + costi analitici spalmati + ricarico)
  prezzo_vendita_1: number;
  prezzo_vendita_2: number;
  prezzo_vendita_3: number;
}

interface FatturaCompleta {
  // Dati fattura base
  numero_fattura: string;
  data: string;
  id_fornitore: number;
  imponibile: number;
  iva: number;
  totale: number;
  stato: string;
  note: string;
  
  // Array di righe fattura (fino a 100+ articoli)
  righe: RigaFattura[];
  
  // Costi analitici (globali per tutta la fattura)
  costo_trasporto: number;
  id_fornitore_trasporto: number;  // NUOVO: fornitore per trasporto
  costo_commissioni: number;
  id_fornitore_commissioni: number;  // NUOVO: fornitore per commissioni
  costo_imballaggi: number;
  id_fornitore_imballaggi: number;  // NUOVO: fornitore per imballaggi
  note_costi: string;
  
  // Prezzi di vendita con ricarichi (calcolati dopo i costi analitici)
  prezzi_vendita: PrezzoVendita[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`fattura-tabpanel-${index}`}
      aria-labelledby={`fattura-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

export default function InserimentoFattureMultiRiga() {
  // === STILI iOS 18 MODERNI ===
  const modernStyles = {
    // Colori
    colors: {
      primary: '#667eea',
      secondary: '#764ba2',
      success: '#4CAF50',
      error: '#f44336',
      warning: '#ff9800',
      text: '#2c3e50'
    },
    
    // Glassmorphism principale
    glassmorphic: {
      background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      border: '1px solid rgba(255,255,255,0.2)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    },
    
    // Container principale
    mainContainer: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px',
    },
    
    // Card articoli con effetto iOS
    articleCard: {
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      border: '1px solid rgba(255,255,255,0.3)',
      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }
    },
    
    // Componenti
    components: {
      input: {
        borderRadius: '16px',
        backgroundColor: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: 'rgba(255,255,255,1)',
          transform: 'scale(1.02)',
        },
        '&.Mui-focused': {
          backgroundColor: 'rgba(255,255,255,1)',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
        }
      },
      glass: {
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.2)'
      }
    },
    
    // Input fields moderni
    modernInput: {
      '& .MuiOutlinedInput-root': {
        borderRadius: '16px',
        backgroundColor: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: 'rgba(255,255,255,1)',
          transform: 'scale(1.02)',
        },
        '&.Mui-focused': {
          backgroundColor: 'rgba(255,255,255,1)',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
        }
      },
      '& .MuiInputLabel-root': {
        fontWeight: 600,
        color: '#667eea',
      }
    },
    
    // Bottoni iOS style
    primaryButton: {
      borderRadius: '16px',
      padding: '12px 24px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '16px',
      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 30px rgba(102, 126, 234, 0.6)',
      }
    },
    
    // Tab stile iOS
    modernTab: {
      borderRadius: '16px',
      margin: '0 4px',
      textTransform: 'none',
      fontWeight: 600,
      transition: 'all 0.3s ease',
      '&.Mui-selected': {
        backgroundColor: 'rgba(255,255,255,0.9)',
        color: '#667eea',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }
    }
  };

  const [fornitori, setFornitori] = useState<any[]>([]);
  const [gruppi, setGruppi] = useState<any[]>([]);
  const [colori, setColori] = useState<any[]>([]);
  const [provenienze, setProvenienze] = useState<any[]>([]);
  const [foto, setFoto] = useState<any[]>([]);
  const [imballaggi, setImballaggi] = useState<any[]>([]);
  const [altezze, setAltezze] = useState<any[]>([]);
  const [qualita, setQualita] = useState<any[]>([]);  // NUOVA: 8ª caratteristica
  
  // NUOVO: Lista fatture esistenti
  const [fattureEsistenti, setFattureEsistenti] = useState<any[]>([]);
  const [fattureFiltrate, setFattureFiltrate] = useState<any[]>([]);
  const [fatturaSelezionata, setFatturaSelezionata] = useState<any>(null);
  const [modalitaModifica, setModalitaModifica] = useState(false);
  
  // NUOVO: Stati per filtri
  const [filtri, setFiltri] = useState({
    numeroFattura: '',
    fornitore: '',
    dataInizio: '',
    dataFine: '',
    stato: '',
    prodotto: ''
  });
  
  const [ordinamento, setOrdinamento] = useState({
    campo: 'data',
    direzione: 'desc' as 'asc' | 'desc'
  });
  
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [activeTab, setActiveTab] = useState(0);
  
  // Stati per upload foto
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  // Stati per eliminazione fattura
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [fatturaToDelete, setFatturaToDelete] = useState<any>(null);
  const [deleteDetails, setDeleteDetails] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  
  const [formData, setFormData] = useState<FatturaCompleta>({
    numero_fattura: '',
    data: new Date().toISOString().split('T')[0],
    id_fornitore: 0,
    imponibile: 0,
    iva: 10,
    totale: 0,
    stato: 'bozza',
    note: '',
    righe: [
      {
        id_gruppo: 0,
        nome_prodotto: '',
        id_colore: 0,
        id_provenienza: 0,
        id_foto: 0,
        id_imballo: 0,
        id_altezza: 0,
        id_qualita: 0,  // NUOVA: 8ª caratteristica
        quantita: 0,
        prezzo_acquisto_per_stelo: 0,
        totale_riga: 0
      }
    ],
    costo_trasporto: 0,
    id_fornitore_trasporto: 0,  // NUOVO: fornitore per trasporto
    costo_commissioni: 0,
    id_fornitore_commissioni: 0,  // NUOVO: fornitore per commissioni
    costo_imballaggi: 0,
    id_fornitore_imballaggi: 0,  // NUOVO: fornitore per imballaggi
    note_costi: '',
    prezzi_vendita: [
      {
        percentuale_ricarico_1: 50,  // Default 50%
        percentuale_ricarico_2: 75,  // Default 75%
        percentuale_ricarico_3: 100, // Default 100%
        prezzo_vendita_1: 0,
        prezzo_vendita_2: 0,
        prezzo_vendita_3: 0
      }
    ]
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calcolaTotali();
  }, [formData.righe.length, formData.costo_trasporto, formData.costo_commissioni, formData.costo_imballaggi]);

  useEffect(() => {
    calcolaPrezziVendita();
  }, [formData.righe, formData.costo_trasporto, formData.costo_commissioni, formData.costo_imballaggi]);

  // NUOVO: Effect per filtrare le fatture
  useEffect(() => {
    applicaFiltri();
  }, [filtri, fattureEsistenti, ordinamento]);

  // NUOVO: Funzione per applicare i filtri e ordinamento
  const applicaFiltri = () => {
    // Raggruppa documenti prima di filtrare
    const fattureRaggruppate = raggruppaDocumentiPerFattura(fattureEsistenti);
    let risultato = [...fattureRaggruppate];

    // Filtro per numero documento
    if (filtri.numeroFattura) {
      risultato = risultato.filter(f => 
        f.numero?.toLowerCase().includes(filtri.numeroFattura.toLowerCase())
      );
    }

    // Filtro per fornitore
    if (filtri.fornitore) {
      risultato = risultato.filter(f => 
        f.fornitore_nome?.toLowerCase().includes(filtri.fornitore.toLowerCase())
      );
    }

    // Filtro per data inizio
    if (filtri.dataInizio) {
      risultato = risultato.filter(f => 
        f.data_fattura >= filtri.dataInizio
      );
    }

    // Filtro per data fine
    if (filtri.dataFine) {
      risultato = risultato.filter(f => 
        f.data_fattura <= filtri.dataFine
      );
    }

    // Filtro per stato
    if (filtri.stato) {
      risultato = risultato.filter(f => 
        f.stato_fattura === filtri.stato
      );
    }

    // Filtro per prodotto (cerca negli articoli)
    if (filtri.prodotto) {
      risultato = risultato.filter(f => 
        f.articoli_preview.some(articolo => 
          articolo?.toLowerCase().includes(filtri.prodotto.toLowerCase())
        )
      );
    }

    // Ordinamento
    risultato.sort((a, b) => {
      const direzione = ordinamento.direzione === 'asc' ? 1 : -1;
      
      switch (ordinamento.campo) {
        case 'data':
          return direzione * (new Date(a.data_fattura || 0).getTime() - new Date(b.data_fattura || 0).getTime());
        case 'numero_fattura':
          return direzione * (a.numero || '').localeCompare(b.numero || '');
        case 'totale':
          return direzione * ((a.totale_fattura || 0) - (b.totale_fattura || 0));
        case 'fornitore':
          return direzione * (a.fornitore_nome || '').localeCompare(b.fornitore_nome || '');
        default:
          return 0;
      }
    });

    setFattureFiltrate(risultato);
  };

  // NUOVO: Reset filtri
  const resetFiltri = () => {
    setFiltri({
      numeroFattura: '',
      fornitore: '',
      dataInizio: '',
      dataFine: '',
      stato: '',
      prodotto: ''
    });
  };

  // ========= FUNZIONI UPLOAD FOTO =========
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validazione tipo file
      if (!file.type.startsWith('image/')) {
        setSnackbar({ open: true, message: 'Seleziona solo file immagine (JPG, PNG, etc.)', severity: 'error' });
        return;
      }
      
      // Validazione dimensione (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({ open: true, message: 'Il file deve essere inferiore a 5MB', severity: 'error' });
        return;
      }
      
      setSelectedFile(file);
      
      // Crea anteprima
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) return;

    setUploadingPhoto(true);
    try {
      console.log('📤 Upload foto in corso...');
      
      // Upload tramite apiService
      const { foto: newFoto } = await apiService.uploadFoto(selectedFile);
      
      console.log('✅ Foto caricata:', newFoto);
      
      // Aggiorna lista foto
      const fotoAggiornate = await apiService.getFoto();
      setFoto(fotoAggiornate);
      
      // Auto-seleziona la foto appena caricata nella riga corrente
      // (assumendo che stiamo lavorando sulla prima riga, puoi modificare la logica)
      if (formData.righe.length > 0) {
        updateRiga(0, 'id_foto', newFoto.id);
      }
      
      // Chiudi dialog e resetta
      setUploadDialog(false);
      setSelectedFile(null);
      setPreviewUrl('');
      
      setSnackbar({ 
        open: true, 
        message: `Foto "${newFoto.nome}" caricata e selezionata con successo!`, 
        severity: 'success' 
      });
      
    } catch (error) {
      console.error('❌ Errore upload foto:', error);
      setSnackbar({ 
        open: true, 
        message: 'Errore durante il caricamento della foto', 
        severity: 'error' 
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const resetUploadDialog = () => {
    setUploadDialog(false);
    setSelectedFile(null);
    setPreviewUrl('');
  };

  // ========= FUNZIONI ELIMINAZIONE FATTURA =========
  
  const handleEliminaFattura = async (fattura: any) => {
    try {
      console.log('🗑️ Richiesta eliminazione fattura:', fattura);
      
      // Verifica se la fattura può essere eliminata
      const verifica = await apiService.verificaEliminabilitaFattura(fattura.fattura_acquisto_id);
      
      if (!verifica.eliminabile) {
        setSnackbar({
          open: true,
          message: `❌ Impossibile eliminare: ${verifica.motivi.join(', ')}`,
          severity: 'error'
        });
        return;
      }
      
      // Imposta i dati per il dialog di conferma
      setFatturaToDelete(fattura);
      setDeleteDetails(verifica.dettagli);
      setDeleteDialog(true);
      
    } catch (error) {
      console.error('❌ Errore verifica eliminazione:', error);
      setSnackbar({
        open: true,
        message: 'Errore nella verifica di eliminabilità della fattura',
        severity: 'error'
      });
    }
  };

  const confermaEliminazione = async () => {
    if (!fatturaToDelete) return;
    
    setDeleting(true);
    try {
      console.log('🗑️ Conferma eliminazione fattura:', fatturaToDelete.fattura_acquisto_id);
      
      await apiService.eliminaFattura(fatturaToDelete.fattura_acquisto_id);
      
      setSnackbar({
        open: true,
        message: `✅ Fattura "${fatturaToDelete.numero}" eliminata con successo!`,
        severity: 'success'
      });
      
      // Chiudi dialog e ricarica dati
      setDeleteDialog(false);
      setFatturaToDelete(null);
      setDeleteDetails(null);
      
      // Ricarica lista fatture
      await loadData();
      
    } catch (error) {
      console.error('❌ Errore eliminazione fattura:', error);
      setSnackbar({
        open: true,
        message: 'Errore durante l\'eliminazione della fattura',
        severity: 'error'
      });
    } finally {
      setDeleting(false);
    }
  };

  const annullaEliminazione = () => {
    setDeleteDialog(false);
    setFatturaToDelete(null);
    setDeleteDetails(null);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Caricamento dati anagrafica...');
      
      // Carica prima l'anagrafica base (sicura)
      const [
        fornitoriData,
        gruppiData,
        coloriData,
        provenienceData,
        fotoData,
        imballaggiData,
        altezzeData,
        qualitaData
      ] = await Promise.all([
        apiService.getFornitori(),
        apiService.getGruppi(),
        apiService.getColori(),
        apiService.getProvenienze(),
        apiService.getFoto(),
        apiService.getImballaggi(),
        apiService.getAltezze(),
        apiService.getQualita()
      ]);
      
      console.log('✅ Anagrafica caricata, ora carico documenti...');
      
      // Carica i documenti separatamente per gestire errori
      let documentiData = [];
      try {
        documentiData = await apiService.getDocumentiCarico();
        console.log('✅ Documenti caricati:', documentiData.length);
      } catch (docError) {
        console.error('❌ Errore caricamento documenti (uso fallback):', docError);
        documentiData = []; // Fallback: array vuoto
      }
      
      // Raggruppa documenti per fattura per la visualizzazione
      const fattureRaggruppate = raggruppaDocumentiPerFattura(documentiData);
      
      setFornitori(fornitoriData);
      setGruppi(gruppiData);
      setColori(coloriData);
      setProvenienze(provenienceData);
      setFoto(fotoData);
      setImballaggi(imballaggiData);
      setAltezze(altezzeData);
      setQualita(qualitaData);
      setFattureEsistenti(documentiData);  // Conserva i dati raw per l'editing
      setFattureFiltrate(fattureRaggruppate);   // Usa i dati raggruppati per la visualizzazione
      
      // DEBUG: Verifica che le altezze siano caricate
      console.log('🔍 DEBUG ALTEZZE:', {
        altezzeData,
        coloriData,
        gruppiData: gruppiData.length,
        altezzeCaricate: altezzeData.length
      });
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      setSnackbar({
        open: true,
        message: 'Errore nel caricamento dei dati',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Funzione per raggruppare documenti per fattura
  const raggruppaDocumentiPerFattura = (documenti: any[]) => {
    const gruppiFatture = new Map();
    
    documenti.forEach(doc => {
      const chiaveFattura = doc.fattura_acquisto_id;
      
      if (!gruppiFatture.has(chiaveFattura)) {
        // Prima volta che vediamo questa fattura
        gruppiFatture.set(chiaveFattura, {
          id: chiaveFattura,
          fattura_acquisto_id: doc.fattura_acquisto_id,
          numero: doc.numero,
          data_fattura: doc.data_fattura,
          totale_fattura: doc.totale_fattura,
          stato_fattura: doc.stato_fattura,
          note_fattura: doc.note_fattura,
          fornitore_id: doc.fornitore_id,
          fornitore_nome: doc.fornitore_nome,
          fornitore_piva: doc.fornitore_piva,
          created_at: doc.created_at,
          articoli_count: 1,
          articoli_preview: [doc.prodotto_nome]
        });
      } else {
        // Aggiungi articolo alla fattura esistente
        const fattura = gruppiFatture.get(chiaveFattura);
        fattura.articoli_count++;
        if (fattura.articoli_preview.length < 3) {
          fattura.articoli_preview.push(doc.prodotto_nome);
        }
      }
    });
    
    return Array.from(gruppiFatture.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  const calcolaTotali = () => {
    const totaleRighe = formData.righe.reduce((acc, riga) => {
      const totaleRiga = riga.quantita * riga.prezzo_acquisto_per_stelo;
      return acc + totaleRiga;
    }, 0);
    
    const totaliCosti = formData.costo_trasporto + formData.costo_commissioni + formData.costo_imballaggi;
    const imponibile = totaleRighe + totaliCosti;
    const totale = imponibile + (imponibile * formData.iva / 100);
    
    // Aggiorniamo solo i totali, non le righe per evitare loop infiniti
    setFormData(prev => ({
      ...prev,
      imponibile,
      totale
    }));
  };

  // Funzione per calcolare i prezzi di vendita con costi spalamati
  const calcolaPrezziVendita = () => {
    const totaleQuantita = formData.righe.reduce((acc, riga) => acc + riga.quantita, 0);
    const totaliCosti = formData.costo_trasporto + formData.costo_commissioni + formData.costo_imballaggi;
    const costoAnaliticoPerStelo = totaleQuantita > 0 ? totaliCosti / totaleQuantita : 0;

    const nuoviPrezziVendita = formData.righe.map((riga, index) => {
      const costoTotalePerStelo = riga.prezzo_acquisto_per_stelo + costoAnaliticoPerStelo;
      const prezzoVendita = formData.prezzi_vendita[index] || {
        percentuale_ricarico_1: 50,
        percentuale_ricarico_2: 75,
        percentuale_ricarico_3: 100,
        prezzo_vendita_1: 0,
        prezzo_vendita_2: 0,
        prezzo_vendita_3: 0
      };

      return {
        ...prezzoVendita,
        prezzo_vendita_1: costoTotalePerStelo * (1 + prezzoVendita.percentuale_ricarico_1 / 100),
        prezzo_vendita_2: costoTotalePerStelo * (1 + prezzoVendita.percentuale_ricarico_2 / 100),
        prezzo_vendita_3: costoTotalePerStelo * (1 + prezzoVendita.percentuale_ricarico_3 / 100)
      };
    });

    setFormData(prev => ({
      ...prev,
      prezzi_vendita: nuoviPrezziVendita
    }));
  };

  // Funzione reattiva per aggiornare i costi e ricalcolare tutto
  const updateCosto = (campo: 'costo_trasporto' | 'costo_commissioni' | 'costo_imballaggi', valore: number) => {
    setFormData(prev => {
      const newFormData = { ...prev, [campo]: valore };
      
      // Ricalcola immediatamente i totali
      const totaleRighe = newFormData.righe.reduce((acc, riga) => acc + (riga.quantita * riga.prezzo_acquisto_per_stelo), 0);
      const totaliCosti = newFormData.costo_trasporto + newFormData.costo_commissioni + newFormData.costo_imballaggi;
      const imponibile = totaleRighe + totaliCosti;
      const totale = imponibile + (imponibile * newFormData.iva / 100);
      
      newFormData.imponibile = imponibile;
      newFormData.totale = totale;
      
      return newFormData;
    });
    
    // Ricalcola prezzi di vendita con il nuovo spalmo
    setTimeout(() => {
      calcolaPrezziVendita();
    }, 0);
  };

  // Funzione reattiva per aggiornare l'IVA e ricalcolare il totale
  const updateIva = (nuovaIva: number) => {
    setFormData(prev => {
      const newFormData = { ...prev, iva: nuovaIva };
      const totale = newFormData.imponibile + (newFormData.imponibile * nuovaIva / 100);
      newFormData.totale = totale;
      return newFormData;
    });
  };

  const aggiungiRiga = () => {
    const nuovaRiga: RigaFattura = {
      id_gruppo: 0,
      nome_prodotto: '',
      id_colore: 0,
      id_provenienza: 0,
      id_foto: 0,
      id_imballo: 0,
      id_altezza: 0,
      id_qualita: 0,  // NUOVA: 8ª caratteristica
      quantita: 0,
      prezzo_acquisto_per_stelo: 0,
      totale_riga: 0
    };
    
    const nuovoPrezzoVendita: PrezzoVendita = {
      percentuale_ricarico_1: 50,
      percentuale_ricarico_2: 75,
      percentuale_ricarico_3: 100,
      prezzo_vendita_1: 0,
      prezzo_vendita_2: 0,
      prezzo_vendita_3: 0
    };
    
    setFormData(prev => ({
      ...prev,
      righe: [...prev.righe, nuovaRiga],
      prezzi_vendita: [...prev.prezzi_vendita, nuovoPrezzoVendita]
    }));
  };

  const rimuoviRiga = async (index: number) => {
    if (formData.righe.length > 1) {
      // TEMPORANEO: Validazione cancellazione disabilitata per debug
      /*
      const riga = formData.righe[index];
      
      // VERIFICA: Solo in modalità modifica controlla se l'articolo può essere cancellato
      if (modalitaModifica && riga.id_gruppo && riga.id_prodotto && riga.id_colore) {
        try {
          // Trova l'articolo corrispondente
          const articoli = await apiService.getArticoli();
          const articolo = articoli.find(a => 
            a.gruppo_id === riga.id_gruppo &&
            a.prodotto_id === riga.id_prodotto &&
            a.colore_id === riga.id_colore
          );
          
          if (articolo) {
            const canDelete = await apiService.canDeleteArticolo(articolo.id);
            if (!canDelete.canDelete) {
              setSnackbar({
                open: true,
                message: canDelete.reason || 'Impossibile rimuovere questo articolo',
                severity: 'error'
              });
              return; // Blocca la rimozione
            }
          }
        } catch (error) {
          console.warn('Verifica cancellazione non riuscita:', error);
          // In caso di errore, permetti comunque la rimozione (fallback)
        }
      }
      */
      
      setFormData(prev => ({
        ...prev,
        righe: prev.righe.filter((_, i) => i !== index),
        prezzi_vendita: prev.prezzi_vendita.filter((_, i) => i !== index)
      }));
    }
  };

  const updateRiga = async (index: number, field: keyof RigaFattura, value: any) => {
    // TEMPORANEO: Validazione quantità imballo disabilitata per debug
    /*
    // Validazione quantità per imballo
    if (field === 'quantita' && value > 0) {
      const riga = formData.righe[index];
      if (riga.id_imballo && riga.id_gruppo && riga.id_prodotto && riga.id_colore) {
        try {
          // Trova l'articolo per ottenere l'imballo
          const articoli = await apiService.getArticoli();
          const articolo = articoli.find(a => 
            a.gruppo_id === riga.id_gruppo &&
            a.prodotto_id === riga.id_prodotto &&
            a.colore_id === riga.id_colore
          );
          
          if (articolo) {
            const validazione = await apiService.validateQuantitaImballo(articolo.id, value);
            if (!validazione.valid) {
              setSnackbar({
                open: true,
                message: validazione.message || 'Quantità non valida per l\'imballo selezionato',
                severity: 'error'
              });
              return; // Non aggiornare se la validazione fallisce
            }
          }
        } catch (error) {
          console.warn('Validazione imballo non riuscita:', error);
          // Continua comunque con l'aggiornamento
        }
      }
    }
    */

    setFormData(prev => {
      const newFormData = {
        ...prev,
        righe: prev.righe.map((riga, i) => {
          if (i === index) {
            const updatedRiga = { ...riga, [field]: value };
            // Calcola automaticamente il totale_riga quando cambiano quantità o prezzo
            if (field === 'quantita' || field === 'prezzo_acquisto_per_stelo') {
              updatedRiga.totale_riga = updatedRiga.quantita * updatedRiga.prezzo_acquisto_per_stelo;
            }
            return updatedRiga;
          }
          return riga;
        })
      };
      
      // Ricalcola immediatamente tutti i totali quando cambiano le righe
      if (field === 'quantita' || field === 'prezzo_acquisto_per_stelo') {
        const totaleRighe = newFormData.righe.reduce((acc, riga) => acc + (riga.quantita * riga.prezzo_acquisto_per_stelo), 0);
        const totaliCosti = newFormData.costo_trasporto + newFormData.costo_commissioni + newFormData.costo_imballaggi;
        const imponibile = totaleRighe + totaliCosti;
        const totale = imponibile + (imponibile * newFormData.iva / 100);
        
        newFormData.imponibile = imponibile;
        newFormData.totale = totale;
      }
      
      return newFormData;
    });
    
    // Ricalcola prezzi di vendita se necessario
    if (field === 'quantita' || field === 'prezzo_acquisto_per_stelo') {
      // Ritarda il calcolo prezzi per permettere al setState di completarsi
      setTimeout(() => {
        calcolaPrezziVendita();
      }, 0);
    }
  };

  const handleOpenDialog = () => {
    // Reset per nuova fattura
    setModalitaModifica(false);
    setFatturaSelezionata(null);
    setActiveTab(0);
    setFormData({
      numero_fattura: '',
      data: new Date().toISOString().split('T')[0],
      id_fornitore: 0,
      imponibile: 0,
      iva: 10,
      totale: 0,
      stato: 'bozza',
      note: '',
      righe: [
        {
          id_gruppo: 0,
          nome_prodotto: '',
          id_colore: 0,
          id_provenienza: 0,
          id_foto: 0,
          id_imballo: 0,
          id_altezza: 0,
          id_qualita: 0,
          quantita: 0,
          prezzo_acquisto_per_stelo: 0,
          totale_riga: 0
        }
      ],
      costo_trasporto: 0,
      id_fornitore_trasporto: 0,
      costo_commissioni: 0,
      id_fornitore_commissioni: 0,
      costo_imballaggi: 0,
      id_fornitore_imballaggi: 0,
      note_costi: '',
      prezzi_vendita: [
        {
          percentuale_ricarico_1: 50,
          percentuale_ricarico_2: 75,
          percentuale_ricarico_3: 100,
          prezzo_vendita_1: 0,
          prezzo_vendita_2: 0,
          prezzo_vendita_3: 0
        }
      ]
    });
    setOpenDialog(true);
  };

  // CORRETTO: Apri documento carico esistente per modifica
  const handleModificaFattura = async (documento: any) => {
    setModalitaModifica(true);
    setFatturaSelezionata(documento);
    setActiveTab(0);
    
    try {
      // Trova tutti gli articoli della stessa fattura
      const articoliDellaFattura = fattureEsistenti.filter(doc => 
        doc.fattura_acquisto_id === documento.fattura_acquisto_id
      );
      
      console.log('🔍 Articoli della fattura:', articoliDellaFattura);
      
      // NUOVO: Carica i costi reali dalla tabella costi_fattura
      const costiReali = await apiService.getCostiFattura(documento.fattura_acquisto_id);
      console.log('💰 Costi reali caricati:', costiReali);
      console.log('🔍 DEBUG: Numero costi trovati:', costiReali.length);
      
      // Estrai i costi per tipologia
      const costoTrasporto = costiReali.find(c => c.tipo_costo === 'trasporto');
      const costoCommissioni = costiReali.find(c => c.tipo_costo === 'commissioni');
      const costoImballaggi = costiReali.find(c => c.tipo_costo === 'imballaggi');
      
      console.log('🚛 Costo Trasporto trovato:', costoTrasporto);
      console.log('💼 Costo Commissioni trovato:', costoCommissioni);
      console.log('📦 Costo Imballaggi trovato:', costoImballaggi);
      
      // Debug: mostra tutti i tipi di costo disponibili
      console.log('🔍 Tipi di costo disponibili:', costiReali.map(c => c.tipo_costo));
      
      // Converti documento carico esistente in formato del form
      // Calcola l'imponibile correttamente dalle righe e dai costi invece che dal totale
      const totaleRighe = articoliDellaFattura.reduce((acc: number, art: any) => {
        return acc + ((art.quantita || 0) * (art.prezzo_acquisto_per_stelo || 0));
      }, 0);
      
      const costiAnalitici = (costoTrasporto?.importo || 0) + (costoCommissioni?.importo || 0) + (costoImballaggi?.importo || 0);
      const imponibileCalcolato = totaleRighe + costiAnalitici;
      const totaleCalcolato = imponibileCalcolato + (imponibileCalcolato * 10 / 100);
      
      const fatturaConvertita: FatturaCompleta = {
        numero_fattura: documento.numero || '',
        data: documento.data_fattura || new Date().toISOString().split('T')[0],
        id_fornitore: documento.fornitore_id || 0,
        imponibile: imponibileCalcolato,
        iva: 10,
        totale: totaleCalcolato,
        stato: documento.stato_fattura || 'bozza',
        note: documento.note_fattura || '',
        
        // Crea righe da articoli della fattura
        righe: articoliDellaFattura.length > 0 ? 
          articoliDellaFattura.map((art: any) => ({
            id_gruppo: art.gruppo_id || 0,
            nome_prodotto: art.prodotto_nome || '',
            id_colore: art.colore_id || 0,
            id_provenienza: art.provenienza_id || 0,
            id_foto: art.foto_id || 0,
            id_imballo: art.imballo_id || 0,
            id_altezza: art.altezza_id || 0,
            id_qualita: art.qualita_id || 0,
            quantita: art.quantita || 0,
            prezzo_acquisto_per_stelo: art.prezzo_acquisto_per_stelo || 0,
            totale_riga: (art.quantita || 0) * (art.prezzo_acquisto_per_stelo || 0)
          })) : [
            {
              id_gruppo: 0,
              nome_prodotto: '',
              id_colore: 0,
              id_provenienza: 0,
              id_foto: 0,
              id_imballo: 0,
              id_altezza: 0,
              id_qualita: 0,
              quantita: 0,
              prezzo_acquisto_per_stelo: 0,
              totale_riga: 0
            }
          ],
        
        // COSTI ANALITICI REALI dalla tabella costi_fattura
        costo_trasporto: costoTrasporto?.importo || 0,
        id_fornitore_trasporto: costoTrasporto?.fornitore_id || 0,
        costo_commissioni: costoCommissioni?.importo || 0,
        id_fornitore_commissioni: costoCommissioni?.fornitore_id || 0,
        costo_imballaggi: costoImballaggi?.importo || 0,
        id_fornitore_imballaggi: costoImballaggi?.fornitore_id || 0,
        note_costi: costiReali.map(c => c.note).filter(n => n).join('; ') || '',
        
        // Prezzi di vendita da articoli esistenti
        prezzi_vendita: articoliDellaFattura.length > 0 ?
          articoliDellaFattura.map((art: any) => ({
            percentuale_ricarico_1: 50,
            percentuale_ricarico_2: 75,
            percentuale_ricarico_3: 100,
            prezzo_vendita_1: art.prezzo_vendita_1 || 0,
            prezzo_vendita_2: art.prezzo_vendita_2 || 0,
            prezzo_vendita_3: art.prezzo_vendita_3 || 0
          })) : [
            {
              percentuale_ricarico_1: 50,
              percentuale_ricarico_2: 75,
              percentuale_ricarico_3: 100,
              prezzo_vendita_1: 0,
              prezzo_vendita_2: 0,
              prezzo_vendita_3: 0
            }
          ]
      };
      
      console.log('🔄 Fattura convertita con costi reali:', fatturaConvertita);
      console.log('💰 DEBUG COSTI nel formData:', {
        costo_trasporto: fatturaConvertita.costo_trasporto,
        costo_commissioni: fatturaConvertita.costo_commissioni,
        costo_imballaggi: fatturaConvertita.costo_imballaggi
      });
      setFormData(fatturaConvertita);
      setOpenDialog(true);
      
    } catch (error) {
      console.error('❌ Errore caricamento dati per modifica:', error);
      setSnackbar({
        open: true,
        message: 'Errore nel caricamento dei dati per la modifica',
        severity: 'error'
      });
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // ===== VALIDAZIONE CAMPI OBBLIGATORI =====
      const erroriValidazione = [];

      // Controllo fornitore
      if (!formData.id_fornitore || formData.id_fornitore === 0) {
        erroriValidazione.push('Seleziona un fornitore');
      }

      // Controllo numero fattura
      if (!formData.numero_fattura || formData.numero_fattura.trim() === '') {
        erroriValidazione.push('Inserisci il numero fattura');
      }

      // Controllo data
      if (!formData.data) {
        erroriValidazione.push('Inserisci la data fattura');
      }

      // Controllo righe
      if (!formData.righe || formData.righe.length === 0) {
        erroriValidazione.push('Aggiungi almeno una riga articolo');
      } else {
        // Controllo ogni riga
        formData.righe.forEach((riga, index) => {
          if (!riga.id_gruppo || riga.id_gruppo === 0) {
            erroriValidazione.push(`Riga ${index + 1}: Seleziona un gruppo`);
          }
          if (!riga.nome_prodotto || riga.nome_prodotto.trim() === '') {
            erroriValidazione.push(`Riga ${index + 1}: Inserisci il nome prodotto`);
          }
          if (!riga.id_colore || riga.id_colore === 0) {
            erroriValidazione.push(`Riga ${index + 1}: Seleziona un colore`);
          }
          if (!riga.id_provenienza || riga.id_provenienza === 0) {
            erroriValidazione.push(`Riga ${index + 1}: Seleziona una provenienza`);
          }
          if (!riga.id_foto || riga.id_foto === 0) {
            erroriValidazione.push(`Riga ${index + 1}: Seleziona una foto`);
          }
          if (!riga.id_imballo || riga.id_imballo === 0) {
            erroriValidazione.push(`Riga ${index + 1}: Seleziona un imballo`);
          }
          if (!riga.id_altezza || riga.id_altezza === 0) {
            erroriValidazione.push(`Riga ${index + 1}: Seleziona un'altezza`);
          }
          if (!riga.id_qualita || riga.id_qualita === 0) {
            erroriValidazione.push(`Riga ${index + 1}: Seleziona una qualità`);
          }
          if (!riga.quantita || riga.quantita <= 0) {
            erroriValidazione.push(`Riga ${index + 1}: Inserisci una quantità valida`);
          }
          if (!riga.prezzo_acquisto_per_stelo || riga.prezzo_acquisto_per_stelo <= 0) {
            erroriValidazione.push(`Riga ${index + 1}: Inserisci un prezzo di acquisto valido`);
          }
        });
      }

      // Se ci sono errori, mostra e interrompi
      if (erroriValidazione.length > 0) {
        setSnackbar({
          open: true,
          message: `❌ Compilazione incompleta! Controlla:\n• ${erroriValidazione.slice(0, 3).join('\n• ')}${erroriValidazione.length > 3 ? `\n• ... e altri ${erroriValidazione.length - 3} errori` : ''}`,
          severity: 'error'
        });
        setLoading(false);
        return;
      }

      console.log('✅ Validazione superata, procedo con il salvataggio');
      
      /* 
      // VALIDAZIONE PRELIMINARE: Verifica coerenza quantità e imballi
      const validazione = await apiService.validateFatturaModifica(
        modalitaModifica ? fatturaSelezionata?.fattura_acquisto_id || 0 : 0,
        formData
      );
      
      if (!validazione.valid) {
        setSnackbar({
          open: true,
          message: `Errori di validazione: ${validazione.errors.join(', ')}`,
          severity: 'error'
        });
        setLoading(false);
        return;
      }
      */

      let result;
      
      if (modalitaModifica && fatturaSelezionata) {
        // MODALITÀ MODIFICA: aggiorna tutti i dati
        
        // 1. Aggiorna i dati della fattura base
        const fatturaPerDb = {
          numero: formData.numero_fattura,
          data: formData.data,
          fornitore_id: formData.id_fornitore,
          totale: formData.totale,
          stato: formData.stato,
          note: formData.note
        };
        
        console.log('🔄 Aggiornamento fattura:', fatturaPerDb);
        await apiService.updateFatturaAcquisto(fatturaSelezionata.fattura_acquisto_id, fatturaPerDb);
        
        // 2. Aggiorna i documenti di carico esistenti
        const articoliDellaFattura = fattureEsistenti.filter(doc => 
          doc.fattura_acquisto_id === fatturaSelezionata.fattura_acquisto_id
        );
        
        console.log('🔄 Documenti da aggiornare:', articoliDellaFattura);
        
        // Per ora aggiorniamo solo il primo articolo (limitazione attuale)
        if (articoliDellaFattura.length > 0 && formData.righe.length > 0) {
          const primoDocumento = articoliDellaFattura[0];
          const primaRiga = formData.righe[0];
          const primoPrezzoVendita = formData.prezzi_vendita[0];
          
          console.log('🔄 ID documento da aggiornare:', primoDocumento.id);
          
          // CHIAMATA DIRETTA: Aggiorna il documento di carico con i campi corretti
          const { data: docAggiornato, error: docError } = await supabase
            .from('documenti_carico')
            .update({
              quantita: primaRiga.quantita,
              prezzo_acquisto_per_stelo: primaRiga.prezzo_acquisto_per_stelo,
              prezzo_vendita_1: primoPrezzoVendita.prezzo_vendita_1,
              prezzo_vendita_2: primoPrezzoVendita.prezzo_vendita_2,
              prezzo_vendita_3: primoPrezzoVendita.prezzo_vendita_3,
              note: formData.note
            })
            .eq('id', primoDocumento.id)
            .select()
            .single();
          
          if (docError) {
            console.error('❌ Errore aggiornamento documento:', docError);
            throw docError;
          }
          
          console.log('✅ Documento aggiornato:', docAggiornato);
          
          // 3. NUOVO: Aggiorna i costi analitici se presenti
          if (formData.costo_trasporto > 0 || formData.costo_commissioni > 0 || formData.costo_imballaggi > 0) {
            const costiDaAggiornare = [];
            
            if (formData.costo_trasporto > 0) {
              costiDaAggiornare.push({
                tipo_costo: 'trasporto' as const,
                importo: formData.costo_trasporto,
                fornitore_id: formData.id_fornitore_trasporto || formData.id_fornitore,
                note: formData.note_costi
              });
            }
            
            if (formData.costo_commissioni > 0) {
              costiDaAggiornare.push({
                tipo_costo: 'commissioni' as const,
                importo: formData.costo_commissioni,
                fornitore_id: formData.id_fornitore_commissioni || formData.id_fornitore,
                note: formData.note_costi
              });
            }
            
            if (formData.costo_imballaggi > 0) {
              costiDaAggiornare.push({
                tipo_costo: 'imballaggi' as const,
                importo: formData.costo_imballaggi,
                fornitore_id: formData.id_fornitore_imballaggi || formData.id_fornitore,
                note: formData.note_costi
              });
            }
            
            console.log('💰 Aggiornamento costi:', costiDaAggiornare);
            
            await apiService.aggiornaCostiFattura({
              fattura_acquisto_id: fatturaSelezionata.fattura_acquisto_id,
              costi: costiDaAggiornare
            });
            
            console.log('✅ Costi aggiornati con successo');
          }
          
          // 4. NUOVO: Gestione modifica caratteristiche articolo
          const articoloAttuale = articoliDellaFattura[0]; // Prendiamo il primo per confrontare
          const caratteristicheModificate = 
            formData.righe[0].id_gruppo !== articoloAttuale.gruppo_id ||
            formData.righe[0].id_colore !== articoloAttuale.colore_id ||
            formData.righe[0].id_provenienza !== articoloAttuale.provenienza_id ||
            formData.righe[0].id_foto !== articoloAttuale.foto_id ||
            formData.righe[0].id_imballo !== articoloAttuale.imballo_id ||
            formData.righe[0].id_altezza !== articoloAttuale.altezza_id;
            
          let articolo_id_finale = articoloAttuale.articolo_id;
          
          if (caratteristicheModificate) {
            console.log('🔄 Caratteristiche articolo modificate, creazione nuovo articolo...');
            
            // Verifica se esiste già un articolo con queste caratteristiche
            const articoloEsistente = await apiService.trovaArticoloPerCaratteristiche({
              gruppo_id: formData.righe[0].id_gruppo,
              prodotto_id: 1, // TODO: aggiungere prodotto_id al form
              colore_id: formData.righe[0].id_colore,
              provenienza_id: formData.righe[0].id_provenienza,
              foto_id: formData.righe[0].id_foto,
              imballo_id: formData.righe[0].id_imballo,
              altezza_id: formData.righe[0].id_altezza,
              qualita: 'A' // TODO: aggiungere qualita al form
            });
            
            if (articoloEsistente) {
              console.log('✅ Articolo con queste caratteristiche già esistente:', articoloEsistente.id);
              articolo_id_finale = articoloEsistente.id;
            } else {
              console.log('🆕 Creazione nuovo articolo con caratteristiche aggiornate...');
              const nuovoArticolo = await apiService.creaArticolo({
                gruppo_id: formData.righe[0].id_gruppo,
                prodotto_id: 1, // TODO: aggiungere prodotto_id al form
                colore_id: formData.righe[0].id_colore,
                provenienza_id: formData.righe[0].id_provenienza,
                foto_id: formData.righe[0].id_foto,
                imballo_id: formData.righe[0].id_imballo,
                altezza_id: formData.righe[0].id_altezza,
                qualita: 'A', // TODO: aggiungere qualita al form
                codice_articolo: `AUTO-${Date.now()}`, // Genera codice automatico
                descrizione: `${gruppi.find(g => g.id === formData.righe[0].id_gruppo)?.nome} ${formData.righe[0].nome_prodotto}`,
                prezzo_vendita: formData.righe[0].prezzo_acquisto_per_stelo,
                prezzo_acquisto: formData.righe[0].prezzo_acquisto_per_stelo
              });
              articolo_id_finale = nuovoArticolo.id;
              console.log('✅ Nuovo articolo creato:', nuovoArticolo);
            }
            
            // Aggiorna tutti i documenti di carico con il nuovo articolo_id
            for (const doc of articoliDellaFattura) {
              const { error: updateDocError } = await supabase
                .from('documenti_carico')
                .update({ articolo_id: articolo_id_finale })
                .eq('id', doc.id);
                
              if (updateDocError) {
                console.error('❌ Errore aggiornamento articolo_id documento:', updateDocError);
                throw updateDocError;
              }
            }
            console.log('✅ Articolo_id aggiornato per tutti i documenti');
          }
        }
        
        setSnackbar({
          open: true,
          message: 'Fattura e documenti aggiornati con successo!',
          severity: 'success'
        });

        // AGGIORNAMENTO AUTOMATICO MOVIMENTI MAGAZZINO
        try {
          await apiService.updateMovimentiFromFattura(fatturaSelezionata.fattura_acquisto_id, formData);
          console.log('✅ Movimenti di magazzino aggiornati automaticamente');
        } catch (movError) {
          console.error('⚠️ Errore aggiornamento movimenti magazzino:', movError);
          setSnackbar({
            open: true,
            message: 'Fattura salvata ma errore nell\'aggiornamento movimenti magazzino',
            severity: 'warning'
          });
        }
        
      } else {
        // MODALITÀ CREAZIONE: usa la procedura che gestisce fattura + documento
        const primaRiga = formData.righe[0];
        const primoPrezzoVendita = formData.prezzi_vendita[0];
        
        const datiCompleti = {
          numero_fattura: formData.numero_fattura,
          data: formData.data,
          id_fornitore: formData.id_fornitore,
          totale: formData.totale,
          stato: formData.stato,
          note: formData.note,
          // Dati articolo per la procedura
          id_gruppo: primaRiga.id_gruppo,
          nome_prodotto: primaRiga.nome_prodotto,
          id_colore: primaRiga.id_colore,
          id_provenienza: primaRiga.id_provenienza,
          id_foto: primaRiga.id_foto,
          id_imballo: primaRiga.id_imballo,
          id_altezza: primaRiga.id_altezza,
          id_qualita: primaRiga.id_qualita,
          quantita: primaRiga.quantita,
          prezzo_acquisto_per_stelo: primaRiga.prezzo_acquisto_per_stelo,
          prezzo_vendita_1: primoPrezzoVendita.prezzo_vendita_1,
          prezzo_vendita_2: primoPrezzoVendita.prezzo_vendita_2,
          prezzo_vendita_3: primoPrezzoVendita.prezzo_vendita_3
        };
        
        result = await apiService.createFatturaConDocumento(datiCompleti);
        setSnackbar({
          open: true,
          message: 'Fattura con documento di carico creata con successo!',
          severity: 'success'
        });

        // SALVATAGGIO COSTI ANALITICI PER NUOVA FATTURA
        try {
          if (result && result.fattura_id) {
            const costiDaSalvare = [];
            
            if (formData.costo_trasporto > 0) {
              costiDaSalvare.push({
                tipo_costo: 'trasporto' as const,
                importo: formData.costo_trasporto,
                fornitore_id: formData.id_fornitore_trasporto || formData.id_fornitore,
                note: formData.note_costi
              });
            }
            
            if (formData.costo_commissioni > 0) {
              costiDaSalvare.push({
                tipo_costo: 'commissioni' as const,
                importo: formData.costo_commissioni,
                fornitore_id: formData.id_fornitore_commissioni || formData.id_fornitore,
                note: formData.note_costi
              });
            }
            
            if (formData.costo_imballaggi > 0) {
              costiDaSalvare.push({
                tipo_costo: 'imballaggi' as const,
                importo: formData.costo_imballaggi,
                fornitore_id: formData.id_fornitore_imballaggi || formData.id_fornitore,
                note: formData.note_costi
              });
            }
            
            if (costiDaSalvare.length > 0) {
              console.log('💰 Salvataggio costi per nuova fattura:', costiDaSalvare);
              await apiService.aggiornaCostiFattura({
                fattura_acquisto_id: result.fattura_id,
                costi: costiDaSalvare
              });
              console.log('✅ Costi analitici salvati con successo');
            }
          }
        } catch (costiError) {
          console.error('⚠️ Errore salvataggio costi:', costiError);
          setSnackbar({
            open: true,
            message: 'Fattura creata ma errore nel salvataggio costi analitici',
            severity: 'warning'
          });
        }

        // CREAZIONE AUTOMATICA MOVIMENTI MAGAZZINO
        try {
          if (result && result.fattura_id) {
            await apiService.updateMovimentiFromFattura(result.fattura_id, formData);
            console.log('✅ Movimenti di magazzino creati automaticamente');
          }
        } catch (movError) {
          console.error('⚠️ Errore creazione movimenti magazzino:', movError);
          setSnackbar({
            open: true,
            message: 'Fattura creata ma errore nella creazione movimenti magazzino',
            severity: 'warning'
          });
        }
      }
      
      handleCloseDialog();
      
      // Ricarica le fatture per aggiornare la lista
      await loadData();
      
    } catch (error) {
      console.error('Errore creazione/modifica fattura:', error);
      setSnackbar({
        open: true,
        message: modalitaModifica ? 'Errore nella modifica della fattura completa' : 'Errore nella creazione della fattura',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderFormBase = () => (
    <Grid container spacing={4}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="📋 Numero Fattura"
          value={formData.numero_fattura}
          onChange={(e) => setFormData({...formData, numero_fattura: e.target.value})}
          sx={modernStyles.modernInput}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="📅 Data"
          type="date"
          value={formData.data}
          onChange={(e) => setFormData({...formData, data: e.target.value})}
          InputLabelProps={{ shrink: true }}
          sx={modernStyles.modernInput}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth sx={modernStyles.modernInput}>
          <InputLabel>🏢 Fornitore</InputLabel>
          <Select
            value={formData.id_fornitore}
            onChange={(e) => setFormData({...formData, id_fornitore: Number(e.target.value)})}
          >
            {fornitori.map((fornitore) => (
              <MenuItem key={fornitore.id} value={fornitore.id}>
                {fornitore.nome}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth sx={modernStyles.modernInput}>
          <InputLabel>📊 Stato</InputLabel>
          <Select
            value={formData.stato}
            onChange={(e) => setFormData({...formData, stato: e.target.value})}
          >
            <MenuItem value="bozza">📝 Bozza</MenuItem>
            <MenuItem value="confermata">✅ Confermata</MenuItem>
            <MenuItem value="pagata">💰 Pagata</MenuItem>
            <MenuItem value="annullata">❌ Annullata</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="📝 Note"
          multiline
          rows={4}
          value={formData.note}
          onChange={(e) => setFormData({...formData, note: e.target.value})}
          sx={modernStyles.modernInput}
        />
      </Grid>
    </Grid>
  );

  const renderRigaArticolo = (riga: RigaFattura, index: number) => (
    <Card sx={modernStyles.articleCard}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          pb: 2,
          borderBottom: '1px solid rgba(102, 126, 234, 0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip 
              label={`#${index + 1}`}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 700,
                mr: 2
              }}
            />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50' }}>
              Articolo {index + 1}
            </Typography>
          </Box>
          
          {formData.righe.length > 1 && (
            <IconButton 
              color="error" 
              onClick={() => rimuoviRiga(index)}
              sx={{
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.2)',
                  transform: 'scale(1.05)'
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
          
          <Grid container spacing={3}>
            {/* 8 Caratteristiche con stile moderno */}
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth sx={modernStyles.modernInput}>
                <InputLabel>🏷️ Gruppo</InputLabel>
                <Select
                  value={riga.id_gruppo}
                  onChange={(e) => updateRiga(index, 'id_gruppo', Number(e.target.value))}
                >
                  {gruppi.map((gruppo) => (
                    <MenuItem key={gruppo.id} value={gruppo.id}>
                      {gruppo.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="🌺 Nome Prodotto"
                value={riga.nome_prodotto}
                onChange={(e) => updateRiga(index, 'nome_prodotto', e.target.value)}
                sx={modernStyles.modernInput}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth sx={modernStyles.modernInput}>
                <InputLabel>🎨 Colore</InputLabel>
                <Select
                  value={riga.id_colore}
                  onChange={(e) => updateRiga(index, 'id_colore', Number(e.target.value))}
                >
                  {colori.map((colore) => (
                    <MenuItem key={colore.id} value={colore.id}>
                      {colore.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth sx={modernStyles.modernInput}>
            <InputLabel>🌍 Provenienza</InputLabel>
            <Select
              value={riga.id_provenienza}
              onChange={(e) => updateRiga(index, 'id_provenienza', Number(e.target.value))}
            >
              {provenienze.map((provenienza) => (
                <MenuItem key={provenienza.id} value={provenienza.id}>
                  {provenienza.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl fullWidth sx={modernStyles.modernInput}>
              <InputLabel>📷 Foto</InputLabel>
              <Select
                value={riga.id_foto}
                onChange={(e) => updateRiga(index, 'id_foto', Number(e.target.value))}
              >
                {foto.map((f) => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              onClick={() => setUploadDialog(true)}
              sx={{ 
                minWidth: 48,
                height: 56,
                backgroundColor: 'primary.light',
                '&:hover': { backgroundColor: 'primary.main', color: 'white' }
              }}
            >
              <CloudUploadIcon />
            </Button>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth sx={modernStyles.modernInput}>
            <InputLabel>📦 Imballo</InputLabel>
            <Select
              value={riga.id_imballo}
              onChange={(e) => updateRiga(index, 'id_imballo', Number(e.target.value))}
            >
                              {imballaggi.map((imballo) => (
                  <MenuItem key={imballo.id} value={imballo.id}>
                    {imballo.quantita}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth sx={modernStyles.modernInput}>
            <InputLabel>📏 Altezza</InputLabel>
            <Select
              value={riga.id_altezza}
              onChange={(e) => updateRiga(index, 'id_altezza', Number(e.target.value))}
            >
              {altezze.map((altezza) => (
                <MenuItem key={altezza.id} value={altezza.id}>
                  {altezza.descrizione || `${altezza.altezza_cm}cm`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth sx={modernStyles.modernInput}>
            <InputLabel>⭐ Qualità</InputLabel>
            <Select
              value={riga.id_qualita}
              onChange={(e) => updateRiga(index, 'id_qualita', Number(e.target.value))}
            >
              {qualita.map((q) => (
                <MenuItem key={q.id} value={q.id}>
                  {q.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {/* Separatore visivo per dati commerciali */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2, opacity: 0.3 }} />
          <Typography variant="h6" sx={{ 
            textAlign: 'center', 
            color: '#667eea',
            fontWeight: 700,
            mb: 2
          }}>
            💰 Dati Commerciali
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="📊 Quantità"
            type="number"
            value={riga.quantita}
            onChange={(e) => updateRiga(index, 'quantita', Number(e.target.value))}
            sx={modernStyles.modernInput}
            helperText={
              riga.id_imballo && imballaggi.find(i => i.id === riga.id_imballo) ?
                                `Imballo: ${imballaggi.find(i => i.id === riga.id_imballo)?.quantita} (multipli richiesti)` :
              undefined
            }
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="💵 Prezzo Acquisto (€/stelo)"
            type="number"
            value={riga.prezzo_acquisto_per_stelo}
            onChange={(e) => updateRiga(index, 'prezzo_acquisto_per_stelo', Number(e.target.value))}
            inputProps={{ step: 0.01 }}
            sx={modernStyles.modernInput}
          />
        </Grid>
        
        {/* Informazioni Giacenza e Coerenza */}
        {riga.id_gruppo && riga.id_prodotto && riga.id_colore && (
          <Grid item xs={12}>
            <Card sx={{
              mt: 1,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.1) 0%, rgba(102, 126, 234, 0.1) 100%)',
              border: '1px solid rgba(40, 167, 69, 0.2)'
            }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#28a745', mb: 1 }}>
                  📊 Informazioni Magazzino
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Giacenza Attuale</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Calcolo in corso...
                    </Typography>
                  </Box>
                  {riga.id_imballo && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Imballo</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {imballaggi.find(i => i.id === riga.id_imballo)?.quantita}
                      </Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="caption" color="text.secondary">Quantità in Carico</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#28a745' }}>
                      +{riga.quantita} steli
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <Box sx={{
            textAlign: 'right',
            mt: 2,
            p: 2,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            border: '1px solid rgba(102, 126, 234, 0.2)'
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700,
              color: '#667eea',
              fontSize: '1.2rem'
            }}>
              💵 Totale Costo: €{riga.totale_riga?.toFixed(2) || '0.00'}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
  );

  const renderCostiAnalitici = () => (
    <Grid container spacing={3}>
      {/* COSTO TRASPORTO */}
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ mb: 2, color: modernStyles.colors.primary }}>
          🚚 Trasporto
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Costo Trasporto (€)"
              type="number"
              value={formData.costo_trasporto}
              onChange={(e) => updateCosto('costo_trasporto', Number(e.target.value))}
              inputProps={{ step: 0.01 }}
              sx={{ 
                bgcolor: 'white',
                '& .MuiOutlinedInput-root': {
                  ...modernStyles.components.input
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl 
              fullWidth 
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  ...modernStyles.components.input
                }
              }}
            >
              <InputLabel>Fornitore Trasporto</InputLabel>
              <Select
                value={formData.id_fornitore_trasporto}
                onChange={(e) => setFormData({...formData, id_fornitore_trasporto: Number(e.target.value)})}
                label="Fornitore Trasporto"
              >
                <MenuItem value={0}>Nessun fornitore</MenuItem>
                {fornitori.map((fornitore) => (
                  <MenuItem key={fornitore.id} value={fornitore.id}>
                    {fornitore.ragione_sociale}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Grid>

      {/* COSTO COMMISSIONI */}
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ mb: 2, color: modernStyles.colors.primary }}>
          💼 Commissioni
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Costo Commissioni (€)"
              type="number"
              value={formData.costo_commissioni}
              onChange={(e) => updateCosto('costo_commissioni', Number(e.target.value))}
              inputProps={{ step: 0.01 }}
              sx={{ 
                bgcolor: 'white',
                '& .MuiOutlinedInput-root': {
                  ...modernStyles.components.input
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl 
              fullWidth 
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  ...modernStyles.components.input
                }
              }}
            >
              <InputLabel>Fornitore Commissioni</InputLabel>
              <Select
                value={formData.id_fornitore_commissioni}
                onChange={(e) => setFormData({...formData, id_fornitore_commissioni: Number(e.target.value)})}
                label="Fornitore Commissioni"
              >
                <MenuItem value={0}>Nessun fornitore</MenuItem>
                {fornitori.map((fornitore) => (
                  <MenuItem key={fornitore.id} value={fornitore.id}>
                    {fornitore.ragione_sociale}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Grid>

      {/* COSTO IMBALLAGGI */}
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ mb: 2, color: modernStyles.colors.primary }}>
          📦 Imballaggi
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Costo Imballaggi (€)"
              type="number"
              value={formData.costo_imballaggi}
              onChange={(e) => updateCosto('costo_imballaggi', Number(e.target.value))}
              inputProps={{ step: 0.01 }}
              sx={{ 
                bgcolor: 'white',
                '& .MuiOutlinedInput-root': {
                  ...modernStyles.components.input
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl 
              fullWidth 
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  ...modernStyles.components.input
                }
              }}
            >
              <InputLabel>Fornitore Imballaggi</InputLabel>
              <Select
                value={formData.id_fornitore_imballaggi}
                onChange={(e) => setFormData({...formData, id_fornitore_imballaggi: Number(e.target.value)})}
                label="Fornitore Imballaggi"
              >
                <MenuItem value={0}>Nessun fornitore</MenuItem>
                {fornitori.map((fornitore) => (
                  <MenuItem key={fornitore.id} value={fornitore.id}>
                    {fornitore.ragione_sociale}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Grid>

      {/* NOTE COSTI */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Note Costi"
          multiline
          rows={3}
          value={formData.note_costi}
          onChange={(e) => setFormData({...formData, note_costi: e.target.value})}
          sx={{ 
            bgcolor: 'white',
            '& .MuiOutlinedInput-root': {
              ...modernStyles.components.input
            }
          }}
        />
      </Grid>

      {/* RIEPILOGO COSTI */}
      <Grid item xs={12}>
        <Card 
          sx={{ 
            mt: 2,
            borderRadius: 4,
            background: modernStyles.components.glass.background,
            backdropFilter: modernStyles.components.glass.backdropFilter,
            border: modernStyles.components.glass.border
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, color: modernStyles.colors.primary }}>
              📊 Riepilogo Costi Analitici
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Trasporto:</Typography>
                <Typography variant="h6">€ {formData.costo_trasporto.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Commissioni:</Typography>
                <Typography variant="h6">€ {formData.costo_commissioni.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Imballaggi:</Typography>
                <Typography variant="h6">€ {formData.costo_imballaggi.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" sx={{ color: modernStyles.colors.primary, fontWeight: 'bold' }}>
                  Totale Costi: € {(formData.costo_trasporto + formData.costo_commissioni + formData.costo_imballaggi).toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderPrezziVendita = () => {
    const totaleQuantita = formData.righe.reduce((acc, riga) => acc + riga.quantita, 0);
    const totaliCosti = formData.costo_trasporto + formData.costo_commissioni + formData.costo_imballaggi;
    const costoAnaliticoPerStelo = totaleQuantita > 0 ? totaliCosti / totaleQuantita : 0;

    return (
      <Grid container spacing={3}>
        {/* Riepilogo costi spalamati */}
        <Grid item xs={12}>
          <Card 
            sx={{ 
              mb: 3,
              borderRadius: 4,
              background: modernStyles.components.glass.background,
              backdropFilter: modernStyles.components.glass.backdropFilter,
              border: modernStyles.components.glass.border
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: modernStyles.colors.primary }}>
                📊 Costi Analitici Spalamati
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Totale Quantità:</Typography>
                  <Typography variant="h6">{totaleQuantita} steli</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Totale Costi Analitici:</Typography>
                  <Typography variant="h6">€ {totaliCosti.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Costo per Stelo:</Typography>
                  <Typography variant="h6" sx={{ color: modernStyles.colors.primary, fontWeight: 'bold' }}>
                    € {costoAnaliticoPerStelo.toFixed(4)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Prezzi di vendita per ogni articolo */}
        {formData.righe.map((riga, index) => {
          const prezzoVendita = formData.prezzi_vendita[index];
          const costoTotalePerStelo = riga.prezzo_acquisto_per_stelo + costoAnaliticoPerStelo;
          
          return (
            <Grid item xs={12} key={index}>
              <Card sx={modernStyles.articleCard}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Chip 
                      label={`#${index + 1}`}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        fontWeight: 700,
                        mr: 2
                      }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50' }}>
                      {riga.nome_prodotto || `Articolo ${index + 1}`}
                    </Typography>
                  </Box>

                  {/* Riepilogo costi per articolo */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={3}>
                      <Typography variant="body2" color="text.secondary">Prezzo Acquisto:</Typography>
                      <Typography variant="body1">€ {riga.prezzo_acquisto_per_stelo.toFixed(4)}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2" color="text.secondary">Costo Analitico:</Typography>
                      <Typography variant="body1">€ {costoAnaliticoPerStelo.toFixed(4)}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2" color="text.secondary">Costo Totale:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>€ {costoTotalePerStelo.toFixed(4)}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2" color="text.secondary">Quantità:</Typography>
                      <Typography variant="body1">{riga.quantita} steli</Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {/* Percentuali di ricarico e prezzi di vendita */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="% Ricarico 1"
                        type="number"
                        value={prezzoVendita?.percentuale_ricarico_1 || 50}
                        onChange={(e) => {
                          const nuoviPrezzi = [...formData.prezzi_vendita];
                          nuoviPrezzi[index] = {
                            ...nuoviPrezzi[index],
                            percentuale_ricarico_1: Number(e.target.value)
                          };
                          setFormData({...formData, prezzi_vendita: nuoviPrezzi});
                        }}
                        InputProps={{ endAdornment: '%' }}
                        sx={modernStyles.modernInput}
                      />
                      <Box sx={{ mt: 1, p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ color: modernStyles.colors.success, fontWeight: 'bold' }}>
                          💎 Prezzo 1: € {prezzoVendita?.prezzo_vendita_1?.toFixed(4) || '0.0000'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="% Ricarico 2"
                        type="number"
                        value={prezzoVendita?.percentuale_ricarico_2 || 75}
                        onChange={(e) => {
                          const nuoviPrezzi = [...formData.prezzi_vendita];
                          nuoviPrezzi[index] = {
                            ...nuoviPrezzi[index],
                            percentuale_ricarico_2: Number(e.target.value)
                          };
                          setFormData({...formData, prezzi_vendita: nuoviPrezzi});
                        }}
                        InputProps={{ endAdornment: '%' }}
                        sx={modernStyles.modernInput}
                      />
                      <Box sx={{ mt: 1, p: 2, bgcolor: 'rgba(255, 152, 0, 0.1)', borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ color: modernStyles.colors.warning, fontWeight: 'bold' }}>
                          💰 Prezzo 2: € {prezzoVendita?.prezzo_vendita_2?.toFixed(4) || '0.0000'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="% Ricarico 3"
                        type="number"
                        value={prezzoVendita?.percentuale_ricarico_3 || 100}
                        onChange={(e) => {
                          const nuoviPrezzi = [...formData.prezzi_vendita];
                          nuoviPrezzi[index] = {
                            ...nuoviPrezzi[index],
                            percentuale_ricarico_3: Number(e.target.value)
                          };
                          setFormData({...formData, prezzi_vendita: nuoviPrezzi});
                        }}
                        InputProps={{ endAdornment: '%' }}
                        sx={modernStyles.modernInput}
                      />
                      <Box sx={{ mt: 1, p: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ color: modernStyles.colors.error, fontWeight: 'bold' }}>
                          🏆 Prezzo 3: € {prezzoVendita?.prezzo_vendita_3?.toFixed(4) || '0.0000'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderRiepilogo = () => (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Typography variant="h6">Imponibile: €{formData.imponibile.toFixed(2)}</Typography>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant="h6">IVA ({formData.iva}%): €{(formData.imponibile * formData.iva / 100).toFixed(2)}</Typography>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>TOTALE: €{formData.totale.toFixed(2)}</Typography>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" gutterBottom>Riepilogo Articoli ({formData.righe.length})</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Prodotto</TableCell>
            <TableCell>Quantità</TableCell>
            <TableCell>Prezzo €/stelo</TableCell>
            <TableCell>Totale</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {formData.righe.map((riga, index) => (
            <TableRow key={index}>
              <TableCell>{riga.nome_prodotto || `Articolo ${index + 1}`}</TableCell>
              <TableCell>{riga.quantita}</TableCell>
              <TableCell>€{riga.prezzo_acquisto_per_stelo.toFixed(2)}</TableCell>
              <TableCell>€{riga.totale_riga.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );

  // NUOVO: Renderizza lista fatture esistenti
  const renderListaFatture = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Paper sx={{ ...modernStyles.glassmorphic, mb: 3 }}>
        <Box sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <ReceiptIcon sx={{ fontSize: 40, color: '#667eea', mr: 2 }} />
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Documenti di Carico ({fattureFiltrate.length} di {fattureEsistenti.length})
            </Typography>
          </Box>

          {/* NUOVO: Sezione Filtri */}
          <Card sx={{ mb: 4, borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.9)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, color: '#667eea', fontWeight: 700 }}>
                <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Filtri di Ricerca
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="📋 Numero Fattura"
                    value={filtri.numeroFattura}
                    onChange={(e) => setFiltri({...filtri, numeroFattura: e.target.value})}
                    sx={modernStyles.modernInput}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="🏢 Fornitore"
                    value={filtri.fornitore}
                    onChange={(e) => setFiltri({...filtri, fornitore: e.target.value})}
                    sx={modernStyles.modernInput}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="📅 Data Inizio"
                    type="date"
                    value={filtri.dataInizio}
                    onChange={(e) => setFiltri({...filtri, dataInizio: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                    sx={modernStyles.modernInput}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="📅 Data Fine"
                    type="date"
                    value={filtri.dataFine}
                    onChange={(e) => setFiltri({...filtri, dataFine: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                    sx={modernStyles.modernInput}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth sx={modernStyles.modernInput}>
                    <InputLabel>📊 Stato</InputLabel>
                    <Select
                      value={filtri.stato}
                      onChange={(e) => setFiltri({...filtri, stato: e.target.value})}
                      label="📊 Stato"
                    >
                      <MenuItem value="">Tutti</MenuItem>
                      <MenuItem value="bozza">📝 Bozza</MenuItem>
                      <MenuItem value="confermata">✅ Confermata</MenuItem>
                      <MenuItem value="pagata">💰 Pagata</MenuItem>
                      <MenuItem value="annullata">❌ Annullata</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="🌺 Nome Prodotto"
                    value={filtri.prodotto}
                    onChange={(e) => setFiltri({...filtri, prodotto: e.target.value})}
                    sx={modernStyles.modernInput}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    variant="outlined"
                    onClick={resetFiltri}
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: '#667eea',
                      color: '#667eea',
                      height: '56px'
                    }}
                    fullWidth
                  >
                    🔄 Reset Filtri
                  </Button>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth sx={modernStyles.modernInput}>
                    <InputLabel>📈 Ordina per</InputLabel>
                    <Select
                      value={`${ordinamento.campo}-${ordinamento.direzione}`}
                      onChange={(e) => {
                        const [campo, direzione] = e.target.value.split('-');
                        setOrdinamento({ campo, direzione: direzione as 'asc' | 'desc' });
                      }}
                      label="📈 Ordina per"
                    >
                      <MenuItem value="data-desc">📅 Data (più recente)</MenuItem>
                      <MenuItem value="data-asc">📅 Data (più vecchia)</MenuItem>
                      <MenuItem value="numero_fattura-asc">📋 Numero fattura (A-Z)</MenuItem>
                      <MenuItem value="numero_fattura-desc">📋 Numero fattura (Z-A)</MenuItem>
                      <MenuItem value="totale-desc">💰 Importo (maggiore)</MenuItem>
                      <MenuItem value="totale-asc">💰 Importo (minore)</MenuItem>
                      <MenuItem value="fornitore-asc">🏢 Fornitore (A-Z)</MenuItem>
                      <MenuItem value="fornitore-desc">🏢 Fornitore (Z-A)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {fattureFiltrate.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: '16px' }}>
              <Typography sx={{ fontWeight: 600 }}>
                {fattureEsistenti.length === 0 
                  ? "Nessun documento di carico trovato. Crea il primo documento!" 
                  : "Nessun documento corrisponde ai filtri selezionati."
                }
              </Typography>
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {fattureFiltrate.map((fattura, index) => (
                <Grid item xs={12} sm={6} md={4} key={fattura.id || index}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Card sx={{
                      ...modernStyles.articleCard,
                      height: '100%',
                      cursor: 'pointer'
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        {/* Header documento */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700, 
                            color: '#2c3e50',
                            mb: 1
                          }}>
                            📋 {fattura.numero || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            📅 {fattura.data_fattura ? 
                              new Date(fattura.data_fattura).toLocaleDateString('it-IT') : 'N/A'}
                          </Typography>
                        </Box>

                        {/* Dettagli fornitore */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            🏢 Fornitore:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {fattura.fornitore_nome || 'N/A'}
                          </Typography>
                        </Box>

                        {/* Articoli */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            🌺 Articoli:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {fattura.articoli_count || 0} articolo{fattura.articoli_count !== 1 ? 'i' : ''}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontSize: '0.8rem',
                            fontStyle: 'italic',
                            color: 'text.secondary'
                          }}>
                            {fattura.articoli_preview.slice(0, 2).join(', ')}{fattura.articoli_count > 2 ? '...' : ''}
                          </Typography>
                        </Box>

                        {/* Importi */}
                        <Box sx={{ 
                          p: 2,
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          mb: 3
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            💰 Totale:
                          </Typography>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700,
                            color: '#667eea'
                          }}>
                            €{fattura.totale_fattura?.toFixed(2) || '0.00'}
                          </Typography>
                        </Box>

                        {/* Stato */}
                        <Box sx={{ mb: 3 }}>
                          <Chip 
                            label={fattura.stato_fattura || 'bozza'}
                            color={
                              fattura.stato_fattura === 'confermata' ? 'success' :
                              fattura.stato_fattura === 'pagata' ? 'primary' :
                              fattura.stato_fattura === 'annullata' ? 'error' : 'default'
                            }
                            sx={{ 
                              fontWeight: 600,
                              textTransform: 'capitalize'
                            }}
                          />
                        </Box>

                        {/* Azioni */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={() => handleModificaFattura(fattura)}
                            sx={{
                              ...modernStyles.primaryButton,
                              flex: 1,
                              fontSize: '0.875rem',
                              py: 1
                            }}
                          >
                            Modifica
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleEliminaFattura(fattura)}
                            sx={{
                              borderRadius: '12px',
                              textTransform: 'none',
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              py: 1,
                              minWidth: 'auto',
                              px: 2
                            }}
                          >
                            🗑️
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Paper>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Box sx={modernStyles.mainContainer}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Paper sx={modernStyles.glassmorphic}>
            <Box sx={{ p: 4 }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                  <InventoryIcon sx={{ fontSize: 40, color: '#667eea', mr: 2 }} />
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontWeight: 700, 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontSize: { xs: '1.8rem', md: '2.5rem' }
                    }}
                  >
                    Gestione Fatture Avanzata
                  </Typography>
                </Box>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Alert 
                  severity="info" 
                  sx={{ 
                    mb: 4,
                    borderRadius: '16px',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                    '& .MuiAlert-icon': { color: '#667eea' }
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>
                    Sistema completo con 8 caratteristiche per articolo, gestione costi analitici e prezzi multipli
                  </Typography>
                </Alert>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenDialog}
                  sx={modernStyles.primaryButton}
                  size="large"
                >
                  Crea Nuova Fattura
                </Button>
              </motion.div>
            </Box>
          </Paper>
        </motion.div>

        {/* NUOVO: Lista fatture esistenti */}
        {renderListaFatture()}

        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="xl"
          fullWidth
          TransitionComponent={Slide}
          sx={{ 
            '& .MuiDialog-paper': { 
              height: '95vh',
              borderRadius: '24px',
              backgroundColor: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
            } 
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <DialogTitle 
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white', 
                display: 'flex', 
                alignItems: 'center',
                borderRadius: '24px 24px 0 0',
                padding: '24px'
              }}
            >
              <ReceiptIcon sx={{ mr: 2, fontSize: 28 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {modalitaModifica 
                  ? `✏️ Modifica Fattura: ${formData.numero_fattura}`
                  : '➕ Nuova Fattura con Carico Multi-Riga'
                }
              </Typography>
            </DialogTitle>
            
            <DialogContent sx={{ p: 0, backgroundColor: 'rgba(248, 249, 250, 0.8)' }}>
              <Box sx={{ 
                borderBottom: '1px solid rgba(102, 126, 234, 0.1)',
                backgroundColor: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)'
              }}>
                <Tabs 
                  value={activeTab} 
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  sx={{
                    '& .MuiTab-root': modernStyles.modernTab,
                    '& .MuiTabs-indicator': {
                      height: '3px',
                      borderRadius: '3px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }
                  }}
                >
                  <Tab label="📋 Dati Fattura" sx={{ fontWeight: 600 }} />
                  <Tab label={`🛍️ Articoli (${formData.righe.length})`} sx={{ fontWeight: 600 }} />
                  <Tab label="💰 Costi Analitici" sx={{ fontWeight: 600 }} />
                  <Tab label="� Prezzi Vendita" sx={{ fontWeight: 600 }} />
                  <Tab label="�📊 Riepilogo" sx={{ fontWeight: 600 }} />
                </Tabs>
              </Box>
              
              <Box sx={{ p: 4 }}>
                <TabPanel value={activeTab} index={0}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {renderFormBase()}
                  </motion.div>
                </TabPanel>
                
                <TabPanel value={activeTab} index={1}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Box sx={{ mb: 3 }}>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={aggiungiRiga}
                        sx={{
                          ...modernStyles.primaryButton,
                          mb: 3
                        }}
                      >
                        Aggiungi Nuovo Articolo
                      </Button>
                    </Box>
                  </motion.div>
                  
                  <AnimatePresence>
                    {formData.righe.map((riga, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        {renderRigaArticolo(riga, index)}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </TabPanel>
                
                <TabPanel value={activeTab} index={2}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {renderCostiAnalitici()}
                  </motion.div>
                </TabPanel>
                
                <TabPanel value={activeTab} index={3}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {renderPrezziVendita()}
                  </motion.div>
                </TabPanel>
                
                <TabPanel value={activeTab} index={4}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {renderRiepilogo()}
                  </motion.div>
                </TabPanel>
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.8)', borderRadius: '0 0 24px 24px' }}>
              <Button 
                onClick={handleCloseDialog} 
                startIcon={<CancelIcon />}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  color: '#667eea'
                }}
              >
                Annulla
              </Button>
              <Button 
                onClick={handleSubmit}
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
                sx={modernStyles.primaryButton}
              >
                {loading 
                  ? (modalitaModifica ? 'Aggiornamento...' : 'Salvataggio...') 
                  : (modalitaModifica ? 'Aggiorna Fattura' : 'Salva Fattura')
                }
              </Button>
            </DialogActions>
          </motion.div>
        </Dialog>

        {/* Dialog Upload Foto */}
        <Dialog 
          open={uploadDialog} 
          onClose={resetUploadDialog}
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudUploadIcon color="primary" />
            Carica Nuova Foto
          </DialogTitle>
          
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              
              {/* Area upload file */}
              <Box>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="photo-upload-input"
                />
                <label htmlFor="photo-upload-input">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    sx={{ 
                      height: 60,
                      borderStyle: 'dashed',
                      '&:hover': { borderStyle: 'dashed' }
                    }}
                  >
                    Clicca per selezionare un'immagine
                  </Button>
                </label>
              </Box>

              {/* Anteprima foto */}
              {previewUrl && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Anteprima:
                  </Typography>
                  <Avatar
                    src={previewUrl}
                    sx={{ 
                      width: 120, 
                      height: 120,
                      border: '2px solid',
                      borderColor: 'primary.main'
                    }}
                  />
                  {selectedFile && (
                    <Typography variant="caption" color="text.secondary">
                      {selectedFile.name} • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  )}
                </Box>
              )}

              {/* Info validazione */}
              <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                • Formati supportati: JPG, PNG, GIF, WebP<br/>
                • Dimensione massima: 5MB<br/>
                • La foto sarà automaticamente selezionata dopo il caricamento
              </Alert>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={resetUploadDialog}
              disabled={uploadingPhoto}
            >
              Annulla
            </Button>
            <Button 
              onClick={handleUploadPhoto}
              variant="contained"
              disabled={!selectedFile || uploadingPhoto}
              startIcon={uploadingPhoto ? <CircularProgress size={16} /> : <CloudUploadIcon />}
            >
              {uploadingPhoto ? 'Caricamento...' : 'Carica Foto'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Conferma Eliminazione Fattura */}
        <Dialog 
          open={deleteDialog} 
          onClose={annullaEliminazione}
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            bgcolor: '#fff3e0',
            color: '#e65100'
          }}>
            ⚠️ Conferma Eliminazione Fattura
          </DialogTitle>
          
          <DialogContent sx={{ pt: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Info fattura */}
              {fatturaToDelete && (
                <Alert severity="warning" sx={{ fontSize: '0.875rem' }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    📋 Fattura: <strong>{fatturaToDelete.numero}</strong>
                  </Typography>
                  <Typography variant="body2">
                    📅 Data: {fatturaToDelete.data_fattura ? 
                      new Date(fatturaToDelete.data_fattura).toLocaleDateString('it-IT') : 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    🏢 Fornitore: {fatturaToDelete.fornitore_nome || 'N/A'}
                  </Typography>
                </Alert>
              )}

              {/* Dettagli eliminazione */}
              {deleteDetails && (
                <Box sx={{ bgcolor: '#fafafa', p: 2, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: '#d32f2f' }}>
                    🗑️ Cosa verrà eliminato:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">
                      📦 <strong>{deleteDetails.numeroArticoli}</strong> articoli/documenti di carico
                    </Typography>
                    <Typography variant="body2">
                      📊 <strong>{deleteDetails.giacenzeTotali}</strong> steli totali in giacenza
                    </Typography>
                    <Typography variant="body2">
                      💰 Valore giacenze: <strong>€{deleteDetails.valoreTotale?.toFixed(2) || '0.00'}</strong>
                    </Typography>
                    <Typography variant="body2">
                      🏷️ Tutti i costi analitici associati
                    </Typography>
                    <Typography variant="body2">
                      📈 Tutti i movimenti di magazzino correlati
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Avvertimento */}
              <Alert severity="error" sx={{ fontSize: '0.875rem' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ⚠️ ATTENZIONE: Questa azione è IRREVERSIBILE!
                </Typography>
                <Typography variant="body2">
                  Le giacenze verranno completamente rimosse dal magazzino.
                  Assicurati che non ci siano vendite o movimenti in corso.
                </Typography>
              </Alert>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={annullaEliminazione}
              variant="outlined"
              disabled={deleting}
            >
              Annulla
            </Button>
            <Button 
              onClick={confermaEliminazione}
              variant="contained"
              color="error"
              disabled={deleting}
              startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
            >
              {deleting ? 'Eliminazione...' : 'Conferma Eliminazione'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
}
