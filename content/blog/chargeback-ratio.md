---
{
  "title": "Chargeback ratio: why your acquirer’s number differs from yours",
  "seoTitle": "Chargeback ratio: how to calculate and lower it",
  "description": "See how Visa and Mastercard calculate a chargeback ratio, why your dashboard and acquirer disagree, and practical steps to bring the ratio down.",
  "slug": "chargeback-ratio",
  "date": "2026-11-17",
  "market": "Global",
  "category": "Guides",
  "primaryKeyword": "chargeback ratio",
  "keywords": ["dispute rate", "VAMP ratio", "Mastercard Excessive Chargeback Program", "card monitoring programs", "reduce chargebacks"],
  "coverAlt": "A fraction places April’s 230 Mastercard chargebacks over March’s 18,400 sales, giving 125 basis points.",
  "takeaways": [
    "Visa’s VAMP ratio adds fraud reports to disputes and divides by settled transactions, so it can be higher than a disputes-only figure.",
    "Mastercard divides one month’s chargebacks by the previous month’s transactions, so a sales dip or spike moves the ratio even when disputes stay flat.",
    "Track the scheme calculations, the raw counts and a cohort view by original sale month; each answers a different question.",
    "Lower the ratio by fixing the reasons behind disputes first, then by resolving genuine complaints before they become chargebacks."
  ],
  "faq": [
    {"q": "What is a good chargeback ratio?", "a": "There is no single safe number. The card scheme thresholds are a ceiling, and your acquiring agreement may set its own lower limits, so ask your acquirer which figures apply to you. The trend and the reasons behind the disputes matter as much as one month’s ratio."},
    {"q": "Why does my chargeback ratio differ from the one my acquirer reports?", "a": "Usually because the inputs differ: which month the denominator comes from, whether fraud reports are included, which card brands and channels are counted, and whether disputes are dated by sale or by receipt. Ask the acquirer for the exact formula and the raw counts behind it."},
    {"q": "Do Visa fraud reports count towards the VAMP ratio without a dispute?", "a": "Yes. Visa’s VAMP ratio counts issuer fraud reports (TC40) as well as disputes (TC15), subject to its published exclusions, such as fraud qualified for Compelling Evidence 3.0. That is why a merchant with modest dispute numbers can still see a higher VAMP ratio."},
    {"q": "Does refunding a customer reduce my chargeback ratio?", "a": "A refund made before the cardholder disputes the payment can prevent a chargeback. Once a dispute has been raised, a refund may not remove it from the count and can lead to paying twice, so check the correct process with your acquirer."}
  ]
}
---

Your finance team says the chargeback ratio was 0.8% last month. Your acquirer’s monitoring email says something closer to 1.4%. Nobody made an arithmetic mistake. The two figures simply use different numerators, different denominators and, often, different months.

That gap matters. Card scheme monitoring programmes, reserve reviews and pricing conversations all start from the acquirer’s figure, not yours. Merchants in disputes-heavy sectors such as subscriptions, travel and digital goods feel this most, which is why it is one of the first things discussed when setting up a [high-risk merchant account](/high-risk-processing). This guide shows how the major schemes calculate the ratio, works through an example, and sets out practical ways to bring the number down. Scheme rules change, so confirm the current thresholds for your region with your acquirer.

## What a chargeback ratio measures

At its simplest, a chargeback ratio is the number of chargebacks divided by the number of transactions over a period. A chargeback is a payment reversed by the cardholder’s issuing bank after the cardholder disputes it, for reasons ranging from suspected fraud to goods that never arrived.

The definition hides three choices:

- **What counts in the numerator.** Disputes only, or disputes plus issuer fraud reports?
- **What counts in the denominator.** All transactions, settled transactions only, or card-not-present transactions only?
- **Which months.** Disputes and sales from the same month, or this month’s disputes over last month’s sales?

Each scheme makes these choices differently, and your internal “dispute rate” probably makes them differently again. Count transactions, not money: the programmes described below are based on counts, although some regions add a value condition.

## How Visa calculates the VAMP ratio

Visa’s Acquirer Monitoring Program (VAMP) replaced its separate fraud and dispute monitoring programmes. According to Visa’s published [VAMP fact sheet](https://corporate.visa.com/content/dam/VCOM/corporate/visa-perspectives/security-and-trust/documents/visa-acquirer-monitoring-program-fact-sheet-2025.pdf), the ratio is:

**VAMP ratio = count of fraud reports (TC40) + count of disputes (TC15) ÷ count of settled transactions (TC05)**

Visa describes the programme as covering card-not-present transactions, both domestic and cross-border. Two points catch merchants out:

1. **Fraud reports count, even without a dispute.** When an issuer reports a transaction as fraudulent, it adds to the numerator. A merchant with few formal disputes can still have a high VAMP ratio.
2. **Some items are excluded.** The fact sheet excludes disputes resolved through pre-dispute solutions and fraud reports that qualify for Compelling Evidence 3.0. Ask your acquirer which of these tools are available to you and how they show up in your reporting.

For merchants in Asia Pacific, Canada, Europe and the United States, the fact sheet lists the “excessive” merchant threshold as a VAMP ratio of 220 basis points, falling to **150 basis points (1.5%) from 1 April 2026**, combined with a minimum monthly count of 1,500 fraud reports and disputes. Latin America and the Caribbean is listed at 150 basis points with the same count. Central and Eastern Europe, the Middle East and Africa is listed at 220 basis points with a count of at least 150 and an amount of at least USD 75,000. Acquirers are measured across their whole portfolio at much lower levels, which is one reason an acquirer may raise concerns well before a merchant reaches its own threshold.

## How Mastercard calculates its chargeback ratio

Mastercard’s [Security Rules and Procedures, Merchant Edition](https://www.mastercard.com/content/dam/mccom/shared/business/support/rules-pdfs/SPME-Manual.pdf) defines the Excessive Chargeback Program measurement in basis points: the chargebacks an acquirer receives for a merchant in a calendar month, divided by the Mastercard transactions acquired for that merchant in the **preceding** month, multiplied by 10,000.

That one-month lag is the detail that most often explains a surprising figure. The numerical thresholds for the excessive chargeback categories are set out in Mastercard documentation that your acquirer works from, so ask your acquirer for the current figures rather than relying on numbers copied from older articles.

<figure><svg viewBox="0 0 760 300" role="img" aria-label="Visa divides fraud reports and disputes by settled transactions in the same month; Mastercard divides this month’s chargebacks by last month’s transactions" font-family="Inter, sans-serif"><rect width="760" height="300" rx="16" fill="#0F1729"/><text x="30" y="44" fill="#F4F7FC" font-size="17" font-weight="700">Which month feeds each part of the ratio?</text><g font-size="13" fill="#AEB9CC" text-anchor="middle"><text x="355" y="80">March</text><text x="565" y="80">April</text></g><path d="M260 92 H710" stroke="rgba(255,255,255,.18)" stroke-width="2"/><text x="30" y="140" fill="#6E9BFF" font-size="16" font-weight="700">Visa VAMP</text><text x="30" y="162" fill="#AEB9CC" font-size="12">card-not-present</text><rect x="470" y="112" width="190" height="34" rx="8" fill="none" stroke="#6E9BFF" stroke-width="2"/><text x="565" y="134" fill="#F4F7FC" font-size="13" text-anchor="middle">Fraud reports + disputes</text><path d="M480 154 H650" stroke="#6E9BFF" stroke-width="2"/><rect x="470" y="162" width="190" height="34" rx="8" fill="none" stroke="#6E9BFF" stroke-width="2"/><text x="565" y="184" fill="#F4F7FC" font-size="13" text-anchor="middle">Settled transactions</text><text x="30" y="236" fill="#E6C27A" font-size="16" font-weight="700">Mastercard</text><text x="30" y="258" fill="#AEB9CC" font-size="12">Excessive Chargeback Program</text><rect x="470" y="212" width="190" height="34" rx="8" fill="none" stroke="#E6C27A" stroke-width="2"/><text x="565" y="234" fill="#F4F7FC" font-size="13" text-anchor="middle">Chargebacks received</text><rect x="260" y="250" width="190" height="34" rx="8" fill="none" stroke="#3DDC97" stroke-width="2"/><text x="355" y="272" fill="#F4F7FC" font-size="13" text-anchor="middle">Transactions acquired</text><path d="M452 262 L470 236" stroke="#E6C27A" stroke-width="2"/><text x="478" y="272" fill="#E6C27A" font-size="13">÷ previous month</text></svg><figcaption>Visa compares counts from the same reporting month; Mastercard compares this month’s chargebacks with the previous month’s transactions. Simplified from the scheme documents linked in this guide.</figcaption></figure>

## A worked chargeback ratio example

**Illustrative example.** An online subscription merchant reviews April. The figures are invented to show the mechanics, not drawn from any real business.

| Measure | Inputs | Result |
| --- | --- | --- |
| Visa VAMP ratio | (410 fraud reports + 300 disputes) ÷ 52,000 settled card-not-present transactions | 710 ÷ 52,000 = 1.37% (137 bps) |
| Visa disputes only | 300 disputes ÷ 52,000 transactions | 0.58% |
| Mastercard measurement | 230 April chargebacks ÷ 18,400 March transactions | 1.25% (125 bps) |
| Mastercard, if March had been a promotion month | 230 ÷ 26,000 | 0.88% (88 bps) |
| Mastercard, if March had been a quiet month | 230 ÷ 11,500 | 2.00% (200 bps) |

Three lessons come out of this table.

First, the Visa figure more than doubles once fraud reports are added. If the internal dashboard counts only disputes, it will look healthier than the scheme view.

Second, the Visa count here is 710, below the 1,500 minimum listed for excessive merchant identification in the regions mentioned above. A small merchant can have a high ratio without meeting the count condition, while a large merchant can meet the count with a modest ratio. Track both.

Third, the Mastercard figure moves with last month’s sales, even though April’s chargebacks did not change. A merchant that is shrinking, or that pauses marketing, can watch the ratio rise with no change in customer behaviour. Plan for this before a seasonal dip, not after the monitoring email arrives.

## Build a reporting view that matches the acquirer

Ask your acquirer for three things: the exact formula used for each card brand, the raw numerator and denominator counts each month, and the date field used to assign a dispute to a month. Then keep three views side by side:

1. **Scheme views.** Recreate the Visa and Mastercard calculations as closely as the data allows, by card brand and, where relevant, by channel.
2. **Raw counts.** Fraud reports, disputes and transactions, so you can see when a count condition matters more than a ratio.
3. **Cohort view.** Disputes grouped by the month of the original sale. Disputes often arrive weeks after the purchase, so this is the view that links a spike to a product launch, a billing change or a fraud attack.

If you process through more than one acquirer, each one sees only its own share. A [payment orchestration platform](/payment-orchestration) can bring dispute and transaction data from several providers into one place, which makes the merchant-wide picture easier to keep, though each acquirer will still monitor its own portfolio.

## How to bring a chargeback ratio down

Start with the reason codes. Fraud disputes and consumer disputes need different fixes, and treating them as one number hides both.

### Reduce disputes from genuine customers

- **Make the charge recognisable.** Check that the billing descriptor matches the brand name the customer knows and includes a way to reach you. Unrecognised charges often become disputes.
- **Make cancelling easy.** For subscriptions, a clear cancellation route and a confirmation email reduce “I cancelled but was still charged” disputes. Check the scheme rules on trials and recurring billing with your acquirer.
- **Refund before the bank gets involved.** A customer who gets a quick answer from support has less reason to call their bank. Once a dispute has started, follow your acquirer’s process rather than issuing a separate refund, which can mean paying twice.
- **Evidence fulfilment.** Keep delivery confirmation, access logs for digital goods and clear terms at checkout, so you can respond when a dispute is unfounded.

### Reduce fraud reports and fraud disputes

- **Authenticate where it helps.** EMV 3-D Secure lets the issuer verify the cardholder. Our guide to [PSD2 strong customer authentication](/blog/psd2-strong-customer-authentication) shows how to track the shopper’s path from challenge to authorisation so authentication does not simply move losses elsewhere.
- **Watch for card testing.** Bursts of small or declined authorisations can signal enumeration attacks. Visa monitors enumeration separately within VAMP, so velocity limits and bot controls protect both your ratios and your authorisation reputation.
- **Use pre-dispute tools where available.** Visa’s fact sheet excludes disputes resolved through pre-dispute solutions from the VAMP count. Ask your acquirer which services they support and what they cost.

### Keep the conversation open with your acquirer

If a ratio is rising, tell your acquirer early, with the cause and the remediation plan. Acquirers make their own decisions about reserves, limits and continuation, and nobody can promise a particular outcome, but a documented plan is easier to discuss than a surprise. Our guide to [high-risk merchant account underwriting](/blog/high-risk-merchant-account-underwriting) explains what acquirers usually want to see when they assess dispute history.

## A monthly chargeback checklist

1. Pull the acquirer’s figures by card brand and reconcile them with your own calculation.
2. Check both the ratio and the count against the thresholds your acquirer confirms for your region.
3. Split disputes by reason code and by original sale month.
4. Review the five largest reasons and assign each an owner and a fix.
5. Look ahead: will next month’s Mastercard denominator fall because of a seasonal dip or a paused campaign?
6. Record what changed, so next month’s review can test whether it worked.

None of this is legal advice. For the rules that apply to your business, check with your acquirer and, where appropriate, your adviser.

## Next step

If chargebacks are shaping your processing options, start with how AQ Pay supports [high-risk payment processing](/high-risk-processing) and the [merchant services](/merchant-services) available alongside it. AQ Pay is a technology provider and acquirers make the approval decisions, but we can help you organise the data they ask for. [Book a demo](/book-a-demo) and bring a month of anonymised dispute data to walk through the calculation together.
