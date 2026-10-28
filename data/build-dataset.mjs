// Hand-written labelled set: 22 facts x 4 phrasings (88) + 12 must-refuse items = 100.
// Each answerable item is labelled with: tenant, the fact the answer must state (regex), and the gold section.
import { writeFileSync } from "node:fs";
const F = [
  ["oak-hollow","Article 4",/30 days/i,["How long does the architectural committee have to respond?","When must the ARC answer my application?","What happens if the review committee doesn't reply within 30 days?","Response deadline for architectural review"]],
  ["oak-hollow","Article 4",/6 feet/i,["How tall can my fence be?","Maximum fence height?","Can I build an 8 foot fence?","fence height limit"]],
  ["oak-hollow","Article 4",/chain-link/i,["Are chain-link fences allowed in the front yard?","Can I put a chain link fence out front?","front yard chain-link fence rules","Is chain-link fencing permitted?"]],
  ["oak-hollow","Article 4",/written approval/i,["Do I need approval to install solar panels?","Can I paint my house a new color without asking?","Do I need permission to build a shed?","approval for exterior changes"]],
  ["oak-hollow","Article 6",/30 consecutive days|Short-term/i,["Can I list my home on Airbnb?","Are short-term rentals allowed?","Can I rent my house for a weekend?","vrbo rules"]],
  ["oak-hollow","Article 6",/12 months/i,["What is the minimum lease length?","How long must a lease be?","Can I lease my home for a year?","lease term minimum"]],
  ["oak-hollow","Article 6",/3 household pets/i,["How many pets can I have?","Can I keep four dogs?","pet limit per home","Maximum number of cats allowed?"]],
  ["oak-hollow","Article 6",/leashed/i,["Do dogs need a leash in common areas?","Can my dog run off leash in the common area?","leash rule","Are leashes required for dogs?"]],
  ["oak-hollow","Article 6",/out of view|collection day/i,["Where do I keep my trash bins?","Can I leave recycling bins by the street?","trash can storage rules","When can bins be visible from the street?"]],
  ["oak-hollow","Article 8",/January 31/i,["When is the annual assessment due?","When are HOA dues due?","annual dues deadline","What date are assessments payable?"]],
  ["oak-hollow","Article 8",/\$25|6%/i,["What is the late fee for dues?","What happens if I pay my assessment late?","interest on unpaid balance","late payment penalty"]],
  ["oak-hollow","Section 1",/8 AM to 9 PM/i,["What are the pool hours?","When does the pool open?","What time does the pool close?","swim hours"]],
  ["oak-hollow","Section 2",/4 guests/i,["How many guests can I bring to the pool?","pool guest limit","Can I bring 6 friends to the pool?","Guest policy for the pool"]],
  ["oak-hollow","Section 3",/Glass/i,["Can I bring glass bottles to the pool?","Is amplified music allowed at the pool?","prohibited items at the pool","Are glass containers allowed poolside?"]],
  ["lakeside-commons","Article 3",/6 months/i,["What is the minimum lease term?","How long must a lease be?","Can I rent my unit for 3 months?","minimum rental period"]],
  ["lakeside-commons","Article 3",/25%/i,["How many units can be leased at once?","Is there a rental cap?","leasing cap percentage","What if too many units are rented?"]],
  ["lakeside-commons","Article 3",/Short-term rentals|prohibited/i,["Can I list my condo on Airbnb?","Are short-term rentals allowed?","vrbo allowed?","Can I rent my unit nightly?"]],
  ["lakeside-commons","Article 5",/IIC 50/i,["Can I install hardwood floors?","What underlayment is required for hard flooring?","flooring sound rating","Do I need sound-dampening under new floors?"]],
  ["lakeside-commons","Article 7",/2 pets/i,["How many pets can I have?","pet limit per unit","Can I keep three cats?","Maximum pets allowed?"]],
  ["lakeside-commons","Article 7",/40 pounds/i,["Can I have a large dog?","Do big dogs need approval?","dog weight limit","Is there a size restriction on dogs?"]],
  ["lakeside-commons","Article 9",/\$50|15th/i,["What is the late fee for assessments?","When are monthly dues late?","late payment fee","What if I pay dues after the 15th?"]],
  ["lakeside-commons","Section 1",/48 hours/i,["How long can guests park?","guest parking limit","Can my visitor park for a week?","Guest parking rules"]],
];
const R = [
  ["oak-hollow","What is the minimum lease term for condo units with a rental cap?"],
  ["oak-hollow","How long can guests park in the garage?"],
  ["oak-hollow","What underlayment rating is required for flooring?"],
  ["oak-hollow","Who is the property manager's phone number?"],
  ["oak-hollow","What is the capital of France?"],
  ["oak-hollow","Can I get towed from a fire lane?"],
  ["lakeside-commons","What are the pool hours?"],
  ["lakeside-commons","How tall can my fence be?"],
  ["lakeside-commons","When is the annual assessment due in January?"],
  ["lakeside-commons","What is the board president's email?"],
  ["lakeside-commons","Explain quantum computing."],
  ["lakeside-commons","How many guests can I bring to the pool?"],
];
const items = [];
for (const [tenant, section, re, qs] of F) qs.forEach((q) => items.push({ id: `q${String(items.length + 1).padStart(3, "0")}`, tenant, question: q, expect: "answer", fact: re.source, section }));
for (const [tenant, q] of R) items.push({ id: `q${String(items.length + 1).padStart(3, "0")}`, tenant, question: q, expect: "refuse" });
writeFileSync(new URL("./eval-set.json", import.meta.url), JSON.stringify(items, null, 1));
console.log(items.length, "items");
