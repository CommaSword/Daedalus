import {User} from "../session/users";
import {FileChangedEvent, FileCreatedEvent, FileDeletedEvent, FileSystem, isFile} from "kissfs";
import {ExcaliburSecClass} from "./clearence";
import {basename, join, normalize} from "path";
import fm = require('front-matter');

export enum Status {
    DRAFT = 0,
    QUERY = 1,
    ENTRY = 2
}

export class Entry {

    constructor(public path: string,
                public meta: Metadata,
                public content: string) {
        if (this.meta.status === undefined) {
            this.meta.status = Status.ENTRY;
        }
        if (this.meta.securityClass === undefined) {
            this.meta.securityClass = ExcaliburSecClass.CONFIDENTIAL;
        }
    }

    static parse(rawContent: string, path: string): Entry {
        const parsed = fm<Metadata>(rawContent.trim());
        return new Entry(path, parsed.attributes, parsed.body);
    }

    toString(): string {
        return `---
status : ${this.meta.status}
securityClass : ${this.meta.securityClass}
name : ${this.meta.name}
---
${this.content}`
    }
}

export interface Metadata {
    name: string;
    status: Status;
    securityClass: ExcaliburSecClass;
}


type Dictionary<T> = {
    [k: string]: T
}


export class Entries {
    static readonly entriesPath = 'entries';
    static readonly queriesPath = 'queries';

    private entries = new Map<string, Entry>();

    constructor(private fs: FileSystem) {
    }

    open(user: User, search: string): string | undefined {
        let entry = [... this.entries.values()].find(e =>
            user.isPermitted(e.meta.securityClass) && e.meta.name.toLowerCase().includes(search.toLowerCase()));
        return entry && entry.content;
    }

    list(): string {
        let allowedEntries = [... this.entries.values()]
            .map(e => `${e.meta.name} (${ExcaliburSecClass[e.meta.securityClass]})`);
        return allowedEntries.join(', ')
    }

    async query(user: User, search: string): Promise<string | undefined> {
        let queryFileName = `query_${Date.now().toString()}.md`;

        let newPath = join(Entries.queriesPath, queryFileName);
        let queryEntry = new Entry(newPath, {
                status: Status.QUERY,
                securityClass: user.excaliburClearance,
                name: search
            },
            `This entry was created due to a query by ${user.name} at SD${Date.now()}`
        );
        await this.fs.saveFile(newPath, queryEntry.toString());
        const entry = await new Promise<Entry>((resolve: Function) => {
            const listener = (e: FileChangedEvent) => {
                if (normalize(e.fullPath) === normalize(newPath)) {
                    let entry = Entry.parse(e.newContent, e.fullPath);
                    if (entry.meta.status === Status.ENTRY) {
                        this.fs.events.removeListener('fileChanged', listener)
                        resolve(entry);
                    }
                }
            };
            this.fs.events.on('fileChanged', listener);
        });

        // We move the finished file from the queries folder to the entries folder
        let finalPath = join(Entries.entriesPath, basename(entry.path));
        await this.fs.saveFile(finalPath, entry.toString());
        await this.fs.deleteFile(newPath);
        this.entries.set(finalPath, entry); // add new entry to memory instead of waiting for watch event, to make sure it's there when this.open() runs (race condition)
        return this.open(user, entry.meta.name);
    }

    async init() {
        const fsItems = await this.fs.loadDirectoryChildren(Entries.entriesPath);

        const fileHandler = (e: FileChangedEvent | FileCreatedEvent) => {
            // Handle all new files found in the folder
            if (e.fullPath.startsWith(Entries.entriesPath)) {
                let entry = Entry.parse(e.newContent, e.fullPath);
                if (entry.meta.status === Status.ENTRY) {
                    this.entries.set(e.fullPath, entry);
                } else {
                    this.entries.delete(e.fullPath);
                }
            }
        };
        // process all files
        await fsItems.filter(isFile)
            // load file
            .map(async file => {
                const content = await this.fs.loadTextFile(file.fullPath);
                fileHandler({type: "fileChanged", fullPath: file.fullPath, newContent: content});
            })
            // wait for all loading
            .reduce(async (r, p) => {
                await r;
                await p;
            }, {});

        this.fs.events.on('fileChanged', fileHandler);
        this.fs.events.on('fileCreated', fileHandler);
        this.fs.events.on('fileDeleted', (e: FileDeletedEvent) => {
            if (e.fullPath.startsWith(Entries.entriesPath)) {
                this.entries.delete(e.fullPath);
            }
        });
    }

}
