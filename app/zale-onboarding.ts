export const zaleOnboarding = {
  gender: {
    question: "What's your gender?",
    options: ["Male", "Female"],
    multiple: false,
  },
  socialPersonality: {
    question: "What are you usually like around your people?",
    options: ["Chill", "Funny", "Talkative", "Quiet observer", "Energetic", "Caring"],
    multiple: true,
  },
  personality: {
    question: "How would you describe yourself most days?",
    options: ["Easygoing", "Confident", "Creative", "Lowkey", "Energetic", "Thoughtful", "Curious", "Adventurous"],
    multiple: true,
  },
  connection: {
    question: "How do you usually stay close to your people?",
    options: ["Messaging throughout the day", "Long calls", "Random pictures and videos", "Memes and funny stuff", "Voice notes", "Hanging out in person", "Keeping up quietly", "Checking in every now and then"],
    multiple: true,
  },
  circle: {
    question: "What does your circle usually look like?",
    options: ["A few really close people", "A small circle, but I know plenty of people", "A pretty big friend group", "Different circles for different parts of my life", "I'm always meeting new people"],
    multiple: false,
  },
  interests: {
    question: "What are you into?",
    options: ["Music", "Fashion", "Football", "Basketball", "Gaming", "Movies & TV", "Photography", "Art", "Fitness", "Food", "Travel", "Tech", "Books", "Beauty", "Cars", "Dance", "Content Creation", "Business", "Faith", "Nature", "Parties", "Anime", "Design", "Other"],
    multiple: true,
  },
  energy: {
    question: "What kind of energy do you naturally bring?",
    options: ["Calm", "Warm", "Lively", "Mysterious", "Bold", "Social", "Expressive", "Grounded"],
    multiple: true,
    max: 3,
  },
} as const;

export const zaleVibes = [
  "Chill",
  "Social",
  "Lowkey",
  "Hyped",
  "Focused",
  "Adventurous",
  "Creative",
  "Outside",
  "Cozy",
  "Unbothered",
  "Talkative",
  "Thoughtful",
  "Warm",
  "Bold",
  "Expressive",
  "Grounded",
] as const;

export type ZaleVibe = (typeof zaleVibes)[number];
