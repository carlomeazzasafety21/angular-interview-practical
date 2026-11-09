# Prova pratica Angular: Helpdesk

Hai circa 3 ore (massimo 4). Costruisci da zero un'applicazione Angular per gestire i ticket di un helpdesk, usando le API già pronte nel `mock-server`.

## Come iniziare

1. Apri un terminale in `mock-server` e lancia `npm start` (le dipendenze sono già installate). Il server ascolta su `http://localhost:3000`.
2. La documentazione degli endpoint è in `mock-server/README.md`.
3. Crea il progetto Angular fuori da `mock-server`, nella cartella `C:\Prova\`.
4. Utente di prova: `mario.rossi` / `password`.

Sei libero di scegliere struttura delle cartelle, libreria UI (Angular Material, PrimeNG, solo CSS...), gestione dello stato e uso di librerie aggiuntive. Usa l'ultima versione stabile di Angular. Puoi consultare documentazione e internet.

## Requisiti obbligatori

1. **Login.** Form di accesso, token salvato e inviato su tutte le chiamate, logout. Se il server risponde `401` l'utente torna al login.
2. **Lista ticket.** Paginazione lato server, filtri per stato e priorità, ricerca testuale.
3. **Dettaglio ticket.** Dati del ticket, elenco dei commenti e aggiunta di un commento.
4. **Creazione e modifica.** Form con validazione lato client. Gli errori per campo che arrivano dal server (`400`) devono comparire sul campo giusto.
5. **Cambio stato.** Dal dettaglio. Se il server rifiuta il passaggio (`422`) mostra il messaggio all'utente.
6. **Stati dell'interfaccia.** Caricamento, lista vuota ed errore devono essere visibili e comprensibili.

## Facoltativo

Fai queste cose solo se ti avanza tempo, e solo dopo aver chiuso i requisiti obbligatori:

- filtri e pagina nell'URL, in modo che ricaricando la pagina si resti dove si era;
- ricerca con debounce;
- protezione delle pagine riservate agli utenti autenticati;
- una pagina con le statistiche da `/api/stats`, che a volte fallisce: prevedi un modo di riprovare;
- uno o due test su logica che può rompersi;
- un breve `README.md` con le scelte fatte e cosa faresti con più tempo.

## Come lavorare

- Non serve completare tutto: conta più un'app che funziona su meno requisiti che molte funzioni a metà.
- Se un punto non è chiaro, fai una scelta ragionevole e annotala. Puoi anche chiedere.
- Alla fine mostrerai l'applicazione e discuteremo insieme le scelte che hai fatto. Potremo chiederti di modificare qualcosa dal vivo.
