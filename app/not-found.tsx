import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card p-10 text-center">
      <h1 className="text-xl font-semibold">Not found</h1>
      <p className="mt-1 text-sm text-slate-500">That loan or page doesn&apos;t exist.</p>
      <Link href="/" className="btn-primary mt-4 inline-flex">
        Back to pipeline
      </Link>
    </div>
  );
}
