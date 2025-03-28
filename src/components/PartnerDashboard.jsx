import React, { useState, useMemo, useEffect } from "react";
import { format, addDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  Calendar,
  ChevronRight,
  Frown,
  AppWindowMac,
  HeartPulse,
  Smile,
  Angry,
  Gamepad2,
  ShoppingBag,
  MessageSquare,
  Coffee,
  HeartHandshake,
  Zap,
  Moon,
  ChevronDown,
  ChevronUp,
  Heart,
  Handshake,
  Sun,
  LayoutDashboard,
  Home,
  GraduationCap,
  ActivitySquare,
  ClipboardList,
  Stethoscope,
  Bot,
} from "lucide-react";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
const server_url = import.meta.env.VITE_SERVER_URL;
const local_url = "http://localhost:3000/";

const toggleSidebar = () => {
  setSidebarVisible(!sidebarVisible);
};

const moodOptions = [
  { name: "Happy", icon: Smile },
  { name: "Sad", icon: Frown },
  { name: "Calm", icon: Coffee },
  { name: "Angry", icon: Angry },
  { name: "Tired", icon: Moon },
  { name: "Energized", icon: Zap },
];

const moodSeverityOptions = [
  { name: "Low", value: "low" },
  { name: "Medium", value: "medium" },
  { name: "High", value: "high" },
];

const symptomOptions = [
  "Irregular menstruation (Oligomenorrhea)",
  "Heavy menstrual bleeding (Menorrhagia)",
  "Excessive Hair growth (face, body - including on back, belly, and chest)",
  "Acne (face, chest, and upper back)",
  "Weight gain",
  "Skin darkening (Neck, in the groin, and under the breasts)",
  "Skipped or absence of menstruation (Amenorrhea)",
  "Hair loss (hair on the scalp gets thinner and fall out)",
  "Skin Tags (Acrochordons)",
  "Sleep Disturbances",
  "Mood Disorders",
  "Infertility",
  "Pelvic Pain",
  "Headaches",
  "Fatigue",
  "Oily Skin or Scalp",
  "Appetite Changes or Cravings",
  "Bladder Issues",
  "Reduced Libido",
  "Hoarseness or Voice Changes",
  "Associated Metabolic and Long-Term Risks",
  "Insulin Resistance",
  "Dyslipidemia",
  "Cardiovascular Risks",
  "Endometrial Hyperplasia",
  "Diagnostic Clues (Not Symptoms, but Relevant)",
  "Ovarian Morphology",
  "Lab Abnormalities",
];

const symptomSeverityOptions = ["None", "Mild", "Moderate", "Severe"];

const sleepQualityOptions = ["Poor", "Fair", "Good", "Excellent"];
const genAI = new GoogleGenerativeAI("AIzaSyDC_nwnZggf8CYID3qvJfazEE8KBnqd9Ro");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export function Diagnosis() {
  const navigate = useNavigate();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [cycleDuration, setCycleDuration] = useState("");
  const [lastPeriodStart, setLastPeriodStart] = useState("");
  const [lastPeriodDuration, setLastPeriodDuration] = useState("");
  const [moodTypes, setMoodTypes] = useState([]);
  const [moodSeverity, setMoodSeverity] = useState("");
  const [moodDate, setMoodDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [symptoms, setSymptoms] = useState([]);
  const [symptomSeverities, setSymptomSeverities] = useState({});
  const [symptomDate, setSymptomDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [sleepDuration, setSleepDuration] = useState("");
  const [sleepQuality, setSleepQuality] = useState("");
  const [nextPeriodPrediction, setNextPeriodPrediction] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    cycleInfo: true,
    moodTracking: true,
    symptomTracking: true,
    sleepTracking: true,
    healthTips: true,
  });
  const [pcosReport, setPcosReport] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHealthTips, setShowHealthTips] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem("darkMode", newMode.toString());
      return newMode;
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case "cycleDuration":
        setCycleDuration(value);
        break;
      case "lastPeriodStart":
        setLastPeriodStart(value);
        break;
      case "lastPeriodDuration":
        setLastPeriodDuration(value);
        break;
      case "moodDate":
        setMoodDate(value);
        break;
      case "symptomDate":
        setSymptomDate(value);
        break;
      case "sleepDuration":
        setSleepDuration(value);
        break;
      case "sleepQuality":
        setSleepQuality(value);
        break;
      default:
        break;
    }
  };

  const handleMoodTypeChange = (moodName) => {
    setMoodTypes((prev) =>
      prev.includes(moodName)
        ? prev.filter((mood) => mood !== moodName)
        : [...prev, moodName]
    );
  };

  const handleSymptomChange = (symptom) => {
    setSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSymptomSeverityChange = (symptom, severity) => {
    setSymptomSeverities((prev) => ({
      ...prev,
      [symptom]: severity,
    }));
  };

  const predictNextPeriod = () => {
    if (lastPeriodStart && cycleDuration) {
      const nextPeriodDate = addDays(
        new Date(lastPeriodStart),
        parseInt(cycleDuration)
      );
      setNextPeriodPrediction(format(nextPeriodDate, "yyyy-MM-dd"));
    }
  };

  const handleSubmit = async () => {
    if (symptoms.length === 0) {
      setError("Please select at least one symptom");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Format symptoms with severities
      const formattedSymptoms = symptoms
        .map(
          (symptom) =>
            `${symptom} (${
              symptomSeverities[symptom] || "No severity specified"
            })`
        )
        .join(", ");

      const prompt = `Analyze the following menstrual symptoms for potential PCOS:\n${formattedSymptoms}\n
        Provide a detailed report including:
        1. Potential PCOS indicators
        2. Likelihood percentage estimation
        3. Recommended medical tests
        4. Lifestyle recommendations
        5. When to consult a doctor
        Format the response in markdown with clear sections.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const sections = await text.split(/(## .+)/).filter(Boolean);

      setPcosReport(sections);
      setShowHealthTips(true);
    } catch (err) {
      console.error("Error generating report:", err);
      setError("Failed to generate report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderSection = (title, content, section) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => toggleSection(section)}
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {title}
        </h3>
        {expandedSections[section] ? (
          <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        )}
      </div>
      {expandedSections[section] && <div className="mt-4">{content}</div>}
    </div>
  );

  const generateHealthTips = useMemo(() => {
    const tips = [];

    if (cycleDuration) {
      const cycleDurationInt = parseInt(cycleDuration);
      if (cycleDurationInt < 21) {
        tips.push(
          "Your cycle is shorter than average. Consider consulting with a healthcare professional to ensure everything is normal."
        );
      } else if (cycleDurationInt > 35) {
        tips.push(
          "Your cycle is longer than average. This can be normal, but you may want to discuss it with your doctor."
        );
      } else {
        tips.push(
          "Your cycle length is within the normal range. Keep tracking to notice any changes."
        );
      }
    }

    if (lastPeriodDuration) {
      const periodDuration = parseInt(lastPeriodDuration);
      if (periodDuration > 7) {
        tips.push(
          "Your period duration is longer than average. If this is consistent, consider discussing it with your healthcare provider."
        );
      } else if (periodDuration < 3) {
        tips.push(
          "Your period duration is shorter than average. This can be normal, but keep an eye on it and consult your doctor if you're concerned."
        );
      }
    }

    if (moodTypes.includes("Sad") || moodTypes.includes("Angry")) {
      tips.push(
        "Mood swings can be common during your cycle. Try relaxation techniques or gentle exercise to help manage your emotions."
      );
    }
    if (moodTypes.includes("Tired")) {
      tips.push(
        "Fatigue is common during menstruation. Ensure you're getting enough rest and consider iron-rich foods to combat tiredness."
      );
    }

    if (symptoms.includes("Lower Abdomen Cramps")) {
      tips.push(
        "For menstrual cramps, try using a heating pad or taking a warm bath to alleviate discomfort."
      );
    }
    if (symptoms.includes("Bloating")) {
      tips.push(
        "To reduce bloating, try to avoid salty foods and increase your water intake."
      );
    }
    if (symptoms.includes("Headaches")) {
      tips.push(
        "Headaches can be common during your cycle. Stay hydrated and consider over-the-counter pain relievers if needed."
      );
    }
    if (symptoms.includes("Sleep Disruption")) {
      tips.push(
        "To improve sleep during your cycle, try to maintain a consistent sleep schedule and create a relaxing bedtime routine."
      );
    }

    if (sleepDuration) {
      const sleepDurationInt = parseFloat(sleepDuration);
      if (sleepDurationInt < 7) {
        tips.push(
          "You might not be getting enough sleep. Aim for 7-9 hours of sleep per night for optimal health and well-being."
        );
      } else if (sleepDurationInt > 9) {
        tips.push(
          "You're getting more sleep than average. While this can be normal, excessive sleep might indicate other health issues. Consider discussing with your doctor if this persists."
        );
      } else {
        tips.push(
          "Your sleep duration is within the recommended range. Keep maintaining this healthy sleep pattern!"
        );
      }
    }

    if (sleepQuality === "Poor" || sleepQuality === "Fair") {
      tips.push(
        "To improve sleep quality, try establishing a consistent bedtime routine, avoiding screens before bed, and creating a comfortable sleep environment."
      );
    }

    tips.push(
      "Stay hydrated by drinking plenty of water throughout your cycle."
    );
    tips.push(
      "Regular exercise can help alleviate many menstrual symptoms and improve overall well-being."
    );
    tips.push(
      "A balanced diet rich in fruits, vegetables, and whole grains can help support your body during your cycle."
    );

    return tips;
  }, [
    cycleDuration,
    lastPeriodDuration,
    moodTypes,
    sleepDuration,
    sleepQuality,
    symptoms,
  ]);

  return (
    <div className={`flex h-screen ${darkMode ? "dark" : ""}`}>
      {/* Sidebar */}
      <aside
        className={`bg-pink-100 dark:bg-gray-800 w-64 min-h-screen p-4 fixed transition-all duration-300 ease-in-out ${
          sidebarVisible ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ zIndex: 40 }}
      >
        <div className="px-4 py-4 flex flex-col space-y-2">
          <h1 className="text-2xl font-bold text-pink-600 dark:text-pink-400 ">
          LunaLady AI          </h1>
          <SidebarLink
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            onClick={() => navigate("/dashboard")}
          />
          <SidebarLink
            icon={<Home size={20} />}
            label="Home"
            onClick={() => navigate("/")}
          />
          <SidebarLink
            icon={<GraduationCap size={20} />}
            label="Education"
            onClick={() => navigate("/blogs")}
          />
          <SidebarLink
            icon={<ShoppingBag size={20} />}
            label="Shop"
            onClick={() => navigate("/Ecom")}
          />
          <SidebarLink
            icon={<ActivitySquare size={20} />}
            label="Track Your Health"
            onClick={() => navigate("/tracker")}
          />
                    <SidebarLink
            icon={<ClipboardList size={20} />}
            label="PCOS Diagnosis"
            onClick={() => navigate("/partner")}
            active
          />
          <SidebarLink
            icon={<Stethoscope size={20} />}
            label="Expert Consultation"
            onClick={() => navigate("/consultations")}
          />
          <SidebarLink
            icon={<Bot size={20} />}
            label="Eve"
            onClick={() => navigate("/ChatBot")}
          />
          <SidebarLink
            icon={<HeartPulse size={20} />}
            label="HealthLens"
            onClick={() => navigate("/symptomsanalyzer")}
          />
          <SidebarLink
            icon={<AppWindowMac size={20} />}
            label="Parent's Dashboard"
            onClick={() => navigate("/parents")}
          />
          <SidebarLink
            icon={<MessageSquare size={20} />}
            label="Forums"
            onClick={() => navigate("/forums")}
          />
          <SidebarLink
            icon={<HeartHandshake size={20} />}
            label="ShareJoy"
            onClick={() => window.open("https://thepadproject.org/donate/")}
          />
          <SidebarLink
            icon={<Gamepad2 size={20} />}
            label="Bliss"
            onClick={() =>
              window.open("https://she-syncgame.vercel.app/", "_blank")
            }
          />
          <SidebarLink
            icon={<Handshake size={20} />}
            label="NGO's"
            onClick={() =>
              window.open(
                "https://www.hercircle.in/engage/wellness/reproductive-health/5-organisations-working-towards-eradicating-period-poverty-2239.html",
                "_blank"
              )
            }
          />
        </div>
      </aside>

      <button
        onClick={toggleSidebar}
        className="fixed left-0 top-0 z-10 p-2 bg-pink-600 text-white rounded-r-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50"
        style={{
          transform: sidebarVisible ? "translateX(256px)" : "translateX(0)",
        }}
        aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
      >
        <ChevronRight
          size={14}
          className={`transition-transform duration-300 ${
            sidebarVisible ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {/* Main Content */}
      <main
        className={`flex-1 p-6 overflow-auto bg-white dark:bg-gray-900 transition-all duration-300 ease-in-out ${
          sidebarVisible ? "ml-64" : "ml-0"
        }`}
      >
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-pink-600 dark:text-pink-400">
              Diagnosis
            </h2>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="bg-pink-50 dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-8">
            <div className="text-center mb-8">
              <p className="text-black dark:text-gray-300">Diagnos</p>
            </div>

            {renderSection(
              <span style={{ color: "#db0085" }}>Symptom Tracking</span>,
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Symptoms
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {symptomOptions.map((symptom) => (
                      <label key={symptom} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={symptoms.includes(symptom)}
                          onChange={() => handleSymptomChange(symptom)}
                          className="form-checkbox text-pink-500"
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                          {symptom}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {symptoms.map((symptom) => (
                  <div key={symptom} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {symptom} Severity
                    </label>
                    <select
                      value={symptomSeverities[symptom] || ""}
                      onChange={(e) =>
                        handleSymptomSeverityChange(symptom, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 dark:bg-gray-700  text-white dark:text-white"
                    >
                      <option value="">Select Severity</option>
                      {symptomSeverityOptions.map((severity) => (
                        <option key={severity} value={severity}>
                          {severity}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white-700 dark:text-gray-300">
                    Date of Symptoms
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="symptomDate"
                      value={symptomDate}
                      onChange={handleInputChange}
                      className="text-white w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 dark:bg-gray-700 dark:text-white"
                    />
                    <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>,
              "symptomTracking"
            )}

            {showHealthTips &&
              renderSection(
                <span style={{ color: "#db0085" }}>PCOS Analysis Report</span>,
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
                      <p className="mt-2 text-pink-600">
                        Analyzing symptoms...
                      </p>
                    </div>
                  ) : error ? (
                    <div className="text-red-500 p-4 rounded bg-red-50 dark:bg-red-900/20">
                      {error}
                    </div>
                  ) : (
                    <div className="prose dark:prose-invert max-w-none">
                      {pcosReport.map((section, index) => (
                        <div key={index}>
                          {section.startsWith("## ") ? (
                            <h2 className="text-xl font-bold text-pink-600 dark:text-pink-400 mb-2">
                              {section.replace("## ", "")}
                            </h2>
                          ) : (
                            <ReactMarkdown>{section}</ReactMarkdown>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>,
                "healthTips"
              )}
            <button
              onClick={handleSubmit}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-medium py-3 px-4 rounded-md text-lg transition duration-300 shadow-md"
            >
              Submit Tracking Data
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

const SidebarLink = ({ icon, label, onClick, active = false }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 w-full px-2 py-2 rounded-lg transition-colors ${
        active
          ? "bg-pink-200 dark:bg-pink-900 text-pink-800 dark:text-pink-200"
          : "text-gray-900 dark:text-gray-300 hover:bg-pink-100 dark:hover:bg-gray-700"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
