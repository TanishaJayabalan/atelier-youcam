export interface FormattedError {
  type: 'credits' | 'image_format' | 'face_detection' | 'network' | 'generic';
  title: string;
  message: string;
  actionType?: 'api_settings' | 'change_photo' | 'retry';
  actionLabel?: string;
}

/**
 * Translates raw API errors, HTTP codes, and JSON dumps into clear, actionable, and human-friendly UI notices.
 */
export function formatError(rawError?: string | null): FormattedError | null {
  if (!rawError) return null;
  const str = String(rawError);

  // 1. Credit Insufficiency
  if (
    str.includes('CreditInsufficiency') ||
    str.includes("doesn't have enough credits") ||
    str.includes('out of credits') ||
    str.includes('Insufficient Credits') ||
    str.includes('insufficient_credits') ||
    str.includes('credit')
  ) {
    return {
      type: 'credits',
      title: 'YouCam API Credits Exhausted',
      message:
        'Your YouCam Developer Account has run out of cloud credits. Please top up your API balance in the YouCam Console or update your credentials in API Settings.',
      actionType: 'api_settings',
      actionLabel: 'Configure API Settings',
    };
  }

  // 2. Photo size / format / payload limit / unaccepted format
  if (
    str.includes('format') ||
    str.includes('extension') ||
    str.includes('image_too_large') ||
    str.includes('unsupported image') ||
    str.includes('payload too large') ||
    str.includes('413') ||
    str.includes('corrupted') ||
    str.includes('Invalid image')
  ) {
    return {
      type: 'image_format',
      title: 'Photo Format or Size Not Accepted',
      message:
        'The uploaded photo format or file size is not accepted. Please upload a clear JPG, PNG, or WEBP image under 10MB.',
      actionType: 'change_photo',
      actionLabel: 'Choose Another Photo',
    };
  }

  // 3. Facial Biometrics / Angle / Visibility
  if (
    str.includes('error_face_position_too_small') ||
    str.includes('error_face_angle_invalid') ||
    str.includes('error_no_face_detected') ||
    str.includes('face_not_detected') ||
    str.includes('error_pose') ||
    str.includes('shoulders are clearly visible') ||
    str.includes('chest, and shoulders') ||
    str.includes('face')
  ) {
    return {
      type: 'face_detection',
      title: 'Facial Biometrics & Pose Issue',
      message:
        'Please ensure your face and shoulders are well-lit, centered, looking straight ahead, and clearly visible without obstruction.',
      actionType: 'change_photo',
      actionLabel: 'Take or Select New Photo',
    };
  }

  // 4. Timeouts & Network
  if (
    str.includes('timed out') ||
    str.includes('timeout') ||
    str.includes('503') ||
    str.includes('502') ||
    str.includes('504') ||
    str.includes('NetworkError') ||
    str.includes('Failed to fetch')
  ) {
    return {
      type: 'network',
      title: 'AI Processing Timed Out',
      message:
        'The cloud processing service took longer than expected due to network traffic. Please try again or test with a Preset Model.',
      actionType: 'retry',
      actionLabel: 'Retry Analysis',
    };
  }

  // 5. Clean up raw JSON or trace prefixes
  let cleanMsg = str;
  if (cleanMsg.includes('— {')) {
    try {
      const jsonPart = cleanMsg.split('— ')[1];
      const parsed = JSON.parse(jsonPart);
      if (parsed.error) cleanMsg = parsed.error;
    } catch {
      cleanMsg = cleanMsg.split('— {')[0].trim();
    }
  }
  if (cleanMsg.startsWith('Error:')) {
    cleanMsg = cleanMsg.replace(/^Error:\s*/, '');
  }

  return {
    type: 'generic',
    title: 'Analysis Notice',
    message: cleanMsg,
    actionType: 'retry',
    actionLabel: 'Try Again',
  };
}
