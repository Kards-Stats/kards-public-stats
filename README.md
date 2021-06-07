# Kards Public Stats

Used as a Proof of Concept (POC) for what could be done with the kards API and whether it would be feasable to access it using heroku or other hosting services.

This uses a package called steam-user to login as a steam user to access the kards api, and gather what limited information we can about players.

front end can be found at kards-public-stats-react

## Setting up

Add a .env file to the root of the project with the following fields (replace <SECRET> with the value)

```
log_level=trace
SECRET_KEY=<SECRET>
NODE_ENV=development
steam_username=<SECRET>
steam_password=<SECRET>
mdb_cluster_url=<SECRET>
mdb_username=<SECRET>
mdb_password=<SECRET>
mdb_database=<SECRET>
kards_drift_api_key=1939-kards-5dcba429f:Kards 1.1.4835
kards_hostname=kards.live.1939api.com
kards_app_id=544810
kards_player_id=<SECRET>
```

Then run `npm run debug`

Running `npm start` wont pick up the .env variables and environment variables will have to be set manually.
