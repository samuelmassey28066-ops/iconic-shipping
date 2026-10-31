import { PageTransition } from "@/components/site/Motion";
import { useSettings } from "@/lib/hooks";

export default function Legal({ kind }: { kind: "privacy" | "terms" }) {
  const s = useSettings();
  const privacy = [
    ["Information we collect", "Details you submit through our enquiry, quotation, contact and registration forms — such as name, company, email, phone, vessel details and attachments."],
    ["How we use it", "Only to respond to your enquiry, prepare quotations, coordinate services and communicate with you about your requirement."],
    ["Sharing", "We share necessary details only with port authorities, agents or service vendors when required to deliver the service you requested. We do not sell personal data."],
    ["Security", "Passwords are stored hashed, sessions use secure cookies and customer records are visible only to the customer and our authorised staff."],
    ["Your choices", `You may request access, correction or deletion of your data by emailing ${s.email}.`],
  ];
  const terms = [
    ["Quotations", "Quotations are valid for the period stated on the quotation and are subject to the agreed scope, port conditions and third-party charges."],
    ["Service scope", "Services are coordinated as per the accepted quotation. Changes in scope, vessel schedule or port requirements may affect cost and timelines."],
    ["Payments", "Payment terms are stated on each quotation. Port dues and third-party charges are payable as applicable."],
    ["Liability", "We act with reasonable care and coordinate with authorised parties. Liability is limited to the value of the services directly provided by us."],
    ["Contact", `${s.company_name}, ${s.location} · ${s.phone} · ${s.email}`],
  ];
  const rows = kind === "privacy" ? privacy : terms;
  return (
    <PageTransition>
      <section className="mx-auto max-w-3xl px-6 pb-20 pt-36" data-testid={`legal-${kind}`}>
        <h1 className="text-4xl font-extrabold text-navy">{kind === "privacy" ? "Privacy Policy" : "Terms & Conditions"}</h1>
        <p className="mt-2 text-slate-500">{s.company_name}</p>
        <div className="mt-10 space-y-7">
          {rows.map(([h, t]) => (
            <div key={h}><h2 className="text-lg font-bold text-navy">{h}</h2><p className="mt-1.5 leading-relaxed text-slate-600">{t}</p></div>
          ))}
        </div>
      </section>
    </PageTransition>
  );
}
