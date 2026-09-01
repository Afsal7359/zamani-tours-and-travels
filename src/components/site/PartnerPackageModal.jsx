'use client';
import { useState, useRef } from 'react';
import { savePackageRequest } from '@/lib/firestore';
import { uploadToCloudinary } from '@/lib/upload';

export default function PartnerPackageModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    partnerName: '',
    resortName: '',
    phone: '',
    email: '',
    partnerLocation: '',
    
    title: '',
    packageLocation: '',
    duration: '3 Days / 2 Nights',
    badge: 'Partner Exclusive',
    priceAdult: '',
    priceChild: '',
    priceNote: 'per person on twin sharing',
    description: '',
    longDescription: '',
    
    image: '',
    images: [],
    
    includes: ['Accommodation', 'Daily Breakfast', 'Sightseeing Transfers', 'All Taxes & Tolls'],
    excludes: ['Airfare / Train tickets', 'Personal expenses', 'Optional activities / Entry tickets'],
    
    itinerary: [
      { day: 1, title: 'Arrival & Check-in', desc: 'Welcome drink on arrival. Leisure evening.', image: '' },
      { day: 2, title: 'Full Day Sightseeing', desc: 'Explore top tourist spots with private driver.', image: '' },
      { day: 3, title: 'Check-out & Departure', desc: 'Breakfast and onward transfer.', image: '' }
    ],
    
    specialNote: ''
  });

  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingItinIdx, setUploadingItinIdx] = useState(null);

  const mainImageInputRef = useRef(null);
  const galleryImagesInputRef = useRef(null);
  const itinImageInputRefs = useRef({});

  if (!isOpen) return null;

  function updateField(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  // Upload Handlers
  async function handleMainImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingMain(true);
    try {
      const url = await uploadToCloudinary(file);
      if (url) {
        updateField('image', url);
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed. Please check your connection.');
    } finally {
      setUploadingMain(false);
    }
  }

  async function handleGalleryUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingGallery(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const url = await uploadToCloudinary(file);
        if (url) uploadedUrls.push(url);
      }
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (err) {
      console.error(err);
      alert('One or more gallery images failed to upload.');
    } finally {
      setUploadingGallery(false);
    }
  }

  function removeGalleryImage(index) {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }

  async function handleItineraryImageUpload(index, e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingItinIdx(index);
    try {
      const url = await uploadToCloudinary(file);
      if (url) {
        setFormData(prev => {
          const list = [...prev.itinerary];
          list[index] = { ...list[index], image: url };
          return { ...prev, itinerary: list };
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingItinIdx(null);
    }
  }

  // Itinerary helpers
  function addItineraryDay() {
    setFormData(prev => {
      const nextDayNum = prev.itinerary.length + 1;
      return {
        ...prev,
        itinerary: [
          ...prev.itinerary,
          { day: `Day ${nextDayNum}`, title: '', description: '', image: '' },
        ],
      };
    });
  }

  function removeItineraryDay(index) {
    setFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index),
    }));
  }

  function updateItineraryDay(index, key, val) {
    setFormData(prev => {
      const list = [...prev.itinerary];
      list[index] = { ...list[index], [key]: val };
      return { ...prev, itinerary: list };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.partnerName || !formData.phone || !formData.title || !formData.priceAdult) {
      alert('Please fill all mandatory fields (Name, Phone, Package Title, and Adult Rate).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        partnerName: formData.partnerName.trim(),
        resortName: formData.resortName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        partnerLocation: formData.partnerLocation.trim(),
        
        title: formData.title.trim(),
        location: formData.packageLocation.trim(),
        duration: formData.duration.trim(),
        badge: formData.badge.trim(),
        priceAdult: formData.priceAdult.trim(),
        priceChild: formData.priceChild.trim(),
        price: formData.priceAdult.trim(), // fallback standard field
        priceNote: formData.priceNote.trim(),
        description: formData.description.trim(),
        longDescription: formData.longDescription.trim(),
        
        image: formData.image.trim(),
        images: formData.images.filter(Boolean),
        
        highlights: formData.highlights.split('\n').map(s => s.trim()).filter(Boolean),
        inclusions: formData.inclusions.split('\n').map(s => s.trim()).filter(Boolean),
        exclusions: formData.exclusions.split('\n').map(s => s.trim()).filter(Boolean),
        
        itinerary: formData.itinerary.filter(d => d.title.trim() || d.description.trim()),
      };

      const docId = await savePackageRequest(payload);
      setRequestId(docId);
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting package request:', err);
      alert('Something went wrong while submitting. Please try again or contact us directly.');
    } finally {
      setSubmitting(false);
    }
  }

  function resetAndClose() {
    setSubmitted(false);
    setStep(1);
    onClose();
  }

  return (
    <div className="partner-modal-overlay" onClick={(e) => e.target === e.currentTarget && resetAndClose()}>
      <div className="partner-modal-card">
        {/* Modal Header */}
        <div className="partner-modal-header">
          <div className="partner-modal-brand">
            <span className="partner-tag">Partner With Zamani</span>
            <h3>List Your Package & Itinerary</h3>
          </div>
          <button className="partner-modal-close" onClick={resetAndClose} aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        {submitted ? (
          <div className="partner-success-screen">
            <div className="success-icon-wrap">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h4>Package Submitted Successfully!</h4>
            <p>
              Thank you, <strong>{formData.partnerName || 'Partner'}</strong>. Your package <em>"{formData.title}"</em> has been received by Zamani Tours and Travels.
            </p>
            <div className="submission-ref-box">
              <span>Reference ID:</span>
              <code>{requestId || 'ZM-REQ'}</code>
            </div>
            <p className="subtext">
              Our admin team will review the itinerary, photos, and rates. Once approved, it will be published live to our website!
            </p>
            <div className="success-actions">
              <a
                href={`https://wa.me/918592042002?text=Hi%20Zamani%20Tours,%20I%20have%20submitted%20a%20new%20package%20request%20(Ref:%20${requestId})%20for%20${encodeURIComponent(formData.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp-direct"
              >
                💬 Notify Zamani on WhatsApp
              </a>
              <button className="btn btn-primary" onClick={resetAndClose}>
                Done & Return
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="partner-form">
            {/* Step Navigation Pill Indicator */}
            <div className="partner-step-tabs">
              <button
                type="button"
                className={`step-tab ${step === 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}
                onClick={() => setStep(1)}
              >
                <span className="step-num">1</span>
                <span className="step-label">Partner & Stay Info</span>
              </button>
              <button
                type="button"
                className={`step-tab ${step === 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}
                onClick={() => setStep(2)}
              >
                <span className="step-num">2</span>
                <span className="step-label">Pricing & Photos</span>
              </button>
              <button
                type="button"
                className={`step-tab ${step === 3 ? 'active' : ''}`}
                onClick={() => setStep(3)}
              >
                <span className="step-num">3</span>
                <span className="step-label">Itineraries & Inclusions</span>
              </button>
            </div>

            {/* ─── STEP 1: Basic & Partner Info ────────────────────────── */}
            {step === 1 && (
              <div className="step-content">
                <div className="form-section-title">
                  <h5>Resort & Partner Contact Details</h5>
                  <p>How our team and prospective guests can identify you</p>
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <label>Contact Person / Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.partnerName}
                      onChange={e => updateField('partnerName', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Resort / Hotel / Agency Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Misty Hills Valley Resort"
                      value={formData.resortName}
                      onChange={e => updateField('resortName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <label>Phone / WhatsApp Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={e => updateField('phone', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. info@resortname.com"
                      value={formData.email}
                      onChange={e => updateField('email', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-section-title" style={{ marginTop: '1.5rem' }}>
                  <h5>Package Overview</h5>
                  <p>Basic title and destination details</p>
                </div>

                <div className="form-grid-2">
                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <label>Package / Itinerary Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 3N Munnar Luxury Plantation Villa & Jeep Safari"
                      value={formData.title}
                      onChange={e => updateField('title', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid-3">
                  <div className="input-group">
                    <label>Destination / Location *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Munnar, Kerala"
                      value={formData.packageLocation}
                      onChange={e => updateField('packageLocation', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Duration *</label>
                    <input
                      type="text"
                      placeholder="e.g. 3 Days / 2 Nights"
                      value={formData.duration}
                      onChange={e => updateField('duration', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Badge / Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Resort Exclusive, Honeymoon"
                      value={formData.badge}
                      onChange={e => updateField('badge', e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Short Tagline / Teaser</label>
                  <input
                    type="text"
                    placeholder="e.g. Relax amidst misty tea plantations with private pool villa stays"
                    value={formData.description}
                    onChange={e => updateField('description', e.target.value)}
                  />
                </div>

                <div className="step-footer">
                  <button type="button" className="btn btn-secondary-outline" onClick={resetAndClose}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (!formData.partnerName || !formData.phone || !formData.title) {
                        alert('Please fill the contact name, phone number, and package title.');
                        return;
                      }
                      setStep(2);
                    }}
                  >
                    Next: Pricing & Photos →
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 2: Pricing & Photos ────────────────────────────── */}
            {step === 2 && (
              <div className="step-content">
                <div className="form-section-title">
                  <h5>Detailed Rates & Pricing</h5>
                  <p>Provide clear per-person pricing for adults and children</p>
                </div>

                <div className="form-grid-3">
                  <div className="input-group">
                    <label>Adult Rate (₹) *</label>
                    <div className="input-icon-wrap">
                      <span>₹</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 14,500"
                        value={formData.priceAdult}
                        onChange={e => updateField('priceAdult', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Child Rate (₹) (Optional)</label>
                    <div className="input-icon-wrap">
                      <span>₹</span>
                      <input
                        type="text"
                        placeholder="e.g. 6,800"
                        value={formData.priceChild}
                        onChange={e => updateField('priceChild', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Price Note</label>
                    <input
                      type="text"
                      placeholder="e.g. per person / per couple"
                      value={formData.priceNote}
                      onChange={e => updateField('priceNote', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-section-title" style={{ marginTop: '1.5rem' }}>
                  <h5>Photos & Media</h5>
                  <p>Upload captivating photos of your resort, rooms, and experiences</p>
                </div>

                {/* Main Cover Image */}
                <div className="photo-upload-block">
                  <label className="photo-label">Main Package Cover Photo *</label>
                  <div className="photo-upload-row">
                    <input
                      type="file"
                      ref={mainFileInputRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleMainImageUpload}
                    />
                    <button
                      type="button"
                      className="btn-upload-trigger"
                      onClick={() => mainFileInputRef.current?.click()}
                      disabled={uploadingMain}
                    >
                      {uploadingMain ? 'Uploading Cover...' : '📷 Upload Cover Photo'}
                    </button>
                    <input
                      type="text"
                      placeholder="or paste direct image URL"
                      value={formData.image}
                      onChange={e => updateField('image', e.target.value)}
                      className="url-input"
                    />
                  </div>
                  {formData.image && (
                    <div className="cover-preview-box">
                      <img src={formData.image} alt="Cover Preview" />
                      <button
                        type="button"
                        className="remove-img-btn"
                        onClick={() => updateField('image', '')}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Additional Gallery Photos */}
                <div className="photo-upload-block" style={{ marginTop: '1.2rem' }}>
                  <label className="photo-label">Additional Gallery Photos (Resort, Amenities, Views)</label>
                  <div className="photo-upload-row">
                    <input
                      type="file"
                      ref={galleryFileInputRef}
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={handleGalleryUpload}
                    />
                    <button
                      type="button"
                      className="btn-upload-trigger"
                      onClick={() => galleryFileInputRef.current?.click()}
                      disabled={uploadingGallery}
                    >
                      {uploadingGallery ? 'Uploading Gallery...' : '🖼️ Add Gallery Photos'}
                    </button>
                    <span className="gallery-count-note">{formData.images.length} images added</span>
                  </div>

                  {formData.images.length > 0 && (
                    <div className="gallery-preview-grid">
                      {formData.images.map((imgUrl, i) => (
                        <div key={i} className="gallery-thumb">
                          <img src={imgUrl} alt={`Gallery ${i + 1}`} />
                          <button
                            type="button"
                            className="thumb-remove"
                            onClick={() => removeGalleryImage(i)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="step-footer">
                  <button type="button" className="btn btn-secondary-outline" onClick={() => setStep(1)}>
                    ← Back to Step 1
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (!formData.priceAdult) {
                        alert('Please specify the adult rate.');
                        return;
                      }
                      setStep(3);
                    }}
                  >
                    Next: Itinerary & Inclusions →
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 3: Itineraries & Inclusions ────────────────────── */}
            {step === 3 && (
              <div className="step-content">
                <div className="form-section-title">
                  <h5>Day-by-Day Itineraries</h5>
                  <p>Outline each day’s highlights, activities, meals, and stays</p>
                </div>

                <div className="itinerary-builder">
                  {formData.itinerary.map((item, idx) => (
                    <div key={idx} className="itin-card">
                      <div className="itin-card-head">
                        <span className="itin-day-badge">{item.day || `Day ${idx + 1}`}</span>
                        <input
                          type="text"
                          placeholder="Day Title (e.g. Tea Plantation Trek & Campfire)"
                          value={item.title}
                          onChange={e => updateItineraryDay(idx, 'title', e.target.value)}
                          className="itin-title-input"
                        />
                        {formData.itinerary.length > 1 && (
                          <button
                            type="button"
                            className="itin-del-btn"
                            onClick={() => removeItineraryDay(idx)}
                            title="Remove Day"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        )}
                      </div>

                      <div className="itin-card-body">
                        <textarea
                          rows="2"
                          placeholder="Describe activities, transfer details, sightseeing, and meal plans for this day..."
                          value={item.description}
                          onChange={e => updateItineraryDay(idx, 'description', e.target.value)}
                          className="itin-desc-input"
                        />

                        {/* Optional Itinerary Day Photo */}
                        <div className="itin-photo-row">
                          <label className="itin-photo-label">
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handleItineraryImageUpload(idx, e)}
                            />
                            <span className="upload-itin-btn">
                              {uploadingItinIdx === idx ? 'Uploading...' : (item.image ? '🔄 Change Day Photo' : '📷 Add Day Photo')}
                            </span>
                          </label>
                          {item.image && (
                            <div className="itin-thumb-preview">
                              <img src={item.image} alt={item.day} />
                              <button
                                type="button"
                                onClick={() => updateItineraryDay(idx, 'image', '')}
                                className="itin-thumb-remove"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn-add-day"
                    onClick={addItineraryDay}
                  >
                    + Add Next Day ({`Day ${formData.itinerary.length + 1}`})
                  </button>
                </div>

                {/* Highlights & Inclusions */}
                <div className="form-section-title" style={{ marginTop: '1.8rem' }}>
                  <h5>Inclusions & Exclusions</h5>
                  <p>List what is provided and what is excluded (one item per line)</p>
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <label>What's Included (1 per line)</label>
                    <textarea
                      rows="3"
                      value={formData.inclusions}
                      onChange={e => updateField('inclusions', e.target.value)}
                      placeholder="e.g.&#10;Resort stay in Deluxe Room&#10;Breakfast & Dinner&#10;Pick & Drop"
                    />
                  </div>
                  <div className="input-group">
                    <label>What's Excluded (1 per line)</label>
                    <textarea
                      rows="3"
                      value={formData.exclusions}
                      onChange={e => updateField('exclusions', e.target.value)}
                      placeholder="e.g.&#10;Flight/Train tickets&#10;Personal expenses"
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: '0.8rem' }}>
                  <label>Additional Notes / Long Resort Description</label>
                  <textarea
                    rows="2"
                    value={formData.longDescription}
                    onChange={e => updateField('longDescription', e.target.value)}
                    placeholder="Add any extra special notes, check-in policy, room amenities, or resort highlights..."
                  />
                </div>

                <div className="step-footer">
                  <button type="button" className="btn btn-secondary-outline" onClick={() => setStep(2)}>
                    ← Back to Step 2
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-submit-request"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting to Zamani...' : '🚀 Submit Package Request'}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>

      <style jsx>{`
        .partner-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(5, 11, 38, 0.82);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: modalFadeIn 0.25s ease-out;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        .partner-modal-card {
          background: #ffffff;
          border-radius: 20px;
          width: 100%;
          max-width: 820px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.35);
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .partner-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #edf0f7;
          background: #fafbfe;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .partner-tag {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #2B47E5;
          background: rgba(43, 71, 229, 0.08);
          padding: 0.25rem 0.65rem;
          border-radius: 50px;
          display: inline-block;
          margin-bottom: 0.25rem;
        }

        .partner-modal-brand h3 {
          margin: 0;
          font-size: 1.35rem;
          font-weight: 800;
          color: #0A1235;
          letter-spacing: -0.02em;
        }

        .partner-modal-close {
          background: #f1f3f9;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #5a627d;
          cursor: pointer;
          transition: all 0.2s;
        }

        .partner-modal-close:hover {
          background: #e2e6f0;
          color: #0A1235;
        }

        .partner-step-tabs {
          display: flex;
          background: #f4f6fb;
          padding: 0.5rem 1.5rem;
          gap: 0.5rem;
          border-bottom: 1px solid #edf0f7;
        }

        .step-tab {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 0.8rem;
          background: transparent;
          border: none;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #7b849b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .step-tab.active {
          background: #ffffff;
          color: #2B47E5;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .step-tab.done .step-num {
          background: #10B981;
          color: #ffffff;
        }

        .step-num {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #e2e6f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
        }

        .step-tab.active .step-num {
          background: #2B47E5;
          color: #ffffff;
        }

        .step-content {
          padding: 1.8rem 2rem;
        }

        .form-section-title {
          margin-bottom: 1.2rem;
        }

        .form-section-title h5 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0A1235;
          margin: 0 0 0.2rem 0;
        }

        .form-section-title p {
          font-size: 0.82rem;
          color: #6b7280;
          margin: 0;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.1rem;
          margin-bottom: 1.1rem;
        }

        .form-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1.1rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .input-group label {
          font-size: 0.82rem;
          font-weight: 600;
          color: #2b334a;
        }

        .input-group input,
        .input-group textarea,
        .url-input {
          width: 100%;
          padding: 0.72rem 0.9rem;
          border-radius: 10px;
          border: 1px solid #dbe1ee;
          background: #fcfdfe;
          font-size: 0.9rem;
          color: #0A1235;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-group input:focus,
        .input-group textarea:focus,
        .url-input:focus {
          border-color: #2B47E5;
          box-shadow: 0 0 0 3px rgba(43, 71, 229, 0.12);
        }

        .input-icon-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon-wrap span {
          position: absolute;
          left: 0.85rem;
          font-weight: 700;
          color: #5a627d;
          font-size: 0.95rem;
        }

        .input-icon-wrap input {
          padding-left: 2rem;
        }

        .photo-upload-block {
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 12px;
          padding: 1.2rem;
        }

        .photo-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.6rem;
          display: block;
        }

        .photo-upload-row {
          display: flex;
          gap: 0.8rem;
          align-items: center;
        }

        .btn-upload-trigger {
          background: #2B47E5;
          color: white;
          border: none;
          padding: 0.65rem 1.1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s;
        }

        .btn-upload-trigger:hover {
          background: #1e35b8;
        }

        .cover-preview-box {
          margin-top: 0.8rem;
          position: relative;
          display: inline-block;
          border-radius: 8px;
          overflow: hidden;
          max-height: 160px;
        }

        .cover-preview-box img {
          max-height: 160px;
          border-radius: 8px;
          object-fit: cover;
          display: block;
        }

        .remove-img-btn,
        .thumb-remove {
          position: absolute;
          top: 6px;
          right: 6px;
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          border: none;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          cursor: pointer;
        }

        .gallery-preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 0.6rem;
          margin-top: 0.8rem;
        }

        .gallery-thumb {
          position: relative;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        .gallery-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Itinerary Builder */
        .itinerary-builder {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .itin-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem;
        }

        .itin-card-head {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 0.7rem;
        }

        .itin-day-badge {
          background: #0A1235;
          color: #f6c042;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.35rem 0.65rem;
          border-radius: 6px;
          white-space: nowrap;
        }

        .itin-title-input {
          flex: 1;
          padding: 0.5rem 0.8rem;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #fff;
          font-size: 0.88rem;
          font-weight: 600;
        }

        .itin-desc-input {
          width: 100%;
          padding: 0.6rem 0.8rem;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 0.85rem;
          resize: vertical;
          background: #fff;
        }

        .itin-photo-row {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin-top: 0.5rem;
        }

        .upload-itin-btn {
          font-size: 0.78rem;
          color: #2B47E5;
          font-weight: 600;
          cursor: pointer;
          background: #eef2ff;
          padding: 0.35rem 0.7rem;
          border-radius: 6px;
          display: inline-block;
        }

        .itin-thumb-preview {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 6px;
          overflow: hidden;
        }

        .itin-thumb-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .itin-thumb-remove {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.55);
          color: #fff;
          border: none;
          font-size: 0.8rem;
          opacity: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .itin-thumb-preview:hover .itin-thumb-remove {
          opacity: 1;
        }

        .itin-del-btn {
          background: transparent;
          border: none;
          color: #ef4444;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }

        .btn-add-day {
          background: #eff6ff;
          color: #2563eb;
          border: 1px dashed #93c5fd;
          padding: 0.75rem;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add-day:hover {
          background: #dbeafe;
        }

        .step-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 2rem;
          padding-top: 1.2rem;
          border-top: 1px solid #edf0f7;
        }

        .btn-secondary-outline {
          background: transparent;
          border: 1px solid #cbd5e1;
          color: #475569;
          padding: 0.7rem 1.4rem;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-submit-request {
          background: #10B981 !important;
          color: white;
          padding: 0.75rem 1.8rem;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
        }

        /* Success Screen */
        .partner-success-screen {
          padding: 3rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .success-icon-wrap {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: #d1fae5;
          color: #059669;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.2rem;
        }

        .partner-success-screen h4 {
          font-size: 1.45rem;
          font-weight: 800;
          color: #0A1235;
          margin: 0 0 0.6rem 0;
        }

        .partner-success-screen p {
          color: #4b5563;
          font-size: 0.95rem;
          max-width: 500px;
          line-height: 1.5;
        }

        .submission-ref-box {
          margin: 1.2rem 0;
          background: #f1f5f9;
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          display: flex;
          gap: 0.6rem;
          align-items: center;
          font-size: 0.88rem;
          color: #334155;
        }

        .submission-ref-box code {
          font-weight: 700;
          color: #2B47E5;
          font-size: 0.95rem;
        }

        .subtext {
          font-size: 0.85rem !important;
          color: #64748b !important;
          margin-bottom: 1.8rem !important;
        }

        .success-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .btn-whatsapp-direct {
          background: #25D366;
          color: white;
          padding: 0.75rem 1.4rem;
          border-radius: 10px;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }

        @media (max-width: 640px) {
          .form-grid-2, .form-grid-3 {
            grid-template-columns: 1fr;
          }
          .partner-step-tabs {
            padding: 0.5rem;
          }
          .step-label {
            display: none;
          }
          .step-content {
            padding: 1.2rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}
