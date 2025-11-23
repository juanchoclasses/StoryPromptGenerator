import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import { ImageGenerationService } from '../services/imageGenerationService';

interface AspectRatio {
  id: string;
  label: string;
  value: string;
  description: string;
}

interface LLMModel {
  id: string;
  name: string;
  description: string;
}

interface ExperimentResult {
  model: string;
  aspectRatio: string;
  status: 'pending' | 'success' | 'error';
  imageUrl?: string;
  error?: string;
  timestamp?: number;
  actualDimensions?: { width: number; height: number };
  actualAspectRatio?: string;
  aspectRatioMatch?: 'pass' | 'fail' | 'pending';
}

const ASPECT_RATIOS: AspectRatio[] = [
  { id: '1:1', label: '1:1', value: '1:1', description: 'Square' },
  { id: '2:3', label: '2:3', value: '2:3', description: 'Portrait (Narrow)' },
  { id: '3:2', label: '3:2', value: '3:2', description: 'Landscape (35mm)' },
  { id: '3:4', label: '3:4', value: '3:4', description: 'Portrait (Book)' },
  { id: '4:3', label: '4:3', value: '4:3', description: 'Landscape (Classic)' },
  { id: '4:5', label: '4:5', value: '4:5', description: 'Portrait (Art)' },
  { id: '5:4', label: '5:4', value: '5:4', description: 'Landscape (Art)' },
  { id: '9:16', label: '9:16', value: '9:16', description: 'Vertical (Mobile)' },
  { id: '16:9', label: '16:9', value: '16:9', description: 'Widescreen' },
  { id: '21:9', label: '21:9', value: '21:9', description: 'Ultrawide' },
];

const LLM_MODELS: LLMModel[] = [
  {
    id: 'google/gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash',
    description: 'Fast & versatile'
  },
  {
    id: 'openai/gpt-5-image-mini',
    name: 'GPT-5 Image Mini',
    description: 'OpenAI image model'
  },
  {
    id: 'google/gemini-2.0-flash-exp:image',
    name: 'Gemini 2.0 Flash Exp',
    description: 'Experimental version'
  },
  {
    id: 'google/gemini-exp-1206:image',
    name: 'Gemini Exp 1206',
    description: 'Experimental build'
  },
];

// Utility function to load image and get dimensions
const loadImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
};

// Utility function to calculate GCD for simplifying ratios
const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b);
};

// Utility function to simplify aspect ratio
const simplifyAspectRatio = (width: number, height: number): string => {
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
};

// Utility function to compare aspect ratios with tolerance
const compareAspectRatios = (requested: string, actual: string): boolean => {
  // First check if they're exactly the same (e.g., "1:1" === "1:1")
  if (requested === actual) {
    return true;
  }
  
  const parseRatio = (ratio: string): number => {
    const [w, h] = ratio.split(':').map(Number);
    return w / h;
  };
  
  const requestedValue = parseRatio(requested);
  const actualValue = parseRatio(actual);
  
  // Allow only 1% tolerance for minor rounding differences
  // This is strict enough to catch real mismatches but lenient enough
  // for cases like 1024x768 (which might be 1.333333 vs requested 4:3 = 1.333...)
  const tolerance = 0.01;
  const difference = Math.abs(requestedValue - actualValue) / requestedValue;
  
  return difference <= tolerance;
};

export const ExperimentPanel: React.FC = () => {
  const [prompt, setPrompt] = useState('A serene mountain landscape at sunset with a lake in the foreground');
  const [selectedRatios, setSelectedRatios] = useState<string[]>(['1:1', '3:4', '16:9']);
  const [customRatios, setCustomRatios] = useState<AspectRatio[]>([]);
  const [customRatioInput, setCustomRatioInput] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>(['google/gemini-2.5-flash-image']);
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRatioToggle = (ratioId: string) => {
    setSelectedRatios(prev =>
      prev.includes(ratioId)
        ? prev.filter(r => r !== ratioId)
        : [...prev, ratioId]
    );
  };

  const handleModelToggle = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(m => m !== modelId)
        : [...prev, modelId]
    );
  };

  const handleAddCustomRatio = () => {
    if (!customRatioInput.match(/^\d+:\d+$/)) {
      // Basic validation
      return;
    }
    
    const newRatio: AspectRatio = {
      id: customRatioInput,
      label: customRatioInput,
      value: customRatioInput,
      description: 'Custom'
    };
    
    // Check if it already exists
    if (ASPECT_RATIOS.some(r => r.id === newRatio.id) || customRatios.some(r => r.id === newRatio.id)) {
      setCustomRatioInput('');
      if (!selectedRatios.includes(newRatio.id)) {
        setSelectedRatios(prev => [...prev, newRatio.id]);
      }
      return;
    }
    
    setCustomRatios(prev => [...prev, newRatio]);
    setSelectedRatios(prev => [...prev, newRatio.id]);
    setCustomRatioInput('');
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return;
    }

    if (selectedRatios.length === 0 || selectedModels.length === 0) {
      return;
    }

    setIsGenerating(true);
    
    // Create initial results grid
    const initialResults: ExperimentResult[] = [];
    for (const model of selectedModels) {
      for (const ratio of selectedRatios) {
        initialResults.push({
          model,
          aspectRatio: ratio,
          status: 'pending'
        });
      }
    }
    setResults(initialResults);

    // Generate images sequentially (to avoid rate limiting)
    for (let i = 0; i < initialResults.length; i++) {
      const result = initialResults[i];
      
      try {
        console.log(`Generating image ${i + 1}/${initialResults.length}: ${result.model} @ ${result.aspectRatio}`);
        
        const generationResult = await ImageGenerationService.generateImage({
          prompt,
          model: result.model,
          aspectRatio: result.aspectRatio
        });

        if (generationResult.success && generationResult.imageUrl) {
          // Validate image dimensions
          try {
            const dimensions = await loadImageDimensions(generationResult.imageUrl);
            const actualRatio = simplifyAspectRatio(dimensions.width, dimensions.height);
            const isMatch = compareAspectRatios(result.aspectRatio, actualRatio);
            
            console.log(`Image dimensions: ${dimensions.width}x${dimensions.height}, Actual ratio: ${actualRatio}, Match: ${isMatch}`);

            setResults(prev => prev.map((r, idx) => 
              idx === i
                ? {
                    ...r,
                    status: 'success',
                    imageUrl: generationResult.imageUrl,
                    timestamp: Date.now(),
                    actualDimensions: dimensions,
                    actualAspectRatio: actualRatio,
                    aspectRatioMatch: isMatch ? 'pass' : 'fail'
                  }
                : r
            ));
          } catch (dimensionError) {
            console.error('Error validating dimensions:', dimensionError);
            setResults(prev => prev.map((r, idx) => 
              idx === i
                ? {
                    ...r,
                    status: 'success',
                    imageUrl: generationResult.imageUrl,
                    timestamp: Date.now(),
                    aspectRatioMatch: 'pending'
                  }
                : r
            ));
          }
        } else {
          setResults(prev => prev.map((r, idx) => 
            idx === i
              ? {
                  ...r,
                  status: 'error',
                  error: generationResult.error,
                  timestamp: Date.now()
                }
              : r
          ));
        }

        // Add a small delay between requests to avoid rate limiting
        if (i < initialResults.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Error generating image:', error);
        setResults(prev => prev.map((r, idx) => 
          idx === i
            ? {
                ...r,
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: Date.now()
              }
            : r
        ));
      }
    }

    setIsGenerating(false);
  };

  const handleSelectAllRatios = () => {
    const allRatios = [...ASPECT_RATIOS, ...customRatios];
    if (selectedRatios.length === allRatios.length) {
      setSelectedRatios([]);
    } else {
      setSelectedRatios(allRatios.map(r => r.id));
    }
  };

  const handleSelectAllModels = () => {
    if (selectedModels.length === LLM_MODELS.length) {
      setSelectedModels([]);
    } else {
      setSelectedModels(LLM_MODELS.map(m => m.id));
    }
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          🧪 Image Generation Experiments
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Test how different LLMs handle various aspect ratios. Generate images with the same prompt across multiple models and aspect ratios to compare flexibility and quality.
        </Typography>

        {/* Prompt Input */}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Test Prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          sx={{ mb: 3 }}
          placeholder="Enter a descriptive prompt to test across different configurations..."
        />

        <Grid container spacing={3}>
          {/* Aspect Ratios */}
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset" fullWidth>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <FormLabel component="legend">Aspect Ratios</FormLabel>
                <Button size="small" onClick={handleSelectAllRatios}>
                  {selectedRatios.length === [...ASPECT_RATIOS, ...customRatios].length ? 'Deselect All' : 'Select All'}
                </Button>
              </Box>
              <FormGroup>
                {[...ASPECT_RATIOS, ...customRatios].map(ratio => (
                  <FormControlLabel
                    key={ratio.id}
                    control={
                      <Checkbox
                        checked={selectedRatios.includes(ratio.id)}
                        onChange={() => handleRatioToggle(ratio.id)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ minWidth: 40, fontWeight: 'bold' }}>
                          {ratio.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {ratio.description}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="e.g., 32:9"
                  value={customRatioInput}
                  onChange={(e) => setCustomRatioInput(e.target.value)}
                  helperText="Add custom ratio (W:H)"
                />
                <Button 
                  variant="outlined" 
                  onClick={handleAddCustomRatio}
                  disabled={!customRatioInput.match(/^\d+:\d+$/)}
                >
                  Add
                </Button>
              </Box>
            </FormControl>
          </Grid>

          {/* LLM Models */}
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset" fullWidth>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <FormLabel component="legend">LLM Models</FormLabel>
                <Button size="small" onClick={handleSelectAllModels}>
                  {selectedModels.length === LLM_MODELS.length ? 'Deselect All' : 'Select All'}
                </Button>
              </Box>
              <FormGroup>
                {LLM_MODELS.map(model => (
                  <FormControlLabel
                    key={model.id}
                    control={
                      <Checkbox
                        checked={selectedModels.includes(model.id)}
                        onChange={() => handleModelToggle(model.id)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {model.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {model.description}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            </FormControl>
          </Grid>
        </Grid>

        {/* Generate Button */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim() || selectedRatios.length === 0 || selectedModels.length === 0}
          >
            {isGenerating ? 'Generating...' : 'Generate Experiments'}
          </Button>
          {isGenerating && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                {results.filter(r => r.status !== 'pending').length} / {results.length} completed
              </Typography>
            </Box>
          )}
        </Box>

        {selectedRatios.length > 0 && selectedModels.length > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Will generate <strong>{selectedRatios.length * selectedModels.length} images</strong>
            {' '}({selectedModels.length} models {'\u00D7'} {selectedRatios.length} aspect ratios)
          </Alert>
        )}
      </Paper>

      {/* Results Grid */}
      {results.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Results
          </Typography>
          
          {/* Summary Statistics */}
          {results.some(r => r.aspectRatioMatch) && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Aspect Ratio Validation Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {results.filter(r => r.aspectRatioMatch === 'pass').length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pass
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {results.filter(r => r.aspectRatioMatch === 'fail').length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Fail
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main">
                      {results.filter(r => r.status === 'error').length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Error
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="text.secondary">
                      {results.filter(r => r.status === 'pending').length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pending
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Success Rate: {' '}
                  <strong>
                    {results.filter(r => r.aspectRatioMatch === 'pass').length > 0
                      ? Math.round(
                          (results.filter(r => r.aspectRatioMatch === 'pass').length /
                            results.filter(r => r.status !== 'pending').length) *
                            100
                        )
                      : 0}
                    %
                  </strong>
                  {' '}of completed images match the requested aspect ratio
                </Typography>
              </Box>
              
              {/* Per-Model Summary */}
              {selectedModels.length > 1 && results.filter(r => r.aspectRatioMatch).length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Model Performance
                  </Typography>
                  <Grid container spacing={1}>
                    {selectedModels.map(modelId => {
                      const modelResults = results.filter(r => r.model === modelId);
                      const passCount = modelResults.filter(r => r.aspectRatioMatch === 'pass').length;
                      const completedCount = modelResults.filter(r => r.status !== 'pending').length;
                      const successRate = completedCount > 0 ? Math.round((passCount / completedCount) * 100) : 0;
                      const model = LLM_MODELS.find(m => m.id === modelId);
                      
                      return (
                        <Grid item xs={12} sm={6} key={modelId}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption">
                              {model?.name || modelId}
                            </Typography>
                            <Chip 
                              label={`${successRate}%`}
                              size="small"
                              color={successRate >= 80 ? 'success' : successRate >= 50 ? 'warning' : 'error'}
                            />
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}
            </Box>
          )}
          
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={2}>
            {results.map((result, idx) => {
              const model = LLM_MODELS.find(m => m.id === result.model);
              const ratio = [...ASPECT_RATIOS, ...customRatios].find(r => r.id === result.aspectRatio);

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {result.status === 'pending' && (
                      <Box
                        sx={{
                          height: 200,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'grey.100'
                        }}
                      >
                        <CircularProgress />
                      </Box>
                    )}
                    
                    {result.status === 'success' && result.imageUrl && (
                      <CardMedia
                        component="img"
                        image={result.imageUrl}
                        alt={`${model?.name} @ ${ratio?.label}`}
                        sx={{ height: 200, objectFit: 'contain', bgcolor: 'grey.100' }}
                      />
                    )}
                    
                    {result.status === 'error' && (
                      <Box
                        sx={{
                          height: 200,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'error.light',
                          p: 2
                        }}
                      >
                        <Typography variant="body2" color="error" align="center">
                          ❌ Failed
                        </Typography>
                      </Box>
                    )}

                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          label={ratio?.label || result.aspectRatio} 
                          size="small" 
                          color="primary"
                        />
                        <Chip
                          label={result.status}
                          size="small"
                          color={
                            result.status === 'success' ? 'success' :
                            result.status === 'error' ? 'error' :
                            'default'
                          }
                        />
                        {result.aspectRatioMatch && (
                          <Chip
                            label={result.aspectRatioMatch === 'pass' ? '✓ Match' : '✗ Mismatch'}
                            size="small"
                            color={result.aspectRatioMatch === 'pass' ? 'success' : 'warning'}
                          />
                        )}
                      </Box>
                      
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {model?.name || result.model}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {ratio?.description}
                      </Typography>

                      {result.actualDimensions && (
                        <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            <strong>Requested:</strong> {result.aspectRatio}
                            {' '}
                            <span style={{ color: '#666' }}>
                              ({(() => {
                                const [w, h] = result.aspectRatio.split(':').map(Number);
                                return (w / h).toFixed(4);
                              })()})
                            </span>
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            <strong>Actual:</strong> {(() => {
                              // Use requested width, calculate proportional height
                              const requestedWidth = Number(result.aspectRatio.split(':')[0]);
                              const actualDecimal = result.actualDimensions!.width / result.actualDimensions!.height;
                              const proportionalHeight = requestedWidth / actualDecimal;
                              return `${requestedWidth}:${proportionalHeight.toFixed(3)}`;
                            })()}
                            {' '}
                            <span style={{ color: '#666' }}>
                              ({(() => {
                                const actualDecimal = result.actualDimensions!.width / result.actualDimensions!.height;
                                return actualDecimal.toFixed(4);
                              })()})
                            </span>
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                            {result.actualDimensions.width} × {result.actualDimensions.height} px
                          </Typography>
                        </Box>
                      )}

                      {result.error && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          <Typography variant="caption">
                            {result.error}
                          </Typography>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

