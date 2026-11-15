import { notFound } from "next/navigation";

export default async function LegacyProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  void id;
  notFound();
}
