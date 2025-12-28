// src/pages/CattleRegistration.jsx
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
    }
  }, [location.state]);

  useEffect(() => {
    if (form.typeOfAdmission === "Born at Goshala" && !form.linkedBirthId) {
      getUnregisteredBirths().then(data => {
          if(Array.isArray(data)) setBirthRecords(data);
      }).catch(err => console.error("Failed to fetch births", err));
    }
  }, [form.typeOfAdmission, form.linkedBirthId]);

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
        linkedBirthId: form.linkedBirthId 
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

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "720px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: "1rem" }}>Cattle Registration </h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem", background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <TextField label="Tag Number *" name="cattleId" value={form.cattleId} onChange={handleChange} placeholder="Enter New Tag" required />
        <TextField label="Govt ID (INAPH)" name="govtId" value={form.govtId} onChange={handleChange} />
        <h3 style={{ borderBottom: "2px solid #f3f4f6", paddingBottom: "0.5rem", color: "#374151", marginTop: "1rem" }}>Origin Details</h3>
        <SelectField label="Type of Admission *" name="typeOfAdmission" value={form.typeOfAdmission} onChange={handleChange} options={["", "Purchase", "Donation", "Born at Goshala", "Rescue"]} disabled={isLinked} />
        {form.typeOfAdmission === "Born at Goshala" && (
            <div style={{ background: "#eff6ff", padding: "1rem", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                {isLinked ? (
                    <div style={{marginBottom:"1rem", padding:"8px", background:"#dbeafe", color:"#1e40af", fontWeight:"bold", borderRadius:"4px"}}>✓ Linked to Birth Record: {form.linkedBirthId}</div>
                ) : (
                    <>
                        <label style={{display:"block", fontSize:"0.85rem", marginBottom:"0.2rem", fontWeight:"bold", color:"#1e40af"}}>Select Unregistered Calf:</label>
                        <select onChange={handleBirthSelection} style={{width:"100%", padding:"0.6rem", border:"1px solid #2563eb", borderRadius:"6px"}}>
                            <option value="">-- Select --</option>
                            {birthRecords.map(rec => (<option key={rec.id} value={rec.id}>Born: {rec.dateOfBirth} | Mother: {rec.motherTag} | {rec.calfSex}</option>))}
                        </select>
                    </>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop:"1rem" }}>
                      <TextField label="Mother ID (Dam)" name="damId" value={form.damId} onChange={handleChange} readOnly={true} />
                      <TextField label="Father ID (Sire)" name="sireId" value={form.sireId} onChange={handleChange} readOnly={true} />
                      <TextField label="Dam Breed" name="damBreed" value={form.damBreed} onChange={handleChange} readOnly={true} />
                      <TextField label="Sire Breed" name="sireBreed" value={form.sireBreed} onChange={handleChange} readOnly={true} />
                      <TextField label="Birth Weight" name="birthWeight" value={form.birthWeight} onChange={handleChange} readOnly={true} />
                </div>
            </div>
        )}
        {(form.typeOfAdmission === "Purchase" || form.typeOfAdmission === "Donation" || form.typeOfAdmission === "Rescue") && (
            <div style={{ background: "#f9fafb", padding: "1rem", borderRadius: "8px", border: "1px dashed #ccc" }}>
                <TextField label="Source Name (Vendor/Donor)" name="sourceName" value={form.sourceName} onChange={handleChange} />
                <TextField label="Source Address" name="sourceAddress" value={form.sourceAddress} onChange={handleChange} />
                <TextField label="Source Mobile" name="sourceMobile" value={form.sourceMobile} onChange={handleChange} />
                {form.typeOfAdmission === "Purchase" && (<TextField label="Purchase Price (₹)" name="price" value={form.price} onChange={handleChange} />)}
            </div>
        )}
        <TextField label="Name *" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Gowri" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <SelectField label="Gender *" name="gender" value={form.gender} onChange={handleChange} options={["", "Female", "Male"]} disabled={isLinked} />
          <SelectField label="Category *" name="category" value={form.category} onChange={handleChange} options={["", "Milking", "Dry", "Heifer", "Calf", "Bull", "Ox"]} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <SelectField label="Breed *" name="breed" value={form.breed} onChange={handleChange} options={["", "Hallikar", "Gir", "Jersey", "HF", "Mix", "Sahiwal", "Kankrej", "Deoni", "Malnad Gidda"]} />
          <TextField label="Color" name="colour" value={form.colour} onChange={handleChange} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
           <TextField label="Admission Date" name="admissionDate" type="date" value={form.admissionDate} onChange={handleChange} readOnly={isLinked} />
           <TextField label="Weight (Kg)" name="weight" value={form.weight} onChange={handleChange} />
           <TextField label="Age (Months)" name="ageMonths" value={form.ageMonths} onChange={handleChange} readOnly={isLinked} />
        </div>
        <div style={{marginTop: "10px", background: "#f0f9ff", padding: "12px", borderRadius: "8px", border: "1px solid #bae6fd"}}>
            <label style={{display:"block", fontSize:"0.9rem", fontWeight:600, color:"#0369a1", marginBottom:"5px"}}>Cattle Photo</label>
            <div style={{display:"flex", gap:"10px"}}>
                <input type="text" name="photo" value={form.photo || ""} onChange={handleChange} placeholder="Image URL..." readOnly style={{flex:1, padding:"8px", borderRadius:"5px", border:"1px solid #ccc", background:"#white", color: "#555"}} />
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} style={{display:"none"}} />
                <button type="button" onClick={() => fileInputRef.current.click()} disabled={uploading} style={{background: uploading ? "#ccc" : "#0ea5e9", color: "#fff", border: "none", borderRadius: "5px", padding: "0 15px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", whiteSpace:"nowrap"}}> {uploading ? "Uploading..." : "📷 Upload"} </button>
            </div>
            {form.photo && <div style={{marginTop: "8px"}}><img src={form.photo} alt="Preview" style={{height:"60px", borderRadius:"4px", border:"1px solid #ccc"}} /></div>}
        </div>
        <h3 style={{ borderBottom: "2px solid #f3f4f6", paddingBottom: "0.5rem", color: "#374151" }}>Status</h3>
        <label style={{ fontSize: "0.85rem", color: "#4b5563" }}>Permanent Disability?</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
           <button type="button" onClick={() => handleDisability("N")} style={form.disabilityFlag === "N" ? activeBtn : inactiveBtn}>No</button>
           <button type="button" onClick={() => handleDisability("Y")} style={form.disabilityFlag === "Y" ? activeBtn : inactiveBtn}>Yes</button>
        </div>
        <SelectField label="Shed Location" name="locationShed" value={form.locationShed} onChange={handleChange} options={["", "Punyakoti", "Samrakshana", "Kaveri", "Nandini", "Others"]} />
        <TextField label="Remarks" name="remarks" value={form.remarks} onChange={handleChange} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
          <button type="button" onClick={handleCancel} disabled={loading} style={btnStyle}>Cancel</button>
          <button type="submit" disabled={loading} style={{...btnStyle, background: "#2563eb", color: "#fff"}}>{loading ? "Saving..." : "Save Cattle"}</button>
        </div>
      </form>
    </div>
  );
}
const btnStyle = { padding: "0.6rem 1.2rem", borderRadius: "20px", border: "1px solid #ddd", background: "white", cursor: "pointer" };
const activeBtn = { flex: 1, padding: "0.5rem", borderRadius: "8px", border: "2px solid #2563eb", background: "#eff6ff", color: "#2563eb", fontWeight: "bold" };
const inactiveBtn = { flex: 1, padding: "0.5rem", borderRadius: "8px", border: "1px solid #ddd", background: "white", color: "#6b7280" };
function TextField({ label, name, value, onChange, type="text", readOnly=false, placeholder, required }) { return ( <div> <label style={{display:"block", fontSize:"0.85rem", marginBottom:"0.2rem"}}>{label}</label> <input type={type} name={name} value={value} onChange={onChange} readOnly={readOnly} placeholder={placeholder} required={required} style={{ width:"100%", padding:"0.6rem", border:"1px solid #ccc", borderRadius:"6px", background: readOnly ? "#f3f4f6" : "white", color: readOnly ? "#6b7280" : "black" }} /> </div> ); }
function SelectField({ label, name, value, onChange, options, disabled=false }) { return ( <div> <label style={{display:"block", fontSize:"0.85rem", marginBottom:"0.2rem"}}>{label}</label> <select name={name} value={value} onChange={onChange} disabled={disabled} style={{ width:"100%", padding:"0.6rem", border:"1px solid #ccc", borderRadius:"6px", background: disabled ? "#f3f4f6" : "white" }}> {options.map(o => <option key={o} value={o}>{o||"Select..."}</option>)} </select> </div> ); }