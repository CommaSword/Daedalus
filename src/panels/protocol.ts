export type UnknownMsgType = 'unknown';

export type MsgType = UnknownMsgType;

export interface Msg {
    type: MsgType;
}
