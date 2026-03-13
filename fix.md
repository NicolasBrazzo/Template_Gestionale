# Fix List — Massimizzare il voto

## Critici (abbassano direttamente il voto)

- [x] **Validazione stato consegna lato server** — in `server/controllers/deliveries.controller.js` (POST e PUT) aggiungere un controllo che `status` sia uno di: `da_ritirare`, `in_deposito`, `in_consegna`, `consegnato`, `in_giacenza`. Restituire 400 se non valido.

- [x] **Unicità email utente** — in `server/controllers/users.controllers.js` (POST) chiamare `findUserByEmail(email)` prima di `createNewUser`. Se esiste già, restituire 409.

## Medi (migliorano la qualità percepita)

- [ ] **`delivery_date` opzionale** — in `server/controllers/deliveries.controller.js` (POST) rimuovere `delivery_date` dalla lista dei campi obbligatori. Una consegna `da_ritirare` non ha ancora una data di consegna.

- [ ] **Propagazione errori nei services** — in `client/src/services/clientsService.js`, `deliveriesService.js`, `userService.js` sostituire `throw new Error("Errore generico...")` con `throw new Error(err.message)` per mostrare all'utente il messaggio specifico dal server.

## Pulizia del codice (organizzazione e chiarezza)

- [ ] **Rimuovere dipendenze inutilizzate** — da `server/package.json` rimuovere `mysql2` e `sql2` (residui, non usati).

- [ ] **Rimuovere `console.log` di debug** — nei controller (`clients.controller.js`, `deliveries.controller.js`, `users.controllers.js`) e nei services (`deliveriesService.js`, `userService.js`).

- [ ] **Rimuovere o correggere `server/utils/generateToken.js`** — usa sintassi ES module (`export`) in un progetto CommonJS, è inutilizzato e broken.

- [ ] **Rimuovere `client/src/api/auth.api.js`** — definito ma mai utilizzato, il Context usa direttamente `api`.

## Deployment (15 punti separati)

- [ ] **Deployare il backend** su un servizio pubblico (es. Render, Railway).

- [ ] **Deployare il frontend** su un servizio pubblico (es. Vercel, Netlify).

- [ ] **Aggiornare le env variables** — `VITE_API_URL` con l'URL del backend deployato, `FRONTEND_URL` nel server con l'URL del frontend deployato.

- [ ] **URL con nome e cognome** — assicurarsi che l'URL dell'app contenga nome e cognome come richiesto dalla traccia.
