import { PageHeader } from "@/components/page";
import { VendorForm } from "../vendor-form";

export default function NewVendorPage() {
  return (
    <>
      <PageHeader title="Add vendor" back={{ href: "/vendors", label: "Vendors" }} />
      <VendorForm />
    </>
  );
}
