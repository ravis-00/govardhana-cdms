import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import { addCattle, getUnregisteredBirths } from "../api/masterApi"; 
import PageHeader from "../components/common/PageHeader";
import SectionCard from "../components/common/SectionCard";
import FormActions from "../components/common/FormActions";
import ProgressToast from "../components/common/ProgressToast";

const CLOUD_NAME = "dvcwgkszp";       
const UPLOAD_PRESET = "cattle_upload"; 

function getCategoryOptions(gender) {
  const g = String(gender || "").toLowerCase();

  if (g === "male") {
    return [
      "",
      "Male Calf",
      "Bull",
      "Ox / Bullock",
    ];
  }

  if (g === "female") {
    return [
      "",
      "Female Calf",
      "Heifer",
      "Cow",
      "Milking Cow",
      "Dry Cow",
    ];
  }

  return [
    "",
    "Calf",
    "Male Calf",
    "Female Calf",
    "Heifer",
    "Cow",
    "Milking Cow",
    "Dry Cow",
    "Bull",
    "Ox / Bullock",
  ];
}

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
    breed: "", colour: "", pattern: "", typeOfAdmission: "",
    admissionDate: new Date().toISOString().split('T')[0],
    sourceName: "", sourceAddress: "", sourceMobile: "", 
    price: "", weight: "", ageMonths: "",ageYears:"0",ageMonthsPart:"0",
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
        damInternalId: b.motherId,
        damBreed: b.motherBreed,
        sireId: b.fatherTag,
        sireInternalId: b.fatherId,
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

  if (name === "price") {
    const onlyDigits = value.replace(/\D/g, "");
    setForm((prev) => ({ ...prev, [name]: onlyDigits }));
    return;
  }

  if (name === "gender") {
    setForm((prev) => ({
      ...prev,
      gender: value,
      category: "",
    }));
    return;
  }

  if (name === "ageYears" || name === "ageMonthsPart") {
  setForm((prev) => {
    const updated = {
      ...prev,
      [name]: value,
    };

    const years = Number(updated.ageYears || 0);
    const months = Number(updated.ageMonthsPart || 0);

    return {
      ...updated,
      ageMonths: String(years * 12 + months),
    };
  });

  return;
}

  setForm((prev) => ({ ...prev, [name]: value }));

  if (name === "admissionDate") {
    setForm((prev) => ({ ...prev, ageMonths: calculateAge(value) }));
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

  const ageYears = Number(form.ageYears || 0);
  const ageMonthsPart = Number(form.ageMonthsPart || 0);
  const totalAgeMonths = ageYears * 12 + ageMonthsPart;

  if (totalAgeMonths === 0) {
    alert("Please enter valid age. Years and months cannot both be 0.");
    return;
  }

  const isBornAtGoshala = form.typeOfAdmission === "Born at Goshala";

  setLoading(true);

  try {
    const payload = {
      // cattle_master fields
      tagNumber: form.cattleId,
      govtUid: form.govtId,
      prevTagNumbers: form.prevTags,

      cattleName: form.name,
      gender: form.gender,
      category: form.category,
      breed: form.breed,
      color: form.colour,

      dob: isBornAtGoshala ? form.admissionDate : "",

      shedId: form.locationShed,
      status: "Active",
      adoptionStatus: form.adoptionStatus || "Available",
      photoUrl: form.photo,

      isDisabled: form.disabilityFlag,
      disabilityDetails: form.disabilityDetails,
      remarks: form.remarks,

      // cattle_origins fields
      admissionDate: form.admissionDate,
      admissionType: form.typeOfAdmission,
      admissionAgeMonths: String(totalAgeMonths),

      sourcePartyName: form.sourceName,
      sourcePartyAddress: form.sourceAddress,
      sourcePartyMobile: form.sourceMobile,

      admissionWeight: form.weight,
      birthWeight: form.birthWeight,

      purchasePrice:
        form.typeOfAdmission === "Purchase"
          ? form.price
          : "",

      damId: form.damId,
      damBreed: form.damBreed,
      sireId: form.sireId,
      sireBreed: form.sireBreed,

      linkedBirthId: form.linkedBirthId,
    };

    console.log("Registration payload:", payload);

    const response = await addCattle(payload);

    alert(
      `SUCCESS: Cattle Registered!\nInternal ID: ${
        response?.id || response?.internalId || "Generated"
      }`
    );

    navigate("/cattle/master");
  } catch (error) {
    console.error("Registration failed:", error);
    alert("Failed to register cattle. Please try again.");
  } finally {
    setLoading(false);
  }
}

  const isLinked = !!form.linkedBirthId;

  // 🔥 Logic: Fields are read-only ONLY if we are linked to a birth record AND not in manual mode
  const isBornLocked = isLinked && !manualBirthEntry; 

  return (
  <div style={pageWrapStyle}>
    <ProgressToast
      show={loading}
      type="loading"
      message="Registering cattle, please wait..."
    />
      
      <PageHeader
  title="🐄 Register New Cattle"
  description="Register cattle born, purchased, donated, rescued or admitted to the goshala."
/>

      <form onSubmit={handleSubmit}>
  <div style={registrationGridStyle}>
        
        {/* --- SECTION 1: IDENTIFICATION --- */}
        <SectionCard title="Identification">
          <div className="responsive-grid">
             <TextField label="Tag Number *" name="cattleId" value={form.cattleId} onChange={handleChange} placeholder="Enter New Tag" required />
             <TextField label="Govt ID (INAPH)" name="govtId" value={form.govtId} onChange={handleChange} placeholder="Optional" />
          </div>
        </SectionCard>

        {/* --- SECTION 2: ORIGIN & SOURCE --- */}
        <SectionCard title="Origin Details">
          
          <div style={{ marginBottom: "1rem" }}>
             <SelectField label="Type of Admission *" name="typeOfAdmission" value={form.typeOfAdmission} onChange={handleChange} options={["", "Purchase", "Donation", "Born at Goshala", "From Farmer", "Rescue / Slaughter House"]} disabled={isLinked && !manualBirthEntry} />
          </div>

          

          
        </SectionCard>

{form.typeOfAdmission === "Born at Goshala" && (
  <SectionCard
    title="Birth / Parentage Details"
    style={{ gridColumn: "1 / -1" }}
  >
    <div style={birthRecordPanelStyle}>
      <div style={birthRecordHeaderStyle}>
        <label style={birthRecordTitleStyle}>
          {manualBirthEntry
            ? "Manual birth details"
  : "Birth Record Link"}
        </label>

        <div style={manualToggleStyle}>
          <input
            type="checkbox"
            checked={manualBirthEntry}
            onChange={(e) => {
              setManualBirthEntry(e.target.checked);
              if (e.target.checked) {
                setForm((prev) => ({ ...prev, linkedBirthId: "" }));
              }
            }}
            id="manualEntry"
          />

          <label
            htmlFor="manualEntry"
            style={{
              fontSize: "0.85rem",
              color: "#4b5563",
              cursor: "pointer",
            }}
          >
            Manual birth details
          </label>
        </div>
      </div>

      {!manualBirthEntry && !isLinked && (
        <div style={{ marginBottom: "1rem" }}>
          <select
            onChange={handleBirthSelection}
            className="form-select"
            style={{ borderColor: "#2563eb" }}
          >
            <option value="">Select calf from Calving Log</option>
            {birthRecords.map((rec) => (
              <option key={rec.id} value={rec.id}>
                Born: {rec.dateOfBirth} | Mother: {rec.motherTag} | {rec.calfSex}
              </option>
            ))}
          </select>

          <div style={birthHelpTextStyle}>
           Use this option to link a calf already recorded in Calving Log. Use manual birth details only for old records not available in Calving Log.
          </div>
        </div>
      )}

      {isLinked && !manualBirthEntry && (
        <div style={linkedBirthBadgeStyle}>
          ✓ Linked to Birth Record: {form.linkedBirthId}
        </div>
      )}

      <div className="responsive-grid" style={{ marginTop: "1rem" }}>
       <TextField
  label="Mother Tag / ID"
  name="damId"
  value={form.damId}
  onChange={handleChange}
  readOnly={!manualBirthEntry}
  placeholder={manualBirthEntry ? "Enter Mother Tag / ID" : "Auto-filled"}
/>

<TextField
  label="Father Tag / ID"
  name="sireId"
  value={form.sireId}
  onChange={handleChange}
  readOnly={!manualBirthEntry}
  placeholder={manualBirthEntry ? "Enter Father Tag / ID" : "Auto-filled"}
/>

<TextField
  label="Mother Breed"
  name="damBreed"
  value={form.damBreed}
  onChange={handleChange}
  readOnly={!manualBirthEntry}
/>

<TextField
  label="Father Breed"
  name="sireBreed"
  value={form.sireBreed}
  onChange={handleChange}
  readOnly={!manualBirthEntry}
/>

<TextField
  label="Birth Weight (Kg)"
  name="birthWeight"
  value={form.birthWeight}
  onChange={handleChange}
  readOnly={!manualBirthEntry}
/>
      </div>
    </div>
  </SectionCard>
)}

{["Purchase", "Donation", "From Farmer", "Rescue / Slaughter House"].includes(form.typeOfAdmission) && (
  <SectionCard
    title={
      form.typeOfAdmission === "Purchase"
        ? "Purchase Source Details"
        : form.typeOfAdmission === "Donation"
        ? "Donation Source Details"
        : form.typeOfAdmission === "From Farmer"
        ? "Farmer Source Details"
        : "Rescue Source Details"
    }
    style={{ gridColumn: "1 / -1" }}
  >
    <div style={sourceDetailsPanelStyle}>
      <div className="responsive-grid">
        <TextField
          label={
            form.typeOfAdmission === "Purchase"
              ? "Vendor Name"
              : form.typeOfAdmission === "Donation"
              ? "Donor Name"
              : form.typeOfAdmission === "From Farmer"
              ? "Farmer Name"
              : "Rescue Source Name"
          }
          name="sourceName"
          value={form.sourceName}
          onChange={handleChange}
        />

        <TextField
          label={
            form.typeOfAdmission === "Purchase"
              ? "Vendor Phone Number"
              : form.typeOfAdmission === "Donation"
              ? "Donor Phone Number"
              : form.typeOfAdmission === "From Farmer"
              ? "Farmer Phone Number"
              : "Source Phone Number"
          }
          name="sourceMobile"
          value={form.sourceMobile}
          onChange={handleChange}
        />
      </div>

      <TextField
        label={
          form.typeOfAdmission === "Purchase"
            ? "Vendor Address"
            : form.typeOfAdmission === "Donation"
            ? "Donor Address"
            : form.typeOfAdmission === "From Farmer"
            ? "Farmer Address"
            : "Rescue Location / Address"
        }
        name="sourceAddress"
        value={form.sourceAddress}
        onChange={handleChange}
      />

      {form.typeOfAdmission === "Purchase" && (
        <TextField
          label="Purchase Price (₹)"
          name="Price"
          type="number"
          value={form.Price}
          onChange={handleChange}
        />
      )}
    </div>
  </SectionCard>
)}

        {/* --- SECTION 3: DEMOGRAPHICS --- */}
        <SectionCard title="Demographics">
           <div style={{ marginBottom: "1rem" }}>
              <TextField label="Name *" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Gowri" />
           </div>
           <div className="responsive-grid">
              <SelectField label="Gender *" name="gender" value={form.gender} onChange={handleChange} options={["", "Female", "Male"]} disabled={isBornLocked} />
              <SelectField
  label="Category *"
  name="category"
  value={form.category}
  onChange={handleChange}
  options={getCategoryOptions(form.gender)}
/>
              <SelectField label="Breed *" name="breed" value={form.breed} onChange={handleChange} options={["", "Hallikar", "Gir", "Jersey", "HF", "Mix", "Sahiwal", "Kankrej", "Deoni", "Malnad Gidda"]} />
              <SelectField
  label="Base Colour"
  name="colour"
  value={form.colour}
  onChange={handleChange}
  options={[
    "",
    "Black",
    "White",
    "Grey",
    "Brown",
    "Red",
    "Reddish Brown",
    "Fawn",
    "Cream",
    "Mixed",
    "To be confirmed",
    
  ]}
/>
<TextField
  label="Pattern"
  name="pattern"
  value={form.pattern}
  onChange={handleChange}
  placeholder="Optional, e.g. white patches, dorsal stripe"
/>
           </div>
        </SectionCard>

        {/* --- SECTION 4: PHYSICAL SPECS --- */}
        <SectionCard title="Physical Specs">
           <div className="responsive-grid">
              <TextField
  label={
    form.typeOfAdmission === "Born at Goshala"
      ? "Date of Birth"
      : "Admission Date"
  }
  name="admissionDate"
  value={form.admissionDate}
  onChange={handleChange}
  type="date"
/>
              <TextField label="Weight (Kg)" name="weight" value={form.weight} onChange={handleChange} type="number" />
              <div>
  <label className="form-label">Age *</label>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0.75rem",
    }}
  >
    <SelectField
      label="Years"
      name="ageYears"
      value={form.ageYears}
      onChange={handleChange}
      options={ageYearOptions}
    />

    <SelectField
      label="Months"
      name="ageMonthsPart"
      value={form.ageMonthsPart}
      onChange={handleChange}
      options={ageMonthOptions}
    />
  </div>

  <div
    style={{
      marginTop: "0.35rem",
      fontSize: "0.78rem",
      color: "#64748b",
      fontWeight: 600,
    }}
  >
    Total age: {formatAgeFromMonths(form.ageMonths)}
  </div>
</div>
           </div>
        </SectionCard>

        {/* --- SECTION 5: PHOTO (Mobile Optimized) --- */}
        <SectionCard title="Cattle Photo">
           <div
  style={photoUploadBoxStyle}
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
       </SectionCard>

        {/* --- SECTION 6: STATUS & LOCATION --- */}
        <SectionCard title="Status & Location">
           
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
        </SectionCard>
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

const pageWrapStyle = {
  maxWidth: "1180px",
  margin: "0 auto",
  padding: "1.5rem",
  paddingBottom: "4rem",
  boxSizing: "border-box",
};

const registrationGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "1rem",
  alignItems: "start",
};

const photoUploadBoxStyle = {
  minHeight: "150px",
  border: "2px dashed #cbd5e1",
  borderRadius: "12px",
  background: "#f8fafc",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  cursor: "pointer",
  padding: "1rem",
  textAlign: "center",
};

const birthRecordPanelStyle = {
  background: "#eff6ff",
  padding: "1rem",
  borderRadius: "10px",
  border: "1px solid #bfdbfe",
};

const birthRecordHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  marginBottom: "1rem",
  flexWrap: "wrap",
};

const birthRecordTitleStyle = {
  fontSize: "0.9rem",
  fontWeight: 800,
  color: "#1e40af",
};

const manualToggleStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const birthHelpTextStyle = {
  fontSize: "0.75rem",
  color: "#6b7280",
  marginTop: "4px",
};

const linkedBirthBadgeStyle = {
  marginBottom: "1rem",
  padding: "8px",
  background: "#dbeafe",
  color: "#1e40af",
  fontWeight: 800,
  borderRadius: "6px",
  textAlign: "center",
};

const sourceDetailsPanelStyle = {
  background: "#f8fafc",
  padding: "1rem",
  borderRadius: "10px",
  border: "1px dashed #cbd5e1",
};

const ageYearOptions = Array.from({ length: 21 }, (_, i) => String(i));
const ageMonthOptions = Array.from({ length: 12 }, (_, i) => String(i));


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

function formatAgeFromMonths(totalMonths) {
  const monthsNumber = Number(totalMonths || 0);

  if (!monthsNumber) return "0 months";

  const years = Math.floor(monthsNumber / 12);
  const months = monthsNumber % 12;

  if (years === 0) return `${months} month${months === 1 ? "" : "s"}`;
  if (months === 0) return `${years} year${years === 1 ? "" : "s"}`;

  return `${years} year${years === 1 ? "" : "s"} ${months} month${months === 1 ? "" : "s"}`;
}