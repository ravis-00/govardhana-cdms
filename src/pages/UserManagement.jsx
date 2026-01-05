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
  const role = user?.role ? String(user.role).trim().toLowerCase() : "";
  const canAccess = role.includes("admin");

  if (!canAccess) {
    return (
      <div style={{ padding: "4rem", textAlign: "center", color: "#1e40af", background: "#eff6ff", height: "100vh" }}> 
        <h1 style={{fontSize: "2rem", marginBottom: "1rem"}}>🚫 Access Denied</h1>
        <p>You do not have permission to view this page.</p>
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
      const res = await fetchUsers();
      
      // 🔥 FIX: Handle API Wrapper Object
      let dataList = [];
      if (res && res.data && Array.isArray(res.data)) {
          dataList = res.data;
      } else if (Array.isArray(res)) {
          dataList = res;
      }
      
      setUsers(dataList);
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
      password: u.password || "", // Often kept empty for security unless editing
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
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#1e293b", fontWeight: "700" }}>User Management</h1>
        <button onClick={openAddForm} style={addBtnStyle}>+ Add User</button>
      </div>

      {/* TABLE CARD */}
      <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", overflow: "hidden", border: "1px solid #e2e8f0" }}>
        <div style={{ overflowX: "auto" }}> {/* 🔥 SCROLLABLE */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", minWidth: "800px" }}>
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
                <tr><td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>No users found.</td></tr>
              ) : (
                users.map((u, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={tdStyle}><strong>{u.fullName}</strong></td>
                    <td style={tdStyle}>
                        <span style={{
                            background: u.role === "Admin" ? "#eff6ff" : "#f1f5f9",
                            color: u.role === "Admin" ? "#1d4ed8" : "#475569",
                            padding: "2px 8px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "600"
                        }}>
                            {u.role}
                        </span>
                    </td>
                    <td style={tdStyle}>{u.email}</td>
                    <td style={tdStyle}>{u.mobile}</td>
                    <td style={tdStyle}>
                      <span style={{ 
                          color: u.status === "Active" ? "#166534" : "#991b1b", 
                          background: u.status === "Active" ? "#dcfce7" : "#fee2e2",
                          padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "bold"
                      }}>
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
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div style={overlayStyle} onClick={() => setShowForm(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.2rem", color: "#1e293b" }}>{editingUser ? "Edit User" : "Add New User"}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <Field label="Full Name *"><input type="text" name="fullName" value={form.fullName} onChange={handleChange} required style={inputStyle} /></Field>
                <Field label="Role *">
                  <select name="role" value={form.role} onChange={handleChange} style={inputStyle}>
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </Field>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <Field label="Email *"><input type="email" name="email" value={form.email} onChange={handleChange} required style={inputStyle} /></Field>
                <Field label="Mobile"><input type="text" name="mobile" value={form.mobile} onChange={handleChange} style={inputStyle} /></Field>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <Field label="Password *"><input type="text" name="password" value={form.password} onChange={handleChange} required={!editingUser} placeholder={editingUser ? "Leave empty to keep same" : ""} style={inputStyle} /></Field>
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
const thStyle = { padding: "1rem", textAlign: "left", fontSize: "0.8rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase" };
const tdStyle = { padding: "0.8rem 1rem", color: "#334155", borderBottom: "1px solid #f1f5f9" };
const addBtnStyle = { background: "#2563eb", color: "#fff", border: "none", padding: "0.6rem 1.2rem", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem" };
const editBtnStyle = { background: "#eff6ff", color: "#2563eb", border: "none", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem" };
const overlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "1rem" };
const modalStyle = { background: "white", padding: "2rem", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" };
const inputStyle = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.95rem", boxSizing: "border-box" };
const cancelBtnStyle = { padding: "0.6rem 1.2rem", background: "white", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: "500" };
const saveBtnStyle = { padding: "0.6rem 1.2rem", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" };
function Field({ label, children }) { return <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}><label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>{label}</label>{children}</div>; }