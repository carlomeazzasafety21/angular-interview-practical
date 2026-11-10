# Checklist di revisione

Per ogni voce cerca il segnale atteso e gli anti-pattern. Cita sempre `path:riga`. Le voci seguono le sei funzionalità del brief, poi gli extra e la qualità trasversale.

## 1. Login e sessione

Segnale atteso:
- Il token vive in un solo posto (service o store), non sparso nei componenti.
- Un interceptor lo aggiunge alle chiamate API, con login escluso.
- Un 401 sulle chiamate autenticate fa logout e porta al login. Un 401 del login resta un errore del form.
- Il logout pulisce token e stato utente.

Anti-pattern:
- `Authorization` impostato a mano in ogni service.
- Un 401 del login che scatena il logout, con redirect in loop.
- Token in una variabile globale o in `window`.

Dove guardare: file con `HttpInterceptorFn`/`HTTP_INTERCEPTORS`, `app.config.ts`, il service di auth, il form di login.

## 2. Lista ticket

Segnale atteso:
- Paginazione lato server con `page` e `pageSize` inviati al mock.
- Filtri per stato e priorità, ricerca testuale.
- Cambio filtro o ricerca riporta la pagina a 1.
- Richieste sovrapposte gestite (`switchMap`, annullamento, token di richiesta o `resource`/`rxResource`). L'ultima risposta vince.
- Pagina oltre il totale gestita senza mostrare "nessun risultato" a torto.

Anti-pattern:
- Filtri applicati in memoria su una sola pagina.
- `subscribe` dentro `subscribe`.
- Una richiesta per ogni tasto premuto, senza debounce.
- Un contatore di pagine calcolato male quando `total` è zero.

## 3. Dettaglio e commenti

Segnale atteso:
- Ticket e commenti si caricano con stati di caricamento ed errore distinti.
- Un commento aggiunto compare senza ricaricare la pagina.
- Il testo di soli spazi non viene inviato, o l'utente vede perché.
- Il nome di categoria e utente appare al posto dell'id, con un comportamento sensato se i lookup falliscono.

Anti-pattern:
- Il click su "Invia" non fa niente e non spiega.
- Un errore dei commenti che nasconde il ticket.

## 4. Creazione e modifica

Segnale atteso:
- Reactive form tipizzati, validatori coerenti con il contratto: titolo 5-100 dopo il trim, descrizione obbligatoria.
- Gli `errors` del 400 finiscono sul campo giusto. Un errore senza campo compare in un punto visibile.
- In modifica il form mostra un caricamento finché non arrivano i dati. Il submit prima del caricamento non è possibile.
- Un ticket `CLOSED` non si modifica, e il 409 si traduce in un messaggio.
- Doppio click su "Salva" non crea due richieste.

Anti-pattern:
- Form senza `[formGroup]` che usa `(ngSubmit)`: la pagina si ricarica.
- Errori del server solo in un toast generico.
- Validazione solo lato server, o solo lato client.
- `any` nei valori del form.

## 5. Cambio stato

Segnale atteso:
- Il cambio parte dal dettaglio e l'UI si aggiorna con la risposta.
- Il 422 mostra il `message` del server. Se il ticket è cambiato altrove, l'UI si riallinea.
- Se il candidato offre solo le transizioni valide, annota se le ha duplicate dal contratto o le ha lette da una sola costante.

Anti-pattern:
- Stato aggiornato in locale prima della risposta, senza rollback.
- Pulsanti attivi durante la richiesta.

Il 422 si vede dalla UI solo con due schede o con tutti gli stati offerti. Non contarne l'assenza dalla demo come difetto.

## 6. Stati dell'interfaccia

Segnale atteso:
- Caricamento, lista vuota ed errore sono tre stati distinti e visibili in lista, dettaglio e statistiche.
- L'errore offre un modo di riprovare dove ha senso.

Anti-pattern:
- Spinner che non si ferma dopo un errore.
- Lista vuota e errore mostrati allo stesso modo.
- Errori ingoiati: `catchError(() => of([]))` senza segnale all'utente.

## 7. Extra del brief (non dovuti)

Valutali solo se presenti e funzionanti.
- Filtri e pagina nell'URL: ricaricare mantiene lo stato, il tasto Indietro funziona.
- Debounce sulla ricerca.
- Guard sulle rotte riservate.
- Statistiche con retry: il mock fallisce una chiamata su quattro. Cerca un retry automatico limitato o un pulsante "Riprova".
- Test: guarda se coprono logica che può rompersi (mappatura errori, calcoli, interazioni tra stati) o se servono a far numero. Un test su un branch di abilitazione o su un mapping statico non vale.
- README: scelte motivate e cosa cambierebbe con più tempo.

## 8. Qualità trasversale

- **Angular moderno:** componenti standalone, `inject()`, signal o RxJS usati in modo coerente, control flow `@if/@for`, compatibilità con OnPush/zoneless (nessuna mutazione invisibile a Angular).
- **Struttura:** componenti separati dai service, modelli tipizzati, nessuna logica HTTP nei template.
- **Tipi:** `any` esplicito o implicito, cast `as` per far tacere il compilatore, interfacce che rispecchiano il contratto.
- **Stato mutabile accumulato:** `push` su array di istanza in metodi richiamabili più volte, che duplica i dati alla seconda chiamata.
- **Memory leak:** `subscribe` senza `takeUntilDestroyed` o `async`/`toSignal` dove la sottoscrizione sopravvive al componente.
- **Stringhe:** testi sparsi nei template o costanti centralizzate. In Titano ogni testo passa dall'i18n.
- **Lingua del codice:** identificatori e commenti in inglese.
- **Segnali d'allarme della guida:** codice che il candidato non sa spiegare, `any` ovunque, subscribe annidati, errori ignorati senza commento.

## 9. Dipendenze e pulizia

- `package.json`: librerie UI e di stato scelte, motivate o gonfie. Script `pre/postinstall`.
- File lasciati dentro il progetto: credenziali, token reali, `.env`, cartelle del browser. Segnalali senza copiarne il contenuto nel report.
