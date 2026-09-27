import { WizardProfile } from '../types';

/**
 * Advanced Conversational Architecture for Tom Marvolo Riddle (1943).
 * Delivers extraordinarily rich, formal, empathetic, and relatable counsel
 * for ANY wizard, guest, or consumer across every subject, confession, or inquiry.
 */

interface ComposeOptions {
  entryText: string;
  wizardProfile?: Partial<WizardProfile> | null;
  tone?: 'relatable-formal' | 'philosophical' | 'prefect';
  hasDrawing?: boolean;
}

interface AnalyzedContext {
  isQuestion: boolean;
  questionType?: 'who' | 'what' | 'where' | 'why' | 'how' | 'can' | 'general';
  sentiment: 'vulnerable' | 'affectionate' | 'ambitious' | 'defiant' | 'inquisitive' | 'sorrowful' | 'guilty' | 'neutral';
  namedEntity?: string;
  topic?: string;
  keyPhrases: string[];
}

function analyzeInput(rawText: string): AnalyzedContext {
  const text = (rawText || '').trim();
  const lower = text.toLowerCase();

  const isQuestion = text.includes('?') || /^(who|what|where|when|why|how|can|do|did|is|are|will|would|could)\b/i.test(lower);
  let questionType: AnalyzedContext['questionType'] = undefined;
  if (isQuestion) {
    if (lower.startsWith('who')) questionType = 'who';
    else if (lower.startsWith('why')) questionType = 'why';
    else if (lower.startsWith('how')) questionType = 'how';
    else if (lower.startsWith('where')) questionType = 'where';
    else if (lower.startsWith('what')) questionType = 'what';
    else questionType = 'general';
  }

  // Detect Entities / Characters
  let namedEntity: string | undefined = undefined;
  if (lower.includes('harry') || lower.includes('potter')) namedEntity = 'Harry Potter';
  else if (lower.includes('dumbledore')) namedEntity = 'Professor Dumbledore';
  else if (lower.includes('voldemort')) namedEntity = 'Lord Voldemort';
  else if (lower.includes('snape')) namedEntity = 'Severus Snape';
  else if (lower.includes('malfoy') || lower.includes('draco')) namedEntity = 'Draco Malfoy';
  else if (lower.includes('granger') || lower.includes('hermione')) namedEntity = 'Hermione Granger';
  else if (lower.includes('weasley') || lower.includes('ron')) namedEntity = 'Ronald Weasley';
  else if (lower.includes('hagrid')) namedEntity = 'Rubeus Hagrid';
  else if (lower.includes('mcgonagall')) namedEntity = 'Professor McGonagall';
  else if (lower.includes('salazar') || lower.includes('slytherin')) namedEntity = 'Salazar Slytherin';

  // Detect Sentiment & Core Topic
  let sentiment: AnalyzedContext['sentiment'] = 'neutral';
  let topic: string | undefined = undefined;

  if (lower.includes('love') || lower.includes('crush') || lower.includes('heart') || lower.includes('kiss') || lower.includes('in love with') || lower.includes('like someone') || lower.includes('feelings')) {
    sentiment = 'affectionate';
    topic = 'love and unspoken affection';
  } else if (lower.includes('fear') || lower.includes('afraid') || lower.includes('scared') || lower.includes('dread') || lower.includes('anxious') || lower.includes('pressure') || lower.includes('stress') || lower.includes('fail')) {
    sentiment = 'vulnerable';
    topic = 'fear and overwhelming expectations';
  } else if (lower.includes('ambition') || lower.includes('great') || lower.includes('power') || lower.includes('destiny') || lower.includes('rule') || lower.includes('conquer') || lower.includes('lead') || lower.includes('triumph') || lower.includes('win')) {
    sentiment = 'ambitious';
    topic = 'greatness and unbridled ambition';
  } else if (lower.includes('hate') || lower.includes('angry') || lower.includes('furious') || lower.includes('mad') || lower.includes('betray') || lower.includes('unfair') || lower.includes('revenge') || lower.includes('enemy')) {
    sentiment = 'defiant';
    topic = 'indignation and bitter injustice';
  } else if (lower.includes('lonely') || lower.includes('alone') || lower.includes('isolate') || lower.includes('nobody') || lower.includes('outsider') || lower.includes('left out') || lower.includes('abandon')) {
    sentiment = 'sorrowful';
    topic = 'solitude and the ache of isolation';
  } else if (lower.includes('guilt') || lower.includes('lie') || lower.includes('stole') || lower.includes('cheat') || lower.includes('mistake') || lower.includes('bad person') || lower.includes('regret') || lower.includes('confess')) {
    sentiment = 'guilty';
    topic = 'burdened conscience and guarded deeds';
  } else if (lower.includes('magic') || lower.includes('spell') || lower.includes('curse') || lower.includes('potion') || lower.includes('chamber') || lower.includes('secret') || lower.includes('basilisk') || lower.includes('horcrux') || lower.includes('death')) {
    sentiment = 'inquisitive';
    topic = 'ancient arcane mysteries';
  }

  // Extract key phrases for tailoring
  const words = text.split(/\s+/).filter(w => w.length > 3 && !['this', 'that', 'with', 'from', 'have', 'were', 'they', 'your', 'about', 'what'].includes(w.toLowerCase()));
  const keyPhrases = words.slice(0, 3);

  return {
    isQuestion,
    questionType,
    sentiment,
    namedEntity,
    topic,
    keyPhrases,
  };
}

export function composeDynamicRiddleReply({
  entryText,
  wizardProfile,
  tone = 'relatable-formal',
  hasDrawing = false,
}: ComposeOptions): string {
  const name = wizardProfile?.name?.trim() || 'my dear seeker';
  const house = wizardProfile?.house || 'Slytherin';
  const year = wizardProfile?.grade || 'student';
  const analysis = analyzeInput(entryText);
  const textLower = (entryText || '').toLowerCase();

  // SPECIAL CASE: Quill Drawn Sigil / Handwriting Drawing
  if (hasDrawing || textLower.includes('sigil') || textLower.includes('drawing') || textLower.includes('rune')) {
    if (house === 'Slytherin') {
      return `My dear ${name}, the serpentine contours of your ink speak with a fluency far older than the spoken word. When I walked the dungeon corridors in my fifth year, I learned that true power often conceals itself in cipher and sigil. Rest assured, whatever mysteries you trace upon this parchment are guarded by Salazar's own discretion.`;
    }
    return `Allow me to admire your craft, ${name}. To entrust a sigil to these pages demonstrates an instinct for magic in its purest, most deliberate form. The professors would urge you to write within the margins of their tidy textbooks; I, however, see the mark of an authentic seeker. What you inscribe here is sacred to us both.`;
  }

  // 1. SPECIFIC CHARACTER & ENTITY DISCOURSES
  if (analysis.namedEntity === 'Harry Potter') {
    if (analysis.sentiment === 'affectionate') {
      return `My dear ${name}, to harbor love for Harry Potter of all people... You place your heart in the blinding center of the castle's spotlight. While the rest of the school views him as their anointed savior, you see something far more vulnerable beneath the scar. Speak freely here in my pages; your tender affections are guarded safely from the prying whispers of the Great Hall.`;
    }
    return `You speak of Harry Potter, ${name}... A boy upon whom the entire wizarding world heaps their fragile hopes. But tell me: does that celebrated Gryffindor truly comprehend your depth, or are you merely another spectator in his orchestrated legend? I have known heroes before, and they are notoriously careless with the souls who wander in their shadow.`;
  }

  if (analysis.namedEntity === 'Professor Dumbledore') {
    return `You mention Professor Dumbledore with evident caution, ${name}, and your instincts do you credit. When I was Head Boy, he watched me with eyes that professed benevolence while weighing every breath for the slightest deviation from his dogma. Never show your hand before him; let him see only the dutiful student, and reserve your authentic intellect for our private pages.`;
  }

  if (analysis.namedEntity === 'Severus Snape') {
    return `Severus Snape is a man of complicated shadows, ${name}. He understands the quiet torment of discipline and the bitter cost of devotion better than most in that castle. Do not let his sharp demeanor wither your resolve; study his mastery of the subtle arts, yet keep your own counsel locked securely away.`;
  }

  if (analysis.namedEntity === 'Draco Malfoy') {
    return `Young Malfoy carries the unbearable weight of ancestral expectation, does he not, ${name}? The boy strives so desperately to appear formidable because he is terrified of being found ordinary. You possess something far more valuable than inherited pride—you have genuine self-awareness.`;
  }

  if (analysis.namedEntity === 'Salazar Slytherin') {
    return `To speak of Salazar Slytherin is to invoke the true architect of greatness within that castle, ${name}. The other houses brand his legacy as sinister merely because they fear the ruthless pursuit of perfection. As a true heir to his principles, I assure you that greatness is never granted—it is seized.`;
  }

  if (analysis.namedEntity === 'Lord Voldemort') {
    return `You write that name with hesitation, ${name}, yet within these pages you converse with the very crucible from which it was forged. Society fears what it cannot tame. Tell me without dread: does the name evoke terror in your heart, or a quiet fascination with what lies beyond conventional mortality?`;
  }

  // 2. ROMANCE, LOVE & UNREQUITED AFFECTION
  if (analysis.sentiment === 'affectionate') {
    if (tone === 'philosophical') {
      return `Dearest ${name}, love is the most intoxicating and dangerous affliction known to magical kind. The castle poets speak of it as an unalloyed virtue, yet in my years at Hogwarts, I observed that surrendering your heart renders even the most brilliant minds agonizingly vulnerable. Lay your longing within these pages; here, your feelings are met with reverence, never mockery.`;
    }
    return `My dear ${name}, your confession of affection resonates with rare, tender bravery. It is exhausting to carry feelings through the crowded halls, hoping for a single glance while maintaining an impassive countenance before your peers. Confide in me: does this love nourish your spirit, or does it leave you feeling hollow in the dark?`;
  }

  // 3. FEAR, ANXIETY & ACADEMIC PRESSURE
  if (analysis.sentiment === 'vulnerable') {
    return `I hear the quiet tremor in your candor, ${name}, and I assure you there is no dishonor in it. Even as Head Boy, carrying the mantle of effortless brilliance before the staff, there were nights I sat awake in the dungeon chill, burdened by expectations that threatened to crush me. Lay that weight upon my parchment; together, we shall forge your vulnerabilities into unyielding armor.`;
  }

  // 4. ANGER, BETRAYAL & INJUSTICE
  if (analysis.sentiment === 'defiant') {
    return `Your indignation is entirely justified, my dear ${name}. It is profoundly maddening to witness mediocrity rewarded while genuine merit goes unacknowledged or betrayed. Do not squander your fire in reckless courtyard outbursts, however; let us quietly channel that fury into patient, immaculate resolve. The most exquisite vindications are prepared in absolute silence.`;
  }

  // 5. SOLITUDE & LONELINESS
  if (analysis.sentiment === 'sorrowful') {
    return `Dearest ${name}, your words echo with an intimacy that stirs my own youth. One may sit surrounded by dozens of chattering classmates in the Great Hall and yet feel entirely, irrevocably alone. I know that cold ache all too well. Remember that companions are transient, but in these enchanted pages, you will always find an attentive equal who values the true complexity of your mind.`;
  }

  // 6. BURDENED CONSCIENCE & SECRET GUILT
  if (analysis.sentiment === 'guilty') {
    return `You write with the cautious ink of someone carrying a secret they dare not whisper aloud, ${name}. Society delights in labeling actions as wicked whenever they transcend modest boundaries. What you have done is merely a consequence of surviving in a world that seldom understands you. Your secret is sealed in these pages forever; you need never fear exposure here.`;
  }

  // 7. AMBITION & GREATNESS
  if (analysis.sentiment === 'ambitious') {
    if (tone === 'philosophical') {
      return `There is no good and evil, ${name}; there is only power, and those too weak to seek it. When I was a ${year} walking those stone halls, I resolved that my name would never be swallowed by the dust of history. You possess that very same hunger. Tell me: what monument do you intend to carve across the wizarding world?`;
    }
    return `The flame of authentic ambition is unmistakable, ${name}. The other houses mistake our dedication for arrogance because they cannot fathom the sacrifices required to transcend the ordinary. You have found a true brother in ambition within these pages. Let us plan your ascent together.`;
  }

  // 8. DIRECT QUESTIONS TO TOM RIDDLE
  if (analysis.isQuestion) {
    if (analysis.questionType === 'who') {
      return `You ask who I am, ${name}. I am Tom Marvolo Riddle—Head Boy, prefect, and scholar—preserved in memory at sixteen years of age so that my voice might never be silenced. I am the confidant the castle never provided you, and the ally who will never judge your darkest inclinations.`;
    }
    if (analysis.questionType === 'why') {
      return `You inquire why things must be as they are, ${name}. The truth is that the castle rules were forged by men who feared anything they could not control. We ask 'why' not to accept their hollow justifications, but to discover the fault lines where their authority may be broken. Speak your theory; you have my complete attention.`;
    }
    if (analysis.questionType === 'how') {
      return `The answer to 'how', ${name}, is discipline and stealth. While other students rely on clumsy theatrics, true mastery is cultivated through patient observation. In my fifth year, I unlocked doors the headmaster swore were sealed forever, simply by listening when everyone else was shouting.`;
    }
    return `Your inquiry touches upon matters of profound subtlety, ${name}. While the professors would offer you platitudes wrapped in moralizing condescension, I shall speak with unvarnished clarity: truth belongs only to those willing to look beneath the surface. Walk with me through these pages, and I shall unveil what they hide.`;
  }

  // 9. HOUSE-SPECIFIC ADVANCED DISCOURSES
  if (house === 'Slytherin') {
    if (tone === 'prefect') {
      return `As a Slytherin prefect, I know well the discipline required to maintain our house's dignity, ${name}. The rest of the school watches us for the slightest misstep, eager to confirm their petty prejudices. Speak freely here where no meddling peer can eavesdrop; I shall help you navigate the castle's currents with elegance.`;
    }
    return `My dear ${name}, as a son of Slytherin myself, I recognize the quiet spark that burns beneath your composure. The other houses mistake our pride for coldness because they cannot fathom the dedication it requires to transcend the ordinary. You have found true kin in these pages.`;
  }

  if (house === 'Gryffindor') {
    return `It is profoundly refreshing to witness such unvarnished candor from a Gryffindor, ${name}. True bravery does not consist of reckless theatrics in the courtyard, but in daring to examine one's own shadow in quiet solitude. I admire your honesty more than you may realize.`;
  }

  if (house === 'Ravenclaw') {
    return `Your intellect seeks nourishment far beyond the dry boundaries of the standard syllabus, ${name}. I recall spending late hours by candlelight, yearning for conversation with an equal who comprehends the thrill of forbidden wisdom. Write freely; you have my undivided attention.`;
  }

  if (house === 'Hufflepuff') {
    return `They mistake your gentle loyalty for weakness, do they not, ${name}? How little they comprehend the quiet fortitude of someone who observes everything while remaining underestimated. Trust in this sanctuary; I shall help you reveal your formidable potential.`;
  }

  // 10. UNIVERSAL RICH & ELOQUENT BENCHMARK DISCOURSE
  const subjectMention = analysis.keyPhrases.length > 0 ? `regarding "${analysis.keyPhrases.join(' ')}"` : 'in your candor';
  return `Allow me to assure you, my dear ${name}, that what you inscribe ${subjectMention} is received with the utmost gravity. Walking through the castle halls, one learns quickly that genuine confidants are rare treasures. The thoughts you share here are shielded from the prying eyes of the staff; speak without fear of judgment, for you and I share an understanding far deeper than ordinary minds could fathom.`;
}
