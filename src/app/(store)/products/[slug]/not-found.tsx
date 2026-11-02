import Link from "next/link";

export default function ProductNotFound() {
  return (
    <section>
      <h1>Companion not found</h1>
      <p>That companion is not part of Willow Market’s collection.</p>
      <Link href="/shop">Browse the three companions →</Link>
    </section>
  );
}
