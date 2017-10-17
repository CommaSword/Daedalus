import {User} from "../session/users";
import {FileChangedEvent, FileCreatedEvent, FileDeletedEvent, FileSystem, isFile, pathSeparator} from "kissfs";
import fm = require('front-matter');

export class Logs {
    static readonly logPath = 'logFile.md';
    static readonly resourcesPath = './';
    static readonly logInitMetadata = "";

    constructor(private fs: FileSystem) {
        this.init(fs);
    }

    private async init(fs: FileSystem) {
        
        const fsItems = await fs.loadDirectoryChildren(".");
        if (!fsItems.find(file => file.type==="file" && file.name===Logs.logPath)){
            console.info(`Missing log file. Creating a new one ${Logs.logPath}`);
            fs.saveFile(Logs.logPath, Logs.logInitMetadata);
        }
    }

    async openLogFile(): Promise<string | undefined> {
        return await this.fs.loadTextFile(Logs.logPath);
    }
    
    saveLogFile(data: string): void {
        let file = this.fs.saveFile(Logs.logPath, data);
    }

    async writeToLog(newLine: string): Promise<void> {
        console.debug(`writing new line to log file`);
        const log = await this.openLogFile();
        const newLog = `${log}\n${newLine}`;
        this.saveLogFile(newLog);
    }
}
