# Daedalus
Empty Epsilon extension.

This project extends the [Empty Epsilon](http://daid.github.io/EmptyEpsilon/) spaceship bridge simulator game,
by simulating the spaceship's need for [Maintenance, Repair and Operations](https://en.wikipedia.org/wiki/Maintenance,_repair_and_operations) during the game.

## Core concept
Daedalus replaces the singular auto-repair screen with a simulation of the ship's several sub-systems engineering interfaces. 

## developer documentation
how to build and test:
 - clone the repository
 - in the cloned folder, run `yarn install`
 
how to run tests:
 - (do once) in the project's root open the file `test-config.json`
   - change `runServer` and `killServer` to commands that can start and stop an empty-epsilon game server with open http api and one player ship ready.
   - make sure `serverAddress` correctly describes the server's http api address
 - run `yarn test` to build and test the code

how to debug:
 1. run `yarn debug`. the server will start and halt on the first line of code
 2. in local chrome browser, go to URL `chrome://inspect` . a debugger console will open.
 3. resume execution from the debugger console

how to start server:
 1. run `yarn start`. the server will start. the main entry point is `main.js` file at the root of the project.

how to operate fugazi:
 1. start the server, according to either `start` or `debug` instructions above.
 2. in local chrome browser, go to URL `http://localhost:3333/`. the Fugazi web client will open.
 3. in the Fugazi web client run
 4. `load module from "http://localhost:3333/session.json"` to load session commands
  - `login` will now log in a user
  - `whoami` will now display session details
 5. `load module from "http://localhost:3333/excalibur.json"` to load excalibur commands
  - `open` will now open an entry
