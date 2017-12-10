# Daedalus
Empty Epsilon extension.

This project extends the [Empty Epsilon](http://daid.github.io/EmptyEpsilon/) spaceship bridge simulator game,
by simulating the spaceship's need for [Maintenance, Repair and Operations](https://en.wikipedia.org/wiki/Maintenance,_repair_and_operations) during the game.

### how to build
We use [yarn](https://yarnpkg.com/en/) to manage this project's lifecycle. Install yarn by running `npm i -g yarn` and then follow the instructions in the [developer documentation](./resources/entries/daedalus-developer.md)
in addition, Copy the files in this project's `lua` directory into empty epsilon's `Contents/Resources/scripts` directory
 
### what to expect
TL;DR : a mess
Daedalus hosts the latest iteration of software written to support a sci-fi LARP we've been working on for a long while now. Its first test-run is due in two weeks, so the current state of the project is a mess (documentation, test coverage and stability etc.) as we sprint towards the minimum viable product that is game-ready. After the test run, I plan to  separately productize the different features while adding features for the next run. there's a LOT to do in that area: some code can migrate to LUA scripts, configuration can be automated, concerns separated, etc. 

### the generic API
the big reusable thing here is that Daedalus exposes an [OSC](http://opensoundcontrol.org/osc) network API to the empty-epsilon server, both input and output. It's open-ended, so you can easily use standard [OSC endpoints](https://github.com/amir-arad/awesome-osc) to extend the game's UI. 

### the engineering changes
We replace the existing repair mechanic with a custom CLI screen (that also handles other LARP concerns) with one concurrent repair at a time, and introduced switchboards - engineering sub-systems that supply power to the Empty Epsilon systems (a.k.a bridge systems) in a many-to-many dependency matrix (each switchboard supplies power to more than one system and each system consumes power from more than one switchboard). when the engineer overpowers a bridge system, all switchboards supplying power to that system start accumulating load, and at some point (random and different for each switchboard) will become overloaded. 

Overloaded switches produce extra heat to all their supported system until reset. resetting a switchboard takes precious time, and during that time there are severe penalties to the bridge systems supported by the power switch (very low cap on power and repair speed) so it becomes a major tactical concern. 

In our LARP the switchboards are implemented by plastic electricity boards (based on arduino) located in various locations around the ship. however any OSC compatible network endpoint will do (we're using [open-stage-control](https://github.com/jean-emmanuel/open-stage-control) for the backoffice and the test client and it's great)

## product documentation
can be found in [the excalibur entries folder](./resources/entries)

## developer documentation
also found [here](./resources/entries/daedalus-developer.md)
