"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";

function clean(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function cleanRequired(value: FormDataEntryValue | null, field: string) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${field} is required`);
  return text;
}

function toBool(value: FormDataEntryValue | null) {
  return String(value ?? "") === "true";
}

function toInt(value: FormDataEntryValue | null, fallback: number) {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function revalidateScopePaths(scopeId?: string) {
  revalidatePath("/admin/naesin/scopes");
  if (scopeId) {
    revalidatePath(`/admin/naesin/scopes/${scopeId}`);
    revalidatePath(`/admin/naesin/scopes/${scopeId}/edit`);
  }
}

type ScopeItemOrderRow = {
  id: string;
  scope_id: string;
  sort_order: number;
  created_at: string | null;
};

type NaesinScopeRow = {
  id: string;
  school_level: string;
  school_name: string;
  academic_year: number;
  grade: string;
  semester: string;
  exam_type: string;
  title: string;
  memo: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean | null;
};

type NaesinScopeItemRow = {
  item_type: string;
  title: string;
  body: string | null;
  sort_order: number;
  is_active: boolean | null;
};

async function normalizeScopeItemOrder(scopeId: string) {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase
    .from("naesin_exam_scope_items")
    .select("id, scope_id, sort_order, created_at")
    .eq("scope_id", scopeId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as ScopeItemOrderRow[];

  await Promise.all(
    rows.map((row, index) =>
      supabase
        .from("naesin_exam_scope_items")
        .update({
          sort_order: index * 10,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id),
    ),
  );
}

export async function createNaesinScopeAction(formData: FormData): Promise<void> {
  const supabase = await getServerSupabase();

  const payload = {
    school_level: cleanRequired(formData.get("school_level"), "school_level"),
    school_name: cleanRequired(formData.get("school_name"), "school_name"),
    academic_year: toInt(formData.get("academic_year"), new Date().getFullYear()),
    grade: cleanRequired(formData.get("grade"), "grade"),
    semester: cleanRequired(formData.get("semester"), "semester"),
    exam_type: cleanRequired(formData.get("exam_type"), "exam_type"),

    title: cleanRequired(formData.get("title"), "title"),
    memo: clean(formData.get("memo")),

    start_date: clean(formData.get("start_date")),
    end_date: clean(formData.get("end_date")),

    is_active: toBool(formData.get("is_active")),
  };

  const { error } = await supabase.from("naesin_exam_scopes").insert(payload);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/naesin/scopes");
  redirect("/admin/naesin/scopes");
}

export async function updateNaesinScopeAction(formData: FormData): Promise<void> {
  const supabase = await getServerSupabase();

  const id = cleanRequired(formData.get("id"), "id");

  const payload = {
    school_level: cleanRequired(formData.get("school_level"), "school_level"),
    school_name: cleanRequired(formData.get("school_name"), "school_name"),
    academic_year: toInt(formData.get("academic_year"), new Date().getFullYear()),
    grade: cleanRequired(formData.get("grade"), "grade"),
    semester: cleanRequired(formData.get("semester"), "semester"),
    exam_type: cleanRequired(formData.get("exam_type"), "exam_type"),

    title: cleanRequired(formData.get("title"), "title"),
    memo: clean(formData.get("memo")),

    start_date: clean(formData.get("start_date")),
    end_date: clean(formData.get("end_date")),

    is_active: toBool(formData.get("is_active")),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("naesin_exam_scopes")
    .update(payload)
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidateScopePaths(id);
  redirect(`/admin/naesin/scopes/${id}`);
}

export async function toggleNaesinScopeActiveAction(
  formData: FormData,
): Promise<void> {
  const supabase = await getServerSupabase();

  const id = cleanRequired(formData.get("id"), "id");
  const isActive = toBool(formData.get("is_active"));

  const { error } = await supabase
    .from("naesin_exam_scopes")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidateScopePaths(id);
}

export async function deleteNaesinScopeAction(formData: FormData): Promise<void> {
  const supabase = await getServerSupabase();

  const id = cleanRequired(formData.get("id"), "id");

  const { error } = await supabase
    .from("naesin_exam_scopes")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/naesin/scopes");
  redirect("/admin/naesin/scopes");
}

export async function duplicateNaesinScopeAction(formData: FormData): Promise<void> {
  const supabase = await getServerSupabase();

  const id = cleanRequired(formData.get("id"), "id");

  const { data: scope, error: scopeError } = await supabase
    .from("naesin_exam_scopes")
    .select(
      "id, school_level, school_name, academic_year, grade, semester, exam_type, title, memo, start_date, end_date, is_active",
    )
    .eq("id", id)
    .maybeSingle();

  if (scopeError) throw new Error(scopeError.message);
  if (!scope) throw new Error("scope not found");

  const original = scope as NaesinScopeRow;

  const { data: insertedScopes, error: insertScopeError } = await supabase
    .from("naesin_exam_scopes")
    .insert({
      school_level: original.school_level,
      school_name: original.school_name,
      academic_year: original.academic_year,
      grade: original.grade,
      semester: original.semester,
      exam_type: original.exam_type,
      title: `${original.title} 복사본`,
      memo: original.memo,
      start_date: original.start_date,
      end_date: original.end_date,
      is_active: false,
    })
    .select("id")
    .single();

  if (insertScopeError) throw new Error(insertScopeError.message);
  if (!insertedScopes?.id) throw new Error("duplicated scope creation failed");

  const newScopeId = insertedScopes.id as string;

  const { data: items, error: itemsError } = await supabase
    .from("naesin_exam_scope_items")
    .select("item_type, title, body, sort_order, is_active")
    .eq("scope_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (itemsError) throw new Error(itemsError.message);

  const originalItems = (items ?? []) as NaesinScopeItemRow[];

  if (originalItems.length > 0) {
    const duplicatedItems = originalItems.map((item) => ({
      scope_id: newScopeId,
      item_type: item.item_type,
      title: item.title,
      body: item.body,
      sort_order: item.sort_order,
      is_active: item.is_active ?? true,
    }));

    const { error: insertItemsError } = await supabase
      .from("naesin_exam_scope_items")
      .insert(duplicatedItems);

    if (insertItemsError) throw new Error(insertItemsError.message);

    await normalizeScopeItemOrder(newScopeId);
  }

  revalidatePath("/admin/naesin/scopes");
  revalidateScopePaths(id);
  revalidateScopePaths(newScopeId);

  redirect(`/admin/naesin/scopes/${newScopeId}`);
}

export async function createNaesinScopeItemAction(formData: FormData): Promise<void> {
  const supabase = await getServerSupabase();

  const scopeId = cleanRequired(formData.get("scope_id"), "scope_id");

  const payload = {
    scope_id: scopeId,
    item_type: cleanRequired(formData.get("item_type"), "item_type"),
    title: cleanRequired(formData.get("title"), "title"),
    body: clean(formData.get("body")),
    sort_order: toInt(formData.get("sort_order"), 0),
    is_active: toBool(formData.get("is_active")),
  };

  const { error } = await supabase.from("naesin_exam_scope_items").insert(payload);
  if (error) throw new Error(error.message);

  await normalizeScopeItemOrder(scopeId);
  revalidateScopePaths(scopeId);
}

export async function updateNaesinScopeItemAction(formData: FormData): Promise<void> {
  const supabase = await getServerSupabase();

  const id = cleanRequired(formData.get("id"), "id");
  const scopeId = cleanRequired(formData.get("scope_id"), "scope_id");

  const payload = {
    item_type: cleanRequired(formData.get("item_type"), "item_type"),
    title: cleanRequired(formData.get("title"), "title"),
    body: clean(formData.get("body")),
    sort_order: toInt(formData.get("sort_order"), 0),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("naesin_exam_scope_items")
    .update(payload)
    .eq("id", id);

  if (error) throw new Error(error.message);

  await normalizeScopeItemOrder(scopeId);
  revalidateScopePaths(scopeId);
}

export async function deleteNaesinScopeItemAction(formData: FormData): Promise<void> {
  const supabase = await getServerSupabase();

  const id = cleanRequired(formData.get("id"), "id");
  const scopeId = cleanRequired(formData.get("scope_id"), "scope_id");

  const { error } = await supabase
    .from("naesin_exam_scope_items")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  await normalizeScopeItemOrder(scopeId);
  revalidateScopePaths(scopeId);
}

export async function toggleNaesinScopeItemActiveAction(
  formData: FormData,
): Promise<void> {
  const supabase = await getServerSupabase();

  const id = cleanRequired(formData.get("id"), "id");
  const scopeId = cleanRequired(formData.get("scope_id"), "scope_id");
  const isActive = toBool(formData.get("is_active"));

  const { error } = await supabase
    .from("naesin_exam_scope_items")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidateScopePaths(scopeId);
}

export async function moveNaesinScopeItemAction(formData: FormData): Promise<void> {
  const supabase = await getServerSupabase();

  const id = cleanRequired(formData.get("id"), "id");
  const scopeId = cleanRequired(formData.get("scope_id"), "scope_id");
  const direction = cleanRequired(formData.get("direction"), "direction");

  const { data, error } = await supabase
    .from("naesin_exam_scope_items")
    .select("id, scope_id, sort_order, created_at")
    .eq("scope_id", scopeId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as ScopeItemOrderRow[];
  const currentIndex = rows.findIndex((row) => row.id === id);

  if (currentIndex < 0) {
    revalidateScopePaths(scopeId);
    return;
  }

  const nextIndex =
    direction === "up"
      ? currentIndex - 1
      : direction === "down"
        ? currentIndex + 1
        : currentIndex;

  if (nextIndex < 0 || nextIndex >= rows.length || nextIndex === currentIndex) {
    revalidateScopePaths(scopeId);
    return;
  }

  const reordered = [...rows];
  const temp = reordered[currentIndex];
  reordered[currentIndex] = reordered[nextIndex];
  reordered[nextIndex] = temp;

  await Promise.all(
    reordered.map((row, index) =>
      supabase
        .from("naesin_exam_scope_items")
        .update({
          sort_order: index * 10,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id),
    ),
  );

  revalidateScopePaths(scopeId);
}
