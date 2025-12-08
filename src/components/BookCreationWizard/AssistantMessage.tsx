import React from 'react';
import { Box, Paper, Typography, Avatar, CircularProgress } from '@mui/material';
import { SmartToy as AIIcon } from '@mui/icons-material';
import type { Message } from '../../types/Wizard';

/**
 * Props for AssistantMessage component
 */
export interface AssistantMessageProps {
  /** The message to display */
  message?: Message;
  
  /** Whether the assistant is currently typing/processing */
  isLoading?: boolean;
}

/**
 * Format timestamp for display
 */
const formatTimestamp = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

/**
 * AssistantMessage Component
 * 
 * Displays AI assistant responses in the conversation.
 * 
 * Features:
 * - Left-aligned bubble layout
 * - AI avatar/icon
 * - Timestamp display
 * - Support for rich content (markdown, code blocks)
 * - Loading state with typing indicator
 * - Accessible with proper ARIA roles
 */
export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  message,
  isLoading = false
}) => {
  // Show loading state if no message and isLoading is true
  if (isLoading && !message) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          mb: 2,
          px: { xs: 1, sm: 2 }
        }}
        role="status"
        aria-label="Assistant is typing"
        aria-live="polite"
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,
            maxWidth: { xs: '85%', sm: '70%' }
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'secondary.main',
              flexShrink: 0
            }}
            aria-label="AI assistant avatar"
          >
            <AIIcon sx={{ fontSize: '1.25rem' }} />
          </Avatar>
          
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              backgroundColor: 'background.paper',
              borderRadius: 2,
              borderTopLeftRadius: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              Thinking...
            </Typography>
          </Paper>
        </Box>
      </Box>
    );
  }
  
  // Don't render if no message
  if (!message) {
    return null;
  }
  
  const timestamp = formatTimestamp(message.timestamp);
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        mb: 2,
        px: { xs: 1, sm: 2 }
      }}
      role="article"
      aria-label="Assistant message"
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          maxWidth: { xs: '85%', sm: '70%' }
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'secondary.main',
            flexShrink: 0
          }}
          aria-label="AI assistant avatar"
        >
          <AIIcon sx={{ fontSize: '1.25rem' }} />
        </Avatar>
        
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              backgroundColor: 'background.paper',
              borderRadius: 2,
              borderTopLeftRadius: 4
            }}
          >
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                '& code': {
                  backgroundColor: 'action.hover',
                  padding: '2px 6px',
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.875em'
                },
                '& pre': {
                  backgroundColor: 'action.hover',
                  padding: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  '& code': {
                    backgroundColor: 'transparent',
                    padding: 0
                  }
                }
              }}
            >
              {message.content}
            </Typography>
          </Paper>
          
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              mt: 0.5,
              px: 1
            }}
            aria-label={`Sent at ${timestamp}`}
          >
            {timestamp}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
