import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://crm-1-5el5.onrender.com";

const RegisterMultiTenant = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 2.5: Website Choice, 3: Company & Password
  const [loading, setLoading] = useState(false);
  const [industries, setIndustries] = useState([]);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [websiteChoice, setWebsiteChoice] = useState(""); // "existing" or "builder"
  const [existingWebsite, setExistingWebsite] = useState(""); // URL for existing website
  const [phoneNumber, setPhoneNumber] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [country, setCountry] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Load industries on mount
  React.useEffect(() => {
    fetchIndustries();
  }, []);

  const fetchIndustries = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/industries`);
      setIndustries(response.data);
    } catch (error) {
      console.log("Failed to load industries");
    }
  };

  // ============================================================
  // STEP 1: Send OTP
  // ============================================================
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!email) {
        toast.error("Please enter your email");
        return;
      }

      const response = await axios.post(`${API_URL}/api/auth/send-otp`, {
        email,
      });

      setVerificationToken(response.data.verificationToken);
      setStep(2);
      toast.success("OTP sent to your email");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // STEP 2: Verify OTP
  // ============================================================
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!otp || otp.length !== 6) {
        toast.error("Please enter a valid 6-digit OTP");
        return;
      }

      const response = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        email,
        otp,
      });

      setVerificationToken(response.data.verificationToken);
      setStep(2.5);
      toast.success("Email verified successfully");
    } catch (error) {
      toast.error(error.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // STEP 3: Register Company & Create Super Admin
  // ============================================================
  const handleRegisterCompany = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!fullName || !companyName || !displayName || !password || !phoneNumber || !companySize || !country) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (!termsAccepted) {
        toast.error("Please accept the Terms of Service");
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }

      if (!industry) {
        toast.error("Please select your business type");
        return;
      }

      if (industry === "others" && !customIndustry.trim()) {
        toast.error("Please specify your business type");
        return;
      }

      const finalIndustry = industry === "others" ? customIndustry : industry;

      const response = await axios.post(
        `${API_URL}/api/auth/register-company`,
        {
          email,
          password,
          name: fullName,
          companyName,
          displayName,
          industry: finalIndustry,
          phoneNumber,
          companySize,
          country,
          jobTitle,
          verificationToken,
        },
      );

      // Save token to localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("company", JSON.stringify(response.data.company));

      toast.success(response.data.message);

      // Redirect to dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (error) {
      const errorCode = error.response?.data?.code;
      const errorMsg = error.response?.data?.error;

      // Handle specific error codes
      if (errorCode === "EMAIL_ALREADY_REGISTERED") {
        toast.error(errorMsg || "This email is already registered. Please login or use a different email.");
        setStep(1);
        setEmail("");
        setOtp("");
        setVerificationToken("");
      } else if (errorCode === "COMPANY_NAME_TAKEN") {
        toast.error(errorMsg || "Company name is already taken. Please choose a different name.");
        setCompanyName("");
      } else {
        toast.error(errorMsg || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        {/* STEP 1: Email & OTP */}
        {step === 1 && (
          <>
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
              Create Account
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Step 1 of 3: Email Verification
            </p>

            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                   type="email"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-600"
                   placeholder="your@email.com"
                   disabled={step > 1}
                 />
              </div>

              <button
                type="submit"
                disabled={loading || step > 1}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          </>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 2 && (
          <>
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
              Verify Email
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Step 2 of 3: Enter OTP sent to {email}
            </p>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  6-Digit OTP
                </label>
                <input
                   type="text"
                   value={otp}
                   onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                   maxLength="6"
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-center text-2xl tracking-widest bg-white text-gray-900 placeholder-gray-600"
                   placeholder="000000"
                 />
                <p className="text-xs text-gray-500 mt-2">
                  Check your email for the OTP (expires in 10 minutes)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg transition"
              >
                Back
              </button>
            </form>
          </>
        )}

        {/* STEP 2.5: Website Choice */}
        {step === 2.5 && (
          <>
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
              Choose Your Website
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Do you have an existing website or want to build one on our platform?
            </p>

            <div className="space-y-4">
              {/* Option 1: Existing Website */}
              <div
                onClick={() => setWebsiteChoice("existing")}
                className={`border-2 rounded-lg p-6 cursor-pointer transition ${
                  websiteChoice === "existing"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-white hover:border-gray-400"
                }`}
              >
                <input
                  type="radio"
                  name="website"
                  value="existing"
                  checked={websiteChoice === "existing"}
                  onChange={(e) => setWebsiteChoice(e.target.value)}
                  className="mr-3"
                />
                <label className="font-semibold text-gray-800 cursor-pointer">
                  📱 I have an existing website
                </label>
                <p className="text-sm text-gray-600 mt-2">
                  Enter your website URL
                </p>
              </div>

              {websiteChoice === "existing" && (
                <input
                  type="url"
                  placeholder="https://www.example.com"
                  value={existingWebsite}
                  onChange={(e) => setExistingWebsite(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-600"
                />
              )}

              {/* Option 2: Build with Drag & Drop */}
              <div
                onClick={() => setWebsiteChoice("builder")}
                className={`border-2 rounded-lg p-6 cursor-pointer transition ${
                  websiteChoice === "builder"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-white hover:border-gray-400"
                }`}
              >
                <input
                  type="radio"
                  name="website"
                  value="builder"
                  checked={websiteChoice === "builder"}
                  onChange={(e) => setWebsiteChoice(e.target.value)}
                  className="mr-3"
                />
                <label className="font-semibold text-gray-800 cursor-pointer">
                  🎨 Build with our Website Builder
                </label>
                <p className="text-sm text-gray-600 mt-2">
                  Create a professional website with drag-and-drop (No coding!)
                </p>
              </div>

              {/* Continue Button */}
              <button
                onClick={() => {
                  if (!websiteChoice) {
                    toast.error("Please choose an option");
                    return;
                  }
                  if (websiteChoice === "existing" && !existingWebsite) {
                    toast.error("Please enter your website URL");
                    return;
                  }
                  setStep(3);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Continue →
              </button>
            </div>
          </>
        )}

        {/* STEP 3: Company & Password */}
        {step === 3 && (
          <>
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
              Create Company
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Step 3 of 3: Setup Your Workspace
            </p>

            <form onSubmit={handleRegisterCompany} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900"
                >
                  <option value="">Select your business type</option>
                  {industries.map((ind) => {
                    const industryId = typeof ind === "string" ? ind : ind.id;
                    const industryName =
                      typeof ind === "string"
                        ? ind.charAt(0).toUpperCase() + ind.slice(1)
                        : ind.name ||
                          industryId.charAt(0).toUpperCase() +
                            industryId.slice(1);
                    return (
                      <option key={industryId} value={industryId}>
                        {industryName}
                      </option>
                    );
                  })}
                  <option value="others">Others</option>
                </select>
                {!industry && (
                  <p className="text-xs text-red-500 mt-1">
                    Please select a business type
                  </p>
                )}
              </div>

              {industry === "others" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Please specify your business type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-600"
                    placeholder="e.g., Logistics, Media, Tourism, etc."
                  />
                  {!customIndustry && industry === "others" && (
                    <p className="text-xs text-red-500 mt-1">
                      Business type is required
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-600"
                  placeholder="Your name"
                  />
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                   Company Slug
                  </label>
                  <input
                   type="text"
                   value={companyName}
                   onChange={(e) =>
                     setCompanyName(
                       e.target.value.toLowerCase().replace(/\s+/g, "-"),
                     )
                   }
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-600"
                   placeholder="your-company"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                   Use lowercase and hyphens (e.g., ishita-crm)
                  </p>
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                   Company Display Name
                  </label>
                  <input
                   type="text"
                   value={displayName}
                   onChange={(e) => setDisplayName(e.target.value)}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-600"
                   placeholder="Ishita's CRM"
                  />
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                   Password
                  </label>
                  <input
                   type="password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-600"
                   placeholder="••••••••"
                  />
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                   Confirm Password
                  </label>
                  <input
                   type="password"
                   value={confirmPassword}
                   onChange={(e) => setConfirmPassword(e.target.value)}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-600"
                   placeholder="••••••••"
                  />
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                   Job Title <span className="text-gray-500 font-normal">(Optional)</span>
                  </label>
                  <input
                   type="text"
                   value={jobTitle}
                   onChange={(e) => setJobTitle(e.target.value)}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-600"
                   placeholder="e.g., HR Manager, Sales Lead (optional)"
                  />
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                   Phone Number
                  </label>
                  <input
                   type="tel"
                   value={phoneNumber}
                   onChange={(e) => setPhoneNumber(e.target.value)}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-600"
                   placeholder="+1 (555) 000-0000"
                  />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900"
                >
                   <option value="">Select your country</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="India">India</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Japan">Japan</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Size
                </label>
                <select
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900"
                >
                   <option value="">Select company size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1,000 employees</option>
                  <option value="1000+">1,000+ employees</option>
                </select>
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:underline font-semibold">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="#" className="text-blue-600 hover:underline font-semibold">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Creating Company..." : "Create Company & Account"}
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg transition"
              >
                Back
              </button>
            </form>
          </>
        )}

        <p className="text-center text-gray-600 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 hover:underline font-semibold"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterMultiTenant;
