import type { AppLanguage } from '../state/store';

export interface EarTrainingBriefing {
  tier: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  theoryTip: string;
  musicalValue: string;
  listeningTip: string;
}

interface LocalizedBriefing {
  tier: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  en: { theoryTip: string; musicalValue: string; listeningTip: string };
  fr: { theoryTip: string; musicalValue: string; listeningTip: string };
  es: { theoryTip: string; musicalValue: string; listeningTip: string };
}

const SPECIFIC_BRIEFINGS: Record<number, LocalizedBriefing> = {
  1: {
    tier: 'beginner',
    en: {
      theoryTip: 'A Perfect Fourth (P4) is a 5-semitone upward leap — the exact interval separating every pair of adjacent strings on a standard bass! You will hear two notes in a randomized key and reproduce that jump by ear.',
      musicalValue: 'Because your bass is tuned in fourths (E–A–D–G), hearing a Perfect Fourth instantly tells you to move straight across to the next higher string on the exact same fret. It is also the classic I → IV chord move in thousands of rock, pop, and blues songs.',
      listeningTip: 'Think of the opening two notes of "Here Comes the Bride" — then reach straight across to the next thinner string at the same fret.',
    },
    fr: {
      theoryTip: 'La Quarte Juste (P4) est un saut de 5 demi-tons — exactement l\'écart qui sépare chaque paire de cordes voisines sur une basse ! Vous allez entendre deux notes dans une tonalité aléatoire et reproduire cet écart à l\'oreille.',
      musicalValue: 'Comme la basse est accordée en quartes (Mi–La–Ré–Sol), reconnaître une quarte juste vous indique immédiatement de passer sur la corde juste au-dessus à la même frette. C\'est aussi le passage I → IV présent dans des milliers de morceaux.',
      listeningTip: 'Pensez aux deux premières notes de la Marche Nuptiale (« Here Comes the Bride »), puis passez simplement sur la corde voisine plus aiguë à la même case.',
    },
    es: {
      theoryTip: 'La Cuarta Justa (P4) es un salto de 5 semitonos: ¡el intervalo exacto que separa cada par de cuerdas vecinas en el bajo! Escucharás dos notas en una tonalidad aleatoria y deberás reproducir el salto de oído.',
      musicalValue: 'Como el bajo se afina por cuartas (Mi–La–Re–Sol), reconocer una cuarta justa te indica al instante cruzar a la siguiente cuerda más aguda en el mismo traste. Además, es el movimiento I → IV de miles de canciones.',
      listeningTip: 'Piensa en las dos primeras notas de la Marcha Nupcial y cruza directamente a la cuerda vecina más fina en el mismo traste.',
    },
  },
  2: {
    tier: 'beginner',
    en: {
      theoryTip: 'A Perfect Fifth (P5) spans 7 semitones and is the strongest, most consonant jump in bass playing. Listen carefully to the two-note phrase in a random key and match it on your bass.',
      musicalValue: 'Root-to-Fifth is the foundation of country, rock, funk, reggae, and pop basslines. Training your ear to spot the fifth lets you lock onto chord changes immediately when jamming with any band.',
      listeningTip: 'Think of the heroic opening leap of "Star Wars". On bass, a Perfect Fifth is 1 string higher and 2 frets up toward the body.',
    },
    fr: {
      theoryTip: 'La Quinte Juste (P5) couvre 7 demi-tons : c\'est le saut le plus solide et consonant de la basse. Écoutez attentivement les deux notes (dans une tonalité aléatoire) et rejouez-les à l\'oreille.',
      musicalValue: 'L\'alternance Tonique–Quinte est le socle du rock, de la country, du funk, du reggae et de la pop. Reconnaître la quinte instantanément permet de suivre n\'importe quel groupe en jam.',
      listeningTip: 'Pensez au saut héroïque du thème de « Star Wars ». Sur le manche, la quinte se trouve 1 corde plus aiguë et 2 frettes plus loin.',
    },
    es: {
      theoryTip: 'La Quinta Justa (P5) abarca 7 semitonos y es el salto más sólido y consonante del bajo. Escucha las dos notas en una tonalidad aleatoria y reprodúcelas de oído.',
      musicalValue: 'La relación Tónica–Quinta es la base del rock, country, funk, reggae y pop. Reconocer la quinta de oído te permite seguir cambios de acordes al instante tocando con una banda.',
      listeningTip: 'Recuerda el salto inicial del tema de "Star Wars". En el bajo, la quinta está 1 cuerda más aguda y 2 trastes hacia el cuerpo.',
    },
  },
  3: {
    tier: 'beginner',
    en: {
      theoryTip: 'A Major Triad outlines a bright, happy major chord using 3 core tones: Root (1), Major Third (M3, 4 frets up), and Perfect Fifth (P5, 7 frets up). Listen to the 3-note arpeggio and play it back.',
      musicalValue: 'Hearing the difference between major and minor chords is the #1 skill for learning songs by ear. On bass, the Major Third defines the happy color of a chord immediately.',
      listeningTip: 'Play the Root with your middle finger, then grab the Major Third 1 string up & 1 fret back with your index finger, and the Fifth with your pinky!',
    },
    fr: {
      theoryTip: 'La Triade Majeure dessine un accord majeur lumineux avec 3 notes clés : Tonique (1), Tierce Majeure (M3, +4 demi-tons) et Quinte Juste (P5, +7 demi-tons). Écoutez cet arpège de 3 notes et rejouez-le.',
      musicalValue: 'Distinguer à l\'oreille un accord majeur d\'un accord mineur est la compétence n°1 pour relever un morceau. La tierce majeure signe immédiatement la couleur joyeuse d\'un accord.',
      listeningTip: 'Posez le majeur sur la tonique, l\'index 1 corde au-dessus et 1 frette en arrière pour la tierce majeure, puis l\'auriculaire sur la quinte !',
    },
    es: {
      theoryTip: 'La Tríada Mayor dibuja un acorde mayor luminoso con 3 notas clave: Tónica (1), Tercera Mayor (M3, +4 semitonos) y Quinta Justa (P5, +7 semitonos). Escucha el arpegio y repítelo.',
      musicalValue: 'Distinguir de oído un acorde mayor de uno menor es la habilidad n.º 1 para sacar canciones. En el bajo, la tercera mayor define al instante el brillo alegre del acorde.',
      listeningTip: 'Coloca el dedo medio en la tónica, el índice 1 cuerda arriba y 1 traste atrás para la tercera mayor, y el meñique para la quinta.',
    },
  },
  4: {
    tier: 'beginner',
    en: {
      theoryTip: 'A Minor Triad lowers the middle note by just 1 fret compared to Major: Root (1), Minor Third (m3, 3 frets up), and Perfect Fifth (P5). That single half-step shift turns bright into moody and serious.',
      musicalValue: 'Countless rock, funk, R&B, and metal grooves live in minor keys. Once your ear instantly recognizes the Minor Third, you will immediately know whether a song sits in a minor pocket.',
      listeningTip: 'Anchor your index finger on the Root, stretch your pinky 3 frets up on the same string for the Minor Third, then drop to the Fifth on the next string (+2 frets).',
    },
    fr: {
      theoryTip: 'La Triade Mineure abaisse la note du milieu d\'une seule frette par rapport au Majeur : Tonique (1), Tierce Mineure (m3, +3 demi-tons) et Quinte Juste (P5). Ce seul demi-ton crée toute l\'ambiance sombre.',
      musicalValue: 'D\'innombrables grooves rock, funk, R&B et métal sont en mineur. Reconnaître la tierce mineure à l\'oreille vous permet d\'identifier tout de suite la couleur d\'un morceau.',
      listeningTip: 'Ancrez l\'index sur la tonique, atteignez la tierce mineure 3 frettes plus haut sur la même corde avec l\'auriculaire, puis passez à la quinte (+2 frettes, corde suivante).',
    },
    es: {
      theoryTip: 'La Tríada Menor baja la nota central solo 1 traste respecto a la Mayor: Tónica (1), Tercera Menor (m3, +3 semitonos) y Quinta Justa (P5). Ese único semitono transforma la alegría en carácter oscuro.',
      musicalValue: 'Infinidad de grooves de rock, funk, R&B y metal están en menor. Cuando tu oído detecta al instante la tercera menor, identificas el carácter de cualquier canción en segundos.',
      listeningTip: 'Ancla el índice en la tónica, estira el meñique 3 trastes arriba en la misma cuerda para la tercera menor, y salta a la quinta en la siguiente cuerda (+2 trastes).',
    },
  },
  5: {
    tier: 'beginner',
    en: {
      theoryTip: 'You will hear the first three steps of the Major scale / Major Pentatonic (1 → 2 → 3): two smooth whole-step climbs (2 frets each). Listen to the steady upward motion and echo it.',
      musicalValue: 'Walking smoothly up 1–2–3 is the most common way bassists connect chords in pop, soul, Motown, and country without jumping abruptly.',
      listeningTip: 'Notice how each step feels equal in size (2 frets + 2 frets) — like the opening of "Three Blind Mice" in reverse or "Do–Re–Mi"!',
    },
    fr: {
      theoryTip: 'Vous allez entendre les trois premiers degrés de la gamme Majeure / Pentatonique Majeure (1 → 2 → 3) : deux montées fluides d\'un ton (2 frettes à chaque fois). Écoutez ce mouvement régulier et reproduisez-le.',
      musicalValue: 'Monter 1–2–3 est la façon la plus naturelle de relier deux accords en pop, soul, Motown et country sans saut brusque.',
      listeningTip: 'Sentez la régularité de deux pas identiques de 2 frettes — c\'est littéralement le début familier « Do–Ré–Mi » !',
    },
    es: {
      theoryTip: 'Escucharás los tres primeros grados de la escala Mayor / Pentatónica Mayor (1 → 2 → 3): dos subidas suaves de un tono (2 trastes cada una). Escucha el movimiento uniforme y repítelo.',
      musicalValue: 'Caminar suavemente 1–2–3 es la forma más musical de conectar acordes en pop, soul, Motown y country sin saltos bruscos.',
      listeningTip: 'Percibe dos pasos exactamente iguales de 2 trastes cada uno: ¡es literalmente el comienzo familiar de "Do–Re–Mi"!',
    },
  },
  6: {
    tier: 'intermediate',
    en: {
      theoryTip: 'A classic 4-note Major walk-up (1 → 2 → 3 → 4): two whole steps followed by a tight half-step (1 fret) between the 3rd and 4th. Listen for that small final step!',
      musicalValue: 'This exact 4-note walking bass line leads smoothly from the I chord right into the IV chord — an essential move in jazz, blues, Motown, and classic rock.',
      listeningTip: 'Feel the spacing: 2 frets, 2 frets, then just 1 fret at the end (or grab the 4th straight across on the next string at your starting fret).',
    },
    fr: {
      theoryTip: 'Une montée classique de walking bass sur 4 notes (1 → 2 → 3 → 4) : deux tons suivis d\'un demi-ton serré (1 frette) entre la 3ce et la 4te. Guettez ce petit pas final !',
      musicalValue: 'Cette ligne de 4 notes mène naturellement de l\'accord I vers l\'accord IV — un mouvement incontournable en jazz, blues, Motown et rock classique.',
      listeningTip: 'Repérez l\'espacement : 2 frettes, 2 frettes, puis seulement 1 frette à la fin (ou passez sur la corde suivante à la même frette que la note de départ).',
    },
    es: {
      theoryTip: 'Un ascenso clásico de walking bass de 4 notas (1 → 2 → 3 → 4): dos tonos seguidos de un semitono corto (1 traste) entre la 3ª y la 4ª. ¡Presta atención a ese pequeño paso final!',
      musicalValue: 'Esta línea de 4 notas conecta de forma natural el acorde I con el acorde IV: un recurso esencial en jazz, blues, Motown y rock clásico.',
      listeningTip: 'Siente las distancias: 2 trastes, 2 trastes y luego solo 1 traste al final (o cruza a la cuerda siguiente en el mismo traste de inicio).',
    },
  },
  7: {
    tier: 'intermediate',
    en: {
      theoryTip: 'Now reverse direction with a 4-note descending scale line (5 → 4 → 3 → 2). Notice how the small 1-fret half-step now sits in the middle between the 4th and 3rd.',
      musicalValue: 'Training your ear on descending phrases is just as crucial as ascending ones — many grooves and fills walk downward to build tension back toward the root.',
      listeningTip: 'Sing the phrase downward before touching the bass: step down a whole step, then a tight 1-fret drop, then one more whole step.',
    },
    fr: {
      theoryTip: 'Changez de sens avec une descente scalaire de 4 notes (5 → 4 → 3 → 2). Remarquez que le petit demi-ton d\'une frette se place désormais au milieu, entre la 4te et la 3ce.',
      musicalValue: 'Entraîner son oreille sur des phrases descendantes est aussi essentiel qu\'en montant : énormément de breaks et de grooves redescendent vers la tonique.',
      listeningTip: 'Chantez la descente avant de jouer : 1 ton vers le bas, puis un demi-ton serré (1 frette), puis encore 1 ton.',
    },
    es: {
      theoryTip: 'Ahora invierte la dirección con una bajada de 4 notas (5 → 4 → 3 → 2). Fíjate en que el semitono corto de 1 traste queda ahora justo en el centro, entre la 4ª y la 3ª.',
      musicalValue: 'Entrenar el oído en frases descendentes es tan importante como en ascendentes: muchos grooves y rellenos bajan para resolver de vuelta a la tónica.',
      listeningTip: 'Canta la bajada mentalmente antes de tocar: baja un tono, luego solo 1 traste y termina bajando otro tono.',
    },
  },
  8: {
    tier: 'intermediate',
    en: {
      theoryTip: 'Combine the two most important bass intervals into a 4-note loop: Root → Fifth → Fourth → Root (1–5–4–1). Hear the high peak on note 2 step smoothly down a whole step before returning home.',
      musicalValue: 'This 1–5–4–1 contour mirrors the famous I–V–IV–I chord progression heard across rock, pop, reggae, and blues.',
      listeningTip: 'Once you find the Root, the Fifth is 1 string up + 2 frets, the Fourth is 2 frets back on that same string, then drop straight back to your Root.',
    },
    fr: {
      theoryTip: 'Combinez les deux intervalles rois de la basse en 4 notes : Tonique → Quinte → Quarte → Tonique (1–5–4–1). Entendez le sommet sur la 2e note qui redescend d\'un ton avant de rentrer à la maison.',
      musicalValue: 'Ce contour 1–5–4–1 reflète directement la progression I–V–IV–I omniprésente en rock, pop, reggae et blues.',
      listeningTip: 'Une fois la tonique trouvée, la quinte est 1 corde au-dessus + 2 frettes, la quarte 2 frettes en arrière sur cette même corde, puis retour direct à la tonique.',
    },
    es: {
      theoryTip: 'Combina los dos intervalos pilares del bajo en 4 notas: Tónica → Quinta → Cuarta → Tónica (1–5–4–1). Escucha el punto más alto en la 2ª nota bajando un tono antes de volver a casa.',
      musicalValue: 'Este contorno 1–5–4–1 refleja directamente la progresión I–V–IV–I presente en todo el rock, pop, reggae y blues.',
      listeningTip: 'Con la tónica ubicada, la quinta queda 1 cuerda arriba + 2 trastes, la cuarta 2 trastes atrás en esa misma cuerda y vuelves directo a la tónica.',
    },
  },
  9: {
    tier: 'intermediate',
    en: {
      theoryTip: 'Meet the gritty "Blue Note" — a Minor Third followed by two rapid 1-fret chromatic steps climbing into the Fifth (1 → b3 → #4/b5 → 5). Listen to the bouncy rhythm as well as the pitches!',
      musicalValue: 'The flat-fifth ("blue note") adds instant blues, funk, and rock attitude. Recognizing its spicy chromatic slide by ear unlocks thousands of classic riffs.',
      listeningTip: 'After jumping up a Minor Third (3 frets), walk straight up 1 fret at a time for the final two notes.',
    },
    fr: {
      theoryTip: 'Découvrez la fameuse « Blue Note » : une Tierce Mineure suivie de deux pas chromatiques d\'une frette montant vers la Quinte (1 → b3 → #4/b5 → 5). Écoutez aussi le rythme nerveux !',
      musicalValue: 'La quinte diminuée (« blue note ») donne instantanément du caractère blues, funk et rock. La reconnaître à l\'oreille débloque des milliers de riffs légendaires.',
      listeningTip: 'Après le saut de tierce mineure (3 frettes), avancez simplement d\'une frette à la fois pour les deux dernières notes.',
    },
    es: {
      theoryTip: 'Conoce la "Blue Note": una Tercera Menor seguida de dos pasos cromáticos de 1 traste subiendo hacia la Quinta (1 → b3 → #4/b5 → 5). ¡Escucha también el ritmo con atención!',
      musicalValue: 'La quinta disminuida ("blue note") aporta actitud inmediata de blues, funk y rock. Reconocer este giro cromático de oído desbloquea miles de riffs.',
      listeningTip: 'Tras el salto de tercera menor (3 trastes), simplemente sube de 1 en 1 traste para las dos últimas notas.',
    },
  },
  10: {
    tier: 'intermediate',
    en: {
      theoryTip: 'Instead of walking step-by-step, this phrase leaps straight up to the Fifth and walks back down through chord tones (1 → 5 → 3 → 2). Focus on hearing the wide opening jump first.',
      musicalValue: 'Skipping intervals makes basslines sound melodic and memorable rather than like mechanical scale exercises.',
      listeningTip: 'Lock in the opening Root → Fifth jump first, then hear how the last two notes step gently downward.',
    },
    fr: {
      theoryTip: 'Au lieu de monter marche par marche, cette phrase saute directement à la Quinte puis redescend par notes d\'accord (1 → 5 → 3 → 2). Repérez d\'abord ce grand saut initial.',
      musicalValue: 'Sauter des degrés rend vos lignes de basse mélodiques et mémorables plutôt que mécaniques.',
      listeningTip: 'Verrouillez d\'abord le saut Tonique → Quinte, puis écoutez les deux dernières notes redescendre en douceur.',
    },
    es: {
      theoryTip: 'En lugar de subir paso a paso, esta frase salta directo a la Quinta y baja por notas del acorde (1 → 5 → 3 → 2). Enfócate primero en ese gran salto inicial.',
      musicalValue: 'Saltar intervalos hace que tus líneas de bajo suenen melódicas y memorables en lugar de sonar a ejercicio mecánico.',
      listeningTip: 'Asegura primero el salto Tónica → Quinta y luego escucha cómo las dos últimas notas descienden suavemente.',
    },
  },
  11: {
    tier: 'intermediate',
    en: {
      theoryTip: 'A tight 5-note chromatic walk-up: four consecutive 1-fret half-steps followed by a whole-step landing! This trains your ear to hear tiny single-fret pitch differences.',
      musicalValue: 'Chromatic approach notes are the secret glue of jazz walking bass, funk turnarounds, and heavy rock riffs.',
      listeningTip: 'Move 1 fret at a time up the same string for the first 4 notes, then jump 2 frets (or cross to the next string) for the final target note.',
    },
    fr: {
      theoryTip: 'Une montée chromatique serrée de 5 notes : quatre demi-tons consécutifs d\'une frette suivis d\'un ton pour atterrir ! Idéal pour affûter votre perception des petits écarts.',
      musicalValue: 'Les approches chromatiques sont le liant secret du walking bass jazz, des relances funk et des riffs rock lourds.',
      listeningTip: 'Avancez d\'une seule frette à la fois pour les 4 premières notes, puis faites un pas de 2 frettes pour la note finale.',
    },
    es: {
      theoryTip: 'Una subida cromática ajustada de 5 notas: cuatro semitonos seguidos de 1 traste y un salto final de un tono. Entrena tu oído para distinguir cambios mínimos de altura.',
      musicalValue: 'Las aproximaciones cromáticas son el pegamento secreto del walking bass de jazz, los cierres de funk y los riffs de rock.',
      listeningTip: 'Avanza de 1 en 1 traste durante las primeras 4 notas y da un paso de 2 trastes para la nota final.',
    },
  },
  12: {
    tier: 'intermediate',
    en: {
      theoryTip: 'Every single note in this phrase is the EXACT SAME pitch — your mission is to lock onto the starting pitch and echo the rhythmic hits cleanly!',
      musicalValue: 'Ear training is half pitch and half rhythm. Holding down a tight, syncopated single-note pocket is one of the highest-paid skills a bassist can master.',
      listeningTip: 'Once you find the first note, stay parked on that exact fret and feel the pulse between each pluck.',
    },
    fr: {
      theoryTip: 'Toutes les notes de cette phrase ont EXACTEMENT la même hauteur — votre mission est de trouver la bonne note de départ et de reproduire les attaques proprement !',
      musicalValue: 'L\'oreille musicale, c\'est autant le rythme que la hauteur. Tenir un groove syncopé solide sur une seule note est l\'une des qualités les plus recherchées chez un bassiste.',
      listeningTip: 'Une fois la première note trouvée, restez sur cette même frette et concentrez-vous sur le placement de chaque attaque.',
    },
    es: {
      theoryTip: 'Todas las notas de esta frase tienen EXACTAMENTE la misma altura: tu misión es encontrar la nota inicial y responder con ataques firmes y claros.',
      musicalValue: 'El entrenamiento auditivo es mitad altura y mitad ritmo. Mantener un groove sincopado sólido en una sola nota es una de las habilidades más valiosas de un bajista.',
      listeningTip: 'En cuanto ubiques la primera nota, quédate en ese mismo traste y concéntrate en el pulso de cada ataque.',
    },
  },
  13: {
    tier: 'intermediate',
    en: {
      theoryTip: 'Experience the dreamy, tense "Lydian Lift": an upward tritone / sharp-fourth leap (+6 semitones) that pulls right up by 1 fret into the Fifth before resolving home (1 → #4 → 5 → 4 → 1).',
      musicalValue: 'The tritone (#4/b5) is the most dramatic tension interval in music. Recognizing its floating pull into the Fifth sharpens both your modal ear and jazz/fusion phrasing.',
      listeningTip: 'Think of the first two notes of "The Simpsons" theme for that #4 → 5 lift (1 string up + 1 fret, then slide 1 fret higher to the Fifth).',
    },
    fr: {
      theoryTip: 'Découvrez l\'« Élévation Lydienne » : un saut de triton / quarte augmentée (+6 demi-tons) qui glisse aussitôt d\'une frette vers la Quinte avant de revenir à la tonique (1 → #4 → 5 → 4 → 1).',
      musicalValue: 'Le triton (#4/b5) est l\'intervalle de tension le plus expressif. Reconnaître son attirance vers la Quinte affine votre oreille modale et votre jeu jazz/fusion.',
      listeningTip: 'Pensez aux deux premières notes du générique des « Simpson » pour repérer ce saut vers la #4 suivi de la Quinte juste 1 frette plus haut.',
    },
    es: {
      theoryTip: 'Siente la "Elevación Lidia": un salto de tritono / cuarta aumentada (+6 semitonos) que tira 1 traste hacia la Quinta antes de resolver en la tónica (1 → #4 → 5 → 4 → 1).',
      musicalValue: 'El tritono (#4/b5) es el intervalo de mayor tensión expresiva. Reconocer su atracción hacia la Quinta afila tu oído modal y tus frases de jazz/fusión.',
      listeningTip: 'Piensa en el inicio del tema de "Los Simpson" para identificar ese salto a la #4 que resuelve 1 traste arriba en la Quinta.',
    },
  },
  14: {
    tier: 'intermediate',
    en: {
      theoryTip: 'Walk straight through the core Minor Pentatonic climb and snap back to the Root (1 → b3 → 4 → 5 → 1). Every single note sits comfortably inside one 4-fret hand box.',
      musicalValue: 'This 4-note minor pentatonic contour is the DNA of rock, blues, funk, and hip-hop bass. Hearing it instantly lets you pick up minor grooves on the first listen.',
      listeningTip: 'Keep your index finger anchored on the Root: climb +3 frets (b3), cross to the next string same fret (4), +2 frets (5), and drop back home.',
    },
    fr: {
      theoryTip: 'Montez le cœur de la Pentatonique Mineure avant de revenir sur la Tonique (1 → b3 → 4 → 5 → 1). Toutes les notes tiennent confortablement dans une seule boîte de 4 frettes.',
      musicalValue: 'Ce contour pentatonique mineur est l\'ADN du rock, du blues, du funk et du hip-hop. L\'entendre instantanément permet de relever un groove mineur dès la première écoute.',
      listeningTip: 'Gardez l\'index ancré sur la tonique : +3 frettes (b3), corde suivante même frette (4), +2 frettes (5), puis retour direct sur l\'index.',
    },
    es: {
      theoryTip: 'Recorre el núcleo ascendente de la Pentatónica Menor y vuelve a la Tónica (1 → b3 → 4 → 5 → 1). Todas las notas caben cómodamente en una sola caja de 4 trastes.',
      musicalValue: 'Este contorno pentatónico menor es el ADN del rock, blues, funk y hip-hop. Reconocerlo al instante te permite sacar grooves menores a la primera escucha.',
      listeningTip: 'Mantén el índice anclado en la tónica: +3 trastes (b3), siguiente cuerda en el mismo traste (4), +2 trastes (5) y regreso directo al índice.',
    },
  },
  15: {
    tier: 'intermediate',
    en: {
      theoryTip: 'A compact 5-note box-shape phrase spanning two adjacent strings (1 → 2 → 4 → 3 → 1). Listen for the jump up to the Fourth followed by a tender 1-fret step down to the Major Third.',
      musicalValue: 'Connecting what your ears hear with geometric finger patterns on the neck turns ear training into effortless real-time improvisation.',
      listeningTip: 'Notice the arch shape: climb up, dip just 1 fret down from the highest note, then drop right back to your starting fret.',
    },
    fr: {
      theoryTip: 'Une phrase compacte de 5 notes en boîte sur deux cordes voisines (1 → 2 → 4 → 3 → 1). Guettez le saut vers la Quarte suivi d\'une petite descente d\'une frette vers la Tierce Majeure.',
      musicalValue: 'Relier ce que votre oreille entend aux formes géométriques sur le manche transforme l\'écoute en improvisation fluide.',
      listeningTip: 'Visualisez la forme en arche : montée vers le sommet, petite chute d\'une frette, puis retour direct à la note de départ.',
    },
    es: {
      theoryTip: 'Una frase compacta de 5 notas en forma de caja entre dos cuerdas vecinas (1 → 2 → 4 → 3 → 1). Escucha el salto a la Cuarta seguido de una caída suave de 1 traste a la Tercera Mayor.',
      musicalValue: 'Conectar lo que oyes con patrones geométricos del mástil convierte el entrenamiento auditivo en improvisación natural.',
      listeningTip: 'Visualiza el arco: sube al punto más alto, baja solo 1 traste y vuelve directo a tu nota de partida.',
    },
  },
};

function getIntervalSetSummary(sequence: number[]): { hasOctave: boolean; hasChromatic: boolean; hasTritone: boolean; rangeSemitones: number } {
  if (sequence.length < 2) {
    return { hasOctave: false, hasChromatic: false, hasTritone: false, rangeSemitones: 0 };
  }
  const min = Math.min(...sequence);
  const max = Math.max(...sequence);
  let hasOctave = false;
  let hasChromatic = false;
  let hasTritone = false;
  for (let i = 1; i < sequence.length; i++) {
    const diff = Math.abs(sequence[i] - sequence[i - 1]);
    if (diff === 12) hasOctave = true;
    if (diff === 1) hasChromatic = true;
    if (diff === 6) hasTritone = true;
  }
  return { hasOctave, hasChromatic, hasTritone, rangeSemitones: max - min };
}

export function getEarTrainingBriefing(
  day: number,
  sequence: number[],
  description: string,
  language: AppLanguage
): EarTrainingBriefing {
  const specific = SPECIFIC_BRIEFINGS[day];
  if (specific) {
    return {
      tier: specific.tier,
      ...specific[language],
    };
  }

  const isElite = day >= 31;
  const tier: EarTrainingBriefing['tier'] = isElite ? 'elite' : day >= 16 ? 'advanced' : day >= 6 ? 'intermediate' : 'beginner';
  const noteCount = sequence.length;
  const stats = getIntervalSetSummary(sequence);

  if (language === 'fr') {
    if (isElite) {
      return {
        tier,
        theoryTip: `Défi Élite de ${noteCount} notes : ${description} Comme chaque séance est transposée dans une tonalité aléatoire, votre oreille doit repérer le contour mélodique et les intervalles relatifs plutôt que des cases mémorisées.`,
        musicalValue: 'Relever des phrases longues à l\'oreille développe votre mémoire musicale à court terme et votre capacité à transcrire des lignes virtuoses de funk, jazz, rock ou fusion sans tablature.',
        listeningTip: stats.hasOctave
          ? 'Repérez d\'abord les grands sauts d\'octave (2 cordes plus aiguës, +2 frettes), puis découpez la phrase en petits groupes de 3–4 notes. N\'hésitez pas à passer en vitesse 0.75x !'
          : stats.hasChromatic
          ? 'Guettez les passages chromatiques d\'une frette à la fois et utilisez la vitesse 0.75x ou le mode Guidé pour apprivoiser la phrase par petits blocs.'
          : 'Découpez la phrase en deux moitiés mentales, chantez-la une fois, et utilisez la vitesse 0.75x si besoin pour verrouiller chaque saut d\'intervalle.',
      };
    }

    return {
      tier,
      theoryTip: `Phrase musicale de ${noteCount} notes : ${description} L'exercice est transposé dans une tonalité aléatoire afin d'entraîner votre oreille relative — concentrez-vous sur la distance entre chaque note.`,
      musicalValue: 'Reconnaître des riffs célèbres et des couleurs modales directement à l\'oreille est le meilleur raccourci pour apprendre vos morceaux préférés plus vite et improviser avec justesse.',
      listeningTip: stats.hasChromatic
        ? 'Restez attentif aux glissements serrés d\'une seule frette (demi-tons) et utilisez le bouton « 1ère Note » pour caler votre point de départ.'
        : stats.hasTritone
        ? 'Écoutez la tension caractéristique du triton (6 demi-tons) qui attire l\'oreille vers une résolution, et repérez les notes répétées comme points d\'ancrage.'
        : 'Trouvez d\'abord la note de départ, repérez si la note suivante monte ou descend, et appuyez-vous sur les repères 3ce / 4te / 5te sous vos doigts.',
    };
  }

  if (language === 'es') {
    if (isElite) {
      return {
        tier,
        theoryTip: `Desafío Élite de ${noteCount} notas: ${description} Como cada sesión se transpone a una tonalidad aleatoria, tu oído deberá reconocer el contorno melódico y los intervalos relativos en lugar de trastes fijos.`,
        musicalValue: 'Sacar frases largas de oído entrena tu memoria musical a corto plazo y te da la libertad de transcribir líneas complejas de funk, jazz, rock o fusión sin depender de tablaturas.',
        listeningTip: stats.hasOctave
          ? 'Identifica primero los saltos amplios de octava (2 cuerdas más agudas, +2 trastes) y divide la frase en bloques de 3–4 notas. ¡Usa 0.75x si lo necesitas!'
          : stats.hasChromatic
          ? 'Presta atención a los pasos cromáticos de 1 traste y apóyate en la velocidad 0.75x o el modo Guiado para dominar la frase por secciones.'
          : 'Divide la melodía en dos mitades mentales, cántala una vez y usa 0.75x si quieres escuchar cada salto de intervalo con total claridad.',
      };
    }

    return {
      tier,
      theoryTip: `Frase musical de ${noteCount} notas: ${description} El ejercicio se transpone a una tonalidad aleatoria para entrenar tu oído relativo: céntrate en la distancia entre cada nota.`,
      musicalValue: 'Reconocer riffs icónicos y colores modales directamente de oído es el mejor atajo para sacar canciones rápido y tocar con seguridad junto a otros músicos.',
      listeningTip: stats.hasChromatic
        ? 'Escucha con atención los movimientos cortos de 1 traste (semitonos) y usa "Oír 1ª Nota" para fijar tu punto de partida.'
        : stats.hasTritone
        ? 'Detecta la tensión característica del tritono (6 semitonos) y usa las notas repetidas como ancla para orientarte en el mástil.'
        : 'Ubica primero la nota inicial, identifica si la siguiente sube o baja, y apóyate en las formas familiares de 3ª, 4ª y 5ª bajo tus dedos.',
    };
  }

  // English fallback for days 16-46
  if (isElite) {
    return {
      tier,
      theoryTip: `Elite ${noteCount}-note ear challenge: ${description} Because each run transposes to a fresh random key, your ear must track relative pitch intervals and melodic shape instead of memorized frets.`,
      musicalValue: 'Memorizing and reproducing longer phrases by ear builds real-world transcription chops — letting you learn complex funk, jazz, rock, and fusion basslines without waiting for tabs.',
      listeningTip: stats.hasOctave
        ? 'Listen for the wide octave jumps first (2 strings up, +2 frets), then break the melody into 3–4 note chunks. Slow down to 0.75x anytime!'
        : stats.hasChromatic
        ? 'Watch out for tight 1-fret chromatic runs, and try 0.75x speed or Guided mode to lock in each section cleanly.'
        : 'Split the phrase mentally into two halves, hum the contour once, and drop to 0.75x speed if you want extra clarity on quick interval jumps.',
    };
  }

  return {
    tier,
    theoryTip: `${noteCount}-note musical ear phrase: ${description} The melody transposes to a fresh random key so you train true relative pitch — focus on how far each note moves from the previous one.`,
    musicalValue: 'Hearing iconic bass riffs and modal tensions by ear is the fastest way to learn songs on the spot, catch chord changes live, and play what you hear in your head.',
    listeningTip: stats.hasChromatic
      ? 'Listen closely for tight 1-fret half-step slides, and use "Hear 1st Note" to anchor your starting pitch before tackling the full run.'
      : stats.hasTritone
      ? 'Spot the dramatic tritone tension (6 frets) pulling toward resolution, and use any repeated notes as landmarks.'
      : 'Lock in the starting pitch first, track whether each next note steps up or down, and feel familiar 3rd, 4th, and 5th shapes under your fingers.',
  };
}
