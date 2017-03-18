export type Unknown_MsgType = 'unknown';
export type Noop_MsgType = 'noop';
export type Hello_MsgType = 'hello';
export type State_MsgType = 'state';

export type MsgType = State_MsgType | Hello_MsgType | Noop_MsgType | Unknown_MsgType;

export interface Msg<T extends MsgType> {
    type: T;
}
export interface IncomingMsg<T extends MsgType> extends Msg<T> {
    [k:string]:any;
}

export interface NoopMsg extends IncomingMsg<Noop_MsgType>{
    id:string;
}
export function isNoopMsg(msg:Msg<any>):msg is NoopMsg{
    return msg.type === 'noop';
}

export interface HelloMsg extends IncomingMsg<Hello_MsgType>{
    id:string;
    state:any;
}
export function isHelloMsg(msg:Msg<any>):msg is HelloMsg{
    return msg.type === 'hello';
}

export interface StateMsg extends IncomingMsg<State_MsgType>{
    state:any;
}
export function isStateMsg(msg:Msg<any>):msg is StateMsg{
    return msg.type === 'state';
}
