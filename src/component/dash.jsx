import { useState } from "react";
import { Upload, Image, Send, CheckCircle, AlertCircle, X } from "lucide-react";
import styles from "../Style/dash.module.css";

export default function Dash() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleImageChange = (file) => {
    setImage(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) handleImageChange(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageChange(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("text", text);
    formData.append("image", image);

    try {
      const response = await fetch("http://localhost:5000/api/carousel", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al guardar en BD");
      }

      setMessage("✅ Registro guardado correctamente");
      setTitle("");
      setText("");
      setImage(null);
      setPreview(null);
    } catch (error) {
      setMessage("❌ " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.formCard}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.iconContainer}>
              <Image className={styles.icon} />
            </div>
            <h2 className={styles.title}>Crear Slide</h2>
            <p className={styles.subtitle}>Agrega un nuevo elemento al carousel</p>
          </div>

          {/* Form */}
          <div className={styles.form}>
            {/* Title Input */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Título *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Ingresa el título del slide..."
                className={styles.input}
              />
            </div>

            {/* Text Input */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Descripción *</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                rows={4}
                placeholder="Escribe una descripción para el slide..."
                className={styles.textarea}
              />
            </div>

            {/* Image Upload */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Imagen *</label>
              
              {!preview ? (
                <div
                  className={`${styles.uploadArea} ${dragOver ? styles.uploadAreaDragOver : ''}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <Upload className={`${styles.uploadIcon} ${dragOver ? styles.uploadIconDragOver : ''}`} />
                  <p className={styles.uploadText}>
                    {dragOver ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic'}
                  </p>
                  <p className={styles.uploadSubtext}>PNG, JPG, JPEG hasta 10MB</p>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className={styles.hiddenInput}
                  />
                </div>
              ) : (
                <div className={styles.previewContainer}>
                  <img
                    src={preview}
                    alt="Preview"
                    className={styles.previewImage}
                  />
                  <div className={styles.previewOverlay}>
                    <button
                      type="button"
                      onClick={removeImage}
                      className={styles.removeButton}
                    >
                      <X className={styles.removeIcon} />
                    </button>
                  </div>
                  <div className={styles.previewLabel}>
                    <p className={styles.previewLabelText}>Imagen seleccionada</p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !title || !text || !image}
              className={styles.submitButton}
            >
              {loading ? (
                <>
                  <div className={styles.loadingSpinner}></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Send className={styles.buttonIcon} />
                  <span>Guardar Slide</span>
                </>
              )}
            </button>

            {/* Message */}
            {message && (
              <div className={`${styles.message} ${
                message.includes('❌') ? styles.messageError : styles.messageSuccess
              }`}>
                {message.includes('❌') ? (
                  <AlertCircle className={styles.messageIcon} />
                ) : (
                  <CheckCircle className={styles.messageIcon} />
                )}
                <span className={styles.messageText}>{message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Los campos marcados con * son obligatorios
          </p>
        </div>
      </div>
    </div>
  );
}