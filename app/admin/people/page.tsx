"use client";

import useUserProfile from "@/hooks/useUserProfile";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, GripVertical, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import PeopleRow, { Person } from "./PeopleRow";
import { useRouter } from "next/navigation";
import NoAccess from "@/components/admin/NoAccess";

export default function AdminPeoplePage() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);
  const openPopover = (id: string) => setActivePopoverId(id);
  const closePopover = () => setActivePopoverId(null);

  /* ------------------------------------------------------
     1. FETCH PROFILES
  ------------------------------------------------------ */
  useEffect(() => {
    const fetchPeople = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) {
        console.log("SUPABASE FETCH ERROR:", error);
        toast.error("Failed to load profiles");
        setLoading(false);
        return;
      }

      const withIndex = (data || []).map((p: any, idx: number) => ({
        ...p,
        order_index: p.order_index ?? idx + 1,
        image_file: null,
        preview_url: null,
      })) as Person[];

      setPeople(withIndex);
      setLoading(false);
    };

    fetchPeople();
  }, []);

  /* ------------------------------------------------------
     2. ADD EMPTY PERSON
  ------------------------------------------------------ */
  const handleAddPerson = () => {
    const maxIndex =
      people.length > 0 ? Math.max(...people.map((p) => p.order_index || 0)) : 0;

    const newPerson: Person = {
      id: `temp-${Date.now()}`,
      order_index: maxIndex + 1,
      name: "",
      position: "",
      role: "staff",
      image_url: null,
      linkedin: null,
      instagram: null,
      email: null,
      personal_email: null,
      contact_visibility: null,
      is_published: false,
      image_file: null,
      preview_url: null,
    };

    setPeople((prev) => [...prev, newPerson]);
  };

  /* ------------------------------------------------------
     3. LOCAL FIELD CHANGE
  ------------------------------------------------------ */
  const handleChange = (id: string, changes: Partial<Person>) => {
    setPeople((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...changes } : p))
    );
  };

  /* ------------------------------------------------------
     4. REORDER
  ------------------------------------------------------ */
  const moveRow = (index: number, direction: "up" | "down") => {
    const person = people[index];
    if (person.role === "admin") return;

    setPeople((prev) => {
      const arr = [...prev];
      const newIndex = direction === "up" ? index - 1 : index + 1;

      if (newIndex < 0 || newIndex >= arr.length) return prev;
      if (arr[newIndex].role === "admin") return prev;

      const [moved] = arr.splice(index, 1);
      arr.splice(newIndex, 0, moved);

      return arr.map((p, idx) => ({ ...p, order_index: idx + 1 }));
    });
  };

  /* ------------------------------------------------------
     4.5 UPLOAD PHOTO (helper)
  ------------------------------------------------------ */
  const uploadPhoto = async (person: Person, newId: string) => {
    if (!person.image_file) return null;

    const ext = person.image_file.name.split(".").pop();
    const fileName = `${newId}-${Date.now()}.${ext}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from("people")
      .upload(filePath, person.image_file, {
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("people").getPublicUrl(filePath);

    return data.publicUrl;
  };

  /* ------------------------------------------------------
     5. SAVE
  ------------------------------------------------------ */
const handleSave = async (id: string) => {
  const person = people.find((p) => p.id === id);
  if (!person) return;

  setSavingId(id);

  try {
    /* ============================================================
       INSERT NEW PROFILE
    ============================================================ */
    if (person.id.startsWith("temp-")) {
      // ⛔ VALIDASI WAJIB
      if (!person.email) {
        toast.error("Email is required to create an account");
        setSavingId(null);
        return;
      }

      // 1) INSERT PROFILE (tanpa image dulu)
      const payload: Record<string, any> = {
        name: person.name || "",
        position: person.position || "",
        role: person.role || "staff",
        email: person.email,
        linkedin: person.linkedin || null,
        instagram: person.instagram || null,
        order_index: person.order_index,
        is_published: false,
        image_url: null,
      };

      if (person.personal_email) payload.personal_email = person.personal_email;
      if (person.phone) payload.phone = person.phone;
      if (person.slug) payload.slug = person.slug;
      if (person.contact_visibility) payload.contact_visibility = person.contact_visibility;

      let { data: inserted, error: insertError } = await supabase
        .from("profiles")
        .insert(payload)
        .select("id")
        .single();

      if (insertError && (insertError.message?.includes("column") || insertError.code === "PGRST204")) {
        delete payload.personal_email;
        delete payload.phone;
        delete payload.slug;
        delete payload.contact_visibility;
        const retry = await supabase.from("profiles").insert(payload).select("id").single();
        inserted = retry.data;
        insertError = retry.error;
      }

      if (insertError || !inserted) {
        console.error("INSERT ERROR:", insertError);
        throw insertError ?? new Error("Insert failed");
      }

      const newId = inserted.id;

      /* ============================================================
         CREATE AUTH USER (AUTO ACCOUNT CREATION)
      ============================================================ */
      try {
        const createAuth = await fetch("/api/create-auth-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: person.email,
            role: person.role,
          }),
        });

        if (createAuth.ok) {
          const authResult = await createAuth.json().catch(() => ({}));
          if (authResult?.error) {
            console.warn("Auth create notice:", authResult.error);
          }
        }
      } catch (authErr) {
        console.warn("Auth create request error:", authErr);
      }

      /* ============================================================
         UPLOAD PHOTO (JIKA ADA)
      ============================================================ */
      let photoUrl = null;

      if (person.image_file) {
        photoUrl = await uploadPhoto(person, newId);

        if (photoUrl) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ image_url: photoUrl })
            .eq("id", newId);

          if (updateError) throw updateError;
        }
      }

      /* ============================================================
         UPDATE LOCAL STATE
      ============================================================ */
      handleChange(id, {
        id: newId,
        image_url: photoUrl || null,
        image_file: null,
        preview_url: null,
      });

      toast.success("Saved");
      return;
    }

    /* ============================================================
       UPDATE EXISTING PROFILE
    ============================================================ */
    let finalImageUrl = person.image_url;

    if (person.image_file) {
      const newPhotoUrl = await uploadPhoto(person, person.id);
      if (newPhotoUrl) finalImageUrl = newPhotoUrl;
    }

    const updatePayload: Record<string, any> = {
      name: person.name,
      position: person.position,
      role: person.role,
      email: person.email,
      linkedin: person.linkedin,
      instagram: person.instagram,
      order_index: person.order_index,
      image_url: finalImageUrl,
    };

    if (person.personal_email !== undefined) updatePayload.personal_email = person.personal_email;
    if (person.phone !== undefined) updatePayload.phone = person.phone;
    if (person.slug !== undefined) updatePayload.slug = person.slug;
    if (person.contact_visibility !== undefined) updatePayload.contact_visibility = person.contact_visibility;

    let { error: updateError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", person.id);

    // If phone, slug, personal_email, or contact_visibility column doesn't exist in DB schema yet, retry without them
    if (updateError && (updateError.message?.includes("column") || updateError.code === "PGRST204")) {
      delete updatePayload.personal_email;
      delete updatePayload.phone;
      delete updatePayload.slug;
      delete updatePayload.contact_visibility;
      const retry = await supabase.from("profiles").update(updatePayload).eq("id", person.id);
      updateError = retry.error;
    }

    if (updateError) throw updateError;

    handleChange(id, {
      image_url: finalImageUrl,
      image_file: null,
      preview_url: null,
    });

    toast.success("Updated");
  } catch (err) {
    console.error("SAVE ERROR:", err);
    toast.error("Save failed");
  } finally {
    setSavingId(null);
  }
};


  /* ------------------------------------------------------
     DELETE PHOTO
  ------------------------------------------------------ */
  const handleDeletePhoto = async (id: string) => {
    const person = people.find((p) => p.id === id);
    if (!person || !person.image_url) return;

    const filename = person.image_url.split("/").pop();
    if (!filename) {
      console.log("No filename found in image_url:", person.image_url);
      return;
    }

    const { error } = await supabase.storage.from("people").remove([filename]);

    if (error) {
      console.log("DELETE PHOTO ERROR:", error);
      toast.error("Failed to delete photo");
      return;
    }

    handleChange(id, {
      image_url: null,
      preview_url: null,
      image_file: null,
    });

    toast.success("Photo deleted");
  };

  /* ------------------------------------------------------
     6. PUBLISH / UNPUBLISH TOGGLE
  ------------------------------------------------------ */
  const handleTogglePublish = async (id: string, newStatus: boolean) => {
    const person = people.find((p) => p.id === id);
    if (!person) return;

    if (id.startsWith("temp-")) {
      toast.error("Please save the person before setting feed visibility");
      return;
    }

    if (newStatus && (!person.name?.trim() || !person.position?.trim())) {
      toast.error("Name & Position are required to show in feed");
      return;
    }

    setPublishingId(id);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_published: newStatus })
        .eq("id", id);

      if (error) throw error;

      handleChange(id, { is_published: newStatus });
      toast.success(newStatus ? "Shown in People feed" : "Hidden from People feed");
    } catch (err) {
      console.error("TOGGLE PUBLISH ERROR:", err);
      toast.error("Failed to update visibility");
    } finally {
      setPublishingId(null);
    }
  };

  /* ------------------------------------------------------
     7. DELETE
  ------------------------------------------------------ */
  const handleDelete = async (id: string) => {
    const person = people.find((p) => p.id === id);
    if (!person) return;

    const confirmDelete = confirm(`Delete "${person.name || "this member"}"?`);
    if (!confirmDelete) return;

    if (!id.startsWith("temp-")) {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) {
        console.log("DELETE ERROR:", error);
        toast.error("Failed to delete member");
        return;
      }
    }

    setPeople((prev) => prev.filter((p) => p.id !== id));
    toast.success(`"${person.name || "Member"}" deleted successfully`);
  };

  if (!profileLoading && profile?.role === "staff") {
    return (
      <NoAccess message="Only admin and supervisor can access People section." />
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* 1. HEADER */}
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-adidaya-text-muted font-mono">
            Admin • Studio • People
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white flex items-center gap-2 tracking-tight">
            <span className="text-adidaya-red font-bold">*</span> People
          </h1>
          <p className="text-sm text-adidaya-text-muted">
            Manage studio team members, organizational roles, contact credentials, virtual ID cards, and feed visibility.
          </p>
        </div>
      </header>

      {/* 2. SUBHEADER ACTION BAR (KIRI: Back to Dashboard, KANAN: Actions) */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
        {/* KIRI: Back to Dashboard */}
        <button
          onClick={() => router.push("/admin")}
          className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-medium text-adidaya-text-muted hover:text-white hover:border-white/30 hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 select-none group w-fit shadow-sm"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to Dashboard</span>
        </button>

        {/* KANAN: Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => window.open("/studio", "_blank")}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-adidaya-text-muted hover:text-white hover:border-white/30 hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 select-none group shadow-sm"
          >
            <span>Live Preview</span>
            <ExternalLink size={12} strokeWidth={1.5} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          <button
            onClick={() => {
              if (profile?.role !== "admin" && profile?.role !== "supervisor") return;
              handleAddPerson();
            }}
            disabled={profile?.role !== "admin" && profile?.role !== "supervisor"}
            className={`rounded-full px-5 py-2.5 text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all select-none ${
              profile?.role === "admin" || profile?.role === "supervisor"
                ? "bg-white text-black hover:bg-adidaya-red hover:text-white hover:shadow-[0_0_20px_rgba(229,57,53,0.4)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                : "opacity-40 cursor-not-allowed bg-white/20 text-white/40 border border-white/10"
            }`}
          >
            <Plus size={14} strokeWidth={2} />
            <span>Add Person</span>
          </button>
        </div>
      </div>

      {/* 3. TABLE CONTAINER (CLEAN CARD STACK) */}
      <div className="rounded-3xl bg-[#080808] p-2 sm:p-3 shadow-2xl">
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            {/* TABLE HEADER */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "44px 64px 1.2fr 1fr 105px 80px 45px 55px 80px",
              }}
              className="gap-3.5 px-5 py-3.5 text-[11px] uppercase tracking-wider font-mono text-neutral-400 bg-[#121212] rounded-2xl mb-2.5 items-center"
            >
              <div className="flex items-center gap-1">
                <GripVertical className="h-3 w-3" />
                <span>No</span>
              </div>
              <div>Photo</div>
              <div>Name</div>
              <div>Position</div>
              <div>Role</div>
              <div className="text-center">Contact</div>
              <div className="text-center">ID</div>
              <div className="text-center">Feed</div>
              <div className="text-right">Actions</div>
            </div>

            {/* TABLE BODY */}
            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-neutral-500">Loading team members...</div>
            ) : people.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-neutral-500">No members found. Click &quot;+ Add Person&quot; to create one.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {people.map((person, index) => (
                  <PeopleRow
                    key={person.id}
                    person={person}
                    index={index}
                    allPeople={people}
                    onChange={handleChange}
                    onMoveUp={() => moveRow(index, "up")}
                    onMoveDown={() => moveRow(index, "down")}
                    onSave={handleSave}
                    onTogglePublish={handleTogglePublish}
                    onDelete={handleDelete}
                    onDeletePhoto={handleDeletePhoto}
                    saving={savingId === person.id}
                    publishing={publishingId === person.id}
                    activePopoverId={activePopoverId}
                    openPopover={() => openPopover(person.id)}
                    closePopover={closePopover}
                    canEdit={profile?.role === "admin" || profile?.role === "supervisor"}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div id="people-popover-root"></div>
    </div>
  );
}
