"use client";

import { useEffect, useState } from "react";
import { CompanyDTO, ProductDTO } from "@/lib/types";
import { fmtPrice } from "@/lib/format";
import { ItemNameAutocomplete } from "@/components/ItemNameAutocomplete";

type EditDraft = {
  name: string;
  itemCode: string;
  priceMin: number | "";
  priceMax: number | "";
};

export default function ProductsPage() {
  const [company, setCompany] = useState<CompanyDTO | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>({
    name: "",
    itemCode: "",
    priceMin: "",
    priceMax: "",
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetch("/api/company")
      .then((r) => r.json())
      .then(setCompany);
  }, []);

  function updateProductLocal(product: ProductDTO) {
    setCompany((c) =>
      c ? { ...c, products: c.products.map((p) => (p.id === product.id ? product : p)) } : c
    );
  }

  async function patchCompanyField(field: "name" | "alertEmail", value: string) {
    setCompany((c) => (c ? { ...c, [field]: value } : c));
  }

  async function commitCompanyField(field: "name" | "alertEmail", value: string) {
    await fetch("/api/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

  function openAddForm() {
    setNewName("");
    setIsAddingNew(true);
  }

  function cancelAddForm() {
    setIsAddingNew(false);
  }

  async function submitNewProduct() {
    const name = newName.trim();
    if (!name) return;

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const product: ProductDTO = await res.json();
    setCompany((c) => (c ? { ...c, products: [...c.products, product] } : c));
    setIsAddingNew(false);
  }

  function startEdit(p: ProductDTO) {
    setEditingProductId(p.id);
    setEditDraft({
      name: p.name,
      itemCode: p.itemCode ?? "",
      priceMin: p.priceMin ?? "",
      priceMax: p.priceMax ?? "",
    });
  }

  function cancelEdit() {
    setEditingProductId(null);
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editDraft.name,
        itemCode: editDraft.itemCode || null,
        priceMin: editDraft.priceMin === "" ? null : Number(editDraft.priceMin),
        priceMax: editDraft.priceMax === "" ? null : Number(editDraft.priceMax),
      }),
    });
    const product: ProductDTO = await res.json();
    updateProductLocal(product);
    setEditingProductId(null);
  }

  async function removeProduct(id: string) {
    setCompany((c) => (c ? { ...c, products: c.products.filter((p) => p.id !== id) } : c));
    await fetch(`/api/products/${id}`, { method: "DELETE" });
  }

  if (!company) {
    return <div className="px-9 pt-8 pb-12 text-text-muted text-[13px]">불러오는 중…</div>;
  }

  return (
    <div className="px-9 pt-8 pb-12">
      <h1 className="text-[21px] font-bold mb-[22px] tracking-[-0.01em]">My Page</h1>

      <div className="text-[13px] font-bold text-text-secondary-2 mb-[10px]">내 회사 정보</div>
      <div className="bg-surface border border-border rounded-xl px-6 py-5 mb-6 flex gap-6 flex-wrap">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-text-muted">회사명</span>
          <input
            value={company.name}
            onChange={(e) => patchCompanyField("name", e.target.value)}
            onBlur={(e) => commitCompanyField("name", e.target.value)}
            className="border border-border rounded-[7px] px-[11px] py-2 text-[13.5px] font-semibold w-[220px]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-text-muted">알림 이메일</span>
          <input
            value={company.alertEmail ?? ""}
            onChange={(e) => patchCompanyField("alertEmail", e.target.value)}
            onBlur={(e) => commitCompanyField("alertEmail", e.target.value)}
            className="border border-border rounded-[7px] px-[11px] py-2 text-[13.5px] w-[260px]"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-[10px]">
        <div className="text-[13px] font-bold text-text-secondary-2">등록 제품</div>
        {!isAddingNew && (
          <button
            onClick={openAddForm}
            className="border border-brand bg-brand text-white text-[12.5px] font-semibold px-[14px] py-2 rounded-lg cursor-pointer"
          >
            + 제품 추가
          </button>
        )}
      </div>

      <div className="bg-surface border border-border rounded-xl px-6 py-1">
        {isAddingNew && (
          <div className="py-[14px] flex flex-wrap gap-2 items-center border-b border-border-hairline">
            <ItemNameAutocomplete
              value={newName}
              onChange={setNewName}
              onSelect={(entry) => setNewName(entry.name)}
              onEnter={submitNewProduct}
              placeholder="제품명 (나라장터 등록 품명 자동완성)"
              className="border border-border rounded-[6px] px-[10px] py-[7px] text-[13px] flex-1 min-w-[220px]"
            />
            <button
              onClick={submitNewProduct}
              disabled={!newName.trim()}
              className="border-none bg-brand text-white text-[12.5px] font-semibold px-3 py-[7px] rounded-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              저장
            </button>
            <button
              onClick={cancelAddForm}
              className="border border-border bg-surface text-text-tertiary text-[12.5px] font-semibold px-3 py-[7px] rounded-md cursor-pointer"
            >
              취소
            </button>
          </div>
        )}

        {company.products.length === 0 && !isAddingNew && (
          <div className="py-10 text-center flex flex-col items-center gap-2.5">
            <div className="text-[13.5px] text-text-tertiary">아직 등록된 제품이 없습니다.</div>
            <div className="text-[12.5px] text-text-muted">
              제품명을 등록하면 매칭되는 공고를 자동으로 모아드려요.
            </div>
            <button
              onClick={openAddForm}
              className="mt-1.5 border-none bg-brand text-white text-[13px] font-semibold px-4 py-[9px] rounded-lg cursor-pointer"
            >
              첫 제품 등록하기
            </button>
          </div>
        )}

        {company.products.map((product) => (
          <div key={product.id} className="border-t border-border-hairline py-[14px] first:border-t-0">
            {editingProductId === product.id ? (
              <div className="flex flex-wrap gap-2 items-center">
                <ItemNameAutocomplete
                  value={editDraft.name}
                  onChange={(v) => setEditDraft((d) => ({ ...d, name: v }))}
                  onSelect={(entry) =>
                    setEditDraft((d) => ({
                      ...d,
                      name: entry.name,
                      itemCode: entry.code ?? d.itemCode,
                    }))
                  }
                  placeholder="제품명 (나라장터 등록 품명 자동완성)"
                  className="border border-border rounded-[6px] px-[10px] py-[7px] text-[13px] w-[220px]"
                />
                <input
                  value={editDraft.itemCode}
                  onChange={(e) => setEditDraft((d) => ({ ...d, itemCode: e.target.value }))}
                  placeholder="품목코드"
                  className="border border-border rounded-[6px] px-[10px] py-[7px] text-[13px] w-[110px]"
                />
                <input
                  type="number"
                  value={editDraft.priceMin}
                  onChange={(e) =>
                    setEditDraft((d) => ({
                      ...d,
                      priceMin: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  placeholder="최소가격"
                  className="border border-border rounded-[6px] px-[10px] py-[7px] text-[13px] w-[130px]"
                />
                <input
                  type="number"
                  value={editDraft.priceMax}
                  onChange={(e) =>
                    setEditDraft((d) => ({
                      ...d,
                      priceMax: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  placeholder="최대가격"
                  className="border border-border rounded-[6px] px-[10px] py-[7px] text-[13px] w-[130px]"
                />
                <button
                  onClick={() => saveEdit(product.id)}
                  className="border-none bg-brand text-white text-[12.5px] font-semibold px-3 py-[7px] rounded-md cursor-pointer"
                >
                  저장
                </button>
                <button
                  onClick={cancelEdit}
                  className="border border-border bg-surface text-text-tertiary text-[12.5px] font-semibold px-3 py-[7px] rounded-md cursor-pointer"
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="text-[13.5px] font-semibold">{product.name}</span>
                  <span className="text-xs text-text-muted">품목코드 {product.itemCode ?? "—"}</span>
                  <span className="text-xs text-text-muted">
                    관심가격{" "}
                    {product.priceMin || product.priceMax
                      ? `${fmtPrice(product.priceMin)} ~ ${fmtPrice(product.priceMax)}`
                      : "미설정"}
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(product)}
                    className="border border-border bg-surface text-text-secondary-2 text-xs font-semibold px-2.5 py-1.5 rounded-md cursor-pointer"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => removeProduct(product.id)}
                    className="border border-urgent-border bg-surface text-urgent text-xs font-semibold px-2.5 py-1.5 rounded-md cursor-pointer"
                  >
                    삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
