/*
 * Health and body-awareness details for each muscle group, keyed by the ids in muscles.js.
 *
 * supply    nerve and blood supply, one plain line each
 *           see: optional id from LANDMARKS (tissue.js) of a nerve drawn on the model
 * feel      a touch test: where to put your fingers and what to do to feel the muscle work
 * soreness  peak and lasts are typical for a beginner's first sessions; tell is how you notice it
 * injury    the common problem in plain words, and the sign that it needs a professional
 *
 * This is general education, not diagnosis. Wording stays cautious on purpose.
 */

export const SORENESS_NOTE =
  "Soreness that starts a day after training and fades within a week is normal, and it gets milder after the first few sessions. Pain during an exercise, sharp pain, or swelling is something else.";

export const CARE = {
  chest: {
    supply: {
      nerve: "The pectoral nerves, two branches of the brachial plexus.",
      blood: "A branch of the artery that runs under the collarbone (thoracoacromial artery).",
      see: "brachial-plexus",
    },
    feel: "Lay one hand flat on the opposite side of your chest. Press the other palm hard against a wall in front of you. The muscle hardens under your hand.",
    soreness: { peak: "Day 2", lasts: "3 to 4 days", tell: "Pushing a door open or reaching across your body feels tight." },
    injury: {
      common: "Pec strain: a pull at the front of the armpit, usually from lowering a press too deep or too heavy.",
      warning: "A sudden tearing feeling, bruising down the arm or a change in the shape of the chest needs a doctor quickly.",
    },
  },
  shoulders: {
    supply: {
      nerve: "The axillary nerve, which hooks around the top of the arm bone.",
      blood: "The arteries that circle the top of the arm bone (circumflex humeral arteries).",
      see: "axillary-nerve",
    },
    feel: "Rest your fingers on the side of your shoulder cap, then raise that arm out to the side. It tightens within the first few centimeters.",
    soreness: { peak: "Day 1 to 2", lasts: "2 to 3 days", tell: "Lifting your arms to wash your hair." },
    injury: {
      common: "Shoulder impingement: a pinch at the front or top of the shoulder when you lift the arm, often from a lot of pressing and little pulling.",
      warning: "Pain that wakes you at night, or weakness when lifting the arm, should be checked.",
    },
  },
  biceps: {
    supply: {
      nerve: "The musculocutaneous nerve, which runs through the front of the upper arm.",
      blood: "The brachial artery, the main artery of the arm.",
      see: "musculocutaneous-nerve",
    },
    feel: "Hold the front of your upper arm, bend the elbow to 90° and turn your palm up and down. The biceps bulges as the palm turns up.",
    soreness: { peak: "Day 2", lasts: "3 to 4 days", tell: "Straightening the arm fully feels tight. This is common after your first curls." },
    injury: {
      common: "Biceps tendon irritation: an ache at the front of the shoulder or in the crease of the elbow.",
      warning: "A sudden pop followed by a bulge in the upper arm is a torn tendon. See a doctor.",
    },
  },
  triceps: {
    supply: {
      nerve: "The radial nerve, which spirals around the back of the arm bone.",
      blood: "The deep artery of the arm, which travels with that nerve.",
      see: "radial-nerve",
    },
    feel: "Hold the back of your upper arm and press your straight arm down on a table. The muscle hardens into a horseshoe shape.",
    soreness: { peak: "Day 2", lasts: "3 to 4 days", tell: "Pushing yourself up from a chair." },
    injury: {
      common: "Triceps tendon irritation: pain at the back of the elbow, usually from heavy extensions or dips.",
      warning: "Swelling at the point of the elbow, or pain that stops you straightening the arm.",
    },
  },
  forearms: {
    supply: {
      nerve: "The median and ulnar nerves work the gripping side. The radial nerve works the back of the forearm.",
      blood: "The radial and ulnar arteries. The radial artery is the pulse you feel at the wrist.",
      see: "median-nerve",
    },
    feel: "Wrap a hand around your forearm just below the elbow. Make a tight fist, then open the hand wide. The two sides switch on in turn.",
    soreness: { peak: "Day 1", lasts: "1 to 2 days", tell: "Gripping a bag or turning a door handle." },
    injury: {
      common: "Tennis elbow and golfer's elbow: tendon pain on the outer or inner bump of the elbow, from more gripping than the tendons are used to.",
      warning: "Numbness or tingling in the fingers, or a grip that keeps getting weaker.",
    },
  },
  traps: {
    supply: {
      nerve: "The accessory nerve, which comes down from the base of the skull.",
      blood: "The transverse cervical artery, from the base of the neck.",
    },
    feel: "Put a hand on the slope between your neck and shoulder and shrug. Then squeeze your shoulder blades together and feel lower down, between the blades.",
    soreness: { peak: "Day 1 to 2", lasts: "2 to 3 days", tell: "Turning your head or carrying a bag on one shoulder." },
    injury: {
      common: "Upper-trap strain or tension: a stiff, sore band from neck to shoulder, sometimes with a headache at the back of the head.",
      warning: "Neck pain together with numbness, tingling or weakness in an arm.",
    },
  },
  lats: {
    supply: {
      nerve: "The thoracodorsal nerve, a branch of the brachial plexus.",
      blood: "The thoracodorsal artery, which runs down the side of the chest wall.",
      see: "brachial-plexus",
    },
    feel: "Put a hand on the side of your back just below the armpit. Press that elbow down against your side. A thick band tightens under your fingers.",
    soreness: { peak: "Day 2", lasts: "3 to 4 days", tell: "Reaching overhead or pulling a heavy door." },
    injury: {
      common: "Lat strain: a pull under the armpit or down the side of the back, usually from a jerky pull-up or pulldown.",
      warning: "Sharp pain when reaching overhead, with bruising on the side of the chest.",
    },
  },
  "rotator-cuff": {
    supply: {
      nerve: "Mainly the suprascapular nerve, which passes through a notch at the top of the shoulder blade.",
      blood: "The suprascapular artery, which follows the same path.",
      see: "brachial-plexus",
    },
    feel: "Reach across and rest your fingers on the back of the shoulder blade, below its bony ridge. Tuck that elbow into your side and turn the forearm outward against light resistance.",
    soreness: { peak: "Day 1 to 2", lasts: "2 to 3 days", tell: "A mild, deep ache at the back of the shoulder." },
    injury: {
      common: "Cuff tendon irritation: a dull ache on the outside of the upper arm, worse when reaching overhead or behind your back.",
      warning: "Night pain, a painful stretch of the movement as you raise the arm, or sudden weakness after a fall.",
    },
  },
  serratus: {
    supply: {
      nerve: "The long thoracic nerve, which runs down the side of the ribcage.",
      blood: "The lateral thoracic artery, alongside it.",
      see: "brachial-plexus",
    },
    feel: "Place your fingers on the side of your ribs below the armpit. Push a wall with a straight arm, then reach a little farther without bending the elbow.",
    soreness: { peak: "Day 1 to 2", lasts: "2 to 3 days", tell: "A deep breath or a long reach tugs at the side of the ribs." },
    injury: {
      common: "It is rarely strained. Weakness shows up as a shoulder blade that lifts away from the ribs, called winging.",
      warning: "Winging that appears suddenly, with a weak shoulder, can mean an irritated nerve.",
    },
  },
  neck: {
    supply: {
      nerve: "The accessory nerve, the same one that works the traps.",
      blood: "Small branches of the arteries of the neck.",
    },
    feel: "Turn your head to one side and place your fingers on the opposite side of your neck. The strap stands out from behind the ear to the collarbone.",
    soreness: { peak: "Day 1", lasts: "1 to 2 days", tell: "Lifting your head off the pillow." },
    injury: {
      common: "Neck strain: stiffness and pain when turning the head, often after sleeping awkwardly or craning the neck during ab work.",
      warning: "Neck pain after an impact, or with dizziness, arm numbness or a severe headache, needs urgent care.",
    },
  },
  rhomboids: {
    supply: {
      nerve: "The dorsal scapular nerve, from the top of the brachial plexus.",
      blood: "The dorsal scapular artery, along the inner edge of the shoulder blade.",
      see: "brachial-plexus",
    },
    feel: "These are hard to reach on yourself. Squeeze your shoulder blades together and notice the effort between them. A partner can feel them tighten beside the spine.",
    soreness: { peak: "Day 1 to 2", lasts: "2 to 3 days", tell: "Sitting up straight feels like work." },
    injury: {
      common: "Rhomboid strain or knot: a nagging ache between the shoulder blade and the spine.",
      warning: "Pain between the shoulder blades with chest pain or shortness of breath is not a muscle problem. Seek urgent care.",
    },
  },
  abs: {
    supply: {
      nerve: "The lower intercostal nerves, which continue from under the ribs into the abdominal wall.",
      blood: "The epigastric arteries, which run up and down behind the muscle.",
      see: "intercostal-nerves",
    },
    feel: "Lie on your back with your fingers either side of your navel, then lift your head and shoulders. The blocks firm up at once.",
    soreness: { peak: "Day 1 to 2", lasts: "2 to 3 days", tell: "Laughing, coughing and sitting up in bed." },
    injury: {
      common: "Abdominal strain: a pull in the stomach wall that hurts when you sit up, cough or laugh.",
      warning: "A bulge near the navel or groin that appears when you strain can be a hernia.",
    },
  },
  obliques: {
    supply: {
      nerve: "The lower intercostal nerves and the first nerves of the lower back.",
      blood: "The lower intercostal and lumbar arteries.",
      see: "intercostal-nerves",
    },
    feel: "Stand with your hands on the sides of your waist and bend to one side. The side you bend toward tightens. Twisting against a door frame does the same.",
    soreness: { peak: "Day 1 to 2", lasts: "2 to 3 days", tell: "Twisting to look behind you." },
    injury: {
      common: "Side strain: a sharp pain in the side of the waist when twisting or bending, common in throwing and swinging sports.",
      warning: "Pain with a visible bulge, or pain sharp enough to stop your breath.",
    },
  },
  "lower-back": {
    supply: {
      nerve: "Small rear branches of the spinal nerves, one pair at each level of the spine.",
      blood: "The lumbar arteries and the rear branches of the intercostal arteries.",
      see: "nerve-roots",
    },
    feel: "Stand and place your thumbs either side of your spine at waist height. Lean forward a little. Two firm columns rise under your thumbs.",
    soreness: { peak: "Day 1 to 2", lasts: "2 to 3 days", tell: "Stiffness when you bend to tie your shoes. It should feel like tired muscle, not sharp pain." },
    injury: {
      common: "Low back strain: a stiff, sore lower back after lifting with a rounded back or doing too much too soon. Most cases settle within a few weeks.",
      warning: "Pain shooting below the knee, numbness, leg weakness, or any change in bladder or bowel control needs urgent care.",
    },
  },
  "deep-core": {
    supply: {
      nerve: "The lower intercostal nerves at the front, and small rear branches of the spinal nerves along the spine.",
      blood: "The lumbar arteries and their neighbors in the abdominal wall.",
      see: "intercostal-nerves",
    },
    feel: "Press two fingers into your waist just inside the front hip bones. Cough gently, or draw the lower belly in. You feel a deep tightening under your fingertips.",
    soreness: { peak: "Rarely sore", lasts: "A day at most", tell: "These muscles work at low effort, so they seldom get sore. A mild ache deep in the waist is possible." },
    injury: {
      common: "They are not usually injured on their own. Poor control here tends to show up as a lower back that tires or aches under load.",
      warning: "The same signs as for the lower back: pain down a leg, numbness, weakness, or bladder or bowel changes.",
    },
  },
  glutes: {
    supply: {
      nerve: "The inferior gluteal nerve, from the sacral plexus.",
      blood: "The gluteal arteries, which leave the pelvis above and below the piriformis.",
      see: "sacral-plexus",
    },
    feel: "Stand with a hand on one buttock. Squeeze it, or lift that leg straight back. The whole cheek hardens.",
    soreness: { peak: "Day 2", lasts: "3 to 5 days", tell: "Sitting down, standing up and climbing stairs." },
    injury: {
      common: "A true glute strain is uncommon. More often the tendon on the outer hip gets irritated and aches when you lie on that side.",
      warning: "Deep buttock pain with tingling or numbness running down the leg.",
    },
  },
  "hip-abductors": {
    supply: {
      nerve: "The superior gluteal nerve, from the sacral plexus.",
      blood: "The superior gluteal artery.",
      see: "sacral-plexus",
    },
    feel: "Place your fingers on your side just below the rim of the pelvis and stand on that leg. The muscle hardens to keep your hips level.",
    soreness: { peak: "Day 2", lasts: "2 to 4 days", tell: "Standing on one leg to get dressed." },
    injury: {
      common: "Outer hip tendon pain: an ache over the bony point of the hip, worse on stairs, on one leg, or lying on that side.",
      warning: "Pain that wakes you at night, or a limp.",
    },
  },
  piriformis: {
    supply: {
      nerve: "Its own small nerve from the sacral plexus. The sciatic nerve runs just beneath it.",
      blood: "The gluteal arteries.",
      see: "sciatic",
    },
    feel: "It is too deep to feel clearly. Sit and press into the middle of one buttock while you turn that knee outward. You may notice a deep tension.",
    soreness: { peak: "Day 1 to 2", lasts: "2 to 3 days", tell: "A deep ache when sitting on a hard chair." },
    injury: {
      common: "Piriformis irritation: a deep ache in the buttock, sometimes with tingling down the back of the leg when sitting.",
      warning: "Numbness, leg weakness, or symptoms in both legs.",
    },
  },
  "hip-flexors": {
    supply: {
      nerve: "The femoral nerve and short branches straight from the lumbar plexus.",
      blood: "Branches of the femoral artery and of the arteries of the lower back.",
      see: "femoral-nerve",
    },
    feel: "Sit tall and press your fingers into the crease at the front of your hip. Lift that knee a few centimeters. A cord tightens under your fingers.",
    soreness: { peak: "Day 1 to 2", lasts: "2 to 3 days", tell: "Lifting your knee to climb stairs or get into a car." },
    injury: {
      common: "Hip flexor strain: a pull at the front of the hip, usually from sprinting or kicking.",
      warning: "A click or catch deep in the groin with pain can come from the joint, not the muscle.",
    },
  },
  quads: {
    supply: {
      nerve: "The femoral nerve, which fans out just below the groin.",
      blood: "The femoral artery, the main artery of the leg.",
      see: "femoral-nerve",
    },
    feel: "Sit with your leg out straight and a hand just above the knee. Tighten the thigh as if pressing the knee down. The teardrop on the inner side pops up.",
    soreness: { peak: "Day 2", lasts: "3 to 5 days", tell: "Walking downstairs and lowering yourself onto a chair." },
    injury: {
      common: "Quad strain: a pull at the front of the thigh. In beginners an ache around the kneecap, known as runner's knee, is more common.",
      warning: "A swollen knee, a knee that gives way, or one that locks.",
    },
  },
  hamstrings: {
    supply: {
      nerve: "The sciatic nerve, which runs down between them.",
      blood: "Branches of the deep artery of the thigh that pass through to the back.",
      see: "sciatic",
    },
    feel: "Sit on a chair, reach under your thigh near the knee and press your heel back against the chair leg. Two firm cords stand out, one on each side.",
    soreness: { peak: "Day 2", lasts: "3 to 5 days", tell: "Bending forward, or straightening the knee fully." },
    injury: {
      common: "Hamstring strain: a sudden pull at the back of the thigh, classically while sprinting. It is among the most common muscle injuries and tends to return if rushed.",
      warning: "A pop with bruising, or pain when you sit on the sit bone.",
    },
  },
  adductors: {
    supply: {
      nerve: "The obturator nerve, which reaches the thigh through an opening in the pelvis.",
      blood: "The obturator artery and the deep artery of the thigh.",
      see: "obturator-nerve",
    },
    feel: "Sit with a fist between your knees and a hand on your inner thigh. Squeeze the fist. The inner thigh hardens.",
    soreness: { peak: "Day 2", lasts: "3 to 5 days", tell: "Getting out of a car or taking a wide step. This is often the surprise soreness after first squats." },
    injury: {
      common: "Groin strain: a pull high on the inner thigh, from a quick change of direction or going deep before the muscle is ready.",
      warning: "Groin pain that lingers for weeks, or pain when you cough.",
    },
  },
  calves: {
    supply: {
      nerve: "The tibial nerve, which runs down the middle of the calf.",
      blood: "The posterior tibial artery and branches from behind the knee.",
      see: "tibial-nerve",
    },
    feel: "Hold the back of your lower leg and rise onto your toes. Two heads bulge near the top. Bend the knee and repeat to feel the flat muscle underneath.",
    soreness: { peak: "Day 2", lasts: "4 to 6 days", tell: "The first steps in the morning and going downstairs. Calves are known for soreness that lingers." },
    injury: {
      common: "Calf strain: a sudden sharp pain, as if struck from behind. Achilles tendon pain builds more slowly and is stiffest in the morning.",
      warning: "A calf that is swollen, warm and tender without an injury can be a blood clot. Get it checked the same day. A snap at the heel with trouble pushing off is a torn Achilles.",
    },
  },
  shins: {
    supply: {
      nerve: "The deep branch of the peroneal nerve.",
      blood: "The anterior tibial artery, which becomes the pulse on top of the foot.",
      see: "peroneal-nerve",
    },
    feel: "Run your fingers down the outside of your shin bone. Keep the heel down and lift your toes. The muscle beside the bone pops up.",
    soreness: { peak: "Day 1 to 2", lasts: "2 to 3 days", tell: "Walking fast or downhill." },
    injury: {
      common: "Shin splints: an ache along the shin bone when running or walking increases too quickly.",
      warning: "Pain at one small spot on the bone, or pain at rest, can be a stress fracture.",
    },
  },
  peroneals: {
    supply: {
      nerve: "The superficial branch of the peroneal nerve.",
      blood: "The peroneal artery, deep in the calf.",
      see: "peroneal-nerve",
    },
    feel: "Place your fingers on the outside of your lower leg and tilt the sole of your foot outward. A tendon also stands out behind the outer ankle bone.",
    soreness: { peak: "Day 1 to 2", lasts: "2 to 3 days", tell: "Walking on uneven ground." },
    injury: {
      common: "Ankle sprain: rolling the ankle strains these tendons together with the outer ligaments.",
      warning: "You cannot put weight on the foot, or the ankle keeps giving way.",
    },
  },
};
