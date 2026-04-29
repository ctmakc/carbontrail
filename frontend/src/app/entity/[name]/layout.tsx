import type { Metadata } from "next";

interface Props {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  return {
    title: `${decoded} — CarbonTrail`,
    description: `Climate spending profile for ${decoded}. Grants, contracts, lobbying data from Canadian public records.`,
    openGraph: {
      title: `${decoded} — Climate Spending Profile`,
      description: `View the complete climate funding profile for ${decoded} on CarbonTrail.`,
    },
  };
}

export default function EntityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
