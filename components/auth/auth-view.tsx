"use client";

import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  AlertCircle,
  CalendarDays,
  Plus,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";
import { Logo } from "@/components/ui/logo";
import { Character, CHARACTER_META } from "@/components/ui/character";
import { ScheduleImportModal } from "@/components/schedule/schedule-import-modal";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { useSettingsStore } from "@/lib/store/use-settings-store";
import { UserRole, CompanionCharacterId } from "@/lib/types";

type AuthMode = "welcome" | "login" | "signup" | "forgot_password" | "onboarding";

const COMPANIONS: CompanionCharacterId[] = ["pip", "milo", "lumi", "barnaby", "toby", "zara"];

export function AuthView() {
  const { login, signup, completeOnboarding, switchTestUser } = useAuthStore();
  const { setSelectedAvatarId, setHomeCompanionId } = useSettingsStore();

  const [mode, setMode] = useState<AuthMode>("welcome");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("lady@studydeck.edu");
  const [loginPassword, setLoginPassword] = useState("student123");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup form state
  const [firstName, setFirstName] = useState("Lady");
  const [lastName, setLastName] = useState("Caragay");
  const [signupEmail, setSignupEmail] = useState("lady@studydeck.edu");
  const [signupPassword, setSignupPassword] = useState("student123");
  const [confirmPassword, setConfirmPassword] = useState("student123");
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // General state
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Onboarding state (5 steps: Companion, Role, Interests, Goals, Setup Space)
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionCharacterId>("pip");
  const [scheduleImportOpen, setScheduleImportOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "IT / Computer Science",
  ]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    "Prepare for exams",
    "Build better study habits",
  ]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginEmail || !loginPassword) {
      setError("Please fill in both email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch {
      setError("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName || !lastName || !signupEmail || !signupPassword) {
      setError("Please fill in all required fields.");
      return;
    }
    if (signupPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters.");
    }
    setLoading(true);
    try {
      await signup({ firstName, lastName, email: signupEmail, password: signupPassword });
      setMode("onboarding");
    } catch {
      setError("Registration could not be completed.");
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleFinishOnboarding = () => {
    setSelectedAvatarId(selectedCompanion);
    setHomeCompanionId(selectedCompanion);
    completeOnboarding({
      role: selectedRole,
      interests: selectedInterests,
      studyGoals: selectedGoals,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-8 select-none">
      {/* Container - Consumer Card */}
      <div className="w-full max-w-sm sm:max-w-md bg-surface rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 flex flex-col transition-all">
        {/* Top Brand Mark */}
        <div className="flex flex-col items-center text-center mb-5">
          <Logo size="lg" showWordmark={true} tagline={true} />
        </div>

        {/* ================= WELCOME SCREEN ================= */}
        {mode === "welcome" && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="flex justify-center my-2">
              <Character
                character="pip"
                expression="hello"
                size="lg"
                speechBubble="Welcome! Ready to study?"
                bubblePosition="top"
              />
            </div>

            <div className="text-center">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Master Your Courses
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Spaced repetition flashcards, interactive study games, calendar sync, and friendly companion motivation.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 mt-2">
              <button
                onClick={() => {
                  setError(null);
                  setMode("signup");
                }}
                className="btn-tactile w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm border-blue-800 shadow-sm flex items-center justify-center gap-2"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setError(null);
                  setMode("login");
                }}
                className="btn-tactile w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm border-b-slate-300 dark:border-b-slate-700"
              >
                Log In
              </button>
            </div>

            <div className="relative my-2 flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-surface px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute">
                or quick start
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  switchTestUser(0);
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 font-semibold transition"
              >
                <span>🚀 Continue as Demo Student</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= LOGIN SCREEN ================= */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="flex flex-col gap-3.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Log In</h2>
              <button
                type="button"
                onClick={() => setMode("welcome")}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Back
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="student@studydeck.edu"
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setMode("forgot_password")}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type={showLoginPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-tactile mt-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm border-blue-800 shadow-sm disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Log In"}
            </button>

            <div className="text-center mt-2 text-xs text-slate-500">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode("signup");
                }}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {/* ================= SIGN UP SCREEN ================= */}
        {mode === "signup" && (
          <form onSubmit={handleSignup} className="flex flex-col gap-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Create Account
              </h2>
              <button
                type="button"
                onClick={() => setMode("welcome")}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Back
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-surface text-foreground focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-surface text-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="student@studydeck.edu"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-surface text-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type={showSignupPassword ? "text" : "password"}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-surface text-foreground focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600"
                >
                  {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-surface text-foreground focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-tactile mt-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm border-blue-800 shadow-sm disabled:opacity-50"
            >
              {loading ? "Creating..." : "Next: Choose Companion"}
            </button>

            <div className="text-center mt-2 text-xs text-slate-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode("login");
                }}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                Log In
              </button>
            </div>
          </form>
        )}

        {/* ================= FORGOT PASSWORD ================= */}
        {mode === "forgot_password" && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Reset Password</h2>
            <p className="text-xs text-slate-500">
              Enter your student email and we&apos;ll send recovery instructions.
            </p>

            {forgotSent ? (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password reset link sent to {forgotEmail}!</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="student@studydeck.edu"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-surface focus:outline-none"
                />
                <button
                  onClick={() => setForgotSent(true)}
                  className="btn-tactile w-full py-2 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold border-blue-800"
                >
                  Send Reset Link
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setForgotSent(false);
                setMode("login");
              }}
              className="text-xs text-center text-slate-500 hover:text-slate-700"
            >
              Return to login
            </button>
          </div>
        )}

        {/* ================= ONBOARDING ================= */}
        {mode === "onboarding" && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Step indicator */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>Step {onboardingStep} of 5</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={clsx(
                      "w-4 h-1.5 rounded-full transition-colors",
                      step === onboardingStep
                        ? "bg-blue-600 dark:bg-blue-400"
                        : step < onboardingStep
                        ? "bg-blue-300 dark:bg-blue-800"
                        : "bg-slate-200 dark:bg-slate-700"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* STEP 1: Choose Your Companion */}
            {onboardingStep === 1 && (
              <div className="flex flex-col gap-3">
                <div className="text-center">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Choose Your Study Companion
                  </h3>
                  <p className="text-xs text-slate-500">Pick your companion animal to accompany your study journey.</p>
                </div>

                {/* Companion Preview */}
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <Character
                    character={selectedCompanion}
                    expression="happy"
                    size="lg"
                    speechBubble={`I'm ${CHARACTER_META[selectedCompanion].name}! Let's learn together!`}
                    bubblePosition="top"
                  />
                  <div className="mt-2 text-center">
                    <span className="text-sm font-extrabold text-foreground">
                      {CHARACTER_META[selectedCompanion].name} {CHARACTER_META[selectedCompanion].title}
                    </span>
                    <p className="text-[11px] text-muted-text mt-0.5 max-w-xs">
                      {CHARACTER_META[selectedCompanion].trait}
                    </p>
                  </div>
                </div>

                {/* Companion Grid Picker */}
                <div className="grid grid-cols-3 gap-2">
                  {COMPANIONS.map((cid) => (
                    <button
                      key={cid}
                      type="button"
                      onClick={() => setSelectedCompanion(cid)}
                      className={clsx(
                        "p-2 rounded-xl border flex flex-col items-center gap-1 transition-all",
                        selectedCompanion === cid
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/60 shadow-sm ring-2 ring-blue-500"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <Character character={cid} expression="neutral" size="sm" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {CHARACTER_META[cid].name}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setOnboardingStep(2)}
                  className="btn-tactile mt-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 border-blue-800"
                >
                  <span>Select {CHARACTER_META[selectedCompanion].name} & Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* STEP 2: Role */}
            {onboardingStep === 2 && (
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    What best describes you?
                  </h3>
                  <p className="text-xs text-slate-500">Select your primary role on StudyDeck.</p>
                </div>

                <div className="flex flex-col gap-2">
                  {[
                    { id: "student", label: "Student", desc: "Enrolled in high school, college, or university" },
                    { id: "teacher", label: "Teacher / Educator", desc: "Teaching courses or curriculum" },
                    { id: "lifelong_learner", label: "Lifelong Learner", desc: "Self-studying professional skills" },
                  ].map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id as UserRole)}
                      className={clsx(
                        "p-3 rounded-xl border text-left transition-all",
                        selectedRole === role.id
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-medium ring-2 ring-blue-500/50"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      <div className="text-xs font-bold">{role.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {role.desc}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(1)}
                    className="w-1/3 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(3)}
                    className="btn-tactile w-2/3 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 border-blue-800"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Interests */}
            {onboardingStep === 3 && (
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    What are you studying?
                  </h3>
                  <p className="text-xs text-slate-500">Select all areas of focus that apply.</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    "IT / Computer Science",
                    "Engineering",
                    "Business",
                    "Health Sciences",
                    "Education",
                    "Arts & Design",
                    "Law",
                    "Other",
                  ].map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={clsx(
                          "p-2.5 rounded-xl border text-left text-xs font-semibold transition-colors",
                          isSelected
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(2)}
                    className="w-1/3 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(4)}
                    className="btn-tactile w-2/3 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 border-blue-800"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Goals */}
            {onboardingStep === 4 && (
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    What is your study goal?
                  </h3>
                  <p className="text-xs text-slate-500">Helps calibrate your daily targets and reminders.</p>
                </div>

                <div className="flex flex-col gap-2">
                  {[
                    "Prepare for upcoming exams",
                    "Improve course grades",
                    "Build a daily 30-min study habit",
                    "Master terms through spaced repetition",
                  ].map((goal) => {
                    const isSelected = selectedGoals.includes(goal);
                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleGoal(goal)}
                        className={clsx(
                          "p-2.5 rounded-xl border text-left text-xs font-semibold transition-colors flex items-center justify-between",
                          isSelected
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        <span>{goal}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(3)}
                    className="w-1/3 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(5)}
                    className="btn-tactile w-2/3 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 border-blue-800 shadow-sm"
                  >
                    <span>Next: Set Up Space</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Set Up Study Space */}
            {onboardingStep === 5 && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Set Up Your Study Space
                  </h3>
                  <p className="text-xs text-slate-500">
                    Import your class schedule or start with blank course decks.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Option A: Import Class Schedule */}
                  <div className="p-4 rounded-2xl border-2 border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 text-left space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-blue-600" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                        Option A (Recommended)
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">Import Class Schedule</h4>
                    <p className="text-xs text-muted-text leading-relaxed">
                      Upload or paste your enrollment schedule to automatically create subjects and populate recurring calendar events.
                    </p>
                    <button
                      type="button"
                      onClick={() => setScheduleImportOpen(true)}
                      className="btn-tactile mt-2 w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border-blue-800 shadow-sm"
                    >
                      <span>Import Schedule with Toby</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Option B: Add Manually */}
                  <div className="p-4 rounded-2xl border border-border bg-surface text-left space-y-2">
                    <div className="flex items-center gap-2">
                      <Plus className="w-5 h-5 text-muted-text" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-text">
                        Option B
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">Add Subjects Manually</h4>
                    <p className="text-xs text-muted-text leading-relaxed">
                      Skip schedule import for now. You can create subjects, modules, and flashcards anytime.
                    </p>
                    <button
                      type="button"
                      onClick={handleFinishOnboarding}
                      className="btn-tactile w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-surface-muted text-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition border-b-slate-400"
                    >
                      <span>Continue to Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schedule Import Modal during onboarding */}
      <ScheduleImportModal
        isOpen={scheduleImportOpen}
        onClose={() => setScheduleImportOpen(false)}
        onSuccess={handleFinishOnboarding}
        userId="usr_onboarding"
      />
    </div>
  );
}

export default AuthView;
