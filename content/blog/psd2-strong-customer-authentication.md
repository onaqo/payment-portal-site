---
{
  "title": "PSD2 strong customer authentication: where did the checkout lose the order?",
  "seoTitle": "PSD2 strong customer authentication at checkout",
  "description": "Trace PSD2 strong customer authentication from an exemption request to a paid order. Use a worked checkout example to find where customers drop out.",
  "slug": "psd2-strong-customer-authentication",
  "date": "2026-11-16",
  "market": "UK & Europe",
  "category": "Compliance",
  "primaryKeyword": "PSD2 strong customer authentication",
  "keywords": ["3-D Secure challenge", "transaction risk analysis", "card authentication", "checkout completion"],
  "coverAlt": "Three nested rings show 120 issuer challenges requested, 90 completed and 81 orders authorised.",
  "takeaways": ["Give authentication and payment authorisation their own outcomes in the order history.", "Agree with your acquirer which transactions can be considered for an exemption and how to handle an issuer request for authentication.", "Count unique orders at every step so repeated attempts do not inflate checkout completion."],
  "faq": [
    {"q":"Can a merchant decide to exempt a card payment?","a":"Discuss eligibility with your acquiring partner. For transaction risk analysis the payer’s payment service provider has the final decision on whether to accept or apply the exemption."},
    {"q":"Does a successful challenge mean the merchant can dispatch the order?","a":"Check the payment status and your capture and fulfilment policy. A successful authentication describes the identity check; the order record still needs the required payment outcome."},
    {"q":"What should a support agent do if the shopper closes the banking app?","a":"Look up the order and check the provider’s latest status before suggesting a new attempt. Give the shopper an explicit next step once you know whether the payment is complete, pending or ready to try again."}
  ]
}
---

A shopper approves a payment in their banking app, returns to the shop and sees an empty basket. Did authentication fail? Did the bank decline the payment? Or did the merchant simply lose track of the order? All three can sound like “checkout failed” to customer support. Each calls for a different fix.

For a platform evaluating PSD2 strong customer authentication, ask your [payment orchestration provider](/payment-orchestration) to trace one order through the issuer decision, the shopper’s return and the payment result. Use the same order reference at each step. This guide focuses on customer-initiated online card purchases within the EU framework. Confirm the countries, transaction types and applicable rules with your acquirer before applying the approach to a particular market.

## What PSD2 strong customer authentication changes at checkout

Strong customer authentication uses at least two independent elements drawn from knowledge, possession and inherence. In everyday terms those are something the customer knows, has or is. Article 97 of PSD2 addresses when a payment service provider must apply authentication. For remote electronic payment initiation, it also ties authentication to the specific amount and payee. If the basket value changes while the shopper is away, have the integration team check with the provider how the revised order should proceed. [PSD2, Articles 4 and 97](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX%3A02015L2366-20250117)

EMV 3-D Secure gives issuers a way to authenticate cardholders in online checkout. A challenge is the path where the issuer asks the shopper to take an additional step. The issuer can also assess an authentication request through the frictionless flow. A merchant dashboard that records only whether a challenge appeared cannot tell you which exemption, if any, was used. Ask what the provider actually observed and leave an outcome unknown where the evidence ends. [EMVCo’s explanation of the challenge flow](https://www.emvco.com/dynamic/emv-3-d-secure-whitepaper-v2/challenge-flow/business-overview/)

## Give the exemption request its own record

Transaction risk analysis is one possible basis for an exemption. The European Banking Authority explains that the payer’s provider has the final decision on whether to accept or apply it. An issuer may require authentication even when an acquirer considers the transaction eligible. Get the agreed eligibility conditions and the provider’s response meanings from the acquiring team. Keep the request you sent distinguishable from the response you received. [EBA clarification on the transaction risk analysis exemption](https://www.eba.europa.eu/single-rule-book-qa/qna/view/publicId/2018_4034)

For a pilot, ask the analyst to start with one merchant, one checkout channel and one currency. Record the order reference, payment attempt reference, requested exemption if any, issuer response, challenge outcome if reported, and authorisation result. Agree how long an unfinished order stays pending before you classify it for reporting. Otherwise last night’s incomplete attempt may turn into this morning’s successful payment while two dashboards continue to disagree.

## Find the missing orders in a worked example

**Illustrative example.** A test cohort contains 120 distinct orders for which the issuer requested a challenge. Assume one challenge per order, one authorisation request per completed challenge, and a closed reporting window. Ninety shoppers completed the challenge. Of those orders, 81 received authorisation. Start your analysis by writing the denominator beside every percentage.

| Question | Calculation | What the number tells the team |
| --- | --- | --- |
| How often did shoppers complete the challenge? | 90 ÷ 120 = 75% | Inspect the 30 journeys without a completed challenge. |
| How often did authorisation succeed after completion? | 81 ÷ 90 = 90% | Review the nine orders that reached authorisation and did not receive approval. |
| How many challenged orders reached authorisation approval? | 81 ÷ 120 = 67.5% | Compare like cohorts using one outcome per order. |

<figure><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 160" role="img" aria-label="Of 120 challenged orders, 90 completed authentication and 81 received authorisation" font-family="Inter, sans-serif"><rect width="760" height="160" rx="15" fill="#0F1729"/><g font-size="18" fill="#F4F7FC"><text x="18" y="38">Challenge requested</text><text x="18" y="84">Challenge complete</text><text x="18" y="130">Payment authorised</text></g><g><rect x="235" y="19" width="432" height="22" rx="5" fill="#6E9BFF"/><rect x="235" y="65" width="324" height="22" rx="5" fill="#E6C27A"/><rect x="235" y="111" width="292" height="22" rx="5" fill="#3DDC97"/></g><g font-size="18" fill="#F4F7FC"><text x="680" y="38">120</text><text x="574" y="84">90</text><text x="542" y="130">81</text></g></svg><figcaption>Illustrative counts for the same cohort. The second and third bars contain only orders that reached the preceding step.</figcaption></figure>

The first investigation belongs with the checkout team. Look at whether the challenge opened, whether the shopper returned and whether the provider delivered a final event. The second belongs with the payments team. Check the authorisation responses for the nine orders, then decide with the acquirer which outcomes require action. Calling all 39 orders “issuer declines” would send the checkout team looking in the wrong place.

Keep a separate count for capture if your business captures later. Consider a retailer that authorises when an order is placed and captures when a parcel ships. Its warehouse needs the agreed release condition, while finance needs the eventual captured amount. Neither team can infer its own result from the count of completed challenges.

## Test the shopper’s return on a real device

1. Start a test order on a phone and follow the issuer challenge into the banking app. On return, check whether the shopper sees the same order, amount and merchant.
2. Repeat the test and close the browser before returning. Have support retrieve the status from the provider and identify the next action using only the order number.
3. Deliver a duplicate test notification through the provider’s supported test tools. Check that the merchant records one payment outcome and creates one fulfilment instruction.
4. Test an explicit authentication requirement after an exemption request. Make sure the shopper can reach the provider’s supported authentication flow from the original order and that earlier attempts remain visible.

Use the [developer integration guide](/developers) to prepare the status and notification questions for your engineering team. If the provider response is uncertain, resolve the existing attempt before considering another processor. The [smart payment routing guide](/blog/smart-payment-routing) includes a routing worksheet for documenting that decision and the reference support will need.

## Decide what to change after the pilot

Select a small sample from each incomplete stage and reconstruct each journey in time order. For a shopper who returned to an empty basket, compare the order reference before the redirect and after the return. For a shopper who completed the challenge and received a decline, find the authorisation response tied to that attempt. A single change to the return page could help the first group while having no effect on the second.

When you compare two weeks, keep the merchant, channel and order definitions visible. A new mobile checkout or a different mix of issuing countries can change what the aggregate rate appears to say. Agree who reviews pending cases, when a case is closed, and who can authorise a change to the exemption request policy. Bring a redacted order timeline to a [payment orchestration walkthrough](/book-a-demo) so the team can demonstrate each decision against your own checkout flow.
