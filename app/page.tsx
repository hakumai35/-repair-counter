"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Item = { id: string; name: string; count: number };
type NameDialog = { mode: "add" } | { mode: "edit"; id: string } | null;

const STORAGE_KEY = "repair-counter-state-v1";
const DEFAULT_ITEMS: Item[] = [
  { id: "frame", name: "枠", count: 0 },
  { id: "floor", name: "床", count: 0 },
];
const clamp = (n: number) => Math.max(0, Math.min(99999, Math.floor(Number.isFinite(n) ? n : 0)));
const newId = () => typeof crypto !== "undefined" && "randomUUID" in crypto
  ? crypto.randomUUID()
  : `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function Home() {
  const [items, setItems] = useState<Item[]>(DEFAULT_ITEMS);
  const [ready, setReady] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [countId, setCountId] = useState<string | null>(null);
  const [countDraft, setCountDraft] = useState("0");
  const [nameDialog, setNameDialog] = useState<NameDialog>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [toast, setToast] = useState("");
  const countInput = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const safe = parsed.filter((v): v is Item => Boolean(
            v && typeof v === "object" && typeof v.id === "string" &&
            typeof v.name === "string" && v.name.trim() && typeof v.count === "number"
          )).map(v => ({ id: v.id, name: v.name.trim().slice(0, 30), count: clamp(v.count) }));
          setItems(safe);
        }
      }
    } catch { /* use defaults */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* storage optional */ }
  }, [items, ready]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (countId) window.setTimeout(() => { countInput.current?.focus(); countInput.current?.select(); }, 80);
  }, [countId]);

  useEffect(() => {
    if (nameDialog) window.setTimeout(() => nameInput.current?.focus(), 80);
  }, [nameDialog]);

  const total = useMemo(() => items.reduce((sum, item) => sum + item.count, 0), [items]);
  const report = useMemo(() => [
    ...items.filter(i => i.count > 0).map(i => `${i.name}${i.count}箇所`),
    `合計${total}箇所`,
  ].join("、"), [items, total]);
  const countItem = items.find(i => i.id === countId) ?? null;

  const buzz = (ms = 12) => { if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms); };
  const changeCount = (id: string, delta: number) => {
    buzz();
    setItems(current => current.map(i => i.id === id ? { ...i, count: clamp(i.count + delta) } : i));
  };
  const openCount = (item: Item) => { setCountId(item.id); setCountDraft(String(item.count)); };
  const saveCount = (e: FormEvent) => {
    e.preventDefault();
    if (!countId || countDraft === "") return;
    setItems(current => current.map(i => i.id === countId ? { ...i, count: clamp(Number(countDraft)) } : i));
    buzz(18); setCountId(null);
  };
  const openAdd = () => { setNameDraft(""); setNameError(""); setNameDialog({ mode: "add" }); };
  const openEdit = (item: Item) => { setNameDraft(item.name); setNameError(""); setNameDialog({ mode: "edit", id: item.id }); };
  const saveName = (e: FormEvent) => {
    e.preventDefault();
    if (!nameDialog) return;
    const name = nameDraft.trim().replace(/\s+/g, " ").slice(0, 30);
    if (!name) return setNameError("項目名を入力してください");
    const duplicate = items.some(i => i.name.toLocaleLowerCase("ja") === name.toLocaleLowerCase("ja") && (nameDialog.mode === "add" || i.id !== nameDialog.id));
    if (duplicate) return setNameError("同じ名前の項目があります");
    if (nameDialog.mode === "add") {
      setItems(current => [...current, { id: newId(), name, count: 0 }]);
      setToast("項目を追加しました");
    } else {
      setItems(current => current.map(i => i.id === nameDialog.id ? { ...i, name } : i));
      setToast("項目名を変更しました");
    }
    setNameDialog(null);
  };
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    setItems(current => { const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });
    buzz();
  };
  const remove = () => {
    if (!deleteTarget) return;
    setItems(current => current.filter(i => i.id !== deleteTarget.id));
    setDeleteTarget(null); setToast("項目を削除しました");
  };
  const reset = () => {
    setItems(current => current.map(i => ({ ...i, count: 0 })));
    setResetOpen(false); buzz(24); setToast("カウントをリセットしました");
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(report); }
    catch {
      const el = document.createElement("textarea"); el.value = report; el.style.position = "fixed"; el.style.opacity = "0";
      document.body.appendChild(el); el.select(); document.execCommand("copy"); el.remove();
    }
    buzz(18); setToast("コピーしました");
  };

  return <main className="app-shell">
    <header className="topbar">
      <div><p className="eyebrow">現場作業ツール</p><h1>補修カウンター</h1></div>
      <button className="manage-button" type="button" onClick={() => setManageOpen(true)} aria-label="項目管理を開く"><span>⚙</span>項目管理</button>
    </header>

    <section className="total-banner" aria-live="polite"><span>本日の合計</span><strong>{total.toLocaleString("ja-JP")}<small>箇所</small></strong></section>

    <section className="counter-list" aria-label="補修箇所カウンター">
      {items.length === 0 ? <div className="empty-state"><span>＋</span><h2>項目がありません</h2><p>下のボタンから補修項目を追加してください。</p></div> : items.map(item =>
        <article className="counter-card" key={item.id}>
          <h2>{item.name}</h2>
          <div className="counter-controls">
            <button className="count-button minus" type="button" onClick={() => changeCount(item.id, -1)} disabled={item.count === 0} aria-label={`${item.name}を1減らす`}>−</button>
            <button className="number-button" type="button" onClick={() => openCount(item)} aria-label={`${item.name}の数量 ${item.count}。タップして直接入力`}><span className="number-value" key={`${item.id}-${item.count}`}>{item.count.toLocaleString("ja-JP")}</span><small>タップで入力</small></button>
            <button className="count-button plus" type="button" onClick={() => changeCount(item.id, 1)} disabled={item.count >= 99999} aria-label={`${item.name}を1増やす`}>＋</button>
          </div>
        </article>)}
    </section>

    <section className="utility-actions">
      <button className="add-button" type="button" onClick={openAdd}><span>＋</span>項目を追加</button>
      <button className="reset-button" type="button" onClick={() => setResetOpen(true)} disabled={total === 0}>本日のカウントをリセット</button>
    </section>

    <section className="report-dock" aria-labelledby="report-title"><div className="report-copy"><p id="report-title">報告文</p><p className="report-text" aria-live="polite">{report}</p></div><button className="copy-button" type="button" onClick={copy}><span>▣</span>コピー</button></section>

    {manageOpen && <div className="full-screen-panel" role="dialog" aria-modal="true" aria-labelledby="manage-title">
      <header className="panel-header"><div><p className="eyebrow">設定</p><h2 id="manage-title">項目管理</h2></div><button className="close-button" type="button" onClick={() => setManageOpen(false)} aria-label="項目管理を閉じる">×</button></header>
      <div className="panel-content"><p className="panel-note">並び替え・名前の変更・削除ができます。</p><div className="manage-list">{items.map((item, index) => <article className="manage-row" key={item.id}>
        <div className="manage-name"><span>{index + 1}</span><div><strong>{item.name}</strong><small>{item.count}箇所</small></div></div>
        <div className="manage-actions"><button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`${item.name}を上へ移動`}>↑</button><button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={`${item.name}を下へ移動`}>↓</button><button type="button" onClick={() => openEdit(item)}>編集</button><button type="button" className="delete-button" onClick={() => setDeleteTarget(item)}>削除</button></div>
      </article>)}</div><button className="add-button panel-add" type="button" onClick={openAdd}><span>＋</span>新しい項目を追加</button></div>
    </div>}

    {countItem && <div className="modal-backdrop" onMouseDown={() => setCountId(null)}><form className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="count-title" onSubmit={saveCount} onMouseDown={e => e.stopPropagation()}>
      <div className="sheet-handle"/><p className="sheet-label">数量を直接入力</p><h2 id="count-title">{countItem.name}</h2><div className="number-input-wrap"><input ref={countInput} type="number" inputMode="numeric" min="0" max="99999" value={countDraft} onChange={e => setCountDraft(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}/><span>箇所</span></div><div className="quick-values">{[0,1,5,10,20].map(n => <button type="button" key={n} onClick={() => setCountDraft(String(n))}>{n}</button>)}</div><div className="dialog-actions"><button className="secondary-button" type="button" onClick={() => setCountId(null)}>キャンセル</button><button className="primary-button" disabled={countDraft === ""}>この数量に変更</button></div>
    </form></div>}

    {nameDialog && <div className="modal-backdrop" onMouseDown={() => setNameDialog(null)}><form className="bottom-sheet name-sheet" role="dialog" aria-modal="true" aria-labelledby="name-title" onSubmit={saveName} onMouseDown={e => e.stopPropagation()}>
      <div className="sheet-handle"/><p className="sheet-label">{nameDialog.mode === "add" ? "新しい補修項目" : "項目名を変更"}</p><h2 id="name-title">{nameDialog.mode === "add" ? "項目を追加" : "項目を編集"}</h2><label className="text-field"><span>項目名</span><input ref={nameInput} maxLength={30} value={nameDraft} onChange={e => { setNameDraft(e.target.value); setNameError(""); }} placeholder="例：巾木、建具、ドア" autoComplete="off"/></label>{nameError && <p className="field-error" role="alert">{nameError}</p>}{nameDialog.mode === "add" && <div className="suggestions">{["巾木","建具","ドア","サッシ","カウンター","その他"].map(name => <button type="button" key={name} onClick={() => setNameDraft(name)}>{name}</button>)}</div>}<div className="dialog-actions"><button className="secondary-button" type="button" onClick={() => setNameDialog(null)}>キャンセル</button><button className="primary-button">{nameDialog.mode === "add" ? "追加する" : "変更する"}</button></div>
    </form></div>}

    {resetOpen && <Confirm title="本日のカウントをリセットしますか？" description="登録した項目は残し、すべての数量だけを0に戻します。" label="0に戻す" onCancel={() => setResetOpen(false)} onConfirm={reset}/>} 
    {deleteTarget && <Confirm title={`「${deleteTarget.name}」を削除しますか？`} description="この項目と現在の数量が削除されます。" label="削除する" destructive onCancel={() => setDeleteTarget(null)} onConfirm={remove}/>} 
    {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
  </main>;
}

function Confirm({ title, description, label, destructive = false, onCancel, onConfirm }: { title: string; description: string; label: string; destructive?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-backdrop" onMouseDown={onCancel}><div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={e => e.stopPropagation()}><div className={`confirm-icon ${destructive ? "destructive" : "warning"}`}>{destructive ? "×" : "↺"}</div><h2 id="confirm-title">{title}</h2><p>{description}</p><div className="dialog-actions"><button className="secondary-button" type="button" onClick={onCancel}>キャンセル</button><button className={destructive ? "danger-confirm-button" : "primary-button"} type="button" onClick={onConfirm}>{label}</button></div></div></div>;
}
