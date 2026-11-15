/*
 * Full details for every non-muscle structure on the model: bones, ligaments,
 * nerves, fascia and tendons. Keys match LANDMARKS in tissue.js, which holds the
 * short name, kind and one-line note used for tooltips.
 *
 * latin     the anatomical name
 * about     two or three sentences: what it is and why it matters
 * facts     [label, text] pairs, three per structure
 * muscles   ids from muscles.js that attach to it, protect it or are worked by it
 * related   optional: ids of other structures worth reading next
 * motion    optional, joints only: the movement from motion.js that the model can play
 * problem   the common problem in plain words, and the sign that needs a professional
 * care      one line on looking after it in training
 *
 * General education, not diagnosis. Wording stays cautious on purpose.
 */

/** The groups shown in the structures list, in order. Fascia and tendons share one group. */
export const STRUCTURE_GROUPS = [
  { id: "bones", label: "Bones", kinds: ["Bone"] },
  { id: "ligaments", label: "Ligaments", kinds: ["Ligament"] },
  { id: "nerves", label: "Nerves", kinds: ["Nerve"] },
  { id: "fascia", label: "Fascia and tendons", kinds: ["Fascia", "Tendon"] },
  { id: "joints", label: "Joints", kinds: ["Joint"] },
  { id: "vessels", label: "Heart and vessels", kinds: ["Organ", "Artery", "Vein"] },
];

/** The heading over the linked muscles depends on what kind of structure it is. */
export const MUSCLE_LINK_LABEL = {
  Bone: "Muscles that attach here",
  Ligament: "Muscles that protect it",
  Nerve: "Muscles it works",
  Fascia: "Muscles that pull on it",
  Tendon: "Muscles that pull on it",
  Joint: "Muscles that move it",
  Organ: "Muscles it feeds",
  Artery: "Muscles it feeds",
  Vein: "Muscles it drains",
};

export const STRUCTURES = {
  // ------------------------------------------------------------------ bones
  skull: {
    latin: "Cranium",
    about:
      "The skull is 22 bones locked together around the brain, plus the lower jaw, which is the only part that moves. Head and skull together weigh about 5 kg, and the neck muscles have to balance that weight on top of the spine all day.",
    facts: [
      ["Job", "Protects the brain and the organs of sight, hearing and balance."],
      ["Joints", "It rests on the first vertebra, which lets you nod. The second vertebra lets you turn your head."],
      ["Good to know", "When the head drifts forward of the shoulders, the neck and upper traps work much harder to hold it."],
    ],
    muscles: ["neck", "traps"],
    problem: {
      common: "Tension headaches often start in tight muscles at the base of the skull.",
      warning: "A blow to the head followed by confusion, vomiting, drowsiness or a worsening headache needs emergency care.",
    },
    care: "Lift with your head in line with your spine, not craned forward or tipped back.",
  },
  vertebrae: {
    latin: "Vertebral column",
    about:
      "The spine is a stack of 24 moving vertebrae, plus the sacrum and tailbone, separated by discs that act as shock absorbers. Its gentle curves make it springy, and a canal through the middle carries the spinal cord.",
    facts: [
      ["Regions", "Seven vertebrae in the neck, twelve in the upper back and five in the lower back."],
      ["Discs", "A tough ring around a gel center. They carry load well when the spine keeps its natural curve."],
      ["Good to know", "The spine is strong and adapts to training. It is built to bend, and also to be held still under load."],
    ],
    muscles: ["lower-back", "deep-core", "abs", "traps", "rhomboids", "lats"],
    problem: {
      common: "Disc bulge: a disc presses on a nerve root, often after repeated bending under load. Many improve without surgery.",
      warning: "Pain shooting down an arm or leg with numbness or weakness, or any loss of bladder or bowel control.",
    },
    care: "Keep the spine's natural curve under heavy loads, and build up weights gradually.",
  },
  spine: {
    latin: "Spinous processes",
    about:
      "The row of bumps you can feel down the middle of your back are the rear tips of the vertebrae. On the model's surface they show as a pale line, because the traps attach to them through a thin sheet of tendon and not through muscle.",
    facts: [
      ["Job", "Levers and anchor points for the muscles and ligaments of the back."],
      ["Landmark", "The most prominent bump at the base of the neck is the seventh neck vertebra."],
      ["Good to know", "Switch to the Skeleton layer to see the whole column these tips belong to."],
    ],
    muscles: ["traps", "rhomboids", "lats", "lower-back"],
    problem: {
      common: "A bruise from a hard bench or the bar resting on one of the bumps during squats.",
      warning: "Tenderness on one bump after a fall or impact should be checked.",
    },
    care: "In back squats, rest the bar on the muscle of the upper back, not on the bone at the base of the neck.",
  },
  ribs: {
    latin: "Thoracic cage",
    about:
      "Twelve pairs of ribs curve from the spine around to the front, forming a cage around the heart and lungs. They swing up and out like bucket handles each time you breathe in.",
    facts: [
      ["Types", "Seven pairs reach the breastbone, three join an arch of cartilage below it, and two short pairs float free."],
      ["Breathing", "The diaphragm below and the small muscles between the ribs expand the cage."],
      ["Good to know", "Bracing for a lift works by raising the pressure in the space under the ribs."],
    ],
    muscles: ["chest", "serratus", "abs", "obliques", "lats"],
    problem: {
      common: "A bruised rib or a strain of the small muscles between two ribs: sharp pain on a deep breath, a cough or a twist.",
      warning: "Chest pain with breathlessness, or strong pain after a hard impact.",
    },
    care: "Breathe out during the effort of each rep instead of holding your breath through a whole set.",
  },
  breastbone: {
    latin: "Sternum",
    about:
      "A flat bone down the middle of the chest. The collarbones and the first seven pairs of ribs attach to it, and both chest muscles anchor along its edges.",
    facts: [
      ["Job", "The front anchor of the ribcage and a shield for the heart."],
      ["Joints", "With each collarbone at the top. That is the only bony link between the arm and the trunk."],
      ["Landmark", "The notch at the top marks where the chest muscles begin, and the tip at the bottom marks where the abs begin."],
    ],
    muscles: ["chest", "abs", "neck"],
    problem: {
      common: "Irritated cartilage where the ribs meet the breastbone. It is sore to press and can follow heavy pressing or dips.",
      warning: "Chest pain with pressure, sweating, nausea, or pain spreading to the arm or jaw is an emergency.",
    },
    care: "Add pressing work gradually, especially dips.",
  },
  collarbone: {
    latin: "Clavicle",
    about:
      "An S-shaped strut between the breastbone and the shoulder blade. It holds the shoulder out to the side so the arm can swing freely, and it is the only bony connection between the arm and the trunk.",
    facts: [
      ["Job", "Props the shoulder away from the chest."],
      ["Joints", "The breastbone at the inner end and the tip of the shoulder blade at the outer end."],
      ["Good to know", "It is one of the most commonly broken bones, usually from a fall onto the shoulder or an outstretched hand."],
    ],
    muscles: ["chest", "shoulders", "traps", "neck"],
    problem: {
      common: "A sprain of the joint at its outer end, from a fall onto the point of the shoulder.",
      warning: "A visible step or bump on top of the shoulder after a fall.",
    },
    care: "Strong traps and shoulder muscles support the joint at its outer end.",
  },
  scapula: {
    latin: "Scapula",
    about:
      "A flat triangle of bone that floats on the back of the ribcage, held there only by muscle. Its shallow socket takes the ball of the upper arm bone, so wherever the blade goes, the shoulder joint goes with it.",
    facts: [
      ["Job", "A movable base for the arm."],
      ["Movement", "It slides up, down, forward and back, and it rotates so the arm can reach overhead."],
      ["Good to know", "Seventeen muscles attach to it. Poor control of the blade is behind many shoulder complaints."],
    ],
    muscles: ["traps", "rhomboids", "serratus", "rotator-cuff", "shoulders", "lats", "biceps", "triceps"],
    problem: {
      common: "Poor blade control: the blade tips or lifts off the ribs when the arm moves, and the shoulder pinches as a result.",
      warning: "A blade that suddenly sticks out, together with a weak shoulder.",
    },
    care: "Rows, face pulls and the push-up plus train the muscles that steer it.",
  },
  humerus: {
    latin: "Humerus",
    about:
      "The single bone of the upper arm. Its round head sits in the shoulder blade's shallow socket, which gives the shoulder the largest range of any joint, and its lower end forms the hinge of the elbow.",
    facts: [
      ["Joints", "The shoulder at the top and the elbow at the bottom."],
      ["Landmarks", "A groove at the front holds the biceps tendon. A rough patch halfway down is where the shoulder muscle attaches."],
      ["Good to know", "The radial nerve wraps around the back of this bone, so a break in mid-shaft can leave the wrist unable to lift."],
    ],
    muscles: ["chest", "lats", "shoulders", "rotator-cuff", "biceps", "triceps"],
    problem: {
      common: "Shoulder dislocation: the ball slips out of the socket, usually forward, when a raised arm is forced backward.",
      warning: "A shoulder that looks squared off and cannot move after a fall.",
    },
    care: "Rotator cuff work keeps the ball centered in its socket.",
  },
  "forearm-bones": {
    latin: "Radius and ulna",
    about:
      "Two bones side by side. The ulna forms the hinge of the elbow, and the radius, on the thumb side, carries the hand. When you turn your palm down, the radius rolls over the ulna.",
    facts: [
      ["Joints", "The elbow, the wrist, and a pivot between the two bones at each end."],
      ["Rotation", "About half a turn, from palm up to palm down."],
      ["Good to know", "A fall onto an outstretched hand most often breaks the radius just above the wrist."],
    ],
    muscles: ["biceps", "triceps", "forearms"],
    problem: {
      common: "A wrist sprain, or a broken radius, from a fall onto the hand.",
      warning: "Wrist pain and swelling after a fall, or pain at the base of the thumb that lingers.",
    },
    care: "Keep the wrist stacked over the bar or handle in presses and push-ups.",
  },
  "hand-bones": {
    latin: "Carpals, metacarpals and phalanges",
    about:
      "The hand has 27 bones: eight small ones in the wrist, five in the palm and fourteen in the fingers. Almost all the power for gripping comes from muscles up in the forearm, working through long tendons.",
    facts: [
      ["Job", "Grip and fine control."],
      ["Wrist tunnel", "The finger tendons and the median nerve share one tight tunnel at the wrist."],
      ["Good to know", "Calluses form where the bar presses on the palm. Holding the bar nearer the fingers reduces them."],
    ],
    muscles: ["forearms"],
    problem: {
      common: "Carpal tunnel syndrome: swelling in the wrist tunnel squeezes the median nerve.",
      warning: "Numbness or tingling in the thumb and first two fingers, especially at night.",
    },
    care: "Vary your grip, and avoid bending the wrists far back under load.",
  },
  pelvis: {
    latin: "Pelvis",
    about:
      "A ring made of the two hip bones and the sacrum between them. It passes the weight of the upper body to the legs, and it is the anchor for the biggest muscles in the body.",
    facts: [
      ["Joints", "The hip sockets at the sides, two stiff joints with the sacrum at the back, and a pad of cartilage at the front."],
      ["Tilt", "It can tip forward or back, which changes the curve of the lower back."],
      ["Good to know", "The bony points you sit on are where the hamstrings begin."],
    ],
    muscles: ["glutes", "hip-abductors", "piriformis", "hip-flexors", "hamstrings", "adductors", "quads", "abs", "obliques", "lower-back"],
    problem: {
      common: "Irritation of the joint between the sacrum and a hip bone: an ache over one dimple of the lower back.",
      warning: "Pelvic or groin pain after a fall, or pain that stops you putting weight on a leg.",
    },
    care: "Glute and core strength keep the pelvis level when you stand on one leg.",
  },
  femur: {
    latin: "Femur",
    about:
      "The longest, heaviest and strongest bone in the body. A ball at its top fits deep into the hip socket, and its lower end rolls on the shin bone to form the knee.",
    facts: [
      ["Joints", "The hip at the top and the knee at the bottom."],
      ["Shape", "Its neck angles inward, so the thigh bones slope from wide hips to knees that sit close together."],
      ["Good to know", "It can bear several times your body weight. Loading it with squats and walking keeps it dense."],
    ],
    muscles: ["quads", "hamstrings", "glutes", "hip-abductors", "adductors", "hip-flexors", "piriformis", "calves"],
    problem: {
      common: "Hip impingement: the neck of the bone pinches against the rim of the socket in deep bending.",
      warning: "Deep groin pain with a click or catch, or hip pain with a limp.",
    },
    care: "Squat only as deep as your hips allow without a pinch at the front.",
  },
  kneecap: {
    latin: "Patella",
    about:
      "A small bone that sits inside the quadriceps tendon. It slides in a groove at the end of the thigh bone and works as a pulley, giving the quads noticeably more leverage to straighten the knee.",
    facts: [
      ["Job", "Improves the quads' leverage and shields the front of the joint."],
      ["Tracking", "The quads and the tissues on either side keep it centered in its groove."],
      ["Good to know", "Pressure behind it is highest in deep knee bends under load."],
    ],
    muscles: ["quads"],
    problem: {
      common: "Runner's knee: an ache around or behind the kneecap, common when training increases quickly.",
      warning: "A kneecap that slips sideways, a swollen knee, or a knee that gives way.",
    },
    care: "Strong quads and hip muscles help it track. Build squat depth gradually.",
  },
  shin: {
    latin: "Tibia",
    about:
      "The main weight-bearing bone of the lower leg. Its flat top forms the lower half of the knee, and its lower end forms the inner ankle bone. Along the front it lies just under the skin.",
    facts: [
      ["Joints", "The knee at the top and the ankle at the bottom."],
      ["Landmark", "The bump just below the kneecap is where the quads attach, through the patellar ligament."],
      ["Good to know", "Bone grows stronger with loading, but only at its own pace."],
    ],
    muscles: ["quads", "hamstrings", "shins", "calves"],
    problem: {
      common: "Shin splints: an ache along the bone when running or jumping increases faster than the bone can adapt.",
      warning: "Pain at one small spot on the bone, or pain at rest, can be a stress fracture.",
    },
    care: "Increase running and jumping in small steps from week to week.",
  },
  fibula: {
    latin: "Fibula",
    about:
      "The slim bone on the outside of the lower leg. It carries little weight. Its job is to give muscles a place to attach and to form the outer ankle bone, which keeps the ankle from tipping.",
    facts: [
      ["Job", "An anchor for muscles and the outer wall of the ankle."],
      ["Landmark", "Its head can be felt just below the outside of the knee, where the peroneal nerve wraps around it."],
      ["Good to know", "The outer ankle bone sits lower than the inner one, which is why ankles roll inward far more easily than outward."],
    ],
    muscles: ["peroneals", "calves", "hamstrings"],
    problem: {
      common: "A break of the outer ankle bone in a bad ankle roll.",
      warning: "You cannot take four steps after rolling the ankle, or the bone itself is tender.",
    },
    care: "Balance training after a sprain lowers the chance of the next one.",
  },
  "foot-bones": {
    latin: "Tarsals, metatarsals and phalanges",
    about:
      "The foot has 26 bones arranged in arches, held up by ligaments, the plantar fascia and muscles. The arches flatten to absorb each landing and then stiffen so that you can push off.",
    facts: [
      ["Job", "A shock absorber on landing and a rigid lever on push-off."],
      ["Heel", "The heel bone is where the Achilles tendon attaches."],
      ["Good to know", "The small muscles of the foot respond to training like any others."],
    ],
    muscles: ["calves", "shins", "peroneals"],
    problem: {
      common: "Plantar fasciitis: pain under the heel, worst with the first steps in the morning.",
      warning: "Pain at one spot on top of the foot that worsens with activity can be a stress fracture.",
    },
    care: "Calf strength and gradual increases in walking or running protect the foot.",
  },

  // ------------------------------------------------------------------ ligaments
  "ac-ligament": {
    latin: "Acromioclavicular and coracoclavicular ligaments",
    about:
      "Short, strong bands that tie the outer end of the collarbone to the shoulder blade. Between them they hang the weight of the arm from the collarbone.",
    facts: [
      ["Connects", "The collarbone to the tip and the hook of the shoulder blade."],
      ["Stops", "The shoulder blade from dropping away from the collarbone."],
      ["Healing", "Mild sprains settle in a few weeks. Severe ones leave a permanent bump but often still work well."],
    ],
    muscles: ["traps", "shoulders"],
    problem: {
      common: "A separated shoulder: a sprain of these ligaments from a fall onto the point of the shoulder.",
      warning: "A step or bump on top of the shoulder after a fall.",
    },
    care: "Pain at the very top of the shoulder in dips or wide presses is a sign to narrow the grip or reduce the depth.",
  },
  "shoulder-capsule": {
    latin: "Glenohumeral ligaments",
    about:
      "A loose sleeve of ligaments around the shoulder joint. It is slack in most positions, which gives the shoulder its huge range, and it tightens only at the end of a movement.",
    facts: [
      ["Connects", "The rim of the socket to the neck of the upper arm bone."],
      ["Stops", "The ball from sliding out, mainly forward when the arm is raised and turned outward."],
      ["Healing", "A capsule stretched by a dislocation stays looser, so a second dislocation is more likely."],
    ],
    muscles: ["rotator-cuff", "shoulders"],
    problem: {
      common: "Instability after a dislocation. The opposite problem is a frozen shoulder, where the capsule thickens and stiffens.",
      warning: "A shoulder that slips or feels as if it will, or stiffness that steadily worsens.",
    },
    care: "Avoid forcing the arm far behind the body under load, and keep the rotator cuff strong.",
  },
  mcl: {
    latin: "Medial collateral ligament",
    about: "A broad band down the inner side of the knee, from the thigh bone to the shin bone. It is the knee ligament injured most often.",
    facts: [
      ["Connects", "The inner side of the thigh bone to the inner side of the shin bone."],
      ["Stops", "The knee from buckling inward."],
      ["Healing", "It has a good blood supply, so most sprains heal without surgery in a few weeks."],
    ],
    muscles: ["quads", "hamstrings", "adductors", "hip-abductors"],
    problem: {
      common: "A sprain from a blow to the outside of the knee, or from the knee collapsing inward.",
      warning: "Pain along the inner knee with swelling or a wobbly feeling.",
    },
    care: "Keep your knees tracking over your toes in squats, lunges and landings.",
  },
  lcl: {
    latin: "Lateral collateral ligament",
    about: "A cord on the outer side of the knee, from the thigh bone to the head of the fibula. You can feel it when you sit with one ankle on the other knee.",
    facts: [
      ["Connects", "The outer side of the thigh bone to the top of the fibula."],
      ["Stops", "The knee from bowing outward."],
      ["Healing", "It is injured less often than the inner ligament. A severe tear usually involves other structures too."],
    ],
    muscles: ["hamstrings", "quads", "hip-abductors"],
    problem: {
      common: "A sprain from a force that pushes the knee outward.",
      warning: "Outer knee pain with instability, or a weak foot after the injury.",
    },
    care: "Hip strength helps the knee stay in line on one leg.",
  },
  cruciates: {
    latin: "Anterior and posterior cruciate ligaments",
    about:
      "Two ligaments that cross inside the knee like an X. The front one, the ACL, is the most talked-about ligament in sport, because it tears without contact and takes a long time to come back from.",
    facts: [
      ["Connects", "The thigh bone to the shin bone, inside the joint."],
      ["Stops", "The front one stops the shin sliding forward and twisting. The back one stops it sliding backward."],
      ["Healing", "The front one has a poor blood supply and rarely heals on its own. Many active people need it rebuilt."],
    ],
    muscles: ["hamstrings", "quads", "glutes", "hip-abductors"],
    problem: {
      common: "ACL tear: usually with no contact at all, in a sudden stop, a pivot or an awkward landing.",
      warning: "A pop, swelling within a few hours, and a knee that gives way.",
    },
    care: "Strong hamstrings and glutes, and landing with the knees over the toes, lower the risk.",
  },
  "patellar-ligament": {
    latin: "Patellar ligament",
    about:
      "The thick band from the kneecap to the bump on the front of the shin. It is the last link in the chain that lets the quads straighten the knee, so it behaves like a tendon and is often called one.",
    facts: [
      ["Connects", "The kneecap to the shin bone."],
      ["Carries", "The full pull of the quads, which reaches several times body weight in a jump."],
      ["Healing", "It adapts slowly, and it responds best to gradual, heavy loading."],
    ],
    muscles: ["quads"],
    problem: {
      common: "Jumper's knee: pain just below the kneecap, from more jumping or squatting than the tissue is used to.",
      warning: "Sudden pain at the front of the knee and an inability to straighten the leg.",
    },
    care: "Slow, controlled squats and leg presses build its tolerance.",
  },
  "ankle-ligaments": {
    latin: "Lateral ankle ligaments",
    about:
      "Three bands that fan from the outer ankle bone to the foot. The one at the front is the most frequently sprained ligament in the body.",
    facts: [
      ["Connects", "The fibula to the ankle bone and the heel bone."],
      ["Stops", "The foot from rolling inward."],
      ["Healing", "Most sprains heal in weeks. Without balance work, though, many ankles stay prone to repeat sprains."],
    ],
    muscles: ["peroneals", "calves", "shins"],
    problem: {
      common: "Ankle sprain, from rolling over the outside of the foot.",
      warning: "You cannot take four steps, or the bone is tender to press. That needs an X-ray.",
    },
    care: "Single-leg balance drills after a sprain cut the risk of the next one.",
  },
  "deltoid-ligament": {
    latin: "Deltoid ligament",
    about: "A strong, fan-shaped ligament on the inner side of the ankle. It is so strong that the bone often breaks before it tears.",
    facts: [
      ["Connects", "The inner ankle bone to three bones of the foot."],
      ["Stops", "The foot from rolling outward, and it helps hold up the arch."],
      ["Healing", "It is rarely injured alone. When it is, the force was large."],
    ],
    muscles: ["calves", "shins"],
    problem: {
      common: "A sprain when the foot is forced outward, often together with a break of the outer ankle bone.",
      warning: "Inner ankle pain and swelling after a twist.",
    },
    care: "The same balance work that protects the outer ankle helps here too.",
  },

  // ------------------------------------------------------------------ nerves
  "nerve-roots": {
    latin: "Spinal nerve roots",
    about:
      "Thirty-one pairs of nerves leave the spinal cord, one pair between each two vertebrae. Each pair carries movement signals out, and feeling back in, for one strip of the body.",
    facts: [
      ["Comes from", "The spinal cord, inside the canal of the spine."],
      ["Path", "Out through a small opening beside each disc."],
      ["Good to know", "Each root serves a known strip of skin and set of muscles, so where symptoms appear points to which root is irritated."],
    ],
    muscles: ["lower-back", "deep-core"],
    problem: {
      common: "A pinched root, from a bulging disc or a narrowed opening: pain, tingling or weakness along that nerve's strip.",
      warning: "Weakness, numbness between the legs, or bladder or bowel changes need emergency care.",
    },
    care: "Most pinched roots settle with time and gentle activity.",
  },
  "brachial-plexus": {
    latin: "Brachial plexus",
    about:
      "A network formed by five nerve roots from the lower neck. They merge and split again, so each nerve of the arm ends up carrying fibers from several roots.",
    facts: [
      ["Comes from", "The lowest four neck roots and the first chest root."],
      ["Path", "Between the neck muscles, over the first rib, under the collarbone and into the armpit."],
      ["Good to know", "A stinger in contact sports is a brief stretch of this network."],
    ],
    muscles: ["chest", "lats", "serratus", "rhomboids", "rotator-cuff", "shoulders", "biceps", "triceps", "forearms"],
    problem: {
      common: "Squeezing between the collarbone and the first rib, or a stretch when the head and shoulder are forced apart.",
      warning: "Arm weakness or numbness that does not clear within minutes of a blow to the neck or shoulder.",
    },
    care: "Heavy straps or bags pressing on top of the shoulder can irritate it.",
  },
  "axillary-nerve": {
    latin: "Axillary nerve",
    about: "A short nerve that hooks around the top of the upper arm bone, just under the shoulder joint, to reach the shoulder muscle.",
    facts: [
      ["Comes from", "The rear part of the brachial plexus."],
      ["Path", "Backward through a gap below the shoulder joint, then around the neck of the arm bone."],
      ["Feeling", "A patch of skin on the outer shoulder, about where a badge would sit."],
    ],
    muscles: ["shoulders", "rotator-cuff"],
    problem: {
      common: "It can be stretched when the shoulder dislocates.",
      warning: "A numb patch on the outer shoulder with weakness lifting the arm, after an injury.",
    },
    care: "It usually recovers on its own over weeks to months.",
  },
  "musculocutaneous-nerve": {
    latin: "Musculocutaneous nerve",
    about: "The nerve of the front of the upper arm. After it has supplied the elbow-bending muscles, it carries on as a skin nerve down the forearm.",
    facts: [
      ["Comes from", "The outer part of the brachial plexus."],
      ["Path", "Through the front of the upper arm, between the biceps and the brachialis."],
      ["Feeling", "The outer side of the forearm."],
    ],
    muscles: ["biceps"],
    problem: {
      common: "It is rarely pinched. Very heavy curling can irritate it and cause tingling down the outer forearm.",
      warning: "Clear weakness when bending the elbow.",
    },
    care: "Ease off curling volume if the outer forearm tingles.",
  },
  "median-nerve": {
    latin: "Median nerve",
    about:
      "The main nerve of the gripping side of the forearm and of the thumb side of the hand. It reaches the hand through a tight tunnel at the wrist.",
    facts: [
      ["Comes from", "Both the outer and the inner parts of the brachial plexus."],
      ["Path", "Down the inner arm, across the front of the elbow, through the middle of the forearm and the wrist tunnel."],
      ["Feeling", "The palm side of the thumb, the index and middle fingers, and half of the ring finger."],
    ],
    muscles: ["forearms"],
    problem: {
      common: "Carpal tunnel syndrome: the nerve is squeezed in the wrist tunnel.",
      warning: "Numbness in the thumb and first fingers at night, or dropping things.",
    },
    care: "Keep the wrists close to straight when gripping and pressing.",
  },
  "ulnar-nerve": {
    latin: "Ulnar nerve",
    about:
      "The nerve of the little-finger side of the hand. At the elbow it runs in a shallow groove with only skin over it, which is why a knock there sends a jolt down the forearm.",
    facts: [
      ["Comes from", "The inner part of the brachial plexus."],
      ["Path", "Behind the inner elbow, then down the little-finger side of the forearm into the hand."],
      ["Feeling", "The little finger and half of the ring finger."],
    ],
    muscles: ["forearms"],
    problem: {
      common: "Irritation at the elbow, from leaning on it or keeping it bent for long periods.",
      warning: "A little finger that stays numb, or a hand that becomes clumsy.",
    },
    care: "Avoid resting your elbows on hard edges.",
  },
  "radial-nerve": {
    latin: "Radial nerve",
    about: "The nerve of the whole back of the arm. It straightens the elbow, the wrist and the fingers.",
    facts: [
      ["Comes from", "The rear part of the brachial plexus."],
      ["Path", "It spirals around the back of the upper arm bone and splits in two at the elbow."],
      ["Feeling", "The back of the hand on the thumb side."],
    ],
    muscles: ["triceps", "forearms"],
    problem: {
      common: "Pressure against the bone, for example from sleeping with the arm draped over a chair back.",
      warning: "Wrist drop: you cannot lift the wrist or straighten the fingers.",
    },
    care: "Pressure cases usually recover fully within weeks.",
  },
  "intercostal-nerves": {
    latin: "Intercostal nerves",
    about:
      "One nerve runs in a groove under each rib, alongside an artery and a vein. The lower ones carry on past the ribs into the abdominal wall.",
    facts: [
      ["Comes from", "The twelve nerve roots of the upper back."],
      ["Path", "Around the chest wall under each rib, from the spine to the front."],
      ["Feeling", "Bands of skin around the chest and the abdomen."],
    ],
    muscles: ["abs", "obliques", "deep-core"],
    problem: {
      common: "An irritated nerve gives a band of sharp pain around one side of the chest. Shingles follows one of these nerves.",
      warning: "Chest pain with breathlessness needs an urgent check.",
    },
    care: "A rib strain usually irritates the nerve beside it, and both settle together.",
  },
  "lumbar-plexus": {
    latin: "Lumbar plexus",
    about: "A network formed by the first four nerve roots of the lower back. It takes shape inside the deep hip flexor muscle, beside the spine.",
    facts: [
      ["Comes from", "The first four lower-back roots."],
      ["Path", "Through the psoas muscle on the back wall of the abdomen."],
      ["Branches", "The femoral nerve to the front of the thigh and the obturator nerve to the inner thigh."],
    ],
    muscles: ["hip-flexors", "quads", "adductors"],
    problem: {
      common: "Disc problems high in the lower back send pain to the front of the thigh instead of down the back of the leg.",
      warning: "A weak thigh, or a knee that buckles.",
    },
    care: "Front-of-thigh pain with back pain is worth mentioning to a professional.",
  },
  "sacral-plexus": {
    latin: "Sacral plexus",
    about: "A network formed by the lowest nerve roots. It lies on the piriformis at the back of the pelvis, and most of it gathers into the sciatic nerve.",
    facts: [
      ["Comes from", "The last two lower-back roots and the first three of the sacrum."],
      ["Path", "Down the back wall of the pelvis and out through a notch in the hip bone."],
      ["Branches", "The sciatic nerve and the two nerves that work the glutes."],
    ],
    muscles: ["glutes", "hip-abductors", "piriformis", "hamstrings", "calves"],
    problem: {
      common: "Bulging discs low in the back press on the roots that feed it. That is the usual cause of sciatica.",
      warning: "Numbness between the legs, or bladder or bowel changes, need emergency care.",
    },
    care: "Strong glutes and a mobile hip take strain off this region.",
  },
  "femoral-nerve": {
    latin: "Femoral nerve",
    about: "The nerve of the front of the thigh. It enters the leg at the groin, beside the main artery, and fans out into branches almost at once.",
    facts: [
      ["Comes from", "The lumbar plexus."],
      ["Path", "Under the groin ligament, then a fan of branches to the muscles."],
      ["Feeling", "The front of the thigh and, through its longest branch, the inner side of the leg."],
    ],
    muscles: ["quads", "hip-flexors"],
    problem: {
      common: "It is seldom pinched. When it is, the thigh feels weak and climbing stairs becomes hard.",
      warning: "A knee that gives way, with numbness on the front of the thigh.",
    },
    care: "Lasting weakness in the thigh is a reason to be examined.",
  },
  "saphenous-nerve": {
    latin: "Saphenous nerve",
    about: "The longest branch of the femoral nerve. It works no muscles at all. It only carries feeling from the inner side of the knee, shin and ankle.",
    facts: [
      ["Comes from", "The femoral nerve, in the thigh."],
      ["Path", "Down the inner thigh, past the inner knee and along the shin to the ankle."],
      ["Feeling", "The inner side of the knee, lower leg and ankle."],
    ],
    muscles: [],
    problem: {
      common: "Irritation near the inner knee gives a burning or numb strip down the inner shin.",
      warning: "Numbness that spreads or comes with weakness.",
    },
    care: "Pads or straps that press hard on the inner knee can provoke it.",
  },
  "obturator-nerve": {
    latin: "Obturator nerve",
    about: "The nerve of the inner thigh. It leaves the pelvis through an opening in the hip bone to reach the muscles that pull the legs together.",
    facts: [
      ["Comes from", "The lumbar plexus."],
      ["Path", "Down the side wall of the pelvis and through an opening in the hip bone."],
      ["Feeling", "A small patch of skin on the inner thigh."],
    ],
    muscles: ["adductors"],
    problem: {
      common: "It can be pinched in the groin in athletes, giving a deep inner-thigh ache that comes on with exercise.",
      warning: "Groin pain that keeps returning with activity and does not behave like a strain.",
    },
    care: "A groin strain that will not heal deserves a second look.",
  },
  sciatic: {
    latin: "Sciatic nerve",
    about:
      "The largest nerve in the body, as wide as a thumb where it begins. It is really two nerves in one sheath, and between them they work the hamstrings and nearly everything below the knee.",
    facts: [
      ["Comes from", "The sacral plexus."],
      ["Path", "Under the piriformis, down the back of the thigh between the hamstrings, dividing above the knee."],
      ["Feeling", "Through its branches, most of the lower leg and the foot."],
    ],
    muscles: ["hamstrings", "calves", "shins", "peroneals", "adductors"],
    problem: {
      common: "Sciatica: pain running from the buttock down the back of the leg. A disc pressing on a root is the usual cause, and a tight piriformis is an occasional one.",
      warning: "Leg weakness, a foot that drags, numbness between the legs, or bladder or bowel changes.",
    },
    care: "Most sciatica eases within weeks. Staying gently active helps more than bed rest.",
  },
  "tibial-nerve": {
    latin: "Tibial nerve",
    about: "The larger of the sciatic nerve's two branches. It works the calf muscles and ends in the sole of the foot.",
    facts: [
      ["Comes from", "The sciatic nerve, just above the knee."],
      ["Path", "Down the middle of the calf, behind the inner ankle bone and into the sole."],
      ["Feeling", "The sole of the foot."],
    ],
    muscles: ["calves"],
    problem: {
      common: "Squeezing in the tunnel behind the inner ankle bone gives burning or tingling in the sole.",
      warning: "Numbness in the sole that does not pass.",
    },
    care: "Shoes that fit well around the ankle and arch reduce pressure on it.",
  },
  "peroneal-nerve": {
    latin: "Common peroneal (fibular) nerve",
    about:
      "The smaller branch of the sciatic nerve. It winds around the outside of the knee with only skin over it, which makes it the most easily injured nerve in the leg.",
    facts: [
      ["Comes from", "The sciatic nerve, just above the knee."],
      ["Path", "Around the head of the fibula, then one branch to the front of the shin and one to the outer side."],
      ["Feeling", "The top of the foot and the outer shin."],
    ],
    muscles: ["shins", "peroneals"],
    problem: {
      common: "Pressure at the outer knee, from crossing the legs for long periods or from a tight brace or strap.",
      warning: "Foot drop: the toes catch on the ground when you walk.",
    },
    care: "Avoid tight straps just below the outside of the knee.",
  },

  // ------------------------------------------------------------------ fascia and tendons
  "rectus-sheath": {
    latin: "Rectus sheath and linea alba",
    about:
      "An envelope of flat tendon around the abs. The muscles of the side of the abdomen do not reach bone at the front. They attach to this sheath, and the two halves meet in the middle at the linea alba.",
    facts: [
      ["Made from", "The flat tendons of the obliques and the deep abdominal muscle."],
      ["Job", "Holds the abs in place and lets the side muscles pull on the front of the trunk."],
      ["Good to know", "The pale lines that cut the six-pack into blocks are bands of this same tissue."],
    ],
    muscles: ["abs", "obliques", "deep-core"],
    problem: {
      common: "A hernia: the abdominal lining pushes through a weak spot, most often at the navel or the groin.",
      warning: "A bulge that appears when you strain. A painful bulge that will not go back in is urgent.",
    },
    care: "Breathe out on the effort, and build up core loads gradually.",
  },
  "lumbar-fascia": {
    latin: "Thoracolumbar fascia",
    about:
      "A strong, layered sheet of connective tissue over the lower back. Muscles of the back, the trunk, the hips and the arms all attach to it, which makes it a crossing point for force between the upper and the lower body.",
    facts: [
      ["Layers", "It wraps the muscles of the back like a sleeve."],
      ["Links", "Each lat to the glute on the opposite side."],
      ["Job", "It stiffens the lower back when the muscles around it tighten."],
    ],
    muscles: ["lats", "glutes", "lower-back", "obliques", "deep-core"],
    problem: {
      common: "It is rich in nerve endings and is one of the tissues that can feel stiff and sore in everyday low back ache.",
      warning: "Back pain with leg numbness, leg weakness, or bladder or bowel changes.",
    },
    care: "Hinges, rows and loaded carries all strengthen the muscles that tension it.",
  },
  "triceps-tendon": {
    latin: "Triceps tendon",
    about: "The broad, flat tendon where all three heads of the triceps come together before they attach to the point of the elbow.",
    facts: [
      ["Connects", "The triceps to the point of the elbow."],
      ["Job", "Carries the force that straightens the elbow in every push."],
      ["Good to know", "Like all tendons, it strengthens more slowly than the muscle it serves."],
    ],
    muscles: ["triceps"],
    problem: {
      common: "Tendon irritation at the back of the elbow, from heavy presses, dips or extensions.",
      warning: "Sudden pain at the back of the elbow and a loss of the ability to straighten the arm.",
    },
    care: "Increase pressing loads in small steps, and warm the elbows up with lighter sets.",
  },
  achilles: {
    latin: "Calcaneal tendon",
    about:
      "The thickest and strongest tendon in the body. It joins both calf muscles to the heel bone and works as a spring, stretching as the foot lands and giving the energy back as you push off.",
    facts: [
      ["Connects", "The calf muscles to the heel bone."],
      ["Carries", "Several times your body weight with every running step."],
      ["Healing", "Its middle section has a modest blood supply, so it adapts and heals slowly."],
    ],
    muscles: ["calves"],
    problem: {
      common: "Achilles tendon pain: stiffness and soreness a few centimeters above the heel, worst in the morning, from more running or jumping than the tendon has adapted to.",
      warning: "A snap at the back of the ankle, like being kicked, followed by trouble rising onto your toes.",
    },
    care: "Slow, heavy calf raises are the best-supported way to strengthen it.",
  },

  // ------------------------------------------------------------------ joints
  "shoulder-joint": {
    latin: "Glenohumeral joint",
    about:
      "The ball of the upper arm bone rests against a socket on the shoulder blade that is about as shallow as a saucer. That is why the arm can reach in almost every direction, and also why the shoulder relies on muscle, not bone, to stay in place.",
    facts: [
      ["Type", "Ball and socket."],
      ["Range", "About 180 degrees forward and overhead, 180 degrees out to the side, and 90 degrees of rotation each way. The shoulder blade supplies roughly a third of every overhead reach."],
      ["Held by", "The rotator cuff, a loose capsule of ligaments and a rim of cartilage that deepens the socket."],
    ],
    muscles: ["shoulders", "rotator-cuff", "chest", "lats", "biceps", "triceps"],
    related: ["humerus", "scapula", "shoulder-capsule", "ac-ligament", "axillary-nerve"],
    motion: "shoulder",
    problem: {
      common: "Pinching at the top of the joint when the arm is raised, often from a tired rotator cuff or poor control of the shoulder blade.",
      warning: "A shoulder that slips, locks, or cannot be lifted after a fall.",
    },
    care: "Train pulling as much as pushing, and include rotator cuff work every week.",
  },
  "elbow-joint": {
    latin: "Humeroulnar and radioulnar joints",
    about:
      "Two joints share one capsule. The ulna grips the end of the upper arm bone like a wrench on a bolt, which makes a true hinge. Beside it, the head of the radius spins in a ring of ligament so that the palm can turn up and down.",
    facts: [
      ["Type", "A hinge, with a pivot beside it."],
      ["Range", "From straight to about 145 degrees of bend, and about 80 degrees of turn each way for the palm."],
      ["Held by", "The close fit of the bones and a strong ligament on each side."],
    ],
    muscles: ["biceps", "triceps", "forearms"],
    related: ["humerus", "forearm-bones", "triceps-tendon", "ulnar-nerve", "brachial-artery"],
    motion: "elbow",
    problem: {
      common: "Tennis elbow and golfer's elbow: sore tendons on the outer or inner side, where the forearm muscles attach.",
      warning: "An elbow that cannot fully straighten after a fall, or one that locks.",
    },
    care: "Build up gripping and pulling volume gradually. The tendons adapt more slowly than the muscles.",
  },
  "hip-joint": {
    latin: "Acetabulofemoral joint",
    about:
      "The ball at the top of the thigh bone sits deep inside a socket in the pelvis, sealed by a rim of cartilage. It gives up some of the shoulder's freedom in exchange for the strength to carry several times your body weight.",
    facts: [
      ["Type", "Ball and socket."],
      ["Range", "About 120 degrees of bend, 20 degrees of reach behind you, 45 degrees out to the side and 40 degrees of rotation each way."],
      ["Held by", "The depth of the socket and three of the strongest ligaments in the body."],
    ],
    muscles: ["glutes", "hip-flexors", "hip-abductors", "adductors", "piriformis", "hamstrings", "quads"],
    related: ["pelvis", "femur", "sciatic", "femoral-artery"],
    motion: "hip",
    problem: {
      common: "A pinch at the front of the hip in deep squats, from the neck of the thigh bone meeting the rim of the socket.",
      warning: "Deep groin pain with clicking or catching, or pain that makes you limp.",
    },
    care: "Find the squat stance and depth that your own hips allow. Sockets differ a lot between people.",
  },
  "knee-joint": {
    latin: "Tibiofemoral and patellofemoral joints",
    about:
      "The rounded ends of the thigh bone rest on the nearly flat top of the shin bone, so the shape of the bones gives little stability. Four ligaments, two pads of cartilage called menisci and the muscles around the joint do that work. The kneecap forms a second joint at the front.",
    facts: [
      ["Type", "A hinge that also allows a little rotation when it is bent."],
      ["Range", "From straight to about 140 degrees of bend."],
      ["Held by", "The two cruciate ligaments inside, a collateral ligament on each side, the menisci and the quads."],
    ],
    muscles: ["quads", "hamstrings", "calves", "adductors"],
    related: ["femur", "shin", "kneecap", "cruciates", "mcl", "lcl", "patellar-ligament", "popliteal-artery"],
    motion: "knee",
    problem: {
      common: "A meniscus tear, from twisting on a bent, loaded knee. It causes pain along the joint line and sometimes catching.",
      warning: "A knee that locks, gives way, or swells within hours of an injury.",
    },
    care: "Keep the knees in line with the toes, and strengthen the quads, hamstrings and hips together.",
  },
  "ankle-joint": {
    latin: "Talocrural joint",
    about:
      "The ends of the shin bone and the fibula form a bracket around the top bone of the foot. The joint mainly moves the foot up and down. The tilting of the foot from side to side happens in the joint just below it.",
    facts: [
      ["Type", "Hinge."],
      ["Range", "About 20 degrees of pulling the foot up and 50 degrees of pointing it down."],
      ["Held by", "The bony bracket, three ligaments on the outer side and one broad ligament on the inner side."],
    ],
    muscles: ["calves", "shins", "peroneals"],
    related: ["shin", "fibula", "foot-bones", "ankle-ligaments", "deltoid-ligament", "achilles", "tibial-arteries"],
    problem: {
      common: "An ankle sprain. A stiff ankle is the other common issue, and it limits how deep you can squat with your heels down.",
      warning: "You cannot take four steps after a twist, or the bone is tender to press.",
    },
    care: "Calf stretches and slow calf raises through the full range keep it mobile and strong.",
  },

  // ------------------------------------------------------------------ heart and vessels
  heart: {
    latin: "Cor",
    about:
      "The heart is a hollow muscle with four chambers. The right side sends blood to the lungs to pick up oxygen, and the left side sends that blood to the rest of the body. Unlike the muscles you train with weights, it never rests.",
    facts: [
      ["At rest", "It beats 60 to 80 times a minute in most adults and pumps about five liters of blood each minute."],
      ["In training", "It can pump four to five times as much. Working muscles receive most of the increase."],
      ["Good to know", "It adapts to training like any muscle. Regular exercise makes each beat stronger, so the resting pulse drops."],
    ],
    muscles: [],
    related: ["aorta", "vena-cava", "ribs", "breastbone"],
    problem: {
      common: "A racing pulse and breathlessness during hard sets are normal, and they settle within a few minutes of rest.",
      warning: "Chest pain or pressure, fainting, or a heartbeat that feels irregular during exercise. Stop and get medical help.",
    },
    care: "Add some steady walking, cycling or rowing to your week. Breathe out on the effort instead of holding your breath.",
  },
  aorta: {
    latin: "Aorta",
    about:
      "The largest artery in the body, about as wide as a garden hose. It leaves the top of the heart, arches backward and then runs down in front of the spine, giving off branches to everything on the way.",
    facts: [
      ["Comes from", "The left side of the heart."],
      ["Path", "Up, over in an arch, then down through the chest and the abdomen. It divides in two at the level of the navel."],
      ["Branches", "To the head and the arms from the arch, then to the ribs, the organs and the muscles of the back and the abdomen."],
    ],
    muscles: ["obliques", "lower-back", "deep-core"],
    related: ["heart", "carotid-artery", "subclavian-artery", "iliac-artery"],
    problem: {
      common: "Holding your breath and straining through a heavy lift pushes blood pressure very high for a moment.",
      warning: "Sudden, severe pain in the chest or back, sometimes described as tearing, is an emergency.",
    },
    care: "If you have high blood pressure, ask a doctor about heavy lifting, and avoid long breath holds.",
  },
  "carotid-artery": {
    latin: "Common carotid artery",
    about:
      "One on each side of the neck, beside the windpipe. Between them they carry most of the blood supply of the brain and the face.",
    facts: [
      ["Comes from", "The arch of the aorta."],
      ["Path", "Up the neck under the long neck muscle. It divides at the level of the Adam's apple."],
      ["Pulse", "Easy to find with two fingers in the groove beside the windpipe."],
    ],
    muscles: ["neck"],
    related: ["aorta", "jugular-vein"],
    problem: {
      common: "Pressing hard on it, or on both sides at once, can slow the heart and make you light-headed.",
      warning: "Sudden weakness of the face or an arm, slurred speech or loss of vision is an emergency.",
    },
    care: "When you check your pulse at the neck, press lightly and on one side only.",
  },
  "subclavian-artery": {
    latin: "Subclavian and axillary arteries",
    about:
      "The artery of the whole arm. It crosses the first rib, slips under the collarbone and passes through the armpit, where it changes its name to the axillary artery. The nerves of the arm travel wrapped around it.",
    facts: [
      ["Comes from", "The arch of the aorta."],
      ["Path", "Between the neck muscles, over the first rib, under the collarbone and through the armpit."],
      ["Branches", "To the chest, the shoulder blade, the rotator cuff, the lats and the shoulder muscle."],
    ],
    muscles: ["chest", "shoulders", "lats", "traps", "rotator-cuff", "serratus", "rhomboids"],
    related: ["aorta", "brachial-artery", "brachial-plexus", "collarbone"],
    problem: {
      common: "It can be squeezed in the narrow gap between the collarbone and the first rib, along with the nerves.",
      warning: "An arm that turns pale, cold or heavy when it is raised, or that tingles in overhead positions.",
    },
    care: "If overhead work makes a hand go numb or cold, stop that movement and have it checked.",
  },
  "brachial-artery": {
    latin: "Brachial artery",
    about:
      "The continuation of the artery of the armpit. It runs down the inner side of the upper arm, in the groove between the biceps and the triceps, alongside the median nerve.",
    facts: [
      ["Comes from", "The axillary artery, at the lower edge of the armpit."],
      ["Path", "Down the inner arm to the front of the elbow, where it divides in two."],
      ["Pulse", "On the inner side of the biceps tendon at the elbow. A blood pressure cuff listens to this artery."],
    ],
    muscles: ["biceps", "triceps"],
    related: ["subclavian-artery", "forearm-arteries", "median-nerve", "humerus"],
    problem: {
      common: "A hard edge pressed into the inner arm can compress it, along with the nerves beside it.",
      warning: "A hand that goes pale, cold or numb.",
    },
    care: "The tight, full feeling in the arms after curls is extra blood in the muscle. It fades within an hour.",
  },
  "forearm-arteries": {
    latin: "Radial and ulnar arteries",
    about:
      "The brachial artery divides at the elbow. The radial artery runs down the thumb side of the forearm and the ulnar artery down the little-finger side. They join again in two arches in the palm.",
    facts: [
      ["Comes from", "The brachial artery, at the front of the elbow."],
      ["Path", "One down each side of the forearm, meeting in the palm."],
      ["Pulse", "The radial pulse, on the thumb side of the wrist, is the one most people use to count their heart rate."],
    ],
    muscles: ["forearms"],
    related: ["brachial-artery", "hand-bones", "median-nerve", "ulnar-nerve"],
    problem: {
      common: "Wrist wraps or straps pulled too tight can cut down the flow to the hand.",
      warning: "Fingers that turn white or blue, or stay numb after the wraps come off.",
    },
    care: "Count your pulse here for 15 seconds and multiply by four to get beats per minute.",
  },
  "iliac-artery": {
    latin: "Common, internal and external iliac arteries",
    about:
      "At the level of the navel the aorta divides into two iliac arteries. Each divides again: the outer branch carries on to the leg, and the inner branch dives into the pelvis to feed the glutes and the hip.",
    facts: [
      ["Comes from", "The lower end of the aorta."],
      ["Path", "Along the inner rim of the pelvis to the groin."],
      ["Branches", "The gluteal arteries to the buttock, and an artery that runs up behind the abs."],
    ],
    muscles: ["glutes", "hip-abductors", "piriformis", "abs", "hip-flexors"],
    related: ["aorta", "femoral-artery", "pelvis"],
    problem: {
      common: "In some endurance cyclists the artery narrows where the hip bends sharply for hours at a time.",
      warning: "One leg that feels weak or cramped at high effort and recovers quickly with rest.",
    },
    care: "This is rare. For most people, regular exercise is the best thing for these arteries.",
  },
  "femoral-artery": {
    latin: "Femoral artery",
    about:
      "The outer iliac artery is renamed as it passes under the crease of the groin. It runs down the front of the thigh, then slips through a gap in the inner-thigh muscles to reach the back of the knee.",
    facts: [
      ["Comes from", "The external iliac artery, at the groin."],
      ["Path", "Down the front and inner side of the thigh, then through to the back above the knee."],
      ["Branches", "The deep artery of the thigh, which feeds the hamstrings and most of the thigh."],
    ],
    muscles: ["quads", "hamstrings", "adductors", "hip-flexors"],
    related: ["iliac-artery", "popliteal-artery", "femoral-nerve", "femoral-vein", "femur"],
    problem: {
      common: "It lies close to the skin at the groin, so a deep cut there bleeds heavily.",
      warning: "Calf or thigh pain that comes on with walking and stops with rest, in an older adult or a smoker.",
    },
    care: "Its pulse can be felt halfway along the crease of the groin.",
  },
  "popliteal-artery": {
    latin: "Popliteal artery",
    about:
      "The femoral artery under a new name, once it has reached the hollow behind the knee. It lies deep there, against the back of the joint, and then divides into the arteries of the lower leg.",
    facts: [
      ["Comes from", "The femoral artery, above the knee."],
      ["Path", "Straight down through the hollow at the back of the knee."],
      ["Branches", "A ring of small arteries around the knee, branches to the calf muscles, then the two tibial arteries."],
    ],
    muscles: ["calves", "hamstrings"],
    related: ["femoral-artery", "tibial-arteries", "knee-joint", "tibial-nerve"],
    problem: {
      common: "Sitting for a long time with the knees bent sharply can slow the flow and leave the lower legs heavy.",
      warning: "A cold, pale or numb foot after a knee injury is an emergency.",
    },
    care: "On a leg machine, set the pad so that it does not press into the back of the knee.",
  },
  "tibial-arteries": {
    latin: "Anterior and posterior tibial arteries",
    about:
      "The two arteries of the lower leg. One passes to the front and runs down beside the shin muscles to the top of the foot. The other runs down the back, deep to the calf, and curls behind the inner ankle bone into the sole.",
    facts: [
      ["Comes from", "The popliteal artery, just below the knee."],
      ["Path", "One down the front of the leg, one down the back."],
      ["Pulse", "On top of the foot, and in the hollow behind the inner ankle bone."],
    ],
    muscles: ["calves", "shins", "peroneals"],
    related: ["popliteal-artery", "shin", "ankle-joint", "tibial-nerve"],
    problem: {
      common: "The front shin muscles sit in a tight sleeve of fascia. In some runners, the pressure in that sleeve rises with exercise and squeezes the vessels.",
      warning: "Tight, painful shins with a numb foot that ease only when you stop.",
    },
    care: "Increase running distance gradually, and loosen laces that press on the top of the foot.",
  },
  "vena-cava": {
    latin: "Superior and inferior vena cava",
    about:
      "The two largest veins. The upper one collects blood from the head and the arms, and the lower one from the abdomen and the legs. Both empty into the right side of the heart.",
    facts: [
      ["Drains", "The whole body except the lungs."],
      ["Path", "The lower one climbs along the right side of the spine. The upper one drops straight down behind the breastbone."],
      ["Good to know", "Veins have thin walls and low pressure. Blood is pushed up from the legs mainly by the leg muscles squeezing them."],
    ],
    muscles: [],
    related: ["heart", "aorta", "femoral-vein", "jugular-vein"],
    problem: {
      common: "Bearing down hard with a held breath squeezes this vein, so less blood returns to the heart. That is why people sometimes feel faint after a maximal lift.",
      warning: "Fainting during or after a lift.",
    },
    care: "Breathe out through the hardest part of each rep, and do not stand up fast after heavy leg work.",
  },
  "jugular-vein": {
    latin: "Internal jugular vein",
    about:
      "The main vein of the head and the neck. It runs beside the carotid artery and joins the vein of the arm behind the inner end of the collarbone.",
    facts: [
      ["Drains", "The brain, the face and the neck."],
      ["Path", "Straight down the side of the neck, under the long neck muscle."],
      ["Good to know", "A smaller jugular vein lies just under the skin. It is the one that stands out when you strain."],
    ],
    muscles: ["neck"],
    related: ["carotid-artery", "vena-cava", "arm-veins"],
    problem: {
      common: "Neck veins that bulge during a hard effort are normal. They flatten again when you breathe out.",
      warning: "Neck veins that stay swollen at rest while you are sitting up.",
    },
    care: "A red face and standing veins are a sign to breathe out, not to push harder.",
  },
  "arm-veins": {
    latin: "Cephalic, basilic and subclavian veins",
    about:
      "The arm has deep veins beside its arteries and two long veins under the skin. The cephalic vein runs up the outer side and through the groove between the shoulder muscle and the chest. The basilic vein runs up the inner side. All of them join the deep vein under the collarbone.",
    facts: [
      ["Drains", "The hand, the forearm and the upper arm."],
      ["Path", "Up both sides of the arm, joining under the collarbone."],
      ["Good to know", "Blood samples are usually taken from the vein that links these two at the front of the elbow."],
    ],
    muscles: ["biceps", "forearms", "shoulders"],
    related: ["jugular-vein", "vena-cava", "brachial-artery"],
    problem: {
      common: "Veins that stand out during and after training are normal. Working muscle swells and pushes them toward the skin.",
      warning: "One whole arm that becomes swollen, heavy and bluish, sometimes after hard overhead or pulling work.",
    },
    care: "How visible your veins are depends mostly on body fat and warmth. It says little about fitness.",
  },
  "femoral-vein": {
    latin: "Femoral and iliac veins",
    about:
      "The deep vein of the leg. It runs with the femoral artery on its inner side, collects the long vein from under the skin at the groin, and carries on through the pelvis to the lower vena cava.",
    facts: [
      ["Drains", "The whole leg."],
      ["Path", "From behind the knee, up the inner thigh to the groin."],
      ["Good to know", "One-way valves stop the blood falling back. The calf squeezes it upward with every step."],
    ],
    muscles: ["quads", "hamstrings", "adductors", "calves"],
    related: ["femoral-artery", "saphenous-vein", "vena-cava"],
    problem: {
      common: "A clot in a deep leg vein. The risk rises with long periods of sitting still, such as a long flight, or with time in a cast.",
      warning: "One calf or one whole leg that becomes swollen, warm and painful. Add chest pain or breathlessness and it is an emergency.",
    },
    care: "On long trips, walk every hour or two and pump your ankles while you sit.",
  },
  "saphenous-vein": {
    latin: "Great saphenous vein",
    about:
      "The longest vein in the body. It starts on the inner side of the foot, passes in front of the inner ankle bone and runs up the inner leg just under the skin, to join the deep vein at the groin.",
    facts: [
      ["Drains", "The skin and the surface tissues of the leg."],
      ["Path", "Inner ankle, inner calf, inner knee, inner thigh, groin."],
      ["Good to know", "Surgeons often borrow a length of it to bypass blocked arteries of the heart."],
    ],
    muscles: [],
    related: ["femoral-vein", "saphenous-nerve"],
    problem: {
      common: "Varicose veins. When the valves weaken, blood pools and the vein widens and twists.",
      warning: "A hard, red, tender cord along the vein.",
    },
    care: "Walking and calf raises work the pump that empties the leg veins.",
  },
};
