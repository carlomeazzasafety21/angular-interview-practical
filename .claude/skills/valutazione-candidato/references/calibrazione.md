# Calibrazione

Riferimento: sviluppatore Angular con 3-4 anni di esperienza che entra nel team Titano. Le aree e i pesi stanno in `GUIDA-INTERVISTATORE.md`. Qui ci sono le ancore dei punteggi, le soglie e il collegamento con il lavoro in Titano.

## Scala

| Punteggio | Significato |
| --- | --- |
| 1 | Sotto le attese per un mid-level. Mancano basi o il codice non funziona. |
| 2 | Parziale. Funziona nel caso felice, ma i casi di errore o le scelte di struttura mostrano lacune. |
| 3 | Solido, come ci si aspetta da 3-4 anni di esperienza. Funziona, gestisce gli errori principali, il codice si legge e si spiega. |
| 4 | Sopra le attese. Scelte motivate, casi limite coperti, extra fatti bene. Non serve fare tutto per prendere 4. |

Il 3 è il traguardo. Non assegnare 4 per quantità: un'area con molte funzioni a metà non supera il 2.

## Ancore per area

### Funzionalità obbligatorie
- **1:** login o lista non funzionano. Build rotta senza una via di recupero.
- **2:** funzionano login e lista. Dettaglio, form o cambio stato mancano o si rompono sui casi di errore.
- **3:** le sei funzionalità del brief funzionano nella demo, con stati di caricamento, vuoto ed errore.
- **4:** come 3, più almeno due extra del brief funzionanti, per esempio URL come fonte di verità e retry sulle statistiche.

### Angular moderno
- **1:** `NgModule` e pattern pre-standalone senza motivo. Template con logica pesante.
- **2:** standalone ma `constructor` ovunque, mix di signal e RxJS senza criterio, `*ngIf/*ngFor`.
- **3:** standalone, `inject()`, `@if/@for`, un criterio chiaro tra signal e RxJS. Il codice funzionerebbe con OnPush.
- **4:** signal per lo stato locale, RxJS dove serve il flusso, `input()`/`output()`, `takeUntilDestroyed` o `toSignal`, nessuna mutazione invisibile.

### Gestione HTTP ed errori
- **1:** errori non gestiti, `Authorization` incollato a mano, richieste sovrapposte.
- **2:** interceptor presente ma il 401 manca, oppure gli errori si leggono solo in console.
- **3:** interceptor per token e 401. 400, 409, 422 e 500 arrivano all'utente. Le richieste sovrapposte di lista e filtri sono gestite.
- **4:** come 3, con un punto unico che normalizza l'errore del server, un retry sensato e nessun errore ingoiato.

### Form
- **1:** form template-driven senza validazione, o submit che ricarica la pagina.
- **2:** reactive form, ma errori del server solo in un messaggio generico.
- **3:** reactive form tipizzati, validatori coerenti con il contratto e `errors` del 400 sul campo giusto.
- **4:** come 3, più trim, doppio submit impedito, caricamento in modifica gestito, errori non legati a un campo mostrati.

### Struttura e leggibilità
- **1:** tutto nel componente, `any` diffuso.
- **2:** service presenti ma modelli deboli, duplicazioni evidenti.
- **3:** componenti separati dai service, modelli tipizzati, nomi chiari, nessun `any` non motivato.
- **4:** confini netti tra feature e parti condivise, nessuna duplicazione dei contratti, codice che un collega capisce senza spiegazioni.

### Comprensione e comunicazione
Solo dalle note dell'intervistatore.
- **1:** non spiega il proprio codice. Non sa modificarlo dal vivo.
- **2:** spiega il cosa ma non il perché. Esce dalla modifica dal vivo con aiuto continuo.
- **3:** indica la riga giusta per ogni risposta, motiva le scelte, riconosce i limiti.
- **4:** come 3, e propone alternative con i loro compromessi, anticipa le domande della review.

## Soglie di raccomandazione

Sulla media pesata (pesi dalla guida):

| Media | Raccomandazione |
| --- | --- |
| ≥ 3,0 | Procedere |
| 2,5-2,9 | Da approfondire: un secondo colloquio mirato sui gap |
| < 2,5 | Non procedere |

Un segnale d'allarme bloccante abbassa la raccomandazione di un livello. Sono bloccanti:
- codice che il candidato non sa spiegare, in assenza di altri elementi a favore;
- `any` diffuso o errori ignorati sistematicamente;
- consegna che non compila e senza funzionalità verificabili;
- credenziali reali lasciate nel progetto.

Gli altri segnali pesano nel punteggio dell'area, non cambiano la raccomandazione da soli.

## Adattamento a Titano

Il report elenca, per ogni pratica, cosa si osserva nella prova. "Da formare" indica un gap che il team colma in poche settimane. "Strutturale" indica un gap che richiede mesi o un cambio di abitudini.

| Pratica in Titano | Segnale nella prova | Gap |
| --- | --- | --- |
| Errori HTTP gestiti da un interceptor centrale (nessun try/catch per chiamata) | Interceptor con 401 e normalizzazione dell'errore | Strutturale se tutto è nei componenti |
| Signal, `inject()` e `input()` nel codice nuovo, pensati per OnPush e zoneless | Signal per lo stato locale, nessuna mutazione invisibile | Da formare |
| Tipi espliciti ai confini (in Titano i confini federati) | Modelli che rispecchiano il contratto, niente `any` | Strutturale se `any` è diffuso |
| Nessuna dipendenza diretta tra feature, logica condivisa in un service | Feature separate, service condivisi senza importi incrociati | Da formare |
| Test solo su logica che può rompersi | Pochi test, su mappatura errori o calcoli | Da formare |
| Nessuna stringa hardcoded nei template (i18n) | Testi centralizzati o pronti per una chiave | Da formare |
| Codice e commenti in inglese | Identificatori in inglese, anche se la UI è in italiano | Da formare |
| Ambiguità sul contratto del BE: si chiede, non si indovina | Domande all'intervistatore, ipotesi annotate | Strutturale se non chiede mai |
| Griglie dati e form complessi con librerie UI consolidate (Kendo, Material) | Uso corretto della libreria scelta, senza reinventare componenti | Da formare |

Non penalizzare l'assenza di Kendo, Federation o i18n: la prova non li richiede. Cerca i comportamenti che predicono quanto in fretta il candidato li imparerà.
