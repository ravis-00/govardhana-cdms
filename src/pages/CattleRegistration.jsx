// src/pages/CattleRegistration.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// NOTE: You must implement getUnregisteredBirths in your api file
import { addCattle, getUnregisteredBirths } from "../api/cattle"; 

export default function CattleRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [birthRecords, setBirthRecords] = useState([]); // Stores the list of unregistered calves

  // Default State
  const [form, setForm] = useState({
    cattleId: "", govtId: "", name: "", gender: "", category: "",
    breed: "", colour: "", typeOfAdmission: "",
    admissionDate: new Date().toISOString().split('T')[0],
    sourceName: "", sourceAddress: "", sourceMobile: "", 
    price: "", weight: "", ageMonths: "0",
    disabilityFlag: "N", disabilityDetails: "", adoptionStatus: "Available",
    locationShed: "", prevTags: "", remarks: "",
    
    // NEW: Parentage & Linkage Fields
    damId: "", sireId: "", damBreed: "", sireBreed: "", birthWeight: "",
    linkedBirthId: "" // Internal ID to link back to birth_log
  });

  // --- EFFECT: Fetch Birth Records when "Born at Goshala" is selected ---
  useEffect(() => {
    if (form.typeOfAdmission === "Born at Goshala") {
      // Mocking the fetch - replace with real API call
      // getUnregisteredBirths().then(data => setBirthRecords(data)); 
      
      // FOR NOW: Simulating data so you can see it work
      const mockData = [
        { id: 101, dob: "2025-12-01", gender: "Female", weight: "22", damId: "1040", damBreed: "Gir", sireId: "2002", sireBreed: "Gir" },
        { id: 102, dob: "2025-12-05", gender: "Male", weight: "25", damId: "1055", damBreed: "Hallikar", sireId: "Unknown", sireBreed: "Unknown" }
      ];
      setBirthRecords(mockData); 
    } else {
      setBirthRecords([]); // Clear if user changes mind
    }
  }, [form.typeOfAdmission]);

  // --- LOGIC: Auto-fill form when a specific Calf is selected ---
  function handleBirthSelection(e) {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const calf = birthRecords.find(r => r.id.toString() === selectedId);
    if (calf) {
      setForm(prev => ({
        ...prev,
        linkedBirthId: calf.id,
        admissionDate: calf.dob, // Admission date IS Date of Birth for internal births
        gender: calf.gender,
        weight: calf.weight,
        birthWeight: calf.weight,
        damId: calf.damId,
        damBreed: calf.damBreed,
        sireId: calf.sireId,
        sireBreed: calf.sireBreed,
        category: "Calf", // Auto-set category
        breed: calf.damBreed // Default to Dam's breed
      }));
      
      // Auto-calculate age
      calculateAge(calf.dob);
    }
  }

  function calculateAge(dateString) {
    if(!dateString) return;
    const dob = new Date(dateString);
    const now = new Date();
    const months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    setForm(prev => ({ ...prev, ageMonths: months >= 0 ? months : 0 }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Recalculate age if date changes manually
    if (name === "admissionDate") {
        calculateAge(value);
    }
  }

  function handleDisability(flag) {
    setForm((prev) => ({ ...prev, disabilityFlag: flag }));
  }

  function handleCancel() { navigate("/cattle/active"); }

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
        photoUrl: "", 

        // ORIGINS PAYLOAD
        admissionType: form.typeOfAdmission,
        admissionDate: form.admissionDate,
        sourceName: form.sourceName,
        sourceAddress: form.sourceAddress,
        sourceMobile: form.sourceMobile,
        price: form.price,
        weight: form.weight,
        ageMonths: form.ageMonths,

        // NEW PARENTAGE FIELDS
        damId: form.damId,
        sireId: form.sireId,
        damBreed: form.damBreed,
        sireBreed: form.sireBreed,
        birthWeight: form.birthWeight,
        linkedBirthId: form.linkedBirthId // Send this so backend knows to update birth_log
      };

      console.log("Sending Payload:", payload); 

      const response = await addCattle(payload);
      
      if (response && response.success) {
        alert(`SUCCESS:\n${response.message}`); 
        navigate("/cattle/active");
      } else {
        alert("Server Error: " + (response?.error || "Unknown"));
      }

    } catch (error) {
      console.error("Save Error:", error);
      alert("Network/Code Error: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  // Boolean helper to disable fields if data came from Birth Log
  const isLinked = !!form.linkedBirthId;

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "720px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: "1rem" }}>Cattle Registration (v1.2)</h1>
      
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem", background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        
        {/* --- TAG IDS --- */}
        <TextField label="Tag Number *" name="cattleId" value={form.cattleId} onChange={handleChange} />
        <TextField label="Govt ID (INAPH)" name="govtId" value={form.govtId} onChange={handleChange} />
        
        {/* --- ORIGINS SECTION (Moved Up for better workflow) --- */}
        <h3 style={{ borderBottom: "2px solid #f3f4f6", paddingBottom: "0.5rem", color: "#374151", marginTop: "1rem" }}>Origin Details</h3>
        
        <SelectField label="Type of Admission *" name="typeOfAdmission" value={form.typeOfAdmission} onChange={handleChange} 
             options={["", "Purchase", "Donation", "Born at Goshala", "Rescue"]} />

        {/* --- SCENARIO A: BORN AT GOSHALA --- */}
        {form.typeOfAdmission === "Born at Goshala" && (
            <div style={{ background: "#eff6ff", padding: "1rem", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                <label style={{display:"block", fontSize:"0.85rem", marginBottom:"0.2rem", fontWeight:"bold", color:"#1e40af"}}>Select Newborn Record:</label>
                <select onChange={handleBirthSelection} style={{width:"100%", padding:"0.6rem", border:"1px solid #2563eb", borderRadius:"6px"}}>
                    <option value="">-- Select Unregistered Calf --</option>
                    {birthRecords.map(rec => (
                        <option key={rec.id} value={rec.id}>
                            Born: {rec.dob} | Mother: {rec.damId} | {rec.gender}
                        </option>
                    ))}
                </select>
                
                {isLinked && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop:"1rem" }}>
                         <TextField label="Mother ID (Dam)" name="damId" value={form.damId} onChange={handleChange} readOnly={true} />
                         <TextField label="Father ID (Sire)" name="sireId" value={form.sireId} onChange={handleChange} readOnly={true} />
                         <TextField label="Dam Breed" name="damBreed" value={form.damBreed} onChange={handleChange} readOnly={true} />
                         <TextField label="Sire Breed" name="sireBreed" value={form.sireBreed} onChange={handleChange} readOnly={true} />
                         <TextField label="Birth Weight" name="birthWeight" value={form.birthWeight} onChange={handleChange} readOnly={true} />
                    </div>
                )}
            </div>
        )}

        {/* --- SCENARIO B: PURCHASE / EXTERNAL --- */}
        {(form.typeOfAdmission === "Purchase" || form.typeOfAdmission === "Donation" || form.typeOfAdmission === "Rescue") && (
            <div style={{ background: "#f9fafb", padding: "1rem", borderRadius: "8px", border: "1px dashed #ccc" }}>
                <TextField label="Source Name (Vendor/Donor)" name="sourceName" value={form.sourceName} onChange={handleChange} />
                <TextField label="Source Address" name="sourceAddress" value={form.sourceAddress} onChange={handleChange} />
                <TextField label="Source Mobile" name="sourceMobile" value={form.sourceMobile} onChange={handleChange} />
                {form.typeOfAdmission === "Purchase" && (
                    <TextField label="Purchase Price (₹)" name="price" value={form.price} onChange={handleChange} />
                )}
            </div>
        )}

        {/* --- BASIC INFO (After Origin, because Origin determines some of this) --- */}
        <TextField label="Name *" name="name" value={form.name} onChange={handleChange} />
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {/* If Linked, Gender is ReadOnly because it comes from Birth Record */}
          <SelectField label="Gender *" name="gender" value={form.gender} onChange={handleChange} 
                       options={["", "Female", "Male"]} disabled={isLinked} />
          
          <SelectField label="Category *" name="category" value={form.category} onChange={handleChange} 
                       options={["", "Milking", "Dry", "Heifer", "Calf", "Bull", "Ox"]} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <SelectField label="Breed *" name="breed" value={form.breed} onChange={handleChange} options={["", "Hallikar", "Gir", "Jersey", "HF", "Mix", "Sahiwal"]} />
          <TextField label="Color *" name="colour" value={form.colour} onChange={handleChange} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
           <TextField label="Admission Date" name="admissionDate" type="date" value={form.admissionDate} onChange={handleChange} readOnly={isLinked} />
           <TextField label="Weight (Kg)" name="weight" value={form.weight} onChange={handleChange} readOnly={isLinked} />
           <TextField label="Age (Months)" name="ageMonths" value={form.ageMonths} onChange={handleChange} />
        </div>

        {/* --- STATUS --- */}
        <h3 style={{ borderBottom: "2px solid #f3f4f6", paddingBottom: "0.5rem", color: "#374151" }}>Status</h3>
        
        <label style={{ fontSize: "0.85rem", color: "#4b5563" }}>Permanent Disability?</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
           <button type="button" onClick={() => handleDisability("N")} style={form.disabilityFlag === "N" ? activeBtn : inactiveBtn}>No</button>
           <button type="button" onClick={() => handleDisability("Y")} style={form.disabilityFlag === "Y" ? activeBtn : inactiveBtn}>Yes</button>
        </div>
        
        <SelectField label="Shed Location" name="locationShed" value={form.locationShed} onChange={handleChange} options={["", "Goshala-1", "Goshala-2", "Quarantine"]} />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
          <button type="button" onClick={handleCancel} disabled={loading} style={btnStyle}>Cancel</button>
          <button type="submit" disabled={loading} style={{...btnStyle, background: "#2563eb", color: "#fff"}}>{loading ? "Saving..." : "Save"}</button>
        </div>
      </form>
    </div>
  );
}

const btnStyle = { padding: "0.6rem 1.2rem", borderRadius: "20px", border: "1px solid #ddd", background: "white", cursor: "pointer" };
const activeBtn = { flex: 1, padding: "0.5rem", borderRadius: "8px", border: "2px solid #2563eb", background: "#eff6ff", color: "#2563eb", fontWeight: "bold" };
const inactiveBtn = { flex: 1, padding: "0.5rem", borderRadius: "8px", border: "1px solid #ddd", background: "white", color: "#6b7280" };

// Updated TextField to support ReadOnly and Disabled props
function TextField({ label, name, value, onChange, type="text", readOnly=false }) {
  return (
    <div>
        <label style={{display:"block", fontSize:"0.85rem", marginBottom:"0.2rem"}}>{label}</label>
        <input 
            type={type} 
            name={name} 
            value={value} 
            onChange={onChange} 
            readOnly={readOnly}
            style={{
                width:"100%", padding:"0.6rem", border:"1px solid #ccc", borderRadius:"6px",
                background: readOnly ? "#f3f4f6" : "white", // Grey out if readOnly
                color: readOnly ? "#6b7280" : "black"
            }} 
        />
    </div>
  );
}

// Updated SelectField to support Disabled prop
function SelectField({ label, name, value, onChange, options, disabled=false }) {
  return (
    <div>
        <label style={{display:"block", fontSize:"0.85rem", marginBottom:"0.2rem"}}>{label}</label>
        <select 
            name={name} 
            value={value} 
            onChange={onChange} 
            disabled={disabled}
            style={{
                width:"100%", padding:"0.6rem", border:"1px solid #ccc", borderRadius:"6px", 
                background: disabled ? "#f3f4f6" : "white"
            }}
        >
            {options.map(o => <option key={o} value={o}>{o||"Select..."}</option>)}
        </select>
    </div>
  );
}