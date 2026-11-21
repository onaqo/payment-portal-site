---
{
 "title":"3D Secure 2: what to verify after the customer authenticates",
 "seoTitle":"3D Secure 2: verify the payment hand-off",
 "description":"Understand 3D Secure 2 authentication, authorisation and liability evidence. Use a practical hand-off checklist before releasing a customer’s order.",
 "slug":"3d-secure-2",
 "date":"2026-11-21",
 "category":"Explainers",
 "market":"Global",
 "primaryKeyword":"3D Secure 2",
 "keywords":["3DS authentication","payment authorisation","liability shift","authentication evidence","checkout integration"],
 "coverAlt":"A navy inspection panel shows authentication completed, payment declined and fulfilment held for illustrative order 314.",
 "takeaways":["Record authentication and the subsequent payment outcome separately before deciding whether to fulfil an order.","Ask the provider to show which authentication evidence reaches the authorisation request.","Verify liability treatment for the actual transaction instead of inferring it from the appearance of a challenge."],
 "faq":[
  {"q":"Does successful 3D Secure 2 authentication mean a payment succeeded?","a":"Authentication and payment authorisation are separate results. Your order should follow the verified payment state and your agreed capture and fulfilment policy, rather than an authentication screen alone."},
  {"q":"Does every 3D Secure 2 payment show a challenge?","a":"No. An issuer can authenticate through a frictionless flow using available data, or request an additional challenge. The absence of a visible challenge does not tell you the final authentication or payment result."},
  {"q":"Does 3D Secure 2 protect against every chargeback?","a":"No. Eligible liability shift concerns certain fraud-related disputes and depends on applicable scheme rules and transaction conditions. Delivery, refund and other dispute types still need their own evidence and handling."},
  {"q":"What should a merchant request from a 3DS provider?","a":"Ask for a sample transaction showing authentication status, the associated payment reference and the final payment outcome. Have the provider explain evidence transfer, liability reporting and the handling of incomplete or conflicting results."}
 ]
}
---

A shopper completes a bank challenge, returns to checkout and expects an order confirmation. Your system still needs to establish what happened to the payment. With 3D Secure 2, authentication is one part of the journey. The hand-off to authorisation deserves its own checks, particularly when different services handle authentication, processing and order fulfilment.

Ask a prospective [payment orchestration platform](/payment-orchestration) to demonstrate that hand-off using one complete transaction history. The useful question is whether your team can explain each decision from the evidence available. This guide proposes an operational checklist and an illustrative test case for merchants and platforms comparing integrations.

## Keep three decisions separate in 3D Secure 2

Record the authentication outcome, payment outcome and fulfilment decision separately. Connect them using your merchant order reference and the provider references returned during processing. Give support a clear view of which step is complete and which remains unresolved.

EMVCo describes EMV 3-D Secure as a way for merchants and issuers to exchange transaction, payment-method and device information to authenticate the consumer. Its flows can allow authentication without an additional customer challenge, or ask the customer to complete a challenge. A challenge may use methods such as a one-time passcode or biometrics. [EMVCo’s overview of EMV 3-D Secure](https://www.emvco.com/emv-technologies/3-d-secure/)

The practical implication is to inspect the result reported by your integration. A shopper seeing a challenge is an observation about the journey. It is insufficient evidence on its own to mark the merchant order paid. Ask the provider to identify the verified event or status that your application should use for the payment decision.

For the separate question of when authentication or exemptions are appropriate, see our [PSD2 strong customer authentication guide](/blog/psd2-strong-customer-authentication). This article focuses on the evidence that reaches the payment and order systems afterwards.

## Inspect the hand-off between services

Start with the integration you intend to buy. Does the same provider perform authentication and submit the authorisation, or will authentication data arrive from another service? Ask who maps the fields and who investigates a missing result.

Official integration documentation distinguishes ordinary 3DS request information from data used to authorise a payment following third-party authentication. It also documents integration-specific requirements for browser information, return addresses and other fields. Your team should use the requirements for the exact provider, API version and integration channel being deployed. [Official 3D Secure 2 API reference](https://docs.adyen.com/online-payments/3d-secure/api-reference/)

Ask for a redacted sample that connects the authentication reference to the authorisation reference. Have the provider explain how it associates the evidence with the intended payment. In a proposed acceptance review, check the merchant order, amount, currency and selected processing route against the transaction your team meant to submit.

Do not fill missing fields with invented customer or device data merely to make a request pass validation. Ask how missing information should be represented and what the provider expects your application to do when required information is unavailable. Keep secrets and sensitive authentication values out of ordinary support tickets.

Bring the resulting field map to the [developer integration discussion](/developers). The important deliverable is a named owner for each hand-off and a documented way to find the associated records.

## Rehearse a successful challenge followed by a declined payment

Consider an illustrative €86 purchase with merchant order reference 314. In the test environment, the shopper completes the challenge and the authentication service reports success. The subsequent payment authorisation is declined. The amount and reference are fictional, and this is a proposed acceptance scenario rather than an observed customer outcome.

The expected order decision is to withhold fulfilment and display an appropriate payment message. The support record should still show that authentication completed. Both statements can be true. Collapsing them into a single success flag makes the order harder to investigate.

<figure>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 235" role="img" aria-label="Illustrative order 314 has successful authentication, declined payment authorisation and fulfilment held" font-family="Inter, sans-serif">
<rect width="760" height="235" rx="18" fill="#0F1729"/>
<text x="28" y="38" fill="#AEB9CC" font-size="17">ILLUSTRATIVE ORDER 314 · €86</text>
<g fill="none" stroke-width="2"><rect x="25" y="70" width="220" height="112" rx="14" stroke="#3DDC97"/><rect x="270" y="70" width="220" height="112" rx="14" stroke="#E6C27A"/><rect x="515" y="70" width="220" height="112" rx="14" stroke="#6E9BFF"/><path d="M245 125H270M490 125H515" stroke="#AEB9CC"/></g>
<g text-anchor="middle" font-size="18" fill="#F4F7FC"><text x="135" y="106">Authentication</text><text x="380" y="106">Authorisation</text><text x="625" y="106">Fulfilment</text></g>
<g text-anchor="middle" font-size="24"><text x="135" y="148" fill="#3DDC97">Completed</text><text x="380" y="148" fill="#E6C27A">Declined</text><text x="625" y="148" fill="#6E9BFF">Held</text></g>
<text x="28" y="212" fill="#AEB9CC" font-size="14">Three distinct records support one clear order decision.</text>
</svg>
<figcaption>A successful authentication result should not overwrite the subsequent payment outcome.</figcaption>
</figure>

Now repeat the exercise with a delayed authorisation response. Ask support to find the pending attempt without requesting another payment. Once a verified final result arrives, check that the same order updates consistently. If a replayed event arrives later, it should not create a second fulfilment instruction.

Your developers should agree these expected behaviours with the provider’s documented event model. The example is a test brief, not a substitute for its integration specification.

## Ask for transaction-specific liability evidence

Liability shift should be a separate review item. Official provider guidance explains that eligible 3DS authentication can shift liability for fraudulent-type disputes, but also notes exceptions and excludes other dispute types from that protection. Verify the applicable treatment with your acquirer and the relevant scheme rules for the actual transaction. [Official guidance on 3DS2 liability shift](https://support.stripe.com/questions/liability-shift-with-frictionless-flow-for-3d-secure-v2-%283ds2%29?locale=en-GB)

Ask where the provider reports liability treatment and what each value means, including missing or unknown values. Keep the response associated with the payment reference. Avoid labelling an entire order protected solely because the customer completed a visible challenge.

For operations, the useful output is a documented escalation route. If authentication succeeded but the provider cannot explain the liability result, who investigates? What evidence can the merchant retrieve, and which information must remain in restricted systems? Have the provider demonstrate a redacted investigation rather than relying on a generic product description.

Keep ordinary delivery and refund evidence available regardless of the authentication path. A team handling a delivery complaint needs the relevant order records, not only a record of how the shopper authenticated.

## Give each incomplete outcome an owner

Use the following decision table as a proposed review agenda. Adapt the actions to the documented provider flow, your payment capture arrangements and your fulfilment policy.

| Observed state | Operational question | Proposed owner |
| --- | --- | --- |
| Customer action is still required | Can the shopper resume the existing flow? | Checkout team |
| Authentication result is missing | Where can the existing attempt be checked? | Integration support |
| Authentication succeeded, payment declined | Does the order remain unfulfilled with the correct message? | Payments operations |
| Payment outcome is unresolved | Who tracks the pending attempt to a verified conclusion? | Payments operations |
| Payment succeeded, browser never returned | Does server-side processing update the original order? | Integration team |
| Liability result is unknown | Who can explain the transaction-specific treatment? | Provider and acquirer contact |

Test these states with approved fixtures or a provider-led demonstration. Record the expected result before running each case. Keep a reference to the evidence and a short explanation of anything the test environment could not prove.

Include the customer message in the review. It should accurately distinguish a payment still being checked from a confirmed decline. Support should never need a customer’s one-time passcode to investigate the merchant order.

## Review the evidence before changing checkout policy

Ask the team to retrieve a sample order using only its merchant reference. It should be possible to follow authentication, authorisation and the fulfilment decision without reconstructing the journey from a customer screenshot. Document any missing link and its owner before expanding the integration.

For reporting, keep separate counts of authentication attempts, completed authentications, payment authorisations and orders fulfilled. Define how repeated attempts are counted. Compare equivalent devices and transaction types when investigating changes, and preserve the policy version used for each sample. An apparent improvement in challenge completion alone does not explain the final order outcome.

AQ Pay provides payment technology, while payment approval and applicable liability treatment depend on the relevant participants and rules. Bring a redacted sample transaction to a [payment orchestration review](/payment-orchestration) and [book an AQ Pay demo](/book-a-demo) to walk through the hand-off and the evidence your team will need.
