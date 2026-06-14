import React, { useState } from 'react';
import { Sparkles, Calendar, MapPin, AlertCircle, FileText, CheckCircle, RefreshCw } from 'lucide-react';
import styles from './IncidentForm.module.css';

const CATEGORIES = [
  'POS Issue',
  'Delivery Delay',
  'Inventory',
  'Kitchen Equipment',
  'Customer Complaint',
  'Other'
];

const SEVERITIES = [
  { value: 'Low', label: 'Low', color: 'var(--severity-low)' },
  { value: 'Medium', label: 'Medium', color: 'var(--severity-medium)' },
  { value: 'High', label: 'High', color: 'var(--severity-high)' },
  { value: 'Critical', label: 'Critical', color: 'var(--severity-critical)' }
];

const LOCATIONS = [
  'Store #101 - Downtown',
  'Store #102 - Westside',
  'Store #103 - Galleria Mall',
  'Store #104 - Airport Terminal',
  'Store #105 - Broadway Blvd'
];

export default function IncidentForm({ onSubmitSuccess, backendUrl }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    severity: '',
    timestamp: new Date().toISOString().slice(0, 16) // Format as YYYY-MM-DDTHH:MM
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiSuggestionsApplied, setAiSuggestionsApplied] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [customLocationText, setCustomLocationText] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLocationDropdownChange = (e) => {
    const val = e.target.value;
    if (val === 'Other') {
      setIsCustomLocation(true);
      setFormData(prev => ({ ...prev, location: customLocationText }));
    } else {
      setIsCustomLocation(false);
      setFormData(prev => ({ ...prev, location: val }));
      if (errors.location) {
        setErrors(prev => ({ ...prev, location: '' }));
      }
    }
  };

  const handleCustomLocationChange = (e) => {
    const val = e.target.value;
    setCustomLocationText(val);
    setFormData(prev => ({ ...prev, location: val }));
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Incident title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Please select a category';
    if (!formData.location) newErrors.location = 'Please select the store location';
    if (!formData.severity) newErrors.severity = 'Please select a severity level';
    if (!formData.timestamp) newErrors.timestamp = 'Date and time is required';
    
    // Future date validation
    if (formData.timestamp) {
      const selectedDate = new Date(formData.timestamp);
      if (selectedDate > new Date()) {
        newErrors.timestamp = 'Incident date/time cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAiAnalyze = async () => {
    if (!formData.description.trim()) {
      setErrors(prev => ({ ...prev, description: 'Type in a description first to use AI Suggestions.' }));
      return;
    }

    setIsAnalyzing(true);
    setAiSuggestionsApplied(false);
    try {
      const res = await fetch(`${backendUrl}/api/incidents/analyze-description/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: formData.description })
      });

      if (!res.ok) throw new Error('Failed to analyze description');

      const data = await res.json();
      
      // Auto fill form
      setFormData(prev => ({
        ...prev,
        category: data.category || prev.category,
        severity: data.severity || prev.severity
      }));

      setAiAnalysis(data);
      setAiSuggestionsApplied(true);
      
      // Clear errors for auto-filled fields
      setErrors(prev => ({ ...prev, category: '', severity: '' }));
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setAiSuggestionsApplied(false);
      }, 5000);

    } catch (err) {
      console.error(err);
      setErrors(prev => ({ ...prev, description: 'AI analysis service temporarily unavailable.' }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        // Convert to full ISO string
        timestamp: new Date(formData.timestamp).toISOString()
      };

      const res = await fetch(`${backendUrl}/api/incidents/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        // Set server validation errors
        const serverErrors = {};
        for (const [key, value] of Object.entries(errorData)) {
          serverErrors[key] = Array.isArray(value) ? value[0] : value;
        }
        setErrors(serverErrors);
        throw new Error('Server validation failed');
      }

      setFormSubmitted(true);
      setFormData({
        title: '',
        description: '',
        category: '',
        location: '',
        severity: '',
        timestamp: new Date().toISOString().slice(0, 16)
      });
      setIsCustomLocation(false);
      setCustomLocationText('');
      setAiAnalysis(null);

      if (onSubmitSuccess) {
        setTimeout(() => {
          onSubmitSuccess();
        }, 1500);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (formSubmitted) {
    return (
      <div className={`glass-panel ${styles.successContainer} animate-fade-in`}>
        <CheckCircle className={styles.successIcon} />
        <h2>Incident Submitted Successfully!</h2>
        <p>The manager dashboard has been updated. Store supervisors have been alerted.</p>
        <button 
          onClick={() => setFormSubmitted(false)}
          className={styles.resetButton}
        >
          Submit Another Incident
        </button>
      </div>
    );
  }

  return (
    <div className={`glass-panel ${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <FileText className={styles.headerIcon} />
          <h2>Report New Incident</h2>
        </div>
        <p className={styles.subtitle}>Fill in details to alert management. Use AI to auto-classify your issue.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.fieldGroup}>
          <label htmlFor="title">Incident Title</label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="e.g. Back kitchen grill won't ignite"
            value={formData.title}
            onChange={handleChange}
            className={errors.title ? styles.inputError : ''}
          />
          {errors.title && <span className={styles.errorMessage}>{errors.title}</span>}
        </div>

        <div className={styles.fieldGroup}>
          <div className={styles.labelWithAction}>
            <label htmlFor="description">Detailed Description</label>
            <button
              type="button"
              className={styles.aiButton}
              onClick={handleAiAnalyze}
              disabled={isAnalyzing || !formData.description.trim()}
              title="Analyze description to automatically suggest category and severity"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className={`${styles.aiIcon} ${styles.spin}`} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className={styles.aiIcon} />
                  AI Suggest Fields
                </>
              )}
            </button>
          </div>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Describe exactly what happened. (e.g. The POS system in Lane 1 froze during card transactions and requires a full restart. Customers are waiting.)"
            value={formData.description}
            onChange={handleChange}
            className={errors.description ? styles.inputError : ''}
          />
          {errors.description && <span className={styles.errorMessage}>{errors.description}</span>}
        </div>

        {aiAnalysis && (
          <div className={`${styles.aiFeedback} ${aiSuggestionsApplied ? styles.appliedGlow : ''}`}>
            <div className={styles.aiFeedbackHeader}>
              <Sparkles size={16} color="var(--primary)" />
              <h4>AI Analysis Feedback</h4>
            </div>
            <p className={styles.aiExplanation}><strong>Analysis:</strong> {aiAnalysis.explanation}</p>
            {aiAnalysis.suggested_action && (
              <p className={styles.aiSuggestedAction}>
                <strong>Immediate Staff Action:</strong> {aiAnalysis.suggested_action}
              </p>
            )}
          </div>
        )}

        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <label htmlFor="location">
              <MapPin size={14} className={styles.labelIcon} /> Store Location
            </label>
            <select
              id="location"
              name="location"
              value={isCustomLocation ? 'Other' : formData.location}
              onChange={handleLocationDropdownChange}
              className={errors.location ? styles.inputError : ''}
            >
              <option value="">Select Location</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
              <option value="Other">Other (Type custom location...)</option>
            </select>
            
            {isCustomLocation && (
              <input
                type="text"
                placeholder="e.g. Store #999 - Custom Road"
                value={customLocationText}
                onChange={handleCustomLocationChange}
                className={`${styles.customLocationInput} ${errors.location ? styles.inputError : ''}`}
              />
            )}
            {errors.location && <span className={styles.errorMessage}>{errors.location}</span>}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="timestamp">
              <Calendar size={14} className={styles.labelIcon} /> Date & Time of Incident
            </label>
            <input
              type="datetime-local"
              id="timestamp"
              name="timestamp"
              value={formData.timestamp}
              onChange={handleChange}
              className={errors.timestamp ? styles.inputError : ''}
            />
            {errors.timestamp && <span className={styles.errorMessage}>{errors.timestamp}</span>}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`${errors.category ? styles.inputError : ''} ${aiSuggestionsApplied ? styles.aiSuccessGlow : ''}`}
            >
              <option value="">Select Category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <span className={styles.errorMessage}>{errors.category}</span>}
          </div>

          <div className={styles.fieldGroup}>
            <label>Severity Level</label>
            <div className={styles.severityGrid}>
              {SEVERITIES.map((sev) => (
                <button
                  key={sev.value}
                  type="button"
                  onClick={() => handleChange({ target: { name: 'severity', value: sev.value } })}
                  className={`${styles.severityOption} ${
                    formData.severity === sev.value ? styles.activeSeverity : ''
                  } ${aiSuggestionsApplied && formData.severity === sev.value ? styles.aiSuccessGlow : ''}`}
                  style={{
                    '--sev-color': sev.color,
                    borderColor: formData.severity === sev.value ? sev.color : ''
                  }}
                >
                  <span 
                    className={styles.dot} 
                    style={{ backgroundColor: sev.color }}
                  />
                  {sev.label}
                </button>
              ))}
            </div>
            {errors.severity && <span className={styles.errorMessage}>{errors.severity}</span>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className={`${styles.btnIcon} ${styles.spin}`} />
              Submitting Incident...
            </>
          ) : (
            'Submit Incident Report'
          )}
        </button>
      </form>
    </div>
  );
}
