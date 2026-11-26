import { loadDays } from "@/lib/data";
import { remainingQaza } from "@/lib/stats";

/** "84 қаза" next to Намаз in the nav: qaza not yet made up (SPEC rule 3). */
export async function QazaBadge() {
  const { days } = await loadDays();
  const n = remainingQaza(days);
  if (n === 0) return null;
  return (
    <span className="nav-badge" title={`Өтелмеген қаза намаз: ${n}`}>
      {n} қаза
    </span>
  );
}
