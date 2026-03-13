# TODO — Sistema di Verifica degli Input

Analisi completa di tutti i controller, middleware, modelli e utility del server.
Ogni punto indica una vulnerabilità o lacuna da colmare.

---

## GLOBALE / SERVER.JS

- [ ] **Helmet** — Aggiungere `helmet` per impostare header HTTP di sicurezza (CSP, X-Frame-Options, HSTS, ecc.)
- [ ] **Rate Limiting globale** — Installare `express-rate-limit` e applicare un limite globale (es. 100 req/15min per IP) su tutte le route
- [ ] **Limite dimensione body** — Impostare `express.json({ limit: '10kb' })` per prevenire attacchi DoS via payload enormi
- [ ] **Content-Type enforcement** — Rifiutare richieste che non hanno `Content-Type: application/json` sulle route POST/PUT
- [ ] **Sanitizzazione XSS globale** — Aggiungere middleware `xss-clean` o `express-mongo-sanitize` per rimuovere tag HTML/script da tutti gli input stringa prima che raggiungano i controller

---

## MIDDLEWARE AUTH (`middleware/auth.js`)

- [ ] **Validazione formato token** — Verificare che il token sia una stringa non vuota prima di passarla a `jwt.verify`; rifiutare token con caratteri non validi (es. lunghezza anomala > 2048 chars)
- [ ] **Gestione errori JWT specifica** — Distinguere `TokenExpiredError` da `JsonWebTokenError` e restituire messaggi diversi (es. 401 con `"Token expired"` vs `"Invalid token"`)

---

## AUTH CONTROLLER (`controllers/auth.controller.js`)

### POST /auth/login

- [ ] **Validazione tipo input** — Verificare che `email` e `password` siano stringhe (non oggetti/array che passano il check `!email`)
- [ ] **Lunghezza massima** — Rifiutare email > 254 chars e password > 128 chars (bcrypt trunca a 72 byte; password enormi possono causare DoS)
- [ ] **Validazione formato email** — Applicare `validateEmail()` già esistente anche nel login, non solo nella registrazione
- [ ] **Trim input** — Fare `.trim()` su email prima del lookup nel DB
- [ ] **Rate limiting dedicato** — Applicare un rate limit aggressivo sul login (es. 10 tentativi/15min per IP) per prevenire brute force
- [ ] **Protezione timing attack** — Se l'utente non esiste, eseguire comunque un `bcrypt.compare` dummy per evitare che il tempo di risposta riveli l'esistenza dell'account

---

## CLIENTS CONTROLLER (`controllers/clients.controller.js`)

### GET /clients/:id

- [ ] **Validazione `:id`** — Verificare che `id` sia un intero positivo (o UUID valido) prima di interrogare il DB; rifiutare con 400 se non lo è

### POST /clients/ — Creazione

- [ ] **Lunghezza massima campi** — Aggiungere limiti: `name` ≤ 100 chars, `via` ≤ 150 chars, `comune` ≤ 100 chars, `provincia` ≤ 50 chars, `note` ≤ 500 chars
- [ ] **Validazione `provincia`** — Accettare solo i codici provincia italiani a 2 lettere (es. regex `/^[A-Z]{2}$/i`) oppure una whitelist delle 107 province
- [ ] **Validazione `name`** — Accettare solo lettere, spazi, apostrofi e trattini (no numeri, no HTML, no script)
- [ ] **Validazione `via`** — Accettare solo caratteri alfanumerici, spazi, virgole, punti e trattini; bloccare caratteri speciali HTML
- [ ] **Sanitizzazione `note`** — Fare strip di tag HTML/script dal campo note (campo libero ma non deve accettare codice)
- [ ] **Normalizzazione email** — Applicare `.toLowerCase().trim()` prima della validazione e del salvataggio
- [ ] **Tipo dei campi** — Verificare esplicitamente che tutti i campi stringa siano di tipo `string` (non `number`, `object`, ecc.)

### PUT /clients/:id — Aggiornamento

- [ ] **Validazione `:id`** — Stessa validazione del GET/:id
- [ ] **Verifica esistenza client** — Controllare che il client con quell'id esista prima di aggiornare; rispondere 404 se non trovato
- [ ] **Almeno un campo presente** — Rifiutare la richiesta con 400 se il body è completamente vuoto
- [ ] **Lunghezza massima campi** — Stessi limiti del POST
- [ ] **Validazione `provincia`** — Stessa del POST
- [ ] **Sanitizzazione `note`** — Stessa del POST
- [ ] **Unicità email** — Se viene aggiornata la email, verificare che non sia già usata da un *altro* client (non se stessa)
- [ ] **Tipo dei campi** — Stessa del POST

### DELETE /clients/:id

- [ ] **Validazione `:id`** — Stessa validazione degli altri endpoint

---

## DELIVERIES CONTROLLER (`controllers/deliveries.controller.js`)

### GET /deliveries/ — Lista con filtri

- [ ] **Validazione query `status`** — Accettare solo valori dell'enum consentito (es. `"pending"`, `"in_transit"`, `"delivered"`, `"failed"`); rifiutare con 400 valori arbitrari
- [ ] **Validazione query `id_client`** — Verificare che sia un intero positivo o UUID valido

### GET /deliveries/track — Endpoint PUBBLICO

- [ ] **Rate limiting aggressivo** — Essendo pubblico (no auth), limitare a es. 20 richieste/15min per IP per prevenire enumerazione delle chiavi
- [ ] **Validazione formato `delivery_key`** — Accettare solo caratteri alfanumerici, lunghezza fissa attesa (es. 13 chars da `Math.random().toString(36).substring(2,15)`); regex `/^[a-z0-9]{10,20}$/`
- [ ] **Validazione formato `collection_date`** — Verificare formato ISO 8601 (`YYYY-MM-DD`) con regex e/o `Date` parsing; rifiutare date non valide

### GET /deliveries/:id

- [ ] **Validazione `:id`** — Stessa degli altri

### POST /deliveries/ — Creazione

- [ ] **Validazione `client_id`** — Verificare che sia intero/UUID valido E che il client esista realmente nel DB (lookup in `ECE_Clients`); rispondere 404 se non trovato
- [ ] **Validazione formato `collection_date`** — ISO 8601 obbligatorio (`YYYY-MM-DD`); rifiutare stringhe arbitrarie
- [ ] **Validazione formato `delivery_date`** — ISO 8601 obbligatorio
- [ ] **Coerenza date** — `delivery_date` deve essere >= `collection_date`; rifiutare con 400 se la data di consegna è antecedente al ritiro
- [ ] **Validazione `status`** — Accettare solo valori dell'enum consentito; rifiutare valori arbitrari
- [ ] **`delivery_key` crittograficamente sicuro** — Sostituire `Math.random()` con `crypto.randomBytes()` (nativo Node.js) per generare chiavi non predicibili
- [ ] **Retry su collisione `delivery_key`** — La logica attuale restituisce 409 in caso di collisione; cambiare con un retry automatico (max 3 tentativi) prima di fallire

### PUT /deliveries/:id — Aggiornamento

- [ ] **Validazione `:id`** — Stessa degli altri
- [ ] **Verifica esistenza delivery** — Controllare che la delivery esista prima di aggiornare; rispondere 404 se non trovata
- [ ] **Almeno un campo presente** — Rifiutare body completamente vuoto con 400
- [ ] **Validazione `status`** — Stessa del POST
- [ ] **Validazione date** — Stessa del POST (formato ISO + coerenza logica)
- [ ] **Validazione `client_id`** — Se presente, verificare che il client esista

### DELETE /deliveries/:id

- [ ] **Validazione `:id`** — Stessa degli altri

---

## USERS CONTROLLER (`controllers/users.controllers.js`)

### GET /users/:id

- [ ] **Validazione `:id`** — Verificare che sia intero positivo o UUID valido

### POST /users/ — Creazione

- [ ] **Unicità email** — Verificare che l'email non sia già usata da un altro utente prima di inserire nel DB (attualmente non c'è questo controllo, si ottiene un errore generico dal DB)
- [ ] **Lunghezza massima password** — Rifiutare password > 128 chars (bcrypt tronca a 72 byte; password enormi causano DoS sulla CPU)
- [ ] **Lunghezza minima password** — Aumentare il minimo da 6 a 8 caratteri (standard di sicurezza moderno)
- [ ] **Normalizzazione email** — `.toLowerCase().trim()` prima di validare e salvare
- [ ] **Tipo `isAdmin`** — Verificare che sia esattamente `boolean` (il controllo `typeof isAdmin !== "boolean"` c'è già, ma aggiungere protezione contro `"true"` come stringa)

### PUT /users/:id — Aggiornamento

- [ ] **Validazione `:id`** — Stessa degli altri
- [ ] **Verifica esistenza utente** — Controllare che l'utente esista prima di aggiornare; rispondere 404 se non trovato
- [ ] **Unicità email in aggiornamento** — Verificare che la nuova email non sia già usata da un *altro* utente
- [ ] **Lunghezza massima password** — Stessa del POST (> 128 chars → 400)
- [ ] **Protezione auto-demozione** — Impedire che un admin si tolga i privilegi da admin (o che un admin elimini se stesso), per evitare di rimanere senza admin nel sistema
- [ ] **Protezione ultimo admin** — Prima di rimuovere `isAdmin` a un utente, verificare che esista almeno un altro admin attivo nel sistema

### DELETE /users/:id

- [ ] **Validazione `:id`** — Stessa degli altri
- [ ] **Protezione auto-eliminazione** — Impedire che un admin elimini il proprio account
- [ ] **Protezione ultimo admin** — Non consentire l'eliminazione se l'utente da eliminare è l'unico admin rimasto

---

## UTILITY DI VALIDAZIONE (`server/utils/`)

### `validateEmail.js`

- [ ] **Lunghezza massima** — Aggiungere check `email.length <= 254` (limite RFC 5321)
- [ ] **Regex più robusta** — Migliorare la regex per bloccare casi edge: email che iniziano/finiscono con `.`, doppi `..`, TLD di almeno 2 caratteri

### `validatePhoneNumber.js`

- [ ] **Solo numeri italiani** — Valutare se restringere obbligatoriamente al prefisso `+39` invece di renderlo opzionale, in base ai requisiti business

### `validatePassword.js`

- [ ] **Lunghezza minima** — Portare da 6 a 8 caratteri
- [ ] **Lunghezza massima** — Aggiungere check `password.length <= 128`

### Nuove utility da creare

- [ ] **`validateId.js`** — Funzione riutilizzabile per validare ID numerici interi positivi (o UUID) da usare in tutti i `req.params.id`
- [ ] **`validateDate.js`** — Funzione per validare formato ISO 8601 e opzionalmente ordine logico tra due date
- [ ] **`validateStatus.js`** — Funzione/costante con l'enum degli stati consentiti per le deliveries
- [ ] **`sanitizeString.js`** — Funzione per strippare tag HTML e caratteri di controllo da input testuali liberi

---

## ORDINE DI PRIORITÀ CONSIGLIATO

1. **[CRITICO]** Rate limiting su `/auth/login` e `/deliveries/track` (pubblico)
2. **[CRITICO]** Lunghezza massima password (DoS bcrypt)
3. **[CRITICO]** `delivery_key` con `crypto.randomBytes()` invece di `Math.random()`
4. **[ALTO]** Validazione `:id` params in tutti gli endpoint
5. **[ALTO]** Validazione `status` enum nelle deliveries
6. **[ALTO]** Validazione e coerenza logica delle date
7. **[ALTO]** Verifica esistenza `client_id` prima di creare una delivery
8. **[ALTO]** Unicità email nella creazione/aggiornamento utenti
9. **[MEDIO]** Helmet + security headers
10. **[MEDIO]** Sanitizzazione XSS su campi testo liberi
11. **[MEDIO]** Protezione auto-eliminazione / ultimo admin
12. **[BASSO]** Miglioramento regex email e telefono
13. **[BASSO]** Content-Type enforcement