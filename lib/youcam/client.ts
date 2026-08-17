import { getAccessToken, YouCamCredentials } from './auth';

export interface YouCamTaskError {
  code: string;
  message: string;
  userFriendlyMessage: string;
  raw?: any;
}

const ERROR_CODE_MAP: Record<string, string> = {
  error_no_face: "We couldn't detect a face in that photo. Please try a clear, front-facing selfie with good lighting.",
  error_multiple_faces: "Multiple faces detected. Please upload a photo with just one face.",
  error_face_angle_too_large: "Face angle is too tilted. Please use a straight-on selfie.",
  error_face_tilted: "Face is tilted. Please face directly towards the camera.",
  error_face_obscured: "Face is partly covered. Please ensure face is unobstructed (remove sunglasses, heavy masks, etc.).",
  error_src_face_too_small: "The face is too small in the photo. Please move closer to the camera so your face occupies the center frame.",
  error_lighting_dark: "Lighting is too dark. Please take a selfie in a well-lit environment.",
  error_nsfw_content_detected: "Image could not be processed due to content guidelines. Please upload a standard portrait photo.",
  exceed_max_filesize: "Image file size exceeds the maximum limit (10MB). Please use a smaller photo.",
  error_low_resolution: "Image resolution is too low. Please upload a clear, higher-resolution photo.",
  error_file_format_unsupported: "Unsupported file format. Please upload a JPG or PNG image.",
  error_invalid_request: "Invalid request parameters sent to YouCam API.",
  error_rate_limit_exceeded: "Rate limit exceeded. Please wait a moment and try again.",
  error_internal_server: "YouCam AI service encountered a temporary error. Please retry.",
};

/**
 * Translates raw error codes or messages from YouCam into user-friendly feedback.
 */
export function formatYouCamError(rawCode?: any, rawMsg?: any): YouCamTaskError {
  const code = String(rawCode || 'error_unknown').toLowerCase();
  const msgStr = typeof rawMsg === 'string' ? rawMsg : (rawMsg && typeof rawMsg === 'object' ? JSON.stringify(rawMsg) : String(rawMsg || ''));
  const userFriendlyMessage =
    ERROR_CODE_MAP[code] ||
    msgStr ||
    "An unexpected error occurred while processing your image. Please try again with a clear selfie.";

  return {
    code,
    message: msgStr || code,
    userFriendlyMessage,
  };
}

function getApiBase(): string {
  const custom = process.env.YOUCAM_API_BASE || 'https://yce-api-01.makeupar.com';
  return custom.replace(/\/+$/, '');
}

export function extractImageUrlFromResult(res: any): string | null {
  if (!res) return null;
  if (typeof res === 'string' && res.startsWith('http')) return res;
  
  return (
    res?.url ||
    res?.output_url ||
    res?.resultImageUrl ||
    res?.result_image_url ||
    res?.file_url ||
    res?.download_url ||
    res?.results?.url ||
    res?.results?.output_url ||
    res?.results?.file_url ||
    res?.results?.download_url ||
    res?.results?.files?.[0]?.url ||
    res?.results?.files?.[0]?.download_url ||
    res?.results?.files?.[0]?.file_url ||
    res?.files?.[0]?.url ||
    res?.files?.[0]?.download_url ||
    res?.files?.[0]?.file_url ||
    res?.data?.url ||
    res?.data?.output_url ||
    res?.data?.file_url ||
    res?.data?.download_url ||
    res?.data?.results?.url ||
    res?.data?.results?.output_url ||
    res?.data?.results?.files?.[0]?.url ||
    res?.data?.results?.files?.[0]?.download_url ||
    res?.data?.files?.[0]?.url ||
    res?.data?.files?.[0]?.download_url ||
    res?.result?.url ||
    res?.result?.output_url ||
    res?.result?.files?.[0]?.url ||
    res?.result?.files?.[0]?.download_url ||
    null
  );
}

let numericRequestId = 1000;
export function generateNumericRequestId(): number {
  numericRequestId += 1;
  return numericRequestId;
}

export function generateRequestId(prefix = 'task'): string {
  numericRequestId += 1;
  return `${prefix}_${numericRequestId}`;
}

/**
 * Step 1: Upload a file to YouCam S2S storage (creates presigned URL, PUTs raw bytes, returns file_id).
 */
export async function uploadFile(
  fileEndpoint: string,
  fileBuffer: Buffer,
  contentType: string = 'image/jpeg',
  fileName: string = 'selfie.jpg',
  credentials?: YouCamCredentials
): Promise<string> {
  const token = await getAccessToken(false, credentials);
  const base = getApiBase();
  const normalizedEndpoint = fileEndpoint.startsWith('/') ? fileEndpoint : `/${fileEndpoint}`;
  const url = `${base}${normalizedEndpoint}`;

  const fileInitRes = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: [
        {
          content_type: contentType,
          file_name: fileName,
          file_size: fileBuffer.length,
        },
      ],
    }),
  });

  if (!fileInitRes.ok) {
    const errText = await fileInitRes.text();
    throw new Error(`YouCam file upload initialization failed: HTTP ${fileInitRes.status} from ${url} — ${errText}`);
  }

  const fileInitData = await fileInitRes.json();
  const fileInfo =
    fileInitData?.result?.files?.[0] ||
    fileInitData?.data?.files?.[0] ||
    fileInitData?.files?.[0];

  if (!fileInfo) {
    throw new Error(`YouCam file upload initialization returned no file info: ${JSON.stringify(fileInitData)}`);
  }

  const fileId = fileInfo.file_id || fileInfo.id;
  const presignedRequest = fileInfo.requests?.[0] || fileInfo.request;
  const presignedUrl = presignedRequest?.url || fileInfo.upload_url;

  if (!presignedUrl) {
    if (fileId) return fileId;
    throw new Error(`YouCam file upload initialization returned no presigned URL: ${JSON.stringify(fileInfo)}`);
  }

  const uploadHeaders: Record<string, string> = {
    'Content-Type': contentType,
    ...(presignedRequest?.headers || {}),
  };

  const uploadRes = await fetch(presignedUrl, {
    method: presignedRequest?.method || 'PUT',
    headers: uploadHeaders,
    body: new Uint8Array(fileBuffer),
  });

  if (!uploadRes.ok) {
    const uploadErr = await uploadRes.text();
    throw new Error(`YouCam upload to presigned URL failed: HTTP ${uploadRes.status} — ${uploadErr}`);
  }

  return fileId;
}

/**
 * Step 2: Create / Run async task on YouCam S2S API.
 */
export async function runTask(
  taskEndpoint: string,
  body: Record<string, any>,
  credentials?: YouCamCredentials
): Promise<string> {
  const token = await getAccessToken(false, credentials);
  const base = getApiBase();
  const normalizedEndpoint = taskEndpoint.startsWith('/') ? taskEndpoint : `/${taskEndpoint}`;
  const url = `${base}${normalizedEndpoint}`;

  const reqId = typeof body.request_id === 'number' ? body.request_id : generateNumericRequestId();
  const payload = { request_id: reqId, ...body };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`YouCam task execution failed: HTTP ${res.status} from ${url} — ${errText}`);
  }

  const data = await res.json();
  const taskId =
    data?.result?.task_id ||
    data?.data?.task_id ||
    data?.task_id ||
    data?.id;

  if (!taskId) {
    throw new Error(`YouCam task response missing task_id: ${JSON.stringify(data)}`);
  }

  return taskId;
}

/**
 * Step 3: Poll task status until complete or error.
 */
export async function pollTask<T = any>(
  taskEndpoint: string,
  taskId: string,
  options: {
    timeoutMs?: number;
    initialDelayMs?: number;
  } = {},
  credentials?: YouCamCredentials
): Promise<T> {
  const { timeoutMs = 120000, initialDelayMs = 1000 } = options;
  const token = await getAccessToken(false, credentials);
  const base = getApiBase();
  const normalizedEndpoint = taskEndpoint.startsWith('/') ? taskEndpoint : `/${taskEndpoint}`;

  const startTime = Date.now();
  if (initialDelayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, initialDelayMs));
  }

  while (Date.now() - startTime < timeoutMs) {
    const pollUrls = [
      `${base}${normalizedEndpoint}/${encodeURIComponent(taskId)}`,
      `${base}${normalizedEndpoint}?task_id=${encodeURIComponent(taskId)}`,
    ];

    let lastPollErr: string | null = null;

    for (const url of pollUrls) {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 404 || res.status === 405) {
          lastPollErr = `HTTP ${res.status}`;
          continue;
        }
        if (res.status >= 500) {
          lastPollErr = `HTTP ${res.status}`;
          break;
        }
        const errText = await res.text();
        throw new Error(`YouCam task polling failed: HTTP ${res.status} from ${url} — ${errText}`);
      }

      const data = await res.json();
      
      // Look for task status across all YouCam S2S schemas (ignoring HTTP status numbers like 200)
      const rawTaskStatus =
        data?.data?.task_status ??
        data?.result?.task_status ??
        data?.task_status ??
        data?.data?.status ??
        data?.result?.status ??
        (typeof data?.status === 'string' ? data.status : undefined) ??
        '';
      const status = String(rawTaskStatus || '').toLowerCase();
      const result = data?.data || data?.result || data;

      // Check if results are already populated (both for image VTO and numerical diagnostic analyzers)
      const hasOutputUrl = Boolean(
        result?.resultImageUrl ||
        result?.result_image_url ||
        result?.file_url ||
        result?.url ||
        result?.results?.output_url ||
        result?.results?.url ||
        result?.results?.files?.[0]?.url ||
        result?.files?.[0]?.url ||
        data?.results?.url ||
        data?.data?.results?.url ||
        data?.data?.url
      );

      const hasDiagnosticResults = Boolean(
        result?.results?.score_info ||
        result?.score_info ||
        result?.results?.concerns ||
        result?.results?.skin_type ||
        result?.results?.color ||
        result?.color ||
        result?.results?.fitzpatrick_scale ||
        result?.fitzpatrick_scale ||
        result?.results?.faceshape ||
        result?.faceshape ||
        result?.results?.hair_length ||
        result?.hair_length
      );

      if (
        status === 'success' ||
        status === 'completed' ||
        status === 'done' ||
        hasOutputUrl ||
        hasDiagnosticResults
      ) {
        return result as T;
      }

      if (status === 'error' || status === 'failed') {
        console.error('[YouCam Task Error Raw Response]:', JSON.stringify(data));
        const rawErr = result?.error ?? data?.error;
        const errCode =
          (typeof rawErr === 'string' ? rawErr : rawErr?.code) ||
          result?.error_code ||
          data?.error_code ||
          result?.code ||
          data?.code;
        const errMsg =
          (typeof rawErr === 'object' ? rawErr?.message : undefined) ||
          result?.error_message ||
          data?.error_message ||
          result?.msg ||
          data?.msg ||
          result?.message ||
          data?.message ||
          (typeof rawErr === 'string' ? rawErr : undefined);

        const formatted = formatYouCamError(errCode, errMsg);
        throw new Error(formatted.userFriendlyMessage);
      }

      const intervalMs = result?.polling_interval || data?.polling_interval || 2000;
      await new Promise((resolve) => setTimeout(resolve, Math.max(500, intervalMs)));
      lastPollErr = null;
      break;
    }

    if (lastPollErr) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  throw new Error(`Task timed out after ${timeoutMs / 1000}s while waiting for YouCam AI.`);
}

/**
 * Universal helper that safely resolves any image input (Buffer, base64 data URL, HTTP URL, or YouCam fileId)
 * into a valid { src_file_id, src_file_url } payload object for YouCam S2S task endpoints.
 */
export async function resolveImageInput(
  imageInput: Buffer | string,
  filename = 'image.jpg',
  endpoint = '/s2s/v2.0/file',
  credentials?: YouCamCredentials
): Promise<{ src_file_id?: string; src_file_url?: string }> {
  if (Buffer.isBuffer(imageInput)) {
    const fileId = await uploadFile(endpoint, imageInput, 'image/jpeg', filename, credentials);
    return { src_file_id: fileId };
  }

  const str = String(imageInput).trim();
  if (str.startsWith('data:') || str.length > 500) {
    const cleanBase64 = str.replace(/^data:image\/\w+;base64,/, '');
    const buf = Buffer.from(cleanBase64, 'base64');
    const fileId = await uploadFile(endpoint, buf, 'image/jpeg', filename, credentials);
    return { src_file_id: fileId };
  }

  if (str.startsWith('http://') || str.startsWith('https://')) {
    return { src_file_url: str };
  }

  // Already a YouCam file_id
  return { src_file_id: str };
}
