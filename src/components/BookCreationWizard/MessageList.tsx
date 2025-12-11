import React, { useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { SystemMessage } from './SystemMessage';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import type { Message } from '../../types/Wizard';

/**
 * Props for MessageList component
 */
export interface MessageListProps {
  /** Array of messages to display */
  messages: Message[];
  /** Whether the assistant is currently processing */
  isProcessing?: boolean;
  /** Whether to auto-scroll to bottom on new messages */
  autoScroll?: boolean;
}

/**
 * MessageList Component
 * 
 * Scrollable container for displaying conversation messages.
 * 
 * Features:
 * - Scrollable container for messages
 * - Auto-scroll to bottom on new messages
 * - Renders appropriate message component based on role
 * - Loading indicator when processing
 * - Empty state (no messages yet)
 * - Smooth scrolling animations
 * - Accessible with proper ARIA roles
 */
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isProcessing = false,
  autoScroll = true
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  /**
   * Scroll to bottom of message list
   */
  const scrollToBottom = () => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  };
  
  // Auto-scroll when messages change or processing state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isProcessing]);
  
  /**
   * Render the appropriate message component based on role
   */
  const renderMessage = (message: Message) => {
    switch (message.role) {
      case 'system':
        return <SystemMessage key={message.id} message={message} />;
      case 'user':
        return <UserMessage key={message.id} message={message} />;
      case 'assistant':
        return <AssistantMessage key={message.id} message={message} />;
      default:
        return null;
    }
  };
  
  // Empty state
  if (messages.length === 0 && !isProcessing) {
    return (
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4
        }}
        role="log"
        aria-label="Message list"
        aria-live="polite"
      >
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          No messages yet. Start the conversation!
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box
      ref={containerRef}
      sx={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        py: 2,
        '&::-webkit-scrollbar': {
          width: '8px'
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent'
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'divider',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }
      }}
      role="log"
      aria-label="Message list"
      aria-live="polite"
    >
      {/* Render all messages */}
      {messages.map(renderMessage)}
      
      {/* Loading indicator */}
      {isProcessing && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: { xs: 1, sm: 2 },
            py: 2
          }}
          role="status"
          aria-label="Processing message"
        >
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Thinking...
          </Typography>
        </Box>
      )}
      
      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </Box>
  );
};
