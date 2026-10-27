import { Ban, CreditCard, FileCheck, Gavel, Handshake, HeartHandshake, RefreshCw, Scale, ScrollText, UserCheck } from 'lucide-react';
import { LegalPage } from '../components/LegalPage';
import { useTitle } from '../hooks/useTitle';

const SECTIONS = [
  {
    id: 'eligibility',
    icon: UserCheck,
    title: 'Who can use boomerang',
    body: (
      <ul>
        <li>boomerang is only for current SST students, signing up with their own college email.</li>
        <li>One account per person. Keep your password private; you're responsible for what happens on your account.</li>
        <li>Don't create accounts for, or pretend to be, someone else.</li>
      </ul>
    ),
  },
  {
    id: 'honest-reports',
    icon: FileCheck,
    title: 'Honest reports',
    body: (
      <ul>
        <li>Only post real lost or found items, with accurate descriptions and genuine photos of the actual item.</li>
        <li>Don't use reports to sell, advertise, promote or joke. One report per item, please.</li>
        <li>Mark your report <strong>Resolved</strong> once the item is back, or delete it if it's no longer relevant.</li>
      </ul>
    ),
  },
  {
    id: 'community',
    icon: HeartHandshake,
    title: 'Community guidelines',
    body: (
      <ul>
        <li>Be respectful. No harassment, threats, hate speech, spam or offensive images.</li>
        <li>Only message people about the item in question.</li>
        <li>Never post or forward someone else's personal information (phone numbers, addresses, ID numbers).</li>
      </ul>
    ),
  },
  {
    id: 'claims',
    icon: Handshake,
    title: 'Claims & hand-overs',
    body: (
      <ul>
        <li>boomerang only connects people. It never holds, inspects or delivers items.</li>
        <li>Finders decide whether a claim is convincing. Claimants should be ready to describe details that aren't in the photos.</li>
        <li>Nobody may demand payment to return an item. Rewards are optional and agreed between students.</li>
        <li>"Potential matches" are automatic suggestions only. They don't prove ownership.</li>
      </ul>
    ),
  },
  {
    id: 'valuables',
    icon: CreditCard,
    title: 'IDs, cards & valuables',
    body: (
      <ul>
        <li>Never post full ID numbers, card numbers or documents in photos or text.</li>
        <li>For ID cards, bank cards, phones and laptops, consider handing the item to the campus security desk or admin office.</li>
      </ul>
    ),
  },
  {
    id: 'prohibited',
    icon: Ban,
    title: 'Not allowed',
    body: (
      <ul>
        <li>Anything illegal or unsafe: weapons, drugs, alcohol, stolen goods, or items you aren't allowed to have on campus.</li>
        <li>If you find something dangerous or suspicious, don't post it. Take it to campus security.</li>
      </ul>
    ),
  },
  {
    id: 'moderation',
    icon: Gavel,
    title: 'Moderation',
    body: (
      <p>
        Portal administrators may edit or remove reports, messages or accounts that break these terms, and may share information with campus
        authorities when it's needed for someone's safety.
      </p>
    ),
  },
  {
    id: 'no-guarantees',
    icon: Scale,
    title: 'No guarantees',
    body: (
      <p>
        boomerang is provided as-is, for the campus community. We can't guarantee that items will be found, that information posted by others is
        accurate, or that every user acts honestly, and we aren't responsible for losses or disputes arising from hand-overs. Use your judgement.
      </p>
    ),
  },
  {
    id: 'changes',
    icon: RefreshCw,
    title: 'Changes to these terms',
    body: (
      <p>
        We may update these terms as the portal grows; the date at the top shows the latest version. Continuing to use boomerang after an update
        means you accept the new terms.
      </p>
    ),
  },
];

export default function Terms() {
  useTitle('Terms & conditions');
  return (
    <LegalPage
      icon={ScrollText}
      title="Terms & conditions"
      intro="The ground rules for using boomerang, so every lost thing has the best chance of getting back to its owner, safely."
      updated="27 October 2026"
      sections={SECTIONS}
      related={{ to: '/privacy', label: 'Read the Privacy & safety statement' }}
    />
  );
}
