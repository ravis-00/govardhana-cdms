// src/pages/CattleRegistration.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addCattle } from "../api/cattle";

export default function CattleRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Default State
  const [form, setForm] = useState({
    cattleId: "", govtId: "", name: "", gender: "", category: "",
    breed: "", colour: "", typeOfAdmission: "",
    admissionDate: new Date().toISOString().split('T')[0],
    sourceName: "", sourceAddress: "", sourceMobile: "", 
    price: "", weight: "", ageMonths: "",
    disabilityFlag: "N", disabilityDetails: "", adoptionStatus: "Available",
    locationShed: "", prevTags: "", remarks: ""
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
        ageMonths: form.ageMonths
      };

      console.log("Sending Payload:", payload); // Check your Console for this!

      const response = await addCattle(payload);
      
      // FIXED: Alert the REAL message from the server
      if (response && response.success) {
        alert(`SERVER RESPONSE:\n${response.message}`); 
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

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "720px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: "1rem" }}>Cattle Registration (v1.1)</h1>
      
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem", background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        
        <TextField label="Tag Number *" name="cattleId" value={form.cattleId} onChange={handleChange} />
        <TextField label="Govt ID (INAPH)" name="govtId" value={form.govtId} onChange={handleChange} />
        <TextField label="Name *" name="name" value={form.name} onChange={handleChange} />
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <SelectField label="Gender *" name="gender" value={form.gender} onChange={handleChange} options={["", "Female", "Male"]} />
          <SelectField label="Category *" name="category" value={form.category} onChange={handleChange} options={["", "Milking", "Dry", "Heifer", "Calf", "Bull", "Ox"]} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <SelectField label="Breed *" name="breed" value={form.breed} onChange={handleChange} options={["", "Hallikar", "Gir", "Jersey", "HF", "Mix", "Sahiwal"]} />
          <TextField label="Color *" name="colour" value={form.colour} onChange={handleChange} />
        </div>

        {/* --- ORIGINS SECTION --- */}
        <h3 style={{ borderBottom: "2px solid #f3f4f6", paddingBottom: "0.5rem", color: "#374151" }}>Origin Details</h3>
        
        <SelectField label="Type of Admission *" name="typeOfAdmission" value={form.typeOfAdmission} onChange={handleChange} 
             options={["", "Purchase", "Donation", "Born at Goshala", "Rescue"]} />

        {/* DYNAMIC FIELDS: Verify these appear on screen! */}
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
           <TextField label="Admission Date" name="admissionDate" type="date" value={form.admissionDate} onChange={handleChange} />
           <TextField label="Weight (Kg)" name="weight" value={form.weight} onChange={handleChange} />
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

function TextField({ label, name, value, onChange, type="text" }) {
  return <div><label style={{display:"block", fontSize:"0.85rem", marginBottom:"0.2rem"}}>{label}</label><input type={type} name={name} value={value} onChange={onChange} style={{width:"100%", padding:"0.6rem", border:"1px solid #ccc", borderRadius:"6px"}} /></div>;
}
function SelectField({ label, name, value, onChange, options }) {
  return <div><label style={{display:"block", fontSize:"0.85rem", marginBottom:"0.2rem"}}>{label}</label><select name={name} value={value} onChange={onChange} style={{width:"100%", padding:"0.6rem", border:"1px solid #ccc", borderRadius:"6px", background:"white"}}>{options.map(o => <option key={o} value={o}>{o||"Select..."}</option>)}</select></div>;
}