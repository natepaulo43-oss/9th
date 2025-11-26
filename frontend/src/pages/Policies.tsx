import React, { useEffect } from 'react';
import './Policies.css';

type PolicySection = 'shipping' | 'terms' | 'privacy';

interface PoliciesProps {
  defaultSection?: PolicySection;
}

const sections: {
  id: PolicySection;
  title: string;
  body: string[];
  highlights?: string[];
}[] = [
  {
    id: 'shipping',
    title: 'Shipping Policy',
    body: [
      'Shipping availiable worldwide.',
      'Pre-Orders will all be shipped out on the dropdate.',
    ],
    highlights: [
      'Free Shipping. All the time.',
      'Customers are responsible for any import duties or taxes assessed by their country.',
    ],
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    body: [
      'By purchasing from 9THFORM you agree to use our products for personal, non-commercial purposes unless you have a separate written agreement with us. Email hello@9thform.com for any questions.',
      'Prices, product availability, and shipping windows can change without notice. We reserve the right to refuse or cancel an order at any time, and will issue a full refund if that occurs.',
      'All intellectual property on this site—including logos, copy, imagery, and product designs—belongs to 9THFORM. Do not replicate or redistribute any assets without express permission.',
    ],
    highlights: [
      'Chargebacks filed without contacting support first may result in permanent account suspension.',
      'Misuse of discount codes or automated purchasing tools is prohibited.',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    body: [
      'We only collect the information necessary to fulfill your order, provide customer support, and improve the experience on 9thform.com.',
      'Payment data is securely handled by STRIPE. We never store or have access to your credit card number.',
      'Emails can expect a response within 72 hours.',
    ],
    highlights: [
      'Cookies are used to remember cart items and analyze anonymous site traffic.',
      'We do not sell or rent customer data—ever.',
    ],
  },
];

const Policies: React.FC<PoliciesProps> = ({ defaultSection }) => {
  useEffect(() => {
    if (!defaultSection) return;
    const target = document.getElementById(`policy-${defaultSection}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [defaultSection]);

  return (
    <div className="policies-page">
      <div className="policies-hero">
        <p className="policies-tagline">Transparency for every drop.</p>
        <h1>Policies & Support</h1>
        <p className="policies-description">
          Everything you need to know about shipping timelines, our community standards, and how we
          protect your privacy—all in one place.
        </p>
      </div>

      <div className="policies-content">
        {sections.map((section) => (
          <section key={section.id} id={`policy-${section.id}`} className="policy-section">
            <div className="policy-header">
              <p className="policy-label">{section.id} policy</p>
              <h2>{section.title}</h2>
            </div>
            {section.body.map((paragraph, index) => (
              <p key={index} className="policy-paragraph">
                {paragraph}
              </p>
            ))}
            {section.highlights && (
              <ul className="policy-highlights">
                {section.highlights.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
};

export default Policies;
