import { useId, useRef, useState } from 'react';
import { FileText, Loader2, UploadCloud, X } from 'lucide-react';
import { uploadFile } from '../../../api/endpoints/uploads.js';
import { getErrorMessage } from '../../../api/http.js';
import { cldImage } from '../../../utils/cloudinary.js';
import styles from './FileUploadField.module.scss';

const MAX_BYTES = 10 * 1024 * 1024;

function isImageUrl(url) {
  return /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url) || url.includes('/image/upload/');
}

function FileUploadField({
  label,
  hint,
  error,
  value,
  onChange,
  folder = 'misc',
  accept = 'image/png,image/jpeg,image/webp,image/gif,image/avif',
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
      onChange(asset.url);
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
          {isImageUrl(value) ? (
            <img src={cldImage(value, { width: 240, height: 160 })} alt="" className={styles.thumb} />
          ) : (
            <span className={styles.fileChip}>
              <FileText size={18} aria-hidden="true" />
              Uploaded file
            </span>
          )}
          <div className={styles.previewActions}>
            <button type="button" className={styles.linkButton} onClick={pickFile} disabled={isUploading}>
              Replace
            </button>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => {
                setUploadError('');
                onChange('');
              }}
            >
              <X size={14} aria-hidden="true" />
              Remove
            </button>
          </div>
          <a className={styles.urlLine} href={value} target="_blank" rel="noreferrer">
            {value}
          </a>
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
              <span className={styles.dropHint}>PNG, JPG, WebP or GIF — up to 10 MB</span>
            </>
          )}
        </button>
      )}

      {hint && !shownError ? <p className={styles.hint}>{hint}</p> : null}
      {shownError ? <p className={styles.error}>{shownError}</p> : null}
    </div>
  );
}

export default FileUploadField;
