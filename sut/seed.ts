// Two fictional associations. Names, addresses and rules are invented for the demo.
import { Queryable, createTenant } from "./db";
import { ingestDocument } from "./ingest";

export const TENANTS = [
  { id: "oak-hollow", name: "Oak Hollow HOA (fictional)" },
  { id: "lakeside-commons", name: "Lakeside Commons Condo Association (fictional)" },
];

export const DOCS: Record<string, { title: string; text: string }[]> = {
  "oak-hollow": [
    { title: "Oak Hollow CC&Rs", text: `
Article 4 Architectural Control
Any exterior change, including fences, sheds, solar panels and exterior paint colors, requires written approval from the Architectural Review Committee before work begins. The committee must respond within 30 days of a complete application; no response within 30 days counts as approval.
Fences may not exceed 6 feet in height and must be wood or black wrought iron. Chain-link fences are not allowed in front yards.
Article 6 Use Restrictions
Short-term rentals of fewer than 30 consecutive days are prohibited. Owners may lease a home for 12 months or longer after giving the Board a copy of the lease.
No more than 3 household pets may be kept at a home. Dogs must be leashed in common areas.
Trash and recycling bins must be stored out of view from the street except on collection day.
Article 8 Assessments
The annual assessment is due January 31. A late fee of $25 applies after 30 days, and unpaid balances accrue interest at 6% per year.
`},
    { title: "Oak Hollow Pool Rules", text: `
Section 1 Hours
The community pool is open from 8 AM to 9 PM, Memorial Day through Labor Day.
Section 2 Guests
Each household may bring up to 4 guests at a time. Guests under 14 must be accompanied by an adult resident.
Section 3 Prohibited Items
Glass containers and amplified music are not allowed in the pool area.
`},
  ],
  "lakeside-commons": [
    { title: "Lakeside Commons Declaration", text: `
Article 3 Leasing
Units may be leased for a minimum term of 6 months. Short-term rentals through any platform are prohibited. No more than 25% of units may be leased at one time; the Board keeps a waiting list.
Article 5 Alterations
Owners must get Board approval before replacing flooring, moving walls or changing plumbing. Hard flooring above the first floor requires sound-dampening underlayment rated IIC 50 or better.
Article 7 Pets
Each unit may keep up to 2 pets. Dogs over 40 pounds require Board approval.
Article 9 Assessments
Monthly assessments are due on the 1st. A late fee of $50 applies after the 15th.
`},
    { title: "Lakeside Commons Parking Policy", text: `
Section 1 Assigned Spaces
Each unit has 1 assigned garage space. Guest parking is limited to 48 hours.
Section 2 Towing
Vehicles parked in fire lanes or another unit's space may be towed at the owner's expense after a 24-hour notice.
`},
  ],
};

export async function seed(db: Queryable) {
  for (const t of TENANTS) {
    await createTenant(db, t.id, t.name);
    for (const d of DOCS[t.id]) await ingestDocument(db, t.id, d.title, d.text);
  }
}
