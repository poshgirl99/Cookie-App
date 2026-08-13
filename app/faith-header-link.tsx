import Link from "next/link";

export default function FaithHeaderLink() {
  return (
    <Link
      href="/faith"
      className="faith-header-link"
      aria-label="Open Faith Space"
      title="Faith Space"
    >
      ✝
    </Link>
  );
}
