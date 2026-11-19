import type { Metadata } from "next";
import CRMApp from "../../components/crm/CRMApp";

export const metadata: Metadata = {
  title: "YOUJIU Trade CRM",
  description: "Internal trade quotation, customer and order management workspace.",
  robots: { index: false, follow: false },
};

export default function CRMPage() {
  return <CRMApp />;
}
