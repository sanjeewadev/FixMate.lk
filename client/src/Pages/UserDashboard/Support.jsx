import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listSupportStaff } from "../../services/support";
import { ensureConversation } from "../../services/chat";
import ChatWindow from "../../Components/chat/ChatWindow.jsx";
import "./Support.css";

export default function Support() {
  const [params] = useSearchParams();
  const [staff, setStaff] = useState([]);
  const [filter, setFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("coordinator");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const [conversation, setConversation] = useState(null);
  const [peer, setPeer] = useState(null);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return staff.filter((s) =>
      (!roleFilter || s.role === roleFilter) &&
      (!q ||
        (s.full_name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q))
    );
  }, [staff, filter, roleFilter]);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const list = await listSupportStaff();
        if (!dead) setStaff(list);
      } catch (e) {
        if (!dead) setMsg({ type: "error", text: e.message || "Unable to load staff" });
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, []);

  useEffect(() => {
    const withRole = params.get("withRole");
    const withUserId = params.get("withUserId");
    if (withRole && withUserId) {
      (async () => {
        try {
          const convo = await ensureConversation({ withRole, withUserId, topic: "General support" });
          setConversation(convo);
          const found =
            staff.find((s) => String(s._id) === String(withUserId)) ||
            { _id: withUserId, role: withRole, full_name: "Support" };
          setPeer(found);
        } catch (e) {
          setMsg({ type: "error", text: e?.response?.data?.message || "Unable to start chat" });
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, staff.length]);

  const startChat = async (s) => {
    try {
      const convo = await ensureConversation({ withRole: s.role, withUserId: s._id, topic: "General support" });
      setConversation(convo);
      setPeer(s);
      setMsg(null);
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Unable to start chat" });
    }
  };

  return (
    <div className="supportGrid fontBody">
      <aside className="supportLeft">
        <div className="supportHead">
          <h2 className="supportTitle">Support</h2>
        </div>

        <div className="supportFilters">
          <input
            className="supportSearch"
            placeholder="Search by name or email…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <select
            className="supportSelect"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All roles</option>
            <option value="coordinator">Coordinators</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {loading ? (
          <div className="skeleton lg" />
        ) : filtered.length === 0 ? (
          <div className="empty">Support is offline. Try again later.</div>
        ) : (
          <ul className="staffList">
            {filtered.map((s) => (
              <li key={s._id} className="staffCard">
                <div className="staffId">
                  <div className="avatar">
                    {s.profile_image_url ? (
                      <img src={s.profile_image_url} alt={s.full_name} />
                    ) : (
                      <span>{(s.full_name?.[0] || "S").toUpperCase()}</span>
                    )}
                  </div>
                  <div className="meta">
                    <div className="name">{s.full_name}</div>
                    <div className="role">{(s.role || "").replace("_", " ")}</div>
                  </div>
                </div>
                <button className="pillButton" onClick={() => startChat(s)}>Chat</button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <main className="supportRight">
        {msg?.text && <div className={`msg ${msg.type} show`}>{msg.text}</div>}
        {!conversation ? (
          <div className="empty big">Select a staff member to start chatting.</div>
        ) : (
          <ChatWindow conversation={conversation} peer={peer} />
        )}
      </main>
    </div>
  );
}
