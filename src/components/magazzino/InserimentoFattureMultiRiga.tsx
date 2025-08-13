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
  Stack,
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
  ReceiptLong as ReceiptLongIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  Assessment as StatsIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  CloudUpload as CloudUploadIcon,
  FilterList as FilterIcon,
  ShoppingCart as ShoppingCartIcon
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

interface OrdineAcquistoCompleto {
  // Dati ordine base
  data_ordine: string;
  data_consegna_prevista: string;
  id_fornitore: number;
  totale_ordine: number;
  stato: 'ordinato' | 'consegnato';
  note: string;
  
  // Array di righe ordine (stessa struttura delle fatture)
  righe: RigaFattura[];
  
  // Costi analitici (per previsione dei prezzi finali)
  costo_trasporto: number;
  id_fornitore_trasporto: number;
  costo_commissioni: number;
  id_fornitore_commissioni: number;
  costo_imballaggi: number;
  id_fornitore_imballaggi: number;
  note_costi: string;
  
  // Prezzi di vendita con ricarichi (per ordini virtuali)
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

interface InserimentoFattureMultiRigaProps {
  open?: boolean;
  onClose?: () => void;
  modalitaIniziale?: 'fatture' | 'ordini';
  soloOrdini?: boolean; // Se true, nasconde tutto ciò che riguarda le fatture
  ordineEsistente?: any; // Ordine da visualizzare/modificare
  modalitaSolaLettura?: boolean; // Se true, rende il form in sola lettura
  modalitaModificaOrdine?: boolean; // Se true, carica i dati dell'ordine per modifica
}

export default function InserimentoFattureMultiRiga({ 
  open = false, 
  onClose = () => {}, 
  modalitaIniziale = 'fatture',
  soloOrdini = false,
  ordineEsistente = null,
  modalitaSolaLettura = false,
  modalitaModificaOrdine = false
}: InserimentoFattureMultiRigaProps = {}) {
  // === STILI iOS 18 MODERNI (COLORI DEFINITI DOPO MODALITAORDINI) ===
  const modernStylesBase = {
    
    // Glassmorphism principale pulito
    glassmorphic: {
      background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)',
      backdropFilter: 'blur(20px)',
      borderRadius: '10px',
      border: '1px solid rgba(59, 130, 246, 0.15)',
      boxShadow: '0 2px 12px rgba(59, 130, 246, 0.04)',
    },
    
    // Container principale neutro
    mainContainer: {
      background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%)',
      minHeight: 'fit-content',
      padding: '12px',
    },
    
    // Card articoli pulite
    articleCard: {
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(15px)',
      borderRadius: '8px',
      border: '1px solid rgba(148, 163, 184, 0.2)',
      boxShadow: '0 1px 8px rgba(0,0,0,0.03)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 2px 12px rgba(59, 130, 246, 0.08)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
      }
    },
    
    // Sezioni pulite
    sectionCard: {
      background: 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(10px)',
      borderRadius: '6px',
      border: '1px solid rgba(148, 163, 184, 0.15)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
      transition: 'all 0.3s ease',
    },
    
    // Componenti
    components: {
      input: {
        borderRadius: '8px',
        backgroundColor: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: 'rgba(255,255,255,1)',
          transform: 'scale(1.01)',
        },
        '&.Mui-focused': {
          backgroundColor: 'rgba(255,255,255,1)',
          boxShadow: '0 2px 12px rgba(102, 126, 234, 0.2)',
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
        borderRadius: '8px',
        backgroundColor: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: 'rgba(255,255,255,1)',
          transform: 'scale(1.01)',
        },
        '&.Mui-focused': {
          backgroundColor: 'rgba(255,255,255,1)',
          boxShadow: '0 2px 12px rgba(59, 130, 246, 0.2)',
        }
      },
      '& .MuiInputLabel-root': {
        fontWeight: 500,
        color: '#3b82f6',
        fontSize: '0.875rem'
      }
    },
    
    // Bottoni moderni con accenti colorati
    primaryButton: {
      borderRadius: '8px',
      padding: '6px 16px',
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.875rem',
      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
      }
    },
    
    // Bottoni secondari con colori diversi
    secondaryButton: {
      borderRadius: '8px',
      padding: '6px 16px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.875rem',
      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
      }
    },
    
    // Bottoni di warning
    warningButton: {
      borderRadius: '8px',
      padding: '6px 16px',
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.875rem',
      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)',
      }
    },
    
    // Tab pulite e moderne
    modernTab: {
      borderRadius: '6px',
      margin: '0 1px',
      textTransform: 'none',
      fontWeight: 500,
      fontSize: '0.825rem',
      transition: 'all 0.3s ease',
      color: '#64748b',
      minHeight: '32px',
      '&.Mui-selected': {
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        color: '#3b82f6',
        fontWeight: 600,
      },
      '&:hover': {
        backgroundColor: 'rgba(59, 130, 246, 0.04)',
        color: '#3b82f6',
      }
    },

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
  
  // NUOVO: Modalità ordini acquisto
  const [modalitaOrdini, setModalitaOrdini] = useState(modalitaIniziale === 'ordini' || soloOrdini); // false = fatture, true = ordini
  
  // NUOVO: Stati per ordini acquisto
  const [ordiniEsistenti, setOrdiniEsistenti] = useState<any[]>([]);
  const [ordiniFiltrati, setOrdiniFiltrati] = useState<any[]>([]);
  const [ordineSelezionato, setOrdineSelezionato] = useState<any>(null);
  
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

  // NUOVO: Dati per ordini acquisto
  const [ordineData, setOrdineData] = useState<OrdineAcquistoCompleto>({
    data_ordine: new Date().toISOString().split('T')[0],
    data_consegna_prevista: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 giorni
    id_fornitore: 0,
    totale_ordine: 0,
    stato: 'ordinato',
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

  // === STILI DINAMICI CON COLORI CONDIZIONALI ===
  const modernColors = modalitaOrdini ? {
    // 🛒 TEMA ORDINI - Arancione/Amber per gli ordini
    primary: '#f59e0b',      // Amber principale
    secondary: '#fb923c',    // Orange
    accent1: '#fbbf24',      // Amber chiaro
    accent2: '#d97706',      // Amber scuro
    success: '#22c55e',      // Green
    error: '#ef4444',        // Red
    warning: '#f59e0b',      // Amber
    text: '#1e293b',         // Slate
    textSecondary: '#64748b', // Slate secondary
    background: 'linear-gradient(135deg, rgba(255, 251, 235, 0.95), rgba(254, 243, 199, 0.9))', // Sfondo amber molto chiaro
    glass: 'rgba(255, 251, 235, 0.85)',
    headerBg: 'linear-gradient(135deg, #f59e0b, #fb923c)', // Header arancione
  } : {
    // 📋 TEMA FATTURE - Blue per le fatture (originale)
    primary: '#3b82f6',      // Blue moderno
    secondary: '#10b981',    // Emerald
    accent1: '#f59e0b',      // Amber
    accent2: '#8b5cf6',      // Violet
    success: '#22c55e',      // Green
    error: '#ef4444',        // Red
    warning: '#f59e0b',      // Amber
    text: '#1e293b',         // Slate
    textSecondary: '#64748b', // Slate secondary
    background: 'rgba(255, 255, 255, 0.95)',
    glass: 'rgba(255, 255, 255, 0.8)',
    headerBg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', // Header blu
  };

  // Combina colori dinamici con stili base
  const modernStyles = {
    colors: modernColors,
    ...modernStylesBase
  };

  useEffect(() => {
    loadData();
  }, []);

  // NUOVO: Ricarica dati quando cambia modalità
  useEffect(() => {
    if (modalitaOrdini) {
      loadOrdiniAcquisto();
    }
  }, [modalitaOrdini]);

  useEffect(() => {
    calcolaTotali();
  }, [
    modalitaOrdini ? ordineData.righe.length : formData.righe.length, 
    modalitaOrdini ? ordineData.costo_trasporto : formData.costo_trasporto, 
    modalitaOrdini ? ordineData.costo_commissioni : formData.costo_commissioni, 
    modalitaOrdini ? ordineData.costo_imballaggi : formData.costo_imballaggi
  ]);

  useEffect(() => {
    calcolaPrezziVendita();
  }, [
    modalitaOrdini ? ordineData.righe : formData.righe, 
    modalitaOrdini ? ordineData.costo_trasporto : formData.costo_trasporto, 
    modalitaOrdini ? ordineData.costo_commissioni : formData.costo_commissioni, 
    modalitaOrdini ? ordineData.costo_imballaggi : formData.costo_imballaggi,
    modalitaOrdini
  ]);

  // NUOVO: Effect per filtrare le fatture
  useEffect(() => {
    applicaFiltri();
  }, [filtri, fattureEsistenti, ordinamento]);

  // Gestisce l'apertura del dialog dall'esterno
  useEffect(() => {
    if (open) {
      handleOpenDialog(); // Usa la funzione esistente per il reset
    }
  }, [open]);

  // NUOVO: Carica i dati dell'ordine esistente per modifica
  useEffect(() => {
    if (modalitaModificaOrdine && ordineEsistente && open) {
      console.log('🔄 Caricamento dati ordine esistente:', ordineEsistente);
      
      // Carica i dati dell'ordine nel form
      setOrdineData({
        data_ordine: ordineEsistente.data_ordine || new Date().toISOString().split('T')[0],
        data_consegna_prevista: ordineEsistente.data_consegna_prevista || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        id_fornitore: ordineEsistente.fornitore_id || ordineEsistente.id_fornitore || 0,
        totale_ordine: ordineEsistente.totale_ordine || 0,
        stato: ordineEsistente.stato || 'ordinato',
        note: ordineEsistente.note || '',
        righe: ordineEsistente.righe || [
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
        costo_trasporto: ordineEsistente.costo_trasporto || 0,
        id_fornitore_trasporto: ordineEsistente.id_fornitore_trasporto || 0,
        costo_commissioni: ordineEsistente.costo_commissioni || 0,
        id_fornitore_commissioni: ordineEsistente.id_fornitore_commissioni || 0,
        costo_imballaggi: ordineEsistente.costo_imballaggi || 0,
        id_fornitore_imballaggi: ordineEsistente.id_fornitore_imballaggi || 0,
        note_costi: ordineEsistente.note_costi || '',
        prezzi_vendita: ordineEsistente.prezzi_vendita || [
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
      
      console.log('✅ Dati ordine caricati nel form');
    }
  }, [modalitaModificaOrdine, ordineEsistente, open]);

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

    // Filtro per fornitore (match esatto su valore selezionato in Select)
    if (filtri.fornitore) {
      const fx = String(filtri.fornitore).toLowerCase();
      risultato = risultato.filter(f => (f.fornitore_nome||'').toLowerCase() === fx);
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

    // Stato non rilevante per questa vista: ignorato

    // Filtro prodotto rimosso dalla UI: non applicato

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
      
      // Usa la procedura completa che elimina anche documenti di carico e movimenti di carico
      await apiService.eliminaFatturaCarico(fatturaToDelete.fattura_acquisto_id);
      
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
      
    } catch (error: any) {
      console.error('❌ Errore eliminazione fattura:', error);
      const msg = error?.message || 'Errore durante l\'eliminazione della fattura';
      setSnackbar({
        open: true,
        message: msg,
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
      
      // NUOVO: Carica ordini acquisto se siamo in modalità ordini
      if (modalitaOrdini) {
        await loadOrdiniAcquisto();
      }
      
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

  // NUOVO: Caricamento ordini acquisto
  const loadOrdiniAcquisto = async () => {
    try {
      console.log('🔄 Caricamento ordini acquisto...');
      const ordiniData = await apiService.getOrdiniAcquisto();
      setOrdiniEsistenti(ordiniData);
      setOrdiniFiltrati(ordiniData);
      console.log('✅ Ordini acquisto caricati:', ordiniData.length);
    } catch (error) {
      console.error('❌ Errore caricamento ordini:', error);
      setSnackbar({
        open: true,
        message: 'Errore nel caricamento degli ordini acquisto',
        severity: 'error'
      });
    }
  };

  // NUOVO: Funzione per cambiare modalità
  const toggleModalita = () => {
    if (soloOrdini) return; // Non permettere il cambio se siamo in modalità solo ordini
    
    setModalitaOrdini(!modalitaOrdini);
    setActiveTab(0); // Reset al primo tab
    
    // Reset form data
    if (!modalitaOrdini) {
      // Passando a modalità ordini - reset ordine data
      setOrdineData({
        data_ordine: new Date().toISOString().split('T')[0],
        data_consegna_prevista: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        id_fornitore: 0,
        totale_ordine: 0,
        stato: 'ordinato',
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
      loadOrdiniAcquisto();
    } else {
      // Passando a modalità fatture - reset form data
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
    const currentData = getCurrentData();
    const currentRighe = getCurrentRighe();
    
    const totaleRighe = currentRighe.reduce((acc, riga) => {
      const totaleRiga = riga.quantita * riga.prezzo_acquisto_per_stelo;
      return acc + totaleRiga;
    }, 0);
    
    const totaliCosti = currentData.costo_trasporto + currentData.costo_commissioni + currentData.costo_imballaggi;
    
    if (modalitaOrdini) {
      // Per ordini: calcola solo totale_ordine (senza IVA)
      const totale_ordine = totaleRighe + totaliCosti;
      setOrdineData(prev => ({
        ...prev,
        totale_ordine
      }));
    } else {
      // Per fatture: calcola imponibile e totale con IVA
    const imponibile = totaleRighe + totaliCosti;
    const totale = imponibile + (imponibile * formData.iva / 100);
    setFormData(prev => ({
      ...prev,
      imponibile,
      totale
    }));
    }
  };

  // Funzione per calcolare i prezzi di vendita con costi spalamati
  const calcolaPrezziVendita = () => {
    const currentData = getCurrentData();
    const currentRighe = getCurrentRighe();
    
    const totaleQuantita = currentRighe.reduce((acc, riga) => acc + riga.quantita, 0);
    const totaliCosti = currentData.costo_trasporto + currentData.costo_commissioni + currentData.costo_imballaggi;
    const costoAnaliticoPerStelo = totaleQuantita > 0 ? totaliCosti / totaleQuantita : 0;

    const nuoviPrezziVendita = currentRighe.map((riga, index) => {
      const costoTotalePerStelo = riga.prezzo_acquisto_per_stelo + costoAnaliticoPerStelo;
      const prezzoVendita = currentData.prezzi_vendita[index] || {
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

    if (modalitaOrdini) {
      setOrdineData(prev => ({
        ...prev,
        prezzi_vendita: nuoviPrezziVendita
      }));
    } else {
    setFormData(prev => ({
      ...prev,
      prezzi_vendita: nuoviPrezziVendita
    }));
    }
  };

  // Funzione reattiva per aggiornare i costi e ricalcolare tutto
  const updateCosto = (campo: 'costo_trasporto' | 'costo_commissioni' | 'costo_imballaggi', valore: number) => {
    if (modalitaOrdini) {
      setOrdineData(prev => {
        const newData = { ...prev, [campo]: valore };
        
        // Ricalcola immediatamente il totale ordine
        const totaleRighe = newData.righe.reduce((acc, riga) => acc + (riga.quantita * riga.prezzo_acquisto_per_stelo), 0);
        const totaliCosti = newData.costo_trasporto + newData.costo_commissioni + newData.costo_imballaggi;
        newData.totale_ordine = totaleRighe + totaliCosti;
        
        return newData;
      });
    } else {
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
    }
    
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
    
    if (modalitaOrdini) {
      setOrdineData(prev => ({
        ...prev,
        righe: [...prev.righe, nuovaRiga],
        prezzi_vendita: [...prev.prezzi_vendita, nuovoPrezzoVendita]
      }));
    } else {
    setFormData(prev => ({
      ...prev,
      righe: [...prev.righe, nuovaRiga],
      prezzi_vendita: [...prev.prezzi_vendita, nuovoPrezzoVendita]
    }));
    }
  };

  const rimuoviRiga = async (index: number) => {
    const currentRighe = getCurrentRighe();
    if (currentRighe.length > 1) {
      // TEMPORANEO: Validazione cancellazione disabilitata per debug
      /*
      const riga = currentRighe[index];
      
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
      
      if (modalitaOrdini) {
        setOrdineData(prev => ({
          ...prev,
          righe: prev.righe.filter((_, i) => i !== index),
          prezzi_vendita: prev.prezzi_vendita.filter((_, i) => i !== index)
        }));
      } else {
      setFormData(prev => ({
        ...prev,
        righe: prev.righe.filter((_, i) => i !== index),
        prezzi_vendita: prev.prezzi_vendita.filter((_, i) => i !== index)
      }));
      }
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

    if (modalitaOrdini) {
      setOrdineData(prev => {
        const newData = {
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
          const totaleRighe = newData.righe.reduce((acc, riga) => acc + (riga.quantita * riga.prezzo_acquisto_per_stelo), 0);
          const totaliCosti = newData.costo_trasporto + newData.costo_commissioni + newData.costo_imballaggi;
          newData.totale_ordine = totaleRighe + totaliCosti;
        }
        
        return newData;
      });
    } else {
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
    }
    
    // Ricalcola prezzi di vendita se necessario
    if (field === 'quantita' || field === 'prezzo_acquisto_per_stelo') {
      // Ritarda il calcolo prezzi per permettere al setState di completarsi
      setTimeout(() => {
        calcolaPrezziVendita();
      }, 0);
    }
  };

  const handleOpenDialog = () => {
    // Reset basato sulla modalità
    setModalitaModifica(false);
    setFatturaSelezionata(null);
    setOrdineSelezionato(null);
    setActiveTab(0);
    
    // NON resettare i dati se siamo in modalità modifica ordine
    if (modalitaModificaOrdine && ordineEsistente) {
      console.log('🔄 Modalità modifica ordine - non resetto i dati');
      setOpenDialog(true);
      return;
    }
    
    if (modalitaOrdini) {
      // Reset per nuovo ordine
      setOrdineData({
        data_ordine: new Date().toISOString().split('T')[0],
        data_consegna_prevista: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        id_fornitore: 0,
        totale_ordine: 0,
        stato: 'ordinato',
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
    } else {
      // Reset per nuova fattura
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
    }
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
      // ===== VALIDAZIONE CAMPI OBBLIGATORI DINAMICA =====
      const erroriValidazione = [];
      
      if (modalitaOrdini) {
        // **VALIDAZIONE ORDINI ACQUISTO**
        
        // Controllo fornitore
        if (!ordineData.id_fornitore || ordineData.id_fornitore === 0) {
          erroriValidazione.push('Seleziona un fornitore');
        }

        // Controllo data ordine
        if (!ordineData.data_ordine) {
          erroriValidazione.push('Inserisci la data ordine');
        }

        // Controllo data consegna
        if (!ordineData.data_consegna_prevista) {
          erroriValidazione.push('Inserisci la data di consegna prevista');
        }
        
        // Controllo righe ordine
        if (!ordineData.righe || ordineData.righe.length === 0) {
          erroriValidazione.push('Aggiungi almeno una riga articolo');
        } else {
          // Controllo ogni riga ordine
          ordineData.righe.forEach((riga, index) => {
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
        
      } else {
        // **VALIDAZIONE FATTURE (ORIGINALE)**

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

        // Controllo righe fatture
      if (!formData.righe || formData.righe.length === 0) {
        erroriValidazione.push('Aggiungi almeno una riga articolo');
      } else {
          // Controllo ogni riga fattura
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
      
      if (modalitaOrdini) {
        // ===== GESTIONE ORDINI ACQUISTO =====
        
        if (modalitaModificaOrdine && ordineEsistente) {
          // **MODIFICA ORDINE ACQUISTO ESISTENTE**
          console.log('🔄 Modifica ordine acquisto esistente...');
          
          // 1. Aggiorna l'ordine acquisto base
          const ordineAggiornato = await apiService.updateOrdineAcquisto(ordineEsistente.id, {
            data_ordine: ordineData.data_ordine,
            data_consegna_prevista: ordineData.data_consegna_prevista,
            fornitore_id: ordineData.id_fornitore,
            totale_ordine: ordineData.totale_ordine,
            note: ordineData.note,
            costo_trasporto: ordineData.costo_trasporto || 0,
            id_fornitore_trasporto: ordineData.id_fornitore_trasporto || null,
            costo_commissioni: ordineData.costo_commissioni || 0,
            id_fornitore_commissioni: ordineData.id_fornitore_commissioni || null,
            costo_imballaggi: ordineData.costo_imballaggi || 0,
            id_fornitore_imballaggi: ordineData.id_fornitore_imballaggi || null,
            note_costi: ordineData.note_costi
          });
          
          console.log('✅ Ordine acquisto aggiornato:', ordineAggiornato);
          
          // 2. Elimina tutte le giacenze virtuali esistenti dell'ordine
          const giacenzeEsistenti = await apiService.getGiacenzeVirtualiByOrdine(ordineEsistente.id);
          for (const giacenza of giacenzeEsistenti) {
            await apiService.deleteGiacenzaVirtuale(giacenza.id);
          }
          
          console.log('🗑️ Giacenze virtuali esistenti eliminate');
          
          // 3. Crea le nuove giacenze virtuali per ogni riga
          for (const riga of ordineData.righe) {
            const prezzoVendita = ordineData.prezzi_vendita[0]; // Usa i prezzi del primo articolo
            
            await apiService.createGiacenzaVirtuale({
              ordine_acquisto_id: ordineEsistente.id,
              gruppo_id: riga.id_gruppo,
              nome_prodotto: riga.nome_prodotto,
              colore_id: riga.id_colore,
              provenienza_id: riga.id_provenienza,
              foto_id: riga.id_foto,
              imballo_id: riga.id_imballo,
              altezza_id: riga.id_altezza,
              qualita_id: riga.id_qualita,
              quantita: riga.quantita,
              prezzo_acquisto_per_stelo: riga.prezzo_acquisto_per_stelo,
              prezzo_vendita_1: prezzoVendita.prezzo_vendita_1,
              prezzo_vendita_2: prezzoVendita.prezzo_vendita_2,
              prezzo_vendita_3: prezzoVendita.prezzo_vendita_3,
              note: riga.note || ordineData.note
            });
          }
          
          console.log('✅ Nuove giacenze virtuali create per ordine:', ordineAggiornato.numero_ordine);
          
          // 4. Elimina i movimenti virtuali esistenti dell'ordine
          const movimentiEsistenti = await apiService.getMovimentiMagazzino({
            tipo: 'carico_virtuale',
            ordineId: ordineEsistente.id
          });
          
          for (const movimento of movimentiEsistenti) {
            if (movimento.ordine_acquisto_id === ordineEsistente.id) {
              await apiService.eliminaMovimentoMagazzino(movimento.id);
            }
          }
          
          console.log('🗑️ Movimenti virtuali esistenti eliminati');
          
          // 5. Crea i nuovi movimenti di carico virtuale
          for (const riga of ordineData.righe) {
            await apiService.creaMovimentoMagazzino({
              tipo: 'carico_virtuale',
              data: ordineData.data_ordine,
              quantita: riga.quantita,
              prezzo_unitario: riga.prezzo_acquisto_per_stelo,
              valore_totale: riga.quantita * riga.prezzo_acquisto_per_stelo,
              gruppo_id: riga.id_gruppo,
              colore_id: riga.id_colore,
              provenienza_id: riga.id_provenienza,
              foto_id: riga.id_foto,
              imballo_id: riga.id_imballo,
              altezza_id: riga.id_altezza,
              qualita_id: riga.id_qualita,
              fornitore_id: ordineData.id_fornitore,
              ordine_acquisto_id: ordineEsistente.id,
              note: `Ordine virtuale ${ordineAggiornato.numero_ordine} - ${riga.nome_prodotto}`
            });
          }
          
          console.log('✅ Nuovi movimenti virtuali creati');
          
          setSnackbar({
            open: true,
            message: `🎉 Ordine acquisto ${ordineAggiornato.numero_ordine} aggiornato con successo!`,
            severity: 'success'
          });
          
          // Ricarica la lista ordini
          await loadOrdiniAcquisto();
          
        } else {
          // **CREAZIONE NUOVO ORDINE ACQUISTO**
          console.log('🆕 Creazione nuovo ordine acquisto...');
          
          const primaRiga = ordineData.righe[0];
          const primoPrezzoVendita = ordineData.prezzi_vendita[0];
          
          // 1. Crea l'ordine acquisto
          const nuovoOrdine = await apiService.createOrdineAcquisto({
            data_ordine: ordineData.data_ordine,
            data_consegna_prevista: ordineData.data_consegna_prevista,
            fornitore_id: ordineData.id_fornitore,
            totale_ordine: ordineData.totale_ordine,
            stato: 'ordinato',
            note: ordineData.note,
            costo_trasporto: ordineData.costo_trasporto || 0,
            id_fornitore_trasporto: ordineData.id_fornitore_trasporto || null,
            costo_commissioni: ordineData.costo_commissioni || 0,
            id_fornitore_commissioni: ordineData.id_fornitore_commissioni || null,
            costo_imballaggi: ordineData.costo_imballaggi || 0,
            id_fornitore_imballaggi: ordineData.id_fornitore_imballaggi || null,
            note_costi: ordineData.note_costi
          });
          
          console.log('✅ Ordine acquisto creato:', nuovoOrdine);
          
          // 2. Crea le giacenze virtuali per ogni riga
          for (const riga of ordineData.righe) {
            const prezzoVendita = ordineData.prezzi_vendita[0]; // Usa i prezzi del primo articolo
            
            await apiService.createGiacenzaVirtuale({
              ordine_acquisto_id: nuovoOrdine.id,
              gruppo_id: riga.id_gruppo,
              nome_prodotto: riga.nome_prodotto,
              colore_id: riga.id_colore,
              provenienza_id: riga.id_provenienza,
              foto_id: riga.id_foto,
              imballo_id: riga.id_imballo,
              altezza_id: riga.id_altezza,
              qualita_id: riga.id_qualita,
              quantita: riga.quantita,
              prezzo_acquisto_per_stelo: riga.prezzo_acquisto_per_stelo,
              prezzo_vendita_1: prezzoVendita.prezzo_vendita_1,
              prezzo_vendita_2: prezzoVendita.prezzo_vendita_2,
              prezzo_vendita_3: prezzoVendita.prezzo_vendita_3,
              note: riga.note || ordineData.note
            });
          }
          
          console.log('✅ Giacenze virtuali create per ordine:', nuovoOrdine.numero_ordine);
          
          // 3. Crea movimenti di magazzino virtuali
          for (const riga of ordineData.righe) {
            await apiService.creaMovimentoMagazzino({
              tipo: 'carico_virtuale',
              data: ordineData.data_ordine,
              quantita: riga.quantita,
              prezzo_unitario: riga.prezzo_acquisto_per_stelo,
              valore_totale: riga.quantita * riga.prezzo_acquisto_per_stelo,
              gruppo_id: riga.id_gruppo,
              colore_id: riga.id_colore,
              provenienza_id: riga.id_provenienza,
              foto_id: riga.id_foto,
              imballo_id: riga.id_imballo,
              altezza_id: riga.id_altezza,
              qualita_id: riga.id_qualita,
              fornitore_id: ordineData.id_fornitore,
              ordine_acquisto_id: nuovoOrdine.id,
              note: `Ordine virtuale ${nuovoOrdine.numero_ordine} - ${riga.nome_prodotto}`
            });
          }
          
          console.log('✅ Movimenti virtuali creati');
          
          setSnackbar({
            open: true,
            message: `🎉 Ordine acquisto ${nuovoOrdine.numero_ordine} creato con successo!`,
            severity: 'success'
          });
          
          // Ricarica la lista ordini
          await loadOrdiniAcquisto();
        }
        
      } else if (modalitaModifica && fatturaSelezionata) {
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

        // AGGIORNAMENTO AUTOMATICO MOVIMENTI MAGAZZINO (gestito da trigger SQL)
        // TODO: Rimosso temporaneamente - ora gestito automaticamente da trigger database
        console.log('✅ Movimenti di magazzino gestiti automaticamente da trigger database');
        
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
        
        // Validazione: blocca creazione se la quantità del carico è assente o <= 0
        if (!datiCompleti.quantita || Number(datiCompleti.quantita) <= 0) {
          setSnackbar({
            open: true,
            message: 'Quantità carico non valida (deve essere > 0)',
            severity: 'error'
          });
          return;
        }
        
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

        // CREAZIONE AUTOMATICA MOVIMENTI MAGAZZINO (gestito da trigger SQL)
        // TODO: Rimosso temporaneamente - ora gestito automaticamente da trigger database
        console.log('✅ Movimenti di magazzino gestiti automaticamente da trigger database');
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

  // NUOVO: Funzioni helper per gestire dati condizionali
  const getCurrentData = () => modalitaOrdini ? ordineData : formData;
  const getCurrentRighe = () => modalitaOrdini ? ordineData.righe : formData.righe;
  const setCurrentData = (newData: any) => {
    if (modalitaOrdini) {
      setOrdineData(newData);
    } else {
      setFormData(newData);
    }
  };

  // Helper per aggiornare prezzi di vendita
  const updatePrezzoVendita = (index: number, field: keyof PrezzoVendita, value: number) => {
    if (modalitaOrdini) {
      const nuoviPrezzi = [...ordineData.prezzi_vendita];
      nuoviPrezzi[index] = {
        ...nuoviPrezzi[index],
        [field]: value
      };
      setOrdineData({...ordineData, prezzi_vendita: nuoviPrezzi});
    } else {
      const nuoviPrezzi = [...formData.prezzi_vendita];
      nuoviPrezzi[index] = {
        ...nuoviPrezzi[index],
        [field]: value
      };
      setFormData({...formData, prezzi_vendita: nuoviPrezzi});
    }
  };

  // Helper per aggiornare fornitore costi analitici
  const updateFornitoreAnalitici = (campo: 'id_fornitore_trasporto' | 'id_fornitore_commissioni' | 'id_fornitore_imballaggi' | 'note_costi', valore: number | string) => {
    if (modalitaOrdini) {
      setOrdineData(prev => ({ ...prev, [campo]: valore }));
    } else {
      setFormData(prev => ({ ...prev, [campo]: valore }));
    }
  };

  const renderFormBase = () => {
    if (modalitaOrdini) {
      // **FORM ORDINI ACQUISTO**
      return (
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="📅 Data Ordine"
              type="date"
              value={ordineData.data_ordine}
              onChange={(e) => setOrdineData({...ordineData, data_ordine: e.target.value})}
              InputLabelProps={{ shrink: true }}
              sx={modernStyles.modernInput}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="🚚 Data Consegna Prevista"
              type="date"
              value={ordineData.data_consegna_prevista}
              onChange={(e) => setOrdineData({...ordineData, data_consegna_prevista: e.target.value})}
              InputLabelProps={{ shrink: true }}
              sx={modernStyles.modernInput}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={modernStyles.modernInput}>
              <InputLabel>🏢 Fornitore</InputLabel>
              <Select
                value={ordineData.id_fornitore || ""}
                onChange={(e) => setOrdineData({...ordineData, id_fornitore: Number(e.target.value)})}
              >
                <MenuItem value="">
                  <em>Seleziona fornitore...</em>
                </MenuItem>
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
              <InputLabel>📊 Stato Ordine</InputLabel>
              <Select
                value={ordineData.stato}
                onChange={(e) => setOrdineData({...ordineData, stato: e.target.value as 'ordinato' | 'consegnato'})}
              >
                <MenuItem value="ordinato">🕒 Ordinato</MenuItem>
                <MenuItem value="consegnato">✅ Consegnato</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="📝 Note Ordine"
              multiline
              rows={4}
              value={ordineData.note}
              onChange={(e) => setOrdineData({...ordineData, note: e.target.value})}
              sx={modernStyles.modernInput}
            />
          </Grid>
        </Grid>
      );
    } else {
      // **FORM FATTURE (ORIGINALE)**
      return (
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
            value={formData.id_fornitore || ""}
            onChange={(e) => setFormData({...formData, id_fornitore: Number(e.target.value)})}
          >
            <MenuItem value="">
              <em>Seleziona fornitore...</em>
            </MenuItem>
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
    }
  };

  const renderRigaArticolo = (riga: RigaFattura, index: number) => (
    <Card sx={modernStyles.articleCard}>
      <CardContent sx={{ p: 2 }}>
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
          
          {getCurrentRighe().length > 1 && (
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
                  value={riga.id_gruppo || ""}
                  onChange={(e) => updateRiga(index, 'id_gruppo', Number(e.target.value))}
                >
                  <MenuItem value="">
                    <em>Seleziona gruppo...</em>
                  </MenuItem>
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
                  value={riga.id_colore || ""}
                  onChange={(e) => updateRiga(index, 'id_colore', Number(e.target.value))}
                >
                  <MenuItem value="">
                    <em>Seleziona colore...</em>
                  </MenuItem>
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
              value={riga.id_provenienza || ""}
              onChange={(e) => updateRiga(index, 'id_provenienza', Number(e.target.value))}
            >
              <MenuItem value="">
                <em>Seleziona provenienza...</em>
              </MenuItem>
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
                value={riga.id_foto || ""}
                onChange={(e) => updateRiga(index, 'id_foto', Number(e.target.value))}
              >
                <MenuItem value="">
                  <em>Seleziona foto...</em>
                </MenuItem>
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
              value={riga.id_imballo || ""}
              onChange={(e) => updateRiga(index, 'id_imballo', Number(e.target.value))}
            >
              <MenuItem value="">
                <em>Seleziona imballo...</em>
              </MenuItem>
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
              value={riga.id_altezza || ""}
              onChange={(e) => updateRiga(index, 'id_altezza', Number(e.target.value))}
            >
              <MenuItem value="">
                <em>Seleziona altezza...</em>
              </MenuItem>
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
              value={riga.id_qualita || ""}
              onChange={(e) => updateRiga(index, 'id_qualita', Number(e.target.value))}
            >
              <MenuItem value="">
                <em>Seleziona qualità...</em>
              </MenuItem>
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
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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

  const renderCostiAnalitici = () => {
    const currentData = getCurrentData();
    
    return (
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
                value={currentData.costo_trasporto}
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
                  value={currentData.id_fornitore_trasporto}
                  onChange={(e) => updateFornitoreAnalitici('id_fornitore_trasporto', Number(e.target.value))}
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
              value={currentData.costo_commissioni}
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
                value={currentData.id_fornitore_commissioni}
                onChange={(e) => updateFornitoreAnalitici('id_fornitore_commissioni', Number(e.target.value))}
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
              value={currentData.costo_imballaggi}
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
                value={currentData.id_fornitore_imballaggi}
                onChange={(e) => updateFornitoreAnalitici('id_fornitore_imballaggi', Number(e.target.value))}
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
          value={currentData.note_costi}
          onChange={(e) => updateFornitoreAnalitici('note_costi', e.target.value)}
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
                <Typography variant="h6">€ {currentData.costo_trasporto.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Commissioni:</Typography>
                <Typography variant="h6">€ {currentData.costo_commissioni.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Imballaggi:</Typography>
                <Typography variant="h6">€ {currentData.costo_imballaggi.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" sx={{ color: modernStyles.colors.primary, fontWeight: 'bold' }}>
                  Totale Costi: € {(currentData.costo_trasporto + currentData.costo_commissioni + currentData.costo_imballaggi).toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
  };

  const renderPrezziVendita = () => {
    const currentData = getCurrentData();
    const currentRighe = getCurrentRighe();
    const totaleQuantita = currentRighe.reduce((acc, riga) => acc + riga.quantita, 0);
    const totaliCosti = currentData.costo_trasporto + currentData.costo_commissioni + currentData.costo_imballaggi;
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
        {getCurrentRighe().map((riga, index) => {
          const currentData = getCurrentData();
          const prezzoVendita = currentData.prezzi_vendita[index];
          const costoTotalePerStelo = riga.prezzo_acquisto_per_stelo + costoAnaliticoPerStelo;
          
          return (
            <Grid item xs={12} key={index}>
              <Card sx={modernStyles.articleCard}>
                <CardContent sx={{ p: 2 }}>
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
                          updatePrezzoVendita(index, 'percentuale_ricarico_1', Number(e.target.value));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setTimeout(() => calcolaPrezziVendita(), 0);
                          }
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
                          updatePrezzoVendita(index, 'percentuale_ricarico_2', Number(e.target.value));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setTimeout(() => calcolaPrezziVendita(), 0);
                          }
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
                          updatePrezzoVendita(index, 'percentuale_ricarico_3', Number(e.target.value));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setTimeout(() => calcolaPrezziVendita(), 0);
                          }
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

  const renderRiepilogo = () => {
    const currentData = getCurrentData();
    
    if (modalitaOrdini) {
      // Modalità ORDINI - non c'è IVA
      return (
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6">Totale Ordine: €{currentData.totale_ordine.toFixed(2)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: modernStyles.colors.primary }}>
                TOTALE: €{currentData.totale_ordine.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      );
    } else {
      // Modalità FATTURE - con IVA
      return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
              <Typography variant="h6">Imponibile: €{currentData.imponibile.toFixed(2)}</Typography>
        </Grid>
        <Grid item xs={12} sm={4}>
              <Typography variant="h6">IVA ({currentData.iva}%): €{(currentData.imponibile * currentData.iva / 100).toFixed(2)}</Typography>
        </Grid>
        <Grid item xs={12} sm={4}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>TOTALE: €{currentData.totale.toFixed(2)}</Typography>
        </Grid>
      </Grid>
        </Box>
      );
    }
  };
      
  const renderRiepilogoTabella = () => (
    <Box>
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" gutterBottom>Riepilogo Articoli ({getCurrentRighe().length})</Typography>
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
          {getCurrentRighe().map((riga, index) => (
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

  // NUOVO: Renderizza lista fatture esistenti (compatto, stile vendite)
  const renderListaFatture = () => {
    const exportCsv = () => {
      const headers = ['numero_fattura','data','fornitore','articoli','totale','stato'];
      const rows = fattureFiltrate.map((f: any) => [
        f.numero || '',
        f.data_fattura ? new Date(f.data_fattura).toISOString().slice(0,10) : '',
        f.fornitore_nome || '',
        String(f.articoli_count || 0),
        (f.totale_fattura?.toFixed?.(2) || '0.00'),
        f.stato_fattura || ''
      ].join(','));
      const csv = [headers.join(',')].concat(rows).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'fatture_acquisto.csv'; a.click(); URL.revokeObjectURL(url);
    };

    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Paper sx={{ ...modernStyles.glassmorphic, mb: 1 }}>
          <Box sx={{ p: 1.5 }}>
            <Box sx={{ display:'flex', alignItems:'center', justifyContent:'flex-start', mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: modernStyles.colors.text, fontSize:'1rem' }}>
                Fatture di Acquisto ({fattureFiltrate.length} / {fattureEsistenti.length})
            </Typography>
          </Box>

            {/* Filtri compatti inline */}
            <Box sx={{ display:'flex', gap:1, alignItems:'center', flexWrap:'nowrap', overflowX:'auto', '::-webkit-scrollbar':{ display:'none' }, mb: 1 }}>
              <TextField size="small" label="Numero" value={filtri.numeroFattura} onChange={(e)=>setFiltri({...filtri, numeroFattura:e.target.value})} sx={{ width: 140 }} />
              {/* Fornitore da lista */}
              <FormControl size="small" sx={{ width: 240 }}>
                <InputLabel>Fornitore</InputLabel>
                    <Select
                  label="Fornitore"
                  value={filtri.fornitore}
                  onChange={(e)=>setFiltri({...filtri, fornitore:String(e.target.value)})}
                >
                  <MenuItem value=""><em>Tutti</em></MenuItem>
                  {fornitori.map((f:any)=> (
                    <MenuItem key={f.id} value={(f.ragione_sociale||f.nome||'').toLowerCase()}>
                      {f.ragione_sociale || f.nome}
                    </MenuItem>
                  ))}
                    </Select>
                  </FormControl>
              <TextField size="small" type="date" label="Da" value={filtri.dataInizio} onChange={(e)=>setFiltri({...filtri, dataInizio:e.target.value})} InputLabelProps={{ shrink:true }} sx={{ width: 150 }} />
              <TextField size="small" type="date" label="A" value={filtri.dataFine} onChange={(e)=>setFiltri({...filtri, dataFine:e.target.value})} InputLabelProps={{ shrink:true }} sx={{ width: 150 }} />
              {/* Stato non rilevante qui: rimosso dai filtri UI */}
              <FormControl size="small" sx={{ width: 190 }}>
                <InputLabel>Ordina</InputLabel>
                <Select label="Ordina" value={`${ordinamento.campo}-${ordinamento.direzione}`} onChange={(e)=>{ const [campo,direzione]=String(e.target.value).split('-'); setOrdinamento({ campo, direzione: direzione as 'asc'|'desc' }); }}>
                  <MenuItem value="data-desc">Data (recente)</MenuItem>
                  <MenuItem value="data-asc">Data (vecchia)</MenuItem>
                  <MenuItem value="numero_fattura-asc">Numero (A-Z)</MenuItem>
                  <MenuItem value="numero_fattura-desc">Numero (Z-A)</MenuItem>
                  <MenuItem value="totale-desc">Importo (maggiore)</MenuItem>
                  <MenuItem value="totale-asc">Importo (minore)</MenuItem>
                    </Select>
                  </FormControl>
              {/* Pulsanti azione inline */}
              <Button size="small" variant="outlined" onClick={resetFiltri} sx={{ borderRadius: 0, whiteSpace:'nowrap' }}>Reset</Button>
              <Button size="small" variant="outlined" onClick={loadData} sx={{ borderRadius: 0, whiteSpace:'nowrap' }}>Aggiorna</Button>
              <Button size="small" variant="outlined" onClick={exportCsv} sx={{ borderRadius: 0, whiteSpace:'nowrap' }}>Export CSV</Button>
            </Box>

          {fattureFiltrate.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: '8px' }}>Nessun documento trovato</Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Numero</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Fornitore</TableCell>
                    <TableCell>Articoli</TableCell>
                    <TableCell align="right">Totale</TableCell>
                    {/* Stato nascosto in questa vista */}
                    <TableCell align="right">Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fattureFiltrate.map((fattura: any, idx: number) => (
                    <TableRow key={fattura.id || idx} hover>
                      <TableCell>{fattura.numero || '-'}</TableCell>
                      <TableCell>{fattura.data_fattura ? new Date(fattura.data_fattura).toLocaleDateString('it-IT') : '-'}</TableCell>
                      <TableCell>{fattura.fornitore_nome || '-'}</TableCell>
                      <TableCell>{fattura.articoli_count || 0}</TableCell>
                      <TableCell align="right">€ {(fattura.totale_fattura?.toFixed?.(2) || '0.00')}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" variant="contained" onClick={()=>handleModificaFattura(fattura)} sx={{ borderRadius: 8, textTransform:'none', fontWeight:700, px:2, py:0.6, background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>Modifica</Button>
                          <IconButton size="small" color="error" onClick={()=>handleEliminaFattura(fattura)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </Paper>
      </motion.div>
    );
  };

  return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        minHeight: open ? '100vh' : 'fit-content',
        background: modernStyles.colors.background,
      }}
    >
      {/* 🔥 INDICATORE VISIVO MODALITÀ */}
      {!soloOrdini && (
                        <Box sx={{ 
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: modernStyles.colors.headerBg,
          borderBottom: `3px solid ${modalitaOrdini ? '#d97706' : '#1d4ed8'}`,
                          mb: 3
                        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 2,
            px: 3
          }}>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
                          <Chip 
                icon={modalitaOrdini ? 
                  <Box sx={{ fontSize: '18px' }}>🛒</Box> : 
                  <Box sx={{ fontSize: '18px' }}>📋</Box>
                }
                label={modalitaOrdini ? 
                  "MODALITÀ ORDINI ACQUISTO" : 
                  "MODALITÀ FATTURE DI ACQUISTO"
                            }
                            sx={{ 
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  px: 2,
                  py: 1,
                  height: 'auto',
                  '& .MuiChip-label': {
                    px: 2,
                    py: 1
                  }
                }}
                variant="filled"
              />
            </motion.div>
                        </Box>
                        </Box>
      )}

      {/* Sezione principale - nascosta quando soloOrdini è true */}
      {!soloOrdini && (
      <Box sx={modernStyles.mainContainer}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Paper sx={modernStyles.glassmorphic}>
              <Box sx={{ p: 1.5 }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ReceiptLongIcon sx={{ fontSize: 24, color: modernStyles.colors.primary, mr: 1.5 }} />
                      <Box>
                  <Typography 
                          variant="h6" 
                    sx={{ 
                            fontWeight: 600, 
                            color: modernStyles.colors.text,
                            fontSize: '1.2rem',
                            letterSpacing: '-0.01em',
                            mb: 0.5
                          }}
                        >
                          {modalitaOrdini ? 'Ordini Acquisto' : 'Fatture Acquisti'}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: modernStyles.colors.textSecondary,
                          fontWeight: 500,
                          fontSize: '0.875rem'
                        }}>
                          {modalitaOrdini 
                            ? 'Gestione ordini virtuali che diventano fatture reali alla consegna'
                            : 'Gestione completa delle fatture di acquisto con 8 caratteristiche per articolo'
                          }
                  </Typography>
                </Box>
                    </Box>
              
                  {/* 🔥 TOGGLE MODALITÀ CON INDICATORI VISIVI */}
                  {!soloOrdini && (
              <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                    <Button
                      variant="contained"
                      onClick={toggleModalita}
                      startIcon={modalitaOrdini ? 
                        <Box sx={{ fontSize: '16px' }}>📋</Box> : 
                        <Box sx={{ fontSize: '16px' }}>🛒</Box>
                      }
                  sx={{ 
                        borderRadius: '25px',
                        padding: '10px 20px',
                        background: modalitaOrdini ? 'linear-gradient(45deg, #667eea, #764ba2)' : 'linear-gradient(45deg, #f59e0b, #fb923c)',
                        border: '2px solid transparent',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        textTransform: 'none',
                        minWidth: '180px',
                        boxShadow: modalitaOrdini ? '0 4px 15px rgba(102, 126, 234, 0.4)' : '0 4px 15px rgba(245, 158, 11, 0.4)',
                        '&:hover': {
                          background: modalitaOrdini ? 'linear-gradient(45deg, #5b6fe5, #6b49a8)' : 'linear-gradient(45deg, #d97706, #ea580c)',
                          transform: 'translateY(-2px)',
                          boxShadow: modalitaOrdini ? '0 6px 20px rgba(102, 126, 234, 0.5)' : '0 6px 20px rgba(245, 158, 11, 0.5)',
                        }
                      }}
                    >
                      {modalitaOrdini ? 
                        'Passa a Fatture' : 
                        'Passa a Ordini'
                      }
                    </Button>
                  </motion.div>
                  )}
                </Box>
              </motion.div>

              {!soloOrdini && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  style={{ marginTop: '8px' }}
              >
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenDialog}
                  size="medium"
                  sx={{
                    borderRadius: 1,
                    px: 3,
                    py: 1.25,
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: modalitaOrdini ? '0 3px 10px rgba(245, 158, 11, 0.3)' : '0 3px 10px rgba(59, 130, 246, 0.3)',
                    background: modalitaOrdini ? 'linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': { background: modalitaOrdini ? 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)' : 'linear-gradient(135deg, #5b6fe5 0%, #6b49a8 100%)' }
                  }}
                >
                  {modalitaOrdini ? 'Crea Nuovo Ordine' : 'Crea Nuova Fattura'}
                </Button>
              </motion.div>
              )}
            </Box>
          </Paper>
        </motion.div>
        </Box>
      )}

        {/* NUOVO: Lista fatture esistenti */}
      {!soloOrdini && (
        <Box sx={{ mt: 1 }}>
        {renderListaFatture()}
        </Box>
      )}

        <Dialog 
          open={open || openDialog} 
          onClose={() => {
            handleCloseDialog();
            onClose();
          }}
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
                background: modalitaOrdini 
                  ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' // Arancione per ordini
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Blu per fatture
                color: 'white', 
                display: 'flex', 
                alignItems: 'center',
                borderRadius: '24px 24px 0 0',
                padding: '24px'
              }}
            >
              {modalitaOrdini ? (
                <ShoppingCartIcon sx={{ mr: 2, fontSize: 28 }} />
              ) : (
              <ReceiptIcon sx={{ mr: 2, fontSize: 28 }} />
              )}
              <Typography component="span" variant="h5" sx={{ fontWeight: 700 }}>
                {modalitaOrdini 
                  ? (modalitaModificaOrdine ? `✏️ Modifica Ordine Acquisto ${ordineData?.numero_ordine || ''}` : '🛒 Nuovo Ordine Acquisto')
                  : (modalitaModifica ? `✏️ Modifica Fattura: ${formData.numero_fattura}` : '➕ Nuova Fattura con Carico Multi-Riga')
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
                  <Tab label={`🛍️ Articoli (${getCurrentRighe().length})`} sx={{ fontWeight: 600 }} />
                  <Tab label="💰 Costi Analitici" sx={{ fontWeight: 600 }} />
                  <Tab label="� Prezzi Vendita" sx={{ fontWeight: 600 }} />
                  <Tab label="�📊 Riepilogo" sx={{ fontWeight: 600 }} />
                </Tabs>
              </Box>
              
              <Box sx={{ p: 3 }}>
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
                    {getCurrentRighe().map((riga, index) => (
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
                    {renderRiepilogoTabella()}
                  </motion.div>
                </TabPanel>
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.8)', borderRadius: '0 0 16px 16px' }}>
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
                startIcon={modalitaOrdini ? 
                  <Box sx={{ fontSize: '18px' }}>🛒</Box> : 
                  <SaveIcon />
                }
                disabled={loading}
                sx={{
                  ...modernStyles.primaryButton,
                  background: modalitaOrdini ? 
                    'linear-gradient(45deg, #f59e0b, #fb923c)' : 
                    'linear-gradient(45deg, #3b82f6, #1d4ed8)',
                  '&:hover': {
                    background: modalitaOrdini ? 
                      'linear-gradient(45deg, #d97706, #ea580c)' : 
                      'linear-gradient(45deg, #1d4ed8, #1e40af)',
                  }
                }}
              >
                {loading 
                  ? (modalitaOrdini ? 
                      (modalitaModificaOrdine ? 'Aggiornamento Ordine...' : 'Creazione Ordine...') :
                      (modalitaModifica ? 'Aggiornamento...' : 'Salvataggio...')
                    )
                  : (modalitaOrdini ? 
                      (modalitaModificaOrdine ? 'Aggiorna Ordine' : 'Crea Ordine Acquisto') :
                      (modalitaModifica ? 'Aggiorna Fattura' : 'Salva Fattura')
                    )
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              
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
    </motion.div>
  );
}
