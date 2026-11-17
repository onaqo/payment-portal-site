---
{
  "title": "How to start a payment service provider with a one-merchant pilot",
  "seoTitle": "How to start a payment service provider",
  "description": "See how to start a payment service provider with a one-merchant pilot. Map responsibilities, test a refund and reconcile the first payout before expansion.",
  "slug": "start-a-payment-service-provider",
  "date": "2026-11-15",
  "category": "Guides",
  "market": "Global",
  "primaryKeyword": "how to start a payment service provider",
  "keywords": ["PSP launch checklist", "merchant acquiring partner", "white-label gateway", "payment reconciliation"],
  "coverAlt": "A ticket for a pilot payout shows ten sales, one refund and the resulting £438 payout.",
  "takeaways": ["Choose one merchant and one market so your first pilot has a clear boundary.", "Agree who approves the merchant, supports the checkout and releases the payout before accepting live transactions.", "Ask finance to reconcile one complete settlement batch before opening the pilot to more merchants."],
  "faq": [
    {"q":"Can a white-label gateway provide the software for a PSP launch?","a":"It can supply the branded checkout and payment infrastructure. Your team still needs to agree the acquiring arrangements, operating responsibilities and legal permissions for the model it intends to run."},
    {"q":"Which merchant should join the first pilot?","a":"Choose a merchant whose products, delivery window and settlement currency fit the arrangement your acquiring partner has agreed. Pick an operator willing to review individual orders and help investigate exceptions."},
    {"q":"What should the pilot deliver before we expand?","a":"Keep the signed responsibilities, checkout test results, an explained settlement report and the merchant’s support instructions. Resolve material gaps before introducing another currency, payment method or merchant type."}
  ]
}
---

If you are working out how to start a payment service provider, try answering one question before choosing software: your first merchant has received £438 in its bank account, so who on your team can explain that figure? The answer brings together the contracts, checkout records and support arrangements you need for a launch. A [white-label payment gateway](/white-label-gateway) is one part of that work.

Start with one merchant, one market, one settlement currency and one payment method. Write those choices on the first page of your pilot plan. Give the merchant a named contact for onboarding, payment problems and payout queries. That small scope makes it easier to see where one partner’s responsibility ends and another begins.

## How to start a payment service provider in one market

Describe what the customer buys, which business appears on the checkout, who contracts with the merchant and who receives the payment proceeds. Draw the movement of money separately from the movement of order data. If an arrow touches your company’s bank account, record why the money arrives there, how long it stays and who can instruct its onward transfer. Have the partner responsible for settlement review that drawing.

The regulatory assessment belongs to the market and activities you select. In the UK, for example, the FCA distinguishes technical support from providing a payment service and explains the limits of the technical-services exclusion. Give a qualified local adviser your actual contracts and flows, including who can initiate payments or control funds. Obtain an assessment before accepting live money. [FCA guidance on the scope of payment services](https://handbook.fca.org.uk/handbook/perg15/perg15s5)

For the technology choice, write a separate brief covering merchant onboarding, checkout, transaction status, refunds and reporting. If your team is still choosing whether to buy or build the software, the [white-label gateway comparison](/blog/white-label-payment-gateway-vs-building-your-own) covers that decision in more detail.

## Agree who can make each decision

Bring your acquiring contact, operations lead and merchant representative to the same planning session. Use a real decision in each row. “Support owns onboarding” leaves room for two parties to assume the other has approved a merchant. “The acquiring partner sends approval for this legal entity, website and product range” gives your team something it can verify.

| Pilot decision | Evidence to collect | Question to settle |
| --- | --- | --- |
| Activate a merchant | Approval tied to the entity and selling channel | Who can change the approved scope? |
| Release an order | Confirmed payment status linked to the order | Who resolves a conflicting checkout result? |
| Issue a refund | Original payment, refund amount and operator record | Who can approve a refund and see its final status? |
| Explain a payout | Settlement report and matching bank entry | Who investigates an unexplained deduction? |

Ask each owner to show where the evidence will live. A merchant support agent may need a transaction reference while finance needs the provider’s batch reference. If the two teams cannot connect those records, establish the mapping before training anyone to answer payout questions. Use anonymised examples when sharing records beyond the people who need them.

## Follow a sale beyond the checkout

Take one test order through the full journey. Record the merchant order number, the gateway payment reference and the processor reference. Close the customer’s browser immediately after payment in a test environment and check how the merchant learns the final result. Ask the team to locate that order starting from each reference independently. Review the [developer integration guide](/developers) with the engineer responsible for the merchant’s order system.

Then choose a paid test order and request a partial refund. Check what support sees while the refund is pending and what changes once the processor confirms it. Ask a second operator to locate the remaining refundable amount. Save the evidence alongside the merchant’s instructions so the first person on weekend support can follow the same trail.

Discuss card-data responsibilities with the merchant and its compliance contact as part of this walkthrough. The PCI Security Standards Council explains that merchants outsourcing all processing still have responsibilities for the third party protecting their account data. Document which party handles each relevant step in your chosen integration. [PCI SSC guidance on outsourced payment processing](https://www.pcisecuritystandards.org/faqs/does-pci-dss-apply-to-merchants-who-outsource-all-payment-processing-operations-and-never-store-process-or-transmit-cardholder-data/)

## Reconcile an illustrative £438 payout

Suppose ten settled sales are £50 each. One £50 refund is included in the same batch, and the report lists £12 in fees. Assume there are no reserves, currency conversions or other adjustments. The expected payout is £500 minus £50 minus £12, or **£438**. All figures are illustrative. Use the fee and settlement provisions in your own partner agreement for a real pilot.

<figure><svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Five hundred pounds in sales less a fifty-pound refund and twelve pounds in fees equals a four-hundred-and-thirty-eight-pound payout" viewBox="0 0 760 110" font-family="Inter, sans-serif"><rect width="760" height="110" rx="14" fill="#0F1729"/><g font-size="26" fill="#F4F7FC"><text x="22" y="47">£500</text><text x="191" y="47">− £50</text><text x="383" y="47">− £12</text><text x="573" y="47" fill="#3DDC97">= £438</text></g><g font-size="18" fill="#AEB9CC"><text x="22" y="80">Sales</text><text x="191" y="80">Refund</text><text x="383" y="80">Fees</text><text x="573" y="80">Payout</text></g></svg><figcaption>Illustrative pilot batch in one settlement currency.</figcaption></figure>

Now change one detail: the processor records the refund after the batch cut-off. With the same £12 fee and the refund excluded, the first payout becomes £488. A colleague comparing only the shop’s daily sales and refunds would expect £438 and might report £50 missing from the ledger. Have finance identify the actual batch containing the refund and carry that difference forward until it clears. Record the cut-off time and time zone alongside the report.

## Decide whether to add the next merchant

Run a short handover before widening the pilot. Ask someone outside the integration team to complete these steps using only the notes that will be available after launch.

1. Find the merchant’s approval and confirm that it covers the product being sold.
2. Trace a paid order from checkout to settlement using its references.
3. Explain a refund that crosses a batch boundary to the merchant in plain language.
4. Identify who can pause new transactions, who will contact the merchant and how existing refunds will be handled during a pause.

If an owner is missing, write down the outstanding decision and name the person who will resolve it. If a settlement discrepancy remains open, identify the affected batch and agree when finance will check it again. Introduce one new variable at a time so your team can tell whether an issue came from the second merchant, a new processor or a different currency.

For an AQ Pay walkthrough, bring your proposed merchant profile, payment flow and a sample settlement report with customer information removed. [Book a gateway demo](/book-a-demo) and use that one merchant journey to evaluate the platform.
