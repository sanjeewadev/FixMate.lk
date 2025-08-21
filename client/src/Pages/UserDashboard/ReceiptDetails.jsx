import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listReceipts } from "../../services/receipts";
import "./Receipt.css";

export default function Receipts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const list = await listReceipts();
        if (!dead) setItems(list);
      } catch (e) {
        if (!dead) setMsg({ type: "error", text: e.message || "Unable to load receipts" });
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, []);

  return (
    <div className="receiptWrap">
      <div className="receiptHeader">
        <h2 className="receiptTitle">My Receipts</h2>
      </div>

      {msg?.text && <div className={`receiptMsg ${msg.type}`}>{msg.text}</div>}

      {loading ? (
        <div className="receiptCard">Loading…</div>
      ) : items.length === 0 ? (
        <div className="receiptCard">No receipts yet.</div>
      ) : (
        <div className="receiptCard">
          <table className="receiptTable">
            <thead>
              <tr>
                <th>Date</th>
                <th>Service</th>
                <th>Total (LKR)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b._id}>
                  <td>
                    {b.workCompletedAt
                      ? new Date(b.workCompletedAt).toLocaleDateString("en-LK")
                      : "-"}
                  </td>
                  <td>{b.service?.name || "-"}</td>
                  <td>{Number(b.payment?.grandTotal || 0).toFixed(2)}</td>
                  <td>
                    <Link className="viewButton" to={`/UserDashboard/receipt/${b._id}`}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
