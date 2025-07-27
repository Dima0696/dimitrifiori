# Configurazione Appwrite per il Gestionale

## Passo 1: Creare un account Appwrite

1. Vai su [appwrite.io](https://appwrite.io)
2. Clicca su "Get Started" o "Sign Up"
3. Crea un account gratuito

## Passo 2: Creare un nuovo progetto

1. Dopo il login, clicca su "Create Project"
2. Dai un nome al progetto (es. "Gestionale Fiori")
3. Scegli un ID per il progetto (es. "gestionale-fiori")
4. Clicca su "Create"

## Passo 3: Ottenere le credenziali

1. Nel dashboard del progetto, vai su "Settings" → "API Keys"
2. Clicca su "Create API Key"
3. Dai un nome alla chiave (es. "Web Client")
4. Seleziona le seguenti autorizzazioni:
   - `users.read`
   - `users.write`
   - `databases.read`
   - `databases.write`
   - `collections.read`
   - `collections.write`
   - `documents.read`
   - `documents.write`
5. Clicca su "Create"
6. **IMPORTANTE**: Copia il Project ID e la API Key (li useremo dopo)

## Passo 4: Creare il database

1. Nel menu laterale, vai su "Databases"
2. Clicca su "Create Database"
3. Dai un nome al database (es. "GestionaleDB")
4. Clicca su "Create"
5. Copia l'ID del database (lo useremo dopo)

## Passo 5: Creare le collezioni

### Collezione "users"
1. Nel database appena creato, clicca su "Create Collection"
2. Nome: "users"
3. Permissions: 
   - Read: `role:all`
   - Write: `role:all`
   - Delete: `role:all`
4. Clicca su "Create"

### Collezione "products"
1. Clicca su "Create Collection"
2. Nome: "products"
3. Permissions:
   - Read: `role:all`
   - Write: `role:all`
   - Delete: `role:all`
4. Clicca su "Create"
5. Aggiungi i seguenti attributi:
   - `name` (String, Required)
   - `price` (Number, Required)
   - `description` (String, Required)
   - `createdBy` (String, Required)

### Collezione "customers"
1. Clicca su "Create Collection"
2. Nome: "customers"
3. Permissions:
   - Read: `role:all`
   - Write: `role:all`
   - Delete: `role:all`
4. Clicca su "Create"
5. Aggiungi i seguenti attributi:
   - `name` (String, Required)
   - `email` (String, Required)
   - `phone` (String, Optional)
   - `address` (String, Optional)

### Collezione "orders"
1. Clicca su "Create Collection"
2. Nome: "orders"
3. Permissions:
   - Read: `role:all`
   - Write: `role:all`
   - Delete: `role:all`
4. Clicca su "Create"
5. Aggiungi i seguenti attributi:
   - `customerId` (String, Required)
   - `products` (String[], Required)
   - `total` (Number, Required)
   - `status` (String, Required)
   - `orderDate` (DateTime, Required)

## Passo 6: Configurare il progetto React

1. Apri il file `src/lib/appwrite.ts`
2. Sostituisci `YOUR_PROJECT_ID` con il tuo Project ID
3. Sostituisci `YOUR_DATABASE_ID` con l'ID del tuo database

```typescript
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('IL_TUO_PROJECT_ID'); // Sostituisci qui

export const DATABASE_ID = 'IL_TUO_DATABASE_ID'; // Sostituisci qui
```

## Passo 7: Testare l'integrazione

1. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```

2. Apri il browser su `http://localhost:5173`

3. Per testare l'esempio Appwrite, importa il componente `AppwriteExample` nel tuo `App.tsx`:

```typescript
import AppwriteExample from './examples/AppwriteExample';

// Nel tuo componente App
<AppwriteExample />
```

## Struttura delle cartelle create

```
src/
├── lib/
│   └── appwrite.ts          # Configurazione Appwrite
├── hooks/
│   └── useAppwriteAuth.ts   # Hook per l'autenticazione
└── examples/
    └── AppwriteExample.tsx  # Esempio di utilizzo
```

## Funzionalità implementate

- ✅ Autenticazione (login/registrazione/logout)
- ✅ Gestione utenti
- ✅ Operazioni CRUD sui prodotti
- ✅ Hook personalizzato per l'auth
- ✅ Servizi per il database
- ✅ Gestione errori
- ✅ TypeScript support

## Prossimi passi

1. Personalizza le collezioni secondo le tue esigenze
2. Aggiungi validazioni sui dati
3. Implementa la gestione degli ordini
4. Aggiungi funzionalità di ricerca e filtri
5. Implementa il sistema di notifiche

## Note importanti

- Le API Keys sono sensibili, non condividerle mai
- Per la produzione, usa variabili d'ambiente
- Appwrite ha un piano gratuito generoso per iniziare
- Puoi ospitare Appwrite anche in self-hosted se necessario

## Supporto

- [Documentazione Appwrite](https://appwrite.io/docs)
- [SDK JavaScript](https://appwrite.io/docs/references/cloud/client-web)
- [Community Appwrite](https://appwrite.io/discord) 