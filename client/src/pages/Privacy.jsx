import { Camera, Database, EyeOff, Handshake, Lock, MessageCircle, ShieldCheck, Trash2, Users } from 'lucide-react';
import { LegalPage } from '../components/LegalPage';
import { useAuth } from '../context/AuthContext';
import { useTitle } from '../hooks/useTitle';

// Keep this in sync with what the app really does: it's a promise to users.
export default function Privacy() {
  useTitle('Privacy & safety');
  const { config } = useAuth();
  const domains = config.collegeDomains;

  const sections = [
    {
      id: 'who-can-join',
      icon: Users,
      title: 'Who can use boomerang',
      body: (
        <p>
          Only SST students can create an account, using their college email
          {domains.length ? <> ({domains.map((d) => `@${d}`).join(', ')})</> : null}. The email domain is checked by our server, not just the website.
        </p>
      ),
    },
    {
      id: 'what-we-store',
      icon: Database,
      title: 'What we store',
      body: (
        <ul>
          <li>Your name, college email and password. Passwords are stored only as a one-way bcrypt hash, so nobody (including us) can read them.</li>
          <li>An optional profile photo and short bio.</li>
          <li>Your lost &amp; found reports, their photos, and your chat messages.</li>
          <li>In-app notifications (new messages, potential matches, resolved reports).</li>
        </ul>
      ),
    },
    {
      id: 'who-sees-what',
      icon: EyeOff,
      title: 'Who sees what',
      body: (
        <ul>
          <li><strong>Other students see:</strong> your name, profile photo, bio and the reports you post.</li>
          <li><strong>Never shown to others:</strong> your full email address and your password.</li>
          <li><strong>Only you see:</strong> the private "identifying details" on your reports. Use them to check that a claim is genuine.</li>
          <li><strong>Only the two people in a chat</strong> can read it. Our server checks this on every message.</li>
        </ul>
      ),
    },
    {
      id: 'photos',
      icon: Camera,
      title: 'Photo privacy',
      body: (
        <ul>
          <li>Photos of reported items are visible to every signed-in student, so cover ID numbers, card numbers, faces and addresses before uploading.</li>
          <li>Your browser strips hidden photo data (like GPS location) from JPG, PNG and WEBP photos before upload.</li>
          <li>For ID cards, bank cards and documents, keep one detail out of the photo so you can verify the real owner.</li>
        </ul>
      ),
    },
    {
      id: 'chatting',
      icon: MessageCircle,
      title: 'Chatting safely',
      body: (
        <ul>
          <li>Never share passwords, OTPs, full ID or card numbers, or bank details in chat.</li>
          <li>Ask a claimant to describe something that isn't in the photo before handing anything over.</li>
          <li>Nobody should ask you for money to return an item. Rewards are optional and only offered by owners.</li>
        </ul>
      ),
    },
    {
      id: 'safe-handovers',
      icon: Handshake,
      title: 'Safe hand-overs',
      body: (
        <ul>
          <li>Meet in a busy, public spot on campus, such as the library desk, main reception or the cafeteria, during the day.</li>
          <li>For ID cards, wallets and other valuables, you can hand them to the campus security desk or admin office instead.</li>
          <li>Once the item is back with its owner, mark the report <strong>Resolved</strong>.</li>
        </ul>
      ),
    },
    {
      id: 'your-control',
      icon: Trash2,
      title: 'Your control',
      body: (
        <ul>
          <li>Edit or delete your reports at any time. Deleting a report also deletes its photos.</li>
          <li>Update your name, bio and photo from your profile.</li>
          <li>To have your account removed entirely, contact the portal administrators.</li>
        </ul>
      ),
    },
    {
      id: 'security',
      icon: Lock,
      title: 'How we protect it',
      body: (
        <ul>
          <li>Sign-in sessions expire after 7 days, and changing your password signs out your other devices.</li>
          <li>Sign-in, sign-up and messaging are rate-limited to slow down abuse.</li>
          <li>Secrets like database and storage keys live only on our server, never in the website code.</li>
        </ul>
      ),
    },
  ];

  return (
    <LegalPage
      icon={ShieldCheck}
      title="Privacy & safety"
      intro="boomerang helps SST students get lost things back. Here's exactly what we keep, who can see it, and how to hand items over safely."
      updated="27 October 2026"
      sections={sections}
      related={{ to: '/terms', label: 'Read the Terms & conditions' }}
    />
  );
}
