---
status : 2
securityClass : 1
name : Fugazi modules
---
# Fugazi modules
Fugazi has one integral module (sessions), and three application modules, by which it enables access to the functionality of other ship’s subsystems. technically all modules are implemented in this project and run in the same server.

## Sessions module
The sessions module provides authorization and authentication in fugazi. Any other module will check the fugazi session for security clearance before executing commands.

Missing feature in fugazi-io : [Prompting for additional data for a command](https://github.com/fugazi-io/webclient/issues/94)

Commands : 
 - Login - authenticate the current console window with a registered user’s credentials (done)
 - Whoami - display the identity currently associated with the console window (done)

Features:
 - Every session has an entry (available in Excalibur) with all user actions, logged in real-time (not done). Consider sharing code with the log module.

## Log module
A subsystem for keeping the ship’s log.

Commands:
 - Log - add a line to the log (done)
 - Read - read the last 1 or more log entries (not done)

## Excalibur module
The ship’s knowledge base. Provides access to both encyclopedia-like data entries, and some realtime information.

Missing feature in fugazi-io : [The output box is hard to use when output is long](https://github.com/fugazi-io/webclient/issues/95)

Missing feature in fugazi-io : [Cannot deal with multiple string returns](https://github.com/fugazi-io/webclient/issues/86)

Commands : 
 - Open - display the content of a single data entry according to provided name (mostly done, missing auto-complete)
 - List - display a complete list of data entries by name, optionally filtered by a search term (not done) 
consider using [keyword-extractor](https://www.npmjs.com/package/keyword-extractor) and [search-text-tokenizer](https://www.npmjs.com/package/search-text-tokenizer).
 - Query - execute a “deep query” using excalibur’s slow but powerful librarian AI. Provided a question, after a noticeable waiting period (between several minutes to an hour and sometimes more) the answer is added to the existing data entries and displayed to the user (done)

Features:
 - Include (serve and display) pictures inside data entries. 

## Engineering module
Allows sending low level directives to the engineering infrastructure systems, and to the otherwise autonomous repair system.

Commands : 
???
 - Open / close power to submodule X
 - Bypass submodule X
???

