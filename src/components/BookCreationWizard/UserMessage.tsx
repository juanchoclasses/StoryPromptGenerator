import React from 'react';
import { Box, Paper, Typography, Avatar } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import type { Message } from '../../types/Wizard';

/**
 * Props for UserMessage component
 */
export interface UserMessageProps {
  /** The message to display */
  message: Message;
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
 * UserMessage Component
 * 
 * Displays user's messages in the conversation.
 * 
 * Features:
 * - Right-aligned bubble layout
 * - User avatar/icon
 * - Timestamp display
 * - Distinct styling from assistant messages
 * - Accessible with proper ARIA roles
 */
export const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  const timestamp = formatTimestamp(message.timestamp);
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        mb: 2,
        px: { xs: 1, sm: 2 }
      }}
      role="article"
      aria-label="User message"
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          maxWidth: { xs: '85%', sm: '70%' },
          flexDirection: 'row-reverse'
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'primary.main',
            flexShrink: 0
          }}
          aria-label="User avatar"
        >
          <PersonIcon sx={{ fontSize: '1.25rem' }} />
        </Avatar>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              borderRadius: 2,
              borderTopRightRadius: 4
            }}
          >
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
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
