import { useId, useRef, useState } from 'react';
import { FileText, Loader2, UploadCloud, X } from 'lucide-react';
import { uploadFile } from '../../../api/endpoints/uploads.js';
import { getErrorMessage } from '../../../api/http.js';
import { cldImage } from '../../../utils/cloudinary.js';
import { formatFileSize } from '../../../utils/format.js';
import styles from './DocumentUploadField.module.scss';

const MAX_BYTES = 10 * 1024 * 1024;
const DEFAULT_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/avif,application/pdf';

function isImageMime(mimeType) {
  return typeof mimeType === 'string' && mimeType.startsWith('image/');
}

/**
 * Labelled upload control for a candidate document. Unlike `FileUploadField`,
 * `value`/`onChange` carry the full document record the API expects
 * ({ type, url, publicId, originalName, mimeType, size }), not a bare URL —
 * `mimeType` in particular isn't part of the upload service's own response,
 * so it's captured from the browser `File` directly.
 */
function DocumentUploadField({
  label,
  hint,
  error,
  value,
  onChange,
  documentType,
  folder = 'documents',
  accept = DEFAULT_ACCEPT,
  disabled = false,
  id,
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const shownError = error || uploadError;

  const pickFile = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  };

  const handleFiles = async (fileList) => {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_BYTES) {
      setUploadError('File is larger than the 10 MB limit.');
      return;
    }

    setUploadError('');
    setIsUploading(true);
    try {
      const asset = await uploadFile(file, { folder });
      onChange({
        type: documentType,
        url: asset.url,
        publicId: asset.publicId,
        originalName: asset.originalFilename || file.name,
        mimeType: file.type,
        size: asset.bytes ?? file.size,
      });
    } catch (uploadFailure) {
      setUploadError(getErrorMessage(uploadFailure, 'Upload failed. Please try again.'));
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className={styles.field}>
      <span className={styles.label} id={`${fieldId}-label`}>
        {label}
      </span>

      <input
        ref={inputRef}
        id={fieldId}
        type="file"
        accept={accept}
        className={styles.nativeInput}
        disabled={disabled || isUploading}
        onChange={(event) => handleFiles(event.target.files)}
      />

      {value ? (
        <div className={styles.preview}>
          {isImageMime(value.mimeType) ? (
            <img
              src={cldImage(value.url, { width: 240, height: 160 })}
              alt=""
              className={styles.thumb}
            />
          ) : (
            <span className={styles.fileChip}>
              <FileText size={18} aria-hidden="true" />
              <span className={styles.fileChipName}>{value.originalName}</span>
            </span>
          )}
          <p className={styles.fileMeta}>
            {value.originalName} &bull; {formatFileSize(value.size)}
          </p>
          <div className={styles.previewActions}>
            <button type="button" className={styles.linkButton} onClick={pickFile} disabled={isUploading}>
              Replace
            </button>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => {
                setUploadError('');
                onChange(null);
              }}
              disabled={isUploading}
            >
              <X size={14} aria-hidden="true" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={styles.dropzone}
          aria-labelledby={`${fieldId}-label`}
          onClick={pickFile}
          disabled={disabled || isUploading}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            handleFiles(event.dataTransfer.files);
          }}
        >
          {isUploading ? (
            <>
              <Loader2 size={20} className={styles.spin} aria-hidden="true" />
              Uploading…
            </>
          ) : (
            <>
              <UploadCloud size={20} aria-hidden="true" />
              <span>
                <strong>Click to upload</strong> or drag a file here
              </span>
              <span className={styles.dropHint}>PNG, JPG, WebP or PDF — up to 10 MB</span>
            </>
          )}
        </button>
      )}

      {hint && !shownError ? <p className={styles.hint}>{hint}</p> : null}
      {shownError ? <p className={styles.error}>{shownError}</p> : null}
    </div>
  );
}

export default DocumentUploadField;
