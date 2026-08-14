// Individual Milk Yield with Monthly Register
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getEligibleMilkCattle,
  getCattleLactations,
  addCattleLactation,
  updateCattleLactation,
  closeCattleLactation,
  cancelCattleLactation,
  getIndividualMilkEntrySheet,
  getIndividualMilkYield,
  getIndividualCowMonthlyRegister,
  saveIndividualMilkSession,
  updateIndividualMilkYield,
} from "../../api/masterApi";

const todayIso = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const monthRange = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const last = new Date(year, today.getMonth() + 1, 0).getDate();
  return { fromDate: `${year}-${month}-01`, toDate: `${year}-${month}-${String(last).padStart(2, "0")}` };
};

const displayDate = (value) => {
  const match = String(value || "").slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value || "—";
};

const qty = (value) => value === null || value === undefined || value === ""
  ? "—"
  : Number(value).toFixed(2);

export default function IndividualMilkYield() {
  const { user } = useAuth();
  const canWrite = ["admin", "super admin"].includes(String(user?.role || "").trim().toLowerCase());
  const [view, setView] = useState(canWrite ? "daily" : "history");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const notify = (message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="imy-root">
      <style>{styles}</style>
      <div className="imy-subtabs" role="tablist">
        {canWrite && <SubTab active={view === "daily"} onClick={() => setView("daily")}>Daily Entry</SubTab>}
        {canWrite && <SubTab active={view === "lactations"} onClick={() => setView("lactations")}>Lactations</SubTab>}
        <SubTab active={view === "history"} onClick={() => setView("history")}>Cow History</SubTab>
        <SubTab active={view === "monthly"} onClick={() => setView("monthly")}>Monthly Register</SubTab>
      </div>

      {error && <div className="imy-error">{error}</div>}
      {view === "daily" && canWrite && (
        <DailyEntry loading={loading} setLoading={setLoading} saving={saving} setSaving={setSaving} setError={setError} notify={notify} />
      )}
      {view === "lactations" && canWrite && (
        <Lactations loading={loading} setLoading={setLoading} saving={saving} setSaving={setSaving} setError={setError} notify={notify} />
      )}
      {view === "history" && (
        <History canWrite={canWrite} loading={loading} setLoading={setLoading} saving={saving} setSaving={setSaving} setError={setError} notify={notify} />
      )}
      {view === "monthly" && (
        <MonthlyRegister loading={loading} setLoading={setLoading} setError={setError} />
      )}
      {toast && <div className={`imy-toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}

function SubTab({ active, onClick, children }) {
  return <button type="button" className={active ? "active" : ""} onClick={onClick}>{children}</button>;
}

function DailyEntry({ loading, setLoading, saving, setSaving, setError, notify }) {
  const requestId = useRef(0);
  const [date, setDate] = useState(todayIso());
  const [session, setSession] = useState("AM");
  const [shed, setShed] = useState("");
  const [rows, setRows] = useState([]);
  const [drafts, setDrafts] = useState({});

  const load = async () => {
    const currentRequest = ++requestId.current;
    setLoading(true); setError("");
    try {
      const response = await getIndividualMilkEntrySheet({ date, shedId: shed });
      if (currentRequest !== requestId.current) return;
      const data = Array.isArray(response?.data) ? response.data : [];
      setRows(data);
      setDrafts(Object.fromEntries(data.map((row) => {
        const entry = row.entry || {};
        const isAm = session === "AM";
        const value = isAm ? entry.amMilkQty : entry.pmMilkQty;
        const reason = isAm ? entry.amZeroReason : entry.pmZeroReason;
        return [row.cowInternalId, {
          quantity: value === null || value === undefined ? "" : String(value),
          zeroReason: reason || "",
          remarks: entry.remarks || "",
        }];
      })));
    } catch (e) {
      if (currentRequest !== requestId.current) return;
      setError(e.message || "Unable to load individual milk entry."); setRows([]);
    }
    finally { if (currentRequest === requestId.current) setLoading(false); }
  };

  useEffect(() => {
    load();
    return () => { requestId.current += 1; };
  }, [date, session, shed]);

  const sheds = useMemo(() => [...new Set(rows.map((row) => row.shedId).filter(Boolean))], [rows]);
  const update = (id, field, value) => setDrafts((old) => ({ ...old, [id]: { ...(old[id] || {}), [field]: value } }));
  const entered = rows.filter((row) => String(drafts[row.cowInternalId]?.quantity ?? "").trim() !== "");
  const total = entered.reduce((sum, row) => sum + (Number(drafts[row.cowInternalId]?.quantity) || 0), 0);

  const save = async () => {
    if (!entered.length) { notify("Enter milk quantity for at least one cow.", "error"); return; }
    const invalid = entered.find((row) => {
      const draft = drafts[row.cowInternalId];
      const text = String(draft.quantity).trim();
      return !/^\d+(?:\.\d{1,2})?$/.test(text) || (Number(text) === 0 && !String(draft.zeroReason || "").trim());
    });
    if (invalid) { notify("Use a non-negative quantity with up to two decimals; zero requires a reason.", "error"); return; }

    setSaving(true); setError("");
    try {
      await saveIndividualMilkSession({
        date, session,
        entries: entered.map((row) => ({
          cowInternalId: row.cowInternalId,
          lactationId: row.lactationId,
          quantity: Number(drafts[row.cowInternalId].quantity),
          zeroReason: drafts[row.cowInternalId].zeroReason || "",
          remarks: drafts[row.cowInternalId].remarks || "",
        })),
      });
      notify(`${session} milk yield saved for ${entered.length} cattle.`);
      await load();
    } catch (e) { setError(e.message || "Unable to save milk yield."); }
    finally { setSaving(false); }
  };

  return (
    <section>
      <div className="imy-toolbar">
        <Field label="Date"><input type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Session"><select value={session} onChange={(e) => setSession(e.target.value)}><option>AM</option><option>PM</option></select></Field>
        <Field label="Shed"><select value={shed} onChange={(e) => setShed(e.target.value)}><option value="">All sheds</option>{sheds.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <button type="button" className="imy-secondary" onClick={load} disabled={loading}>Refresh</button>
      </div>

      <div className="imy-summary">
        <Metric label="Eligible cattle" value={rows.length} />
        <Metric label="Entries ready" value={entered.length} />
        <Metric label={`${session} total`} value={`${total.toFixed(2)} L`} />
      </div>

      {loading ? <Empty text="Loading eligible cattle…" /> : !rows.length ? <Empty text="No eligible cattle with an active lactation for this date." /> : (
        <div className="imy-entry-list">
          {rows.map((row) => {
            const draft = drafts[row.cowInternalId] || {};
            const zero = String(draft.quantity).trim() !== "" && Number(draft.quantity) === 0;
            return (
              <article className="imy-entry-card" key={row.cowInternalId}>
                <div className="imy-cow">
                  <strong>{row.cowName || row.cowTagNumber}</strong>
                  <span>{row.cowTagNumber} · {row.cowBreed}</span>
                  <small>{row.shedId || "No shed"} · Lactation {row.lactationNumber}</small>
                </div>
                <Field label={`${session} milk (L)`}>
                  <input inputMode="decimal" placeholder="Not recorded" value={draft.quantity ?? ""} onChange={(e) => update(row.cowInternalId, "quantity", e.target.value)} />
                </Field>
                {zero && <Field label="Zero-yield reason"><input value={draft.zeroReason || ""} maxLength={100} onChange={(e) => update(row.cowInternalId, "zeroReason", e.target.value)} /></Field>}
                <Field label="Remarks"><input value={draft.remarks || ""} maxLength={500} onChange={(e) => update(row.cowInternalId, "remarks", e.target.value)} /></Field>
              </article>
            );
          })}
        </div>
      )}

      <div className="imy-actions"><button type="button" className="imy-primary" disabled={saving || loading || !entered.length} onClick={save}>{saving ? "Saving…" : `Save ${session} Entries`}</button></div>
    </section>
  );
}

function Lactations({ loading, setLoading, saving, setSaving, setError, notify }) {
  const requestId = useRef(0);
  const [cattle, setCattle] = useState([]);
  const [records, setRecords] = useState([]);
  const [modal, setModal] = useState(null);

  const load = async () => {
    const currentRequest = ++requestId.current;
    setLoading(true); setError("");
    try {
      const lactations = await getCattleLactations();
      if (currentRequest !== requestId.current) return;
      setRecords(Array.isArray(lactations?.data) ? lactations.data : []);
    } catch (e) {
      if (currentRequest !== requestId.current) return;
      setError(e.message || "Unable to load lactations.");
    }
    finally { if (currentRequest === requestId.current) setLoading(false); }
  };
  useEffect(() => {
    load();
    return () => { requestId.current += 1; };
  }, []);

  const openAdd = async () => {
    setLoading(true); setError("");
    try {
      const eligible = await getEligibleMilkCattle();
      setCattle(Array.isArray(eligible?.data) ? eligible.data : []);
      setModal({ mode: "add", cowId: "", birthId: "", lactationNumber: "1", startDate: "", remarks: "" });
    } catch (e) {
      setError(e.message || "Unable to load eligible cattle.");
    } finally { setLoading(false); }
  };
  const openEdit = (row) => setModal({ mode: "edit", lactationId: row.lactationId, cowId: row.cowInternalId, lactationNumber: String(row.lactationNumber), startDate: row.startDate, remarks: row.remarks || "" });
  const selectedCow = cattle.find((cow) => cow.cowInternalId === modal?.cowId);
  const births = selectedCow?.births || [];

  const save = async () => {
    setSaving(true); setError("");
    try {
      if (modal.mode === "add") {
        if (!modal.cowId || !modal.birthId) throw new Error("Select a cow and calving record.");
        await addCattleLactation({ cowInternalId: modal.cowId, birthId: modal.birthId, lactationNumber: Number(modal.lactationNumber), startDate: modal.startDate, remarks: modal.remarks });
        notify("Lactation started successfully.");
      } else {
        await updateCattleLactation({ lactationId: modal.lactationId, lactationNumber: Number(modal.lactationNumber), startDate: modal.startDate, remarks: modal.remarks });
        notify("Lactation updated successfully.");
      }
      setModal(null); await load();
    } catch (e) { setError(e.message || "Unable to save lactation."); }
    finally { setSaving(false); }
  };

  const changeStatus = async (row, action) => {
    const completed = action === "close";
    const reason = window.prompt(completed ? "Enter closing remarks:" : "Enter cancellation reason:");
    if (!reason) return;
    let endDate = "";
    if (completed) {
      endDate = window.prompt("Enter end date (YYYY-MM-DD):", todayIso()) || "";
      if (!endDate) return;
    }
    setSaving(true); setError("");
    try {
      if (completed) await closeCattleLactation({ lactationId: row.lactationId, endDate, remarks: reason });
      else await cancelCattleLactation({ lactationId: row.lactationId, remarks: reason });
      notify(completed ? "Lactation closed." : "Lactation cancelled."); await load();
    } catch (e) { setError(e.message || "Unable to update lactation status."); }
    finally { setSaving(false); }
  };

  return (
    <section>
      <div className="imy-section-head"><div><h3>Lactation Register</h3><p>Link each tracked cow to the calving that started the lactation.</p></div><button className="imy-primary" type="button" onClick={openAdd}>Start Lactation</button></div>
      {loading ? <Empty text="Loading lactations…" /> : !records.length ? <Empty text="No lactation records found." /> : (
        <div className="imy-table-wrap"><table><thead><tr><th>Cow</th><th>Breed</th><th>Calving</th><th>Lactation</th><th>Calf / Sire</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {records.map((row) => <tr key={row.lactationId}>
            <td><strong>{row.cowName || row.cowTagNumber}</strong><small>{row.cowTagNumber}</small></td><td>{row.cowBreed}</td><td>{displayDate(row.calvingDate)}<small>Start: {displayDate(row.startDate)}</small></td><td>#{row.lactationNumber}</td><td>{row.calfSex || "—"} · {row.calfBreed || "—"}<small>Sire: {row.sireName || row.sireTagNumber || "—"}</small></td><td><Status value={row.status} /></td><td>{String(row.status).toLowerCase() === "active" && <div className="imy-row-actions"><button onClick={() => openEdit(row)}>Edit</button><button onClick={() => changeStatus(row, "close")}>Close</button><button className="danger" onClick={() => changeStatus(row, "cancel")}>Cancel</button></div>}</td>
          </tr>)}</tbody></table></div>
      )}

      {modal && <Modal title={modal.mode === "add" ? "Start Lactation" : "Edit Lactation"} onClose={() => !saving && setModal(null)}>
        {modal.mode === "add" && <>
          <Field label="Cow"><select value={modal.cowId} onChange={(e) => setModal((old) => ({ ...old, cowId: e.target.value, birthId: "", startDate: "" }))}><option value="">Select cow</option>{cattle.filter((cow) => !cow.activeLactation && cow.births?.length).map((cow) => <option value={cow.cowInternalId} key={cow.cowInternalId}>{cow.tagNumber} — {cow.cattleName} ({cow.breed})</option>)}</select></Field>
          <Field label="Calving / Birth"><select value={modal.birthId} disabled={!selectedCow} onChange={(e) => { const birth = births.find((item) => item.birthId === e.target.value); setModal((old) => ({ ...old, birthId: e.target.value, startDate: birth?.calvingDate || "" })); }}><option value="">Select calving</option>{births.map((birth) => <option value={birth.birthId} key={birth.birthId}>{displayDate(birth.calvingDate)} · {birth.calfSex || "Calf"} · {birth.birthStatus}</option>)}</select></Field>
        </>}
        <div className="imy-form-grid"><Field label="Lactation number"><input type="number" min="1" max="30" value={modal.lactationNumber} onChange={(e) => setModal((old) => ({ ...old, lactationNumber: e.target.value }))} /></Field><Field label="Start date"><input type="date" max={todayIso()} value={modal.startDate} onChange={(e) => setModal((old) => ({ ...old, startDate: e.target.value }))} /></Field></div>
        <Field label="Remarks"><textarea rows="3" maxLength={500} value={modal.remarks} onChange={(e) => setModal((old) => ({ ...old, remarks: e.target.value }))} /></Field>
        <div className="imy-modal-actions"><button className="imy-secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</button><button className="imy-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button></div>
      </Modal>}
    </section>
  );
}

function History({ canWrite, loading, setLoading, saving, setSaving, setError, notify }) {
  const requestId = useRef(0);
  const initial = monthRange();
  const [fromDate, setFromDate] = useState(initial.fromDate);
  const [toDate, setToDate] = useState(initial.toDate);
  const [cowId, setCowId] = useState("");
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [edit, setEdit] = useState(null);

  const load = async () => {
    if (!fromDate || !toDate || fromDate > toDate) { setError("Select a valid From and To date range."); return; }
    const currentRequest = ++requestId.current;
    setLoading(true); setError("");
    try {
      const response = await getIndividualMilkYield({ fromDate, toDate, cowInternalId: cowId });
      if (currentRequest !== requestId.current) return;
      setRows(Array.isArray(response?.data) ? response.data : []); setSummary(response?.summary || {});
    } catch (e) {
      if (currentRequest !== requestId.current) return;
      setError(e.message || "Unable to load individual milk history.");
    }
    finally { if (currentRequest === requestId.current) setLoading(false); }
  };
  useEffect(() => {
    load();
    return () => { requestId.current += 1; };
  }, []);

  const cattle = useMemo(() => [...new Map(rows.map((row) => [row.cowInternalId, row])).values()], [rows]);
  const saveEdit = async () => {
    setSaving(true); setError("");
    try {
      await updateIndividualMilkYield({ yieldId: edit.yieldId, amMilkQty: edit.amMilkQty, amZeroReason: edit.amZeroReason, pmMilkQty: edit.pmMilkQty, pmZeroReason: edit.pmZeroReason, remarks: edit.remarks });
      notify("Individual milk yield updated."); setEdit(null); await load();
    } catch (e) { setError(e.message || "Unable to update milk yield."); }
    finally { setSaving(false); }
  };

  return <section>
    <div className="imy-toolbar"><Field label="From"><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></Field><Field label="To"><input type="date" max={todayIso()} value={toDate} onChange={(e) => setToDate(e.target.value)} /></Field><Field label="Cow"><select value={cowId} onChange={(e) => setCowId(e.target.value)}><option value="">All cattle</option>{cattle.map((row) => <option value={row.cowInternalId} key={row.cowInternalId}>{row.cowTagNumber} — {row.cowName}</option>)}</select></Field><button className="imy-primary" type="button" onClick={load} disabled={loading}>Apply</button></div>
    <div className="imy-summary"><Metric label="Milk actually milked" value={`${Number(summary.totalMilk || 0).toFixed(2)} L`} /><Metric label="Cattle" value={summary.cattleCount || 0} /><Metric label="Recorded days" value={summary.recordedDays || 0} /><Metric label="Sessions" value={summary.recordedSessions || 0} /></div>
    {loading ? <Empty text="Loading history…" /> : !rows.length ? <Empty text="No individual milk-yield records found." /> : <div className="imy-table-wrap"><table><thead><tr><th>Date</th><th>Cow</th><th>Lactation</th><th>AM</th><th>PM</th><th>Total</th><th>Remarks</th></tr></thead><tbody>{rows.map((row) => <tr key={row.yieldId} className={canWrite ? "clickable" : ""} onClick={() => canWrite && setEdit({ ...row, amMilkQty: row.amMilkQty ?? "", pmMilkQty: row.pmMilkQty ?? "" })}><td>{displayDate(row.date)}</td><td><strong>{row.cowName || row.cowTagNumber}</strong><small>{row.cowTagNumber} · {row.cowBreed}</small></td><td>#{row.lactationNumber}</td><td>{qty(row.amMilkQty)}{row.amZeroReason && <small>{row.amZeroReason}</small>}</td><td>{qty(row.pmMilkQty)}{row.pmZeroReason && <small>{row.pmZeroReason}</small>}</td><td><strong>{qty(row.dailyTotal)} L</strong></td><td>{row.remarks || "—"}</td></tr>)}</tbody></table></div>}
    {edit && <Modal title="Edit Individual Milk Yield" onClose={() => !saving && setEdit(null)}><p className="imy-context">{displayDate(edit.date)} · {edit.cowName || edit.cowTagNumber}</p><div className="imy-form-grid"><Field label="AM milk (L)"><input inputMode="decimal" value={edit.amMilkQty} onChange={(e) => setEdit((old) => ({ ...old, amMilkQty: e.target.value }))} /></Field><Field label="PM milk (L)"><input inputMode="decimal" value={edit.pmMilkQty} onChange={(e) => setEdit((old) => ({ ...old, pmMilkQty: e.target.value }))} /></Field>{Number(edit.amMilkQty) === 0 && String(edit.amMilkQty) !== "" && <Field label="AM zero reason"><input value={edit.amZeroReason || ""} onChange={(e) => setEdit((old) => ({ ...old, amZeroReason: e.target.value }))} /></Field>}{Number(edit.pmMilkQty) === 0 && String(edit.pmMilkQty) !== "" && <Field label="PM zero reason"><input value={edit.pmZeroReason || ""} onChange={(e) => setEdit((old) => ({ ...old, pmZeroReason: e.target.value }))} /></Field>}</div><Field label="Remarks"><textarea rows="3" value={edit.remarks || ""} onChange={(e) => setEdit((old) => ({ ...old, remarks: e.target.value }))} /></Field><div className="imy-modal-actions"><button className="imy-secondary" onClick={() => setEdit(null)} disabled={saving}>Cancel</button><button className="imy-primary" onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Update"}</button></div></Modal>}
  </section>;
}

function MonthlyRegister({ loading, setLoading, setError }) {
  const requestId = useRef(0);
  const [month, setMonth] = useState(todayIso().slice(0, 7));
  const [cowId, setCowId] = useState("");
  const [lactationId, setLactationId] = useState("");
  const [lactations, setLactations] = useState([]);
  const [report, setReport] = useState(null);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    setLoading(true); setError("");
    getCattleLactations()
      .then((response) => {
        if (currentRequest !== requestId.current) return;
        const data = (Array.isArray(response?.data) ? response.data : [])
          .filter((row) => String(row.status || "").toLowerCase() !== "cancelled");
        setLactations(data);
      })
      .catch((error) => {
        if (currentRequest !== requestId.current) return;
        setError(error.message || "Unable to load cattle lactations for the monthly register.");
      })
      .finally(() => {
        if (currentRequest === requestId.current) setLoading(false);
      });
    return () => { requestId.current += 1; };
  }, []);

  const cattle = useMemo(() => {
    const unique = new Map();
    lactations.forEach((row) => {
      if (!unique.has(row.cowInternalId)) unique.set(row.cowInternalId, row);
    });
    return [...unique.values()].sort((a, b) =>
      String(a.cowTagNumber || a.cowName).localeCompare(String(b.cowTagNumber || b.cowName))
    );
  }, [lactations]);

  const cowLactations = useMemo(() => lactations
    .filter((row) => row.cowInternalId === cowId)
    .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate))),
  [lactations, cowId]);

  const chooseCow = (value) => {
    setCowId(value); setReport(null);
    const options = lactations
      .filter((row) => row.cowInternalId === value)
      .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)));
    setLactationId(options[0]?.lactationId || "");
  };

  const load = async () => {
    if (!month || !cowId || !lactationId) {
      setError("Select month, cow and lactation for the monthly register.");
      return;
    }
    const currentRequest = ++requestId.current;
    setLoading(true); setError(""); setReport(null);
    try {
      const response = await getIndividualCowMonthlyRegister({
        month, cowInternalId: cowId, lactationId,
      });
      if (currentRequest !== requestId.current) return;
      setReport(response?.data || null);
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      setError(error.message || "Unable to load the monthly milk register.");
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  const print = () => window.print();
  const reportMonth = report?.month
    ? new Date(`${report.month}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "";
  const leftRows = report?.rows?.slice(0, 15) || [];
  const rightRows = report?.rows?.slice(15) || [];
  const exceptions = (report?.rows || []).filter((row) =>
    row.amZeroReason || row.pmZeroReason || row.remarks
  );

  return <section>
    <div className="imy-toolbar imy-no-print">
      <Field label="Month"><input type="month" max={todayIso().slice(0, 7)} value={month} onChange={(e) => { setMonth(e.target.value); setReport(null); }} /></Field>
      <Field label="Cow"><select value={cowId} onChange={(e) => chooseCow(e.target.value)}><option value="">Select cow</option>{cattle.map((row) => <option value={row.cowInternalId} key={row.cowInternalId}>{row.cowTagNumber} — {row.cowName} ({row.cowBreed})</option>)}</select></Field>
      <Field label="Lactation"><select value={lactationId} onChange={(e) => { setLactationId(e.target.value); setReport(null); }} disabled={!cowId}><option value="">Select lactation</option>{cowLactations.map((row) => <option value={row.lactationId} key={row.lactationId}>#{row.lactationNumber} — {displayDate(row.startDate)} ({row.status})</option>)}</select></Field>
      <button className="imy-primary" type="button" onClick={load} disabled={loading}>{loading ? "Loading…" : "Generate"}</button>
    </div>

    {!report && !loading && <Empty text="Select a month, cow and lactation to generate the monthly register." />}
    {report && <>
      <div className="imy-report-actions imy-no-print"><button className="imy-primary" type="button" onClick={print}>Print / Save PDF</button></div>
      <article className="imy-print-area">
        <header className="imy-register-title"><h2>MADHAVA SRUSHTI RASHTROTTHANA GOSHALA</h2><h3>INDIVIDUAL COW MONTHLY MILK REGISTER</h3><p>{reportMonth}</p></header>
        <div className="imy-register-details">
          <RegisterItem label="Cow name" value={report.cow?.name} />
          <RegisterItem label="Tag number" value={report.cow?.tagNumber} />
          <RegisterItem label="Breed" value={report.cow?.breed} />
          <RegisterItem label="Lactation" value={`#${report.lactation?.lactationNumber || "—"}`} />
          <RegisterItem label="Calving date" value={displayDate(report.lactation?.calvingDate)} />
          <RegisterItem label="Calf" value={[report.lactation?.calfSex, report.lactation?.calfBreed].filter(Boolean).join(" · ") || "—"} />
          <RegisterItem label="Sire name / tag" value={[report.lactation?.sireName, report.lactation?.sireTag].filter(Boolean).join(" · ") || "—"} />
          <RegisterItem label="Sire breed" value={report.lactation?.sireBreed || "—"} />
        </div>
        <div className="imy-register-halves"><RegisterTable rows={leftRows} /><RegisterTable rows={rightRows} /></div>
        <div className="imy-register-summary">
          <RegisterItem label="AM total" value={`${Number(report.summary?.amTotal || 0).toFixed(2)} L`} />
          <RegisterItem label="PM total" value={`${Number(report.summary?.pmTotal || 0).toFixed(2)} L`} />
          <RegisterItem label="Monthly total" value={`${Number(report.summary?.totalMilk || 0).toFixed(2)} L`} />
          <RegisterItem label="Recorded days" value={report.summary?.recordedDays || 0} />
          <RegisterItem label="Recorded sessions" value={report.summary?.recordedSessions || 0} />
          <RegisterItem label="Average / recorded day" value={`${Number(report.summary?.averagePerRecordedDay || 0).toFixed(2)} L`} />
          <RegisterItem label="Highest daily yield" value={`${Number(report.summary?.highestDailyYield || 0).toFixed(2)} L`} />
        </div>
        {!!exceptions.length && <div className="imy-register-notes"><h4>Zero-yield reasons / remarks</h4>{exceptions.map((row) => <p key={row.date}><strong>{displayDate(row.date)}:</strong> {[row.amZeroReason && `AM — ${row.amZeroReason}`, row.pmZeroReason && `PM — ${row.pmZeroReason}`, row.remarks].filter(Boolean).join("; ")}</p>)}</div>}
        <footer className="imy-register-signatures"><span>Prepared by</span><span>Verified by</span><span>Authorized by</span></footer>
      </article>
    </>}
  </section>;
}

function RegisterItem({ label, value }) {
  return <div className="imy-register-item"><span>{label}</span><strong>{value || "—"}</strong></div>;
}

function RegisterTable({ rows }) {
  return <table className="imy-register-table"><thead><tr><th>Sl.</th><th>Date</th><th>Morning</th><th>Evening</th><th>Total</th></tr></thead><tbody>{rows.map((row) => <tr key={row.date}><td>{row.serialNumber}</td><td>{displayDate(row.date).slice(0, 5)}</td><td>{qty(row.amMilkQty)}</td><td>{qty(row.pmMilkQty)}</td><td>{row.amRecorded || row.pmRecorded ? Number(row.dailyTotal || 0).toFixed(2) : "—"}</td></tr>)}</tbody></table>;
}

function Field({ label, children }) { return <label className="imy-field"><span>{label}</span>{children}</label>; }
function Metric({ label, value }) { return <div className="imy-metric"><span>{label}</span><strong>{value}</strong></div>; }
function Empty({ text }) { return <div className="imy-empty">{text}</div>; }
function Status({ value }) { return <span className={`imy-status ${String(value).toLowerCase()}`}>{value}</span>; }
function Modal({ title, onClose, children }) { return <div className="imy-overlay" onMouseDown={onClose}><div className="imy-modal" onMouseDown={(e) => e.stopPropagation()}><div className="imy-modal-head"><h3>{title}</h3><button type="button" onClick={onClose}>×</button></div><div className="imy-modal-body">{children}</div></div></div>; }

const styles = `
.imy-root{color:#0f172a}.imy-subtabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 20px}.imy-subtabs button{border:1px solid #cbd5e1;background:#fff;color:#475569;padding:10px 16px;border-radius:9px;font-weight:700;cursor:pointer}.imy-subtabs button.active{background:#fff7ed;border-color:#ea580c;color:#c2410c}.imy-error{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:12px 14px;border-radius:9px;margin-bottom:16px}.imy-toolbar{display:grid;grid-template-columns:repeat(3,minmax(150px,1fr)) auto;align-items:end;gap:14px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px}.imy-field{display:flex;flex-direction:column;gap:6px;min-width:0}.imy-field>span{font-size:12px;font-weight:700;color:#475569}.imy-field input,.imy-field select,.imy-field textarea{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:8px;padding:10px 11px;font:inherit;background:#fff;color:#0f172a}.imy-field input:focus,.imy-field select:focus,.imy-field textarea:focus{outline:2px solid #fed7aa;border-color:#ea580c}.imy-primary,.imy-secondary{border:0;border-radius:8px;padding:11px 16px;font-weight:700;cursor:pointer}.imy-primary{background:#ea580c;color:#fff}.imy-primary:hover{background:#c2410c}.imy-secondary{background:#f1f5f9;color:#334155;border:1px solid #cbd5e1}.imy-primary:disabled,.imy-secondary:disabled{opacity:.55;cursor:not-allowed}.imy-summary{display:grid;grid-template-columns:repeat(4,minmax(130px,1fr));gap:12px;margin-bottom:16px}.imy-metric{background:#fff;border:1px solid #e2e8f0;border-radius:11px;padding:14px}.imy-metric span{display:block;font-size:12px;color:#64748b;margin-bottom:5px}.imy-metric strong{font-size:20px}.imy-entry-list{display:grid;gap:10px}.imy-entry-card{display:grid;grid-template-columns:minmax(190px,1.3fr) minmax(130px,.7fr) minmax(180px,1fr) minmax(180px,1fr);gap:14px;align-items:end;background:#fff;border:1px solid #e2e8f0;border-radius:11px;padding:14px}.imy-cow{display:flex;flex-direction:column;gap:3px}.imy-cow span,.imy-cow small{color:#64748b}.imy-actions{display:flex;justify-content:flex-end;position:sticky;bottom:0;background:linear-gradient(transparent,#f8fafc 30%);padding:24px 0 8px}.imy-section-head{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:16px}.imy-section-head h3{margin:0 0 4px}.imy-section-head p{margin:0;color:#64748b}.imy-table-wrap{overflow:auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px}.imy-table-wrap table{width:100%;border-collapse:collapse;min-width:900px}.imy-table-wrap th,.imy-table-wrap td{text-align:left;padding:12px 14px;border-bottom:1px solid #e2e8f0;vertical-align:top}.imy-table-wrap th{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#64748b;background:#f8fafc}.imy-table-wrap td small{display:block;color:#64748b;margin-top:3px}.imy-table-wrap tr.clickable{cursor:pointer}.imy-table-wrap tr.clickable:hover{background:#fff7ed}.imy-row-actions{display:flex;gap:6px}.imy-row-actions button{border:1px solid #cbd5e1;background:#fff;border-radius:6px;padding:6px 8px;cursor:pointer}.imy-row-actions button.danger{color:#b91c1c}.imy-status{display:inline-flex;padding:4px 8px;border-radius:999px;background:#e2e8f0;font-size:12px;font-weight:700}.imy-status.active{background:#dcfce7;color:#166534}.imy-status.completed{background:#dbeafe;color:#1d4ed8}.imy-status.cancelled{background:#fee2e2;color:#b91c1c}.imy-empty{text-align:center;padding:42px 16px;color:#64748b;background:#fff;border:1px dashed #cbd5e1;border-radius:12px}.imy-overlay{position:fixed;inset:0;z-index:1000;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:18px}.imy-modal{background:#fff;width:min(620px,100%);max-height:90vh;overflow:auto;border-radius:14px;box-shadow:0 24px 70px rgba(15,23,42,.3)}.imy-modal-head{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding:16px 18px;position:sticky;top:0;background:#fff;z-index:1}.imy-modal-head h3{margin:0}.imy-modal-head button{font-size:28px;border:0;background:transparent;cursor:pointer;color:#64748b}.imy-modal-body{display:grid;gap:15px;padding:18px}.imy-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.imy-modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:4px}.imy-context{margin:0;color:#64748b}.imy-toast{position:fixed;right:22px;bottom:22px;z-index:1100;background:#166534;color:#fff;padding:12px 16px;border-radius:9px;box-shadow:0 10px 30px rgba(0,0,0,.2)}.imy-toast.error{background:#b91c1c}
.imy-report-actions{display:flex;justify-content:flex-end;margin-bottom:12px}.imy-print-area{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:20px;color:#111827}.imy-register-title{text-align:center;border:1px solid #334155}.imy-register-title h2,.imy-register-title h3,.imy-register-title p{margin:0;padding:7px;border-bottom:1px solid #334155}.imy-register-title p{border-bottom:0;font-weight:700}.imy-register-details,.imy-register-summary{display:grid;grid-template-columns:repeat(4,1fr);border-left:1px solid #334155;border-top:1px solid #334155}.imy-register-item{display:flex;flex-direction:column;gap:4px;padding:7px 9px;border-right:1px solid #334155;border-bottom:1px solid #334155;min-width:0}.imy-register-item span{font-size:10px;text-transform:uppercase;color:#475569;font-weight:700}.imy-register-item strong{font-size:13px;overflow-wrap:anywhere}.imy-register-halves{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0}.imy-register-table{width:100%;border-collapse:collapse}.imy-register-table th,.imy-register-table td{border:1px solid #334155;text-align:center;padding:5px;font-size:12px;height:24px}.imy-register-table th{background:#f1f5f9;text-transform:uppercase;font-size:10px}.imy-register-notes{border:1px solid #334155;padding:9px;margin-top:12px}.imy-register-notes h4{margin:0 0 7px}.imy-register-notes p{margin:4px 0;font-size:12px}.imy-register-signatures{display:grid;grid-template-columns:repeat(3,1fr);gap:40px;margin-top:42px;text-align:center}.imy-register-signatures span{border-top:1px solid #334155;padding-top:5px;font-size:12px;font-weight:700}
@media(max-width:900px){.imy-toolbar{grid-template-columns:1fr 1fr}.imy-summary{grid-template-columns:1fr 1fr}.imy-entry-card{grid-template-columns:1fr 1fr}.imy-cow{grid-column:1/-1}}
@media(max-width:640px){.imy-toolbar,.imy-summary,.imy-entry-card,.imy-form-grid,.imy-register-details,.imy-register-summary,.imy-register-halves{grid-template-columns:1fr}.imy-section-head{align-items:stretch;flex-direction:column}.imy-section-head .imy-primary{width:100%}.imy-overlay{padding:0}.imy-modal{width:100%;height:100dvh;max-height:none;border-radius:0}.imy-actions .imy-primary{width:100%}.imy-print-area{padding:10px}.imy-register-title h2{font-size:16px}.imy-register-title h3{font-size:14px}}
@media print{@page{size:A4 landscape;margin:8mm}body *{visibility:hidden!important}.imy-print-area,.imy-print-area *{visibility:visible!important}.imy-print-area{position:absolute;left:0;top:0;width:100%;box-sizing:border-box;border:0;border-radius:0;padding:0}.imy-register-halves{grid-template-columns:1fr 1fr}.imy-register-details,.imy-register-summary{grid-template-columns:repeat(4,1fr)}.imy-register-table th,.imy-register-table td{padding:3px;font-size:9px;height:16px}.imy-register-title h2,.imy-register-title h3,.imy-register-title p{padding:4px}.imy-register-item{padding:4px 6px}.imy-register-signatures{margin-top:28px}.imy-no-print{display:none!important}}
`;
