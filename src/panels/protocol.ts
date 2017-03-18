export type Unknown_MsgType = 'unknown';
export type Noop_MsgType = 'noop';

export type MsgType = Noop_MsgType | Unknown_MsgType;

export interface Msg<T extends MsgType> {
    type: T;
}
export interface IncomingMsg<T extends MsgType> extends Msg<T> {
    [k:string]:any;
}
