import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  X, 
  Maximize2, 
  Minimize2, 
  Smile, 
  Hash, 
  Users,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DEFAULT_TEAM_MESSAGES = [
  {
    id: 1,
    sender: "Harsh Saini",
    role: "Super Admin",
    initials: "HS",
    color: "#8b5cf6",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    time: "10:02 AM",
    text: "Hey team! Let's finalize the API structure and payroll integrations today.",
    reactions: [{ emoji: "👍", count: 2, reacted: true }]
  },
  {
    id: 2,
    sender: "Rohit Jangra",
    role: "Frontend Lead",
    initials: "RJ",
    color: "#3b82f6",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    time: "10:05 AM",
    text: "Sure! I'll share the draft endpoints and test the floating messages widget.",
    reactions: [{ emoji: "👍", count: 1, reacted: false }]
  },
  {
    id: 3,
    sender: "Kartik Sharma",
    role: "Backend Lead",
    initials: "KS",
    color: "#f59e0b",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80",
    time: "10:07 AM",
    text: "Working on database relationships and activity logging. Will update in a bit.",
    reactions: [{ emoji: "🚀", count: 3, reacted: true }]
  },
  {
    id: 4,
    sender: "Priya Verma",
    role: "UI/UX Designer",
    initials: "PV",
    color: "#ec4899",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    time: "10:10 AM",
    text: "I've reviewed the layout designs and direct message drawer. Looks super clean!",
    reactions: [{ emoji: "❤️", count: 2, reacted: false }]
  }
];

const CHANNELS = [
  { id: 'project-team', name: 'Project-Team', unread: 0, members: 8 },
  { id: 'engineering', name: 'Engineering', unread: 2, members: 14 },
  { id: 'announcements', name: 'Announcements', unread: 0, members: 26 },
];

const FloatingMessages = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0]);
  const [messages, setMessages] = useState(DEFAULT_TEAM_MESSAGES);
  const [inputText, setInputText] = useState('');
  const chatScrollRef = useRef(null);

  // Load live team chat if available from API
  useEffect(() => {
    const fetchLiveChat = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data?.data?.teamChat && res.data.data.teamChat.length > 0) {
          setMessages(res.data.data.teamChat);
        }
      } catch (e) {
        // use default team messages
      }
    };
    fetchLiveChat();
  }, []);

  // Auto scroll to latest message when open or when messages change
  useEffect(() => {
    if (isOpen && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [isOpen, messages]);

  // Send team message
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: user?.fullname || "Harsh Saini",
      role: user?.role || "Super Admin",
      initials: (user?.fullname || "Harsh Saini")
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      color: "#6366f1",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: inputText.trim(),
      reactions: []
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 40);
  };

  // Toggle emoji reaction
  const handleReactionClick = (msgId, emojiStr) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        const existing = (m.reactions || []).find(r => r.emoji === emojiStr);
        if (existing) {
          return {
            ...m,
            reactions: m.reactions.map(r => r.emoji === emojiStr ? {
              ...r,
              count: r.reacted ? r.count - 1 : r.count + 1,
              reacted: !r.reacted
            } : r).filter(r => r.count > 0)
          };
        } else {
          return {
            ...m,
            reactions: [...(m.reactions || []), { emoji: emojiStr, count: 1, reacted: true }]
          };
        }
      }
      return m;
    }));
  };

  // 1. COLLAPSED FLOATING ACTION BUTTON (Text and avatars removed, animated circular button with flight hover & beacon)
  if (!isOpen) {
    return (
      <button 
        id="floating-team-messages-btn"
        className="floating-msg-btn"
        onClick={() => setIsOpen(true)}
        aria-label="Open Team Messages"
        style={{ outline: 'none' }}
      >
        {/* Glowing aura ping underlay on hover */}
        <span 
          className="floating-msg-glow"
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            zIndex: -1,
            filter: 'blur(8px)',
            pointerEvents: 'none'
          }}
        />

        {/* Paper Plane / Messenger flight icon */}
        <svg 
          width="21" 
          height="21" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#ffffff" 
          strokeWidth="2.3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="floating-msg-arrow"
        >
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>

        {/* Online beacon badge with animated radar pulse wave */}
        <span 
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '12px',
            height: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <span 
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              animation: 'beaconWaveRing 2s cubic-bezier(0, 0, 0.2, 1) infinite'
            }} 
          />
          <span 
            style={{
              position: 'relative',
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              border: '2px solid #151822',
              boxShadow: '0 0 8px #10b981'
            }} 
          />
        </span>

        {/* Floating tooltip preview on hover */}
        <div className="floating-msg-tooltip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
            <span>Team Chat</span>
            <span style={{ opacity: 0.65, fontSize: '10px' }}>· 8 online</span>
          </div>
        </div>
      </button>
    );
  }

  // 2. EXPANDED TEAM CHAT DRAWER (Matches Image 3 Structure, pure Team Message content)
  const windowWidth = isExpanded ? '460px' : '360px';
  const windowHeight = isExpanded ? '640px' : '530px';

  return (
    <div 
      id="floating-team-messages-drawer"
      style={{
        position: 'fixed',
        bottom: '22px',
        right: '24px',
        width: windowWidth,
        height: windowHeight,
        maxHeight: 'calc(100vh - 44px)',
        zIndex: 9999,
        backgroundColor: '#1b1d22',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#f3f4f6',
        animation: 'drawerSpringOpen 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Header bar matching Image 3 */}
      <div style={{
        padding: '14px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        backgroundColor: '#17191e'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            color: '#a5b4fc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Hash size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '-0.2px' }}>
                Team Chat
              </h3>
              <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 650, backgroundColor: 'rgba(99, 102, 241, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                #{activeChannel.name}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: '#10b981', marginTop: '1px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
              <span>{activeChannel.members} members online</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease'
            }}
            title={isExpanded ? "Collapse width" : "Expand width"}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease'
            }}
            title="Close"
          >
            <X size={19} />
          </button>
        </div>
      </div>

      {/* Team Channels Pill Tabs */}
      <div style={{
        padding: '8px 14px',
        backgroundColor: '#1b1d22',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflowX: 'auto'
      }}>
        {CHANNELS.map(ch => {
          const isActive = ch.id === activeChannel.id;
          return (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch)}
              style={{
                padding: '4px 10px',
                borderRadius: '20px',
                border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? '#a5b4fc' : '#9ca3af',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Hash size={11} />
              {ch.name}
              {ch.unread > 0 && (
                <span style={{ 
                  backgroundColor: '#ef4444', 
                  color: '#ffffff', 
                  fontSize: '9px', 
                  padding: '1px 5px', 
                  borderRadius: '10px' 
                }}>
                  {ch.unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Team Chat Messages Stream */}
      <div 
        ref={chatScrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: '#15171b',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.12) transparent'
        }}
      >
        {messages.map((msg) => {
          const isCurrentUser = msg.sender === (user?.fullname || "Harsh Saini");

          return (
            <div 
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                maxWidth: '92%',
                alignSelf: isCurrentUser ? 'flex-end' : 'flex-start'
              }}
            >
              {/* Sender info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexDirection: isCurrentUser ? 'row-reverse' : 'row'
              }}>
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: msg.color || '#6366f1',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 800,
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {msg.avatar ? (
                    <img 
                      src={msg.avatar} 
                      alt={msg.sender}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : null}
                  <span>{msg.initials}</span>
                </div>

                <span style={{ fontSize: '11.5px', fontWeight: 650, color: '#f3f4f6' }}>
                  {msg.sender}
                </span>

                <span style={{ fontSize: '9.5px', color: '#6b7280' }}>
                  {msg.time}
                </span>
              </div>

              {/* Message text bubble */}
              <div 
                style={{
                  padding: '9px 13px',
                  borderRadius: isCurrentUser ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                  backgroundColor: isCurrentUser ? '#4f46e5' : '#232630',
                  border: isCurrentUser ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  lineHeight: 1.45,
                  wordBreak: 'break-word',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  marginLeft: isCurrentUser ? '0px' : '28px',
                  marginRight: isCurrentUser ? '28px' : '0px'
                }}
              >
                {msg.text}
              </div>

              {/* Emoji Reactions */}
              {msg.reactions && msg.reactions.length > 0 && (
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  marginLeft: isCurrentUser ? '0px' : '28px',
                  marginRight: isCurrentUser ? '28px' : '0px',
                  justifyContent: isCurrentUser ? 'flex-end' : 'flex-start'
                }}>
                  {msg.reactions.map((r, rIdx) => (
                    <button
                      key={rIdx}
                      onClick={() => handleReactionClick(msg.id, r.emoji)}
                      style={{
                        background: r.reacted ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        border: r.reacted ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '1px 6px',
                        color: r.reacted ? '#a5b4fc' : '#9ca3af',
                        fontSize: '10px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{r.emoji}</span>
                      <span>{r.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Message Input Bar */}
      <form 
        onSubmit={handleSendMessage}
        style={{
          padding: '10px 14px',
          backgroundColor: '#1b1d22',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#242731',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '6px 12px',
          gap: '6px'
        }}>
          <input 
            type="text"
            placeholder={`Message #${activeChannel.name}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '12.5px',
              color: '#ffffff',
              outline: 'none'
            }}
          />
          <button
            type="button"
            onClick={() => setInputText(prev => prev + ' 👍')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '14px'
            }}
            title="Thumbs Up"
          >
            👍
          </button>
          <button
            type="button"
            onClick={() => setInputText(prev => prev + ' 🚀')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '14px'
            }}
            title="Rocket"
          >
            🚀
          </button>
        </div>

        <button
          type="submit"
          disabled={!inputText.trim()}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: inputText.trim() 
              ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
              : '#272932',
            border: 'none',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputText.trim() ? 'pointer' : 'default',
            transition: 'all 0.15s ease',
            flexShrink: 0
          }}
          title="Send Message"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};

export default FloatingMessages;
