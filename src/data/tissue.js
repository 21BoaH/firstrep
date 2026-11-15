/*
 * Connective-tissue details for each muscle group, keyed by the ids in muscles.js.
 *
 * fascia   how fascia and tendons relate to this muscle
 * spot     optional: where the reader can see that tissue on the 3D model
 * design   how the muscle is built (fiber layout) and what that means
 * notice   what beginners commonly feel, and what helps
 * stretch  [name, how to do it]
 *
 * Claims are kept to what anatomy texts agree on. Fascia is an area with a lot
 * of hype, so nothing here says that rolling or stretching "releases" or
 * reshapes it.
 */

export const FASCIA_PRIMER =
  "Fascia is the connective tissue that wraps every muscle, every bundle inside it and every single fiber, and then merges into the tendon. It does three jobs. It passes the muscle's force on to the bone and to neighboring muscles. It lets layers slide over each other. And it holds the muscle's shape. It adapts to training like muscle does, only more slowly. Foam rolling and stretching can make an area feel looser for a while, mostly by calming the nervous system. They do not break up or reshape fascia.";

export const TISSUE = {
  chest: {
    fascia:
      "The pectoral fascia covers the chest muscle and blends into the fascia of the shoulder and upper arm. Underneath, a second sheet holds the smaller pectoralis minor against the ribs. Because these layers are continuous, a stiff chest can limit how far the arm reaches back and overhead.",
    spot: "The pale strip down the middle is the breastbone, where both sides anchor.",
    design:
      "Fan-shaped. Fibers arrive from many directions and twist as they reach the arm, so different pressing angles load different parts of the same muscle.",
    notice:
      "After hours at a desk the front of the shoulder often feels tight and the shoulders round forward. Pair every pressing exercise with a pulling exercise.",
    stretch: [
      "Doorway chest stretch",
      "Rest your forearm on a door frame with the elbow at shoulder height and turn your body away until you feel the front of the chest. Hold 20 to 30 seconds each side.",
    ],
  },
  shoulders: {
    fascia:
      "The deltoid fascia wraps the muscle and sends walls of connective tissue between its sections. The middle section is packed with short fibers arranged around several internal tendons, which is why it is strong for its size. Under the muscle sits a fluid-filled cushion, a bursa, that lets it glide over the shoulder joint.",
    design:
      "The middle part has short, angled fibers and is built for force. The front and rear parts have longer, straighter fibers and are built for range.",
    notice:
      "The front of the shoulder gets plenty of work from pressing, while the rear is often undertrained. Add a rear-shoulder exercise if your program is heavy on presses.",
    stretch: [
      "Cross-body shoulder stretch",
      "Bring one arm straight across your chest and pull it gently toward you with the other arm. Hold 20 to 30 seconds each side.",
    ],
  },
  biceps: {
    fascia:
      "Besides its main tendon, the biceps sends a flat sheet of fascia across the inner elbow into the fascia of the forearm. Part of the biceps' pull travels through that sheet, and it also protects the artery and nerve that run underneath.",
    design:
      "Long, parallel fibers running the length of the arm. Long fibers shorten a long way, so the biceps is built more for movement than for peak force. The brachialis underneath does much of the heavy work of bending the elbow.",
    notice:
      "Elbow or forearm ache from curling usually comes from adding weight faster than the tendons can adapt. Tendons strengthen more slowly than muscle, so progress in small steps.",
    stretch: [
      "Wall biceps stretch",
      "Place your palm on a wall behind you at shoulder height with the thumb up, then turn your body away. Hold 20 seconds each side.",
    ],
  },
  triceps: {
    fascia:
      "The three heads merge into a broad, flat tendon that covers the lower back of the arm before it attaches to the point of the elbow. Walls of fascia on both sides separate the triceps from the muscles at the front of the arm and give its fibers something to anchor to.",
    spot: "The pale patch above the back of the elbow is that shared tendon.",
    design: "Short fibers meet the tendon at an angle. That layout packs in more fibers and favors force over range.",
    notice:
      "The triceps tire before the chest in most presses, so they often decide when a pressing set ends. Sore elbows on pushdowns usually mean too much weight too soon.",
    stretch: [
      "Overhead triceps stretch",
      "Reach one hand down between your shoulder blades and use the other hand to ease the elbow back. Hold 20 to 30 seconds each side.",
    ],
  },
  forearms: {
    fascia:
      "The forearm fascia is a tight sleeve that divides the muscles into a front group and a back group. At the wrist it thickens into bands that hold the long tendons down, like the guides on a fishing rod. The pump you feel in the forearms is the muscles swelling against that sleeve.",
    design: "Many slim muscles with long tendons. The muscle mass stays near the elbow, which keeps the hand light.",
    notice:
      "Grip gives out before the back on rows and pulldowns. That is normal in the first months and improves quickly. Pain at the bony bumps of the elbow is a sign to reduce gripping work for a while.",
    stretch: [
      "Wrist flexor stretch",
      "Hold one arm straight in front with the palm up, and use the other hand to draw the fingers down and back. Hold 20 seconds, then repeat with the palm down.",
    ],
  },
  traps: {
    fascia:
      "Along the spine the traps attach through a thin sheet of tendon instead of directly to bone. At the neck this becomes a strong band, the nuchal ligament, that helps hold the head up. The fascia covering the traps continues into the fascia of the neck above and of the lats below.",
    spot: "The pale line down the spine marks where the two sides meet.",
    design:
      "A flat sheet whose fibers run in three directions: down and out at the top, straight across in the middle, up and out at the bottom.",
    notice:
      "The upper part often feels tense from desk work and stress, while the middle and lower parts are weak. Rows and Y raises usually help more than stretching the neck.",
    stretch: [
      "Upper trap stretch",
      "Sit tall, tilt your ear toward one shoulder and let the opposite shoulder drop. Hold 20 seconds each side without pulling on your head.",
    ],
  },
  lats: {
    fascia:
      "Much of the lat does not start on bone. It starts on the thoracolumbar fascia, a strong diamond of connective tissue over the lower back. The glute on the opposite side attaches to the same sheet, so the two pull on it together when you walk, run or throw. This cross-body link is one of the clearest examples of fascia passing force between muscles.",
    spot: "The pale diamond on the lower back is the thoracolumbar fascia.",
    design:
      "A broad fan that narrows and twists into one flat tendon. Its long fibers give it one of the largest ranges of motion of any muscle.",
    notice:
      "Many beginners feel pulldowns and rows mostly in the arms. Start each rep by pulling the shoulder blades down, and think about moving the elbows, not the hands.",
    stretch: [
      "Bench lat stretch",
      "Kneel in front of a bench, rest your elbows on it and sink your chest toward the floor. Hold 20 to 30 seconds.",
    ],
  },
  "rotator-cuff": {
    fascia:
      "The four cuff tendons flatten and fuse with each other and with the capsule of the shoulder joint, forming one continuous sleeve around the ball. Above them a bursa lets the sleeve slide under the bony roof of the shoulder. This is tendon-heavy tissue, so it adapts slowly and dislikes sudden jumps in load.",
    design: "Short muscles with broad, flat tendons, built to steady the joint for long periods.",
    notice:
      "Pinching at the shoulder in presses often improves with lighter loads, elbows a little closer to the body and regular external-rotation work. Sharp or lasting pain needs a professional.",
    stretch: [
      "Pendulum swing",
      "Lean forward with one hand on a table and let the other arm hang loose. Draw small circles for 30 seconds in each direction.",
    ],
  },
  serratus: {
    fascia:
      "The serratus lies between two sliding layers: the ribs on one side and the underside of the shoulder blade on the other. The fascia here has to glide freely, because the shoulder blade has no bony joint with the ribcage. It rides on muscle and fascia.",
    spot: "You can see its slips on the side of the ribs, between the chest and the lats.",
    design: "Separate slips, one per rib, that interlock with the obliques like the fingers of two hands.",
    notice:
      "If the inner edge of the shoulder blade lifts away from the ribs during push-ups, the serratus is not holding it down. The push-up plus and the wall slide target exactly that.",
    stretch: [
      "Child's pose side reach",
      "From hands and knees, sit back on your heels and walk both hands to one side until you feel the ribs open. Hold 20 seconds each side.",
    ],
  },
  abs: {
    fascia:
      "Each side of the abs sits inside the rectus sheath, an envelope made from the flat tendons of the obliques and the deeper abdominal muscle. The two envelopes meet in the middle at the linea alba. Bands of tendon cross the muscle and tie it to the front of the sheath, which creates the six-pack blocks. When the obliques tighten, they tension the sheath and stiffen the whole front of the trunk.",
    spot: "The pale frame around the blocks is the rectus sheath. The line down the middle is the linea alba.",
    design: "One long strap of parallel fibers, cut into short segments by three or four bands of tendon.",
    notice:
      "The number and symmetry of the blocks is set by where your tendon bands sit. Training makes the blocks thicker, but it cannot change their layout.",
    stretch: [
      "Cobra",
      "Lie face down, place your hands under your shoulders and press your chest up while the hips stay on the floor. Hold 15 to 20 seconds.",
    ],
  },
  obliques: {
    fascia:
      "Toward the front, the oblique muscles turn into wide, flat tendons that wrap around the abs and form the rectus sheath. Toward the back, the deeper layers attach to the thoracolumbar fascia. The result is a continuous belt of muscle and fascia around the waist. Tightening it raises the pressure inside the abdomen and stiffens the spine, which is what bracing means.",
    design:
      "Thin sheets in layers, with fibers running in crossing diagonals like plywood. The crossing directions make the wall strong in every direction.",
    notice:
      "Beginners often hold their breath or suck the stomach in when asked to brace. Breathe in and tighten the waist all the way around, as if you were about to be poked.",
    stretch: [
      "Standing side bend",
      "Stand tall, reach one arm overhead and lean gently to the opposite side without twisting. Hold 20 seconds each side.",
    ],
  },
  "lower-back": {
    fascia:
      "The erectors run inside a tube formed by the thoracolumbar fascia. When they contract they swell against that tube, and the tube stiffens the spine like air in a tire. The lats, glutes and deep abdominal muscles all attach to the same fascia, so tightening any of them tensions it further.",
    spot: "The pale diamond over the lower back is this fascia.",
    design:
      "Many overlapping bundles of different lengths, rich in endurance fibers. They are built to work at low effort for hours.",
    notice:
      "A tired, pumped lower back after hinging is common early on and fades as the muscles adapt. Sharp pain, or pain that travels down a leg, is not normal training soreness.",
    stretch: [
      "Child's pose",
      "From hands and knees, sit back on your heels and reach your arms forward along the floor. Breathe slowly for 30 seconds.",
    ],
  },
  glutes: {
    fascia:
      "Only about a quarter of the glute's fibers attach to the thigh bone. The rest attach to the iliotibial band, a thick strap of fascia that runs down the outside of the thigh to just below the knee. Through it the glute also helps steady the knee. At the top, the glute connects to the thoracolumbar fascia and, through it, to the lat on the opposite side.",
    design: "Thick, coarse bundles running diagonally. A large cross-section, built for force.",
    notice:
      "Many beginners feel squats and bridges in the thighs or lower back instead. A short pause and squeeze at the top of each bridge helps you find the glutes.",
    stretch: [
      "Figure-four stretch",
      "Lie on your back, cross one ankle over the opposite knee and pull that knee toward your chest. Hold 20 to 30 seconds each side.",
    ],
  },
  "hip-abductors": {
    fascia:
      "The gluteus medius is covered by a dense sheet of fascia that some of its fibers actually grow from. At the front, the small tensor fasciae latae does what its name says: it tightens the iliotibial band. Together with the glute it keeps that band taut, which steadies the hip and the outside of the knee.",
    design: "Fan-shaped, with a good share of endurance fibers, because it works on every step.",
    notice:
      "The outside of the hip can ache after single-leg work in the first weeks. The iliotibial band itself is too stiff to be stretched or rolled longer. Strengthening the hip muscles is what changes how it feels.",
    stretch: [
      "Standing cross-leg lean",
      "Cross one leg behind the other, reach the same-side arm overhead and lean away from the back leg. Hold 20 seconds each side.",
    ],
  },
  "hip-flexors": {
    fascia:
      "The deep hip flexor lies right against the front of the lower spine, and its fascia connects with the diaphragm above. That is why very stiff hip flexors can tug the lower back into an arch when you stand. The sartorius runs in its own sleeve of thigh fascia across the front of the leg.",
    spot: "The sartorius is the thin strap crossing the thigh diagonally.",
    design:
      "The sartorius has the longest fibers in the body and is built for range. The deep hip flexor is thicker and built for force.",
    notice:
      "Tightness at the front of the hip after sitting is common. Regular movement through the full range tends to help more than long static stretches.",
    stretch: [
      "Half-kneeling hip flexor stretch",
      "Kneel on one knee, tuck your hips under and shift forward until you feel the front of the back hip. Hold 20 to 30 seconds each side.",
    ],
  },
  quads: {
    fascia:
      "The thigh is wrapped in the fascia lata, the strongest fascial stocking in the body. On the outside it thickens into the iliotibial band, and the outer quad lies directly beneath it. All four heads merge into the quadriceps tendon, which contains the kneecap and continues to the shin as the patellar tendon.",
    spot: "The pale tips above each knee are where the heads join the quadriceps tendon.",
    design:
      "Short fibers angled into long tendons. That packs a lot of force into the thigh, which is why the quads are among the strongest muscles in the body.",
    notice:
      "The front of the knee can ache when squats or stairs increase quickly. Tendons adapt more slowly than muscle, so add depth and load gradually.",
    stretch: [
      "Standing quad stretch",
      "Hold a support, bend one knee and bring the heel toward your glute with your hand, knees side by side. Hold 20 to 30 seconds each side.",
    ],
  },
  hamstrings: {
    fascia:
      "The hamstrings begin with long, shared tendons at the sit bone, and tendon tissue runs deep inside each muscle. At the top, their tendon connects with a strong ligament of the pelvis and, through it, with the thoracolumbar fascia. This line of tissue from calf to lower back is why hamstring stiffness often shows up when you bend forward.",
    design:
      "Long muscles that cross two joints, with tendon running through much of their length. They are good at storing and returning energy when you run.",
    notice:
      "Feeling tight does not always mean short. Hamstrings often loosen once they get stronger in a stretched position, which is what Romanian deadlifts train.",
    stretch: [
      "Lying hamstring stretch",
      "Lie on your back, raise one leg and hold behind the thigh, then straighten the knee until you feel a stretch. Hold 20 to 30 seconds each side.",
    ],
  },
  adductors: {
    fascia:
      "The adductors sit in their own compartment of the thigh, separated from the quads and hamstrings by walls of fascia. A tunnel in that fascia carries the main artery of the leg down toward the knee. At the top, their tendons blend with the attachment of the abdominal muscles on the pubic bone, linking the inner thigh to the trunk.",
    design: "A fan of several muscles. The largest, adductor magnus, is one of the biggest muscles in the body.",
    notice:
      "The inner thigh strains easily when you go deep or wide before it is ready. Increase squat depth and stance width gradually.",
    stretch: [
      "Butterfly stretch",
      "Sit with the soles of your feet together and let your knees fall outward while you stay tall. Hold 20 to 30 seconds.",
    ],
  },
  calves: {
    fascia:
      "Both calf muscles feed into the Achilles tendon, the thickest and strongest tendon in the body. It behaves like a spring: it stretches as your foot lands and gives that energy back as you push off. The tight fascia around the lower leg also helps the calf squeeze blood back up toward the heart with every step.",
    spot: "The pale band running down to the heel is the Achilles tendon.",
    design:
      "Short, angled fibers attached to a very long tendon. The soleus is mostly endurance fibers and works all day to keep you upright.",
    notice:
      "Calves are often very sore after a beginner's first sessions, sometimes for several days. Start with fewer sets than you think you need, and use the full range.",
    stretch: [
      "Wall calf stretch",
      "Place both hands on a wall, step one foot back and press that heel into the floor with the knee straight. Hold 20 to 30 seconds each side, then repeat with the knee bent.",
    ],
  },
  shins: {
    fascia:
      "The tibialis anterior sits in a tight compartment between the shin bone and a firm wall of fascia, and some of its fibers attach to that fascia directly. The compartment has little room to expand, so the muscle can feel very tight and pumped when it works hard. Bands of fascia at the ankle hold its tendon down as it crosses the joint.",
    spot: "The grey strip beside it is the shin bone, which has no muscle covering it.",
    design: "Angled fibers around a long central tendon, mostly endurance fibers, because it works on every step.",
    notice:
      "Aching along the shin is common when walking or running increases suddenly. Build up gradually. Lasting pain on the bone itself needs a professional.",
    stretch: [
      "Kneeling shin stretch",
      "Kneel with the tops of your feet flat on the floor and sit back gently toward your heels. Hold 20 seconds.",
    ],
  },
  neck: {
    fascia:
      "The neck's fascia forms sleeves within sleeves. The outer layer splits to wrap this muscle and, at the back, the upper traps, so the two are linked in one collar of tissue around the neck. Deeper sleeves hold the windpipe and the large blood vessels, which run just beneath the muscle.",
    design: "Two heads, one from the breastbone and one from the collarbone, that merge into a single long strap of parallel fibers.",
    notice:
      "The front of the neck is rarely trained and can be sore after ab exercises where you hold your head up. Rest your head between reps until it gets stronger.",
    stretch: ["Neck rotation stretch", "Sit tall, turn your head to one side and lift your chin slightly. Hold 15 to 20 seconds each side."],
  },
  rhomboids: {
    fascia:
      "The rhomboids lie in the layer just under the traps, and the two layers have to slide over each other every time the shoulder blade moves. Their flat tendons attach all along the inner edge of the blade, where the serratus attaches from the other side. Between them, those two muscles hold the blade like a sling.",
    spot: "Switch the model to Deep to see them. The traps are lifted away.",
    design: "Thin, flat sheets of parallel fibers. They are built to hold a position for a long time more than to produce big force.",
    notice:
      "An ache between the shoulder blades after long sitting is common. It usually eases with movement and with regular rowing work.",
    stretch: ["Hug stretch", "Wrap your arms around yourself, round your upper back and let the shoulder blades spread apart. Hold 20 seconds."],
  },
  "deep-core": {
    fascia:
      "This is the muscle group most tied to fascia. At the back the deep abdominal muscle attaches to the thoracolumbar fascia, and at the front it becomes part of the rectus sheath around the abs. When it tightens, it pulls on both and tensions a ring of fascia around the whole trunk.",
    spot: "Switch the model to Deep to see it. The abs and obliques are lifted away.",
    design:
      "The front muscle is a thin sheet with level fibers. The multifidus is made of many short bundles packed tightly beside the spine, rich in endurance fibers.",
    notice:
      "You cannot see or flex these muscles, which makes them hard to feel at first. The cue is a gentle tightening around the waist that still lets you breathe.",
    stretch: ["Cat-cow", "On hands and knees, slowly round your back toward the ceiling, then let it sink and lift your chest. Repeat 8 to 10 times."],
  },
  piriformis: {
    fascia:
      "The sciatic nerve leaves the pelvis directly under the piriformis, and in some people it passes through the muscle. That is why a tight or irritated piriformis is sometimes blamed for pain down the back of the leg. The muscle itself is covered by the thick fascia of the glutes above it.",
    spot: "Switch the model to Deep to see it. The glutes are lifted away, and the yellow cord beneath it is the sciatic nerve.",
    design: "A small, pear-shaped muscle whose fibers converge on one round tendon.",
    notice:
      "Deep buttock tightness after long sitting or a first leg session is common. Pain, tingling or numbness that runs down the leg needs a professional.",
    stretch: ["Seated figure-four stretch", "Sit on a chair, rest one ankle on the opposite knee and lean forward with a straight back. Hold 20 to 30 seconds each side."],
  },
  peroneals: {
    fascia:
      "The two muscles share their own narrow compartment on the outside of the leg, walled off by fascia. Behind the ankle bone, bands of fascia strap their tendons into a groove. If those bands are damaged in a bad sprain, the tendons can slip forward over the bone.",
    design: "Angled fibers feeding long tendons. The tendon of the longer muscle runs right across the sole of the foot.",
    notice:
      "A rolled ankle often leaves these muscles slow to react for months. Balance work retrains them better than strength work alone.",
    stretch: ["Seated ankle stretch", "Sit and rest one ankle on the opposite knee, then gently turn the sole upward with your hand. Hold 20 seconds each side."],
  },
};

/*
 * Non-muscle structures that are visible on the model. Hovering or tapping one
 * shows its name and note. The ids match userData.landmark in anatomy.js.
 */
export const LANDMARKS = {
  "rectus-sheath": {
    kind: "Fascia",
    name: "Rectus sheath",
    note: "A sleeve made from the flat tendons of the side abdominal muscles. It holds the abs in place.",
  },
  "lumbar-fascia": {
    kind: "Fascia",
    name: "Thoracolumbar fascia",
    note: "A strong diamond of connective tissue. The lats, glutes and deep core muscles all pull on it.",
  },
  "triceps-tendon": {
    kind: "Tendon",
    name: "Triceps tendon",
    note: "All three heads of the triceps join here before they reach the elbow.",
  },
  achilles: {
    kind: "Tendon",
    name: "Achilles tendon",
    note: "The strongest tendon in the body. It joins both calf muscles to the heel.",
  },
  breastbone: {
    kind: "Bone",
    name: "Breastbone",
    note: "Both chest muscles anchor here in the middle.",
  },
  collarbone: {
    kind: "Bone",
    name: "Collarbone",
    note: "The strut between breastbone and shoulder. Chest, shoulder and trap muscles attach to it.",
  },
  spine: {
    kind: "Bone",
    name: "Spine",
    note: "The traps attach along it through a thin sheet of tendon.",
  },
  kneecap: {
    kind: "Bone",
    name: "Kneecap",
    note: "A bone inside the quadriceps tendon. It works as a pulley for the quads.",
  },
  shin: {
    kind: "Bone",
    name: "Shin bone",
    note: "It sits just under the skin at the front, with no muscle covering it.",
  },

  // --- the Skeleton layer: bones
  skull: { kind: "Bone", name: "Skull", note: "Protects the brain. The traps and neck muscles attach to its base." },
  vertebrae: { kind: "Bone", name: "Spinal column", note: "24 moving vertebrae stacked in an S-curve. It carries the trunk and protects the spinal cord." },
  ribs: { kind: "Bone", name: "Ribcage", note: "Twelve pairs of ribs. The chest, serratus and abdominal muscles attach to them." },
  scapula: { kind: "Bone", name: "Shoulder blade", note: "A flat triangle that slides over the ribs. Seventeen muscles attach to it." },
  humerus: { kind: "Bone", name: "Upper arm bone", note: "The chest, lats and shoulder muscles all pull on it. Its round head forms the shoulder joint." },
  "forearm-bones": { kind: "Bone", name: "Forearm bones", note: "The radius and the ulna. The radius rolls over the ulna when you turn your palm." },
  "hand-bones": { kind: "Bone", name: "Hand", note: "27 small bones, moved mostly by muscles up in the forearm." },
  pelvis: { kind: "Bone", name: "Pelvis", note: "Two hip bones and the sacrum. It anchors the muscles of the trunk and the legs." },
  femur: { kind: "Bone", name: "Thigh bone", note: "The longest and strongest bone in the body." },
  fibula: { kind: "Bone", name: "Fibula", note: "The slim outer bone of the lower leg. The outer shin muscles start on it." },
  "foot-bones": { kind: "Bone", name: "Foot", note: "26 bones arranged in arches that absorb impact." },

  // --- ligaments: bone to bone
  "ac-ligament": { kind: "Ligament", name: "Shoulder-top ligaments", note: "They tie the collarbone to the shoulder blade. A fall on the shoulder can sprain them." },
  "shoulder-capsule": { kind: "Ligament", name: "Shoulder capsule", note: "A loose sleeve of ligaments around the joint. The rotator cuff reinforces it." },
  mcl: { kind: "Ligament", name: "Inner knee ligament", note: "Stops the knee from buckling inward." },
  lcl: { kind: "Ligament", name: "Outer knee ligament", note: "Stops the knee from buckling outward." },
  cruciates: { kind: "Ligament", name: "Cruciate ligaments", note: "Two bands that cross inside the knee. They stop the shin sliding forward or back under the thigh." },
  "patellar-ligament": { kind: "Ligament", name: "Patellar ligament", note: "Connects the kneecap to the shin. The quads pull through it." },
  "ankle-ligaments": { kind: "Ligament", name: "Outer ankle ligaments", note: "The ones injured in most ankle sprains." },
  "deltoid-ligament": { kind: "Ligament", name: "Inner ankle ligament", note: "A strong fan that resists the foot rolling outward." },

  // --- nerves
  "nerve-roots": { kind: "Nerve", name: "Spinal nerve roots", note: "Each nerve leaves the spine through a gap between two vertebrae. A bulging disc can press on one here." },
  "brachial-plexus": { kind: "Nerve", name: "Brachial plexus", note: "Five roots from the neck merge, swap fibers and split again into the nerves of the arm. It passes under the collarbone." },
  "axillary-nerve": { kind: "Nerve", name: "Axillary nerve", note: "Hooks around the top of the upper arm bone to work the shoulder muscle." },
  "musculocutaneous-nerve": { kind: "Nerve", name: "Musculocutaneous nerve", note: "Runs through the front of the upper arm. It works the biceps and the brachialis." },
  "intercostal-nerves": { kind: "Nerve", name: "Intercostal nerves", note: "One runs under each rib. They work the muscles between the ribs and the abdominal wall." },
  "lumbar-plexus": { kind: "Nerve", name: "Lumbar plexus", note: "Roots from the lower back that form the nerves for the front and the inside of the thigh." },
  "sacral-plexus": { kind: "Nerve", name: "Sacral plexus", note: "Roots from the base of the spine that join into the sciatic nerve." },
  "obturator-nerve": { kind: "Nerve", name: "Obturator nerve", note: "Passes through an opening in the pelvis to the inner-thigh muscles." },
  "saphenous-nerve": { kind: "Nerve", name: "Saphenous nerve", note: "A long skin nerve that runs down the inner side of the leg to the foot." },
  "median-nerve": { kind: "Nerve", name: "Median nerve", note: "Runs down the middle of the arm to the hand. It works most of the muscles that close your grip." },
  "ulnar-nerve": { kind: "Nerve", name: "Ulnar nerve", note: "Passes behind the inner elbow, where bumping it gives the funny-bone tingle." },
  "radial-nerve": { kind: "Nerve", name: "Radial nerve", note: "Winds around the back of the upper arm. It works the triceps and the muscles that open the hand." },
  sciatic: { kind: "Nerve", name: "Sciatic nerve", note: "The largest nerve in the body. It runs under the deep hip rotators and down the back of the thigh." },
  "femoral-nerve": { kind: "Nerve", name: "Femoral nerve", note: "Supplies the quads at the front of the thigh." },
  "tibial-nerve": { kind: "Nerve", name: "Tibial nerve", note: "The branch of the sciatic nerve that continues to the calf and the sole." },
  "peroneal-nerve": { kind: "Nerve", name: "Common peroneal nerve", note: "The branch that wraps around the outside of the knee to the shin muscles." },

  // joints: each is marked by a ring in the Skeleton layer
  "shoulder-joint": { kind: "Joint", name: "Shoulder joint", note: "A ball in a shallow socket. The most mobile joint in the body, and the least stable." },
  "elbow-joint": { kind: "Joint", name: "Elbow joint", note: "A hinge that bends and straightens the arm, with a pivot that turns the palm." },
  "hip-joint": { kind: "Joint", name: "Hip joint", note: "A ball in a deep socket. Built to carry your weight and still move freely." },
  "knee-joint": { kind: "Joint", name: "Knee joint", note: "The largest joint in the body. A hinge held together by four ligaments." },
  "ankle-joint": { kind: "Joint", name: "Ankle joint", note: "A hinge between the shin and the foot. It points the foot down and pulls it up." },

  // heart and vessels: Skeleton layer only
  heart: { kind: "Organ", name: "Heart", note: "A muscle the size of your fist that pumps blood to every other muscle." },
  aorta: { kind: "Artery", name: "Aorta", note: "The main artery of the body. It arches over the heart and runs down in front of the spine." },
  "carotid-artery": { kind: "Artery", name: "Carotid artery", note: "Carries blood up the neck to the head. It is the pulse you feel beside the windpipe." },
  "subclavian-artery": { kind: "Artery", name: "Subclavian artery", note: "Passes under the collarbone and through the armpit to feed the shoulder and the arm." },
  "brachial-artery": { kind: "Artery", name: "Brachial artery", note: "The main artery of the upper arm. Blood pressure is measured over it." },
  "forearm-arteries": { kind: "Artery", name: "Forearm arteries", note: "The radial and ulnar arteries. The radial one is the pulse at the wrist." },
  "iliac-artery": { kind: "Artery", name: "Iliac artery", note: "The aorta splits in two here. One branch feeds the leg and one the hip and the glutes." },
  "femoral-artery": { kind: "Artery", name: "Femoral artery", note: "The main artery of the leg. It enters the thigh at the groin." },
  "popliteal-artery": { kind: "Artery", name: "Popliteal artery", note: "The femoral artery after it has passed to the back of the knee." },
  "tibial-arteries": { kind: "Artery", name: "Tibial arteries", note: "Two arteries of the lower leg. They give the pulses at the inner ankle and on top of the foot." },
  "vena-cava": { kind: "Vein", name: "Vena cava", note: "The two great veins that bring blood from the body back to the heart." },
  "jugular-vein": { kind: "Vein", name: "Jugular vein", note: "Drains the head down the side of the neck." },
  "arm-veins": { kind: "Vein", name: "Arm veins", note: "The cephalic vein on the outside and the basilic vein on the inside. These are the veins that stand out when you train." },
  "femoral-vein": { kind: "Vein", name: "Femoral vein", note: "The deep vein of the thigh. It runs beside the femoral artery." },
  "saphenous-vein": { kind: "Vein", name: "Great saphenous vein", note: "The longest vein in the body. It runs under the skin from the inner ankle to the groin." },
};
