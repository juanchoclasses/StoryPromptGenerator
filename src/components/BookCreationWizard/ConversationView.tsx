import React from 'react';
import { Box, Alert, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import type { Message } from '../../types/Wizard';
import type { QuickAction } from './MessageInput';

/**
 * Props for ConversationView component
 */
export interface ConversationViewProps {
  /** Array of messages in the conversation */
  messages: Message[];
  /** Whether the assistant is currently processing */
  isProcessing?: boolean;
  /** Callback when user sends a message */
  onSendMessage: (content: string) => void;
  /** Error message to display (if any) */
  error?: string | null;
  /** Callback to retry after an error */
  onRetry?: () => void;
  /** Callback to clear the conversation */
  onClearConversation?: () => void;
  /** Optional quick action buttons */
  quickActions?: QuickAction[];
  /** Placeholder text for message input */
  placeholder?: string;
}

/**
 * ConversationView Component
 * 
 * Combines MessageList and MessageInput into a complete conversation interface.
 * 
 * Features:
 * - MessageList fills available space
 * - MessageInput fixed at bottom
 * - Error display with retry button
 * - Loading state handling
 * - Optional quick actions
 * - Responsive layout
 * - Accessible container
 */
export const ConversationView: React.FC<ConversationViewProps> = ({
  messages,
  isProcessing = false,
  onSendMessage,
  error = null,
  onRetry,
  onClearConversation,
  quickActions = [],
  placeholder = 'Type your message...'
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}
      role="region"
      aria-label="Conversation"
    >
      {/* Error display */}
      {error && (
        <Box sx={{ p: 2, pb: 0 }}>
          <Alert
            severity="error"
            action={
              onRetry && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={onRetry}
                  startIcon={<RefreshIcon />}
                  aria-label="Retry"
                >
                  Retry
                </Button>
              )
            }
          >
            {error}
          </Alert>
        </Box>
      )}
      
      {/* Message list - fills available space */}
      <MessageList
        messages={messages}
        isProcessing={isProcessing}
        autoScroll={true}
      />
      
      {/* Message input - fixed at bottom */}
      <MessageInput
        onSendMessage={onSendMessage}
        disabled={isProcessing}
        placeholder={placeholder}
        quickActions={quickActions}
        autoFocus={messages.length === 0}
      />
    </Box>
  );
};
