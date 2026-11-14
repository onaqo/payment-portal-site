---
{
  "title": "Smart payment routing from the first rule to the first refund",
  "seoTitle": "Smart payment routing for a two-processor pilot",
  "description": "Design a smart payment routing pilot with two processors. Use a route worksheet, timeout decision table and refund test before switching live traffic.",
  "slug": "smart-payment-routing",
  "date": "2026-11-14",
  "category": "Guides",
  "market": "Global",
  "primaryKeyword": "smart payment routing",
  "keywords": ["payment routing rules", "payment processor failover", "payment retries", "payment reconciliation"],
  "coverAlt": "A payment enters a routing diagram with several possible processor paths.",
  "takeaways": ["Write down which merchants, payment methods and currencies each processor can accept before choosing an order of preference.", "When a request times out after submission, resolve the first attempt before considering a second charge.", "Include a refund and a settlement report in the pilot so finance can follow the same order after checkout."],
  "faq": [
    {"q": "Can a merchant route payments with only one processor?", "a": "You can classify transactions and record the route you would choose. A live comparison between processors needs two approved, working connections for the same type of payment."},
    {"q": "Should a timeout trigger automatic failover?", "a": "First establish whether the request reached the processor. If the original outcome is unknown, keep the order pending and check its status before deciding whether another attempt is appropriate."},
    {"q": "Which approval rate should a routing pilot track?", "a": "Keep two figures. First-attempt approval describes the initial route. The share of unique orders eventually paid includes recovery and describes the outcome the merchant cares about."}
  ]
}
---

Imagine a merchant accepting a card payment for a £49 order. The customer presses Pay, the checkout waits, and the processor connection drops. Sending the order to a second processor sounds helpful. But what if the first processor authorised the payment just before the connection dropped? That one order makes a good test for a smart payment routing pilot.

A useful pilot starts with a narrow question. Can this merchant use a second eligible processor for a defined group of new orders, and can the team explain what happened to each one afterwards? Our [payment orchestration platform](/payment-orchestration) describes how routing profiles work. The worksheet below is a way for operations, engineering and finance to agree on one profile before enabling it. The £49 order and processors A and B are illustrative.

## Write the first smart payment routing rule

Pick one merchant, one currency, one payment method and one kind of purchase. A one-off payment made with a new card is a simpler starting point than a subscription renewal using a credential originally saved by another provider. Ask both processors which transactions the merchant is approved to submit. Record who checked the answer and where to find it when the agreement or account configuration changes.

| Worksheet field | Example pilot entry |
| --- | --- |
| Scope | Merchant M, GBP, one-off online card purchase |
| Eligible destinations | A and B after merchant account and credential checks |
| First choice | A for the initial baseline |
| Comparison | A small, preselected share of eligible new orders starts on B |
| Unknown outcome | Retain the original attempt reference and check status |
| Rollback owner | Payments operations returns new orders to A |
| Refund owner | Finance locates the processor that captured the original order |

Ask a colleague outside the project to route three example orders using this sheet. Give them a GBP card order, a euro card order and a GBP renewal. If they send all three into the pilot, the rule is ambiguous. Document the existing treatment of out-of-scope orders so a change to one merchant cannot silently become a change to the whole portfolio.

## Keep an order separate from its attempts

Give the merchant order one stable reference. Give each processor submission its own attempt record and retain the provider reference when it becomes available. A support agent looking up the £49 order should see the original request, its outcome, any later attempt and the processor that captured the payment. That history matters when the customer has already closed the checkout.

<figure><svg viewBox="0 0 760 125" role="img" aria-label="Order 49 has an attempt at A. An unknown outcome leads to a status check." font-family="Inter, sans-serif" text-anchor="middle"><rect width="760" height="125" rx="12" fill="#0F1729"/><path d="M80 75H680" stroke="#6E9BFF" stroke-width="3"/><g fill="#3DDC97"><circle cx="80" cy="75" r="7"/><circle cx="275" cy="75" r="7"/><circle cx="485" cy="75" r="7"/><circle cx="680" cy="75" r="7"/></g><g fill="#F4F7FC" font-size="21"><text x="80" y="48">Order 49</text><text x="275" y="48">Attempt at A</text><text x="485" y="48">No response</text><text x="680" y="48">Check A</text></g></svg><figcaption>The last known attempt tells the operator where to look for the missing outcome.</figcaption></figure>

Check the scope of the idempotency key used by each connector. For example, Stripe documents how it returns a stored result for a repeated request using the same key. A second processor runs its own system and has no access to that stored result. The merchant therefore needs an order-level decision about whether it is safe to start a separate attempt. [Stripe’s idempotent request documentation](https://docs.stripe.com/api/idempotent_requests)

## Decide what the checkout should do next

| What the team knows | Next step in the pilot |
| --- | --- |
| A is unavailable before a new request is submitted | Select B if it is eligible for this order |
| A might have received the request | Hold the order pending, query A and reconcile the event |
| The issuer asks the customer to authenticate | Continue the required customer action on the existing flow |
| The provider reports a final decline with instructions to stop | End the attempt and present the permitted customer-facing message |
| A confirms capture | Complete the order once and preserve A’s reference for the refund |

Use the processor’s response and its documented advice when deciding how to handle a decline. Codes that appear similar can require different next actions. Stripe, for instance, distinguishes authentication requirements from reports that a card was stolen and provides guidance on what to tell the customer. Check the advice from the processor serving that transaction before enabling a retry. [Stripe’s decline code reference](https://docs.stripe.com/declines/codes)

Include the support message in the exercise. When the status is unknown, tell the customer that confirmation is pending and give them a reference. Test what happens if they refresh the page or reopen the same order from an email. A second click should return them to the existing order state while your team resolves the first submission.

## Test the payment after checkout closes

Run a sandbox purchase through each eligible route. Save the merchant order reference, the processor reference and the event that causes your system to release the order. Deliver the same event a second time and inspect fulfilment. The customer should receive one order confirmation and the warehouse should see one instruction to ship. Adyen documents webhook verification, acknowledgement and duplicate handling in its integration guide. [Adyen’s webhook handling guide](https://docs.adyen.com/development-resources/webhooks/handle-webhook-events/)

Now refund the example order after switching the default route from A to B. The finance operator should be able to find the original capture at A without asking an engineer which routing rule was active yesterday. Have the operator record where the refund appears in the processor report and how to match it back to the merchant order. A sandbox may lack real settlement reports, so confirm that last step using an appropriate live reconciliation sample when available.

## Measure the pilot and decide whether to expand it

Before changing traffic, write down the decision the team will make at the end of the pilot. Compare eligible orders from the same merchant, currency and purchase type over the same period. Count unique orders separately from processor attempts. A recovered purchase can generate two attempts and one paid order. Giving both attempts the weight of separate shoppers changes the story the figures tell.

In an illustrative batch of 100 orders, 80 succeed on the first attempt. If five different orders later succeed through an allowed recovery path, first-attempt approval is 80% and eventual order success is 85%. The five recovered orders do not establish that another processor would have performed better on the entire batch. Keep the comparison group and record exclusions, outages and any rule changes during the observation period.

Look at time to confirmation, unresolved orders, refunds that need manual matching and the cost per paid order alongside approval. An improvement in one measure can create work elsewhere. Ask support and finance to sign off on the sample history they actually used. If the evidence is inconclusive, retain the narrow scope and collect another comparable batch before expanding to new merchants or currencies.

For the broader integration choices, see our [guide to payment orchestration](/blog/what-is-payment-orchestration). To prepare a pilot, take the worksheet to the [developer quick start](/developers#quick-start), identify both processor references and [book a routing walkthrough](/book-a-demo) using your own example order.
