import {Document, Types} from "mongoose";

export interface Message {
    from: Types.ObjectId;      // User ID of sender
    to: Types.ObjectId;        // User ID of recipient
    content: string;   // Message content
}

export interface Conversation {
    active: boolean;      // Whether the conversation is active
    messages: Message[];  // Array of messages in the conversation
}

export interface MessageResponse extends Message {
    id: string;
}

export interface ConversationResponse extends Conversation {
    id: string;
}


export interface IMessageDocument extends Message, Document {

}


export interface IConversationDocument extends Conversation, Document {

}
