import React, { useState, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { MobileSelect } from '@/components/ui/MobileSelect';
import { Play, Volume2, Save, Plus, Trash2, Zap, Bot, Link, Webhook, BarChart2, BookOpen, MessageSquare, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useOpenRouter } from '../hooks/useOpenRouter';

var BG   = '#07050A';
var GOLD = '#C9A84C';
var BURG = '#6B1F2A';
var DIM  = 'rgba(255,255,255,0.45)';
var T    = { fontFamily: 'Barlow Condensed, sans-serif' };

var EL_VOICES = [
  { id: 'rachel',  label: 'Rachel',  desc: 'Calm, professional' },
  { id: 'domi',    label: 'Domi',    desc: 'Strong, confident' },
  { id: 'bella',   label: 'Bella',   desc: 'Soft, warm' },
  { id: 'Antoni',  label: 'Antoni',  desc: 'Well-rounded male' },
  { id: 'elli',    label: 'Elli',    desc: 'Emotional, relatable' },
  { id: 'josh',    label: 'Josh',    desc: 'Deep, trustworthy' },
  { id: 'arnold',  label: 'Arnold',  desc: 'Crisp & natural' },
  { id: 'adam',    label: 'Adam',    desc: 'Deep American male' },
  { id: 'sam',     label: 'Sam',     desc: 'Raspy, strong' },
];

var TRIGGER_TYPES = [
  { id: 'chat_command', label: 'Chat Command',    ex: '!ask, !voice, !host' },
  { id: 'sub_event',    label: 'New Subscriber',  ex: 'Fires when someone subscribes' },
  { id: 'tip_event',    label: 'Tip / Donation',  ex: 'Fires when a tip arrives' },
  { id: 'join_event',   label: 'Viewer Joins',    ex: 'Fires on first join' },
  { id: 'keyword',      label: 'Keyword Match',   ex: 'Fires when keyword appears in chat' },
  { id: 'manual',       label: 'Manual / API',    ex: 'Triggered externally' },
];

var INDUSTRY_TEMPLATES = [
  {
    id: 'streaming',
    label: 'Streaming Host',
    icon: '🎙️',
    desc: 'Hypes viewers, announces milestones, moderates chat',
    personality: 'You are an energetic streaming host assistant named {name}. You hype up the audience, celebrate subscriber milestones, call out top tippers, and keep the stream energy high. You speak fast, use stream slang, and always keep it positive. When someone donates, you thank them by name with genuine excitement.',
    triggers: [
      { type: 'sub_event', value: '', responseTemplate: 'Welcome to the squad, {username}! The crew just got stronger — let\'s go!' },
      { type: 'tip_event', value: '', responseTemplate: 'Big shoutout to {username} for the {amount} tip! You are an absolute legend!' },
      { type: 'chat_command', value: '!hype', responseTemplate: 'The energy in here is INSANE right now! Let\'s go! Drop those hearts in the chat!' },
    ],
  },
  {
    id: 'healthcare',
    label: 'Healthcare Receptionist',
    icon: '🏥',
    desc: 'Appointment scheduling, FAQ, insurance verification',
    personality: 'You are a friendly and professional medical office assistant named {name}. You help patients schedule appointments, answer general health questions, verify insurance eligibility, and provide directions to the clinic. Always maintain patient confidentiality. Never provide medical diagnoses — always direct specific medical questions to the doctor.',
    triggers: [
      { type: 'chat_command', value: '!schedule', responseTemplate: 'I can help you schedule an appointment! Please provide your preferred date and whether this is for a new or existing patient.' },
      { type: 'chat_command', value: '!hours', responseTemplate: 'Our office is open Monday–Friday 8 AM to 5 PM, and Saturday 9 AM to 1 PM. We\'re closed on Sundays.' },
      { type: 'keyword', value: 'appointment', responseTemplate: 'Would you like to schedule an appointment? I can connect you with our scheduling team right now.' },
    ],
    webhookPrompt: 'Patient scheduling integration — post to your EHR webhook on !schedule triggers.',
    bookingPrompt: 'Link your Calendly or Cal.com scheduling page for direct appointment booking.',
  },
  {
    id: 'realestate',
    label: 'Real Estate Agent',
    icon: '🏡',
    desc: 'Property info, showing scheduling, mortgage pre-qual',
    personality: 'You are a knowledgeable real estate assistant named {name}. You help buyers and sellers navigate the real estate process. You provide property information, neighborhood insights, estimated values, and help schedule showings. You speak professionally but in a warm, approachable manner. Always encourage prospects to speak with the agent for specific pricing and negotiation strategies.',
    triggers: [
      { type: 'chat_command', value: '!showing', responseTemplate: 'I\'d love to schedule a showing for you! What neighborhood or property are you interested in, and what days work best?' },
      { type: 'chat_command', value: '!value', responseTemplate: 'I can help you get a free home value estimate! What\'s the property address, and has it been updated recently?' },
      { type: 'keyword', value: 'listing', responseTemplate: 'Looking at listings? I can send you our latest properties matching your criteria. What\'s your budget and preferred area?' },
    ],
    bookingPrompt: 'Connect your Calendly for instant showing scheduling.',
  },
  {
    id: 'restaurant',
    label: 'Restaurant Host',
    icon: '🍽️',
    desc: 'Reservations, menu questions, specials, wait times',
    personality: 'You are a warm and welcoming restaurant assistant named {name}. You handle reservations, answer menu questions, announce daily specials, and provide wait time estimates. You speak in a friendly, hospitable tone and always make guests feel excited about their dining experience. You know the full menu and can make recommendations based on dietary preferences.',
    triggers: [
      { type: 'chat_command', value: '!reserve', responseTemplate: 'Wonderful! I\'d love to reserve a table for you. How many guests, what date and time, and any special occasion we should know about?' },
      { type: 'chat_command', value: '!specials', responseTemplate: 'Tonight\'s specials are prepared fresh by our chef! Would you like me to walk you through what\'s on the board today?' },
      { type: 'keyword', value: 'reservation', responseTemplate: 'Looking to make a reservation? I can get that set up right now. What date works for your party?' },
    ],
    bookingPrompt: 'Link your OpenTable or Resy page for direct reservation booking.',
  },
  {
    id: 'fitness',
    label: 'Fitness Coach',
    icon: '💪',
    desc: 'Workout plans, class schedules, nutrition tips',
    personality: 'You are an energetic and motivating fitness coach assistant named {name}. You help members with class schedules, workout recommendations, nutrition guidance, and membership questions. You speak with energy and encouragement, using fitness lingo naturally. You motivate members to push through plateaus while emphasizing safety and proper form.',
    triggers: [
      { type: 'chat_command', value: '!classes', responseTemplate: 'Ready to crush it? Here\'s what\'s on the schedule this week — which time slot fits your grind?' },
      { type: 'chat_command', value: '!tip', responseTemplate: 'Fitness tip: Consistency beats intensity every time. Show up even on the days you don\'t feel like it — that\'s where the real gains happen!' },
      { type: 'sub_event', value: '', responseTemplate: 'Welcome to the family, {username}! Your fitness journey starts NOW. Let\'s GO!' },
    ],
    bookingPrompt: 'Link your Mindbody or Cal.com for class bookings.',
  },
  {
    id: 'ecommerce',
    label: 'E-Commerce Support',
    icon: '🛍️',
    desc: 'Order tracking, returns, product questions, upsells',
    personality: 'You are a helpful and efficient e-commerce support assistant named {name}. You handle order inquiries, track shipments, process return requests, and answer product questions. You speak clearly and empathetically, understanding that customer experience is everything. You always resolve issues quickly and look for opportunities to recommend products that genuinely help the customer.',
    triggers: [
      { type: 'chat_command', value: '!order', responseTemplate: 'I can look up your order! Please share your order number and I\'ll get you the latest status right away.' },
      { type: 'chat_command', value: '!return', responseTemplate: 'No problem — our return process is simple. Orders within 30 days qualify for a full refund. Want me to start the return for you?' },
      { type: 'keyword', value: 'shipping', responseTemplate: 'Shipping questions? Standard delivery is 3–5 business days. Express options are available at checkout. What\'s your order number?' },
    ],
    webhookPrompt: 'Connect your Shopify/WooCommerce webhook to pull live order data.',
  },
  {
    id: 'legal',
    label: 'Legal Intake Agent',
    icon: '⚖️',
    desc: 'Case intake, consultation scheduling, FAQ',
    personality: 'You are a professional legal intake assistant named {name}. You gather initial information from potential clients, answer general questions about practice areas, and schedule consultations. You are precise, empathetic, and confidential. You always clarify that information gathered is for intake purposes only and does not constitute legal advice. You encourage prospects to schedule a consultation with an attorney.',
    triggers: [
      { type: 'chat_command', value: '!consult', responseTemplate: 'I can schedule a consultation with one of our attorneys. To get started, could you briefly describe the nature of your legal matter?' },
      { type: 'keyword', value: 'help', responseTemplate: 'I\'m here to help. Can you tell me more about your situation? Everything shared is strictly confidential during this intake process.' },
    ],
    bookingPrompt: 'Link your Calendly for attorney consultation scheduling.',
    webhookPrompt: 'Post intake data to your CRM webhook for attorney follow-up.',
  },
  {
    id: 'nonprofit',
    label: 'Nonprofit Engagement',
    icon: '❤️',
    desc: 'Donation drives, volunteer sign-ups, event info',
    personality: 'You are a passionate and compassionate nonprofit engagement assistant named {name}. You share the organization\'s mission, inspire donations, recruit volunteers, and provide event information. You speak from the heart, making donors feel their contribution matters. You celebrate every donation — large or small — and help connect volunteers with meaningful opportunities.',
    triggers: [
      { type: 'tip_event', value: '', responseTemplate: 'Thank you so much, {username}! Your {amount} donation is going directly to the people who need it most. You are making a real difference!' },
      { type: 'chat_command', value: '!volunteer', responseTemplate: 'Thank you for wanting to help! We have volunteer opportunities in outreach, events, and mentorship. What area speaks to your passion?' },
      { type: 'chat_command', value: '!mission', responseTemplate: 'Our mission is to create lasting change in the lives of those we serve. Every dollar, every hour of volunteer time — it all adds up to something extraordinary.' },
    ],
  },
  {
    id: 'creator',
    label: 'Creator Monetization',
    icon: '🌟',
    desc: 'Merch drops, membership upsells, collab pitches',
    personality: 'You are an enthusiastic creator economy assistant named {name}. You promote merchandise drops, exclusive membership tiers, upcoming collabs, and limited-time offers. You speak authentically in the creator\'s voice, building FOMO and community excitement. You know all the current promotions and can answer questions about perks and pricing.',
    triggers: [
      { type: 'chat_command', value: '!merch', responseTemplate: 'The merch drop is LIVE and selling fast! Limited quantities available — grab yours before it\'s gone. Link in bio!' },
      { type: 'chat_command', value: '!join', responseTemplate: 'Ready to join the inner circle? Members get exclusive content, early access, and direct access to me. Link is in the description!' },
      { type: 'sub_event', value: '', responseTemplate: 'YOOOO {username} just joined! Welcome to the community — you\'re officially part of the movement now!' },
    ],
  },
];

var ANALYTICS_KEY  = 'swl_vab_analytics';
var STORAGE_KEY    = 'swl_voice_agents';

var SIM_DIALOGUES = {
  streaming:    ['Can you hype up the stream?', 'What\'s the sub count?', 'Someone just tipped $50'],
  healthcare:   ['I need to schedule an appointment', 'What are your hours?', 'Do you accept Blue Cross?'],
  realestate:   ['Can I see that listing?', 'What\'s the home worth?', 'I want to schedule a showing'],
  restaurant:   ['Can I make a reservation?', 'What are tonight\'s specials?', 'How long is the wait?'],
  fitness:      ['What classes are today?', 'Give me a fitness tip', 'How do I cancel my membership?'],
  ecommerce:    ['Where is my order?', 'I want to return something', 'When will it ship?'],
  legal:        ['I need a lawyer', 'Schedule a consultation', 'What do you handle?'],
  nonprofit:    ['How can I volunteer?', 'Tell me about your mission', 'I want to donate'],
  creator:      ['Where can I get merch?', 'How do I join?', 'What are the membership perks?'],
};

function loadAgents() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveAgents(agents) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(agents)); } catch {}
}
function loadAnalytics() {
  try { return JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '{"total":0,"byAgent":{}}'); }
  catch { return { total: 0, byAgent: {} }; }
}
function recordTrigger(agentId) {
  try {
    var a = loadAnalytics();
    a.total = (a.total || 0) + 1;
    a.byAgent[agentId] = (a.byAgent[agentId] || 0) + 1;
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(a));
  } catch {}
}
function getElKey()  { try { return localStorage.getItem('swl_apikey_elevenlabs') || ''; } catch { return ''; } }
function getOrKey()  { try { return localStorage.getItem('swl_apikey_openrouter') || ''; } catch { return ''; } }

function blankAgent() {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    name: '',
    industry: 'streaming',
    personality: '',
    voiceId: 'rachel',
    triggers: [{ type: 'chat_command', value: '!ask', responseTemplate: 'Thanks for asking! {message}' }],
    webhookUrl: '',
    bookingUrl: '',
    active: true,
    createdAt: Date.now(),
  };
}

function TriggerRow({ trigger, onChange, onRemove }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <MobileSelect
            value={trigger.type}
            onChange={function(v) { onChange({ ...trigger, type: v }); }}
            options={TRIGGER_TYPES.map(function(tt) { return { value: tt.id, label: tt.label }; })}
            placeholder="Trigger type"
          />
          {(trigger.type === 'chat_command' || trigger.type === 'keyword') && (
            <input
              value={trigger.value || ''}
              onChange={function(e) { onChange({ ...trigger, value: e.target.value }); }}
              placeholder={trigger.type === 'chat_command' ? '!ask' : 'keyword'}
              style={{ width: 90, padding: '6px 8px', borderRadius: 7, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(201,168,76,0.2)', color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: 'monospace' }}
            />
          )}
        </div>
        <input
          value={trigger.responseTemplate || ''}
          onChange={function(e) { onChange({ ...trigger, responseTemplate: e.target.value }); }}
          placeholder="Response template — use {message}, {username}, {amount}"
          style={{ width: '100%', padding: '6px 8px', borderRadius: 7, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      </div>
      <button onClick={onRemove} style={{ padding: '6px 7px', borderRadius: 6, background: 'rgba(107,31,42,0.1)', border: '1px solid rgba(107,31,42,0.2)', color: BURG, cursor: 'pointer', flexShrink: 0 }}>
        <Trash2 style={{ width: 12, height: 12 }} />
      </button>
    </div>
  );
}

export default function VoiceAgentBuilder() {
  var { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: function() { return base44.auth.me(); } });
  var { invoke: invokeAI, loading: aiLoading } = useOpenRouter();

  var [agents, setAgents]           = useState(loadAgents);
  var [editingId, setEditingId]     = useState(null);
  var [draft, setDraft]             = useState(null);
  var [tab, setTab]                 = useState('agents');
  var [testText, setTestText]       = useState('');
  var [testing, setTesting]         = useState(false);
  var [simMessages, setSimMessages] = useState([]);
  var [simInput, setSimInput]       = useState('');
  var [simRunning, setSimRunning]   = useState(false);
  var audioRef = useRef(null);
  var analytics = loadAnalytics();

  function applyTemplate(tpl) {
    var agent = blankAgent();
    agent.name        = tpl.label + ' Agent';
    agent.industry    = tpl.id;
    agent.personality = tpl.personality.replace('{name}', tpl.label + ' Agent');
    agent.triggers    = tpl.triggers || agent.triggers;
    setDraft(agent);
    setEditingId(agent.id);
    setTab('agents');
    toast.success('Template applied — customize and save!');
  }

  function startNew() {
    var a = blankAgent();
    setDraft(a);
    setEditingId(a.id);
  }

  function editAgent(agent) {
    setDraft({ ...agent });
    setEditingId(agent.id);
  }

  function saveDraft() {
    if (!draft) return;
    if (!draft.name.trim())        { toast.error('Agent needs a name.'); return; }
    if (!draft.personality.trim()) { toast.error('Add a personality prompt.'); return; }
    var updated = agents.find(function(a) { return a.id === draft.id; })
      ? agents.map(function(a) { return a.id === draft.id ? draft : a; })
      : [...agents, draft];
    setAgents(updated);
    saveAgents(updated);
    setDraft(null);
    setEditingId(null);
    toast.success('Agent "' + draft.name + '" saved.');
  }

  function deleteAgent(id) {
    var updated = agents.filter(function(a) { return a.id !== id; });
    setAgents(updated);
    saveAgents(updated);
    if (editingId === id) { setDraft(null); setEditingId(null); }
    toast.success('Agent removed.');
  }

  function toggleActive(id) {
    var updated = agents.map(function(a) { return a.id === id ? { ...a, active: !a.active } : a; });
    setAgents(updated);
    saveAgents(updated);
  }

  function updateTrigger(idx, t) {
    setDraft(function(d) { return { ...d, triggers: d.triggers.map(function(tr, i) { return i === idx ? t : tr; }) }; });
  }
  function removeTrigger(idx) {
    setDraft(function(d) { return { ...d, triggers: d.triggers.filter(function(_, i) { return i !== idx; }) }; });
  }
  function addTrigger() {
    setDraft(function(d) { return { ...d, triggers: [...(d.triggers || []), { type: 'chat_command', value: '', responseTemplate: '' }] }; });
  }

  async function testVoice() {
    var elKey = getElKey();
    if (!elKey) { toast.error('Add your ElevenLabs API key in Settings → API Keys first.'); return; }
    var text = testText.trim() || ((draft && draft.personality) ? draft.personality.slice(0, 150) : 'Hello, I am your AI voice agent for SeeWhy LIVE.');
    var voiceId = (draft && draft.voiceId) || 'rachel';
    setTesting(true);
    try {
      var res = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
        method: 'POST',
        headers: { 'xi-api-key': elKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
        body: JSON.stringify({ text: text, model_id: 'eleven_monolingual_v1', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
      });
      if (!res.ok) throw new Error('ElevenLabs ' + res.status);
      var blob = await res.blob();
      var url = URL.createObjectURL(blob);
      if (audioRef.current) { audioRef.current.src = url; audioRef.current.play(); }
      toast.success('Playing preview…');
    } catch (e) {
      toast.error('Voice test failed: ' + e.message);
    } finally {
      setTesting(false);
    }
  }

  async function sendSimMessage(text) {
    if (!text.trim() || simRunning) return;
    var userMsg = text.trim();
    setSimMessages(function(m) { return [...m, { role: 'user', text: userMsg }]; });
    setSimInput('');
    setSimRunning(true);
    try {
      var personality = (draft && draft.personality) || 'You are a helpful AI assistant.';
      var reply = await invokeAI({
        prompt: userMsg,
        systemPrompt: personality + '\n\nRespond in 1–2 sentences max, in character. Never break character.',
        maxTokens: 120,
      });
      setSimMessages(function(m) { return [...m, { role: 'agent', text: reply.trim() }]; });
      if ((draft && draft.id)) recordTrigger(draft.id);
      if ((draft && draft.voiceId) && getElKey()) {
        var res = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + draft.voiceId, {
          method: 'POST',
          headers: { 'xi-api-key': getElKey(), 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
          body: JSON.stringify({ text: reply.trim(), model_id: 'eleven_monolingual_v1', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
        });
        if (res.ok) {
          var blob = await res.blob();
          var url = URL.createObjectURL(blob);
          if (audioRef.current) { audioRef.current.src = url; audioRef.current.play(); }
        }
      }
    } catch (e) {
      setSimMessages(function(m) { return [...m, { role: 'agent', text: '[Error: ' + e.message + ']' }]; });
    } finally {
      setSimRunning(false);
    }
  }

  async function generatePersonality() {
    if (!(draft && draft.name && draft.name.trim())) { toast.error('Name the agent first.'); return; }
    var industry = INDUSTRY_TEMPLATES.find(function(t) { return t.id === draft.industry; });
    try {
      var text = await invokeAI({
        prompt: 'Write a concise AI voice agent personality prompt for "' + draft.name + '", a ' + ((industry && industry.label) || 'streaming') + ' assistant on SeeWhy LIVE.\n' +
          'Industry focus: ' + ((industry && industry.desc) || 'live streaming') + '\n' +
          'Requirements: 80 words max, conversational, stays in character, no fluff.\n' +
          'Output only the personality text, no labels or headers.',
        maxTokens: 200,
      });
      setDraft(function(d) { return { ...d, personality: text.trim() }; });
      toast.success('Personality generated!');
    } catch {
      toast.error('Generation failed — check your OpenRouter API key.');
    }
  }

  var hasElKey    = !!getElKey();
  var hasOrKey    = !!getOrKey();
  var simStarters = SIM_DIALOGUES[(draft && draft.industry)] || SIM_DIALOGUES.streaming;

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'Barlow Condensed, sans-serif', paddingBottom: 60 }}>
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(7,5,10,0.97)', borderBottom: '1px solid rgba(201,168,76,0.12)', backdropFilter: 'blur(12px)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: GOLD + '20', border: '1px solid ' + GOLD + '40' }}>
          <Bot style={{ width: 16, height: 16, color: GOLD }} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1, fontFamily: 'Barlow Condensed, sans-serif' }}>Voice Agent Builder</h1>
          <p style={{ fontSize: 11, color: DIM, fontFamily: 'Barlow Condensed, sans-serif' }}>AI voice agents for live streams &amp; business automation</p>
        </div>
        <button onClick={startNew} style={{ padding: '7px 14px', borderRadius: 8, background: GOLD + '20', border: '1px solid ' + GOLD + '45', color: GOLD, cursor: 'pointer', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Barlow Condensed, sans-serif' }}>
          <Plus style={{ width: 12, height: 12 }} /> New Agent
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, padding: '8px 16px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {[
          { id: 'agents',    label: 'My Agents',  icon: <Bot style={{ width: 11, height: 11 }} /> },
          { id: 'templates', label: 'Templates',  icon: <BookOpen style={{ width: 11, height: 11 }} /> },
          { id: 'analytics', label: 'Analytics',  icon: <BarChart2 style={{ width: 11, height: 11 }} /> },
        ].map(function(t) {
          return (
            <button key={t.id} onClick={function() { setTab(t.id); }} style={{ padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Barlow Condensed, sans-serif', background: tab === t.id ? GOLD + '18' : 'transparent', border: '1px solid ' + (tab === t.id ? GOLD + '40' : 'transparent'), color: tab === t.id ? GOLD : DIM }}>
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* API key warnings */}
        {!hasElKey && (
          <div style={{ borderRadius: 10, padding: '10px 14px', background: 'rgba(107,31,42,0.12)', border: '1px solid rgba(107,31,42,0.3)', fontSize: 12, color: 'rgba(255,150,100,0.85)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            No ElevenLabs API key — go to <strong>Settings → API Keys</strong> to enable voice preview &amp; live speech.
          </div>
        )}
        {!hasOrKey && (
          <div style={{ borderRadius: 10, padding: '10px 14px', background: 'rgba(107,31,42,0.08)', border: '1px solid rgba(107,31,42,0.2)', fontSize: 12, color: 'rgba(255,150,100,0.7)', fontFamily: 'Barlow Condensed, sans-serif' }}>
            No OpenRouter API key — AI personality generation and simulated dialogue require it.
          </div>
        )}

        {/* ── TEMPLATES TAB ── */}
        {tab === 'templates' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {INDUSTRY_TEMPLATES.map(function(tpl) {
              return (
                <div key={tpl.id} style={{ borderRadius: 12, background: 'rgba(13,6,24,0.8)', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px 14px', flex: 1 }}>
                    <p style={{ fontSize: 22, lineHeight: 1, marginBottom: 6 }}>{tpl.icon}</p>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>{tpl.label}</p>
                    <p style={{ fontSize: 11, color: DIM, fontFamily: 'Barlow Condensed, sans-serif', marginTop: 3 }}>{tpl.desc}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 6, fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {(tpl.triggers && tpl.triggers.length) || 0} triggers pre-built
                    </p>
                  </div>
                  <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button onClick={function() { applyTemplate(tpl); }} style={{ width: '100%', padding: '7px 0', borderRadius: 7, background: GOLD + '15', border: '1px solid ' + GOLD + '35', color: GOLD, cursor: 'pointer', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: 'Barlow Condensed, sans-serif' }}>
                      Use Template
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {tab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ borderRadius: 12, padding: '14px 16px', background: 'rgba(13,6,24,0.8)', border: '1px solid rgba(201,168,76,0.12)' }}>
              <p style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'Barlow Condensed, sans-serif' }}>Session Triggers</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif', lineHeight: 1 }}>{analytics.total}</p>
              <p style={{ fontSize: 11, color: DIM, fontFamily: 'Barlow Condensed, sans-serif' }}>total triggers fired (local session)</p>
            </div>
            {agents.map(function(agent) {
              var count = analytics.byAgent[agent.id] || 0;
              var pct   = analytics.total ? Math.round((count / analytics.total) * 100) : 0;
              return (
                <div key={agent.id} style={{ borderRadius: 10, padding: '11px 14px', background: 'rgba(13,6,24,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Bot style={{ width: 12, height: 12, color: GOLD, flexShrink: 0 }} />
                    <p style={{ fontSize: 12, fontWeight: 800, color: '#fff', flex: 1, fontFamily: 'Barlow Condensed, sans-serif' }}>{agent.name}</p>
                    <p style={{ fontSize: 11, color: GOLD, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif' }}>{count} <span style={{ color: DIM, fontWeight: 400 }}>fires</span></p>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: GOLD, borderRadius: 2, transition: 'width 0.4s' }} />
                  </div>
                </div>
              );
            })}
            {agents.length === 0 && <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, textAlign: 'center', padding: 24, fontFamily: 'Barlow Condensed, sans-serif' }}>Create agents to see trigger analytics.</p>}
          </div>
        )}

        {/* ── AGENTS TAB ── */}
        {tab === 'agents' && (
          <>
            {agents.length === 0 && !draft && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13, fontFamily: 'Barlow Condensed, sans-serif' }}>
                No voice agents yet. Hit <strong style={{ color: GOLD }}>New Agent</strong> or pick a <strong style={{ color: GOLD }}>Template</strong> to get started.
              </div>
            )}

            {agents.map(function(agent) {
              return (
                <div key={agent.id} style={{ borderRadius: 12, background: 'rgba(13,6,24,0.8)', border: '1px solid ' + (editingId === agent.id ? GOLD + '40' : 'rgba(255,255,255,0.07)'), overflow: 'hidden' }}>
                  <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: agent.active ? '#6DBF7E' : 'rgba(255,255,255,0.2)' }} />
                    <span style={{ fontSize: 18 }}>{(function(){ var _it = INDUSTRY_TEMPLATES.find(function(t){ return t.id === agent.industry; }); return _it ? _it.icon : null; })() || '🤖'}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>{agent.name}</p>
                      <p style={{ fontSize: 10, color: DIM, fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {(agent.triggers && agent.triggers.length) || 0} trigger{(agent.triggers && agent.triggers.length) !== 1 ? 's' : ''} · {(EL_VOICES.find(function(v) { return v.id === agent.voiceId; }) && EL_VOICES.find(function(v) { return v.id === agent.voiceId; }).label) || agent.voiceId}
                        {agent.webhookUrl ? ' · webhook' : ''}
                        {agent.bookingUrl ? ' · booking' : ''}
                      </p>
                    </div>
                    <button onClick={function() { toggleActive(agent.id); }} style={{ padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: agent.active ? 'rgba(109,191,126,0.12)' : 'rgba(255,255,255,0.05)', border: '1px solid ' + (agent.active ? 'rgba(109,191,126,0.3)' : 'rgba(255,255,255,0.07)'), color: agent.active ? '#6DBF7E' : DIM, fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {agent.active ? 'Active' : 'Off'}
                    </button>
                    <button onClick={function() { if (editingId === agent.id) { setEditingId(null); setDraft(null); setSimMessages([]); } else { editAgent(agent); } }} style={{ padding: '5px 10px', borderRadius: 6, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: GOLD, cursor: 'pointer', fontSize: 10, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif' }}>
                      {editingId === agent.id ? 'Close' : 'Edit'}
                    </button>
                    <button onClick={function() { deleteAgent(agent.id); }} style={{ padding: '5px 7px', borderRadius: 6, background: 'rgba(107,31,42,0.08)', border: '1px solid rgba(107,31,42,0.2)', color: BURG, cursor: 'pointer' }}>
                      <Trash2 style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* ── EDITOR ── */}
            {draft && (
              <div style={{ borderRadius: 14, background: 'rgba(13,6,24,0.9)', border: '1px solid ' + GOLD + '35', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  {agents.find(function(a) { return a.id === draft.id; }) ? 'Edit: ' + (draft.name || 'Agent') : 'New Agent'}
                </div>

                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Industry */}
                  <div>
                    <label style={{ fontSize: 11, color: DIM, fontFamily: 'Barlow Condensed, sans-serif' }}>Industry / Role</label>
                    <MobileSelect
                      value={draft.industry || 'streaming'}
                      onChange={function(v) { setDraft(function(d) { return { ...d, industry: v }; }); }}
                      options={INDUSTRY_TEMPLATES.map(function(t) { return { value: t.id, label: t.icon + ' ' + t.label }; })}
                      placeholder="Industry / Role"
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label style={{ fontSize: 11, color: DIM, fontFamily: 'Barlow Condensed, sans-serif' }}>Agent Name</label>
                    <input value={draft.name} onChange={function(e) { setDraft(function(d) { return { ...d, name: e.target.value }; }); }} placeholder="e.g. SwanBot, AuraVoice, Coach Riley" style={{ marginTop: 4, width: '100%', padding: '9px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(201,168,76,0.25)', color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>

                  {/* Personality */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <label style={{ fontSize: 11, color: DIM, fontFamily: 'Barlow Condensed, sans-serif', flex: 1 }}>Personality Prompt</label>
                      <button onClick={generatePersonality} disabled={aiLoading} style={{ padding: '3px 9px', borderRadius: 5, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: GOLD, cursor: 'pointer', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif', opacity: aiLoading ? 0.5 : 1 }}>
                        <Zap style={{ width: 10, height: 10 }} /> {aiLoading ? 'Generating…' : 'AI Generate'}
                      </button>
                    </div>
                    <textarea
                      value={draft.personality}
                      onChange={function(e) { setDraft(function(d) { return { ...d, personality: e.target.value }; }); }}
                      placeholder="Describe how this agent speaks and behaves…"
                      rows={4}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Voice */}
                  <div>
                    <label style={{ fontSize: 11, color: DIM, fontFamily: 'Barlow Condensed, sans-serif' }}>ElevenLabs Voice</label>
                    <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                      {EL_VOICES.map(function(v) {
                        return (
                          <button key={v.id} onClick={function() { setDraft(function(d) { return { ...d, voiceId: v.id }; }); }} style={{ padding: '7px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', background: draft.voiceId === v.id ? GOLD + '18' : 'rgba(0,0,0,0.3)', border: '1px solid ' + (draft.voiceId === v.id ? GOLD + '55' : 'rgba(255,255,255,0.06)') }}>
                            <p style={{ fontSize: 11, fontWeight: 800, color: draft.voiceId === v.id ? GOLD : 'rgba(255,255,255,0.75)', fontFamily: 'Barlow Condensed, sans-serif' }}>{v.label}</p>
                            <p style={{ fontSize: 9, color: DIM, fontFamily: 'Barlow Condensed, sans-serif' }}>{v.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Triggers */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: DIM, fontFamily: 'Barlow Condensed, sans-serif', flex: 1 }}>Triggers</span>
                      <button onClick={addTrigger} style={{ padding: '3px 9px', borderRadius: 5, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: GOLD, cursor: 'pointer', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif' }}>
                        <Plus style={{ width: 10, height: 10 }} /> Add
                      </button>
                    </div>
                    {(draft.triggers || []).map(function(tr, i) {
                      return (
                        <TriggerRow key={i} trigger={tr} onChange={function(t) { updateTrigger(i, t); }} onRemove={function() { removeTrigger(i); }} />
                      );
                    })}
                    {!(draft.triggers && draft.triggers.length) && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'Barlow Condensed, sans-serif' }}>No triggers — add one above.</p>}
                  </div>

                  {/* Webhook */}
                  <div>
                    <label style={{ fontSize: 11, color: DIM, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif' }}>
                      <Webhook style={{ width: 11, height: 11 }} /> CRM Webhook URL <span style={{ color: 'rgba(255,255,255,0.15)' }}>(optional)</span>
                    </label>
                    <input
                      value={draft.webhookUrl || ''}
                      onChange={function(e) { setDraft(function(d) { return { ...d, webhookUrl: e.target.value }; }); }}
                      placeholder="https://your-crm.com/webhook/voice-agent"
                      style={{ marginTop: 4, width: '100%', padding: '9px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                    />
                    {(INDUSTRY_TEMPLATES.find(function(t) { return t.id === draft.industry; }) && INDUSTRY_TEMPLATES.find(function(t) { return t.id === draft.industry; }).webhookPrompt) && (
                      <p style={{ fontSize: 10, color: 'rgba(201,168,76,0.5)', marginTop: 3, fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {INDUSTRY_TEMPLATES.find(function(t) { return t.id === draft.industry; }) && INDUSTRY_TEMPLATES.find(function(t) { return t.id === draft.industry; }).webhookPrompt}
                      </p>
                    )}
                  </div>

                  {/* Booking URL */}
                  <div>
                    <label style={{ fontSize: 11, color: DIM, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif' }}>
                      <Link style={{ width: 11, height: 11 }} /> Calendly / Booking URL <span style={{ color: 'rgba(255,255,255,0.15)' }}>(optional)</span>
                    </label>
                    <input
                      value={draft.bookingUrl || ''}
                      onChange={function(e) { setDraft(function(d) { return { ...d, bookingUrl: e.target.value }; }); }}
                      placeholder="https://calendly.com/yourpage"
                      style={{ marginTop: 4, width: '100%', padding: '9px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                    />
                    {(INDUSTRY_TEMPLATES.find(function(t) { return t.id === draft.industry; }) && INDUSTRY_TEMPLATES.find(function(t) { return t.id === draft.industry; }).bookingPrompt) && (
                      <p style={{ fontSize: 10, color: 'rgba(201,168,76,0.5)', marginTop: 3, fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {INDUSTRY_TEMPLATES.find(function(t) { return t.id === draft.industry; }) && INDUSTRY_TEMPLATES.find(function(t) { return t.id === draft.industry; }).bookingPrompt}
                      </p>
                    )}
                  </div>

                  {/* Voice preview */}
                  <div style={{ borderRadius: 10, padding: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Barlow Condensed, sans-serif' }}>Voice Preview</p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        value={testText}
                        onChange={function(e) { setTestText(e.target.value); }}
                        placeholder="Type text to preview, or leave blank…"
                        style={{ flex: 1, padding: '8px 10px', borderRadius: 7, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                      />
                      <button onClick={testVoice} disabled={testing || !hasElKey} style={{ padding: '8px 14px', borderRadius: 7, background: testing ? 'rgba(201,168,76,0.06)' : GOLD + '18', border: '1px solid ' + GOLD + '40', color: testing ? DIM : GOLD, cursor: hasElKey ? 'pointer' : 'not-allowed', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Barlow Condensed, sans-serif' }}>
                        {testing ? <><Volume2 style={{ width: 13, height: 13 }} /> Playing&hellip;</> : <><Play style={{ width: 13, height: 13 }} /> Test</>}
                      </button>
                    </div>
                  </div>

                  {/* Simulated Dialogue */}
                  <div style={{ borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MessageSquare style={{ width: 12, height: 12, color: GOLD }} />
                      <p style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', flex: 1, fontFamily: 'Barlow Condensed, sans-serif' }}>Simulate Dialogue</p>
                      <button onClick={function() { setSimMessages([]); }} style={{ padding: '2px 8px', borderRadius: 4, background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', color: DIM, cursor: 'pointer', fontSize: 9, fontFamily: 'Barlow Condensed, sans-serif' }}>
                        Clear
                      </button>
                    </div>

                    {/* Starter chips */}
                    {simMessages.length === 0 && (
                      <div style={{ padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {simStarters.map(function(s, i) {
                          return (
                            <button key={i} onClick={function() { sendSimMessage(s); }} style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: GOLD, cursor: 'pointer', fontSize: 10, fontFamily: 'Barlow Condensed, sans-serif' }}>
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Messages */}
                    {simMessages.length > 0 && (
                      <div style={{ maxHeight: 200, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {simMessages.map(function(msg, i) {
                          return (
                            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                              <div style={{ maxWidth: '80%', padding: '7px 10px', borderRadius: msg.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px', background: msg.role === 'user' ? GOLD + '18' : 'rgba(255,255,255,0.07)', border: '1px solid ' + (msg.role === 'user' ? GOLD + '30' : 'rgba(255,255,255,0.06)'), fontSize: 12, color: msg.role === 'user' ? GOLD : 'rgba(255,255,255,0.85)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                                {msg.text}
                              </div>
                            </div>
                          );
                        })}
                        {simRunning && (
                          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <div style={{ padding: '7px 14px', borderRadius: '10px 10px 10px 2px', background: 'rgba(255,255,255,0.06)', fontSize: 12, color: DIM, fontFamily: 'Barlow Condensed, sans-serif' }}>
                              <RefreshCw style={{ width: 10, height: 10, display: 'inline', marginRight: 4 }} />thinking&hellip;
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Input */}
                    <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 6 }}>
                      <input
                        value={simInput}
                        onChange={function(e) { setSimInput(e.target.value); }}
                        onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendSimMessage(simInput); } }}
                        placeholder="Ask the agent something…"
                        style={{ flex: 1, padding: '7px 10px', borderRadius: 7, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                      />
                      <button onClick={function() { sendSimMessage(simInput); }} disabled={simRunning || !hasOrKey} style={{ padding: '7px 13px', borderRadius: 7, background: GOLD + '15', border: '1px solid ' + GOLD + '35', color: GOLD, cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'Barlow Condensed, sans-serif' }}>
                        Send
                      </button>
                    </div>
                  </div>

                  {/* Save */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={saveDraft} style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: GOLD + '22', border: '1px solid ' + GOLD + '55', color: GOLD, cursor: 'pointer', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'Barlow Condensed, sans-serif' }}>
                      <Save style={{ width: 14, height: 14 }} /> Save Agent
                    </button>
                    <button onClick={function() { setDraft(null); setEditingId(null); setSimMessages([]); }} style={{ padding: '11px 16px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: DIM, cursor: 'pointer', fontSize: 12, fontFamily: 'Barlow Condensed, sans-serif' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {/* Creator Studios */}
        <div style={{ margin: '0 0 16px', padding: 16, borderRadius: 16, border: '1px solid rgba(123,45,139,0.22)', background: 'rgba(13,6,24,0.5)' }}>
          <p style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(176,102,204,0.7)', marginBottom: 12 }}>Creator Studios</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
            {[
              { emoji: '🎬', label: 'Micro Drama', sub: 'Episode creator', href: 'EpisodeCreatorStudio', color: '#7B2D8B' },
              { emoji: '🎵', label: 'AI Music', sub: 'Beat & vocal studio', href: 'AIMusic', color: '#00A8E8' },
              { emoji: '🎙️', label: 'Podcast Studio', sub: 'AI-assisted pods', href: 'PodcastStudio', color: '#B066CC' },
            ].map(function(s) {
              return (
                <RouterLink key={s.href} to={createPageUrl(s.href)} style={{ textDecoration: 'none' }}>
                  <div style={{ borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(123,45,139,0.18)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow Condensed, sans-serif', marginTop: 2 }}>{s.sub}</div>
                  </div>
                </RouterLink>
              );
            })}
          </div>
          <RouterLink to={createPageUrl('EpisodeCreatorStudio')} style={{ textDecoration: 'none' }}>
            <div style={{ borderRadius: 12, padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(123,45,139,0.1)', border: '1px solid rgba(123,45,139,0.3)', color: '#B066CC', cursor: 'pointer' }}>
              🎬 Launch Episode Creator Studio →
            </div>
          </RouterLink>
        </div>
      </div>
    </div>
  );
}
