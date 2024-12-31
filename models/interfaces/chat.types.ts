import {Document, Types} from "mongoose";

export interface Message {
    from: Types.ObjectId;      // User ID of sender
    to: Types.ObjectId;        // User ID of recipient
    content: string
    timestamp: Date;   // Message content
}

export interface Conversation {
    active: boolean;      // Whether the conversation is active
    messages: Message[];  // Array of messages in the conversation
}

export interface MessageRequest extends Message {
    conversationId: string;
}

export interface ConversationResponse extends Conversation {
    id: string;
}

export interface ImessageResponse extends Message {

}


export interface IMessageDocument extends Message, Document {
}


export interface IConversationDocument extends Conversation, Document {
    messages: IMessageDocument[];
}
