---
{
  "title": "Choosing a payment gateway in India: test the whole checkout",
  "seoTitle": "Payment gateway in India: a checkout test guide",
  "description": "Compare a payment gateway in India using practical UPI, card, refund and settlement tests. Build a clear acceptance checklist before you launch.",
  "slug": "payment-gateway-in-india",
  "date": "2026-11-18",
  "category": "Guides",
  "market": "India & Asia",
  "primaryKeyword": "payment gateway in India",
  "keywords": ["UPI checkout", "card payment integration", "merchant settlement", "payment gateway comparison", "payment acceptance testing"],
  "coverAlt": "A dark navy checkout test bench with a phone, UPI and card test rows, and a gold pending-payment indicator.",
  "takeaways": ["Ask each shortlisted provider to demonstrate the same checkout scenarios on your customers’ devices.", "Record payment confirmation, order fulfilment and bank settlement as separate events.", "Make an unresolved payment, a repeated notification and a partial refund part of acceptance testing."],
  "faq": [
    {"q": "How should I choose a payment gateway in India?", "a": "Start with your business eligibility and customer payment methods, then give shortlisted providers the same checkout test brief. Include interrupted payments, refunds, settlement reports and support escalation before comparing the final commercial terms."},
    {"q": "Does successful UPI payment mean the merchant has received settlement?", "a": "Treat customer payment confirmation and credit to the merchant’s bank account as separate records. Ask the entity settling your funds to document the applicable timing and provide a report that connects payments to bank credits."},
    {"q": "Should my website mark an order paid when the customer returns?", "a": "A customer returning to your website is insufficient evidence by itself. Your integration should verify the payment through the provider’s supported server-side process and match it to the expected order, amount and currency."},
    {"q": "Can AQ Pay confirm which Indian payment methods my business can use?", "a": "Bring your entity details, products, customer locations and intended methods to a discussion. Availability and onboarding depend on the proposed processing partners and their review; a technology integration alone does not establish eligibility."}
  ]
}
---

Choosing a payment gateway in India becomes easier when every shortlisted provider has to pass the same checkout rehearsal. A list of supported payment methods is useful, but your team also needs to see what happens when a shopper leaves the app, a confirmation arrives late or finance cannot match a bank credit.

Prepare a short test brief before discussing [merchant services](/merchant-services). Include your business model, average order value, domestic or international customers, devices and fulfilment process. Then ask providers to demonstrate the scenarios below with your integration team. The output should be a set of observed results and agreed responsibilities that you can use to decide whether to launch.

## Define your payment gateway in India test brief

Start with three representative purchases. For a fictional homeware shop, these might be a ₹1,800 mobile order, a ₹4,500 desktop order and a ₹900 item returned from a larger basket. These are illustrative test amounts, not transaction limits or a claim about customer behaviour.

For each purchase, specify the device, payment method, expected order state and person responsible for checking the result. Give every provider the same brief. Let providers flag unsupported scenarios before anyone spends time building an integration.

Keep business eligibility as a prerequisite. Identify the entity that contracts with you and the party responsible for collecting and settling funds. Ask your adviser to confirm the authorisation position for the activity proposed. Our guide to the [RBI payment aggregator framework](/blog/rbi-payment-aggregator-guidelines) covers those responsibilities in more detail. This rehearsal focuses on how the checkout and your operations behave once that arrangement has been established.

## Rehearse the hand-off to UPI and back

Ask for a demonstration on the phones and browsers your customers actually use. Where the proposed integration supports opening a UPI app, test returning to the shop after completing payment, abandoning the attempt and closing the browser before returning. If the desktop flow uses a QR code, include expiry and a payment completed close to expiry.

Record what the shopper sees at each stage. Can they identify the order? Does a pending message explain how to check status? Does reopening the page preserve the original purchase reference? Ask the provider to show how your server learns the final outcome when the shopper never returns.

Keep credentials out of support conversations. NPCI’s UPI guidance explains that the UPI PIN authorises bank transactions and should not be shared. Your test instructions and support scripts should never ask a shopper to disclose it. [NPCI UPI frequently asked questions](https://www.npci.org.in/what-we-do/upi/faqs)

A useful acceptance result is specific. Write “the existing order changed from awaiting payment to paid after verification” and attach the relevant test reference. A screenshot of a green confirmation screen leaves too many unanswered questions.

## Test card payments against your order rules

Run a successful card purchase, an authentication cancellation and a declined attempt using the provider’s approved test facilities. Check the message, the inventory reservation and the options offered to the shopper. Have the integration team explain which verified payment state permits fulfilment in your chosen capture arrangement.

Provider documentation distinguishes payment verification from the browser’s return journey. For example, official integration guidance recommends checking payment and order status through server-side verification, with webhooks or an API query to handle missing callbacks. Follow the exact states and verification requirements of your selected provider. [Official checkout integration best practices](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/best-practices/)

For your acceptance brief, require order reference, expected amount and currency to match before releasing goods. Deliver the same test notification twice and check that the order is fulfilled once. Send an invalidly signed notification and confirm it cannot change the order. These are proposed acceptance controls; your developers should implement them against the contracted API and its documented event model.

Discuss these requirements alongside the [payment integration resources](/developers). Ask who owns the integration after launch, including secret rotation, plugin updates and investigation of delayed events.

## Keep payment, fulfilment and settlement visible

Give operations a simple view of three separate milestones. The first is a verified payment result, the second is the decision to fulfil the order, and the third is the merchant’s bank credit. Each needs its own evidence and timestamp.

<figure>
<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Three separate records for a test order: verified payment, fulfilment decision and matched bank credit" viewBox="0 0 760 230" font-family="Inter, sans-serif">
<rect width="760" height="230" rx="20" fill="#0F1729"/>
<text x="30" y="40" font-size="18" fill="#AEB9CC">ONE TEST ORDER · THREE RECORDS</text>
<path d="M235 124H280M480 124H525" stroke="#AEB9CC" stroke-width="2"/>
<rect x="25" y="72" width="210" height="105" rx="14" fill="#0F1729" stroke="#6E9BFF"/>
<rect x="275" y="72" width="210" height="105" rx="14" fill="#0F1729" stroke="#3DDC97"/>
<rect x="525" y="72" width="210" height="105" rx="14" fill="#0F1729" stroke="#E6C27A"/>
<g text-anchor="middle" font-size="19" fill="#F4F7FC"><text x="130" y="112">Payment verified</text><text x="380" y="112">Order released</text><text x="630" y="112">Bank credit matched</text></g>
<g text-anchor="middle" font-size="15" fill="#AEB9CC"><text x="130" y="145">Payment reference</text><text x="380" y="145">Fulfilment record</text><text x="630" y="145">Settlement reference</text></g>
<text x="30" y="207" font-size="14" fill="#AEB9CC">Record the evidence and time for each milestone independently.</text>
</svg>
<figcaption>A proposed acceptance record for your pilot. The spacing does not represent a settlement timetable.</figcaption>
</figure>

The RBI’s 2025 payment aggregator directions state that credit to the merchant’s account follows the agreement between the aggregator and merchant, which must transparently state settlement timelines. Ask for the actual contractual schedule, its trigger and the treatment of exceptions. [RBI Master Direction on payment aggregators, Table 1](https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12896)

Request a sample settlement file before signing. Your finance team should be able to identify the included payments, fees, refunds, adjustments and bank reference. Where a report cannot be demonstrated in the sandbox, record it as awaiting evidence and agree how a controlled live pilot will verify it.

## Use an acceptance table in the provider demo

The following checklist is an original sample for the fictional shop. Adapt the expected outcomes to your fulfilment policy and the provider’s documented integration. Keep screenshots and references free of card credentials and unnecessary personal data.

| Scenario | Evidence to capture | Acceptance question |
| --- | --- | --- |
| Mobile UPI app hand-off | Order reference and verified final status | Can the shop recover the result without a browser return? |
| Shopper abandons authentication | Order state and customer message | Is the order kept out of fulfilment? |
| Payment remains unresolved | Status query result and escalation record | Can support investigate without asking for another payment? |
| Notification delivered twice | Event references and fulfilment history | Is the order released only once? |
| Partial refund of ₹900 | Original payment and refund reference | Can support distinguish requested and completed refund states? |
| Settlement reaches the bank | Provider report and bank reference | Can finance explain every adjustment? |

Assign an owner and a due date to every unresolved row. Do not allow a successful card test to stand in for a UPI test, or one desktop browser to stand in for a mobile app journey. A provider may support both methods while your particular integration still needs work.

## Compare commercial terms using the same sample month

Ask each provider to price an identical hypothetical month using your proposed payment mix, order values and refund activity. Request separate lines for processing, platform or subscription charges, optional settlement services and taxes where applicable. Have the provider identify which charges remain payable when a purchase is refunded.

Keep the assumptions attached to the quote. An international-card proposal and a domestic-only proposal need separate evaluation. Avoid treating a headline rate as the entire bill, and avoid assuming every UPI funding source or service arrangement has identical commercial treatment. Ask for written confirmation of the methods and fees that apply to your business.

Finally, rehearse a support escalation with a harmless test case. Supply an order reference, timestamp and observed status. Check whether the response identifies the next action and the team responsible. Record any support coverage or response commitments in the agreement.

## Turn the rehearsal into a launch decision

Before launch, review the evidence with engineering, finance and customer support. Close missing verification controls, unresolved fulfilment behaviour and unexplained settlement fields. Agree a limited pilot scope and a way to pause new payment attempts if an investigation is needed. Keep existing orders available for status checks and support.

AQ Pay provides payment technology; processing availability and merchant acceptance depend on the relevant partners’ review. Bring your completed test brief to a [merchant services discussion](/merchant-services) and [book an AQ Pay demo](/book-a-demo) to review the proposed integration and responsibilities for your business.
