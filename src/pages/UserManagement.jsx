// src/pages/UserManagement.jsx
import React, { useState, useEffect } from "react";
import { fetchUsers, addUser } from "../api/masterApi";
import { useAuth } from "../context/AuthContext";

export default function UserManagement() {
  const { user } = useAuth(); // Get current logged-in user
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // New User Form State
  const [newUser, setNewUser] = useState({
    name: "", email: "", mobile: "", password: "", role: "User"
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetchUsers();
      if (res && res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser(e) {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) return alert("Fill required fields");

    const res = await addUser(newUser);
    if (res && res.success) {
      alert("User added successfully!");
      setShowModal(false);
      setNewUser({ name: "", email: "", mobile: "", password: "", role: "User" });
      loadUsers(); // Refresh list
    } else {
      alert("Error: " + (res.error || "Failed to add user"));
    }
  }

  // Permission Check: If not Admin, show restricted message
  if (user?.role !== "Admin") {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#b91c1c" }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page. Only Admins can manage users.</p>
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
        <button 
          onClick={() => setShowModal(true)}
          style={primaryBtnStyle}
        >
          + Add User
        </button>
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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: "1rem", textAlign: "center" }}>Loading users...</td></tr>
            ) : users.map((u) => (
              <tr key={u.id}>
                <td style={tdStyle}>{u.name}</td>
                <td style={tdStyle}>{u.email}</td>
                <td style={tdStyle}>{u.mobile}</td>
                <td style={tdStyle}>
                  <span style={getRoleBadgeStyle(u.role)}>{u.role}</span>
                </td>
                <td style={tdStyle}>
                  <span style={{ color: u.status === "Active" ? "green" : "red", fontWeight: 600 }}>{u.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3>Add New User</h3>
            <form onSubmit={handleAddUser} style={{ display: "grid", gap: "1rem" }}>
              <div><label>Name *</label><input style={inputStyle} value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required /></div>
              <div><label>Email *</label><input style={inputStyle} type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required /></div>
              <div><label>Mobile Number</label><input style={inputStyle} value={newUser.mobile} onChange={e => setNewUser({...newUser, mobile: e.target.value})} placeholder="+91..." /></div>
              <div><label>Password *</label><input style={inputStyle} type="text" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required /></div>
              <div>
                <label>Role</label>
                <select style={inputStyle} value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowModal(false)} style={secondaryBtnStyle}>Cancel</button>
                <button type="submit" style={primaryBtnStyle}>Save User</button>
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
const inputStyle = { width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box", marginTop: "4px" };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalStyle = { background: "#fff", padding: "2rem", borderRadius: "8px", width: "400px", maxWidth: "90%" };

function getRoleBadgeStyle(role) {
  const base = { padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600 };
  if (role === "Admin") return { ...base, background: "#fee2e2", color: "#991b1b" };
  if (role === "User") return { ...base, background: "#dbeafe", color: "#1e40af" };
  return { ...base, background: "#f3f4f6", color: "#374151" };
}