import React, { useState, useRef } from 'react';
import {
  Globe, Sparkles, Copy, Download, RefreshCw, Code2, Eye,
  Bot, Phone, Search, Palette, Plus, Clock, X, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useOpenRouter } from '../hooks/useOpenRouter';

const BG   = '#07050A';
const GOLD = '#C9A84C';
const BURG = '#6B1F2A';
const DIM  = 'rgba(255,255,255,0.45)';
const T    = { fontFamily: 'Barlow Condensed, sans-serif' };

const HISTORY_KEY = 'swl_website_history';

const CATEGORIES = [
  { id: 'streaming',  label: '📡 Streaming' },
  { id: 'business',   label: '💼 Business' },
  { id: 'health',     label: '🏥 Health' },
  { id: 'realestate', label: '🏠 Real Estate' },
  { id: 'food',       label: '🍽️ Food & Hospitality' },
  { id: 'fitness',    label: '💪 Fitness' },
  { id: 'ecommerce',  label: '🛒 E-commerce' },
  { id: 'creative',   label: '🎨 Creative' },
  { id: 'tech',       label: '🚀 Tech / SaaS' },
  { id: 'legal',      label: '⚖️ Legal' },
  { id: 'nonprofit',  label: '❤️ Nonprofit' },
  { id: 'events',     label: '🎉 Events' },
];

const TEMPLATES = {
  streaming: [
    {
      id: 'streaming',
      label: 'Streaming Landing Page',
      desc: 'Promote your live channel with schedule, highlights & subscribe CTA',
      fields: ['Creator / Brand Name', 'Tagline', 'Platform (Twitch/YouTube/etc)', 'Stream Schedule'],
      prompt: `Create a modern, dark-themed streaming landing page for a creator named {name}.
Tagline: "{tagline}". Context: {context}
Include: hero section with channel name and live status badge, stream schedule section,
recent highlights gallery (3 placeholder video cards), social links bar, "Watch Live" CTA,
donate/tip section, subscriber count display, latest clip carousel.
Style: obsidian black (#07050A) background, gold (#C9A84C) accents, Barlow Condensed font,
mobile-first responsive. Add smooth scroll and CSS animations on hover.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
    {
      id: 'domino',
      label: 'Domino Tournament Page',
      desc: 'NDL/UDL/CaliBones tournament with bracket, schedule & registration',
      fields: ['Tournament Name', 'Date & Location', 'Prize Pool', 'Organizer Name'],
      prompt: `Create a domino tournament event page for "{name}" — event: "{tagline}". Context: {context}
Include: hero with tournament name and gold trophy icon, JS countdown timer to event date,
bracket visualization (4-team placeholder), schedule table, prize structure,
registration form with validation, sponsor logos section, livestream embed placeholder.
Style: obsidian black, gold (#C9A84C) and burgundy (#6B1F2A) accents, sports broadcast aesthetic.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
    {
      id: 'event',
      label: 'Live Event Announcement',
      desc: 'Announce a live event, watch party, or concert with countdown',
      fields: ['Event Name', 'Date & Time', 'Venue / Platform', 'Ticket/RSVP Link'],
      prompt: `Create an event announcement page for "{name}" — event: "{tagline}". Context: {context}
Include: full-viewport hero with event name and dramatic background, live countdown timer,
event details (date/time/location), schedule/agenda, ticket CTA, FAQ accordion, map embed placeholder.
Style: dark atmospheric design, burgundy (#6B1F2A) and gold (#C9A84C) highlights.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
    {
      id: 'bio',
      label: 'Creator Bio / Link-in-Bio',
      desc: 'Personal brand page with stats, all links, and content portfolio',
      fields: ['Creator Name', 'Niche / Genre', 'Social Links', 'Featured Content'],
      prompt: `Create a creator bio / link-in-bio page for "{name}" — tagline: "{tagline}". Context: {context}
Include: profile hero with avatar placeholder and verified badge, bio text, platform stats row
(subscribers/followers/streams/hours), social links grid with icons, content categories grid,
latest videos section (3 cards), merch/shop CTA, contact/booking section.
Style: obsidian dark, gold highlights, mobile-optimized link-in-bio layout.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS.`,
    },
  ],

  business: [
    {
      id: 'business-landing',
      label: 'Business Landing Page',
      desc: 'Professional company landing page with services, testimonials & contact',
      fields: ['Company Name', 'Tagline / Value Prop', 'Main Service', 'Location'],
      prompt: `Create a professional business landing page for "{name}" — tagline: "{tagline}". Context: {context}
Include: hero with value proposition and dual CTA buttons, services/features grid (3 columns),
social proof section with stats, how-it-works steps (3), testimonials (3 placeholder cards),
pricing tier section, FAQ accordion, contact form with validation, footer with links.
Style: modern corporate, dark with gold accent, clean typography, professional feel.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
    {
      id: 'portfolio',
      label: 'Professional Portfolio',
      desc: 'Showcase work, skills, and achievements for freelancers & pros',
      fields: ['Your Name', 'Profession / Title', 'Top Skills', 'Contact Email'],
      prompt: `Create a professional portfolio website for "{name}" — title: "{tagline}". Context: {context}
Include: animated hero with name and typewriter role effect, about section with photo placeholder,
skills grid with progress indicators, featured projects section (4 cards with hover overlay),
experience/education timeline, testimonials carousel, contact form with validation.
Style: minimal dark design, gold highlights, smooth scroll animations, CSS grid layouts.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
    {
      id: 'agency',
      label: 'Marketing / Creative Agency',
      desc: 'Agency site with case studies, team, and service packages',
      fields: ['Agency Name', 'Specialty', 'Key Service', 'Case Study Title'],
      prompt: `Create a marketing agency website for "{name}" — specialty: "{tagline}". Context: {context}
Include: full-screen hero with agency name and particle/gradient effect, services section (6 cards),
case studies grid with results stats, client logo bar, team member cards (4 placeholders),
packages/pricing section, awards/press section, bold contact CTA.
Style: bold modern, dark with gold gradient accents, large typography, dynamic hover effects.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
  ],

  health: [
    {
      id: 'medical-practice',
      label: 'Medical / Dental Practice',
      desc: 'Healthcare provider site with services, booking, and patient info',
      fields: ['Practice Name', 'Specialty', 'Doctor / Provider Name', 'Phone / Address'],
      prompt: `Create a professional medical practice website for "{name}" — specialty: "{tagline}". Context: {context}
Include: trustworthy hero with book-appointment CTA, services/specialties grid,
provider profile section with credentials, patient testimonials (3), insurance accepted logos,
office hours and location with map embed, appointment booking form, health tips blog section,
emergency contact prominent display.
Style: clean professional, navy/teal or dark blue tones, gold trust accents, highly accessible.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
    {
      id: 'wellness',
      label: 'Wellness / Holistic Health',
      desc: 'Spa, yoga studio, or wellness coach site with booking',
      fields: ['Studio / Practice Name', 'Focus Area', 'Practitioner Name', 'Location'],
      prompt: `Create a wellness and holistic health website for "{name}" — focus: "{tagline}". Context: {context}
Include: serene hero with calming imagery placeholder, services menu with descriptions and prices,
practitioner bio section, package/membership cards, testimonials with ratings, booking/scheduling section,
wellness blog/articles section, gallery placeholder, newsletter signup.
Style: calming earth tones, dark with warm gold, organic shapes, gentle animations.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
  ],

  realestate: [
    {
      id: 'realtor',
      label: 'Real Estate Agent / Team',
      desc: 'Agent site with listings, market stats, and lead capture',
      fields: ['Agent / Team Name', 'Market / Location', 'Specialty (Buy/Sell/Invest)', 'License / Brokerage'],
      prompt: `Create a real estate agent website for "{name}" — market: "{tagline}". Context: {context}
Include: hero with agent name, market specialization and "Start Your Search" CTA,
featured listings grid (6 property cards with photos, beds, baths, price placeholders),
market stats dashboard (avg price, days on market, sold volume), buyer/seller guides section,
agent bio with credentials and achievements, testimonials from clients (3),
home valuation lead capture form, neighborhood guides section, mortgage calculator.
Style: professional luxury real estate aesthetic, dark navy or charcoal with gold accents.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
    {
      id: 'property',
      label: 'Property / Development',
      desc: 'Real estate development or property management company',
      fields: ['Company Name', 'Portfolio Type', 'Location', 'Units / Properties Count'],
      prompt: `Create a property development company website for "{name}" — portfolio: "{tagline}". Context: {context}
Include: cinematic hero with aerial image placeholder, development portfolio grid (6 properties),
investment stats (units managed, ROI, occupancy), services offered, team leadership profiles,
investment opportunity lead capture, tenant portal link, contact form.
Style: luxury real estate, dark with gold accents, large imagery, corporate professional.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
  ],

  food: [
    {
      id: 'restaurant',
      label: 'Restaurant / Bar',
      desc: 'Full restaurant site with menu, reservations, and ambiance',
      fields: ['Restaurant Name', 'Cuisine Type', 'Location / City', 'Hours'],
      prompt: `Create a restaurant website for "{name}" — cuisine: "{tagline}". Context: {context}
Include: atmospheric hero with food imagery placeholder and reservation CTA, menu section
(appetizers, mains, desserts, drinks with prices), chef profile section, gallery masonry grid,
reservation form with date/time/party-size picker, events/specials section, location & hours,
gift card CTA, footer with social links.
Style: rich restaurant aesthetic, dark with warm amber/gold, elegant typography, appetite-stimulating.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
    {
      id: 'catering',
      label: 'Catering / Food Business',
      desc: 'Catering company or food truck with packages and booking',
      fields: ['Business Name', 'Specialty / Cuisine', 'Service Area', 'Minimum Order/Size'],
      prompt: `Create a catering business website for "{name}" — specialty: "{tagline}". Context: {context}
Include: hero with food spread imagery and "Get a Quote" CTA, service packages section (3 tiers),
menu showcase with dietary badges, gallery of events served, client testimonials (4),
quote request form (event type, date, guest count), FAQ accordion, social proof stats.
Style: warm food photography aesthetic, dark with gold and amber accents, clean modern layout.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
  ],

  fitness: [
    {
      id: 'gym',
      label: 'Gym / Fitness Studio',
      desc: 'Fitness center with membership plans, classes, and trainers',
      fields: ['Gym / Studio Name', 'Specialty (CrossFit/Yoga/Boxing/etc)', 'Location', 'Main CTA'],
      prompt: `Create a fitness studio/gym website for "{name}" — specialty: "{tagline}". Context: {context}
Include: high-energy hero with workout imagery, membership plans (3 tiers with feature lists),
class schedule section (weekly grid), trainer profiles (4 with specialties), transformation gallery,
free trial CTA, gym amenities section, member testimonials with before/after stories,
app download section, contact/location.
Style: high-energy dark gym aesthetic, gold and red accents, bold typography, motivational.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
    {
      id: 'trainer',
      label: 'Personal Trainer / Coach',
      desc: 'Online or in-person personal training with programs and booking',
      fields: ['Trainer Name', 'Specialty / Niche', 'Certification', 'Program Name'],
      prompt: `Create a personal trainer/coach website for "{name}" — niche: "{tagline}". Context: {context}
Include: bold hero with trainer photo placeholder and "Transform Now" CTA, transformation results
section (before/after cards with stats), coaching programs (3 options with deliverables and price),
trainer credentials and story section, client success stories with metrics, free resource lead magnet,
booking calendar embed placeholder, FAQ, newsletter signup.
Style: motivational dark fitness aesthetic, gold accent color, strong before/after visual contrast.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
  ],

  ecommerce: [
    {
      id: 'store',
      label: 'E-commerce Store',
      desc: 'Online shop with product grid, cart, and checkout flow',
      fields: ['Store Name', 'Product Category', 'Target Audience', 'Free Shipping Threshold'],
      prompt: `Create an e-commerce store landing page for "{name}" — category: "{tagline}". Context: {context}
Include: hero with promotional banner and shop CTA, featured products grid (8 product cards with price,
ratings, add-to-cart), categories navigation, flash sale countdown timer, bestsellers section,
brand story/about section, customer reviews (5-star grid), trust badges (secure checkout/free returns),
newsletter discount popup, footer with policies.
Style: modern e-commerce, dark with gold accents, card-based product grid, mobile-optimized.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS including cart state.`,
    },
    {
      id: 'brand',
      label: 'Brand / DTC Product Page',
      desc: 'Direct-to-consumer brand with hero product and conversion focus',
      fields: ['Brand Name', 'Hero Product', 'Key Benefit', 'Price Point'],
      prompt: `Create a direct-to-consumer brand website for "{name}" — product: "{tagline}". Context: {context}
Include: cinematic hero with product video placeholder and "Buy Now" CTA, product benefits section
(3 icons with descriptions), how-it-works steps (4), social proof numbers,
UGC gallery section (9 square photos), bundle/variant selector, FAQ accordion,
satisfaction guarantee section, email capture for discount.
Style: premium DTC aesthetic, dark with gold product highlights, conversion-optimized layout.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
  ],

  creative: [
    {
      id: 'music',
      label: 'Music Artist / Band',
      desc: 'Artist site with discography, tour dates, and merch',
      fields: ['Artist / Band Name', 'Genre', 'Latest Release', 'Tour Location'],
      prompt: `Create a music artist website for "{name}" — genre: "{tagline}". Context: {context}
Include: cinematic hero with artist imagery and music player placeholder, latest release section
with streaming platform links (Spotify/Apple/YouTube), discography grid (6 album cards),
upcoming tour dates table with ticket links, music video embed section,
merch store preview (4 items), press quotes, newsletter/fanclub signup.
Style: dramatic music aesthetic, dark cinematic design, gold and deep red accents, full-bleed imagery.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
    {
      id: 'photographer',
      label: 'Photographer / Videographer',
      desc: 'Visual artist portfolio with galleries and booking',
      fields: ['Photographer Name', 'Specialty (Wedding/Sports/Commercial/etc)', 'Location', 'Starting Price'],
      prompt: `Create a photography/videography portfolio for "{name}" — specialty: "{tagline}". Context: {context}
Include: full-viewport masonry gallery hero, services offered (4 packages with pricing),
portfolio gallery by category (wedding/events/portraits/commercial), behind-the-scenes section,
client testimonials with wedding/event details, equipment/style section, booking inquiry form,
delivery timeline section, gallery of 12 placeholder portfolio images.
Style: photographer aesthetic, dark minimal, full-bleed imagery, elegant typography.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
  ],

  tech: [
    {
      id: 'saas',
      label: 'SaaS Product / App',
      desc: 'Software product landing page with features, pricing, and signup',
      fields: ['Product Name', 'Core Value Prop', 'Target User', 'Key Feature'],
      prompt: `Create a SaaS product landing page for "{name}" — value prop: "{tagline}". Context: {context}
Include: animated hero with product screenshot/mockup placeholder and free-trial CTA,
feature highlights section (6 cards with icons), product demo video embed placeholder,
customer logos bar (8 company logos), pricing table (3 tiers: Free/Pro/Enterprise),
integration logos section, security/compliance badges, case study highlight,
G2/Capterra review stars section, FAQ accordion, enterprise contact form.
Style: modern SaaS dark design, purple/blue or gold gradient accents, developer-friendly aesthetic.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
    {
      id: 'startup',
      label: 'Tech Startup / App Launch',
      desc: 'Startup waitlist or launch page with product vision and signup',
      fields: ['Startup Name', 'Problem You Solve', 'Target Customer', 'Launch Date'],
      prompt: `Create a tech startup launch/waitlist page for "{name}" — mission: "{tagline}". Context: {context}
Include: bold hero with problem statement and waitlist email capture, product vision section,
how-it-works steps (3), early-access benefits list, founding team section (4 members),
press/media mentions placeholder, investor/advisor logos, countdown to launch,
behind-the-scenes/build-in-public section, social share CTA.
Style: startup energy, dark with gradient accent (purple-to-gold), bold clean typography.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
  ],

  legal: [
    {
      id: 'lawfirm',
      label: 'Law Firm / Attorney',
      desc: 'Legal services site with practice areas, attorney bios, and consultation',
      fields: ['Firm / Attorney Name', 'Practice Area', 'Location / Bar', 'Free Consultation Offer'],
      prompt: `Create a law firm website for "{name}" — practice area: "{tagline}". Context: {context}
Include: authoritative hero with free consultation CTA, practice areas section (6 with icons),
why-choose-us section with case results stats (cases won, settlements, years experience),
attorney profiles (3 with education/bar admissions), client testimonials (4),
case process steps (5 stages from intake to resolution), consultation booking form,
awards/recognition section, FAQs by practice area.
Style: professional legal aesthetic, dark charcoal with gold justice accents, trustworthy typography.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
  ],

  nonprofit: [
    {
      id: 'charity',
      label: 'Nonprofit / Charity',
      desc: 'Organization site with mission, donate CTA, and programs',
      fields: ['Organization Name', 'Mission Statement', 'Key Program', 'Donation Goal'],
      prompt: `Create a nonprofit/charity website for "{name}" — mission: "{tagline}". Context: {context}
Include: emotional hero with mission statement and "Donate Now" CTA, impact stats section
(lives touched, funds raised, years serving, volunteers), programs/initiatives grid (4 cards),
donation form with amount presets ($25/$50/$100/Custom), volunteer signup section,
stories of impact (3 beneficiary cards), upcoming events calendar, board/leadership section,
annual report download, email newsletter signup.
Style: warm purposeful design, dark with gold and hope-inspired accent colors, empathetic tone.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
  ],

  events: [
    {
      id: 'conference',
      label: 'Conference / Summit',
      desc: 'Multi-speaker conference page with agenda and ticket sales',
      fields: ['Conference Name', 'Theme / Topic', 'Date & Location', 'Speaker Count'],
      prompt: `Create a conference/summit website for "{name}" — theme: "{tagline}". Context: {context}
Include: hero with conference branding and early-bird ticket CTA, speaker lineup grid (8 speakers
with headshot placeholders and titles), agenda schedule (2 days, 4 tracks), keynote highlight section,
sponsor tiers (Gold/Silver/Bronze logos), attendee testimonials from past editions,
venue/location section with hotel block info, FAQ accordion, ticket purchase section with tiers.
Style: professional conference aesthetic, dark with gold premium feel, large typography, agenda-focused.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
    {
      id: 'workshop',
      label: 'Workshop / Course / Masterclass',
      desc: 'Live or online workshop with curriculum, instructor, and enrollment',
      fields: ['Workshop Name', 'Skill / Topic', 'Instructor Name', 'Price / Dates'],
      prompt: `Create a workshop/masterclass sales page for "{name}" — topic: "{tagline}". Context: {context}
Include: bold outcome-focused hero with enrollment CTA, transformation promise section,
curriculum breakdown (8 modules with descriptions), instructor credibility section with bio and results,
student success stories (4 with specific outcomes), what's-included checklist,
FAQ accordion (10 questions), payment options section, enrollment closes countdown timer,
bonus section, 30-day guarantee badge, sticky buy button on scroll.
Style: high-converting course page, dark with gold urgency accents, social proof focused.
{chatbot_inject}{voice_inject}{seo_inject}
Output complete self-contained HTML with embedded CSS and JS.`,
    },
  ],
};

const COLOR_THEMES = [
  { id: 'dark-gold', label: 'Dark Gold', preview: ['#07050A', '#C9A84C'] },
  { id: 'dark-purple', label: 'Dark Purple', preview: ['#0A0714', '#9B59B6'] },
  { id: 'dark-blue', label: 'Dark Blue', preview: ['#080C18', '#3B82F6'] },
  { id: 'light-pro', label: 'Light Pro', preview: ['#F8FAFC', '#1E293B'] },
  { id: 'warm-amber', label: 'Warm Amber', preview: ['#0E0905', '#F59E0B'] },
];

const MODELS = [
  { id: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku (Fast)' },
  { id: 'anthropic/claude-sonnet-4-5', label: 'Claude Sonnet (Balanced)' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'openai/gpt-4o', label: 'GPT-4o (High Quality)' },
  { id: 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash (Free)' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (Free)' },
];

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistory(items) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 5))); } catch {}
}

const inp = {
  marginTop: 4, width: '100%', padding: '9px 12px', borderRadius: 8,
  background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(201,168,76,0.25)',
  color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: 'Barlow Condensed, sans-serif',
  outline: 'none', boxSizing: 'border-box',
};

export default function WebsiteGenerator() {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { invoke: invokeAI } = useOpenRouter();

  const [category, setCategory] = useState('streaming');
  const [templateId, setTemplateId] = useState('streaming');
  const [formData, setFormData] = useState({ name: '', tagline: '', context: '' });
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [colorTheme, setColorTheme] = useState('dark-gold');
  const [embedChatbot, setEmbedChatbot] = useState(false);
  const [embedVoice, setEmbedVoice] = useState(false);
  const [embedSEO, setEmbedSEO] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [html, setHtml] = useState('');
  const [tab, setTab] = useState('preview');
  const [history, setHistory] = useState(loadHistory);
  const [showHistory, setShowHistory] = useState(false);
  const iframeRef = useRef(null);

  const categoryTemplates = TEMPLATES[category] || [];
  const selectedTemplate = categoryTemplates.find(t => t.id === templateId) || categoryTemplates[0];

  function selectCategory(cat) {
    setCategory(cat);
    const first = TEMPLATES[cat]?.[0];
    if (first) setTemplateId(first.id);
  }

  function buildChatbotSnippet() {
    if (!embedChatbot) return '';
    return `
<!-- AI Chatbot Widget -->
<div id="chat-widget" style="position:fixed;bottom:80px;right:20px;z-index:9999;">
  <div id="chat-bubble" onclick="toggleChat()" style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#C9A84C,#6B1F2A);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 20px rgba(201,168,76,0.4);">
    <span style="font-size:22px;">💬</span>
  </div>
  <div id="chat-panel" style="display:none;position:absolute;bottom:60px;right:0;width:320px;max-height:480px;background:#07050A;border:1px solid rgba(201,168,76,0.3);border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.6);">
    <div style="padding:12px 16px;background:rgba(201,168,76,0.08);border-bottom:1px solid rgba(201,168,76,0.15);display:flex;justify-content:space-between;align-items:center;">
      <span style="font-family:Barlow Condensed,sans-serif;font-weight:800;color:#C9A84C;font-size:14px;">AI Assistant</span>
      <button onclick="toggleChat()" style="background:none;border:none;color:rgba(255,255,255,0.5);cursor:pointer;font-size:16px;">✕</button>
    </div>
    <div id="chat-messages" style="padding:12px;height:320px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;font-family:Barlow Condensed,sans-serif;">
      <div style="background:rgba(201,168,76,0.1);border-radius:10px;padding:10px 12px;font-size:13px;color:rgba(255,255,255,0.85);">Hi! I'm the AI assistant for this page. How can I help you today?</div>
    </div>
    <div style="padding:10px;border-top:1px solid rgba(255,255,255,0.06);display:flex;gap:6px;">
      <input id="chat-input" placeholder="Ask me anything..." style="flex:1;padding:8px 10px;background:rgba(255,255,255,0.05);border:1px solid rgba(201,168,76,0.2);border-radius:8px;color:#fff;font-family:Barlow Condensed,sans-serif;font-size:13px;outline:none;" />
      <button onclick="sendChat()" style="padding:8px 12px;background:#C9A84C;border:none;border-radius:8px;cursor:pointer;font-size:14px;">➤</button>
    </div>
  </div>
</div>
<script>
function toggleChat(){var p=document.getElementById('chat-panel');p.style.display=p.style.display==='none'?'block':'none';}
async function sendChat(){
  var inp=document.getElementById('chat-input');var msg=inp.value.trim();if(!msg)return;
  var msgs=document.getElementById('chat-messages');
  msgs.innerHTML+='<div style="align-self:flex-end;background:rgba(201,168,76,0.15);border-radius:10px;padding:8px 12px;font-size:13px;color:rgba(255,255,255,0.9);max-width:80%;text-align:right;">'+msg+'</div>';
  inp.value='';msgs.scrollTop=msgs.scrollHeight;
  msgs.innerHTML+='<div id="typing" style="background:rgba(255,255,255,0.05);border-radius:10px;padding:8px 12px;font-size:13px;color:rgba(255,255,255,0.5);">Thinking…</div>';
  msgs.scrollTop=msgs.scrollHeight;
  setTimeout(function(){
    var typing=document.getElementById('typing');if(typing)typing.remove();
    msgs.innerHTML+='<div style="background:rgba(201,168,76,0.1);border-radius:10px;padding:10px 12px;font-size:13px;color:rgba(255,255,255,0.85);">Thanks for your message! Feel free to explore the page or contact us directly.</div>';
    msgs.scrollTop=msgs.scrollHeight;
  },1200);
}
document.getElementById('chat-input').addEventListener('keydown',function(e){if(e.key==='Enter')sendChat();});
</script>`;
  }

  function buildVoiceSnippet() {
    if (!embedVoice) return '';
    return `
<!-- Voice Call Button -->
<div id="voice-btn" onclick="startVoiceCall()" style="position:fixed;bottom:20px;right:20px;z-index:9999;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#6B1F2A,#C9A84C);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 20px rgba(107,31,42,0.5);transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
  <span style="font-size:22px;">📞</span>
</div>
<script>
function startVoiceCall(){
  alert('Voice AI agent coming soon! For now, please use the contact form or chat widget to reach us.');
}
</script>`;
  }

  function buildSEOSnippet(name, tagline) {
    if (!embedSEO) return '';
    const theme = COLOR_THEMES.find(t => t.id === colorTheme);
    return `
<meta name="description" content="${tagline || name} — ${selectedTemplate?.desc || 'Professional website'}" />
<meta property="og:title" content="${name}" />
<meta property="og:description" content="${tagline}" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${name}" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;800;900&display=swap" rel="stylesheet">`;
  }

  async function generate() {
    if (!selectedTemplate) { toast.error('Select a template first.'); return; }
    const name = formData.name.trim() || user?.full_name || 'Brand Name';
    const tagline = formData.tagline.trim() || selectedTemplate.desc;
    const context = formData.context.trim();

    const chatbot_inject = buildChatbotSnippet();
    const voice_inject = buildVoiceSnippet();
    const seo_inject = buildSEOSnippet(name, tagline);
    const theme = COLOR_THEMES.find(t => t.id === colorTheme);
    const themeNote = theme ? `Use color scheme: primary background ${theme.preview[0]}, accent ${theme.preview[1]}.` : '';

    const finalPrompt = selectedTemplate.prompt
      .replace(/\{name\}/g, name)
      .replace(/\{tagline\}/g, tagline)
      .replace(/\{context\}/g, context || `${selectedTemplate.desc}.`)
      .replace(/\{chatbot_inject\}/g, chatbot_inject ? 'Include at the end of body: ' + chatbot_inject.slice(0, 100) + '...' : '')
      .replace(/\{voice_inject\}/g, voice_inject ? 'Include voice button at bottom-right.' : '')
      .replace(/\{seo_inject\}/g, seo_inject ? 'Include in <head>: proper meta tags, OG tags, Google Fonts.' : '')
      + (themeNote ? `\n\n${themeNote}`)
      + (embedChatbot ? '\n\nAppend the following chatbot widget code just before </body>:\n' + chatbot_inject : '')
      + (embedVoice ? '\n\nAppend the following voice button code just before </body>:\n' + buildVoiceSnippet() : '')
      + (embedSEO ? '\n\nInclude in <head> section:\n' + buildSEOSnippet(name, tagline) : '');

    setGenerating(true);
    setHtml('');
    try {
      const raw = await invokeAI({
        prompt: finalPrompt,
        systemPrompt: 'You are an expert full-stack web developer specializing in conversion-optimized landing pages. Output ONLY complete, self-contained HTML with embedded CSS and JS. No explanations, no markdown fences unless asked. The entire page must work offline as a single .html file.',
        maxTokens: 6000,
        model: selectedModel,
      });
      const match = raw.match(/```(?:html)?\s*([\s\S]*?)```/i);
      const generated = match ? match[1].trim() : raw.trim();
      setHtml(generated);
      setTab('preview');
      toast.success('Site generated!');
      const item = { id: Date.now(), name, template: selectedTemplate.label, ts: Date.now() };
      const updated = [{ ...item, html: generated }, ...history.filter(h => h.id !== item.id)];
      setHistory(updated);
      saveHistory(updated);
    } catch (err) {
      toast.error('Generation failed — check your OpenRouter key in Settings.');
    } finally {
      setGenerating(false);
    }
  }

  function copyHtml() {
    if (!html) return;
    navigator.clipboard.writeText(html).then(() => toast.success('HTML copied!')).catch(() => {});
  }

  function downloadHtml() {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(formData.name || 'site').toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded!');
  }

  function setField(k, v) { setFormData(p => ({ ...p, [k]: v })); }

  return (
    <div style={{ minHeight: '100vh', background: BG, ...T, paddingBottom: 32 }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(7,5,10,0.97)', borderBottom: '1px solid rgba(201,168,76,0.12)', backdropFilter: 'blur(12px)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${GOLD}20`, border: `1px solid ${GOLD}40` }}>
          <Globe style={{ width: 16, height: 16, color: GOLD }} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1, ...T }}>Website Generator</h1>
          <p style={{ fontSize: 11, color: DIM, ...T }}>Universal AI site builder — {Object.values(TEMPLATES).flat().length} templates across {Object.keys(TEMPLATES).length} industries</p>
        </div>
        <button onClick={() => setShowHistory(!showHistory)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: DIM, cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, ...T }}>
          <Clock style={{ width: 12, height: 12 }} /> History ({history.length})
        </button>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* History panel */}
        {showHistory && history.length > 0 && (
          <div style={{ borderRadius: 12, background: 'rgba(13,6,24,0.9)', border: '1px solid rgba(201,168,76,0.2)', padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: 'uppercase' }}>Recent Generations</p>
              <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', color: DIM, cursor: 'pointer' }}><X style={{ width: 14, height: 14 }} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {history.map(h => (
                <button key={h.id} onClick={() => { setHtml(h.html); setTab('preview'); setShowHistory(false); }}
                  style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', ...T }}>{h.name} — {h.template}</span>
                  <span style={{ fontSize: 10, color: DIM, ...T }}>{new Date(h.ts).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category tabs */}
        <div style={{ borderRadius: 12, background: 'rgba(13,6,24,0.8)', border: '1px solid rgba(255,255,255,0.07)', padding: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Industry</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => selectCategory(cat.id)} style={{
                padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: 700, ...T,
                background: category === cat.id ? `${GOLD}22` : 'rgba(0,0,0,0.3)',
                border: `1px solid ${category === cat.id ? GOLD + '55' : 'rgba(255,255,255,0.07)'}`,
                color: category === cat.id ? GOLD : 'rgba(255,255,255,0.6)',
              }}>{cat.label}</button>
            ))}
          </div>
        </div>

        {/* Template picker */}
        <div style={{ borderRadius: 12, background: 'rgba(13,6,24,0.8)', border: '1px solid rgba(255,255,255,0.07)', padding: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Template</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {categoryTemplates.map(t => (
              <button key={t.id} onClick={() => setTemplateId(t.id)} style={{
                padding: '10px 12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', ...T,
                background: templateId === t.id ? `${GOLD}18` : 'rgba(0,0,0,0.3)',
                border: `1px solid ${templateId === t.id ? GOLD + '55' : 'rgba(255,255,255,0.06)'}`,
              }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: templateId === t.id ? GOLD : 'rgba(255,255,255,0.8)', ...T }}>{t.label}</p>
                <p style={{ fontSize: 10, color: DIM, marginTop: 2, lineHeight: 1.3, ...T }}>{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div style={{ borderRadius: 12, background: 'rgba(13,6,24,0.8)', border: '1px solid rgba(255,255,255,0.07)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: 'uppercase' }}>Customize</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: DIM, ...T }}>{selectedTemplate?.fields?.[0] || 'Name'}</label>
              <input value={formData.name} onChange={e => setField('name', e.target.value)}
                placeholder={selectedTemplate?.fields?.[0] || 'Brand / Creator Name'}
                style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: DIM, ...T }}>{selectedTemplate?.fields?.[1] || 'Tagline'}</label>
              <input value={formData.tagline} onChange={e => setField('tagline', e.target.value)}
                placeholder={selectedTemplate?.fields?.[1] || 'Tagline or key phrase'}
                style={inp} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: DIM, ...T }}>Additional Context (optional — location, hours, pricing, features)</label>
            <textarea value={formData.context} onChange={e => setField('context', e.target.value)}
              placeholder={`E.g., "${selectedTemplate?.fields?.[2] || 'Located in Austin TX, est. 2020, 5-star rated'}, ${selectedTemplate?.fields?.[3] || 'contact@example.com'}"`}
              rows={2}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
          </div>

          {/* Options row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: DIM, ...T }}>AI Model</label>
              <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} style={{ ...inp, marginTop: 4 }}>
                {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: DIM, ...T }}>Color Theme</label>
              <select value={colorTheme} onChange={e => setColorTheme(e.target.value)} style={{ ...inp, marginTop: 4 }}>
                {COLOR_THEMES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Feature toggles */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { key: 'chatbot', label: '💬 Embed AI Chatbot', val: embedChatbot, set: setEmbedChatbot },
              { key: 'voice', label: '📞 Voice Call Button', val: embedVoice, set: setEmbedVoice },
              { key: 'seo', label: '🔍 SEO Meta Tags', val: embedSEO, set: setEmbedSEO },
            ].map(opt => (
              <button key={opt.key} onClick={() => opt.set(!opt.val)} style={{
                padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: 700, ...T,
                background: opt.val ? `${GOLD}20` : 'rgba(0,0,0,0.3)',
                border: `1px solid ${opt.val ? GOLD + '50' : 'rgba(255,255,255,0.07)'}`,
                color: opt.val ? GOLD : DIM,
              }}>{opt.label}</button>
            ))}
          </div>

          <button onClick={generate} disabled={generating} style={{
            padding: '12px 20px', borderRadius: 10, cursor: generating ? 'not-allowed' : 'pointer',
            background: generating ? 'rgba(201,168,76,0.08)' : `linear-gradient(135deg, ${GOLD}33, rgba(107,31,42,0.3))`,
            border: `1px solid ${generating ? 'rgba(201,168,76,0.15)' : GOLD + '55'}`,
            color: generating ? DIM : GOLD, fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...T,
          }}>
            {generating
              ? <><RefreshCw style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Generating…</>
              : <><Sparkles style={{ width: 14, height: 14 }} /> Generate Site</>
            }
          </button>
        </div>

        {/* Output */}
        {html && (
          <div style={{ borderRadius: 14, background: 'rgba(13,6,24,0.8)', border: '1px solid rgba(201,168,76,0.2)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', gap: 8 }}>
              {[
                { id: 'preview', icon: <Eye style={{ width: 12, height: 12 }} />, label: 'Preview' },
                { id: 'code', icon: <Code2 style={{ width: 12, height: 12 }} />, label: 'HTML Code' },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, ...T,
                  background: tab === t.id ? `${GOLD}20` : 'transparent',
                  border: `1px solid ${tab === t.id ? GOLD + '40' : 'transparent'}`,
                  color: tab === t.id ? GOLD : DIM, display: 'flex', alignItems: 'center', gap: 5,
                }}>{t.icon}{t.label}</button>
              ))}
              <div style={{ flex: 1 }} />
              <button onClick={copyHtml} title="Copy HTML" style={{ padding: '5px 8px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: DIM, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Copy style={{ width: 13, height: 13 }} /><span style={{ fontSize: 10, ...T }}>Copy</span>
              </button>
              <button onClick={downloadHtml} title="Download .html" style={{ padding: '5px 10px', borderRadius: 6, background: `${GOLD}18`, border: `1px solid ${GOLD}40`, color: GOLD, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, ...T }}>
                <Download style={{ width: 13, height: 13 }} /> Download
              </button>
            </div>
            {tab === 'preview' ? (
              <iframe ref={iframeRef} srcDoc={html} sandbox="allow-scripts"
                title="Generated site preview"
                style={{ width: '100%', height: 580, border: 'none', background: '#fff', display: 'block' }} />
            ) : (
              <pre style={{ margin: 0, padding: 16, overflowX: 'auto', maxHeight: 580, fontSize: 11, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {html}
              </pre>
            )}
          </div>
        )}

        {!html && !generating && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.18)', fontSize: 13, ...T, lineHeight: 1.8 }}>
            {Object.values(TEMPLATES).flat().length} templates across {Object.keys(TEMPLATES).length} industries.<br />
            Pick a category, choose a template, fill in your details, and hit Generate.
          </div>
        )}
      </div>
    </div>
  );
}
