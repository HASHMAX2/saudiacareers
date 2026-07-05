import { sendSuccess } from "../utils/ApiResponse.js";

const CAREER_TIPS = [
  {
    id: 1,
    title: "KSA hiring index — Q2 2026",
    excerpt:
      "Where demand is climbing across Saudi Arabia, and the roles employers are chasing this quarter.",
    views: 918,
    date: "03 Jul",
    color: "#F44336",
  },
  {
    id: 2,
    title: "The smartest career move starts before you resign",
    excerpt:
      "People who transition smoothly rarely start preparing after they decide to leave.",
    views: 412,
    date: "02 Jul",
    color: "#1E9E6A",
  },
  {
    id: 3,
    title: "Should your nationality be on your CV?",
    excerpt:
      "A quietly asked question with an honest, region-specific answer.",
    views: 305,
    date: "02 Jul",
    color: "#D9992B",
  },
  {
    id: 4,
    title: "UAE hiring index — Q2 2026",
    excerpt:
      "Steady momentum and the sectors adding headcount fastest right now.",
    views: 288,
    date: "01 Jul",
    color: "#7C3AED",
  },
  {
    id: 5,
    title: "Changing industries? Rewrite your CV",
    excerpt:
      "A career switch needs a different kind of CV than a straight-line promotion.",
    views: 236,
    date: "01 Jul",
    color: "#B03A63",
  },
  {
    id: 6,
    title: "Salary negotiation in the Gulf",
    excerpt:
      "What is (and is not) on the table when the offer finally lands.",
    views: 174,
    date: "30 Jun",
    color: "#0E7C72",
  },
];

export function getCareerTips(_req, res) {
  return sendSuccess(res, {
    message: "Career tips",
    data: CAREER_TIPS,
  });
}
