import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { Phone, Flame, Layers } from 'lucide-react';
import OutcomeModal from './OutcomeModal';
import {
  completeProxyCallSession,
  createInteractionLog,
  getReusableFollowUpTemplate,
  incrementLeadPhoneIndex,
  logOutboundMessage,
  saveReusableFollowUpTemplate,
  startProxyCallSession,
  updateLeadStatus,
} from '../services/leadService';
import { supabase } from '../supabaseClient';
import { playNailGunSound, playSwipeWhooshSound } from '../utils/soundFx';
import { initiateSignalWireCall, sendFollowUpTextThroughProxy } from '../services/dialerLogic';

const TEAR_OFF_EXIT_POLYGON =
  'polygon(0 0, 100% 0, 100% 75%, 85% 90%, 70% 75%, 55% 90%, 40% 75%, 25% 90%, 10% 75%, 0 90%)';

const SHINGLE_ENTRY = {
  y: -120,
  opacity: 0,
  scale: 0.985,
};

const SHINGLE_ACTIVE = {
  y: 0,
  opacity: 1,
  scale: 1,
  transition: { type: 'spring', stiffness: 280, damping: 22, mass: 0.9 },
};

const SHINGLE_EXIT = {
  y: 72,
  scale: 0.985,
  opacity: 0,
  transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] },
};

const TEAR_OFF_EXIT = {
  clipPath: ['polygon(0 0, 100% 0, 100% 100%, 0 100%)', TEAR_OFF_EXIT_POLYGON],
  y: 800,
  rotate: -10,
  opacity: 0,
  transition: { duration: 0.8, ease: [0.2, 0.9, 0.2, 1] },
};

const PitchGauge = ({ score, needleRef }) => (
  <svg viewBox="0 0 100 60" className="h-16 w-full">
    <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="#20364f" strokeWidth="9" />
    <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="#76e4ff" strokeWidth="4" />
    <line
      ref={needleRef}
      x1="50"
      y1="50"
      x2="50"
      y2="14"
      stroke="#f8fafc"
      strokeWidth="3"
      strokeLinecap="round"
      transform="rotate(-90 50 50)"
    />
    <circle cx="50" cy="50" r="4" fill="#7ce8ff" />
    <text x="50" y="58" textAnchor="middle" className="fill-zinc-200 text-[8px] font-black">
      {Math.round(score)}
    </text>
  </svg>
);

const maskAddress = (address) => {
  const value = String(address || '').trim();
  if (!value) return 'Masked Territory';
  return value.replace(/^\d+/, '###');
};

const DEFAULT_FOLLOW_UP_TEMPLATE =
  "Hey, this is the roofing team. Sorry we missed you on the call just now. If you'd like, text me back here and I can get you a quick roof check this week.";

const LeadCardStack = ({ leads: incomingLeads, onQueueChanged, onStatusSaved }) => {
  const [leads, setLeads] = useState(incomingLeads || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDialing, setIsDialing] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);
  const [callStartedAt, setCallStartedAt] = useState(null);
  const [exitMode, setExitMode] = useState('shingle');
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpLead, setFollowUpLead] = useState(null);
  const [followUpSessionId, setFollowUpSessionId] = useState(null);
  const [followUpDraft, setFollowUpDraft] = useState(DEFAULT_FOLLOW_UP_TEMPLATE);
  const [reusableTemplate, setReusableTemplate] = useState(DEFAULT_FOLLOW_UP_TEMPLATE);
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  const [followUpNotice, setFollowUpNotice] = useState('');

  const needleRef = useRef(null);
  const nailFxRef = useRef(null);
  const shingleTextureRef = useRef(null);
  const cardRef = useRef(null);

  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-220, 0, 220], [-8, 0, 8]);
  const dragScale = useTransform(dragX, [-220, 0, 220], [0.985, 1, 0.985]);

  useEffect(() => {
    setLeads(incomingLeads || []);
    setCurrentIndex(0);
  }, [incomingLeads]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isDialing) {
        setIsDialing(false);
        setShowOutcome(true);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [isDialing]);

  const activeLead = useMemo(() => leads[currentIndex] || null, [leads, currentIndex]);
  const phoneCount = activeLead?.phone_numbers?.length || 0;
  const safePhoneIndex = Math.min(activeLead?.current_phone_index || 0, Math.max(phoneCount - 1, 0));
  const activePhone = phoneCount > 0 ? activeLead?.phone_numbers?.[safePhoneIndex] : null;

  useEffect(() => {
    if (!activeLead || !needleRef.current) return;

    dragX.set(0);

    const score = Math.min(Math.max(activeLead.heat_score || 0, 0), 100);
    const targetAngle = -90 + (score / 100) * 180;

    gsap.to(needleRef.current, {
      attr: { transform: `rotate(${targetAngle} 50 50)` },
      duration: 0.42,
      ease: 'power2.out',
    });

    if (shingleTextureRef.current) {
      gsap.fromTo(
        shingleTextureRef.current,
        { yPercent: -24, opacity: 0.3 },
        { yPercent: 0, opacity: 0.82, duration: 0.35, ease: 'power2.out' },
      );
    }
  }, [activeLead]);

  useEffect(() => {
    let mounted = true;

    const loadTemplate = async () => {
      try {
        const savedTemplate = await getReusableFollowUpTemplate();
        const fromDb = savedTemplate?.template_body;
        const fromLocal = window.localStorage.getItem('plugleads_follow_up_template');
        const resolved = fromDb || fromLocal || DEFAULT_FOLLOW_UP_TEMPLATE;

        if (mounted) {
          setReusableTemplate(resolved);
          setFollowUpDraft(resolved);
        }
      } catch (error) {
        const fromLocal = window.localStorage.getItem('plugleads_follow_up_template');
        const resolved = fromLocal || DEFAULT_FOLLOW_UP_TEMPLATE;
        if (mounted) {
          setReusableTemplate(resolved);
          setFollowUpDraft(resolved);
        }
      }
    };

    loadTemplate();

    return () => {
      mounted = false;
    };
  }, []);

  const triggerNailGunConfirmation = () => {
    if (!nailFxRef.current) return;

    playNailGunSound();
    const timeline = gsap.timeline();
    timeline.fromTo(
      nailFxRef.current,
      {
        autoAlpha: 0,
        x: 22,
        y: -26,
        rotate: -20,
        scale: 0.72,
      },
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        duration: 0.14,
        ease: 'power4.out',
      },
    );
    timeline.to(
      nailFxRef.current,
      {
        autoAlpha: 0,
        duration: 0.3,
      },
      '+=0.06',
    );

    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { x: -2, y: -2, rotate: -0.4 },
        { x: 2, y: 1, rotate: 0.4, duration: 0.05, repeat: 2, yoyo: true, ease: 'power1.inOut' },
      );
    }
  };

  const removeActiveLeadFromQueue = (mode = 'shingle', velocity = 0) => {
    if (!activeLead) return;

    setExitMode(mode);
    playSwipeWhooshSound(mode === 'tear' || Math.abs(velocity) > 760);

    setLeads((prev) => prev.filter((item) => item.id !== activeLead.id));
    setCurrentIndex(0);
    if (onQueueChanged) onQueueChanged();

    setTimeout(() => setExitMode('shingle'), 40);
  };

  const handleCallClick = async () => {
    if (!activeLead || !activePhone) return;

    setCallStartedAt(Date.now());
    setIsDialing(true);
    await updateLeadStatus(activeLead.id, 'IN_PROGRESS');
    const session = await startProxyCallSession(activeLead.id, safePhoneIndex);
    setActiveSessionId(session?.id || null);
    await initiateSignalWireCall({
      leadId: activeLead.id,
      tenantId: activeLead.tenant_id,
      sessionId: session?.id || null,
      phoneIndex: safePhoneIndex,
    });
    setIsDialing(false);
    setShowOutcome(true);
  };

  const insertInteraction = async (actionType) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const durationSeconds =
      callStartedAt && Date.now() > callStartedAt ? Math.floor((Date.now() - callStartedAt) / 1000) : 0;

    await createInteractionLog({
      leadId: activeLead.id,
      userId: user.id,
      actionType,
      durationSeconds,
    });
  };

  const handleOutcome = async (outcome, gesture = {}) => {
    if (!activeLead) return;
    setShowOutcome(false);

    try {
      const statusForSession =
        outcome === 'spoke'
          ? 'completed'
          : outcome === 'dead' || outcome === 'disconnected'
            ? 'failed'
            : 'no_answer';

      if (activeSessionId) {
        await completeProxyCallSession(activeSessionId, statusForSession);
      }

      await insertInteraction(outcome.toUpperCase());

      if (outcome === 'no_answer' || outcome === 'busy') {
        const selectedLead = activeLead;
        const incrementResult = await incrementLeadPhoneIndex(activeLead.id);

        if (incrementResult?.exhausted) {
          await updateLeadStatus(activeLead.id, 'FOLLOW UP', {
            next_action_ts: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          });
          triggerNailGunConfirmation();
          if (onStatusSaved) onStatusSaved({ lead: activeLead, outcome: 'FOLLOW UP' });
          removeActiveLeadFromQueue('shingle');
          setFollowUpLead(selectedLead);
          setFollowUpSessionId(activeSessionId);
          setFollowUpDraft(reusableTemplate);
          setFollowUpOpen(true);
          return;
        }

        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === activeLead.id
              ? {
                  ...lead,
                  status: outcome === 'busy' ? 'BUSY' : 'NO_ANSWER',
                  current_phone_index: incrementResult.current_phone_index,
                }
              : lead,
          ),
        );
        setFollowUpLead(selectedLead);
        setFollowUpSessionId(activeSessionId);
        setFollowUpDraft(reusableTemplate);
        setFollowUpOpen(true);
        return;
      }

      if (outcome === 'wrong_number') {
        const incrementResult = await incrementLeadPhoneIndex(activeLead.id);

        if (incrementResult?.exhausted) {
          await updateLeadStatus(activeLead.id, 'FOLLOW UP', {
            next_action_ts: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          });
          triggerNailGunConfirmation();
          if (onStatusSaved) onStatusSaved({ lead: activeLead, outcome: 'FOLLOW UP' });
          removeActiveLeadFromQueue('shingle');
          return;
        }

        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === activeLead.id
              ? {
                  ...lead,
                  status: 'WRONG_NUMBER',
                  current_phone_index: incrementResult.current_phone_index,
                }
              : lead,
          ),
        );
        return;
      }

      if (outcome === 'spoke') {
        await updateLeadStatus(activeLead.id, 'SPOKE');
        triggerNailGunConfirmation();
        if (onStatusSaved) onStatusSaved({ lead: activeLead, outcome: 'SPOKE' });
        removeActiveLeadFromQueue('shingle', gesture.velocityX || 0);
        return;
      }

      if (outcome === 'dead' || outcome === 'disconnected') {
        await updateLeadStatus(activeLead.id, outcome.toUpperCase());
        triggerNailGunConfirmation();
        if (onStatusSaved) onStatusSaved({ lead: activeLead, outcome: outcome.toUpperCase() });
        removeActiveLeadFromQueue('tear', gesture.velocityX || 0);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to persist outcome:', error);
    } finally {
      setActiveSessionId(null);
    }
  };

  const closeFollowUpComposer = () => {
    setFollowUpOpen(false);
    setFollowUpLead(null);
    setFollowUpSessionId(null);
    setFollowUpNotice('');
  };

  const handleSendFollowUpText = async () => {
    if (!followUpLead || !followUpDraft.trim()) return;

    try {
      setSendingFollowUp(true);
      setFollowUpNotice('');

      const messageBody = followUpDraft.trim();

      const relayResponse = await sendFollowUpTextThroughProxy({
        leadId: followUpLead.id,
        tenantId: followUpLead.tenant_id,
        sessionId: followUpSessionId,
        messageBody,
      });

      await logOutboundMessage({
        leadId: followUpLead.id,
        callSessionId: followUpSessionId,
        channel: 'sms',
        direction: 'outbound',
        status: relayResponse?.status || 'sent',
        messageBody,
        providerMessageId: relayResponse?.messageSid || null,
      });

      await saveReusableFollowUpTemplate(messageBody);
      window.localStorage.setItem('plugleads_follow_up_template', messageBody);
      setReusableTemplate(messageBody);
      setFollowUpNotice('Follow-up text sent through proxy.');

      setTimeout(() => {
        closeFollowUpComposer();
      }, 700);
    } catch (error) {
      setFollowUpNotice(error?.message || 'Failed to send follow-up text.');
    } finally {
      setSendingFollowUp(false);
    }
  };

  if (!activeLead) {
    return (
      <div className="mx-auto flex h-[70vh] w-full max-w-lg items-center justify-center rounded-3xl border border-violet-200/25 bg-slate-950/50 p-8 text-center backdrop-blur-lg">
        <div>
          <p className="text-2xl font-black uppercase italic tracking-tight text-white">Territory Cleared</p>
          <p className="mt-2 text-sm uppercase tracking-widest text-slate-400">
            No active leads in this queue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="roof-felt relative flex h-[75vh] w-full items-center justify-center overflow-hidden rounded-[2.25rem] border border-violet-200/20 bg-slate-950/45">
      <AnimatePresence mode="wait">
        <motion.article
          key={activeLead.id}
          ref={cardRef}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragMomentum={false}
          dragElastic={0.12}
          dragTransition={{ bounceStiffness: 400, bounceDamping: 30 }}
          onDragEnd={(_, info) => {
            const commitDistance = 140;
            const fastSwipe = Math.abs(info.velocity.x) > 680;
            if (info.offset.x > commitDistance || (fastSwipe && info.velocity.x > 0)) {
              handleOutcome('spoke', { velocityX: info.velocity.x });
              return;
            }
            if (info.offset.x < -commitDistance || (fastSwipe && info.velocity.x < 0)) {
              handleOutcome('dead', { velocityX: info.velocity.x });
              return;
            }
          }}
          initial={SHINGLE_ENTRY}
          animate={SHINGLE_ACTIVE}
          exit={exitMode === 'tear' ? TEAR_OFF_EXIT : SHINGLE_EXIT}
          style={{ x: dragX, rotate: dragRotate, scale: dragScale }}
          className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-violet-200/25 bg-slate-950/75 p-7 shadow-2xl backdrop-blur-lg"
        >
          <div ref={shingleTextureRef} className="shingle-overlay" />
          <div ref={nailFxRef} className="nail-gun-fx" aria-hidden />

          <div className="relative mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-violet-300">Live Lead</p>
              <h2 className="mt-1 text-3xl font-black uppercase italic tracking-tight text-white sm:text-4xl">
                {maskAddress(activeLead.address)}
              </h2>
            </div>

            <div className="rounded-full border border-violet-300/40 bg-violet-300/10 px-3 py-1 text-xs font-black uppercase text-violet-200">
              {activeLead.status}
            </div>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-violet-200/20 bg-slate-900/80 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-300">
                <Flame size={14} /> Pitch Gauge
              </p>
              <PitchGauge score={activeLead.heat_score || 0} needleRef={needleRef} />
            </div>
            <div className="rounded-xl border border-violet-200/20 bg-slate-900/80 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-300">
                <Layers size={14} /> Number Queue
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {safePhoneIndex + 1} / {Math.max(phoneCount, 1)}
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                Heat Score {activeLead.heat_score}
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={handleCallClick}
            disabled={!activePhone}
            whileTap={{ scale: 0.92, y: 4, transition: { type: 'spring', stiffness: 600, damping: 10 } }}
            className="w-full rounded-2xl bg-violet-500 px-6 py-5 text-left text-slate-950 shadow-[0_15px_45px_rgba(34,211,238,0.35)] transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-900/75">
                  Proxy Dialer Armed
                </p>
                <p className="mt-1 text-xl font-black uppercase italic tracking-wide">
                  CALL NUMBER {safePhoneIndex + 1} OF {Math.max(phoneCount, 1)}
                </p>
              </div>
              <Phone size={24} />
            </div>
          </motion.button>

          {activePhone ? (
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-300">Dialing Through Secure Proxy</p>
          ) : (
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-rose-400">
              No phone number available
            </p>
          )}

          <p className="mt-6 text-center text-xs font-bold uppercase tracking-widest text-slate-500">
            Swipe right to mark spoke, left to tear-off dead lead.
          </p>
        </motion.article>
      </AnimatePresence>

      <OutcomeModal isOpen={showOutcome} onSelect={handleOutcome} leadAddress={maskAddress(activeLead.address)} />

      <AnimatePresence>
        {followUpOpen && followUpLead ? (
          <motion.section
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 22 }}
            className="follow-up-composer"
          >
            <p className="follow-up-kicker">One-Tap Follow-Up Text</p>
            <h3>{maskAddress(followUpLead.address)}</h3>
            <p className="follow-up-subtitle">
              Reusable default message. Edit once, then send in one tap.
            </p>

            <textarea
              value={followUpDraft}
              onChange={(event) => setFollowUpDraft(event.target.value)}
              className="follow-up-textarea"
              rows={4}
            />

            <div className="follow-up-actions">
              <button type="button" onClick={closeFollowUpComposer} className="follow-up-skip">
                Skip
              </button>
              <button
                type="button"
                onClick={handleSendFollowUpText}
                disabled={sendingFollowUp || !followUpDraft.trim()}
                className="follow-up-send"
              >
                {sendingFollowUp ? 'Sending...' : 'Send Follow-Up Text'}
              </button>
            </div>

            {followUpNotice ? <p className="follow-up-notice">{followUpNotice}</p> : null}
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default LeadCardStack;

