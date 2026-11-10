# Guida per l'intervistatore (non consegnare al candidato)

## Postazione

Fornita da noi: Node LTS, npm, Angular CLI globale, VS Code, Chrome, Git. Su `C:\Prova\` ci sono `mock-server` (con `npm install` già fatto) e `BRIEF-CANDIDATO.md`. Internet e registry npm raggiungibili, così il candidato può installare la libreria UI che preferisce.

Sull'AI: il brief non ne parla e la scelta resta del candidato. Quello che trova sulla postazione decide cosa può usare (assistenti web dal browser sì; Copilot o altri plugin dell'IDE solo se li installiamo noi). Decidi la configurazione una volta e tienila uguale per tutti.

## Prima di ogni colloquio

- Cancella la cartella del candidato precedente e la cronologia del browser.
- Usa un profilo Chrome pulito, senza password salvate né compilazione automatica: nella prova il form di login è stato precompilato con credenziali reali salvate nel browser.
- Dentro `C:\Prova\mock-server` lancia `npm start`, prova il login e controlla che `http://localhost:3000/docs` si apra. Se hai aggiornato il mock, rilancia `npm install` sulla postazione.
- Controlla che `ng new` funzioni (registry raggiungibile).

## Scaletta (circa 4 ore)

| Minuti | Attività                                                                       |
| ------ | ------------------------------------------------------------------------------ |
| 10     | Presentazione della prova, avvio del server, domande sul brief                 |
| 170    | Sviluppo. A metà, check-in di 5 minuti: chiedi a che punto è, senza dare aiuti |
| 40     | Demo e code review                                                             |

## Domande per la code review

Per ogni risposta chiedi di indicare la riga di codice corrispondente.

- Perché questa struttura di cartelle?
- Dove tieni il token? Cosa succede su un `401`?
- Come arriva l'errore `400` sul campo giusto del form?
- Signal o RxJS, e perché?
- Se l'utente cambia filtro mentre una richiesta è ancora in corso, cosa succede?
- Come testeresti il form?
- Cosa cambieresti per un'app grande o divisa in micro frontend?

Modifica dal vivo (10 minuti, facoltativa): "mostra un messaggio quando il commento è salvato". Si vede subito chi conosce il proprio codice.

## Griglia di valutazione (punteggio da 1 a 4 per area)

| Area                         | Peso | Cosa guardare                                                                                 |
| ---------------------------- | ---- | --------------------------------------------------------------------------------------------- |
| Funzionalità obbligatorie    | 25%  | Quante funzionano davvero nella demo                                                          |
| Angular moderno              | 20%  | Standalone, `inject()`, signal o RxJS usati in modo coerente, control flow `@if/@for`, compatibilità con OnPush/zoneless (signal, nessuna mutazione invisibile) |
| Gestione HTTP ed errori      | 20%  | Interceptor, `401/400/409/422/500` gestiti, niente richieste sovrapposte                      |
| Form                         | 15%  | Reactive form tipizzati, validatori, errori del server sul campo                              |
| Struttura e leggibilità      | 10%  | Componenti separati dai service, tipi espliciti, niente `any`                                 |
| Comprensione e comunicazione | 10%  | Spiega e sa modificare dal vivo il proprio codice                                             |

Segnali d'allarme: codice che non sa spiegare, `any` ovunque, subscribe annidati, errori ignorati senza commento.

## Trappole volute nel mock

- Latenza casuale: chi non gestisce il caricamento se ne accorge.
- `/api/stats` fallisce nel 25% dei casi: serve una gestione dell'errore con retry.
- `409` sulla modifica di un ticket chiuso e `422` sulle transizioni di stato: messaggi che il candidato deve mostrare all'utente.
- Il form è validato anche dal server con errori per campo: la mappatura sul campo giusto è la parte che separa chi ha già fatto form reali.
- Una pagina oltre il totale (`?page=99`) risponde `items: []` con `total > 0`: chi non riporta la pagina a 1 quando cambia un filtro vede "nessun risultato" pur con ticket presenti.

## Note dalla prova a secco

- Il `401` non si vede dalla UI finché la sessione è valida (le sessioni del mock non scadono). Per provocarlo: riavvia il mock con l'app aperta, oppure modifica il token in `localStorage` dagli strumenti del browser.
- Il `422` sul cambio stato non si vede dalla UI se il candidato offre solo le transizioni valide. Per provocarlo servono due schede, oppure un candidato che offre tutti gli stati. Non contarlo come segnale.
- Gli errori `400` per campo sono difficili da vedere dalla UI se la validazione client è completa. Un titolo di soli spazi li provoca, ma solo chi pensa al `trim` lo incontra. Per verificare la mappatura sul campo chiedi di mostrarti il codice.
- Bug facile da incontrare: un form senza `[formGroup]` che usa `(ngSubmit)` ricarica la pagina, perché il submit nativo non viene bloccato. Se capita, guarda come lo diagnostica il candidato.
- Tre limiti tipici di una soluzione lasciata com'è: regole di transizione duplicate nel client, messaggi del server mostrati in inglese, lookup (categorie, utenti) che falliscono in silenzio. Se il candidato li individua da solo è un buon segnale.

- La specifica su `/openapi.json` permette di generare un client tipizzato (per esempio con openapi-generator). È una scelta legittima: discutila in review, senza penalizzarla.

## Dopo il colloquio

Copia il progetto del candidato in uno zip per rivederlo con calma prima della decisione.

Per la revisione, estrai il progetto in `valutazioni/<cognome>-<data>/progetto/` (la cartella è gitignorata) e lancia Claude Code in questo repo con la skill `valutazione-candidato`, allegando le note della demo e della code review. La skill esegue build e test, applica la griglia di questa guida e scrive il report in `valutazioni/<cognome>-<data>/valutazione.md`.
