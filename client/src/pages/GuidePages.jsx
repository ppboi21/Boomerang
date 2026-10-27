import {
  Ban,
  BadgeCheck,
  Building2,
  Camera,
  CircleCheck,
  Clock,
  CreditCard,
  EyeOff,
  Flag,
  Handshake,
  HeartHandshake,
  ImageOff,
  KeyRound,
  Lock,
  MapPin,
  MessageCircle,
  MessageSquareWarning,
  ScanSearch,
  ShieldAlert,
  Smile,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import { LegalPage } from '../components/LegalPage';
import { useTitle } from '../hooks/useTitle';

// Four standalone guides linked from the footer. Content matches what the app
// actually does; keep it in sync if features change.

const UPDATED = '27 October 2026';

export function CommunityGuidelines() {
  useTitle('Community guidelines');
  const sections = [
    {
      id: 'spirit',
      icon: HeartHandshake,
      title: 'The spirit of boomerang',
      body: (
        <p>
          boomerang works because students look out for each other. Every report is someone's stressful morning or someone's good deed. Treat
          both with the same respect you'd want if it were your phone, keys or ID card.
        </p>
      ),
    },
    {
      id: 'be-kind',
      icon: Smile,
      title: 'Be kind and respectful',
      body: (
        <ul>
          <li>No harassment, threats, bullying, hate speech or slurs, in reports or in chat.</li>
          <li>Assume good intent. A claimant asking questions is being careful, not rude.</li>
          <li>Say thank you. It goes a long way.</li>
        </ul>
      ),
    },
    {
      id: 'honest',
      icon: BadgeCheck,
      title: 'Be honest',
      body: (
        <ul>
          <li>Only claim items that are genuinely yours. False claims hurt the real owner.</li>
          <li>Describe items accurately and use real photos of the actual item, never pictures from the internet.</li>
          <li>Update your report when things change, and mark it <strong>Resolved</strong> when the item is back.</li>
        </ul>
      ),
    },
    {
      id: 'on-topic',
      icon: MessageCircle,
      title: 'Keep it on topic',
      body: (
        <ul>
          <li>Chats are for returning items. Don't use them to ask people out, sell things or promote anything.</li>
          <li>No spam, chain messages, memes in reports, or duplicate posts for the same item.</li>
        </ul>
      ),
    },
    {
      id: 'privacy',
      icon: EyeOff,
      title: "Respect others' privacy",
      body: (
        <ul>
          <li>Never post or forward someone else's phone number, address, ID number or photos of their face.</li>
          <li>Don't screenshot and share private chats outside the app.</li>
        </ul>
      ),
    },
    {
      id: 'not-allowed',
      icon: Ban,
      title: 'Not allowed on boomerang',
      body: (
        <ul>
          <li>Weapons, drugs, alcohol, stolen goods, or anything you aren't allowed to have on campus.</li>
          <li>Explicit, violent or offensive images and text.</li>
          <li>Impersonating another student, staff member or the portal itself.</li>
        </ul>
      ),
    },
    {
      id: 'consequences',
      icon: Flag,
      title: 'If someone breaks the rules',
      body: (
        <p>
          Don't argue in chat. Stop replying and tell the portal administrators or campus security. Reports, messages or accounts that break
          these guidelines may be removed.
        </p>
      ),
    },
  ];
  return (
    <LegalPage
      icon={Users}
      title="Community guidelines"
      intro="A few simple rules that keep boomerang friendly, honest and useful for every SST student."
      updated={UPDATED}
      sections={sections}
      related={{ to: '/terms', label: 'Read the full Terms & conditions' }}
    />
  );
}

export function SafeHandovers() {
  useTitle('Safe hand-overs');
  const sections = [
    {
      id: 'verify-first',
      icon: ScanSearch,
      title: 'Verify before you hand over',
      body: (
        <ul>
          <li>Ask the claimant to describe something that isn't in the photo: a scratch, a sticker, what's inside, the lock-screen wallpaper.</li>
          <li>Compare their answer with the private "identifying details" on your report (only you can see those).</li>
          <li>Not convinced? Politely say no. You can always ask more questions or let campus security decide.</li>
        </ul>
      ),
    },
    {
      id: 'where',
      icon: MapPin,
      title: 'Meet somewhere public',
      body: (
        <ul>
          <li>Pick a busy spot on campus: the library desk, main reception, the cafeteria or the security desk.</li>
          <li>Never meet in an isolated place, a hostel room or off campus.</li>
        </ul>
      ),
    },
    {
      id: 'when',
      icon: Clock,
      title: 'Pick a sensible time',
      body: (
        <ul>
          <li>Meet during the day, between classes or at lunch, when lots of people are around.</li>
          <li>Agree on the time and place in the boomerang chat so there's a record of it.</li>
        </ul>
      ),
    },
    {
      id: 'valuables',
      icon: CreditCard,
      title: 'IDs, cards and valuables',
      body: (
        <ul>
          <li>For ID cards, bank cards, phones and laptops, consider handing the item to the campus security desk or admin office instead.</li>
          <li>The owner can collect it there with their own ID, so you never have to verify it yourself.</li>
        </ul>
      ),
    },
    {
      id: 'money',
      icon: KeyRound,
      title: 'No money for returns',
      body: (
        <ul>
          <li>Nobody should ever ask you to pay to get your own item back.</li>
          <li>Rewards are optional and only offered by owners. They're a thank-you, not a fee.</li>
        </ul>
      ),
    },
    {
      id: 'after',
      icon: CircleCheck,
      title: 'After the hand-over',
      body: (
        <ul>
          <li>The person who posted the report should mark it <strong>Resolved</strong>, so others stop looking.</li>
          <li>Everyone who chatted about the item gets a notification that the case is closed.</li>
        </ul>
      ),
    },
    {
      id: 'unsafe',
      icon: ShieldAlert,
      title: 'If something feels off',
      body: (
        <p>Trust your instincts. Leave, stop replying, and talk to campus security. No item is worth putting yourself at risk.</p>
      ),
    },
  ];
  return (
    <LegalPage
      icon={Handshake}
      title="Safe hand-overs"
      intro="How to make sure the right person gets their item back, safely, every time."
      updated={UPDATED}
      sections={sections}
      related={{ to: '/safety/chat', label: 'Next: chatting safely' }}
    />
  );
}

export function PhotoPrivacy() {
  useTitle('Photo privacy');
  const sections = [
    {
      id: 'who-sees',
      icon: Users,
      title: 'Who can see your photos',
      body: (
        <ul>
          <li>Photos on lost and found reports are visible to <strong>every signed-in SST student</strong>.</li>
          <li>Photos you share inside a chat are visible only to the two people in that chat.</li>
        </ul>
      ),
    },
    {
      id: 'cover-up',
      icon: ImageOff,
      title: 'Cover personal details',
      body: (
        <ul>
          <li>Hide ID numbers, card numbers, names, faces, addresses and QR codes with your thumb, a sticky note or by cropping.</li>
          <li>For ID cards and wallets, the app asks you to confirm you've done this before you can upload.</li>
        </ul>
      ),
    },
    {
      id: 'keep-a-secret',
      icon: Lock,
      title: 'Keep one detail back',
      body: (
        <p>
          Found something? Photograph it so the owner can recognise it, but leave out one detail (what's inside, a sticker, an engraving). Write it in
          the private "identifying details" field and use it to check claims.
        </p>
      ),
    },
    {
      id: 'metadata',
      icon: Camera,
      title: 'Hidden photo data',
      body: (
        <ul>
          <li>Phone photos can contain hidden data, such as the GPS location where they were taken.</li>
          <li>boomerang re-saves JPG, PNG and WEBP photos in your browser before uploading, which strips that data.</li>
          <li>HEIC photos (from some iPhones) are uploaded as-is, so avoid them for sensitive items, or change your camera setting to "Most Compatible".</li>
        </ul>
      ),
    },
    {
      id: 'good-photo',
      icon: Sparkles,
      title: 'Taking a good photo',
      body: (
        <ul>
          <li>Use good light and a plain background, and fill the frame with the item.</li>
          <li>Add up to 3 photos per report, from your camera or your gallery.</li>
        </ul>
      ),
    },
    {
      id: 'removing',
      icon: EyeOff,
      title: 'Removing photos',
      body: (
        <p>
          Edit a report to remove or replace its photos at any time. Deleting a report deletes its photos too, unless the same photo was also
          shared in a chat.
        </p>
      ),
    },
  ];
  return (
    <LegalPage
      icon={Camera}
      title="Photo privacy"
      intro="Photos help people recognise their things. Here's how to share them without sharing too much."
      updated={UPDATED}
      sections={sections}
      related={{ to: '/privacy', label: 'Read the full Privacy & safety statement' }}
    />
  );
}

export function ChattingSafely() {
  useTitle('Chatting safely');
  const sections = [
    {
      id: 'private',
      icon: Lock,
      title: 'Your chats are private',
      body: (
        <ul>
          <li>Only the two people in a conversation can read it. The server checks this on every message.</li>
          <li>Your email address is never shown. Other students only see your name, school and profile photo.</li>
        </ul>
      ),
    },
    {
      id: 'never-share',
      icon: ShieldAlert,
      title: 'Never share these',
      body: (
        <ul>
          <li>Passwords or OTPs, for boomerang or anything else.</li>
          <li>Full ID, Aadhaar, bank card or account numbers.</li>
          <li>Your home address or hostel room number, unless you're comfortable with it.</li>
        </ul>
      ),
    },
    {
      id: 'stay-in-app',
      icon: MessageCircle,
      title: 'Stay in the app',
      body: (
        <p>
          Keep the conversation on boomerang until the item is returned. That keeps your phone number private and leaves a record of what was agreed
          if anything goes wrong.
        </p>
      ),
    },
    {
      id: 'red-flags',
      icon: MessageSquareWarning,
      title: 'Red flags',
      body: (
        <ul>
          <li>Asking for money, a "deposit" or a "delivery fee" to return an item.</li>
          <li>Pressure to meet somewhere private, or off campus.</li>
          <li>Claiming an item but refusing to describe it.</li>
          <li>Links asking you to log in somewhere.</li>
        </ul>
      ),
    },
    {
      id: 'photos',
      icon: Camera,
      title: 'Sharing photos in chat',
      body: (
        <p>
          You can send photos in a chat, for example to prove an item is yours. Cover personal details first, just like on a public report.
        </p>
      ),
    },
    {
      id: 'help',
      icon: Building2,
      title: 'Getting help',
      body: (
        <p>Feeling uncomfortable? Stop replying. You don't owe anyone a response. Talk to campus security or the portal administrators.</p>
      ),
    },
    {
      id: 'verified',
      icon: UserCheck,
      title: 'Who you are talking to',
      body: (
        <p>
          Everyone on boomerang signed up with an SST college email. That limits who can join, but it doesn't guarantee intentions, so use the same
          care you would with anyone you haven't met.
        </p>
      ),
    },
  ];
  return (
    <LegalPage
      icon={MessageCircle}
      title="Chatting safely"
      intro="Private chat is how items find their way home. A few habits keep it safe for everyone."
      updated={UPDATED}
      sections={sections}
      related={{ to: '/safety/handovers', label: 'Next: safe hand-overs' }}
    />
  );
}
