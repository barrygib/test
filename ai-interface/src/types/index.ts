export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  folderId: string | null;
}

export interface Folder {
  id: string;
  name: string;
  isOpen: boolean;
}

export interface TextSelection {
  text: string;
  messageId: string;
  chatId: string;
}

export interface SidePanelThread {
  id: string;
  selection: TextSelection;
  messages: Message[];
}
