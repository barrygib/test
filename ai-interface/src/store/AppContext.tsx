import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { Chat, Folder, TextSelection, SidePanelThread, Message } from '../types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

interface AppState {
  chats: Chat[];
  folders: Folder[];
  activeChatId: string | null;
  activeSelection: TextSelection | null;
  sidePanelThread: SidePanelThread | null;
  sidePanelOpen: boolean;
  leftPaneCollapsed: boolean;
}

type Action =
  | { type: 'CREATE_CHAT'; folderId?: string }
  | { type: 'DELETE_CHAT'; chatId: string }
  | { type: 'SET_ACTIVE_CHAT'; chatId: string }
  | { type: 'RENAME_CHAT'; chatId: string; title: string }
  | { type: 'ADD_MESSAGE'; chatId: string; message: Message }
  | { type: 'CREATE_FOLDER'; name: string }
  | { type: 'DELETE_FOLDER'; folderId: string }
  | { type: 'RENAME_FOLDER'; folderId: string; name: string }
  | { type: 'TOGGLE_FOLDER'; folderId: string }
  | { type: 'MOVE_CHAT_TO_FOLDER'; chatId: string; folderId: string | null }
  | { type: 'SET_SELECTION'; selection: TextSelection }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'OPEN_SIDE_PANEL'; selection: TextSelection }
  | { type: 'CLOSE_SIDE_PANEL' }
  | { type: 'ADD_SIDE_PANEL_MESSAGE'; message: Message }
  | { type: 'TOGGLE_LEFT_PANE' };

function createNewChat(folderId: string | null = null): Chat {
  const id = generateId();
  return {
    id,
    title: 'New Chat',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    folderId,
  };
}

// Simulated AI response - in production this would call an actual API
function generateSimulatedResponse(userMessage: string): string {
  const responses: Record<string, string> = {
    default: `Thank you for your message. This is a simulated AI response to demonstrate the interface.

Here are some key points to consider:

1. **Text Selection**: You can highlight any part of this response to interact with it in the side panel. Simply select text with your mouse and click the "Open in Side Panel" button that appears.

2. **Contextual Interaction**: Once you've selected text, the right panel opens where you can ask follow-up questions about just that specific section.

3. **Organized Conversations**: Use folders in the left sidebar to organize your chats by topic or project.

This interface is designed to give you granular control over AI conversations, letting you drill into specific parts of any response without losing the broader context of your chat.`,
  };

  if (userMessage.toLowerCase().includes('summary') || userMessage.toLowerCase().includes('book')) {
    return `Here is a comprehensive summary based on your request:

**Introduction and Core Thesis**
The central argument presents a nuanced perspective on how technology reshapes human interaction. The author contends that digital communication tools, while powerful, fundamentally alter the depth and quality of interpersonal relationships.

**Key Themes**
The work explores several interconnected themes throughout its chapters:

- *The Paradox of Connectivity*: As we become more digitally connected, meaningful face-to-face interactions decrease, creating a sense of isolation despite constant communication.
- *Information Overload*: The sheer volume of data we process daily has measurable effects on decision-making quality and cognitive fatigue.
- *Adaptive Behavior*: Humans demonstrate remarkable ability to adapt their communication styles across different digital platforms.

**Critical Analysis**
The methodology employed is primarily qualitative, drawing from extensive interviews and longitudinal case studies. While this provides rich narrative data, some critics argue for more quantitative validation.

**Conclusion and Implications**
The work concludes with practical recommendations for maintaining authentic human connection in an increasingly digital world. The author suggests intentional "digital sabbaticals" and structured face-to-face interaction as counterbalances.

*Select any section above to explore it further in the side panel.*`;
  }

  if (userMessage.toLowerCase().includes('help') || userMessage.toLowerCase().includes('how')) {
    return `Here's how to use this interface effectively:

**Three-Pane Layout**
- **Left Pane**: Manage your chats and folders. Create new conversations, organize them into folders, and switch between chats.
- **Middle Pane**: This is your main conversation area. Type messages and receive AI responses here.
- **Right Pane**: The context panel. Select any text from an AI response to open a focused sub-conversation about that specific content.

**Text Selection Feature**
To use the selection feature:
1. Find a section of an AI response you want to explore
2. Click and drag to highlight the text
3. A floating button will appear — click "Open in Side Panel"
4. The right pane opens with your selected text quoted at the top
5. Ask questions or request changes to just that section

**Tips**
- You can select as little as a single word or as much as multiple paragraphs
- Each side panel thread is independent — it focuses only on your selected text
- Use folders to organize related conversations together`;
  }

  return responses.default;
}

const initialChat = createNewChat();

const initialState: AppState = {
  chats: [initialChat],
  folders: [],
  activeChatId: initialChat.id,
  activeSelection: null,
  sidePanelThread: null,
  sidePanelOpen: false,
  leftPaneCollapsed: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'CREATE_CHAT': {
      const newChat = createNewChat(action.folderId ?? null);
      return {
        ...state,
        chats: [...state.chats, newChat],
        activeChatId: newChat.id,
      };
    }
    case 'DELETE_CHAT': {
      const remaining = state.chats.filter((c) => c.id !== action.chatId);
      let newActiveId = state.activeChatId;
      if (state.activeChatId === action.chatId) {
        newActiveId = remaining.length > 0 ? remaining[remaining.length - 1].id : null;
      }
      return {
        ...state,
        chats: remaining,
        activeChatId: newActiveId,
        sidePanelOpen: false,
        sidePanelThread: null,
        activeSelection: null,
      };
    }
    case 'SET_ACTIVE_CHAT':
      return {
        ...state,
        activeChatId: action.chatId,
        sidePanelOpen: false,
        sidePanelThread: null,
        activeSelection: null,
      };
    case 'RENAME_CHAT':
      return {
        ...state,
        chats: state.chats.map((c) =>
          c.id === action.chatId ? { ...c, title: action.title, updatedAt: Date.now() } : c
        ),
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        chats: state.chats.map((c) =>
          c.id === action.chatId
            ? {
                ...c,
                messages: [...c.messages, action.message],
                updatedAt: Date.now(),
                title:
                  c.messages.length === 0 && action.message.role === 'user'
                    ? action.message.content.slice(0, 40) + (action.message.content.length > 40 ? '...' : '')
                    : c.title,
              }
            : c
        ),
      };
    case 'CREATE_FOLDER': {
      const folder: Folder = { id: generateId(), name: action.name, isOpen: true };
      return { ...state, folders: [...state.folders, folder] };
    }
    case 'DELETE_FOLDER':
      return {
        ...state,
        folders: state.folders.filter((f) => f.id !== action.folderId),
        chats: state.chats.map((c) =>
          c.folderId === action.folderId ? { ...c, folderId: null } : c
        ),
      };
    case 'RENAME_FOLDER':
      return {
        ...state,
        folders: state.folders.map((f) =>
          f.id === action.folderId ? { ...f, name: action.name } : f
        ),
      };
    case 'TOGGLE_FOLDER':
      return {
        ...state,
        folders: state.folders.map((f) =>
          f.id === action.folderId ? { ...f, isOpen: !f.isOpen } : f
        ),
      };
    case 'MOVE_CHAT_TO_FOLDER':
      return {
        ...state,
        chats: state.chats.map((c) =>
          c.id === action.chatId ? { ...c, folderId: action.folderId } : c
        ),
      };
    case 'SET_SELECTION':
      return { ...state, activeSelection: action.selection };
    case 'CLEAR_SELECTION':
      return { ...state, activeSelection: null };
    case 'OPEN_SIDE_PANEL': {
      const thread: SidePanelThread = {
        id: generateId(),
        selection: action.selection,
        messages: [],
      };
      return {
        ...state,
        sidePanelOpen: true,
        sidePanelThread: thread,
        activeSelection: action.selection,
      };
    }
    case 'CLOSE_SIDE_PANEL':
      return {
        ...state,
        sidePanelOpen: false,
        sidePanelThread: null,
        activeSelection: null,
      };
    case 'ADD_SIDE_PANEL_MESSAGE':
      if (!state.sidePanelThread) return state;
      return {
        ...state,
        sidePanelThread: {
          ...state.sidePanelThread,
          messages: [...state.sidePanelThread.messages, action.message],
        },
      };
    case 'TOGGLE_LEFT_PANE':
      return { ...state, leftPaneCollapsed: !state.leftPaneCollapsed };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  sendMessage: (chatId: string, content: string) => void;
  sendSidePanelMessage: (content: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const sendMessage = (chatId: string, content: string) => {
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_MESSAGE', chatId, message: userMessage });

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: generateSimulatedResponse(content),
        timestamp: Date.now(),
      };
      dispatch({ type: 'ADD_MESSAGE', chatId, message: aiMessage });
    }, 600);
  };

  const sendSidePanelMessage = (content: string) => {
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_SIDE_PANEL_MESSAGE', message: userMessage });

    // Simulate AI response scoped to selected text
    setTimeout(() => {
      const selectedText = state.sidePanelThread?.selection.text ?? '';
      const aiMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: generateSidePanelResponse(content, selectedText),
        timestamp: Date.now(),
      };
      dispatch({ type: 'ADD_SIDE_PANEL_MESSAGE', message: aiMessage });
    }, 500);
  };

  return (
    <AppContext.Provider value={{ state, dispatch, sendMessage, sendSidePanelMessage }}>
      {children}
    </AppContext.Provider>
  );
}

function generateSidePanelResponse(question: string, selectedText: string): string {
  const preview = selectedText.length > 80 ? selectedText.slice(0, 80) + '...' : selectedText;

  if (question.toLowerCase().includes('explain') || question.toLowerCase().includes('what')) {
    return `Regarding the selected passage: "${preview}"

This section discusses a specific aspect that can be broken down further:

- The core idea here centers on the relationship between the concepts mentioned
- It builds on earlier points in the full response
- The implications extend to broader themes in the conversation

Would you like me to elaborate on any particular aspect, or would you like me to rephrase this section differently?`;
  }

  if (question.toLowerCase().includes('change') || question.toLowerCase().includes('rewrite') || question.toLowerCase().includes('rephrase')) {
    return `Here's a revised version of the selected text:

> ${selectedText}

**Revised:**
This passage has been restructured for improved clarity and flow. The key points remain the same but are presented in a more accessible way, with stronger transitions between ideas and more precise language.

Would you like further adjustments to tone, length, or emphasis?`;
  }

  if (question.toLowerCase().includes('expand') || question.toLowerCase().includes('more')) {
    return `Expanding on: "${preview}"

This is a rich area that deserves deeper exploration. Here are additional dimensions to consider:

1. **Historical Context**: This concept has evolved significantly over time, with roots tracing back to foundational work in the field.

2. **Practical Applications**: In real-world scenarios, this manifests in several ways that directly impact day-to-day operations and decision-making.

3. **Counterarguments**: It's worth noting that some perspectives challenge this view, suggesting alternative interpretations that merit consideration.

4. **Future Implications**: Looking ahead, this area is likely to grow in importance as new developments emerge.

Select any of these sub-points to dive even deeper.`;
  }

  return `Analyzing the selected text: "${preview}"

Based on your question about this specific passage:

This section is noteworthy because it captures a key point in the broader response. The language used here is deliberate — it frames the concept in a way that connects to the larger argument while remaining accessible.

A few observations:
- The phrasing emphasizes causality and connection
- It serves as a bridge between the preceding and following ideas
- There are implicit assumptions worth examining further

Feel free to ask me to rephrase, expand, simplify, or challenge any part of this selection.`;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
