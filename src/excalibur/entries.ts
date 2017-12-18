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
            this.meta.status = Status.DRAFT;
        }
        if (this.meta.securityClass === undefined) {
            this.meta.securityClass = ExcaliburSecClass.CONFIDENTIAL;
        }
        if (this.meta.name === undefined) {
            this.meta.name = "unknown";
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

    private watchdog: NodeJS.Timer;

    private entries = new Map<string, Entry>();
    private fileHandler = (e: FileChangedEvent | FileCreatedEvent) => {
        // Handle all new files found in the folder
        if (e.fullPath.startsWith(Entries.entriesPath) || e.fullPath.startsWith(Entries.queriesPath)) {
            let entry = Entry.parse(e.newContent, e.fullPath);
            if (entry.meta.status === Status.ENTRY) {
                this.entries.set(e.fullPath, entry);
            } else {
                this.entries.delete(e.fullPath);
            }
        }
    }
    private fileDeleteHandler = (e: FileDeletedEvent) => {
        if (e.fullPath.startsWith(Entries.entriesPath) || e.fullPath.startsWith(Entries.queriesPath)) {
            this.entries.delete(e.fullPath);
        }
    };
    private scanQueries = async () => {
        try {
            const queries = await this.fs.loadDirectoryChildren(Entries.queriesPath);
            await queries.filter(isFile)
            // load file
                .map(async file => {
                    try {
                        file.content = await this.fs.loadTextFile(file.fullPath);
                        const entry = Entry.parse(file.content, file.fullPath);
                        if (entry.meta.status === Status.ENTRY) {
                            await this.copyToEntries(entry);
                        }
                    } catch (e) {
                    }
                })
                // wait for all loading
                .reduce(async (r, p) => {
                    await r;
                    await p;
                }, {});
        } finally {
            this.watchdog = setTimeout(this.scanQueries, 1000);
        }
    };

    constructor(private fs: FileSystem) {
    }

    async init() {
        const fsItems = await this.fs.loadDirectoryChildren(Entries.entriesPath);

        // process all files
        await fsItems.filter(isFile)
        // load file
            .map(async file => {
                const content = await this.fs.loadTextFile(file.fullPath);
                this.fileHandler({type: "fileChanged", fullPath: file.fullPath, newContent: content});
            })
            // wait for all loading
            .reduce(async (r, p) => {
                await r;
                await p;
            }, {});

        this.fs.events.on('fileChanged', this.fileHandler);
        this.fs.events.on('fileCreated', this.fileHandler);
        this.fs.events.on('fileDeleted', this.fileDeleteHandler);
        await this.scanQueries();
    }

    destroy() {
        this.fs.events.off('fileChanged', this.fileHandler);
        this.fs.events.off('fileCreated', this.fileHandler);
        this.fs.events.off('fileDeleted', this.fileDeleteHandler);
        clearTimeout(this.watchdog);
    }

    open(user: User, search: string): string | undefined {
        let entry = [... this.entries.values()].find(e =>
            user.isPermitted(e.meta.securityClass) && e.meta.name.toLowerCase().includes(search.toLowerCase()));
        return entry && entry.content;
    }

    list(): string[] {
        return [... this.entries.values()]
            .map(e => e.meta.name);
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
        const entry = await new Promise<Entry>((resolve: Function, reject: Function) => {
                const cleanup = () => {
                    this.fs.events.removeListener('fileDeleted', listener);
                    this.fs.events.removeListener('fileChanged', listener);
                };
                const listener = (e: FileChangedEvent | FileDeletedEvent) => {
                    if (normalize(e.fullPath) === normalize(newPath)) {
                        switch (e.type) {
                            case 'fileChanged':
                                let entry = Entry.parse(e.newContent, e.fullPath);
                                if (entry.meta.status === Status.ENTRY) {
                                    cleanup();
                                    resolve(entry);
                                }
                                break;
                            case 'fileDeleted':
                                cleanup();
                                reject(new Error("Bad command or file name"));
                                break;
                        }
                    }
                };
                this.fs.events.on('fileChanged', listener);
                this.fs.events.on('fileDeleted', listener);
            });
        return this.open(user, entry.meta.name);
    }

    private async copyToEntries(entry: Entry) {
        let entriesPath = join(Entries.entriesPath, basename(entry.path));
        await this.fs.saveFile(entriesPath, entry.toString());
        await this.fs.deleteFile(entry.path);
    }

}
