# 📄 Guida Parsing PDF Fatture

## 🎯 Panoramica

Il sistema di parsing PDF permette di caricare automaticamente fatture di acquisto da file PDF, estraendo i dati principali come numero fattura, data, totale e articoli. Il sistema è completamente configurabile per adattarsi ai diversi formati dei fornitori.

## 🚀 Come Iniziare

### 1. Accesso alla Funzionalità
- Vai alla sezione **"Parsing PDF"** nella sidebar
- Seleziona il fornitore dalla lista
- Configura il parser per quel fornitore specifico

### 2. Configurazione Parser

#### Pattern Regex
Il sistema usa espressioni regolari per estrarre i dati. Ecco alcuni esempi:

**Numero Fattura:**
```
Fattura\s*[Nn]°?\s*([A-Z0-9/-]+)
```
Cerca: "Fattura N° FA-2024-001" → Estrae: "FA-2024-001"

**Data Fattura:**
```
Data\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})
```
Cerca: "Data: 15/01/2024" → Estrae: "15/01/2024"

**Totale:**
```
Totale\s*:?\s*([\d.,]+)
```
Cerca: "Totale: 1.250,50" → Estrae: "1.250,50"

**Articoli:**
```
([^\n]+)\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)
```
Cerca righe come: "Rose Rosse 50 2,50 125,00"

#### Mappatura Campi
Definisce come mappare i gruppi catturati dal regex degli articoli:

- **Nome Articolo**: Gruppo 1
- **Quantità**: Gruppo 2  
- **Prezzo Unitario**: Gruppo 3
- **Totale**: Gruppo 4

## 📋 Workflow Completo

### Step 1: Configurazione Fornitore
1. Seleziona il fornitore dalla lista
2. Clicca "Configura Parser"
3. Inserisci i pattern regex per i campi
4. Configura la mappatura dei campi articoli
5. Salva la configurazione

### Step 2: Caricamento PDF
1. Clicca "Seleziona PDF"
2. Scegli il file fattura
3. Clicca "Carica e Parsa PDF"
4. Il sistema estrae automaticamente i dati

### Step 3: Verifica e Conferma
1. Controlla i dati estratti
2. Usa "Preview Testo PDF" per verificare l'estrazione
3. Modifica la configurazione se necessario
4. Clicca "Conferma e Crea Fattura"

## 🔧 Configurazioni Avanzate

### Pattern Personalizzati

**Per fatture con formato specifico:**
```
// Numero fattura con prefisso
Fattura\s*[Nn]°?\s*([A-Z]{2}-\d{4}-\d{3})

// Data in formato americano
Data\s*:?\s*(\d{1,2}/\d{1,2}/\d{4})

// Totale con valuta
Totale\s*:?\s*€?\s*([\d.,]+)
```

### Mappatura Articoli Complessa

Per fatture con più colonne:
```
// Pattern per tabella articoli
(\w+(?:\s+\w+)*)\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)
```

Mappatura:
- Nome: Gruppo 1
- Quantità: Gruppo 2
- Prezzo Unit.: Gruppo 3
- Sconto: Gruppo 4
- Totale: Gruppo 5

## 🛠️ Risoluzione Problemi

### Dati Non Estratti
1. **Controlla il Preview Testo PDF**
   - Verifica che il testo sia leggibile
   - Controlla se ci sono caratteri speciali

2. **Modifica i Pattern Regex**
   - Usa il Preview per vedere il formato esatto
   - Adatta i pattern al formato specifico

3. **Testa i Pattern**
   - Usa regex tester online
   - Verifica che i gruppi siano corretti

### Articoli Non Trovati
1. **Controlla la Mappatura Campi**
   - Verifica che i gruppi corrispondano
   - Conta i gruppi nel pattern articoli

2. **Modifica Pattern Articoli**
   - Adatta al formato della tabella
   - Considera spazi e separatori

### Errori di Parsing
1. **Controlla la Sintassi Regex**
   - Verifica caratteri speciali
   - Testa pattern singolarmente

2. **Semplifica i Pattern**
   - Inizia con pattern semplici
   - Aggiungi complessità gradualmente

## 📊 Esempi di Configurazione

### Fornitore A - Fattura Semplice
```
Numero: Fattura\s*[Nn]°?\s*([A-Z0-9/-]+)
Data: Data\s*:?\s*(\d{1,2}/\d{1,2}/\d{4})
Totale: Totale\s*:?\s*([\d.,]+)
Articoli: ([^\n]+)\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)
```

### Fornitore B - Fattura Complessa
```
Numero: Fattura\s*[Nn]°?\s*([A-Z]{2}-\d{4}-\d{3})
Data: Data\s*:?\s*(\d{1,2}/\d{1,2}/\d{4})
Totale: Totale\s*:?\s*€?\s*([\d.,]+)
Articoli: (\w+(?:\s+\w+)*)\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)
```

## 🎯 Best Practices

1. **Testa Sempre**
   - Usa sempre il Preview prima di confermare
   - Verifica con più fatture dello stesso fornitore

2. **Pattern Specifici**
   - Crea pattern specifici per ogni fornitore
   - Non usare pattern generici

3. **Backup Configurazioni**
   - Salva le configurazioni funzionanti
   - Documenta i pattern per ogni fornitore

4. **Validazione Dati**
   - Controlla sempre i dati estratti
   - Verifica totali e calcoli

## 🔄 Aggiornamenti

Il sistema salva automaticamente le configurazioni nel database. Puoi:
- Modificare configurazioni esistenti
- Aggiungere nuovi fornitori
- Testare pattern diversi

## 📞 Supporto

Per problemi o miglioramenti:
1. Usa il Preview per diagnosticare
2. Controlla i log del server
3. Verifica la configurazione regex
4. Testa con fatture di esempio 