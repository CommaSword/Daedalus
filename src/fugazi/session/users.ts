import {FileChangedEvent, FileSystem} from "kissfs";
import {normalize} from "path";
import {ExcaliburSecClass} from "../excalibur/clearence";

export enum Gender {MALE, FEMALE, ADVANCED}


export class UserData {
	gender: "MALE" | "FEMALE" | "ADVANCED";
	name: string;
	key: string;
	excaliburClearance: "CONFIDENTIAL" | "SECRET" | "TOP_SECRET";
}

export class User {
	gender: Gender;
	name: string;
	key: string;
	excaliburClearance: ExcaliburSecClass;
constructor(ud:UserData){
	this.gender = Gender[ud.gender];
	this.name = ud.name;
	this.key = ud.key;
	this.excaliburClearance = ExcaliburSecClass[ud.excaliburClearance];
}
	isPermitted(reqPermission: ExcaliburSecClass) {
		return this.excaliburClearance >= reqPermission;
	}
}

export class Users {
	static readonly usersConfigPath = 'users.json';

	private users: Array<UserData> = [];

	constructor(fs:FileSystem){
		this.init(fs);
	}

	private async init(fs:FileSystem){
		const usersStr = await fs.loadTextFile(Users.usersConfigPath);
		fs.events.on('fileChanged', (e:FileChangedEvent)=>{
			if (normalize(e.fullPath) === normalize(Users.usersConfigPath)) {
				console.log('detected users config change');
				this.parseUsers(e.newContent);
			}
		});
		this.parseUsers(usersStr);
	}

	private parseUsers(usersStr: string) {
		try {
            this.users = JSON.parse(usersStr) as UserData[];
		} catch(e){
			console.error(`error parsing ${Users.usersConfigPath} : ${e.message}`);
		}
	}

	findUserByLogin(name:string, password:string):UserData | undefined {
		return this.users.find(u => u.name.toLowerCase() === name.toLowerCase() && u.key.toLowerCase() === password.toLowerCase())
	}
}