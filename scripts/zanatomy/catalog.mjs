/*
 * What the import takes from Z-Anatomy, and what each piece becomes on the First Rep model.
 *
 * Names are Z-Anatomy object names without the side suffix. A name with a right-side object
 * ("<name>.r") is a paired structure: the import takes the right one, mirrors it onto the
 * modeled half of the figure, and the viewer mirrors it back. A name without one is on the
 * midline, or is a real left or right structure (the heart, the aorta), and is kept where it is.
 *
 * Only the CC BY-SA 4.0 parts of Z-Anatomy are listed. Its non-commercial models (the inner ear,
 * the kidney) and the brain models are never taken.
 */

/**
 * Selectable muscles: name -> [muscle id, part id, layer, cover].
 * Ids match src/data/muscles.js and src/data/parts.js. layer "deep" only shows in the Deep layer;
 * cover: lifted away in the Deep layer to show what is underneath.
 */
export const MUSCLES = {
  "Clavicular head of pectoralis major muscle": ["chest", "upper"],
  "Sternocostal head of pectoralis major muscle": ["chest", "lower"],
  "(Abdominal part of pectoralis major muscle)": ["chest", "lower"],

  "Clavicular part of deltoid muscle": ["shoulders", "front"],
  "Acromial part of deltoid muscle": ["shoulders", "side"],
  "Scapular spinal part of deltoid muscle": ["shoulders", "rear"],

  "Long head of biceps brachii": ["biceps", "biceps"],
  "Short head of biceps brachii": ["biceps", "biceps"],
  "Brachialis muscle": ["biceps", "brachialis"],

  "Long head of triceps brachii": ["triceps", "long", "surface", false, "triceps-tendon"],
  "Lateral head of triceps brachii": ["triceps", "lateral", "surface", false, "triceps-tendon"],
  "Medial head of triceps brachii": ["triceps", "medial"],

  "Brachioradialis muscle": ["forearms", "brachioradialis"],
  "Flexor carpi radialis": ["forearms", "flexors", "surface", true],
  "Palmaris longus muscle": ["forearms", "flexors", "surface", true],
  "Humeral head of flexor carpi ulnaris": ["forearms", "flexors", "surface", true],
  "Ulnar head of flexor carpi ulnaris": ["forearms", "flexors", "surface", true],
  "Superficial head of pronator teres": ["forearms", "flexors", "surface", true],
  "Humero-ulnar head of flexor digitorum superficialis": ["forearms", "flexors", "surface", true],
  "Radial head of flexor digitorum superficialis": ["forearms", "flexors", "surface", true],
  "Flexor digitorum profundus": ["forearms", "flexors", "deep"],
  "Flexor pollicis longus": ["forearms", "flexors", "deep"],
  "Deep head of pronator teres": ["forearms", "flexors", "deep"],
  "Pronator quadratus": ["forearms", "flexors", "deep"],
  "Extensor carpi radialis longus": ["forearms", "extensors", "surface", true],
  "Extensor carpi radialis brevis": ["forearms", "extensors", "surface", true],
  "Extensor digitorum": ["forearms", "extensors", "surface", true],
  "Extensor digiti minimi": ["forearms", "extensors", "surface", true],
  "Humeral head of extensor carpi ulnaris": ["forearms", "extensors", "surface", true],
  "Ulnar head of extensor carpi ulnaris": ["forearms", "extensors", "surface", true],
  "Abductor pollicis longus": ["forearms", "extensors"],
  "Extensor pollicis brevis": ["forearms", "extensors"],
  "Extensor pollicis longus": ["forearms", "extensors", "deep"],
  "Extensor indicis": ["forearms", "extensors", "deep"],
  "Supinator": ["forearms", "extensors", "deep"],

  "Descending part of trapezius muscle": ["traps", "upper", "surface", true],
  "Transverse part of trapezius muscle": ["traps", "upper", "surface", true],
  "Ascending part of trapezius muscle": ["traps", "lower", "surface", true],

  "Latissimus dorsi muscle": ["lats", "lat"],
  "Teres major muscle": ["lats", "teres"],

  "Infraspinatus muscle": ["rotator-cuff", "infraspinatus"],
  "Teres minor muscle": ["rotator-cuff", "teres-minor"],
  "Supraspinatus muscle": ["rotator-cuff", "supraspinatus", "deep"],
  "Subscapularis muscle": ["rotator-cuff", "subscapularis", "deep"],

  "Serratus anterior muscle": ["serratus", "main"],

  "Rectus abdominis muscle": ["abs", "main", "surface", true],
  "Pyramidalis muscle": ["abs", "main", "surface", true],

  // the flat tendon of the obliques is the front wall of the rectus sheath
  "External abdominal oblique muscle": ["obliques", "main", "surface", true, "rectus-sheath"],
  "Internal abdominal oblique muscle": ["obliques", "main", "deep"],

  "Transversus abdominis muscle": ["deep-core", "transversus", "deep"],
  "Multifidus lumborum muscle": ["deep-core", "multifidus", "deep"],
  "Multifidus thoracis muscle": ["deep-core", "multifidus", "deep"],
  "Multifidus colli muscle": ["deep-core", "multifidus", "deep"],

  "Iliocostalis lumborum muscle": ["lower-back", "main", "surface", true],
  "Iliocostalis thoracis muscle": ["lower-back", "main", "surface", true],
  "Longissimus thoracis muscle": ["lower-back", "main", "surface", true],
  "Spinalis thoracis muscle": ["lower-back", "main", "surface", true],

  "Rhomboid major muscle": ["rhomboids", "main", "deep"],
  "Rhomboid minor muscle": ["rhomboids", "main", "deep"],

  "Gluteus maximus muscle": ["glutes", "main", "surface", true],
  "Gluteus medius muscle": ["hip-abductors", "medius", "surface", true],
  "Gluteus minimus muscle": ["hip-abductors", "minimus", "deep"],
  "Tensor fasciae latae": ["hip-abductors", "tfl"],
  "Piriformis muscle": ["piriformis", "main", "deep"],

  // the iliopsoas runs deep in the trunk and surfaces at the groin, so it is drawn with the
  // surface muscles: the abdominal wall hides the rest of it
  "Psoas major": ["hip-flexors", "psoas"],
  "Iliacus muscle": ["hip-flexors", "iliacus"],
  "Pectineus muscle": ["hip-flexors", "lower"],
  "Sartorius muscle": ["hip-flexors", "sartorius"],

  "Rectus femoris muscle": ["quads", "rectus", "surface", true],
  "Vastus lateralis muscle": ["quads", "lateralis"],
  "Vastus medialis muscle": ["quads", "medialis"],
  "Vastus intermedius muscle": ["quads", "intermedius", "deep"],

  "Adductor longus": ["adductors", "main"],
  "Adductor magnus": ["adductors", "main"],
  "Gracilis muscle": ["adductors", "main"],
  "Adductor brevis": ["adductors", "main", "deep"],
  "(Adductor minimus)": ["adductors", "main", "deep"],

  "Long head of biceps femoris": ["hamstrings", "biceps-femoris"],
  "Short head of biceps femoris": ["hamstrings", "biceps-femoris"],
  "Semitendinosus muscle": ["hamstrings", "semitendinosus"],
  "Semimembranosus muscle": ["hamstrings", "semimembranosus"],

  "Medial head of gastrocnemius": ["calves", "gastrocnemius"],
  "Lateral head of gastrocnemius": ["calves", "gastrocnemius"],
  "Soleus muscle": ["calves", "soleus"],

  "Tibialis anterior muscle": ["shins", "main"],
  "Fibularis longus muscle": ["peroneals", "main"],
  "Fibularis brevis muscle": ["peroneals", "main"],
  "Fibularis tertius muscle": ["peroneals", "main"],

  "Sternocleidomastoid muscle": ["neck", "main"],
};

/**
 * Muscles that are part of the body but have no entry of their own on the site. They are drawn
 * in a darker red and cannot be picked. name -> layer.
 */
export const TISSUE = {
  "Coracobrachialis muscle": "surface",
  "Anconeus muscle": "surface",
  "Extensor digitorum longus": "surface",
  "Extensor hallucis longus": "surface",
  "Tendon of extensor digitorum longus": "surface",
  "Levator scapulae": "surface",
  "Splenius capitis muscle": "surface",
  "Splenius colli muscle": "deep",
  "Omohyoid muscle": "surface",
  "Sternohyoid muscle": "surface",
  "Sternothyroid muscle": "surface",
  "Thyrohyoid muscle": "surface",
  "Scalenus anterior muscle": "deep",
  "Scalenus medius muscle": "deep",
  "Scalenus posterior muscle": "deep",
  "Pectoralis minor muscle": "deep",
  "Subclavius muscle": "deep",
  "Serratus posterior superior muscle": "deep",
  "Serratus posterior inferior muscle": "deep",
  "Iliocostalis colli muscle": "deep",
  "Longissimus colli muscle": "deep",
  "Longissimus capitis muscle": "deep",
  "Spinalis colli muscle": "deep",
  "Spinalis capitis muscle": "deep",
  "Semispinalis thoracis muscle": "deep",
  "Semispinalis colli muscle": "deep",
  "Quadratus lumborum muscle": "deep",
  "Obturator internus": "deep",
  "Obturator externus": "deep",
  "Superior gemellus muscle": "deep",
  "Inferior gemellus muscle": "deep",
  "Quadratus femoris muscle": "deep",
  "Plantaris muscle": "deep",
  "Popliteus muscle": "deep",
  "Tibialis posterior muscle": "deep",
  "Flexor digitorum longus": "deep",
  "Flexor hallucis longus": "deep",
  "External intercostal muscles": "surface",
};

/**
 * The head, the hands and the feet are drawn as one graphite sculpture, as before: the skull,
 * the small muscles of the face, the palm and the sole. Not pickable. name -> true.
 */
export const SHELL = [
  // face and scalp
  "Frontalis muscle",
  "Occipitalis muscle",
  "Epicranial aponeurosis",
  "Temporoparietalis muscle",
  "Temporalis muscle",
  "Superficial part of masseter",
  "Deep part of masseter",
  "Orbital part of orbicularis oculi",
  "Palpebral part of orbicularis oculi",
  "Orbicularis oris muscle",
  "Zygomaticus major muscle",
  "Zygomaticus minor muscle",
  "Levator labii superioris",
  "Levator nasolabialis",
  "Levator anguli oris",
  "Depressor anguli oris",
  "Depressor labii inferioris",
  "Risorius muscle",
  "Nasalis muscle",
  "Procerus muscle",
  "Mentalis muscle",
  "Bucinator",
  "Corrugator supercilii",
  "Depressor septi nasi",
  // the eyes, so the sockets are not empty
  "Sclera",
  "Cornea",
  // palm
  "Abductor pollicis brevis",
  "Superficial head of flexor pollicis brevis",
  "Deep head of flexor pollicis brevis",
  "Opponens pollicis muscle",
  "Oblique head of adductor pollicis",
  "Transverse head of adductor pollicis",
  "Abductor digiti minimi of hand",
  "Flexor digiti minimi of hand",
  "Opponens digiti minimi muscle of hand",
  "Lumbrical muscles of hand",
  "Dorsal interossei muscles of hand",
  "Palmar interossei muscles",
  "Palmar aponeurosis",
  "Flexor retinaculum of wrist",
  "Extensor retinaculum of wrist",
  // sole and top of the foot
  "Abductor hallucis",
  "Flexor digitorum brevis",
  "Abductor digiti minimi of foot",
  "Quadratus plantae muscle",
  "Lumbrical muscles of foot",
  "Medial head of flexor hallucis brevis",
  "Lateral head of flexor hallucis brevis",
  "Oblique head of adductor hallucis",
  "Transverse head of adductor hallucis",
  "Flexor digiti minimi of foot",
  "Dorsal interossei muscles of foot",
  "Plantar interossei muscles",
  "Extensor digitorum brevis",
  "Extensor hallucis brevis",
  "Superior extensor retinaculum of ankle",
  "Inferior extensor retinaculum of ankle",
  "Flexor retinaculum of ankle",
  "Plantar aponeurosis",
];

/** Tendon and fascia that are named structures on the surface. name -> [landmark, layer, cover] */
export const SURFACE = {
  "Calcaneal tendon": ["achilles", "surface", false],
  "Posterior layer of thoracolumbar fascia": ["lumbar-fascia", "surface", true],
  "Linea alba": ["rectus-sheath", "surface", true],
};

/** Bones: name -> landmark id in the Skeleton layer. Some are also landmarks on the surface. */
export const BONES = {
  "Frontal bone": "skull",
  "Parietal bone": "skull",
  "Occipital bone": "skull",
  "Temporal bone": "skull",
  "Sphenoid bone": "skull",
  "Zygomatic bone": "skull",
  Maxilla: "skull",
  Mandible: "skull",
  "Nasal bone": "skull",
  "Lacrimal bone": "skull",
  "Hyoid bone": null,

  "Atlas (C1)": "vertebrae",
  "Axis (C2)": "vertebrae",
  ...Object.fromEntries(["C3", "C4", "C5", "C6", "C7", ...Array.from({ length: 12 }, (_, i) => `T${i + 1}`), "L1", "L2", "L3", "L4", "L5"].map((v) => [`Vertebra ${v}`, "vertebrae"])),

  ...Object.fromEntries(
    ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth"].map((n) => [`${n} rib`, "ribs"]),
  ),
  ...Object.fromEntries(
    ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"].map((n) => [`Costal cartilage of ${n} rib`, "ribs"]),
  ),
  "Manubrium of sternum": "breastbone",
  "Body of sternum": "breastbone",
  "Xiphoid process": "breastbone",
  Clavicle: "collarbone",
  Scapula: "scapula",

  Humerus: "humerus",
  Radius: "forearm-bones",
  Ulna: "forearm-bones",
  ...Object.fromEntries(
    ["Scaphoid bone", "Lunate bone", "Triquetrum bone", "Pisiform bone", "Trapezium bone", "Trapezoid bone", "Capitate bone", "Hamate bone"].map((n) => [n, "hand-bones"]),
  ),
  ...Object.fromEntries(["First", "Second", "Third", "Fourth", "Fifth"].map((n) => [`${n} metacarpal bone`, "hand-bones"])),
  ...Object.fromEntries(
    ["first", "second", "third", "fourth", "fifth"].flatMap((f) =>
      ["Proximal", "Middle", "Distal"].filter((p) => !(f === "first" && p === "Middle")).map((p) => [`${p} phalanx of ${f} finger of hand`, "hand-bones"]),
    ),
  ),

  "Hip bone": "pelvis",
  Sacrum: "pelvis",
  Coccyx: "pelvis",
  Femur: "femur",
  Patella: "kneecap",
  Tibia: "shin",
  Fibula: "fibula",
  ...Object.fromEntries(
    ["Talus", "Calcaneus", "Navicular bone", "Cuboid bone", "Medial cuneiform bone", "Intermediate cuneiform bone", "Lateral cuneiform bone", "Sesamoid bones of foot"].map((n) => [n, "foot-bones"]),
  ),
  ...Object.fromEntries(["First", "Second", "Third", "Fourth", "Fifth"].map((n) => [`${n} metatarsal bone`, "foot-bones"])),
  ...Object.fromEntries(
    ["first", "second", "third", "fourth", "fifth"].flatMap((f) =>
      ["Proximal", "Middle", "Distal"].filter((p) => !(f === "first" && p === "Middle")).map((p) => [`${p} phalanx of ${f} finger of foot`, "foot-bones"]),
    ),
  ),

  // the discs between the vertebrae, drawn with the spine
  ...Object.fromEntries(
    ["C2-C3", "C3-C4", "C4-C5", "C5-C6", "C6-C7", "C7-T1", ...Array.from({ length: 11 }, (_, i) => `T${i + 1}-T${i + 2}`), "T12-L1", "L1-L2", "L2-L3", "L3-L4", "L4-L5", "L5-S1"].map((d) => [
      `Intervertebral disc ${d}`,
      "vertebrae",
    ]),
  ),
};

/** Bones that are also named structures in the Surface and Deep layers. landmark id -> surface id */
export const SURFACE_BONES = { collarbone: "collarbone", breastbone: "breastbone", kneecap: "kneecap", shin: "shin", vertebrae: "spine" };

/** Ligaments: name -> landmark id. */
export const LIGAMENTS = {
  "Acromioclavicular ligament": "ac-ligament",
  "Articular capsule of acromioclavicular joint": "ac-ligament",
  "Conoid ligament": "ac-ligament",
  "Trapezoid ligament": "ac-ligament",
  "Articular capsule of glenohumeral joint": "shoulder-capsule",
  "Coracohumeral ligament": "shoulder-capsule",
  "Superior glenohumeral ligament": "shoulder-capsule",
  "Middle glenohumeral ligament": "shoulder-capsule",
  "Inferior glenohumeral ligament": "shoulder-capsule",
  "Superficial part of tibial collateral ligament": "mcl",
  "Deep part of tibial collateral ligament": "mcl",
  "Fibular collateral ligament": "lcl",
  "Anterior cruciate ligament": "cruciates",
  "Posterior cruciate ligament": "cruciates",
  "Anterior talofibular ligament": "ankle-ligaments",
  "Posterior talofibular ligament": "ankle-ligaments",
  "Calcaneofibular ligament": "ankle-ligaments",
  "Tibionavicular ligament": "deltoid-ligament",
  "Tibiocalcaneal ligament": "deltoid-ligament",
  "Posterior tibiotalar ligament": "deltoid-ligament",
  "Medial meniscus": null,
  "Lateral meniscus": null,
};

/**
 * Nerves, drawn as tubes along Z-Anatomy's curves: name -> [landmark id, layer].
 * layer "nerve" shows in the Deep and Skeleton layers; "skeleton" (fine branches) in the Skeleton layer only.
 */
export const NERVES = {
  "Roots of brachial plexus": ["nerve-roots", "nerve"],
  "Superior trunk of brachial plexus": ["brachial-plexus", "nerve"],
  "Middle trunk of brachial plexus": ["brachial-plexus", "nerve"],
  "Inferior trunk of brachial plexus": ["brachial-plexus", "nerve"],
  "Anterior division of superior trunk of brachial plexus": ["brachial-plexus", "nerve"],
  "Anterior division of middle trunk of brachial plexus": ["brachial-plexus", "nerve"],
  "Anterior division of inferior trunk of brachial plexus": ["brachial-plexus", "nerve"],
  "Posterior division of superior trunk of brachial plexus": ["brachial-plexus", "nerve"],
  "Posterior division of middle trunk of brachial plexus": ["brachial-plexus", "nerve"],
  "Posterior division of inferior trunk of brachial plexus": ["brachial-plexus", "nerve"],
  "Posterior cord of brachial plexus": ["brachial-plexus", "nerve"],
  "Axillary nerve": ["axillary-nerve", "nerve"],
  "Muscular branches of axillary nerve": ["axillary-nerve", "skeleton"],
  "Musculocutaneous nerve": ["musculocutaneous-nerve", "nerve"],
  "Lateral antebrachial cutaneous nerve": ["musculocutaneous-nerve", "skeleton"],
  "Median nerve": ["median-nerve", "nerve"],
  "Anterior interosseous nerve of forearm": ["median-nerve", "skeleton"],
  "Muscular branches of median nerve": ["median-nerve", "skeleton"],
  "Common palmar digital branches of median nerve": ["median-nerve", "skeleton"],
  "Proper palmar digital branches of median nerve": ["median-nerve", "skeleton"],
  "Ulnar nerve": ["ulnar-nerve", "nerve"],
  "Muscular branches of ulnar nerve": ["ulnar-nerve", "skeleton"],
  "Deep branch of ulnar nerve": ["ulnar-nerve", "skeleton"],
  "Superficial branch of ulnar nerve": ["ulnar-nerve", "skeleton"],
  "Dorsal branch of ulnar nerve": ["ulnar-nerve", "skeleton"],
  "Common palmar digital branches of ulnar nerve": ["ulnar-nerve", "skeleton"],
  "Proper palmar digital branches of ulnar nerve": ["ulnar-nerve", "skeleton"],
  "Radial nerve": ["radial-nerve", "nerve"],
  "Deep branch of radial nerve": ["radial-nerve", "nerve"],
  "Superficial branch of radial nerve": ["radial-nerve", "skeleton"],
  "Posterior interosseous nerve of forearm": ["radial-nerve", "skeleton"],
  "Muscular branches of radial nerve": ["radial-nerve", "skeleton"],
  "Intercostal nerves": ["intercostal-nerves", "skeleton"],
  "Iliohypogastric nerve": ["lumbar-plexus", "nerve"],
  "Ilio-inguinal nerve": ["lumbar-plexus", "nerve"],
  "Genitofemoral nerve": ["lumbar-plexus", "nerve"],
  "Lateral femoral cutaneous nerve": ["lumbar-plexus", "nerve"],
  "Femoral nerve": ["femoral-nerve", "nerve"],
  "Anterior cutaneous branches of femoral nerve": ["femoral-nerve", "skeleton"],
  "Saphenous nerve": ["saphenous-nerve", "nerve"],
  "Infrapatellar branch of saphenous nerve": ["saphenous-nerve", "skeleton"],
  "Medial crural cutaneous branches of saphenous nerve": ["saphenous-nerve", "skeleton"],
  "Obturator nerve": ["obturator-nerve", "nerve"],
  "Anterior branch of obturator nerve": ["obturator-nerve", "nerve"],
  "Posterior branch of obturator nerve": ["obturator-nerve", "nerve"],
  "Superior gluteal nerve": ["sacral-plexus", "nerve"],
  "Posterior femoral cutaneous nerve": ["sacral-plexus", "skeleton"],
  "Pudendal nerve": ["sacral-plexus", "skeleton"],
  "Sciatic nerve": ["sciatic", "nerve"],
  "Tibial nerve": ["tibial-nerve", "nerve"],
  "Medial plantar nerve": ["tibial-nerve", "skeleton"],
  "Lateral plantar nerve": ["tibial-nerve", "skeleton"],
  "Sural nerve": ["tibial-nerve", "skeleton"],
  "Common fibular nerve": ["peroneal-nerve", "nerve"],
  "Deep fibular nerve": ["peroneal-nerve", "nerve"],
  "Superficial fibular nerve": ["peroneal-nerve", "nerve"],
};

/** Arteries and veins, drawn as tubes: name -> landmark id. All in the Skeleton layer. */
export const ARTERIES = {
  "Ascending aorta": "aorta",
  "Aortic arch": "aorta",
  "Thoracic aorta": "aorta",
  "Abdominal aorta": "aorta",
  "Brachiocephalic trunk": "subclavian-artery",
  "Left common carotid artery": "carotid-artery",
  "Right common carotid artery": "carotid-artery",
  "External carotid artery": "carotid-artery",
  "Internal carotid artery": "carotid-artery",
  "Left subclavian artery": "subclavian-artery",
  "Right subclavian artery": "subclavian-artery",
  "Axillary artery": "subclavian-artery",
  "Brachial artery": "brachial-artery",
  "Deep brachial artery": "brachial-artery",
  "Radial artery": "forearm-arteries",
  "Ulnar artery": "forearm-arteries",
  "Common interosseous artery": "forearm-arteries",
  "Common iliac artery": "iliac-artery",
  "External iliac artery": "iliac-artery",
  "Internal iliac artery": "iliac-artery",
  "Femoral artery": "femoral-artery",
  "Deep femoral artery": "femoral-artery",
  "Popliteal artery": "popliteal-artery",
  "Anterior tibial artery": "tibial-arteries",
  "Posterior tibial artery": "tibial-arteries",
  "Fibular artery": "tibial-arteries",
  "Dorsalis pedis artery": "tibial-arteries",
};
export const VEINS = {
  "Superior vena cava": "vena-cava",
  "Inferior vena cava (thoracic part)": "vena-cava",
  "Inferior vena cava (abdominal part)": "vena-cava",
  "Internal jugular vein": "jugular-vein",
  "External jugular vein": "jugular-vein",
  "Left brachiocephalic vein": "arm-veins",
  "Right brachiocephalic vein": "arm-veins",
  "Left subclavian vein": "arm-veins",
  "Right subclavian vein": "arm-veins",
  "Axillary vein": "arm-veins",
  "Cephalic vein": "arm-veins",
  "Basilic vein": "arm-veins",
  "Brachial veins": "arm-veins",
  "Median cubital vein": "arm-veins",
  "Common iliac vein": "femoral-vein",
  "External iliac vein": "femoral-vein",
  "Femoral vein": "femoral-vein",
  "Deep femoral vein": "femoral-vein",
  "Great saphenous vein": "saphenous-vein",
  "Small saphenous vein": "saphenous-vein",
};

/** The heart, from its four chambers. */
export const HEART = ["Left atrium", "Right atrium", "Left ventricle", "Right ventricle"];
