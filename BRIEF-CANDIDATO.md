# Prova pratica Angular: Helpdesk

Costruisci da zero un'applicazione Angular per gestire i ticket di un helpdesk, usando le API già pronte nel `mock-server`. Siamo curiosi di vedere come ragioni e che codice scrivi.

## Come iniziare

1. Apri un terminale in `mock-server` e lancia `npm start` (le dipendenze sono già installate). Il server ascolta su `http://localhost:3000`.
2. La documentazione degli endpoint è in `mock-server/README.md`.
3. Crea il progetto Angular fuori da `mock-server`, nella cartella `C:\Prova\`.
4. Utente di prova: `mario.rossi` / `password`.

Struttura delle cartelle, libreria UI (Angular Material, PrimeNG, solo CSS...), gestione dello stato e librerie aggiuntive sono scelte tue. Usa l'ultima versione stabile di Angular. Puoi consultare documentazione e internet come faresti al lavoro.

## Cosa ci piacerebbe vedere

1. **Login.** Form di accesso, token salvato e inviato su tutte le chiamate, logout. Se il server risponde `401` l'utente torna al login.
2. **Lista ticket.** Paginazione lato server, filtri per stato e priorità, ricerca testuale.
3. **Dettaglio ticket.** Dati del ticket, elenco dei commenti e aggiunta di un commento.
4. **Creazione e modifica.** Form con validazione lato client. Gli errori per campo che arrivano dal server (`400`) dovrebbero comparire sul campo giusto.
5. **Cambio stato.** Dal dettaglio. Se il server rifiuta il passaggio (`422`), mostra il messaggio all'utente.
6. **Stati dell'interfaccia.** Caricamento, lista vuota ed errore ben visibili e comprensibili.

## Se ti va di andare oltre

Se ti avanza tempo, queste sono idee in più:

- filtri e pagina nell'URL, così ricaricando la pagina si resta dove si era;
- ricerca con debounce;
- protezione delle pagine riservate agli utenti autenticati;
- una pagina con le statistiche da `/api/stats`, che a volte fallisce: pensa a un modo di riprovare;
- uno o due test su logica che può rompersi;
- un breve `README.md` con le scelte fatte e cosa faresti con più tempo.

## Qualche consiglio

- Non serve fare tutto: preferiamo un'app che funziona su meno punti a tante funzioni a metà.
- Se qualcosa non è chiaro, fai la scelta che ti sembra più sensata e annotala. Siamo qui: chiedi pure quando vuoi.
- Alla fine ci mostri l'applicazione e ne parliamo insieme, con calma.
