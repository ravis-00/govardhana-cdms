import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import { addCattle, getUnregisteredBirths } from "../api/masterApi"; 

const CLOUD_NAME = "dvcwgkszp";       
const UPLOAD_PRESET = "cattle_upload"; 

export default function CattleRegistration() {
  const navigate = useNavigate();
  const location = useLocation(); 

  const [loading, setLoading] = useState(false);
  const [birthRecords, setBirthRecords] = useState([]); 
  const [manualBirthEntry, setManualBirthEntry] = useState(false); // 🔥 NEW: Toggle for old data
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    cattleId: "", govtId: "", name: "", gender: "", category: "",
    breed: "", colour: "", typeOfAdmission: "",
    admissionDate: new Date().toISOString().split('T')[0],
    sourceName: "", sourceAddress: "", sourceMobile: "", 
    price: "", weight: "", ageMonths: "0",
    disabilityFlag: "N", disabilityDetails: "", adoptionStatus: "Available",
    locationShed: "", prevTags: "", remarks: "",
    photo: "", 
    damId: "", sireId: "", damBreed: "", sireBreed: "", birthWeight: "",
    linkedBirthId: "" 
  });

  useEffect(() => {
    // If coming from Calving Log "Register" button
    if (location.state && location.state.birthData) {
      const b = location.state.birthData;
      setForm(prev => ({
        ...prev,
        typeOfAdmission: "Born at Goshala",
        linkedBirthId: b.id,
        admissionDate: b.dateOfBirth,
        gender: b.calfSex,
        breed: b.calfBreed,
        weight: b.calfWeight,
        birthWeight: b.calfWeight, 
        colour: b.colour || "", 
        photo: b.photo || "",
        damId: b.motherTag,
        damBreed: b.motherBreed,
        sireId: b.fatherTag,
        sireBreed: b.fatherBreed,
        ageMonths: calculateAge(b.dateOfBirth),
        category: "Calf"
      }));
      setManualBirthEntry(false); // Forced link
    }
  }, [location.state]);

  useEffect(() => {
    // Only fetch list if we are in "Born at Goshala" mode and NOT in manual mode
    if (form.typeOfAdmission === "Born at Goshala" && !form.linkedBirthId && !manualBirthEntry) {
      getUnregisteredBirths().then(data => {
          if(Array.isArray(data)) setBirthRecords(data);
      }).catch(err => console.error("Failed to fetch births", err));
    }
  }, [form.typeOfAdmission, form.linkedBirthId, manualBirthEntry]);

  function calculateAge(dateString) {
    if(!dateString) return "0";
    const dob = new Date(dateString);
    const now = new Date();
    const months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    return months >= 0 ? String(months) : "0";
  }

  function handleBirthSelection(e) {
    const selectedId = e.target.value;
    if (!selectedId) return;
    const calf = birthRecords.find(r => r.id === selectedId);
    if (calf) {
      setForm(prev => ({
        ...prev,
        linkedBirthId: calf.id,
        admissionDate: calf.dateOfBirth,
        gender: calf.calfSex,
        weight: calf.calfWeight,
        birthWeight: calf.calfWeight,
        damId: calf.motherTag,
        damBreed: calf.motherBreed,
        sireId: calf.fatherTag,
        sireBreed: calf.fatherBreed,
        category: "Calf", 
        breed: calf.calfBreed,
        photo: calf.photo || ""
      }));
      setForm(prev => ({...prev, ageMonths: calculateAge(calf.dateOfBirth)}));
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "admissionDate") {
        setForm(prev => ({...prev, ageMonths: calculateAge(value)}));
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);
    data.append("folder", "cattle_photos");
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: data,
      });
      const fileData = await res.json();
      if (fileData.secure_url) {
        setForm(prev => ({ ...prev, photo: fileData.secure_url }));
      } else {
        alert("Upload failed.");
      }
    } catch (err) {
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  function handleDisability(flag) {
    setForm((prev) => ({ ...prev, disabilityFlag: flag }));
  }

  function handleCancel() { navigate("/cattle/master"); } 

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        tagNumber: form.cattleId,
        govtId: form.govtId,
        name: form.name,
        gender: form.gender,
        category: form.category,
        breed: form.breed,
        color: form.colour,
        isDisabled: form.disabilityFlag === "Y",
        disabilityDetails: form.disabilityFlag === "Y" ? form.disabilityDetails : "",
        adoptionStatus: form.adoptionStatus,
        shedId: form.locationShed,
        prevTags: form.prevTags,
        remarks: form.remarks,
        photoUrl: form.photo || "",
        admissionType: form.typeOfAdmission,
        admissionDate: form.admissionDate,
        sourceName: form.sourceName,
        sourceAddress: form.sourceAddress,
        sourceMobile: form.sourceMobile,
        price: form.price,
        weight: form.weight,
        ageMonths: form.ageMonths,
        damId: form.damId,
        sireId: form.sireId,
        damBreed: form.damBreed,
        sireBreed: form.sireBreed,
        birthWeight: form.birthWeight,
        linkedBirthId: manualBirthEntry ? "" : form.linkedBirthId // 🔥 Clear link if manual
      };
      const response = await addCattle(payload);
      if (response && response.success) {
        alert(`SUCCESS: Cattle Registered!\nInternal ID: ${response.id}`); 
        navigate("/cattle/master"); 
      } else {
        alert("Server Error: " + (response?.error || "Unknown"));
      }
    } catch (error) {
      alert("Network/Code Error: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const isLinked = !!form.linkedBirthId;

  // 🔥 Logic: Fields are read-only ONLY if we are linked to a birth record AND not in manual mode
  const isBornLocked = isLinked && !manualBirthEntry; 

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "4rem" }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "700", color: "#111827", margin: 0 }}>Register New Cattle</h1>
        <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>Enter details to add a new animal to the herd.</p>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* --- SECTION 1: IDENTIFICATION --- */}
        <div className="card">
          <h3 className="section-title">Identification</h3>
          <div className="responsive-grid">
             <TextField label="Tag Number *" name="cattleId" value={form.cattleId} onChange={handleChange} placeholder="Enter New Tag" required />
             <TextField label="Govt ID (INAPH)" name="govtId" value={form.govtId} onChange={handleChange} placeholder="Optional" />
          </div>
        </div>

        {/* --- SECTION 2: ORIGIN & SOURCE --- */}
        <div className="card">
          <h3 className="section-title">Origin Details</h3>
          
          <div style={{ marginBottom: "1rem" }}>
             <SelectField label="Type of Admission *" name="typeOfAdmission" value={form.typeOfAdmission} onChange={handleChange} options={["", "Purchase", "Donation", "Born at Goshala", "Rescue"]} disabled={isLinked && !manualBirthEntry} />
          </div>

          {/* Logic for Born at Goshala */}
          {form.typeOfAdmission === "Born at Goshala" && (
             <div style={{ background: "#eff6ff", padding: "1.2rem", borderRadius: "8px", border: "1px solid #bfdbfe", marginBottom: "1rem" }}>
                
                {/* 🔥 NEW: Manual Entry Toggle */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.9rem", fontWeight: "bold", color: "#1e40af" }}>
                        {manualBirthEntry ? "Manual Entry Mode (Old Data)" : "Link to Birth Record (New Borns)"}
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input 
                            type="checkbox" 
                            checked={manualBirthEntry} 
                            onChange={(e) => {
                                setManualBirthEntry(e.target.checked);
                                if (e.target.checked) {
                                    // Clear linked data if switching to manual
                                    setForm(prev => ({ ...prev, linkedBirthId: "" }));
                                }
                            }} 
                            id="manualEntry"
                        />
                        <label htmlFor="manualEntry" style={{ fontSize: "0.85rem", color: "#4b5563", cursor: "pointer" }}>Manual Entry (No Log)</label>
                    </div>
                </div>

                {/* Dropdown (Only show if NOT manual and NOT linked yet) */}
                {!manualBirthEntry && !isLinked && (
                    <div style={{ marginBottom: "1rem" }}>
                        <select onChange={handleBirthSelection} className="form-select" style={{borderColor: "#2563eb"}}>
                            <option value="">-- Select Unregistered Calf --</option>
                            {birthRecords.map(rec => (<option key={rec.id} value={rec.id}>Born: {rec.dateOfBirth} | Mother: {rec.motherTag} | {rec.calfSex}</option>))}
                        </select>
                        <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "4px" }}>
                            * List empty? Ensure calf is entered in "Calving Log" first, or use Manual Entry.
                        </div>
                    </div>
                )}

                {/* Linked Badge */}
                {isLinked && !manualBirthEntry && (
                    <div style={{marginBottom:"1rem", padding:"8px", background:"#dbeafe", color:"#1e40af", fontWeight:"bold", borderRadius:"4px", textAlign:"center"}}>
                        ✓ Linked to Birth Record: {form.linkedBirthId}
                    </div>
                )}
                
                <div className="responsive-grid" style={{ marginTop:"1rem" }}>
                      <TextField label="Mother ID (Dam)" name="damId" value={form.damId} onChange={handleChange} readOnly={!manualBirthEntry} placeholder={manualBirthEntry ? "Enter Dam ID" : "Auto-filled"} />
                      <TextField label="Father ID (Sire)" name="sireId" value={form.sireId} onChange={handleChange} readOnly={!manualBirthEntry} placeholder={manualBirthEntry ? "Enter Sire ID" : "Auto-filled"} />
                      <TextField label="Dam Breed" name="damBreed" value={form.damBreed} onChange={handleChange} readOnly={!manualBirthEntry} />
                      <TextField label="Sire Breed" name="sireBreed" value={form.sireBreed} onChange={handleChange} readOnly={!manualBirthEntry} />
                      <TextField label="Birth Weight" name="birthWeight" value={form.birthWeight} onChange={handleChange} readOnly={!manualBirthEntry} />
                </div>
             </div>
          )}

          {/* Logic for Purchase/Donation */}
          {(form.typeOfAdmission === "Purchase" || form.typeOfAdmission === "Donation" || form.typeOfAdmission === "Rescue") && (
             <div style={{ background: "#f8fafc", padding: "1.2rem", borderRadius: "8px", border: "1px dashed #cbd5e1", marginBottom: "1rem" }}>
                <div className="responsive-grid">
                    <TextField label="Source Name (Vendor/Donor)" name="sourceName" value={form.sourceName} onChange={handleChange} />
                    <TextField label="Source Mobile" name="sourceMobile" value={form.sourceMobile} onChange={handleChange} />
                </div>
                <div style={{ marginTop: "1rem" }}>
                    <TextField label="Source Address" name="sourceAddress" value={form.sourceAddress} onChange={handleChange} />
                </div>
                {form.typeOfAdmission === "Purchase" && (
                    <div style={{ marginTop: "1rem" }}>
                        <TextField label="Purchase Price (₹)" name="price" value={form.price} onChange={handleChange} type="number" />
                    </div>
                )}
             </div>
          )}
        </div>

        {/* --- SECTION 3: DEMOGRAPHICS --- */}
        <div className="card">
           <h3 className="section-title">Demographics</h3>
           <div style={{ marginBottom: "1rem" }}>
              <TextField label="Name *" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Gowri" />
           </div>
           <div className="responsive-grid">
              <SelectField label="Gender *" name="gender" value={form.gender} onChange={handleChange} options={["", "Female", "Male"]} disabled={isBornLocked} />
              <SelectField label="Category *" name="category" value={form.category} onChange={handleChange} options={["", "Milking", "Dry", "Heifer", "Calf", "Bull", "Ox"]} />
              <SelectField label="Breed *" name="breed" value={form.breed} onChange={handleChange} options={["", "Hallikar", "Gir", "Jersey", "HF", "Mix", "Sahiwal", "Kankrej", "Deoni", "Malnad Gidda"]} />
              <TextField label="Color" name="colour" value={form.colour} onChange={handleChange} />
           </div>
        </div>

        {/* --- SECTION 4: PHYSICAL SPECS --- */}
        <div className="card">
           <h3 className="section-title">Physical Specs</h3>
           <div className="responsive-grid">
              <TextField label="Admission Date" name="admissionDate" type="date" value={form.admissionDate} onChange={handleChange} readOnly={isBornLocked} />
              <TextField label="Weight (Kg)" name="weight" value={form.weight} onChange={handleChange} type="number" />
              <TextField label="Age (Months)" name="ageMonths" value={form.ageMonths} onChange={handleChange} readOnly={isBornLocked} type="number" />
           </div>
        </div>

        {/* --- SECTION 5: PHOTO (Mobile Optimized) --- */}
        <div className="card">
           <h3 className="section-title">Cattle Photo</h3>
           <div 
             className="photo-upload-box" 
             onClick={() => !uploading && fileInputRef.current.click()}
           >
              {uploading ? (
                 <span style={{ color: "#2563eb", fontWeight: "bold" }}>Uploading Image...</span>
              ) : form.photo ? (
                 <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", justifyContent: "center" }}>
                    <img src={form.photo} alt="Preview" style={{ maxHeight: "250px", maxWidth: "100%", borderRadius: "8px", objectFit: "contain" }} />
                    <div style={{ position: "absolute", bottom: "10px", background: "rgba(0,0,0,0.6)", color: "white", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem" }}>
                        Click to Change
                    </div>
                 </div>
              ) : (
                 <>
                   <span style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📷</span>
                   <span style={{ color: "#4b5563", fontWeight: "600" }}>Tap to take photo or upload</span>
                   <span style={{ color: "#9ca3af", fontSize: "0.8rem", marginTop: "4px" }}>Supports JPG, PNG</span>
                 </>
              )}
           </div>
           <input 
             type="file" 
             accept="image/*" 
             capture="environment" // Mobile: Use Back Camera
             ref={fileInputRef} 
             onChange={handleFileSelect} 
             style={{display:"none"}} 
           />
        </div>

        {/* --- SECTION 6: STATUS & LOCATION --- */}
        <div className="card">
           <h3 className="section-title">Status & Location</h3>
           
           <div style={{ marginBottom: "1rem" }}>
               <label className="form-label">Permanent Disability?</label>
               <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button 
                    type="button" 
                    onClick={() => handleDisability("N")} 
                    className={`btn ${form.disabilityFlag === "N" ? "btn-primary" : "btn-secondary"}`}
                    style={{ flex: 1 }}
                  >
                    No
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleDisability("Y")} 
                    className={`btn ${form.disabilityFlag === "Y" ? "btn-primary" : "btn-secondary"}`}
                    style={{ flex: 1 }}
                  >
                    Yes
                  </button>
               </div>
           </div>

           <div className="responsive-grid">
               <SelectField label="Shed Location" name="locationShed" value={form.locationShed} onChange={handleChange} options={["", "Punyakoti", "Samrakshana", "Kaveri", "Nandini", "Others"]} />
               <TextField label="Remarks" name="remarks" value={form.remarks} onChange={handleChange} />
           </div>
        </div>

        {/* --- ACTIONS --- */}
        <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", justifyContent: "flex-end" }}>
           <button type="button" onClick={handleCancel} className="btn btn-secondary btn-full-mobile">Cancel</button>
           <button type="submit" disabled={loading} className="btn btn-primary btn-full-mobile">
              {loading ? "Saving..." : "Register Cattle"}
           </button>
        </div>

      </form>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function TextField({ label, name, value, onChange, type="text", readOnly=false, placeholder, required }) { 
  return ( 
    <div className="form-group"> 
       <label className="form-label">{label}</label> 
       <input 
         className="form-input"
         type={type} 
         name={name} 
         value={value} 
         onChange={onChange} 
         readOnly={readOnly} 
         placeholder={placeholder} 
         required={required} 
         style={{ background: readOnly ? "#f3f4f6" : "white", color: readOnly ? "#6b7280" : "inherit" }}
       /> 
    </div> 
  ); 
}

function SelectField({ label, name, value, onChange, options, disabled=false }) { 
  return ( 
    <div className="form-group"> 
       <label className="form-label">{label}</label> 
       <select 
         className="form-select"
         name={name} 
         value={value} 
         onChange={onChange} 
         disabled={disabled} 
         style={{ background: disabled ? "#f3f4f6" : "white" }}
       > 
         {options.map(o => <option key={o} value={o}>{o||"Select..."}</option>)} 
       </select> 
    </div> 
  ); 
}