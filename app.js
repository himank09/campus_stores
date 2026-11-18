(() => {
  const storageKey = "campus-stores.shift.v3";
  const root = document.getElementById("campus-stores");
  if (!root) return;
  const q = (selector) => root.querySelector(selector);

  const requests = [
    {
      id: "RQ-214", club: "Film Society", event: "Courtyard screening",
      owner: "Isha Rao", due: "Fri 8 pm",
      items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"],
      note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm."
    },
    {
      id: "RQ-209", club: "Debate Union", event: "Finals rehearsal",
      owner: "Tara Shah", due: "Sat 10 am", items: ["Wireless microphone"],
      note: "Rehearsal runs into the evening."
    },
    {
      id: "RQ-217", club: "Photo Circle", event: "Street portrait walk",
      owner: "Dev Menon", due: "Sat noon", items: ["Digital camera"],
      note: "Collection on Saturday morning."
    }
  ];

  const assets = [
    { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
    { id: "PR-06", type: "HDMI projector", model: "Epson EB-X49", bin: "Workshop", repair: true },
    { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
    { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
    { id: "AD-12", type: "USB-C → HDMI adapter", model: "Belkin AVC002", bin: "C4" },
    { id: "AD-15", type: "USB-C → HDMI adapter", model: "Anker A8312", bin: "C4" },
    { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
    { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" }
  ];
  const people = ["Isha Rao", "Kabir Sen", "Leela Das", "Tara Shah", "Dev Menon"];
  const shifts = [
    {
      time: "Friday · 3:45 pm", title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time"
    },
    {
      time: "Friday · 7:30 pm", title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning"
    },
    {
      time: "Saturday · 9:00 am", title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Use the handover to identify what was outstanding and close the correct loan."
    }
  ];
  const pages = [
    ["Requests", "clipboard-list"],
    ["Inventory", "package"],
    ["Loan register", "book-open"],
    ["Desk book", "messages-square"],
    ["Shift handover", "clipboard-list"]
  ];

  const original = () => ({
    version: 3, tab: "Requests", phase: 0, selected: "", filter: "All items", assetConditions: {},
    loans: [{ num: 401, req: "RQ-209", asset: "MI-09", who: "Tara Shah", due: "Sat 10 am", back: false }],
    notes: [], activity: [], editing: false, onlyOpen: true, handoverReviewed: false,
    notice: "Sample shift · All records are fictional."
  });

  let s = original();
  let returningLoan = null;
  // Demo-only identity: this is a UI permission simulation, not secure authentication.
  let session = null;
  const rolePermissions = {
    "Desk staff": new Set(["advance", "tab", "close", "request", "new", "cancel", "scope", "ack", "return", "note", "issue"]),
    "Supervisor": new Set(["advance", "tab", "close", "request", "new", "cancel", "scope", "ack", "return", "note", "issue", "restart", "export"]),
    "Read-only viewer": new Set(["tab", "close", "request", "scope"])
  };
  const can = (action) => Boolean(session && rolePermissions[session.role]?.has(action));
  const getAsset = (id) => assets.find((x) => x.id === id);
  const getReq = (id) => requests.find((x) => x.id === id);
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);
  const openLoans = () => s.loans.filter((l) => !l.back);
  const addActivity = (loan, action, actor, details, verification = "recorded") => {
    s.activity.push({
      id: `${Date.now()}-${s.activity.length + 1}`,
      loan: loan.num, asset: loan.asset, phase: s.phase,
      time: shifts[s.phase].time, action, actor, details, verification
    });
  };
  const esc = (x) => String(x).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
  const opts = (list) => list.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join("");
  const btn = (label, act, val = "", style = "") =>
    `<button type="button" data-action="${act}" data-val="${esc(val)}" class="${style}">${esc(label)}</button>`;
  const head = (title, sub, control = "") =>
    `<div class="sectionhead"><div><h2>${title}</h2><small>${sub}</small></div>${control}</div>`;
  const row = (label, sub, right) =>
    `<div class="row"><div><strong>${esc(label)}</strong><small>${esc(sub)}</small></div><div>${right}</div></div>`;
  const badge = (label, good = false) =>
    `<span class="tag${good ? " good" : ""}">${esc(label)}</span>`;

  function requestPage() {
    let html = head("Approved requests", "Student Activities Office · 3 approved forms");
    if (s.selected) {
      const r = getReq(s.selected);
      html += btn("Back to list", "close") +
        `<div class="record"><small>${r.id} · Approved</small><h3>${esc(r.event)}</h3>
        <p>${esc(r.club)} · Filed by ${esc(r.owner)}</p><p><b>Return by</b> ${esc(r.due)}</p>
        <p><b>Approved equipment</b></p><ul>${r.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <p>${esc(r.note)}</p></div>`;
    } else {
      html += requests.map((r) => row(r.event, `${r.id} · ${r.club}`, btn("View form", "request", r.id))).join("");
    }
    return html;
  }

  function inventory() {
    let html = head("Inventory", "Physical units · home shelf and current availability");
    html += `<div class="buttons"><label>Show <select data-filter>${opts(
      ["All items", "On shelf", "On loan", "In repair"].map((f) => [f, f])
    )}</select></label></div>`;
    for (const a of assets) {
      const status = a.repair ? "In repair · damaged" : out(a.id) ? "On loan" : "On shelf";
      if (s.filter !== "All items" && s.filter !== status) continue;
      html += row(`${a.id} · ${a.type}`, `${a.model} · ${a.bin}`, badge(status, status === "On shelf"));
    }
    return html;
  }

  function register() {
    let html = head("Loan register", "One slip per physical unit",
      s.editing ? btn("Cancel", "cancel") : btn("New issue slip", "new", "", "primary"));
    if (s.editing) {
      const available = assets.filter((a) => !a.repair && !out(a.id));
      const select = (label, key, options) =>
        `<label><span>${label}</span><select name="${key}" required><option value="">Select…</option>${opts(options)}</select></label>`;
      return html + `<form data-issue><div class="form">
        ${select("Approved request", "req", requests.map((r) => [r.id, `${r.id} · ${r.club}`]))}
        ${select("Unit leaving the desk", "asset", available.map((a) => [a.id, `${a.id} · ${a.type}`]))}
        ${select("Collected by", "who", people.map((p) => [p, p]))}
        ${select("Return by", "due", ["Fri 8 pm", "Sat 9 am", "Sat 10 am", "Sat noon"].map((d) => [d, d]))}
      </div><button type="submit" class="primary">Save issue slip</button></form>`;
    }
    html += `<div class="buttons">${["Outstanding", "All slips"].map((v, i) =>
      `<button type="button" data-action="scope" data-val="${i}" aria-pressed="${s.onlyOpen === (i === 0)}">${v}</button>`
    ).join("")}</div>`;
    const shown = s.loans.filter((l) => !s.onlyOpen || !l.back).slice().reverse();
    if (!shown.length) html += "<p>No outstanding slips.</p>";
    for (const l of shown) {
      const a = getAsset(l.asset);
      html += row(`L-${l.num} · ${l.asset}`, `${l.req} · ${l.who} · Due ${l.due} · ${a ? a.type : ""}`,
        l.back ? badge("Returned", true) : btn("Record return", "return", String(l.num)));
    }
    return html;
  }

  function deskbook() {
    let html = head("Desk book", "Messages from clubs and notes for the next shift");
    const entries = [
      ["Friday · 3:20 pm", "Isha Rao · Film Society",
        "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard."],
      ["Friday · 3:30 pm", "Tara Shah · Debate Union",
        "Our microphone stays with me overnight. I’ll return it by 10 am Saturday."]
    ];
    if (s.phase >= 1) entries.push(["Friday · 7:30 pm", "Kabir Sen · Film Society",
      "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow."]);
    for (const n of s.notes) entries.push([shifts[n.phase].time, "Counter handover", n.text]);
    for (const [time, author, body] of entries.slice().reverse()) {
      html += `<article class="record"><small>${esc(time)}</small><h3>${esc(author)}</h3><p>${esc(body)}</p></article>`;
    }
    return html + `<form data-note><div class="form"><label class="full"><span>Note for the next shift</span>
      <textarea name="note" rows="2" maxlength="400" required></textarea></label></div>
      <button type="submit">Add handover note</button></form>`;
  }

  function handover() {
    const pending = openLoans();
    const filmPending = pending.filter((l) => l.req === "RQ-214");
    const returnedFilm = s.loans.filter((l) => l.req === "RQ-214" && l.back);
    let html = head("Shift handover", "A live view of unfinished work · generated from loan slips");
    html += `<div class="handover-intro">
      <div><span class="eyebrow">INCOMING SHIFT · ${s.phase === 2 ? "SATURDAY, 9:00 AM" : "PREVIEW"}</span>
      <h3>${pending.length ? `${pending.length} item${pending.length === 1 ? "" : "s"} still out` : "No outstanding equipment"}</h3>
      <p>${pending.length ? "Start with the items below. Their loan records remain open until each physical unit is checked back in." : "Every issued unit has been returned. There is no outstanding equipment to chase."}</p></div>
      ${badge(pending.length ? "Action needed" : "All clear", !pending.length)}
    </div>`;
    html += `<div class="handover-stats">
      <div><strong>${s.loans.length}</strong><small>Total slips</small></div>
      <div><strong>${returnedFilm.length}</strong><small>Film Society returned</small></div>
      <div><strong>${pending.length}</strong><small>Still outstanding</small></div>
    </div>`;
    html += `<h3 class="subhead">Open equipment loans</h3>`;
    if (!pending.length) {
      html += `<div class="empty-state"><strong>Nothing left to chase</strong><p>All current loan slips are closed.</p></div>`;
    } else {
      for (const l of pending) {
        const a = getAsset(l.asset), r = getReq(l.req);
        const custody = l.custodyReport || null;
        const holder = custody ? `${custody.holder} (reported)` : l.who;
        const expected = custody ? custody.expectedReturn : l.due;
        const history = s.activity.filter((event) => event.loan === l.num);
        html += `<article class="handover-item">
          <div class="handover-item-top"><div><span class="eyebrow">${esc(l.req)} · ${esc(r ? r.club : "")}</span>
          <h3>${esc(a ? a.type : l.asset)}</h3><small>${esc(l.asset)} · ${esc(a ? a.model : "")}</small></div>${badge("On loan")}</div>
          <div class="handover-meta"><div><small>Last recorded borrower</small><strong>${esc(l.who)}</strong></div>
          <div><small>Current holder / contact</small><strong>${esc(holder)}</strong></div>
          <div><small>Expected back</small><strong>${esc(expected)}</strong></div></div>
          <div class="custody-state">
            <span class="eyebrow">CUSTODY CONFIDENCE</span>
            <strong>${custody ? "Reported by borrower · Not yet physically verified" : "Last recorded borrower · No transfer reported"}</strong>
          </div>
          ${history.length ? `<div class="asset-history"><span class="eyebrow">AUDIT HISTORY</span>
            ${history.map((event) => `<div class="history-event"><span class="history-marker"></span>
              <div><strong>${esc(event.action)}</strong><small>${esc(event.time)} · ${esc(event.actor)} · ${esc(event.details)}</small></div>
            </div>`).join("")}</div>` : ""}
          <div class="handover-action"><span>${custody && s.phase >= 2 ? "The reported holder has arrived. Verify the physical unit before closing this loan." : "Keep this slip open until the physical unit is checked in."}</span>
          ${btn("Verify & record return", "return", String(l.num), "primary")}</div>
        </article>`;
      }
    }
    if (s.phase >= 1 && filmPending.length) {
      html += `<div class="handover-callout"><strong>Context from Friday’s close</strong>
        <p>Kabir returned the projector and speaker. He reported that Leela Das still had the USB-C → HDMI adapter and would bring it in at 9:00 am Saturday.</p>
        <small>This context is linked to the outstanding Film Society loan above; it does not close the loan by itself.</small></div>`;
    }
    const recentActivity = s.activity.slice().reverse();
    html += `<h3 class="subhead">Recent activity · all loan slips</h3>`;
    html += recentActivity.length ? `<div class="asset-history">${recentActivity.map((event) => {
      const loan = s.loans.find((item) => item.num === event.loan);
      return `<div class="history-event"><span class="history-marker"></span><div>
        <strong>${esc(event.action)} · ${esc(event.asset)}</strong>
        <small>${esc(event.time)} · ${esc(event.actor)} · ${esc(event.details)}${event.verification === "unverified" ? " · Not physically verified" : event.verification === "physically-verified" ? " · Physically verified" : ""}</small>
      </div></div>`;
    }).join("")}</div>` : `<p class="muted">No activity has been recorded yet.</p>`;
    html += `<h3 class="subhead">Shift checklist</h3>
      <div class="checklist">
        <div class="check-row"><span class="check-dot ${pending.length ? "waiting" : "done"}">${pending.length ? "!" : "✓"}</span>
          <div><strong>${pending.length ? "Resolve outstanding equipment" : "All equipment accounted for"}</strong>
          <small>${pending.length ? `${pending.length} open loan slip(s) need a physical return or follow-up.` : "No open loan slips remain."}</small></div></div>
        <div class="check-row"><span class="check-dot ${returnedFilm.length ? "done" : "waiting"}">${returnedFilm.length ? "✓" : "•"}</span>
          <div><strong>Review returned Film Society kit</strong><small>${returnedFilm.length} Film Society unit(s) already recorded as returned.</small></div></div>
        <div class="check-row"><span class="check-dot ${s.handoverReviewed ? "done" : "waiting"}">${s.handoverReviewed ? "✓" : "•"}</span>
          <div><strong>Incoming shift reviewed this handover</strong><small>${s.handoverReviewed ? "Review acknowledged for this sample shift." : "Acknowledge after checking the outstanding items and context."}</small></div></div>
      </div>
      <div class="handover-footer">${btn(s.handoverReviewed ? "Review acknowledged" : "Acknowledge handover", "ack", "", s.handoverReviewed ? "" : "primary")}
      ${can("export") ? btn("Export audit report (CSV)", "export", "", "secondary") : ""}
      <small>Acknowledging the handover does not close any equipment loan. Supervisors can export the loan and activity history for review.</small></div>`;
    return html;
  }

  const screens = {
    Requests: requestPage, Inventory: inventory, "Loan register": register,
    "Desk book": deskbook, "Shift handover": handover
  };

  function paint() {
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;
    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next;
    advance.textContent = phase.next || "";
    q("[data-nav]").innerHTML = pages.map(([name, icon]) =>
      `<button type="button" data-action="tab" data-val="${esc(name)}" aria-pressed="${s.tab === name}">
        <svg aria-hidden="true" class="store-icon"><use href="#icon-${icon}"></use></svg>${esc(name)}</button>`
    ).join("");
    q("[data-page]").innerHTML = screens[s.tab]();
    if (q("[data-filter]")) q("[data-filter]").value = s.filter;
    q("[data-status]").textContent = session
      ? `${s.notice} · Signed in: ${session.name} (${session.role})`
      : "Sign in to access the desk workspace.";
    const mast = q(".mast");
    let sessionControl = q("[data-session-control]");
    if (!sessionControl && mast) {
      mast.insertAdjacentHTML("beforeend", '<div class="session-control" data-session-control></div>');
      sessionControl = q("[data-session-control]");
    }
    if (sessionControl) sessionControl.innerHTML = session
      ? `<span>${esc(session.name)} · ${esc(session.role)}</span><button type="button" data-action="signout">Sign out</button>`
      : `<span>Not signed in</span>`;
    let gate = q(".auth-gate");
    if (!session) {
      if (!gate) {
        root.insertAdjacentHTML("beforeend", `<section class="auth-gate" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <form class="auth-panel" data-login>
            <span class="eyebrow">CAMPUS STORES · DEMO ACCESS</span>
            <h2 id="auth-title">Sign in to the desk</h2>
            <p>This prototype uses a simulated staff identity. Choose a role to explore permissions; no password or external account is connected.</p>
            <label><span>Staff name</span><select name="name" required><option value="">Choose a demo user</option>${opts([["Aarav Mehta","Aarav Mehta"],["Priya Nair","Priya Nair"],["Desk Observer","Desk Observer"]])}</select></label>
            <label><span>Access role</span><select name="role" required><option value="">Choose access level</option>${opts([["Desk staff","Desk staff · issue and return equipment"],["Supervisor","Supervisor · full demo access"],["Read-only viewer","Read-only · view records only"]])}</select></label>
            <button type="submit" class="primary">Continue to desk</button>
            <small>Demo only · This is not production authentication or a security boundary.</small>
          </form></section>`);
        gate = q(".auth-gate");
      }
      gate.hidden = false;
    } else if (gate) gate.hidden = true;
    let inspection = q(".return-inspection");
    if (returningLoan !== null) {
      const loan = s.loans.find((item) => item.num === Number(returningLoan));
      if (loan) {
        const asset = getAsset(loan.asset);
        if (!inspection) {
          root.insertAdjacentHTML("beforeend", `<section class="return-inspection" role="dialog" aria-modal="true" aria-labelledby="inspection-title"></section>`);
          inspection = q(".return-inspection");
        }
        inspection.innerHTML = `<form class="inspection-panel" data-inspection>
          <span class="eyebrow">RETURN DESK · L-${loan.num}</span><h2 id="inspection-title">Inspect returned equipment</h2>
          <p><strong>${esc(loan.asset)} · ${esc(asset ? asset.type : "Equipment")}</strong><br>${esc(asset ? asset.model : "")}</p>
          <label><span>Physical inspection result</span><select name="condition" required>
            <option value="">Choose condition…</option><option value="Good">Good · Ready for next issue</option>
            <option value="Damaged">Damaged · Remove from circulation</option><option value="Missing">Missing · Item not physically received</option>
          </select></label>
          <label><span>Inspection note (optional)</span><textarea name="inspectionNote" rows="2" maxlength="300" placeholder="Describe visible damage or missing parts"></textarea></label>
          <div class="inspection-actions"><button type="button" data-action="cancel-inspection">Cancel</button><button type="submit" class="primary">Save inspection</button></div>
          <small>Choosing “Missing” records an exception and keeps the loan open.</small>
        </form>`;
        inspection.hidden = false;
      }
    } else if (inspection) inspection.remove();
  }

  function commit(message) {
    if (message) s.notice = message;
    paint();
    try {
      localStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      q("[data-status]").textContent += " Browser storage is unavailable. Progress lasts for this visit.";
    }
  }

  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const value = button.dataset.val;
    const action = button.dataset.action;
    if (action === "signout") { session = null; paint(); return; }
    if (!can(action)) {
      q("[data-status]").textContent = "This action is not available for your current demo role.";
      return;
    }
    switch (action) {
      case "export": {
        const columns = ["Record type", "Loan slip", "Request", "Asset ID", "Asset type", "Borrower", "Due", "Loan status", "Return condition", "Inspection note", "Custody holder (reported)", "Custody verified", "Event", "Actor", "Event time", "Details", "Verification"];
        const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
        const rows = [];
        s.loans.forEach((loan) => {
          const asset = getAsset(loan.asset);
          const events = s.activity.filter((event) => event.loan === loan.num);
          if (!events.length) events.push({ action: "Loan record", actor: "Existing register", time: "", details: "No activity detail available", verification: "recorded" });
          events.forEach((event) => rows.push([
            "Loan activity", `L-${loan.num}`, loan.req, loan.asset, asset?.type || "", loan.who, loan.due,
            loan.back ? "Returned" : "Outstanding", loan.returnCondition || "Not inspected", loan.inspectionNote || "", loan.custodyReport?.holder || "",
            loan.custodyReport ? (loan.custodyReport.verified ? "Yes" : "No") : "Not applicable",
            event.action, event.actor, event.time, event.details, event.verification
          ]));
        });
        const csv = [columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
        const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "campus-stores-audit-report.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        s.notice = "Audit report exported with loan records and recorded activity.";
        break;
      }
      case "restart": s = original(); break;
      case "advance":
        if (s.phase < 2) {
          s.phase++;
          s.handoverReviewed = false;
          if (s.phase === 1) {
            const adapterLoan = s.loans.find((loan) => loan.req === "RQ-214" &&
              !loan.back && getAsset(loan.asset)?.type === "USB-C → HDMI adapter");
            if (adapterLoan && !adapterLoan.custodyReport) {
              adapterLoan.custodyReport = {
                holder: "Leela Das",
                expectedReturn: "Saturday · 9:00 am",
                reportedBy: "Kabir Sen",
                reportedAt: shifts[1].time,
                verified: false
              };
              addActivity(adapterLoan, "Custody update reported", "Kabir Sen",
                "Leela Das is reported to have the adapter; expected at Saturday 9:00 am.",
                "unverified");
            }
          }
          s.notice = "Shift time updated. Handover refreshed from the live loan register.";
        }
        break;
      case "tab": s.tab = value; s.editing = false; break;
      case "close": s.selected = ""; break;
      case "request": s.selected = value; break;
      case "new": s.editing = true; break;
      case "cancel": s.editing = false; break;
      case "scope": s.onlyOpen = value === "0"; break;
      case "ack":
        s.handoverReviewed = true;
        s.notice = "Handover review acknowledged. Outstanding loans remain open until returned.";
        break;
      case "return": {
        const loan = s.loans.find((item) => item.num === Number(value));
        if (!loan || loan.back) return;
        returningLoan = loan.num;
        paint();
        return;
      }
      case "cancel-inspection": returningLoan = null; break;
    }
    commit();
  });

  root.addEventListener("change", (event) => {
    if (event.target.matches("[data-filter]")) {
      s.filter = event.target.value;
      commit();
    }
  });

  root.addEventListener("submit", (event) => {
    event.preventDefault();
    const formElement = event.target;
    const form = new FormData(formElement);
    if (formElement.matches("[data-login]")) {
      const name = String(form.get("name") || "");
      const role = String(form.get("role") || "");
      if (!name || !role || !rolePermissions[role]) return;
      session = { name, role };
      paint();
      return;
    }
    if (!session) {
      q("[data-status]").textContent = "Please sign in before changing desk records.";
      return;
    }
    if (formElement.matches("[data-inspection]")) {
      if (!can("return")) { q("[data-status]").textContent = "Your role cannot inspect returns."; return; }
      const loan = s.loans.find((item) => item.num === Number(returningLoan));
      const condition = String(form.get("condition") || "");
      const note = String(form.get("inspectionNote") || "").trim();
      if (!loan || loan.back || !["Good", "Damaged", "Missing"].includes(condition)) return;
      const actor = session.name;
      if (condition === "Missing") {
        addActivity(loan, "Return exception · item not received", actor,
          `${loan.asset} was marked missing. ${note || "No additional note."}`, "exception");
        s.notice = `${loan.asset} marked missing. Loan L-${loan.num} remains open for follow-up.`;
      } else {
        loan.back = true;
        loan.returnCondition = condition;
        loan.inspectionNote = note;
        if (loan.custodyReport) loan.custodyReport.verified = true;
        const asset = getAsset(loan.asset);
        if (condition === "Damaged" && asset) { asset.repair = true; asset.conditionNote = note || "Flagged damaged during return inspection."; s.assetConditions = s.assetConditions || {}; s.assetConditions[asset.id] = { condition: "Damaged", note: asset.conditionNote }; }
        addActivity(loan, `Physical return inspected · ${condition}`, actor,
          `${loan.asset} checked in${condition === "Damaged" ? " and removed from circulation for repair" : ""}. ${note}`.trim(), "physically-verified");
        s.notice = condition === "Damaged"
          ? `${loan.asset} returned damaged and marked unavailable for repair. Slip L-${loan.num} closed.`
          : `${loan.asset} inspected in good condition. Slip L-${loan.num} closed.`;
      }
      returningLoan = null;
      commit();
      return;
    }
    if (formElement.matches("[data-note]")) {
      if (!can("note")) { q("[data-status]").textContent = "Your role is read-only."; return; }
      const note = String(form.get("note") || "").trim();
      if (!note) return;
      s.notes.push({ phase: s.phase, text: note });
      commit("Handover note saved.");
      return;
    }
    if (!formElement.matches("[data-issue]")) return;
    if (!can("issue")) { q("[data-status]").textContent = "Your role cannot issue equipment."; return; }
    const [req, asset, who, due] = ["req", "asset", "who", "due"].map((key) => form.get(key));
    const unit = getAsset(asset), request = getReq(req);
    if (!request || !unit || unit.repair || out(asset) || !people.includes(who)) return;
    if (!request.items.includes(unit.type)) {
      q("[data-status]").textContent = "This equipment type is outside the approved request. Choose an approved unit.";
      return;
    }
    const alreadyIssued = s.loans.some((loan) =>
      loan.req === req && !loan.back && getAsset(loan.asset).type === unit.type
    );
    if (alreadyIssued) {
      q("[data-status]").textContent = "The approved quantity of this equipment type is already on loan.";
      return;
    }
    const num = Math.max(0, ...s.loans.map((loan) => loan.num)) + 1;
    const newLoan = { num, req, asset, who, due, back: false };
    s.loans.push(newLoan);
    addActivity(newLoan, "Equipment issued", session.name,
      `${asset} issued to ${who} under ${req}.`);
    addActivity(newLoan, "Equipment issued", session.name,
  `    ${asset} issued to ${who} under ${req}.`);
    s.editing = false;
    commit(`Issued ${asset} to ${who} on slip L-${num}.`);
  });

  function restore(data) {
    if (!data || ![1, 2, 3].includes(data.version) || !Object.hasOwn(screens, data.tab) ||
        !shifts[data.phase] || (data.selected && !getReq(data.selected)) ||
        !Array.isArray(data.notes) || !data.notes.every((n) =>
          n && shifts[n.phase] && typeof n.text === "string") ||
        !Array.isArray(data.loans) || !data.loans.length ||
        !data.loans.every((l) => l && getReq(l.req) && getAsset(l.asset) && Number.isInteger(l.num))) return;
    s = {
      ...original(), ...data, version: 3,
      handoverReviewed: Boolean(data.handoverReviewed),
      activity: Array.isArray(data.activity) ? data.activity.map((event) => ({ ...event })) : [],
      loans: data.loans.map((loan) => ({ ...loan })),
      assetConditions: data.assetConditions && typeof data.assetConditions === "object" ? { ...data.assetConditions } : {},
      notes: data.notes.map((note) => ({ ...note }))
    };
    Object.entries(s.assetConditions || {}).forEach(([assetId, condition]) => {
      const asset = getAsset(assetId);
      if (asset && condition?.condition === "Damaged") {
        asset.repair = true;
        asset.conditionNote = condition.note || "Flagged damaged during return inspection.";
      }
    });
    if (!s.activity.length) {
      s.loans.forEach((loan) => s.activity.push({
        id: `migration-${loan.num}`, loan: loan.num, asset: loan.asset,
        phase: 0, time: shifts[0].time, action: loan.back ? "Historical loan record" : "Equipment issued",
        actor: "Existing register", details: `${loan.asset} recorded for ${loan.who} under ${loan.req}.`,
        verification: "migrated"
      }));
    }
    paint();
    return true;
  }

  paint();
  try {
    for (const key of [storageKey, "campus-stores.shift.v2", "campus-stores.shift.v1"]) {
      const saved = localStorage.getItem(key);
      if (!saved) continue;
      let data;
      try { data = JSON.parse(saved); } catch { continue; }
      if (restore(data)) {
        if (key !== storageKey) localStorage.setItem(storageKey, JSON.stringify(s));
        break;
      }
    }
  } catch {
    // Keep the fresh shift when storage is unavailable.
  }
})();
