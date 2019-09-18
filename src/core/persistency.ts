import {FileChangedEvent, FileSystem} from "kissfs";

export interface Model<T extends object> {
    toJSON(): T;

    fromJSON(state: T): void;
}

export class Persistence<T extends object> {

    private lastKnownFileContent: string = '';
    private model: Model<T>;

    constructor(private readonly name: string, private readonly fs: FileSystem, private statePath: string) {

    }

    async init(model: Model<T>) {
        this.model = model;

        const changeListener = (e: FileChangedEvent) => {
            if (e.fullPath === this.statePath && this.lastKnownFileContent !== e.newContent) {
                this.lastKnownFileContent = e.newContent;
                console.log(`Detected change in ${this.name} state file. loading state...`);
                this.model.fromJSON(JSON.parse(e.newContent));
            }
        };
        const intervalHandle = setInterval(this.saveState, 1000);
        this.disposer = () => {
            clearInterval(intervalHandle);
            this.fs.events.off('fileChanged', changeListener);
        };
        this.fs.events.on('fileChanged', changeListener);
        try {
            const content = await this.fs.loadTextFile(this.statePath);
            console.log(`loading existing ${this.name} state from ${this.fs.baseUrl}/${this.statePath}`);
            this.lastKnownFileContent = content;
            this.model.fromJSON(JSON.parse(content));
        } catch (_) {
            console.log(`no existing ${this.name} state file found at ${this.fs.baseUrl}/${this.statePath}`);
        }
    }

    disposer: Function;

    saveState = () => {
        const serializedState = JSON.stringify(this.model.toJSON(), null, 4);
        if (serializedState !== this.lastKnownFileContent) {
            this.lastKnownFileContent = serializedState;
            this.fs.saveFile(this.statePath, serializedState)
                // .then(() => console.log(` ${this.name} state file saved at ${this.fs.baseUrl}/${this.statePath}`));
        }
    }

}
