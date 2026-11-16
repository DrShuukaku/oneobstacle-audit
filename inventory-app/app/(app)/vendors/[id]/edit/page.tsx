import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page";
import { getVendors } from "@/lib/queries";
import { VendorForm } from "../../vendor-form";

export default async function EditVendorPage({ params }: PageProps<"/vendors/[id]/edit">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [v] = await getVendors({ id, includeInactive: true });
  if (!v) notFound();
  return (
    <>
      <PageHeader title="Edit vendor" back={{ href: `/vendors/${id}`, label: v.name }} />
      <VendorForm vendor={{ id: v.id, name: v.name, contactName: v.contact_name, phone: v.phone, email: v.email, notes: v.notes, active: v.active }} />
    </>
  );
}
