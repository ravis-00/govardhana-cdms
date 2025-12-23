// src/pages/UserManagement.jsx
import React, { useState, useEffect } from "react";
// Ensure updateUser is imported here! If missing in masterApi, check Step 4 below.
import { fetchUsers, addUser, updateUser } from "../api/masterApi";
import { useAuth } from "../context/AuthContext";

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: "", name: "", email: "", mobile: "", password: "", role: "User", status: "Active"
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetchUsers();
      if (res && res.success) setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setIsEditMode(false);
    setFormData({ id: "", name: "", email: "", mobile: "", password: "", role: "User", status: "Active" });
    setShowModal(true);
  }

  function openEditModal(u) {
    setIsEditMode(true);
    // password left blank so we don't overwrite it unless user types a new one
    setFormData({ 
      id: u.id, 
      name: u.name, 
      email: u.email, 
      mobile: u.mobile, 
      password: "", 
      role: u.role, 
      status: u.status 
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name || !formData.email) return alert("Fill required fields");
    if (!isEditMode && !formData.password) return alert("Password is required for new users");

    const apiCall = isEditMode ? updateUser : addUser;
    const res = await apiCall(formData);

    if (res && res.success) {
      alert(isEditMode ? "User updated!" : "User added!");
      setShowModal(false);
      loadUsers();
    } else {
      alert("Error: " + (res.error || "Operation failed"));
    }
  }

  // Permission Check
  if (user?.role !== "Admin") {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#b91c1c" }}>
        <h2>Access Denied</h2>
        <p>Only Admins can manage users.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>User Management</h1>
          <p style={{ margin: "0.3rem 0 0", color: "#6b7280" }}>Manage system access and roles.</p>
        </div>
        <button onClick={openAddModal} style={primaryBtnStyle}>+ Add User</button>
      </header>

      {/* Users Table */}
      <div style={cardStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Mobile</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: "1rem", textAlign: "center" }}>Loading users...</td></tr>
            ) : users.map((u) => (
              <tr key={u.id}>
                <td style={tdStyle}>{u.name}</td>
                <td style={tdStyle}>{u.email}</td>
                <td style={tdStyle}>{u.mobile}</td>
                <td style={tdStyle}><span style={getRoleBadgeStyle(u.role)}>{u.role}</span></td>
                <td style={tdStyle}>
                  <span style={{ color: u.status === "Active" ? "green" : "red", fontWeight: 600 }}>{u.status}</span>
                </td>
                <td style={tdStyle}>
                  <button onClick={() => openEditModal(u)} style={smallBtnStyle}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3>{isEditMode ? "Edit User" : "Add New User"}</h3>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
              
              <div><label>Full Name *</label><input style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
              
              <div><label>Email *</label><input style={inputStyle} type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required /></div>
              
              <div><label>Mobile Number</label><input style={inputStyle} value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} /></div>
              
              <div>
                <label>Password {isEditMode && "(Leave blank to keep current)"}</label>
                <input style={inputStyle} type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!isEditMode} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label>Role</label>
                  <select style={inputStyle} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
                <div>
                  <label>Status</label>
                  <select style={inputStyle} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowModal(false)} style={secondaryBtnStyle}>Cancel</button>
                <button type="submit" style={primaryBtnStyle}>{isEditMode ? "Update" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const cardStyle = { background: "#fff", borderRadius: "8px", padding: "1rem", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", overflowX: "auto" };
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" };
const thStyle = { textAlign: "left", padding: "12px", borderBottom: "2px solid #f3f4f6", color: "#6b7280" };
const tdStyle = { padding: "12px", borderBottom: "1px solid #f3f4f6", color: "#1f2937" };
const primaryBtnStyle = { background: "#2563eb", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" };
const secondaryBtnStyle = { background: "#fff", border: "1px solid #ccc", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" };
const smallBtnStyle = { background: "#e5e7eb", border: "none", padding: "4px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem" };
const inputStyle = { width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box", marginTop: "4px" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalStyle = { background: "#fff", padding: "2rem", borderRadius: "8px", width: "400px", maxWidth: "90%" };

function getRoleBadgeStyle(role) {
  const base = { padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600 };
  if (role === "Admin") return { ...base, background: "#fee2e2", color: "#991b1b" };
  if (role === "User") return { ...base, background: "#dbeafe", color: "#1e40af" };
  return { ...base, background: "#f3f4f6", color: "#374151" };
}
async function loadUsers() {
    setLoading(true);
    try {
      // The API helper now returns the data array directly
      const usersList = await fetchUsers();
      
      // Check if we actually got an array
      if (Array.isArray(usersList)) {
        setUsers(usersList);
      } else {
        console.warn("Expected array but got:", usersList);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }