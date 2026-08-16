import { prisma } from "@/lib/db";
import { PostListingForm } from "./PostListingForm";

// Post-a-property page (supply side). Localities drive the location until the map picker
// lands. Draft → publish happens in one submit; see build-plan Week 2.
export default async function PostPage() {
  let localities: { id: string; name: string }[] = [];
  try {
    localities = await prisma.locality.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  } catch {
    return (
      <div className="notice">
        Database not configured — set <code>DATABASE_URL</code> and run <code>npm run db:seed</code>.
      </div>
    );
  }

  return (
    <section>
      <h1>Post a property</h1>
      <p className="meta">Free to list. Verified listings get better placement.</p>
      <PostListingForm localities={localities} />
    </section>
  );
}
