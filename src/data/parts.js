/*
 * The heads and sub-muscles inside each muscle group.
 *
 * Keys are muscle ids from muscles.js. Each part id matches userData.part on
 * the meshes in src/scene/anatomy.js. A group that is not listed here has a
 * single part and shows no part picker.
 *
 * deep: true marks a part that only appears in the model's Deep layer.
 */
export const PARTS = {
  chest: [
    { id: "upper", name: "Upper chest", note: "The portion that starts on the collarbone. It lifts the arm forward and up, so incline presses work it most." },
    { id: "lower", name: "Mid and lower chest", note: "The portion that starts on the breastbone, and the bulk of the muscle. Flat presses and push-ups work it most." },
  ],
  shoulders: [
    { id: "front", name: "Front head", note: "Raises the arm in front of you. It gets heavy work in every press." },
    { id: "side", name: "Side head", note: "Raises the arm out to the side and gives the shoulder its width. Lateral raises target it." },
    { id: "rear", name: "Rear head", note: "Pulls the arm back. Rows and reverse flys train it, and it is the head most often neglected." },
  ],
  biceps: [
    { id: "biceps", name: "Biceps brachii", note: "The two-headed muscle on top. It bends the elbow and turns the palm up." },
    { id: "brachialis", name: "Brachialis", note: "Lies under the biceps and attaches to the other forearm bone. It bends the elbow in every grip, and hammer curls favor it." },
  ],
  triceps: [
    { id: "long", name: "Long head", note: "The only head that crosses the shoulder. Overhead extensions stretch and load it most." },
    { id: "lateral", name: "Lateral head", note: "The outer head that forms the horseshoe shape. Pushdowns and presses work it hard." },
    { id: "medial", name: "Medial head", note: "The deepest head, showing low on the inner arm. It works in every elbow-straightening movement, even light ones." },
  ],
  forearms: [
    { id: "brachioradialis", name: "Brachioradialis", note: "Runs along the thumb side from above the elbow. It bends the elbow, most strongly with a thumbs-up grip." },
    { id: "flexors", name: "Wrist flexors", note: "The palm-side group. They curl the wrist and close the fingers, so they do the gripping." },
    { id: "extensors", name: "Wrist extensors", note: "The group on the back of the forearm. They bend the wrist back and steady it while you grip." },
  ],
  traps: [
    { id: "upper", name: "Upper and middle traps", note: "Shrug the shoulder blade up and pull it back. Shrugs, carries and rows train them." },
    { id: "lower", name: "Lower traps", note: "Pull the shoulder blade down and help turn it for overhead reaching. Y raises target them." },
  ],
  lats: [
    { id: "lat", name: "Latissimus dorsi", note: "The big fan that pulls the arm down and back." },
    { id: "teres", name: "Teres major", note: "A thick strap from the tip of the shoulder blade to the arm. It assists every pulling movement." },
  ],
  "rotator-cuff": [
    { id: "infraspinatus", name: "Infraspinatus", note: "The largest cuff muscle you can see. It turns the arm outward." },
    { id: "teres-minor", name: "Teres minor", note: "A slim helper for outward rotation, just below the infraspinatus." },
    { id: "supraspinatus", name: "Supraspinatus", deep: true, note: "Sits above the ridge of the shoulder blade, under the traps. It starts the arm lifting out to the side, and its tendon is the one most often irritated." },
    { id: "subscapularis", name: "Subscapularis", deep: true, note: "The largest cuff muscle. It lies on the front of the shoulder blade, against the ribs, and turns the arm inward." },
  ],
  "deep-core": [
    { id: "transversus", name: "Transversus abdominis", deep: true, note: "The level belt of muscle around the waist, under the obliques." },
    { id: "multifidus", name: "Multifidus", deep: true, note: "Short bundles packed beside the spine that steady each vertebra." },
  ],
  "hip-abductors": [
    { id: "medius", name: "Gluteus medius", note: "The main muscle that lifts the leg sideways and keeps the pelvis level." },
    { id: "tfl", name: "Tensor fasciae latae", note: "A small muscle at the front of the hip that tightens the band down the outer thigh." },
    { id: "minimus", name: "Gluteus minimus", deep: true, note: "Lies under the medius and does the same job, with a bigger role in turning the thigh inward." },
  ],
  "hip-flexors": [
    { id: "sartorius", name: "Sartorius", note: "The long strap across the thigh. It bends the hip and the knee and turns the thigh outward." },
    { id: "lower", name: "Pectineus", note: "A short, flat muscle at the top of the inner thigh, beside the iliopsoas. It helps lift the thigh and draw it in." },
    { id: "psoas", name: "Psoas major", deep: true, note: "Starts on the sides of the lower spine. It is the strongest hip flexor." },
    { id: "iliacus", name: "Iliacus", deep: true, note: "Fans across the inside of the hip bone and joins the psoas in one tendon." },
  ],
  quads: [
    { id: "rectus", name: "Rectus femoris", note: "The middle head and the only one that crosses the hip, so it also helps lift the thigh." },
    { id: "lateralis", name: "Vastus lateralis", note: "The outer head and the largest of the four." },
    { id: "medialis", name: "Vastus medialis", note: "The inner head, with the teardrop shape above the knee." },
    { id: "intermedius", name: "Vastus intermedius", deep: true, note: "Lies under the rectus femoris, against the thigh bone. It works in every knee-straightening movement." },
  ],
  hamstrings: [
    { id: "biceps-femoris", name: "Biceps femoris", note: "The outer hamstring. Its tendon is the cord on the outside of the back of the knee." },
    { id: "semitendinosus", name: "Semitendinosus", note: "The inner hamstring with a long, cord-like tendon." },
    { id: "semimembranosus", name: "Semimembranosus", note: "Lies beside and partly under the semitendinosus. It is broader and flatter." },
  ],
  calves: [
    { id: "gastrocnemius", name: "Gastrocnemius", note: "The two-headed muscle that gives the calf its shape. It works best with a straight knee." },
    { id: "soleus", name: "Soleus", note: "The flat muscle underneath. It takes over when the knee is bent, and it works all day while you stand." },
  ],
};

export const partsOf = (id) => PARTS[id] ?? [];
export const partOf = (id, partId) => partsOf(id).find((p) => p.id === partId) ?? null;
