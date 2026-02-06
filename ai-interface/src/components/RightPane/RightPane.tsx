import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../store/AppContext';
import './RightPane.css';

export default function RightPane() {
  const { state, dispatch, sendSidePanelMessage } = useApp();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const thread = state.sidePanelThread;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages]);

  if (!state.sidePanelOpen || !thread) return null;

  const handleSend = () => {
    if (!input.trim()) return;
    sendSidePanelMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedText = thread.selection.text;
  const truncatedSelection =
    selectedText.length > 300 ? selectedText.slice(0, 300) + '...' : selectedText;

  return (
    <div className="right-pane">
      <div className="right-pane-header">
        <div className="right-pane-header-content">
          <h3 className="right-pane-title">Selection Context</h3>
          <span className="right-pane-subtitle">Focused interaction</span>
        </div>
        <button
          className="close-panel-btn"
          onClick={() => dispatch({ type: 'CLOSE_SIDE_PANEL' })}
          title="Close panel"
        >
          ✕
        </button>
      </div>

      <div className="selected-text-section">
        <div className="selected-text-label">Selected text:</div>
        <div className="selected-text-content">
          "{truncatedSelection}"
        </div>
      </div>

      <div className="side-panel-chat">
        {thread.messages.length === 0 && (
          <div className="side-panel-empty">
            <p>Ask a question or request changes to the selected text.</p>
            <div className="quick-actions">
              <button
                className="quick-action-btn"
                onClick={() => {
                  sendSidePanelMessage('Explain this in simpler terms');
                }}
              >
                Explain this
              </button>
              <button
                className="quick-action-btn"
                onClick={() => {
                  sendSidePanelMessage('Expand on this section with more detail');
                }}
              >
                Expand on this
              </button>
              <button
                className="quick-action-btn"
                onClick={() => {
                  sendSidePanelMessage('Rewrite this section to be more concise');
                }}
              >
                Make it concise
              </button>
              <button
                className="quick-action-btn"
                onClick={() => {
                  sendSidePanelMessage('What are the counterarguments to this?');
                }}
              >
                Counterarguments
              </button>
            </div>
          </div>
        )}

        {thread.messages.map((msg) => (
          <div key={msg.id} className={`side-message ${msg.role}`}>
            <div className="side-message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="side-message-content">
              <div className="side-message-role">
                {msg.role === 'user' ? 'You' : 'Assistant'}
              </div>
              <div className="side-message-body">{msg.content}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="side-panel-input-area">
        <div className="side-panel-input-wrapper">
          <textarea
            className="side-panel-input"
            placeholder="Ask about the selection..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="side-panel-send-btn"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
