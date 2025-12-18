// src/pages/CattleRegistration.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addCattle } from "../api/masterApi"; // <--- IMPORT API

export default function CattleRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // <--- ADD LOADING STATE

  const [form, setForm] = useState({
    cattleId: "",
    govtId: "",
    name: "",
    colour: "",
    gender: "",
    breed: "",
    typeOfAdmission: "",
    disabilityFlag: "N", // N or Y
    adoptionStatus: "",
    locationShed: "",
    remarks: "",
    picture: null,
    newTagNumber: "",
    newCattleId: "",
    newGovtId: "",
    reactiveReason: "",
    reactiveDate: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, picture: file }));
  }

  function handleDisability(flag) {
    setForm((prev) => ({ ...prev, disabilityFlag: flag }));
  }

  function handleCancel() {
    navigate("/cattle/active");
  }

  // --- UPDATED SUBMIT HANDLER ---
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Prepare Payload (match backend expectation)
      const payload = {
        cattleId: form.cattleId, // Backend maps this to Tag Number
        govtId: form.govtId,
        name: form.name,
        colour: form.colour,
        gender: form.gender,
        breed: form.breed,
        typeOfAdmission: form.typeOfAdmission,
        disability: form.disabilityFlag,
        adoptionStatus: form.adoptionStatus, // Ensure backend stores this if needed
        locationShed: form.locationShed,     // Ensure backend stores this if needed
        remarks: form.remarks,
        // Default admission date to today if not provided in form
        admissionDate: new Date().toISOString().split('T')[0] 
      };

      // 2. Send to Backend
      console.log("Sending payload:", payload);
      const response = await addCattle(payload);

      // 3. Handle Response
      if (response && response.success) {
        alert("Cattle Registered Successfully!");
        // Optional: Reset form or navigate away
        setForm({
          cattleId: "", govtId: "", name: "", colour: "", gender: "", breed: "",
          typeOfAdmission: "", disabilityFlag: "N", adoptionStatus: "", 
          locationShed: "", remarks: "", picture: null, newTagNumber: "", 
          newCattleId: "", newGovtId: "", reactiveReason: "", reactiveDate: ""
        });
        navigate("/cattle/active"); // Go to list after save
      } else {
        alert("Failed to save: " + (response.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Save Error:", error);
      alert("Error connecting to server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        padding: "1.5rem 2rem",
        maxWidth: "720px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.4rem",
            fontWeight: 600,
            margin: 0,
          }}
        >
          Cattle Registration
        </h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "999px",
              border: "1px solid #d1d5db",
              background: "#ffffff",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            form="cattle-registration-form"
            type="submit"
            disabled={loading}
            style={{
              padding: "0.4rem 0.95rem",
              borderRadius: "999px",
              border: "none",
              background: loading ? "#93c5fd" : "#2563eb", // Lighter blue when loading
              color: "#ffffff",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Form */}
      <form
        id="cattle-registration-form"
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "0.9rem",
          background: "#ffffff",
          borderRadius: "0.75rem",
          padding: "1.25rem 1.5rem",
          boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
        }}
      >
        <TextField
          label="Cattle ID / Tag Number *"
          name="cattleId"
          value={form.cattleId}
          onChange={handleChange}
        />

        <TextField
          label="Govt ID"
          name="govtId"
          value={form.govtId}
          onChange={handleChange}
        />

        <TextField
          label="Cattle Name *"
          name="name"
          value={form.name}
          onChange={handleChange}
        />

        <TextField
          label="Colour *"
          name="colour"
          value={form.colour}
          onChange={handleChange}
        />

        <SelectField
          label="Cattle Gender *"
          name="gender"
          value={form.gender}
          onChange={handleChange}
          options={[
            { value: "", label: "Select gender" },
            { value: "Female", label: "Female" },
            { value: "Male", label: "Male" },
          ]}
        />

        <SelectField
          label="Breed *"
          name="breed"
          value={form.breed}
          onChange={handleChange}
          options={[
            { value: "", label: "Select Breed" },
            { value: "Hallikar", label: "Hallikar" },
            { value: "Bargur", label: "Bargur" },
            { value: "Deoni", label: "Deoni" },
            { value: "Ongole", label: "Ongole" },
            { value: "Malenadu Gidda", label: "Malenadu Gidda" },
            { value: "Rati", label: "Rati" },
            { value: "Kankrej", label: "Kankrej" },
            { value: "Gir", label: "Gir" },
            { value: "Krishna Valley", label: "Krishna Valley" },
            { value: "Sahiwal", label: "Sahiwal" },
            { value: "Punganur", label: "Punganur" },
            { value: "Mix", label: "Mix" },
          ]}
        />

        <SelectField
          label="Type of Admission *"
          name="typeOfAdmission"
          value={form.typeOfAdmission}
          onChange={handleChange}
          options={[
            { value: "", label: "Select type" },
            { value: "Purchase", label: "Purchase" },
            { value: "Donation", label: "Donation" },
            { value: "Born at Goshala", label: "Born at Goshala" },
            { value: "Rescue", label: "Rescue" },
          ]}
        />

        {/* Disability Y / N buttons */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              marginBottom: "0.25rem",
            }}
          >
            Any Permanent Disability at Birth / Admission? *
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => handleDisability("N")}
              style={{
                flex: 1,
                padding: "0.45rem 0.75rem",
                borderRadius: "0.5rem",
                border:
                  form.disabilityFlag === "N"
                    ? "2px solid #2563eb"
                    : "1px solid #d1d5db",
                background:
                  form.disabilityFlag === "N" ? "#eff6ff" : "#ffffff",
                cursor: "pointer",
              }}
            >
              N
            </button>
            <button
              type="button"
              onClick={() => handleDisability("Y")}
              style={{
                flex: 1,
                padding: "0.45rem 0.75rem",
                borderRadius: "0.5rem",
                border:
                  form.disabilityFlag === "Y"
                    ? "2px solid #2563eb"
                    : "1px solid #d1d5db",
                background:
                  form.disabilityFlag === "Y" ? "#eff6ff" : "#ffffff",
                cursor: "pointer",
              }}
            >
              Y
            </button>
          </div>
        </div>

        <SelectField
          label="Adoption Status"
          name="adoptionStatus"
          value={form.adoptionStatus}
          onChange={handleChange}
          options={[
            { value: "", label: "Select Adoption Status" },
            { value: "Punyakoti", label: "Punyakoti" },
            { value: "Samrakshana", label: "Samrakshana" },
            { value: "Go Dana", label: "Go Dana" },
            { value: "Shashwatha Dattu Sweekara", label: "Shashwatha Dattu Sweekara" },
          ]}
        />

        <SelectField
          label="Location / Shed"
          name="locationShed"
          value={form.locationShed}
          onChange={handleChange}
          options={[
            { value: "", label: "Select shed" },
            { value: "Goshala-1", label: "Goshala 1" },
            { value: "Goshala-2", label: "Goshala 2" },
            { value: "Quarantine", label: "Quarantine" },
          ]}
        />

        <TextField
          label="Remarks"
          name="remarks"
          value={form.remarks}
          onChange={handleChange}
        />

        {/* Picture upload */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              marginBottom: "0.25rem",
            }}
          >
            Picture
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{
              width: "100%",
              padding: "0.5rem 0.6rem",
              borderRadius: "0.5rem",
              border: "1px solid #d1d5db",
              fontSize: "0.9rem",
            }}
          />
          {form.picture && (
            <div
              style={{
                marginTop: "0.3rem",
                fontSize: "0.8rem",
                color: "#6b7280",
              }}
            >
              Selected: {form.picture.name}
            </div>
          )}
        </div>

        {/* These fields seem like extras or specific scenarios; keeping them as text inputs for now */}
        <TextField
          label="New Tag Number (if Re-tagging)"
          name="newTagNumber"
          value={form.newTagNumber}
          onChange={handleChange}
        />

        <TextField
          label="Reactive Reason (if applicable)"
          name="reactiveReason"
          value={form.reactiveReason}
          onChange={handleChange}
        />

        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              marginBottom: "0.25rem",
            }}
          >
            Reactive Date
          </label>
          <input
            type="date"
            name="reactiveDate"
            value={form.reactiveDate}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "0.5rem 0.6rem",
              borderRadius: "0.5rem",
              border: "1px solid #d1d5db",
              fontSize: "0.9rem",
            }}
          />
        </div>
      </form>
    </div>
  );
}

/* Small reusable components */

function TextField({ label, name, value, onChange }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "0.85rem",
          marginBottom: "0.25rem",
        }}
      >
        {label}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          padding: "0.5rem 0.6rem",
          borderRadius: "0.5rem",
          border: "1px solid #d1d5db",
          fontSize: "0.9rem",
        }}
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "0.85rem",
          marginBottom: "0.25rem",
        }}
      >
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          padding: "0.5rem 0.6rem",
          borderRadius: "0.5rem",
          border: "1px solid #d1d5db",
          fontSize: "0.9rem",
          backgroundColor: "#ffffff",
        }}
      >
        {options.map((opt) => (
          <option key={opt.value + opt.label} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}