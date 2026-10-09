import React, { useState, useMemo, useCallback } from 'react';
import {
  BookOpen, Search, Bookmark, CheckCircle, Clock, ChevronRight,
  ChevronDown, X, Star, AlertTriangle, Info, Lightbulb, Award,
  ArrowLeft, BarChart2, Target, Zap,
} from 'lucide-react';
import { CATEGORIES, ALL_TOPICS, searchTopics, getTopicsByCategory, type Topic, type QuizQuestion } from '../../data/learning/learningData';
import { useLearningStore } from '../../store/useLearningStore';

// ─── Style tokens ─────────────────────────────────────────────────────────────

const BG_ROOT  = '#0F172A';
const BG_CARD  = '#1E293B';
const BG_CARD2 = '#243044';
const BORDER   = 'rgba(255,255,255,0.07)';
const TEXT_1   = '#F8FAFC';
const TEXT_2   = '#94A3B8';
const TEXT_3   = '#475569';
const ACCENT   = '#2563EB';

const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 14, ...extra,
});

// ─── Shared primitives ────────────────────────────────────────────────────────

function DiffBadge({ level }: { level: Topic['difficulty'] }) {
  const map = { beginner: ['#16A34A', 'Beginner'], intermediate: ['#D97706', 'Intermediate'], advanced: ['#DC2626', 'Advanced'] };
  const [color, label] = map[level];
  return (
    <span style={{ background: `${color}20`, color, border: `1px solid ${color}40`, borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '2px 8px' }}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: Topic['status'] }) {
  if (status === 'complete') return null;
  return (
    <span style={{ background: '#47556920', color: TEXT_3, border: `1px solid ${BORDER}`, borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '2px 8px' }}>
      Coming Soon
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 13, fontWeight: 700, color: TEXT_3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, marginTop: 28 }}>
      {children}
    </h3>
  );
}

// ─── Note block ───────────────────────────────────────────────────────────────

function NoteBlock({ type, title, body }: { type: string; title: string; body: string }) {
  const styles: Record<string, [string, React.ElementType]> = {
    note:     ['#2563EB', Info],
    warning:  ['#DC2626', AlertTriangle],
    tip:      ['#16A34A', Lightbulb],
    standard: ['#7C3AED', BookOpen],
  };
  const [color, Icon] = styles[type] ?? styles.note;
  return (
    <div style={{ background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Icon style={{ width: 14, height: 14, color }} />
        <span style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
      </div>
      <p style={{ fontSize: 13, color: TEXT_2, lineHeight: 1.7, margin: 0 }}>{body}</p>
    </div>
  );
}

// ─── Quiz component ───────────────────────────────────────────────────────────

function QuizSection({ questions, topicId }: { questions: QuizQuestion[]; topicId: string }) {
  const [answers, setAnswers]   = useState<Record<number, number>>({});
  const [submitted, setSubmit]  = useState(false);
  const { setQuizScore, markCompleted } = useLearningStore();

  const score = useMemo(() => {
    if (!submitted) return 0;
    return questions.reduce((s, q, i) => s + (answers[i] === q.correctIndex ? 1 : 0), 0);
  }, [submitted, answers, questions]);

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) return;
    setSubmit(true);
    const pct = Math.round((score / questions.length) * 100);
    setQuizScore(topicId, pct);
    if (pct === 100) markCompleted(topicId);
  };

  return (
    <div>
      {questions.map((q, qi) => {
        const chosen    = answers[qi];
        const isCorrect = submitted && chosen === q.correctIndex;
        const isWrong   = submitted && chosen !== undefined && chosen !== q.correctIndex;
        return (
          <div key={qi} style={{ ...card(), padding: '18px 20px', marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: TEXT_1, marginBottom: 14 }}>
              Q{qi + 1}. {q.question}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {q.options.map((opt, oi) => {
                const isSelected = chosen === oi;
                const isCorrectOpt = submitted && oi === q.correctIndex;
                let bg = BG_CARD2, border_ = BORDER, color = TEXT_2;
                if (isSelected && !submitted) { bg = `${ACCENT}20`; border_ = `${ACCENT}60`; color = TEXT_1; }
                if (isCorrectOpt) { bg = '#16A34A20'; border_ = '#16A34A60'; color = '#4ADE80'; }
                if (isSelected && isWrong) { bg = '#DC262620'; border_ = '#DC262660'; color = '#FCA5A5'; }
                return (
                  <button key={oi} onClick={() => !submitted && setAnswers((p) => ({ ...p, [qi]: oi }))}
                    style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 8, border: `1px solid ${border_}`, background: bg, color, fontSize: 13, cursor: submitted ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                    <span style={{ fontWeight: 700, marginRight: 8 }}>{String.fromCharCode(65 + oi)}.</span>{opt}
                  </button>
                );
              })}
            </div>
            {submitted && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#16A34A10', border: '1px solid #16A34A30', borderRadius: 8 }}>
                <p style={{ fontSize: 12, color: '#4ADE80', fontWeight: 700, marginBottom: 4 }}>Explanation</p>
                <p style={{ fontSize: 13, color: TEXT_2, lineHeight: 1.6, margin: 0 }}>{q.explanation}</p>
              </div>
            )}
          </div>
        );
      })}

      {!submitted ? (
        <button onClick={handleSubmit}
          disabled={Object.keys(answers).length < questions.length}
          style={{ padding: '12px 28px', borderRadius: 10, border: 'none', cursor: Object.keys(answers).length < questions.length ? 'not-allowed' : 'pointer', background: Object.keys(answers).length < questions.length ? '#1E293B' : `linear-gradient(135deg, ${ACCENT}, #1D4ED8)`, color: TEXT_1, fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>
          Submit Answers
        </button>
      ) : (
        <div style={{ padding: '16px 20px', background: score === questions.length ? '#16A34A15' : '#D9770615', border: `1px solid ${score === questions.length ? '#16A34A40' : '#D9770640'}`, borderRadius: 12 }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: score === questions.length ? '#4ADE80' : '#FCD34D', margin: 0 }}>
            Score: {score}/{questions.length} — {Math.round((score / questions.length) * 100)}%
            {score === questions.length && ' 🎉 Perfect score!'}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Topic Detail View ────────────────────────────────────────────────────────

type TopicTab = 'overview' | 'types' | 'principle' | 'selection' | 'troubleshooting' | 'standards' | 'quiz';

function TopicDetail({ topic, onBack }: { topic: Topic; onBack: () => void }) {
  const [tab, setTab]       = useState<TopicTab>('overview');
  const { toggleBookmark, markCompleted, addRecentlyViewed, isBookmarked, isCompleted, quizScores } = useLearningStore();
  const bookmarked = isBookmarked(topic.id);
  const completed  = isCompleted(topic.id);
  const c          = topic.content;

  React.useEffect(() => {
    addRecentlyViewed(topic.id);
  }, [topic.id]);

  const TABS: { id: TopicTab; label: string; show: boolean }[] = [
    { id: 'overview',       label: 'Overview',          show: true },
    { id: 'types',          label: 'Types',              show: !!(c?.types?.length) },
    { id: 'principle',      label: 'Working Principle',  show: !!c?.workingPrinciple },
    { id: 'selection',      label: 'Selection Guide',    show: !!(c?.selectionGuide?.length) },
    { id: 'troubleshooting',label: 'Troubleshooting',    show: !!(c?.troubleshooting?.length) },
    { id: 'standards',      label: 'Standards',          show: !!(c?.standards?.length) },
    { id: 'quiz',           label: 'Quiz',               show: !!(c?.quiz?.length) },
  ].filter((t) => t.show);

  if (!c) {
    return (
      <div style={{ padding: 32 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: ACCENT, cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 28 }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Topics
        </button>
        <div style={{ ...card(), padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{topic.icon}</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: TEXT_1, marginBottom: 8 }}>{topic.title}</h2>
          <p style={{ fontSize: 14, color: TEXT_2, marginBottom: 20 }}>{topic.intro}</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#47556920', border: `1px solid ${BORDER}`, borderRadius: 20 }}>
            <Clock style={{ width: 14, height: 14, color: TEXT_3 }} />
            <span style={{ fontSize: 12, color: TEXT_3 }}>Full content coming soon</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px 40px', maxWidth: 900 }}>
      {/* Header */}
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: ACCENT, cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 20, padding: 0 }}>
        <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Topics
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 28 }}>{topic.icon}</span>
            <div>
              <p style={{ fontSize: 11, color: TEXT_3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{topic.category}</p>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: TEXT_1, margin: 0, letterSpacing: '-0.02em' }}>{topic.title}</h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <DiffBadge level={topic.difficulty} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: TEXT_3 }}>
              <Clock style={{ width: 12, height: 12 }} />{topic.readingTime} min read
            </span>
            {completed && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#4ADE80' }}>
                <CheckCircle style={{ width: 12, height: 12 }} />Completed
              </span>
            )}
            {quizScores[topic.id] !== undefined && (
              <span style={{ fontSize: 12, color: '#FCD34D' }}>Quiz: {quizScores[topic.id]}%</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={() => toggleBookmark(topic.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: `1px solid ${bookmarked ? '#D97706' : BORDER}`, background: bookmarked ? '#D9770620' : 'transparent', color: bookmarked ? '#FCD34D' : TEXT_3, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Bookmark style={{ width: 13, height: 13 }} />
            {bookmarked ? 'Saved' : 'Save'}
          </button>
          <button onClick={() => markCompleted(topic.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: `1px solid ${completed ? '#16A34A' : BORDER}`, background: completed ? '#16A34A20' : 'transparent', color: completed ? '#4ADE80' : TEXT_3, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <CheckCircle style={{ width: 13, height: 13 }} />
            {completed ? 'Done' : 'Mark Done'}
          </button>
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
        {topic.tags.map((tag) => (
          <span key={tag} style={{ background: `${ACCENT}15`, color: '#93C5FD', border: `1px solid ${ACCENT}30`, borderRadius: 20, fontSize: 11, fontWeight: 600, padding: '3px 10px' }}>{tag}</span>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${BORDER}`, marginBottom: 28, overflowX: 'auto', paddingBottom: 0 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none', background: tab === t.id ? BG_CARD : 'transparent', color: tab === t.id ? TEXT_1 : TEXT_3, fontSize: 13, fontWeight: tab === t.id ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', borderBottom: tab === t.id ? `2px solid ${ACCENT}` : '2px solid transparent', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {tab === 'overview' && (
        <div>
          {c.notes?.map((n, i) => <NoteBlock key={i} type={n.type} title={n.title} body={n.body} />)}

          <SectionHeading>Introduction</SectionHeading>
          <div style={{ ...card(), padding: '20px 24px', marginBottom: 20 }}>
            {c.introduction.split('\n\n').map((para, i) => (
              <p key={i} style={{ fontSize: 14, color: TEXT_2, lineHeight: 1.8, margin: i > 0 ? '12px 0 0' : 0 }}>{para}</p>
            ))}
          </div>

          {c.keyFacts?.length && (
            <>
              <SectionHeading>Key Facts</SectionHeading>
              <div style={{ ...card(), padding: '16px 20px', marginBottom: 20 }}>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {c.keyFacts.map((fact, i) => (
                    <li key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < c.keyFacts!.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                      <Zap style={{ width: 14, height: 14, color: ACCENT, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13, color: TEXT_2, lineHeight: 1.6 }}>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {c.construction && (
            <>
              <SectionHeading>Construction & Components</SectionHeading>
              <div style={{ ...card(), padding: '20px 24px', marginBottom: 20 }}>
                {c.construction.split('\n\n').map((para, i) => (
                  <p key={i} style={{ fontSize: 14, color: TEXT_2, lineHeight: 1.8, margin: i > 0 ? '12px 0 0' : 0 }}>{para}</p>
                ))}
              </div>
            </>
          )}

          {c.applications?.length && (
            <>
              <SectionHeading>Applications</SectionHeading>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {c.applications.map((app, i) => (
                  <div key={i} style={{ ...card(), padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Target style={{ width: 13, height: 13, color: ACCENT, flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13, color: TEXT_2 }}>{app}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {(c.advantages?.length || c.disadvantages?.length) && (
            <>
              <SectionHeading>Advantages & Disadvantages</SectionHeading>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {c.advantages?.length && (
                  <div style={{ ...card(), padding: '16px 20px' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#4ADE80', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Advantages</p>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {c.advantages.map((a, i) => (
                        <li key={i} style={{ fontSize: 13, color: TEXT_2, padding: '4px 0', borderBottom: i < c.advantages!.length - 1 ? `1px solid ${BORDER}` : 'none', paddingLeft: 16, position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 0, color: '#4ADE80' }}>✓</span>{a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {c.disadvantages?.length && (
                  <div style={{ ...card(), padding: '16px 20px' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#FCA5A5', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Disadvantages</p>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {c.disadvantages.map((d, i) => (
                        <li key={i} style={{ fontSize: 13, color: TEXT_2, padding: '4px 0', borderBottom: i < c.disadvantages!.length - 1 ? `1px solid ${BORDER}` : 'none', paddingLeft: 16, position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 0, color: '#FCA5A5' }}>✗</span>{d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}

          {c.commonMistakes?.length && (
            <>
              <SectionHeading>Common Mistakes</SectionHeading>
              <div style={{ ...card(), padding: '16px 20px', marginBottom: 20 }}>
                {c.commonMistakes.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < c.commonMistakes!.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                    <AlertTriangle style={{ width: 14, height: 14, color: '#DC2626', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13, color: TEXT_2 }}>{m}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {c.safety?.length && (
            <>
              <SectionHeading>Safety</SectionHeading>
              <div style={{ ...card({ background: '#DC262608', border: '1px solid #DC262630' }), padding: '16px 20px', marginBottom: 20 }}>
                {c.safety.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: i < c.safety!.length - 1 ? `1px solid #DC262620` : 'none' }}>
                    <AlertTriangle style={{ width: 13, height: 13, color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13, color: '#FCA5A5' }}>{s}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {c.installation?.length && (
            <>
              <SectionHeading>Installation</SectionHeading>
              <div style={{ ...card(), padding: '16px 20px', marginBottom: 20 }}>
                <ol style={{ margin: 0, paddingLeft: 20 }}>
                  {c.installation.map((step, i) => (
                    <li key={i} style={{ fontSize: 13, color: TEXT_2, lineHeight: 1.7, padding: '4px 0' }}>{step}</li>
                  ))}
                </ol>
              </div>
            </>
          )}

          {c.maintenance?.length && (
            <>
              <SectionHeading>Maintenance</SectionHeading>
              <div style={{ ...card(), padding: '16px 20px', marginBottom: 20 }}>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {c.maintenance.map((item, i) => (
                    <li key={i} style={{ fontSize: 13, color: TEXT_2, lineHeight: 1.7, padding: '4px 0' }}>{item}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {c.testing?.length && (
            <>
              <SectionHeading>Testing</SectionHeading>
              <div style={{ ...card(), padding: '16px 20px', marginBottom: 20 }}>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {c.testing.map((t, i) => (
                    <li key={i} style={{ fontSize: 13, color: TEXT_2, lineHeight: 1.7, padding: '4px 0' }}>{t}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {c.faqs?.length && (
            <>
              <SectionHeading>FAQs</SectionHeading>
              {c.faqs.map((faq, i) => (
                <details key={i} style={{ ...card(), marginBottom: 8, overflow: 'hidden' }}>
                  <summary style={{ padding: '14px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: TEXT_1, listStyle: 'none', display: 'flex', justifyContent: 'space-between' }}>
                    {faq.question}
                  </summary>
                  <div style={{ padding: '0 20px 16px', fontSize: 13, color: TEXT_2, lineHeight: 1.7, borderTop: `1px solid ${BORDER}`, paddingTop: 14 }}>{faq.answer}</div>
                </details>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Types Tab ── */}
      {tab === 'types' && c.types?.length && (
        <div>
          {c.types.map((type, i) => (
            <div key={i} style={{ ...card(), padding: '20px 24px', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT_1, marginBottom: 10 }}>{type.name}</h3>
              <p style={{ fontSize: 14, color: TEXT_2, lineHeight: 1.7, marginBottom: 12 }}>{type.description}</p>
              <div style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}30`, borderRadius: 8, padding: '10px 14px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>When to Use: </span>
                <span style={{ fontSize: 13, color: TEXT_2 }}>{type.when}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Working Principle Tab ── */}
      {tab === 'principle' && c.workingPrinciple && (
        <div style={{ ...card(), padding: '24px 28px' }}>
          {c.workingPrinciple.split('\n\n').map((para, i) => (
            <div key={i} style={{ marginBottom: i < c.workingPrinciple!.split('\n\n').length - 1 ? 16 : 0 }}>
              {para.startsWith('**') ? (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: TEXT_1, marginBottom: 8 }}>
                    {para.split('\n')[0].replace(/\*\*/g, '')}
                  </h4>
                  <p style={{ fontSize: 14, color: TEXT_2, lineHeight: 1.8 }}>
                    {para.split('\n').slice(1).join(' ')}
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: 14, color: TEXT_2, lineHeight: 1.8 }}>{para}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Selection Guide Tab ── */}
      {tab === 'selection' && c.selectionGuide?.length && (
        <div>
          {c.selectionGuide.map((item, i) => (
            <div key={i} style={{ ...card(), padding: '18px 22px', marginBottom: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: ACCENT, marginBottom: 8 }}>{item.parameter}</p>
              <p style={{ fontSize: 13, color: TEXT_2, lineHeight: 1.7, margin: 0 }}>{item.guidance}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Troubleshooting Tab ── */}
      {tab === 'troubleshooting' && c.troubleshooting?.length && (
        <div>
          {c.troubleshooting.map((item, i) => (
            <div key={i} style={{ ...card(), padding: '20px 24px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <AlertTriangle style={{ width: 16, height: 16, color: '#DC2626' }} />
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#FCA5A5' }}>{item.symptom}</h3>
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: TEXT_3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Likely Causes</p>
              <ul style={{ margin: '0 0 14px', paddingLeft: 20 }}>
                {item.causes.map((c, ci) => <li key={ci} style={{ fontSize: 13, color: TEXT_2, lineHeight: 1.6 }}>{c}</li>)}
              </ul>
              <div style={{ background: '#16A34A10', border: '1px solid #16A34A30', borderRadius: 8, padding: '10px 14px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4ADE80', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Remedy: </span>
                <span style={{ fontSize: 13, color: TEXT_2 }}>{item.remedy}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Standards Tab ── */}
      {tab === 'standards' && c.standards?.length && (
        <div>
          {c.standards.map((std, i) => (
            <div key={i} style={{ ...card(), padding: '18px 22px', marginBottom: 12, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ background: '#7C3AED20', border: '1px solid #7C3AED40', borderRadius: 8, padding: '8px 12px', flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#C4B5FD', fontFamily: "'JetBrains Mono', monospace" }}>{std.code}</span>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: TEXT_1, marginBottom: 4 }}>{std.title}</p>
                {std.clause && <p style={{ fontSize: 12, color: TEXT_3 }}>{std.clause}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Quiz Tab ── */}
      {tab === 'quiz' && c.quiz?.length && (
        <div>
          <div style={{ ...card(), padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Award style={{ width: 20, height: 20, color: '#FCD34D' }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: TEXT_1, margin: 0 }}>Knowledge Check</p>
              <p style={{ fontSize: 12, color: TEXT_2, margin: 0 }}>{c.quiz.length} question{c.quiz.length > 1 ? 's' : ''} — answer all to see your score</p>
            </div>
          </div>
          <QuizSection questions={c.quiz} topicId={topic.id} />
        </div>
      )}
    </div>
  );
}

// ─── Category Grid ────────────────────────────────────────────────────────────

function CategoryGrid({ onSelect }: { onSelect: (categoryId: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
      {CATEGORIES.map((cat) => (
        <button key={cat.id} onClick={() => onSelect(cat.id)}
          style={{ textAlign: 'left', padding: '20px', ...card(), cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit', border: `1px solid ${BORDER}` }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${cat.color}60`; e.currentTarget.style.background = `${cat.color}08`; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = BG_CARD; }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 24 }}>{cat.icon}</span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 800, color: TEXT_1, marginBottom: 6 }}>{cat.label}</p>
          <p style={{ fontSize: 12, color: TEXT_2, lineHeight: 1.5, marginBottom: 10 }}>{cat.description}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: cat.color }}>{cat.topicCount} topics</span>
            <ChevronRight style={{ width: 14, height: 14, color: TEXT_3 }} />
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Topic List (in category) ─────────────────────────────────────────────────

function TopicList({ categoryId, onSelect, onBack }: { categoryId: string; onSelect: (t: Topic) => void; onBack: () => void }) {
  const cat     = CATEGORIES.find((c) => c.id === categoryId)!;
  const topics  = getTopicsByCategory(categoryId);
  const { isBookmarked, isCompleted } = useLearningStore();

  return (
    <div>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: ACCENT, cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 20, padding: 0 }}>
        <ArrowLeft style={{ width: 16, height: 16 }} /> All Categories
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 32 }}>{cat.icon}</span>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: TEXT_1, margin: 0 }}>{cat.label}</h2>
          <p style={{ fontSize: 13, color: TEXT_2, margin: 0 }}>{topics.length} topics</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {topics.map((topic) => (
          <button key={topic.id} onClick={() => onSelect(topic)}
            style={{ textAlign: 'left', padding: '14px 18px', ...card(), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'inherit', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${ACCENT}60`; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{topic.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: TEXT_1, margin: 0 }}>{topic.title}</p>
                <StatusBadge status={topic.status} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <DiffBadge level={topic.difficulty} />
                <span style={{ fontSize: 11, color: TEXT_3 }}>{topic.readingTime} min</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {isBookmarked(topic.id) && <Bookmark style={{ width: 14, height: 14, color: '#FCD34D' }} />}
              {isCompleted(topic.id) && <CheckCircle style={{ width: 14, height: 14, color: '#4ADE80' }} />}
            </div>
            <ChevronRight style={{ width: 14, height: 14, color: TEXT_3, flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Search Results ───────────────────────────────────────────────────────────

function SearchResults({ query, onSelect, onClear }: { query: string; onSelect: (t: Topic) => void; onClear: () => void }) {
  const results = useMemo(() => searchTopics(query), [query]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <p style={{ fontSize: 14, color: TEXT_2 }}>
          <span style={{ fontWeight: 700, color: TEXT_1 }}>{results.length}</span> results for "{query}"
        </p>
        <button onClick={onClear} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: TEXT_3, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
          <X style={{ width: 13, height: 13 }} /> Clear
        </button>
      </div>
      {results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: TEXT_3 }}>
          <Search style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
          <p>No topics found. Try a different keyword.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {results.map((topic) => {
            const cat = CATEGORIES.find((c) => c.id === topic.categoryId);
            return (
              <button key={topic.id} onClick={() => onSelect(topic)}
                style={{ textAlign: 'left', padding: '14px 18px', ...card(), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'inherit' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${ACCENT}60`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; }}>
                <span style={{ fontSize: 22 }}>{topic.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: TEXT_1, margin: 0 }}>{topic.title}</p>
                    <StatusBadge status={topic.status} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {cat && <span style={{ fontSize: 11, color: cat.color, fontWeight: 600 }}>{cat.label}</span>}
                    <DiffBadge level={topic.difficulty} />
                  </div>
                </div>
                <ChevronRight style={{ width: 14, height: 14, color: TEXT_3, flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Landing / Home ───────────────────────────────────────────────────────────

function Landing({
  onSelectCategory, onSelectTopic, searchQuery, setSearchQuery,
}: {
  onSelectCategory: (id: string) => void;
  onSelectTopic: (t: Topic) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) {
  const { bookmarkedTopics, completedTopics, recentlyViewed } = useLearningStore();
  const totalTopics    = ALL_TOPICS.length;
  const completedCount = completedTopics.length;
  const bookmarkCount  = bookmarkedTopics.length;

  const recentTopics = useMemo(
    () => recentlyViewed.slice(0, 4).map((id) => ALL_TOPICS.find((t) => t.id === id)).filter(Boolean) as Topic[],
    [recentlyViewed]
  );
  const bookmarkedList = useMemo(
    () => bookmarkedTopics.slice(0, 4).map((id) => ALL_TOPICS.find((t) => t.id === id)).filter(Boolean) as Topic[],
    [bookmarkedTopics]
  );

  return (
    <div style={{ padding: '28px 32px 48px' }}>
      {/* Hero */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${ACCENT}, #1D4ED8)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 24px ${ACCENT}40` }}>
            <BookOpen style={{ width: 24, height: 24, color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: TEXT_1, margin: 0, letterSpacing: '-0.02em' }}>Electrical Engineering Learning Center</h1>
            <p style={{ fontSize: 14, color: TEXT_2, margin: 0 }}>Comprehensive reference for electrical engineering concepts, standards and calculations</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Topics', value: totalTopics, icon: BookOpen, color: ACCENT },
            { label: 'Completed', value: completedCount, icon: CheckCircle, color: '#16A34A' },
            { label: 'Bookmarked', value: bookmarkCount, icon: Bookmark, color: '#D97706' },
            { label: 'Categories', value: CATEGORIES.length, icon: BarChart2, color: '#7C3AED' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{ ...card(), padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Icon style={{ width: 14, height: 14, color }} />
                <span style={{ fontSize: 11, color: TEXT_3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
              </div>
              <span style={{ fontSize: 26, fontWeight: 900, color }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: TEXT_3, pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search topics, components, standards, manufacturers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', height: 50, paddingLeft: 48, paddingRight: 16, background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 12, color: TEXT_1, fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: TEXT_3, padding: 4 }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          )}
        </div>
      </div>

      {/* Recently Viewed */}
      {recentTopics.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionHeading>Recently Viewed</SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {recentTopics.map((topic) => (
              <button key={topic.id} onClick={() => onSelectTopic(topic)}
                style={{ textAlign: 'left', padding: '12px 14px', ...card(), cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', fontFamily: 'inherit' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${ACCENT}60`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; }}>
                <span style={{ fontSize: 20 }}>{topic.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_1, flex: 1 }}>{topic.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bookmarked */}
      {bookmarkedList.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionHeading>Bookmarked Topics</SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {bookmarkedList.map((topic) => (
              <button key={topic.id} onClick={() => onSelectTopic(topic)}
                style={{ textAlign: 'left', padding: '12px 14px', ...card({ border: '1px solid #D9770630', background: '#D9770608' }), cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', fontFamily: 'inherit' }}>
                <Bookmark style={{ width: 14, height: 14, color: '#FCD34D', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_1, flex: 1 }}>{topic.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <SectionHeading>All Categories</SectionHeading>
      <CategoryGrid onSelect={onSelectCategory} />
    </div>
  );
}

// ─── Main LearningCenter ──────────────────────────────────────────────────────

type View =
  | { type: 'landing' }
  | { type: 'category'; categoryId: string }
  | { type: 'topic'; topic: Topic }
  | { type: 'search' };

export function LearningCenter() {
  const [view, setView]           = useState<View>({ type: 'landing' });
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    if (q.trim()) setView({ type: 'search' });
    else setView({ type: 'landing' });
  }, []);

  const handleSelectCategory = useCallback((categoryId: string) => {
    setView({ type: 'category', categoryId });
  }, []);

  const handleSelectTopic = useCallback((topic: Topic) => {
    setView({ type: 'topic', topic });
  }, []);

  const handleBackToCategory = useCallback((categoryId: string) => {
    setView({ type: 'category', categoryId });
  }, []);

  const handleBackToLanding = useCallback(() => {
    setView({ type: 'landing' });
    setSearchQuery('');
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setView({ type: 'landing' });
  }, []);

  // Left nav tree (compact, always visible)
  const isNavExpanded = view.type !== 'landing';

  return (
    <div className="animate-fadeIn" style={{ fontFamily: "'Inter','Segoe UI',sans-serif", display: 'flex', gap: 0, minHeight: '80vh' }}>
      {/* Left sidebar nav */}
      <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${BORDER}`, paddingTop: 16, paddingBottom: 24, overflowY: 'auto', background: BG_CARD }}>
        <div style={{ padding: '0 12px 12px' }}>
          <button onClick={handleBackToLanding}
            style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none', background: view.type === 'landing' ? `${ACCENT}20` : 'transparent', color: view.type === 'landing' ? ACCENT : TEXT_2, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
            <BookOpen style={{ width: 15, height: 15 }} /> Home
          </button>
        </div>
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 8 }}>
          {CATEGORIES.map((cat) => {
            const isActive = view.type === 'category' && view.categoryId === cat.id;
            const isTopicInCat = view.type === 'topic' && view.topic.categoryId === cat.id;
            return (
              <div key={cat.id}>
                <button onClick={() => handleSelectCategory(cat.id)}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 20px', border: 'none', background: (isActive || isTopicInCat) ? `${cat.color}15` : 'transparent', color: (isActive || isTopicInCat) ? cat.color : TEXT_2, fontSize: 12, fontWeight: (isActive || isTopicInCat) ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', transition: 'all 0.1s' }}>
                  <span style={{ fontSize: 14 }}>{cat.icon}</span>
                  <span style={{ flex: 1, truncate: true }}>{cat.label}</span>
                  <span style={{ fontSize: 10, color: cat.color, fontWeight: 700 }}>{cat.topicCount}</span>
                </button>
                {/* Show topic list inline if category is active */}
                {isActive && (
                  <div style={{ paddingLeft: 8 }}>
                    {getTopicsByCategory(cat.id).map((topic) => (
                      <button key={topic.id} onClick={() => handleSelectTopic(topic)}
                        style={{ width: '100%', textAlign: 'left', padding: '5px 12px 5px 24px', border: 'none', background: view.type === 'topic' && view.topic.id === topic.id ? `${ACCENT}25` : 'transparent', color: view.type === 'topic' && view.topic.id === topic.id ? TEXT_1 : TEXT_3, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12 }}>{topic.icon}</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic.title}</span>
                        {topic.status === 'coming-soon' && <span style={{ fontSize: 9, color: TEXT_3 }}>···</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: BG_ROOT }}>
        {view.type === 'landing' && (
          <Landing
            onSelectCategory={handleSelectCategory}
            onSelectTopic={handleSelectTopic}
            searchQuery={searchQuery}
            setSearchQuery={handleSearchChange}
          />
        )}
        {view.type === 'search' && (
          <div style={{ padding: '28px 32px' }}>
            <div style={{ position: 'relative', marginBottom: 24 }}>
              <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: TEXT_3, pointerEvents: 'none' }} />
              <input type="text" placeholder="Search topics..." value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)}
                style={{ width: '100%', height: 48, paddingLeft: 48, paddingRight: 16, background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 12, color: TEXT_1, fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              {searchQuery && (
                <button onClick={() => handleSearchChange('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: TEXT_3 }}>
                  <X style={{ width: 16, height: 16 }} />
                </button>
              )}
            </div>
            <SearchResults query={searchQuery} onSelect={handleSelectTopic} onClear={handleClearSearch} />
          </div>
        )}
        {view.type === 'category' && (
          <div style={{ padding: '28px 32px' }}>
            <TopicList categoryId={view.categoryId} onSelect={handleSelectTopic} onBack={handleBackToLanding} />
          </div>
        )}
        {view.type === 'topic' && (
          <TopicDetail topic={view.topic} onBack={() => handleBackToCategory(view.topic.categoryId)} />
        )}
      </div>
    </div>
  );
}
