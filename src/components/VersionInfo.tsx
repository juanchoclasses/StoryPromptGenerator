import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { CURRENT_VERSION } from '../types/Story';

export const VersionInfo: React.FC = () => {
  const [dataVersion, setDataVersion] = useState<string>('');
  const [migrationStatus, setMigrationStatus] = useState<'current' | 'migrated' | 'error'>('current');

  useEffect(() => {
    const checkVersion = () => {
      try {
        const stored = localStorage.getItem('story-data');
        if (stored) {
          const data = JSON.parse(stored);
          const version = data.version || '0.0.0';
          setDataVersion(version);
          
          if (version === CURRENT_VERSION) {
            setMigrationStatus('current');
          } else {
            setMigrationStatus('migrated');
          }
        } else {
          setDataVersion(CURRENT_VERSION);
          setMigrationStatus('current');
        }
      } catch (error) {
        setMigrationStatus('error');
        console.error('Error checking version:', error);
      }
    };

    checkVersion();
  }, []);

  const getStatusIcon = () => {
    switch (migrationStatus) {
      case 'current':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'migrated':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'error':
        return <WarningIcon color="error" fontSize="small" />;
      default:
        return <InfoIcon color="info" fontSize="small" />;
    }
  };



  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Tooltip title={`Data version: ${dataVersion}`}>
        <Chip
          icon={getStatusIcon()}
          label={`v${dataVersion}`}
          size="small"
          variant="outlined"
          color={migrationStatus === 'error' ? 'error' : 'default'}
        />
      </Tooltip>
      {migrationStatus === 'migrated' && (
        <Tooltip title="Your data was automatically migrated to the latest version">
          <IconButton size="small" color="success">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}; 