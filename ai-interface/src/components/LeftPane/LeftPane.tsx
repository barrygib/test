import { useState } from 'react';
import { useApp } from '../../store/AppContext';
import './LeftPane.css';

export default function LeftPane() {
  const { state, dispatch } = useApp();
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [draggedChatId, setDraggedChatId] = useState<string | null>(null);

  const unfolderedChats = state.chats.filter((c) => c.folderId === null);

  const handleCreateChat = (folderId?: string) => {
    dispatch({ type: 'CREATE_CHAT', folderId });
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      dispatch({ type: 'CREATE_FOLDER', name: newFolderName.trim() });
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  const startRenameChat = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  const commitRenameChat = () => {
    if (editingChatId && editingTitle.trim()) {
      dispatch({ type: 'RENAME_CHAT', chatId: editingChatId, title: editingTitle.trim() });
    }
    setEditingChatId(null);
    setEditingTitle('');
  };

  const startRenameFolder = (folderId: string, currentName: string) => {
    setEditingFolderId(folderId);
    setEditingFolderName(currentName);
  };

  const commitRenameFolder = () => {
    if (editingFolderId && editingFolderName.trim()) {
      dispatch({ type: 'RENAME_FOLDER', folderId: editingFolderId, name: editingFolderName.trim() });
    }
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  const handleDragStart = (chatId: string) => {
    setDraggedChatId(chatId);
  };

  const handleDropOnFolder = (folderId: string) => {
    if (draggedChatId) {
      dispatch({ type: 'MOVE_CHAT_TO_FOLDER', chatId: draggedChatId, folderId });
      setDraggedChatId(null);
    }
  };

  const handleDropOnRoot = () => {
    if (draggedChatId) {
      dispatch({ type: 'MOVE_CHAT_TO_FOLDER', chatId: draggedChatId, folderId: null });
      setDraggedChatId(null);
    }
  };

  const renderChat = (chat: typeof state.chats[0]) => (
    <div
      key={chat.id}
      className={`chat-item ${state.activeChatId === chat.id ? 'active' : ''}`}
      onClick={() => dispatch({ type: 'SET_ACTIVE_CHAT', chatId: chat.id })}
      draggable
      onDragStart={() => handleDragStart(chat.id)}
    >
      {editingChatId === chat.id ? (
        <input
          className="rename-input"
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          onBlur={commitRenameChat}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRenameChat();
            if (e.key === 'Escape') setEditingChatId(null);
          }}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="chat-icon">💬</span>
          <span className="chat-title">{chat.title}</span>
          <div className="chat-actions">
            <button
              className="icon-btn"
              title="Rename"
              onClick={(e) => {
                e.stopPropagation();
                startRenameChat(chat.id, chat.title);
              }}
            >
              ✏️
            </button>
            <button
              className="icon-btn"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'DELETE_CHAT', chatId: chat.id });
              }}
            >
              🗑️
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={`left-pane ${state.leftPaneCollapsed ? 'collapsed' : ''}`}>
      <div className="left-pane-header">
        <h2 className="left-pane-title">Chats</h2>
        <button
          className="collapse-btn"
          onClick={() => dispatch({ type: 'TOGGLE_LEFT_PANE' })}
          title={state.leftPaneCollapsed ? 'Expand' : 'Collapse'}
        >
          {state.leftPaneCollapsed ? '→' : '←'}
        </button>
      </div>

      {!state.leftPaneCollapsed && (
        <>
          <div className="left-pane-actions">
            <button className="action-btn new-chat-btn" onClick={() => handleCreateChat()}>
              + New Chat
            </button>
            <button
              className="action-btn new-folder-btn"
              onClick={() => setShowNewFolder(!showNewFolder)}
            >
              📁 New Folder
            </button>
          </div>

          {showNewFolder && (
            <div className="new-folder-form">
              <input
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') setShowNewFolder(false);
                }}
                autoFocus
              />
              <button onClick={handleCreateFolder}>Create</button>
            </div>
          )}

          <div className="chat-list">
            {state.folders.map((folder) => {
              const folderChats = state.chats.filter((c) => c.folderId === folder.id);
              return (
                <div
                  key={folder.id}
                  className="folder-group"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropOnFolder(folder.id)}
                >
                  <div
                    className="folder-header"
                    onClick={() => dispatch({ type: 'TOGGLE_FOLDER', folderId: folder.id })}
                  >
                    <span className="folder-arrow">{folder.isOpen ? '▼' : '▶'}</span>
                    {editingFolderId === folder.id ? (
                      <input
                        className="rename-input"
                        value={editingFolderName}
                        onChange={(e) => setEditingFolderName(e.target.value)}
                        onBlur={commitRenameFolder}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRenameFolder();
                          if (e.key === 'Escape') setEditingFolderId(null);
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <span className="folder-name">📁 {folder.name}</span>
                        <span className="folder-count">({folderChats.length})</span>
                      </>
                    )}
                    <div className="folder-actions">
                      <button
                        className="icon-btn"
                        title="Add chat"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateChat(folder.id);
                        }}
                      >
                        +
                      </button>
                      <button
                        className="icon-btn"
                        title="Rename"
                        onClick={(e) => {
                          e.stopPropagation();
                          startRenameFolder(folder.id, folder.name);
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="icon-btn"
                        title="Delete folder"
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch({ type: 'DELETE_FOLDER', folderId: folder.id });
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  {folder.isOpen && (
                    <div className="folder-chats">
                      {folderChats.length === 0 && (
                        <div className="folder-empty">Drop chats here</div>
                      )}
                      {folderChats.map(renderChat)}
                    </div>
                  )}
                </div>
              );
            })}

            <div
              className="unfoldered-section"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropOnRoot}
            >
              {state.folders.length > 0 && unfolderedChats.length > 0 && (
                <div className="section-label">Ungrouped</div>
              )}
              {unfolderedChats.map(renderChat)}
            </div>
          </div>

          <div className="left-pane-footer">
            <div className="settings-item">⚙️ Settings</div>
          </div>
        </>
      )}
    </div>
  );
}
