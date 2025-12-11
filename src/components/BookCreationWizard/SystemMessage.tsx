import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import type { Message } from '../../types/Wizard';

/**
 * Props for SystemMessage component
 */
export interface SystemMessageProps {
  /** The message to display */
  message: Message;
}

/**
 * SystemMessage Component
 * 
 * Displays system instructions and guidance messages in the wizard.
 * These messages provide context, instructions, and helpful information
 * to guide the user through the wizard process.
 * 
 * Features:
 * - Light background with info icon
 * - Centered or full-width layout
 * - Clear visual distinction from user/assistant messages
 * - Accessible with proper ARIA roles
 */
export const SystemMessage: React.FC<SystemMessageProps> = ({ message }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        mb: 2,
        px: { xs: 1, sm: 2 }
      }}
      role="status"
      aria-label="System message"
    >
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          p: 2,
          maxWidth: '800px',
          width: '100%',
          backgroundColor: 'info.lighter',
          border: '1px solid',
          borderColor: 'info.light'
        }}
      >
        <InfoIcon
          sx={{
            color: 'info.main',
            fontSize: '1.25rem',
            mt: 0.25,
            flexShrink: 0
          }}
          aria-hidden="true"
        />
        <Typography
          variant="body2"
          sx={{
            color: 'text.primary',
            lineHeight: 1.6
          }}
        >
          {message.content}
        </Typography>
      </Paper>
    </Box>
  );
};
