import { ContentItem } from '../types';

export const INITIAL_CONTENT_ITEMS: ContentItem[] = [
  {
    id: 'book-1',
    title: 'Pride and Prejudice (Chapter 1)',
    author: 'Jane Austen',
    language: 'en',
    level: 'B1',
    category: 'book',
    description: 'A masterpiece of classic literature exploring romance, social standing, and misunderstandings in 19th-century England.',
    estimatedMinutes: 6,
    wordCount: 380,
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    text: `It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.

However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.

"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?"

Mr. Bennet replied that he had not.

"But it is," returned she; "for Mrs. Long has just been here, and she told me all about it."

Mr. Bennet made no answer.

"Do you not want to know who has taken it?" cried his wife impatiently.

"You want to tell me, and I have no objection to hearing it."

This was invitation enough.

"Why, my dear, you must know, Mrs. Long says that Netherfield is taken by a young man of large fortune from the north of England; that he came down on Monday in a chaise and four to see the place, and was so much delighted with it, that he agreed with Mr. Morris immediately; that he is to take possession before Michaelmas, and some of his servants are to be in the house by the end of next week."

"What is his name?"

"Bingley."

"Is he married or single?"

"Oh! Single, my dear, to be sure! A single man of large fortune; four or five thousand a year. What a fine thing for our girls!"

"How so? How can it affect them?"

"My dear Mr. Bennet," replied his wife, "how can you be so tiresome! You must know that I am thinking of his marrying one of them."`
  },
  {
    id: 'book-2',
    title: 'The Little Prince (Le Petit Prince)',
    author: 'Antoine de Saint-Exupéry',
    language: 'en',
    level: 'A2',
    category: 'book',
    description: 'A poetic and philosophical tale about a young prince who visits various planets in space, addressing themes of loneliness, friendship, and love.',
    estimatedMinutes: 5,
    wordCount: 310,
    coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=600&auto=format&fit=crop&q=80',
    text: `Once when I was six years old I saw a magnificent picture in a book called True Stories from Nature, about the primeval forest. It was a picture of a boa constrictor in the act of swallowing an animal.

In the book it said: "Boa constrictors swallow their prey whole, without chewing it. After that they are not able to move, and they sleep through the six months that they need for digestion."

I pondered deeply, then, over the adventures of the jungle. And after some work with a coloured pencil I succeeded in making my first drawing. My Drawing Number One. It showed a snake digesting an elephant.

I showed my masterpiece to the grown-ups, and asked them whether the drawing frightened them.

But they answered: "Frighten? Why should any one be frightened by a hat?"

My drawing was not a picture of a hat. It was a picture of a boa constrictor digesting an elephant. But since the grown-ups were not able to understand it, I made another drawing: I drew the inside of the boa constrictor, so that the grown-ups could see it clearly. They always need to have things explained.`
  },
  {
    id: 'news-1',
    title: 'Artificial Intelligence Reaches New Heights in Translation',
    author: 'Tech Global Journal',
    language: 'en',
    level: 'B2',
    category: 'news',
    description: 'Breakthroughs in natural language processing allow learners around the globe to read authentic texts with real-time neural comprehension.',
    estimatedMinutes: 4,
    wordCount: 260,
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    text: `Recent advancements in artificial intelligence have transformed the landscape of language education. Modern neural models are no longer limited to literal word-for-word translation; instead, they capture subtle cultural nuances, grammatical idioms, and situational context.

Educators worldwide emphasize that reading authentic materials—such as literature, journalistic essays, and local narratives—significantly accelerates vocabulary acquisition compared to repetitive rote memorization.

By integrating smart glossaries and spaced repetition algorithms directly into the reading flow, learners can interact with complex texts far beyond their initial comfort zone. The immediate feedback loop lowers cognitive friction and fosters true linguistic intuition.`
  },
  {
    id: 'story-1',
    title: 'The Whispering Lighthouse',
    author: 'Elena Rostova',
    language: 'en',
    level: 'A2',
    category: 'story',
    description: 'An enchanting story about an abandoned coastal lighthouse and a curious traveler who uncovers its mysterious nautical logbook.',
    estimatedMinutes: 4,
    wordCount: 220,
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    text: `Every evening at dusk, the old lighthouse on the rocky cliff began to whisper. Local fishermen said it was just the wind whistling through broken glass windows. But Lucas, a young traveler with a curious spirit, knew there was something more.

One foggy afternoon, Lucas climbed the narrow iron stairs. The salt air smelled fresh and cold. At the top of the tower, hidden beneath a wooden floorboard, he discovered an old leather journal filled with nautical maps and handwritten coordinates.

The last entry read: "To the brave soul who finds this light: the ocean keeps its secrets, but knowledge belongs to those who dare to read." Lucas smiled, realizing his grand journey had only just begun.`
  },
  {
    id: 'fr-1',
    title: 'Le Petit Prince (Chapitre 21 - Rencontre avec le Renard)',
    author: 'Antoine de Saint-Exupéry',
    language: 'fr',
    level: 'B1',
    category: 'book',
    description: 'Le passage célèbre où le renard enseigne au Petit Prince le secret de l\'apprivoisement et de l\'amitié véritable.',
    estimatedMinutes: 5,
    wordCount: 240,
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    text: `C'est alors qu'apparut le renard :
— Bonjour, dit le renard.
— Bonjour, répondit poliment le petit prince, qui se retourna mais ne vit rien.
— Je suis là, dit la voix, sous le pommier.
— Qui es-tu ? dit le petit prince. Tu es bien joli...
— Je suis un renard, dit le renard.
— Viens jouer avec moi, lui proposa le petit prince. Je suis tellement triste...
— Je ne puis pas jouer avec toi, dit le renard. Je ne suis pas apprivoisé.
— Ah ! pardon, dit le petit prince. Mais, après réflexion, il ajouta :
— Qu'est-ce que signifie « apprivoiser » ?
— C'est une chose trop oubliée, dit le renard. Ça signifie « créer des liens... »
— Créer des liens ?
— Bien sûr, dit le renard. Tu n'es encore pour moi qu'un petit garçon tout semblable à cent mille petits garçons. Et je n'ai pas besoin de toi. Et tu n'as pas besoin de moi non plus. Je ne suis pour toi qu'un renard semblable à cent mille renards. Mais, si tu m'apprivoises, nous aurons besoin l'un de l'autre. Tu seras pour moi unique au monde. Je serai pour toi unique au monde...`
  },
  {
    id: 'es-1',
    title: 'Don Quijote de la Mancha (Capítulo 1)',
    author: 'Miguel de Cervantes',
    language: 'es',
    level: 'B2',
    category: 'book',
    description: 'La célebre introducción a la obra cumbre de la literatura española y las aventuras del ingenioso hidalgo Don Quijote.',
    estimatedMinutes: 5,
    wordCount: 220,
    coverImage: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&auto=format&fit=crop&q=80',
    text: `En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor.

Una olla de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados, lantejas los viernes, algún palomino de añadidura los domingos, consumían las tres partes de su hacienda.

El resto della concluían sayo de velarte, calzas de velludo para las fiestas, con sus pantuflos de lo mesmo, y los días de entresemana se honraba con su vellorí de lo más fino. Tenía en su casa una ama que pasaba de los cuarenta, y una sobrina que no llegaba a los veinte, y un mozo de campo y plaza.

Frisaba la edad de nuestro hidalgo con los cincuenta años; era de complexión recia, seco de carnes, enjuto de rostro, gran madrugador y amigo de la caza.`
  },
  {
    id: 'it-standup-1',
    title: 'Agile Daily Standup & Code Review in IT',
    author: 'Alex (Senior Tech Lead) & Engineering Team',
    language: 'en',
    level: 'B2',
    category: 'it',
    description: 'A realistic tech team morning standup discussing pull requests, REST API endpoints, database indexing, caching strategies, and CI/CD pipelines.',
    estimatedMinutes: 5,
    wordCount: 320,
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    text: `Good morning team, let us kick off our daily standup. Yesterday, I completed the authentication middleware and refactored the database connection pool. All automated unit tests passed locally, and I opened a pull request on GitHub for peer review.

Today, my primary focus is optimizing the query latency on our search endpoints. We noticed a performance bottleneck during high traffic hours, so I will implement a Redis caching layer and add composite database indexes. If anyone has experience with memory optimization in Node.js, I would appreciate your feedback.

Do we have any blockers? Marcus mentioned that the third-party payment webhook is returning an unauthorized status code in the staging environment. We should verify our environment variables and secret tokens before the afternoon sprint demo.

Let us make sure all code changes are thoroughly reviewed before merging into the main branch. Once the staging tests are green, our automated CI/CD pipeline will deploy the build to production without any downtime.`
  },
  {
    id: 'it-incident-2',
    title: 'Troubleshooting Cloud Architecture & SRE Incidents',
    author: 'DevOps & Site Reliability Engineering',
    language: 'en',
    level: 'B2',
    category: 'it',
    description: 'DevOps engineers investigate a sudden latency spike, analyze Kubernetes microservice logs, scale cloud resources, and prevent downtime.',
    estimatedMinutes: 5,
    wordCount: 310,
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
    text: `Attention team, our monitoring dashboard just triggered a high-severity alert. The customer-facing API gateway is experiencing elevated response times, and the error rate jumped to five percent over the last ten minutes.

Our lead Site Reliability Engineer immediately inspected the cluster telemetry. It appears that a memory leak in the recommendation microservice is causing Kubernetes pods to restart repeatedly, overwhelming the surviving server instances.

To mitigate immediate disruption, the DevOps team scaled the horizontal pod autoscaler and provisioned additional cloud compute capacity. Meanwhile, the backend engineers identified an unindexed database query introduced in the latest release and prepared an emergency hotfix.

Within twenty minutes, normal latency was fully restored across all geographic regions. We documented the timeline in our incident management channel, and we will conduct a blameless post-mortem meeting tomorrow morning to strengthen our automated rollback triggers.`
  },
  {
    id: 'insurance-claim-1',
    title: 'Filing an Auto Insurance Claim & Damage Assessment',
    author: 'Claims Adjuster & Policyholder Support',
    language: 'en',
    level: 'B1',
    category: 'insurance',
    description: 'Step-by-step dialogue of a customer reporting a vehicle fender bender, checking policy deductibles, arranging towing, and scheduling repairs.',
    estimatedMinutes: 5,
    wordCount: 310,
    coverImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
    text: `"Hello, thank you for calling Horizon Insurance Claims Department. My name is Sarah. I understand you need to file an automobile claim today. Are you and all passengers safe?"

"Yes, thankfully nobody was injured. Another driver ran a stop sign at an intersection and collided with my passenger side door. The police arrived promptly and issued an accident report, which I have here."

"I am very glad you are unhurt. Let me pull up your comprehensive policy using your insurance identification number. I see that your policy includes full collision coverage with a five hundred dollar deductible, as well as complimentary roadside towing."

"Does my policy cover a rental vehicle while my car is being repaired at the certified body shop?"

"Yes, your plan includes thirty dollars per day for rental reimbursement for up to thirty days. An independent claims adjuster will inspect the damage tomorrow morning, estimate the repair costs, and authorize payment directly to the repair facility."`
  },
  {
    id: 'insurance-health-2',
    title: 'Understanding Health Insurance Benefits & Coverage',
    author: 'Healthcare Assurance Advisor',
    language: 'en',
    level: 'B2',
    category: 'insurance',
    description: 'A comprehensive guide to health insurance terms: in-network providers, copays, annual deductibles, pre-authorizations, and out-of-pocket maximums.',
    estimatedMinutes: 5,
    wordCount: 300,
    coverImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
    text: `Choosing the right healthcare insurance plan requires understanding key terminology that determines your medical expenses throughout the year. When you review your summary of benefits, pay close attention to your annual deductible, copayments, and coinsurance percentages.

An annual deductible is the total amount you must pay out-of-pocket for eligible medical services before your insurance carrier begins sharing the cost. For example, preventive care checkups and routine screenings are usually covered at one hundred percent with zero deductible.

When visiting a specialist or scheduling non-emergency outpatient surgery, always verify whether the clinic participates in your insurer's designated provider network. Receiving treatment from an in-network hospital guarantees pre-negotiated discount rates and protects you from unexpected balance billing.

Furthermore, certain specialized prescription medications and diagnostic procedures require prior authorization from your insurance provider. Understanding your policy limits ensures peace of mind and shields your family from unforeseen financial hardship.`
  },
  {
    id: 'daily-errands-1',
    title: 'Everyday Errands: Coffee Shop, Grocery & Pharmacy',
    author: 'Everyday English Scenarios',
    language: 'en',
    level: 'A2',
    category: 'daily',
    description: 'Essential real-world daily interactions: ordering your morning coffee, grocery shopping produce, and consulting with a neighborhood pharmacist.',
    estimatedMinutes: 4,
    wordCount: 290,
    coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
    text: `"Good morning! Could I please get a medium oat milk cappuccino and a toasted almond croissant to go?"
"Certainly! Would you like cinnamon sprinkled on top, and will you be paying with card or contactless mobile pay?"
"Contactless is great, thank you. Could you also please print the receipt for my records?"

After leaving the cafe, I walked across the street to the local supermarket to pick up groceries for the week. I needed fresh vegetables from the produce section, whole grain bread, and olive oil from aisle three. The store clerk kindly showed me where the organic honey was stocked.

Finally, I stopped by the neighborhood pharmacy to fill a prescription. The friendly pharmacist explained: "Take one tablet with water every morning after breakfast. Be sure to complete the entire course of medication, and avoid drinking grapefruit juice while taking this prescription."`
  },
  {
    id: 'work-meeting-1',
    title: 'Workplace Sync: Project Deadlines & Cross-Team Collaboration',
    author: 'Corporate Communications & Project Management',
    language: 'en',
    level: 'B1',
    category: 'work',
    description: 'Professional business communication: running an effective project sync, negotiating realistic milestones, aligning team resources, and agreeing on action items.',
    estimatedMinutes: 5,
    wordCount: 300,
    coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
    text: `"Welcome everyone to our weekly project synchronization meeting. Our main objective today is to review the quarterly milestones and ensure that all departments are aligned ahead of the client product launch."

"According to the latest progress report, the design team has finalized the user interface prototypes. However, the marketing team needs another three days to polish the promotional campaign materials and press releases."

"That is reasonable, as long as we maintain open communication. Can the development team confirm that the security audit is still scheduled for this Thursday?"

"Yes, our external auditors will deliver their final compliance report by Friday noon. If any minor issues arise, our engineers will address them over the weekend."

"Excellent teamwork. I will document these action items in our shared workspace and email the updated timeline to all stakeholders before five o'clock today."`
  },
  {
    id: 'home-routine-1',
    title: 'Evening Harmony: Family Chores & Dinner Preparation',
    author: 'Cozy Living & Household Dynamics',
    language: 'en',
    level: 'A2',
    category: 'home',
    description: 'Warm conversations at home: dividing household chores, preparing a healthy dinner together in the kitchen, and relaxing in the living room.',
    estimatedMinutes: 4,
    wordCount: 280,
    coverImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
    text: `Returning home after a productive day always brings a sense of calm and comfort. As the sun began to set, the aroma of garlic and fresh herbs filled the kitchen. Everyone in the household happily pitched in to prepare the evening dinner.

"Could you please rinse the vegetables and chop the tomatoes for the salad while I stir the soup on the stove?"
"Of course! I have already unloaded the dishwasher and folded the clean laundry in the basket."

Sharing domestic chores makes daily responsibilities feel light and enjoyable. Once the dining table was neatly set with warm dishes, the entire family gathered around to share funny moments and pleasant stories from their day.

After dinner, we washed the plates together, brewed a hot pot of soothing herbal tea, and spent a quiet hour reading together in the comfortable living room.`
  },
  {
    id: 'parenting-kids-1',
    title: 'Parenting with Love: Homework, School Days & Bedtime',
    author: 'Parenting & Child Development Guide',
    language: 'en',
    level: 'B1',
    category: 'parenting',
    description: 'Empathetic conversations with children: listening to their school experiences, helping with math homework patiently, setting screen boundaries, and reading bedtime stories.',
    estimatedMinutes: 5,
    wordCount: 320,
    coverImage: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=600&auto=format&fit=crop&q=80',
    text: `"How was your day at school today, my dear? You seem a little quiet."
"It was okay, Dad. But we started a new chapter in science class about the solar system, and some of the questions on the worksheet felt difficult."

"That is completely normal when learning something new. Why don't we sit together at the study desk after you have a healthy fruit snack, and we can solve the problems step by step?"

Patience and positive encouragement build a child's self-confidence far better than criticism. When we broke the questions down into smaller parts, his eyes lit up with understanding and pride: "Look, I solved the third question all by myself!"

Before bedtime, we put away all tablets and smartphones to help our minds relax. Snuggling together under the warm blanket, we read an exciting story about courage and kindness until his eyes gently closed into peaceful sleep.`
  },
  {
    id: 'mosque-community-1',
    title: 'Friday at the Mosque: Prayer, Brotherhood & Community',
    author: 'Spiritual Life & Community Fellowship',
    language: 'en',
    level: 'B1',
    category: 'mosque',
    description: 'Attending Friday congregational prayer (Jum\'ah), greeting brothers with Salam, listening to an uplifting sermon, and participating in charity initiatives.',
    estimatedMinutes: 5,
    wordCount: 330,
    coverImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
    text: `Every Friday afternoon, worshippers gather early at the local mosque for the congregational Jum'ah prayer. After performing ablution in the courtyard fountain, people step onto the soft carpeted hall filled with quiet dignity and spiritual tranquility.

"As-salamu alaykum, brother! May Allah bless your Friday and grant you and your family peace and good health."
"Wa alaykum as-salam wa rahmatullah! It brings great joy to see you in good spirits."

The imam delivered an inspiring sermon focused on the virtues of mercy, honesty in trade, helping neighbors in need, and honoring one's parents. The worshippers listened attentively in complete silence, reflecting on how to practice these noble values throughout the upcoming week.

After the prayer concluded, people warmly embraced and inquired about each other's well-being. Outside the main entrance, a group of young volunteers was organizing a charity food drive for needy families in the neighborhood. Joining together in generous deeds strengthens the bonds of brotherhood and lights up the entire community.`
  }
];

