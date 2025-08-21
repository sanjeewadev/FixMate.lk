// src/Pages/AdminDashboard/components/ManageStaff.jsx
import React, { useEffect, useRef, useState } from "react";
import api from "../../../lib/api";
import "./ManageStaff.css";

const DISTRICTS = [
  "Colombo","Gampaha","Kalutara",
  "Kandy","Matale","Nuwara Eliya",
  "Galle","Matara","Hambantota",
  "Jaffna","Kilinochchi","Mannar","Vavuniya","Mullaitivu",
  "Batticaloa","Ampara","Trincomalee",
  "Kurunegala","Puttalam",
  "Anuradhapura","Polonnaruwa",
  "Badulla","Monaragala",
  "Ratnapura","Kegalle",
];

function ManageStaff() {
  const [coordinators, setCoordinators] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone_number: "",
    address: "",     // REQUIRED by model
    district: "",    // REQUIRED by model
  });

  const [imagePreview, setImagePreview] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [msg, setMsg] = useState(null);

  // ---------- load ----------
  const fetchCoordinators = async () => {
    try {
      const res = await api.get("/api/admin/coordinators");
      setCoordinators(res.data || []);
    } catch (err) {
      if (err?.response?.status === 401) alert("Unauthorized. Please log in again as admin.");
      console.error("Error fetching coordinators", err);
    }
  };
  useEffect(() => { fetchCoordinators(); }, []);

  // ---------- form handlers ----------
  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleEmailChange = (e) => setFormData(p => ({ ...p, email: e.target.value }));
  const handlePasswordChange = (e) => setFormData(p => ({ ...p, password: e.target.value }));

  // ---------- pick & crop (same flow you like) ----------
  const fileRef = useRef(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [base, setBase] = useState(1);
  const [offX, setOffX] = useState(0);
  const [offY, setOffY] = useState(0);
  const dragRef = useRef({ active:false, startX:0, startY:0, startOffX:0, startOffY:0 });
  const imgMeta = useRef({ w:0, h:0 });

  const pickFile = () => fileRef.current?.click();
  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f || !f.type?.startsWith("image/")) return;
    const url = URL.createObjectURL(f);
    setCropSrc(url); setCropOpen(true);
  };

  const onPreviewLoad = (e) => {
    const img = e.currentTarget;
    imgMeta.current = { w: img.naturalWidth, h: img.naturalHeight };
    const circle = 256;
    const fit = Math.max(circle / img.naturalWidth, circle / img.naturalHeight);
    setBase(fit); setZoom(1); setOffX(0); setOffY(0);
  };

  function clampPan(x,y,z){
    const size = 256;
    const scaledW = imgMeta.current.w * base * z;
    const scaledH = imgMeta.current.h * base * z;
    const maxX = Math.max(0,(scaledW-size)/2);
    const maxY = Math.max(0,(scaledH-size)/2);
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  }

  const onDragStart = (e)=>{ e.preventDefault(); const pt=e.touches?e.touches[0]:e;
    dragRef.current={active:true,startX:pt.clientX,startY:pt.clientY,startOffX:offX,startOffY:offY};};
  const onDragMove = (e)=>{ if(!dragRef.current.active) return; const pt=e.touches?e.touches[0]:e;
    const dx=pt.clientX-dragRef.current.startX; const dy=pt.clientY-dragRef.current.startY;
    const next=clampPan(dragRef.current.startOffX+dx,dragRef.current.startOffY+dy,zoom);
    setOffX(next.x); setOffY(next.y); };
  const onDragEnd = ()=>{ dragRef.current.active=false; };

  function exportCropped(img, size=256, startQ=0.7){
    const canvas=document.createElement("canvas");
    canvas.width=size; canvas.height=size;
    const ctx=canvas.getContext("2d");
    const scale=base*zoom;
    const drawW=img.naturalWidth*scale;
    const drawH=img.naturalHeight*scale;
    const dx=(size-drawW)/2+offX;
    const dy=(size-drawH)/2+offY;
    ctx.save(); ctx.beginPath(); ctx.arc(size/2,size/2,size/2,0,Math.PI*2); ctx.closePath(); ctx.clip();
    ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality="high";
    ctx.drawImage(img,dx,dy,drawW,drawH); ctx.restore();
    let q=startQ, out=canvas.toDataURL("image/jpeg",q);
    const maxBytes=60*1024; while(out.length*0.75>maxBytes && q>0.45){ q-=0.1; out=canvas.toDataURL("image/jpeg",q); }
    return out;
  }

  const confirmCrop = async ()=>{
    if(!cropSrc) return;
    const img=new Image(); img.src=cropSrc;
    await new Promise(res => (img.onload = res));
    const dataUrl=exportCropped(img);
    setImageDataUrl(dataUrl); setImagePreview(dataUrl); cleanupCrop();
  };

  const cleanupCrop = ()=>{
    if(cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null); setCropOpen(false);
  };

  // ---------- create / update ----------
  const mkCreatePayload = () => ({
    full_name: formData.full_name,
    email: formData.email,
    password: formData.password,          // required on create
    phone_number: formData.phone_number,
    address: formData.address,            // <-- send required fields
    district: formData.district,          // <--
    ...(imageDataUrl ? { profile_image_url: imageDataUrl } : {}),
  });

  const mkUpdatePayload = () => ({
    full_name: formData.full_name,
    email: formData.email,
    phone_number: formData.phone_number,
    address: formData.address,            // <-- include on update too
    district: formData.district,          // <--
    ...(formData.password ? { password: formData.password } : {}),
    ...(imageDataUrl ? { profile_image_url: imageDataUrl } : {}),
  });

  function parseHtmlValidation(htmlString){
    if (typeof htmlString !== "string") return null;
    // try to pull the Mongoose validation sentence out of the HTML
    const noTags = htmlString.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
    const m = noTags.match(/ValidationError: (.+)$/);
    return m ? m[1] : null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    // front-end guard so we don’t hit server with missing requireds
    const missing = ["full_name","email","phone_number","address","district", ...(editingId ? [] : ["password"])]
      .filter(k => !String(formData[k] || "").trim());
    if (missing.length) {
      setMsg({ type:"error", text:`Please fill: ${missing.join(", ")}` });
      return;
    }

    try {
      if (editingId) {
        const payload = mkUpdatePayload();
        console.log("[UPDATE coordinator]", payload);
        await api.put(`/api/admin/coordinators/${editingId}`, payload);
        setMsg({ type:"success", text:"Coordinator updated ✅" });
      } else {
        const payload = mkCreatePayload();
        console.log("[CREATE coordinator]", payload);
        await api.post("/api/admin/coordinators", payload);
        setMsg({ type:"success", text:"Coordinator created ✅" });
      }
      resetForm();
      fetchCoordinators();
    } catch (err) {
      const status = err?.response?.status;
      let serverMsg = err?.response?.data?.message;
      if (!serverMsg && typeof err?.response?.data === "string") {
        serverMsg = parseHtmlValidation(err.response.data);
      }
      console.error("Save coordinator error:", status, serverMsg, err?.response || err);
      setMsg({ type:"error", text: serverMsg || "Error saving coordinator" });
      alert(serverMsg || "Error saving coordinator");
    }
  };

  const resetForm = ()=>{
    setEditingId(null);
    setFormData({
      full_name: "",
      email: "",
      password: "",
      phone_number: "",
      address: "",
      district: "",
    });
    setImagePreview("");
    setImageDataUrl("");
  };

  // ---------- edit/delete ----------
  const handleEdit = (c)=>{
    setFormData({
      full_name: c.full_name || "",
      email: c.email || "",
      password: "",
      phone_number: c.phone_number || "",
      address: c.address || "",
      district: c.district || "",
    });
    const img = c.profile_image_url || c.profile_image?.url || "";
    setImagePreview(img || "");
    setImageDataUrl("");
    setEditingId(c._id);
  };

  const handleDelete = async (id)=>{
    if (!window.confirm("Delete this coordinator?")) return;
    try {
      await api.delete(`/api/admin/coordinators/${id}`);
      fetchCoordinators();
    } catch (err) {
      if (err?.response?.status === 401) alert("Unauthorized. Please log in again as admin.");
      else console.error("Error deleting coordinator", err);
    }
  };

  return (
    <div className="manage-staff">
      <h2>Manage Staff (Coordinators)</h2>
      {msg?.text && <p className={`msg ${msg.type}`}>{msg.text}</p>}

      {/* List */}
      <table className="staff-table">
        <thead>
          <tr>
            <th>Profile</th><th>Full Name</th><th>Email</th><th>Phone</th><th>District</th><th style={{width:180}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {coordinators.map((c)=> {
            const img = c.profile_image_url || c.profile_image?.url || "";
            return (
              <tr key={c._id}>
                <td>{img ? <img src={img} alt={c.full_name} className="staff-avatar" /> : "—"}</td>
                <td>{c.full_name}</td>
                <td>{c.email}</td>
                <td>{c.phone_number}</td>
                <td>{c.district || "—"}</td>
                <td>
                  <button className="btn btn-primary" onClick={()=>handleEdit(c)}>Edit</button>
                  <button className="btn btn-danger" onClick={()=>handleDelete(c._id)}>Delete</button>
                </td>
              </tr>
            );
          })}
          {coordinators.length === 0 && (
            <tr><td colSpan={6} style={{textAlign:"center",color:"#64748b"}}>No staff found</td></tr>
          )}
        </tbody>
      </table>

      {/* Form */}
      <form className="staff-form" onSubmit={handleSubmit} autoComplete="off">
        {/* decoys to absorb autofill */}
        <input type="text" name="username" autoComplete="username" style={{display:"none"}} />
        <input type="password" name="password" autoComplete="current-password" style={{display:"none"}} />

        <div className="avatar-block">
          <img src={imagePreview || "/default-profile.png"} alt="preview" className="staff-avatar large" />
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
          <button type="button" className="btn btn-secondary" onClick={pickFile}>Change Photo</button>
        </div>

        <input type="text" name="full_name" placeholder="Full Name" value={formData.full_name} onChange={handleChange} required />

        <input
          type="email"
          name="__no_email"
          placeholder="Email"
          value={formData.email}
          onChange={handleEmailChange}
          required
          autoCapitalize="none"
          spellCheck={false}
          data-1p-ignore="true"
          data-lpignore="true"
        />

        {!editingId ? (
          <input
            type="password"
            name="__no_password"
            placeholder="Password"
            value={formData.password}
            onChange={handlePasswordChange}
            required
            autoComplete="new-password"
            data-1p-ignore="true"
            data-lpignore="true"
            spellCheck={false}
          />
        ) : (
          <input
            type="password"
            name="__no_password"
            placeholder="(Optional) New Password"
            value={formData.password}
            onChange={handlePasswordChange}
            autoComplete="new-password"
            data-1p-ignore="true"
            data-lpignore="true"
            spellCheck={false}
          />
        )}

        <input type="text" name="phone_number" placeholder="Phone Number" value={formData.phone_number} onChange={handleChange} required />

        <input type="text" name="address" placeholder="Address" value={formData.address} onChange={handleChange} required />

        <select name="district" value={formData.district} onChange={handleChange} required>
          <option value="" disabled>-- Select District --</option>
          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editingId ? "Update Coordinator" : "Add Coordinator"}
          </button>
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
          )}
        </div>
      </form>

      {/* Crop modal */}
      {cropOpen && (
        <div className="crop-overlay" onClick={cleanupCrop} role="dialog" aria-modal="true">
          <div className="crop-modal" onClick={(e)=>e.stopPropagation()}>
            <h4>Adjust your photo</h4>

            <div
              className={`crop-viewport ${dragRef.current.active ? "dragging" : ""}`}
              onMouseDown={onDragStart}
              onMouseMove={onDragMove}
              onMouseUp={onDragEnd}
              onMouseLeave={onDragEnd}
              onTouchStart={onDragStart}
              onTouchMove={onDragMove}
              onTouchEnd={onDragEnd}
            >
              {cropSrc && (
                <img
                  src={cropSrc}
                  alt="Crop preview"
                  className="crop-img"
                  onLoad={onPreviewLoad}
                  style={{ transform:`translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(${base*zoom})` }}
                />
              )}
              <div className="crop-circle" />
            </div>

            <div className="crop-controls">
              <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e)=>setZoom(parseFloat(e.target.value))} />
              <div className="crop-actions">
                <button type="button" className="btn btn-secondary" onClick={cleanupCrop}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={confirmCrop}>Use Photo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageStaff;
