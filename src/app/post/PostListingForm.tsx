"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Locality = { id: string; name: string };

// Create + publish a listing. Requires a session; if not signed in, the form prompts the
// visitor to sign in (email + password). Location is derived from the chosen locality.
export function PostListingForm({ localities }: { localities: Locality[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const numOrUndef = (k: string) => (fd.get(k) ? Number(fd.get(k)) : undefined);
    const strOrUndef = (k: string) => ((fd.get(k) as string) || undefined);
    const photos = fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

    const body = {
      intent: fd.get("intent"),
      propertyType: fd.get("propertyType"),
      localityId: strOrUndef("localityId"),
      title: strOrUndef("title"),
      description: strOrUndef("description"),
      furnishing: strOrUndef("furnishing"),
      price: numOrUndef("price"),
      bedrooms: numOrUndef("bedrooms"),
      bathrooms: numOrUndef("bathrooms"),
      areaSqft: numOrUndef("areaSqft"),
    };

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        setNeedLogin(true);
        setError("Sign in to post a property.");
        setBusy(false);
        return;
      }
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        setError(err?.error?.message ?? "Could not create listing.");
        setBusy(false);
        return;
      }
      const { listing } = (await res.json()) as { listing: { id: string } };

      // Upload photos onto the draft before publishing (EXIF-strip → WebP → pHash server-side).
      if (photos.length > 0) {
        const media = new FormData();
        for (const p of photos) media.append("files", p);
        const up = await fetch(`/api/listings/${listing.id}/media`, { method: "POST", body: media });
        if (!up.ok) {
          const err = (await up.json().catch(() => null)) as { error?: { message?: string } } | null;
          setError(err?.error?.message ?? "Draft created but photo upload failed.");
          setBusy(false);
          return;
        }
      }

      const pub = await fetch(`/api/listings/${listing.id}/submit`, { method: "POST" });
      if (!pub.ok) {
        setError("Draft created but submission failed.");
        setBusy(false);
        return;
      }
      // Submitted listings await moderator approval (not yet public), so land on the dashboard.
      router.push("/dashboard");
    } catch {
      setError("Network error.");
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="row">
        <label>
          Listing type
          <select name="intent" defaultValue="rent">
            <option value="rent">Rent</option>
            <option value="sale">Sale</option>
          </select>
        </label>
        <label>
          Property type
          <select name="propertyType" defaultValue="apartment">
            <option value="apartment">Apartment</option>
            <option value="independent_house">Independent house</option>
            <option value="villa">Villa</option>
            <option value="plot">Plot</option>
            <option value="commercial">Commercial</option>
            <option value="pg">PG</option>
          </select>
        </label>
      </div>

      <label>
        Locality
        <select name="localityId" required defaultValue="">
          <option value="" disabled>
            Select a locality…
          </option>
          {localities.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Title
        <input name="title" placeholder="e.g. Bright 2 BHK near metro" maxLength={140} />
      </label>

      <div className="row">
        <label>
          Price
          <input name="price" type="number" min="1" required placeholder="25000" />
        </label>
        <label>
          BHK
          <input name="bedrooms" type="number" min="0" max="20" placeholder="2" />
        </label>
      </div>

      <div className="row">
        <label>
          Bathrooms
          <input name="bathrooms" type="number" min="0" max="20" placeholder="2" />
        </label>
        <label>
          Area (sqft)
          <input name="areaSqft" type="number" min="1" placeholder="950" />
        </label>
        
      </div>
      <div className="row">
          <label>
          Furnishing
          <select name="furnishing" defaultValue="semi_furnished">
            <option value="unfurnished">Unfurnished</option>
            <option value="semi_furnished">Semi-furnished</option>
            <option value="furnished">Furnished</option>
          </select>
        </label>
      </div>
      <label>
        Description
        <textarea name="description" rows={4} placeholder="Key details buyers care about…" />
      </label>

      <label>
        Photos
        <input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple />
        <span className="meta">Up to 12 images · JPEG/PNG/WebP · ≤10 MB each</span>
      </label>

      {error && <p className="error">{error}</p>}
      {needLogin && (
        <Link className="btn" href="/login?redirect=/post&mode=register">
          Sign in to continue
        </Link>
      )}
      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}
