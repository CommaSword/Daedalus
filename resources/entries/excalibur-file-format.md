---
status : 2
securityClass : 1
name : Excalibur file format
---
# Excalibur file format

This document will detail the formatting requirements for all documents.

The file extension of the final product should be .md
Here is an example of how an excalibur entry file would look like:
Source (what you write and edit):
```

---
status : 2
securityClass : 1
name : Fugazi
---
# F.U.G.A.Z.I
Fiat Utterance Gateway Application (zero interface).
Star-fleet's universal low level command system, acting as the default interface for numerous ship systems.
```

Display (what the players will see):

> # F.U.G.A.Z.I
>
> Fiat Utterance Gateway Application (zero interface).
> 
> Star-fleet's universal low level command system, acting as the default interface for numerous ship systems.


 - The top section between the two triple-dashes (`---`) is metadata in [yaml](http://www.yaml.org/start.html) format. 
 - The list of fields in the metadata is still subject to change. 
 - The name field is something we already know is mandatory.
 - The name has to be a unique ID and be as relevant as possible to the document. This is the name of the data entry as will be displayed to the users before opening the file.
 - The rest of the document (after the second `---` ) is the entry's body, it should be written in [Markdown](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet).
