# Struttura del Database

Backend dati: **Supabase (PostgreSQL)**. Lo schema reale vive su Supabase; questo
file è la documentazione leggibile (per umani e AI). Il file affiancato
[`schema.sql`](./schema.sql) è la fonte di verità tecnica/ricreabile.

> ⚠️ Documentazione mantenuta a mano. Dopo ogni modifica allo schema su Supabase,
> aggiornare **sia** questo file **sia** `schema.sql`.

Convenzione nomi tabella: prefisso `ECE_`.

---

## Diagramma relazioni

```
ECE_Users        (autenticazione / utenti del gestionale)

ECE_Clients ──1──< ECE_Deliveries
   (id)              (client_id → ECE_Clients.id)
```

- Un **cliente** può avere molte **consegne**.
- Una **consegna** appartiene a un solo cliente (`client_id`).

---

## Tabella: `ECE_Users`

Utenti che accedono al gestionale. La lista utenti espone solo `id, email, isAdmin`
(la `password` non viene mai restituita al client).

| Colonna    | Tipo         | Null | Default            | Note                                              |
| ---------- | ------------ | ---- | ------------------ | ------------------------------------------------- |
| `id`       | uuid         | NO   | `gen_random_uuid()`| Primary key                                       |
| `email`    | text         | NO   | —                  | Univoca. Usata per login e lookup                 |
| `password` | text         | NO   | —                  | Hash bcrypt — **mai** in chiaro, mai esposta      |
| `isAdmin`  | boolean      | NO   | `false`            | Flag privilegi amministratore                     |

**Vincoli**
- `email` UNIQUE.

**Validazione applicativa**
- `email`: formato email valido.
- `password` (prima dell'hash): min 6 caratteri, almeno 1 maiuscola, 1 numero, 1 carattere speciale.

---

## Tabella: `ECE_Clients`

Anagrafica clienti.

| Colonna     | Tipo | Null | Default             | Note                          |
| ----------- | ---- | ---- | ------------------- | ----------------------------- |
| `id`        | uuid | NO   | `gen_random_uuid()` | Primary key                   |
| `name`      | text | NO   | —                   | Ragione sociale / nominativo  |
| `via`       | text | SÌ   | —                   | Indirizzo (via e civico)      |
| `comune`    | text | SÌ   | —                   | Comune                        |
| `provincia` | text | SÌ   | —                   | Provincia (sigla)             |
| `phone`     | text | SÌ   | —                   | Telefono                      |
| `email`     | text | SÌ   | —                   | Email del cliente             |
| `note`      | text | SÌ   | —                   | Note libere                   |

**Vincoli**
- `email` consigliata UNIQUE (il model fa lookup per email: `findClientByEmail`).

**Validazione applicativa**
- `name`: min 2 caratteri, solo lettere/spazi/apostrofi/trattini.
- `phone`: numero italiano, con o senza prefisso `+39`, 9–10 cifre nazionali.
- `email`: formato email valido.

---

## Tabella: `ECE_Deliveries`

Consegne/spedizioni associate ai clienti.

| Colonna           | Tipo | Null | Default             | Note                                                   |
| ----------------- | ---- | ---- | ------------------- | ------------------------------------------------------ |
| `id`              | uuid | NO   | `gen_random_uuid()` | Primary key                                            |
| `client_id`       | uuid | NO   | —                   | FK → `ECE_Clients.id`                                   |
| `collection_date` | date | NO   | —                   | Data di ritiro                                         |
| `delivery_date`   | date | SÌ   | —                   | Data di consegna (può non essere ancora nota)          |
| `delivery_key`    | text | NO   | —                   | Codice tracciamento, generato lato app (base36)        |
| `status`          | text | NO   | `'da_ritirare'`     | Stato consegna — vedi enum sotto                        |

**Stati validi (`status`)** — definiti in `server/controllers/deliveries.controller.js`:

| Valore         | Significato   |
| -------------- | ------------- |
| `da_ritirare`  | Da ritirare   |
| `in_deposito`  | In deposito   |
| `in_consegna`  | In consegna   |
| `consegnato`   | Consegnato    |
| `in_giacenza`  | In giacenza   |

**Vincoli**
- `client_id` FOREIGN KEY → `ECE_Clients(id)`.
- `delivery_key` consigliato UNIQUE (lookup pubblico di tracciamento per `delivery_key` + `collection_date`).
- `status` consigliato come `CHECK` sull'enum sopra (oppure tipo ENUM Postgres).

**Indici consigliati**
- `client_id` (filtro consegne per cliente).
- `status` (filtro consegne per stato).
- `(delivery_key, collection_date)` (tracciamento pubblico).
