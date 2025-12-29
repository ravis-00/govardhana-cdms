// src/pages/UserManagement.jsx
import React, { useEffect, useState } from "react";
import { fetchUsers, addUser, updateUser } from "../api/masterApi"; 
import { useAuth } from "../context/AuthContext";

export default function UserManagement() {
  const { user } = useAuth();
  
  // --- STATE ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [form, setForm] = useState({
    id: "", fullName: "", email: "", password: "",
    mobile: "", role: "User", status: "Active", remarks: ""
  });

  // --- PERMISSION CHECK ---
  // Normalize role to lowercase to ensure "Admin" == "admin"
  const role = user?.role ? String(user.role).trim().toLowerCase() : "";
  const canAccess = role.includes("admin"); // Checks for 'admin' or 'super admin'

  // 🔥 DEBUG SCREEN (BLUE)
  if (!canAccess) {
    return (
      <div style={{ padding: "4rem", textAlign: "center", color: "#1e40af", background: "#eff6ff", height: "100vh" }}> 
        <h1 style={{fontSize: "2rem", marginBottom: "1rem"}}>🚫 Access Logic Debugger</h1>
        <div style={{background: "white", padding: "20px", borderRadius: "8px", display: "inline-block", boxShadow: "0 4px 6px rgba(0,0,0,0.1)"}}>
           <p style={{fontSize: "1.2rem", color: "#333"}}>Current Role: <strong>"{user?.role}"</strong></p>
           <p style={{color: "#666"}}>Normalized: <strong>"{role}"</strong></p>
           <hr style={{margin: "15px 0", borderTop: "1px solid #eee"}}/>
           <p style={{fontWeight:"bold", color: "green"}}>Required: Role must contain "admin"</p>
        </div>
      </div>
    );
  }

  // --- LOAD DATA ---
  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // --- HANDLERS ---
  function openAddForm() {
    setEditingUser(null);
    setForm({
      id: "", fullName: "", email: "", password: "",
      mobile: "", role: "User", status: "Active", remarks: ""
    });
    setShowForm(true);
  }

  function openEditForm(u) {
    setEditingUser(u);
    setForm({
      id: u.id,
      fullName: u.fullName || u.name || "",
      email: u.email || "",
      password: u.password || "",
      mobile: u.mobile || u.phone || "",
      role: u.role || "User",
      status: u.status || "Active",
      remarks: u.remarks || ""
    });
    setShowForm(true);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUser) {
        await updateUser(form);
        alert("User updated successfully!");
      } else {
        await addUser(form);
        alert("User added successfully!");
      }
      setShowForm(false);
      loadUsers();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- RENDER ---
  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#1e293b" }}>User Management</h1>
        <button onClick={openAddForm} style={addBtnStyle}>+ Add User</button>
      </div>

      <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <tr>
              <th style={thStyle}>Full Name</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Mobile</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center" }}>Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center" }}>No users found.</td></tr>
            ) : (
              users.map((u, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={tdStyle}><strong>{u.fullName}</strong></td>
                  <td style={tdStyle}>{u.role}</td>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}>{u.mobile}</td>
                  <td style={tdStyle}>
                     <span style={{ color: u.status === "Active" ? "green" : "red", fontWeight: "bold" }}>
                        {u.status}
                     </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <button onClick={() => openEditForm(u)} style={editBtnStyle}>✏️ Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2 style={{ marginBottom: "1rem" }}>{editingUser ? "Edit User" : "Add New User"}</h2>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Field label="Full Name *"><input type="text" name="fullName" value={form.fullName} onChange={handleChange} required style={inputStyle} /></Field>
                <Field label="Role *">
                  <select name="role" value={form.role} onChange={handleChange} style={inputStyle}>
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Field label="Email *"><input type="email" name="email" value={form.email} onChange={handleChange} required style={inputStyle} /></Field>
                <Field label="Mobile"><input type="text" name="mobile" value={form.mobile} onChange={handleChange} style={inputStyle} /></Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Field label="Password *"><input type="text" name="password" value={form.password} onChange={handleChange} required style={inputStyle} /></Field>
                <Field label="Status">
                  <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </Field>
              </div>
              <Field label="Remarks"><input type="text" name="remarks" value={form.remarks} onChange={handleChange} style={inputStyle} /></Field>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowForm(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={loading} style={saveBtnStyle}>Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES ---
const thStyle = { padding: "1rem", textAlign: "left", fontSize: "0.85rem", color: "#64748b", fontWeight: "600" };
const tdStyle = { padding: "1rem", color: "#334155" };
const addBtnStyle = { background: "#2563eb", color: "#fff", border: "none", padding: "0.6rem 1.2rem", borderRadius: "6px", cursor: "pointer", fontWeight: "600" };
const editBtnStyle = { background: "#eff6ff", color: "#2563eb", border: "none", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer", fontWeight: "500" };
const overlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalStyle = { background: "white", padding: "2rem", borderRadius: "8px", width: "500px", maxWidth: "90%" };
const inputStyle = { width: "100%", padding: "0.6rem", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "0.95rem" };
const cancelBtnStyle = { padding: "0.6rem 1.2rem", background: "white", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer" };
const saveBtnStyle = { padding: "0.6rem 1.2rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" };
function Field({ label, children }) { return <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><label style={{ fontSize: "0.85rem", fontWeight: "500", color: "#475569" }}>{label}</label>{children}</div>; }