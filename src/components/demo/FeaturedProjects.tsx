import { Rail } from "../Rail";
import { PropertyCard } from "../PropertyCard";
import { demoProjects, PROPERTY_TYPE_ICON } from "@/modules/demo/dummy";

// DEMO ONLY — fake builder projects (we have no project entity). Purely to fill the page like a
// portal. All cards link to /search so nothing dead-ends.
export function FeaturedProjects({ cityName }: { cityName: string }) {
  const projects = demoProjects(cityName);
  return (
    <Rail
      title="Featured projects"
      subtitle="Handpicked new launches & ready-to-move homes"
      seeAllHref="/search"
    >
      {projects.map((p) => (
        <PropertyCard
          key={p.id}
          href="/search"
          price={p.priceRange}
          title={p.name}
          specs={p.config}
          locality={p.locality}
          badge={p.tag}
          seed={p.id + p.name}
          icon={PROPERTY_TYPE_ICON.project}
          cta="View project"
        />
      ))}
    </Rail>
  );
}
