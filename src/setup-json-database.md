# Setup Database JSON - Gestionale Fiori

## 🎯 Vantaggi del Database JSON

- **Semplice**: Nessuna configurazione server complessa
- **Locale**: I dati sono salvati in un file JSON sul tuo computer
- **Veloce**: Performance eccellenti per applicazioni locali
- **Portabile**: Puoi spostare il file database ovunque
- **Gratuito**: Nessun costo di hosting o licenze
- **Nessuna compilazione**: Non richiede Visual Studio o dipendenze native

## 📋 Prerequisiti

1. **Node.js** (versione 16 o superiore)
2. **npm** o **yarn**

## 🚀 Setup Rapido

### 1. Installa le dipendenze del server

```bash
cd server
npm install
```

### 2. Avvia il server JSON

```bash
cd server
npm run dev
```

Il server sarà disponibile su: `http://localhost:3001`

### 3. Testa la connessione

Apri il browser e vai su: `http://localhost:3001/api/health`

Dovresti vedere: `{"status":"OK","timestamp":"..."}`

## 📊 Struttura del Database

Il database JSON include tutte le collezioni necessarie:

- **gruppi** - Categorie di fiori (Rose, Tulipani, ecc.)
- **prodotti** - Prodotti specifici (Rosa Rossa, Tulipano Giallo, ecc.)
- **varieta** - Varietà specifiche con prezzi e caratteristiche
- **giacenze** - Quantità disponibili per ogni varietà
- **clienti** - Anagrafica clienti
- **fornitori** - Anagrafica fornitori
- **fatture** - Fatture di vendita e acquisto
- **dettagli_fattura** - Dettagli delle fatture
- **eventi** - Eventi del calendario
- **colori, altezze, qualita, provenienze** - Tabelle di riferimento

## 🔄 Migrazione da Appwrite

### Passo 1: Backup dati Appwrite
Prima di tutto, esporta i tuoi dati da Appwrite (se ne hai).

### Passo 2: Inserimento dati nel JSON
Il database viene inizializzato automaticamente con dati di esempio.

### Passo 3: Aggiorna il frontend
Il frontend ora usa `apiService` invece di `appwriteService`.

## 🛠️ Comandi Utili

### Avvia il server in modalità sviluppo
```bash
cd server
npm run dev
```

### Compila per produzione
```bash
cd server
npm run build
```

### Avvia in produzione
```bash
cd server
npm start
```

## 📁 Struttura File

```
server/
├── index.ts              # Server Express
├── package.json          # Dipendenze server
└── dist/                 # File compilati (generato)

database/
└── gestionale_fiori.json # File database JSON (generato)

lib/
├── jsonDatabase.ts       # Servizio database JSON
└── apiService.ts         # Servizio API frontend
```

## 🔧 Configurazione

### Cambiare la porta del server
Modifica `PORT` in `server/index.ts`:
```typescript
const PORT = process.env.PORT || 3001;
```

### Cambiare il percorso del database
Modifica `DB_PATH` in `lib/jsonDatabase.ts`:
```typescript
const DB_PATH = path.join(process.cwd(), 'database', 'gestionale_fiori.json');
```

## 🚨 Risoluzione Problemi

### Errore "Port already in use"
Cambia la porta nel file `server/index.ts`:
```typescript
const PORT = process.env.PORT || 3002;
```

### Errore "Database locked"
Il database è in uso da un'altra istanza. Chiudi tutte le connessioni e riavvia.

### Errore "Module not found"
Installa le dipendenze:
```bash
cd server
npm install
```

## 📈 Backup e Ripristino

### Backup del database
```bash
cp database/gestionale_fiori.json database/backup_$(date +%Y%m%d).json
```

### Ripristino del database
```bash
cp database/backup_YYYYMMDD.json database/gestionale_fiori.json
```

## 🎉 Pronto!

Il tuo gestionale ora usa un database JSON locale, molto più semplice da gestire rispetto ad Appwrite. Tutti i dati sono salvati nel file `database/gestionale_fiori.json` e puoi spostarlo, copiarlo o fare backup facilmente.

Il frontend continuerà a funzionare esattamente come prima, ma ora si connette al tuo server JSON locale invece che ad Appwrite. 