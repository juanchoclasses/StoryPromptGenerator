import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Button, Chip, Tooltip } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

/**
 * Props for MessageInput component
 */
export interface MessageInputProps {
  /** Callback when user sends a message */
  onSendMessage: (content: string) => void;
  /** Whether the input is disabled (e.g., during processing) */
  disabled?: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Optional quick action buttons for common responses */
  quickActions?: QuickAction[];
  /** Maximum character count (optional) */
  maxLength?: number;
  /** Auto-focus on mount */
  autoFocus?: boolean;
}

/**
 * Quick action button configuration
 */
export interface QuickAction {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Message content to send when clicked */
  value: string;
}

/**
 * MessageInput Component
 * 
 * Multi-line text input for user messages in the wizard conversation.
 * 
 * Features:
 * - Multi-line text input (TextField)
 * - Send button (Enter key or click)
 * - Quick action buttons for common responses
 * - Character count indicator
 * - Disabled state when processing
 * - Auto-focus on mount
 * - Clear input after send
 * - Keyboard shortcuts (Enter to send, Shift+Enter for new line)
 * - Accessible with proper labels
 */
export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Type your message...',
  quickActions = [],
  maxLength,
  autoFocus = true
}) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  /**
   * Handle sending the message
   */
  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');
      
      // Re-focus input after sending
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };
  
  /**
   * Handle quick action button click
   */
  const handleQuickAction = (value: string) => {
    if (!disabled) {
      onSendMessage(value);
      setMessage('');
      
      // Re-focus input after quick action
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };
  
  /**
   * Handle key press events
   * - Enter: Send message
   * - Shift+Enter: New line
   */
  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };
  
  /**
   * Handle input change
   */
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    // Enforce max length if specified
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    
    setMessage(newValue);
  };
  
  const characterCount = message.length;
  const showCharacterCount = maxLength !== undefined;
  const isNearLimit = maxLength && characterCount > maxLength * 0.8;
  
  return (
    <Box
      sx={{
        p: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper'
      }}
    >
      {/* Quick action buttons */}
      {quickActions.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            mb: 1.5,
            flexWrap: 'wrap'
          }}
          role="group"
          aria-label="Quick response options"
        >
          {quickActions.map((action) => (
            <Chip
              key={action.id}
              label={action.label}
              onClick={() => handleQuickAction(action.value)}
              disabled={disabled}
              clickable
              size="small"
              sx={{
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText'
                }
              }}
              aria-label={`Quick response: ${action.label}`}
            />
          ))}
        </Box>
      )}
      
      {/* Message input */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'flex-end'
        }}
      >
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          minRows={1}
          maxRows={6}
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          variant="outlined"
          size="small"
          InputProps={{
            'aria-label': 'Message input'
          }}
          helperText={
            showCharacterCount ? (
              <Box
                component="span"
                sx={{
                  color: isNearLimit ? 'warning.main' : 'text.secondary'
                }}
                aria-live="polite"
                aria-label={`Character count: ${characterCount} of ${maxLength}`}
              >
                {characterCount} / {maxLength}
              </Box>
            ) : undefined
          }
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: disabled ? 'action.disabledBackground' : 'background.default'
            }
          }}
        />
        
        <Tooltip title={disabled ? 'Processing...' : 'Send message (Enter)'}>
          <span>
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={disabled || !message.trim()}
              size="large"
              aria-label="Send message"
              sx={{
                mb: showCharacterCount ? 2.5 : 0
              }}
            >
              <SendIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      
      {/* Keyboard hint */}
      <Box
        sx={{
          mt: 0.5,
          display: 'flex',
          justifyContent: 'flex-end'
        }}
      >
        <Box
          component="span"
          sx={{
            fontSize: '0.75rem',
            color: 'text.secondary'
          }}
          aria-label="Keyboard shortcuts"
        >
          Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for new line
        </Box>
      </Box>
    </Box>
  );
};
