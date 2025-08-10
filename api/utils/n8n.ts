import axios from 'axios';

interface ProcessImageParams {
  jobId: string;
  imageUrl: string;
  categoryType: string;
  style: string;
  userId: string;
}

interface N8NResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Process image with n8n workflow
 * @param params - Image processing parameters
 * @returns Promise that resolves when processing starts
 */
export async function processImageWithN8N(params: ProcessImageParams): Promise<N8NResponse> {
  console.log('🚀 [N8N DEBUG] Starting processImageWithN8N function with params:', {
    jobId: params.jobId,
    imageUrl: params.imageUrl?.substring(0, 50) + '...',
    categoryType: params.categoryType,
    style: params.style,
    userId: params.userId
  });

  try {
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    console.log('🔗 [N8N DEBUG] N8N Webhook URL:', n8nWebhookUrl);
    
    if (!n8nWebhookUrl) {
      console.error('❌ [N8N DEBUG] N8N webhook URL not configured');
      throw new Error('N8N webhook URL not configured');
    }

    const payload = {
      jobId: params.jobId,
      imageUrl: params.imageUrl,
      categoryType: params.categoryType,
      style: params.style,
      userId: params.userId,
      callbackUrl: `${process.env.API_BASE_URL}/api/images/webhook/job-complete`,
      timestamp: new Date().toISOString()
    };

    console.log('📦 [N8N DEBUG] Payload being sent to n8n:', {
      ...payload,
      imageUrl: payload.imageUrl?.substring(0, 50) + '...'
    });

    console.log('📡 [N8N DEBUG] Making POST request to n8n webhook...');
    const response = await axios.post(n8nWebhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ResimAI-Backend/1.0'
      },
      timeout: 30000 // 30 seconds timeout
    });

    console.log('📥 [N8N DEBUG] Response received from n8n:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });

    if (response.status === 200) {
      console.log('✅ [N8N DEBUG] N8N processing started successfully for job:', params.jobId);
      return {
        success: true,
        data: response.data
      };
    } else {
      console.error('❌ [N8N DEBUG] N8N returned non-200 status:', response.status);
      throw new Error(`N8N returned status ${response.status}`);
    }
  } catch (error: any) {
    console.error('💥 [N8N DEBUG] N8N processing error details:', {
      jobId: params.jobId,
      errorMessage: error.message,
      errorCode: error.code,
      responseStatus: error.response?.status,
      responseData: error.response?.data,
      requestConfig: {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout
      }
    });

    return {
      success: false,
      error: error.message || 'N8N processing failed'
    };
  }
}

/**
 * Get n8n workflow status
 * @param workflowId - N8N workflow ID
 * @returns Workflow status
 */
export async function getN8NWorkflowStatus(workflowId: string): Promise<N8NResponse> {
  try {
    const n8nApiUrl = process.env.N8N_API_URL;
    const n8nApiKey = process.env.N8N_API_KEY;
    
    if (!n8nApiUrl || !n8nApiKey) {
      throw new Error('N8N API configuration missing');
    }

    const response = await axios.get(`${n8nApiUrl}/workflows/${workflowId}`, {
      headers: {
        'Authorization': `Bearer ${n8nApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('N8N workflow status error:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to get workflow status'
    };
  }
}

/**
 * Get n8n execution status
 * @param executionId - N8N execution ID
 * @returns Execution status
 */
export async function getN8NExecutionStatus(executionId: string): Promise<N8NResponse> {
  try {
    const n8nApiUrl = process.env.N8N_API_URL;
    const n8nApiKey = process.env.N8N_API_KEY;
    
    if (!n8nApiUrl || !n8nApiKey) {
      throw new Error('N8N API configuration missing');
    }

    const response = await axios.get(`${n8nApiUrl}/executions/${executionId}`, {
      headers: {
        'Authorization': `Bearer ${n8nApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('N8N execution status error:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to get execution status'
    };
  }
}

/**
 * Cancel n8n execution
 * @param executionId - N8N execution ID
 * @returns Cancellation result
 */
export async function cancelN8NExecution(executionId: string): Promise<N8NResponse> {
  try {
    const n8nApiUrl = process.env.N8N_API_URL;
    const n8nApiKey = process.env.N8N_API_KEY;
    
    if (!n8nApiUrl || !n8nApiKey) {
      throw new Error('N8N API configuration missing');
    }

    const response = await axios.post(`${n8nApiUrl}/executions/${executionId}/stop`, {}, {
      headers: {
        'Authorization': `Bearer ${n8nApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('N8N execution cancellation error:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to cancel execution'
    };
  }
}

/**
 * Validate n8n webhook payload
 * @param payload - Webhook payload
 * @returns True if valid, false otherwise
 */
export function validateN8NWebhookPayload(payload: any): boolean {
  const requiredFields = ['jobId', 'status'];
  
  for (const field of requiredFields) {
    if (!payload[field]) {
      console.error(`Missing required field in n8n webhook: ${field}`);
      return false;
    }
  }

  const validStatuses = ['completed', 'failed', 'processing'];
  if (!validStatuses.includes(payload.status)) {
    console.error(`Invalid status in n8n webhook: ${payload.status}`);
    return false;
  }

  return true;
}

/**
 * Get category-specific processing parameters
 * @param categoryType - Category type
 * @param style - Style name
 * @returns Processing parameters
 */
export function getCategoryProcessingParams(categoryType: string, style: string) {
  const categoryParams: { [key: string]: any } = {
    'Corporate': {
      basePrompt: 'professional corporate headshot',
      styles: {
        'Klasik': { modifier: 'classic business attire, neutral background' },
        'Modern': { modifier: 'modern business style, contemporary office setting' },
        'Resmi': { modifier: 'formal business portrait, executive style' }
      }
    },
    'LinkedIn': {
      basePrompt: 'professional LinkedIn profile photo',
      styles: {
        'Profesyonel': { modifier: 'professional business attire, clean background' },
        'Samimi': { modifier: 'approachable professional look, warm lighting' },
        'Güvenilir': { modifier: 'trustworthy professional appearance, confident pose' }
      }
    },
    'Creative': {
      basePrompt: 'creative artistic portrait',
      styles: {
        'Sanatsal': { modifier: 'artistic creative style, unique composition' },
        'Renkli': { modifier: 'vibrant colorful creative portrait' },
        'Minimalist': { modifier: 'minimalist creative design, clean aesthetic' }
      }
    },
    'Avatar': {
      basePrompt: 'stylized avatar portrait',
      styles: {
        'Çizgi Film': { modifier: 'cartoon style avatar, animated look' },
        'Realistik': { modifier: 'realistic avatar style, detailed features' },
        'Fantastik': { modifier: 'fantasy avatar style, magical elements' }
      }
    },
    'Background': {
      basePrompt: 'background replacement',
      styles: {
        'Ofis': { modifier: 'professional office background' },
        'Doğa': { modifier: 'natural outdoor background' },
        'Stüdyo': { modifier: 'professional studio background' }
      }
    }
  };

  const category = categoryParams[categoryType];
  if (!category) {
    return {
      basePrompt: 'professional portrait',
      modifier: 'high quality, professional lighting'
    };
  }

  const styleConfig = category.styles[style];
  if (!styleConfig) {
    return {
      basePrompt: category.basePrompt,
      modifier: 'high quality, professional lighting'
    };
  }

  return {
    basePrompt: category.basePrompt,
    modifier: styleConfig.modifier
  };
}

/**
 * Generate processing prompt for AI
 * @param categoryType - Category type
 * @param style - Style name
 * @returns AI processing prompt
 */
export function generateProcessingPrompt(categoryType: string, style: string): string {
  const params = getCategoryProcessingParams(categoryType, style);
  return `${params.basePrompt}, ${params.modifier}, high resolution, professional quality`;
}

/**
 * Log n8n processing metrics
 * @param jobId - Job ID
 * @param startTime - Processing start time
 * @param endTime - Processing end time
 * @param status - Processing status
 */
export function logN8NMetrics(
  jobId: string,
  startTime: Date,
  endTime: Date,
  status: string
) {
  const duration = endTime.getTime() - startTime.getTime();
  
  console.log('N8N Processing Metrics:', {
    jobId,
    duration: `${duration}ms`,
    status,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString()
  });
}

/**
 * Retry n8n processing with exponential backoff
 * @param params - Processing parameters
 * @param maxRetries - Maximum number of retries
 * @returns Processing result
 */
export async function retryN8NProcessing(
  params: ProcessImageParams,
  maxRetries: number = 3
): Promise<N8NResponse> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await processImageWithN8N(params);
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error;
    } catch (error) {
      lastError = error;
    }
    
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      console.log(`N8N processing attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return {
    success: false,
    error: `N8N processing failed after ${maxRetries} attempts: ${lastError}`
  };
}