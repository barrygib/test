import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../store/AppContext';
import type { TextSelection } from '../../types';
import './MiddlePane.css';

export default function MiddlePane() {
  const { state, dispatch, sendMessage } = useApp();
  const [input, setInput] = useState('');
  const [selectionPopup, setSelectionPopup] = useState<{
    x: number;
    y: number;
    selection: TextSelection;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const activeChat = state.chats.find((c) => c.id === state.activeChatId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  const handleSend = () => {
    if (!input.trim() || !state.activeChatId) return;
    sendMessage(state.activeChatId, input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      // Small delay to avoid clearing during click on popup
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          setSelectionPopup(null);
        }
      }, 200);
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    // Find which message the selection belongs to
    const anchorNode = selection.anchorNode;
    if (!anchorNode) return;

    let messageEl: HTMLElement | null = null;
    let node: Node | null = anchorNode;
    while (node) {
      if (node instanceof HTMLElement && node.dataset.messageId) {
        messageEl = node;
        break;
      }
      node = node.parentNode;
    }

    if (!messageEl || messageEl.dataset.messageRole !== 'assistant') return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const chatRect = chatAreaRef.current?.getBoundingClientRect();

    if (!chatRect) return;

    setSelectionPopup({
      x: rect.left + rect.width / 2 - chatRect.left,
      y: rect.top - chatRect.top - 8,
      selection: {
        text: selectedText,
        messageId: messageEl.dataset.messageId!,
        chatId: state.activeChatId!,
      },
    });
  }, [state.activeChatId]);

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    return () => document.removeEventListener('mouseup', handleTextSelection);
  }, [handleTextSelection]);

  const handleOpenSidePanel = () => {
    if (selectionPopup) {
      dispatch({ type: 'OPEN_SIDE_PANEL', selection: selectionPopup.selection });
      setSelectionPopup(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const renderMessageContent = (content: string) => {
    // Basic markdown-like rendering
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let inList = false;

    lines.forEach((line, i) => {
      // Headers
      if (line.startsWith('**') && line.endsWith('**')) {
        if (inList) { inList = false; }
        elements.push(
          <h3 key={i} className="msg-heading">
            {line.replace(/\*\*/g, '')}
          </h3>
        );
        return;
      }

      // Bold sections at start of line
      const boldMatch = line.match(/^\*\*(.+?)\*\*(.*)$/);

      // List items
      if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
        inList = true;
        const content = line.replace(/^[-*]\s|^\d+\.\s/, '');
        elements.push(
          <li key={i} className="msg-list-item">
            {renderInlineFormatting(content)}
          </li>
        );
        return;
      }

      if (inList && line.trim() === '') {
        inList = false;
      }

      // Blockquote
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={i} className="msg-blockquote">
            {renderInlineFormatting(line.slice(2))}
          </blockquote>
        );
        return;
      }

      // Empty line
      if (line.trim() === '') {
        elements.push(<div key={i} className="msg-spacer" />);
        return;
      }

      // Regular paragraph (with optional bold start)
      if (boldMatch) {
        elements.push(
          <p key={i} className="msg-paragraph">
            <strong>{boldMatch[1]}</strong>
            {renderInlineFormatting(boldMatch[2])}
          </p>
        );
      } else {
        elements.push(
          <p key={i} className="msg-paragraph">
            {renderInlineFormatting(line)}
          </p>
        );
      }
    });

    return elements;
  };

  const renderInlineFormatting = (text: string) => {
    // Handle *italic*, **bold**, and `code` inline
    const parts: (string | JSX.Element)[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      // Italic
      const italicMatch = remaining.match(/\*(.+?)\*/);
      // Code
      const codeMatch = remaining.match(/`(.+?)`/);

      const matches = [
        boldMatch && { type: 'bold', match: boldMatch },
        italicMatch && !boldMatch?.index?.toString() && { type: 'italic', match: italicMatch },
        codeMatch && { type: 'code', match: codeMatch },
      ].filter(Boolean) as { type: string; match: RegExpMatchArray }[];

      if (matches.length === 0) {
        parts.push(remaining);
        break;
      }

      // Find earliest match
      const earliest = matches.reduce((a, b) =>
        (a.match.index ?? Infinity) < (b.match.index ?? Infinity) ? a : b
      );

      const idx = earliest.match.index ?? 0;
      if (idx > 0) {
        parts.push(remaining.slice(0, idx));
      }

      if (earliest.type === 'bold') {
        parts.push(<strong key={key++}>{earliest.match[1]}</strong>);
        remaining = remaining.slice(idx + earliest.match[0].length);
      } else if (earliest.type === 'italic') {
        parts.push(<em key={key++}>{earliest.match[1]}</em>);
        remaining = remaining.slice(idx + earliest.match[0].length);
      } else {
        parts.push(<code key={key++} className="msg-inline-code">{earliest.match[1]}</code>);
        remaining = remaining.slice(idx + earliest.match[0].length);
      }
    }

    return <>{parts}</>;
  };

  if (!activeChat) {
    return (
      <div className="middle-pane empty-state">
        <div className="empty-content">
          <h2>No chat selected</h2>
          <p>Create a new chat or select one from the sidebar to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`middle-pane ${state.sidePanelOpen ? 'with-side-panel' : ''}`}>
      <div className="middle-pane-header">
        <button
          className="toggle-sidebar-btn"
          onClick={() => dispatch({ type: 'TOGGLE_LEFT_PANE' })}
          title="Toggle sidebar"
        >
          ☰
        </button>
        <h2 className="chat-header-title">{activeChat.title}</h2>
      </div>

      <div className="chat-area" ref={chatAreaRef}>
        {activeChat.messages.length === 0 && (
          <div className="welcome-message">
            <h2>Start a conversation</h2>
            <p>
              Send a message to begin. Try asking for a book summary, or type "help" to learn
              about the text selection feature.
            </p>
            <div className="suggestion-chips">
              <button
                className="suggestion-chip"
                onClick={() => {
                  setInput('Give me a detailed summary of a book about technology and human connection');
                  setTimeout(() => {
                    if (state.activeChatId) {
                      sendMessage(state.activeChatId, 'Give me a detailed summary of a book about technology and human connection');
                      setInput('');
                    }
                  }, 100);
                }}
              >
                📚 Summarize a book
              </button>
              <button
                className="suggestion-chip"
                onClick={() => {
                  setInput('How do I use this interface?');
                  setTimeout(() => {
                    if (state.activeChatId) {
                      sendMessage(state.activeChatId, 'How do I use this interface?');
                      setInput('');
                    }
                  }, 100);
                }}
              >
                ❓ How to use this
              </button>
              <button
                className="suggestion-chip"
                onClick={() => {
                  setInput('Tell me about the future of artificial intelligence');
                  setTimeout(() => {
                    if (state.activeChatId) {
                      sendMessage(state.activeChatId, 'Tell me about the future of artificial intelligence');
                      setInput('');
                    }
                  }, 100);
                }}
              >
                🤖 AI discussion
              </button>
            </div>
          </div>
        )}

        {activeChat.messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.role}`}
            data-message-id={msg.id}
            data-message-role={msg.role}
          >
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              <div className="message-role-label">
                {msg.role === 'user' ? 'You' : 'Assistant'}
              </div>
              <div className="message-body">
                {msg.role === 'assistant' ? renderMessageContent(msg.content) : <p>{msg.content}</p>}
              </div>
              {msg.role === 'assistant' && (
                <div className="message-hint">
                  Select any text above to interact with it in the side panel
                </div>
              )}
            </div>
          </div>
        ))}

        {selectionPopup && (
          <div
            className="selection-popup"
            style={{
              left: selectionPopup.x,
              top: selectionPopup.y,
            }}
          >
            <button className="selection-popup-btn" onMouseDown={handleOpenSidePanel}>
              📌 Open in Side Panel
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <div className="input-wrapper">
          <textarea
            className="message-input"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
