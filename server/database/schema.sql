-- =============================================================================
-- Schema del database — Template Gestionale (Supabase / PostgreSQL)
-- =============================================================================
-- Fonte di verità tecnica/ricreabile. La documentazione leggibile è in
-- schema.md (mantenere allineati i due file dopo ogni modifica).
--
-- NOTA: questo file è ricostruito dal codice applicativo (models, controllers,
-- validators), NON esportato da Supabase. Verificare default, nullability e
-- vincoli reali sulla dashboard ed eventualmente correggere qui.
-- =============================================================================

-- Estensione per gen_random_uuid() (di norma già attiva su Supabase)
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Tabella: ECE_Users
-- -----------------------------------------------------------------------------
create table if not exists "ECE_Users" (
    "id"        uuid        primary key default gen_random_uuid(),
    "email"     text        not null unique,
    "password"  text        not null,           -- hash bcrypt, mai in chiaro
    "isAdmin"   boolean     not null default false
);

-- -----------------------------------------------------------------------------
-- Tabella: ECE_Clients
-- -----------------------------------------------------------------------------
create table if not exists "ECE_Clients" (
    "id"        uuid    primary key default gen_random_uuid(),
    "name"      text    not null,
    "via"       text,
    "comune"    text,
    "provincia" text,
    "phone"     text,
    "email"     text    unique,
    "note"      text
);

-- -----------------------------------------------------------------------------
-- Tabella: ECE_Deliveries
-- -----------------------------------------------------------------------------
create table if not exists "ECE_Deliveries" (
    "id"              uuid    primary key default gen_random_uuid(),
    "client_id"       uuid    not null references "ECE_Clients" ("id"),
    "collection_date" date    not null,
    "delivery_date"   date,
    "delivery_key"    text    not null,
    "status"          text    not null default 'da_ritirare'
        check ("status" in (
            'da_ritirare',
            'in_deposito',
            'in_consegna',
            'consegnato',
            'in_giacenza'
        ))
);

-- Indici
create index if not exists "idx_deliveries_client_id" on "ECE_Deliveries" ("client_id");
create index if not exists "idx_deliveries_status"    on "ECE_Deliveries" ("status");
create unique index if not exists "uq_deliveries_key_collection"
    on "ECE_Deliveries" ("delivery_key", "collection_date");
