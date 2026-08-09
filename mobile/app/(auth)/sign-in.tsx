import { useSignIn } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Linking from "expo-linking";

type ResetStep = "email" | "code" | "password";

export default function SignIn() {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();

  const finalizeSignIn = async () => {
    await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          console.log(session.currentTask);
          return;
        }

        router.replace(decorateUrl("/") as any);
      },
    });
  };

  const [mode, setMode] = useState<"signIn" | "reset">("signIn");
  const [resetStep, setResetStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [showSupportMessage, setShowSupportMessage] = useState(false);
  const [signInError, setSignInError] = useState("");

  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [emailVerificationProcess, setEmailVerificationProcess] =
    useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState("");

  const subject = encodeURIComponent("Request for Account Ban Review");

  const body = encodeURIComponent(`Dear ShoeHub Support Team,

I am unable to access my ShoeHub account because it has been banned.

I believe this may have been an error and would appreciate it if you could review my account. If any additional information or verification is required, please let me know and I will be happy to provide it.

Account Email: ${email}

Thank you for your time and assistance. I look forward to your response.

Kind regards,
`);

  const onSignInPress = async () => {
    setSignInError("");
    setShowSupportMessage(false);
    try {
      if (!email.trim()) {
        setSignInError("Please enter your email.");
        return;
      }

      if (!password.trim()) {
        setSignInError("Please enter your password.");
        return;
      }

      if (isLoading) return;

      const { error } = await signIn.password({
        emailAddress: email,
        password,
      });

      if (
        error?.message?.toLowerCase().includes("banned") ||
        error?.message?.toLowerCase().includes("locked")
      ) {
        setShowSupportMessage(true);
      }
      if (error) {
        setSignInError(error.message);
        return;
      }

      if (signIn.status === "complete") {
        await finalizeSignIn();
      } else if (signIn.status === "needs_second_factor") {
        const emailFactor = signIn.supportedSecondFactors.find(
          (factor) => factor.strategy === "email_code",
        );

        if (emailFactor) {
          await signIn.mfa.sendEmailCode();
          setShowEmailVerification(true);
        }
      } else if (signIn.status === "needs_client_trust") {
        const emailCodeFactor = signIn.supportedSecondFactors.find(
          (factor) => factor.strategy === "email_code",
        );

        if (emailCodeFactor) {
          await signIn.mfa.sendEmailCode();
          setShowEmailVerification(true);
        }
      } else {
        console.error("Sign-In attempt not complete : \n", signIn);
      }
    } catch (err: any) {
      // When Clerk rejects the login, it jumps down here.
      console.error("Sign in error:", JSON.stringify(err, null, 2));

      if (err.errors && err.errors.length > 0) {
        setSignInError(err.errors[0].longMessage || err.errors[0].message);
      } else {
        setSignInError("Failed to sign in. Please check your credentials.");
      }
    }
  };

  const startResetPassword = async () => {
    if (resetLoading) return;

    if (!email.trim()) {
      setResetError("Enter your email address first.");
      return;
    }

    setResetLoading(true);
    setResetError("");
    setResetMessage("");

    try {
      const { error } = await signIn.create({ identifier: email.trim() });
      if (error) {
        setResetError(error.message);
        return;
      }

      const sent = await signIn.resetPasswordEmailCode.sendCode();
      if (sent.error) {
        setResetError(sent.error.message);
        return;
      }

      setResetStep("code");
      setResetMessage(`We sent a reset code to ${email.trim()}.`);
    } finally {
      setResetLoading(false);
    }
  };

  const verifyResetCode = async () => {
    if (resetLoading) return;
    if (!code.trim()) {
      setResetError("Enter the reset code sent to your email.");
      return;
    }

    setResetLoading(true);
    setResetError("");

    try {
      const { error } = await signIn.resetPasswordEmailCode.verifyCode({
        code: code.trim(),
      });

      if (error) {
        setResetError(error.message);
        return;
      }

      setResetStep("password");
      setResetMessage("Code verified. Set a new password.");
    } finally {
      setResetLoading(false);
    }
  };

  const submitNewPassword = async () => {
    if (resetLoading) return;
    if (!newPassword.trim()) {
      setResetError("Enter a new password.");
      return;
    }

    setResetLoading(true);
    setResetError("");

    try {
      const { error } = await signIn.resetPasswordEmailCode.submitPassword({
        password: newPassword,
        signOutOfOtherSessions: true,
      });

      if (error) {
        setResetError(error.message);
        return;
      }

      if (signIn.status === "complete") {
        await finalizeSignIn();
        return;
      }

      setResetError("Password was updated, but sign-in is not complete.");
    } finally {
      setResetLoading(false);
    }
  };

  const verifyEmailCode = async () => {
    if (emailVerificationProcess) return;
    try {
      setEmailVerificationProcess(true);
      setVerificationError("");

      const { error } = await signIn.mfa.verifyEmailCode({
        code: verificationCode.trim(),
      });

      if (error) {
        setEmailVerificationProcess(false);
        setVerificationCode("");
        setVerificationError(error.message);
        return;
      }

      if (signIn.status === "complete") {
        setEmailVerificationProcess(false);
        await finalizeSignIn();
      }
    } catch (err: any) {
      setEmailVerificationProcess(false);
      setVerificationError(
        err?.errors?.[0]?.longMessage ||
          err?.errors?.[0]?.message ||
          "Invalid verification code",
      );
    }
  };

  const openResetFlow = () => {
    setMode("reset");
    setResetStep("email");
    setResetError("");
    setResetMessage("");
    setCode("");
    setNewPassword("");
  };

  const closeResetFlow = () => {
    setMode("signIn");
    setResetStep("email");
    setResetError("");
    setResetMessage("");
    setCode("");
    setNewPassword("");
  };

  const isLoading = fetchStatus === "fetching";

  if (showEmailVerification) {
    return (
      <View className="flex-1 justify-center px-6 bg-stone-50">
        <Image
          source={require("../../assets/images/shoehub.png")}
          className="w-36 h-16 mb-8"
          resizeMode="contain"
        />
        <Text className="text-3xl font-bold mb-2">Verify Email</Text>

        <Text className="text-gray-500 mb-6">
          Enter the code sent to your email
        </Text>

        <TextInput
          value={verificationCode}
          onChangeText={(text) => {
            setVerificationCode(text);
          }}
          placeholder="Verification code"
          keyboardType="number-pad"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 bg-white"
        />

        {verificationError ? (
          <Text className="text-red-500 mb-4">{verificationError}</Text>
        ) : null}

        <TouchableOpacity
          onPress={verifyEmailCode}
          disabled={emailVerificationProcess}
          className="bg-black py-4 rounded-xl items-center"
        >
          {emailVerificationProcess ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold">Verify</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  if (mode === "reset") {
    return (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="bg-stone-50"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          <Image
            source={require("../../assets/images/shoehub.png")}
            className="w-36 h-16 mb-8"
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Reset password
          </Text>
          <Text className="text-gray-500 mb-6">
            {resetStep === "email" && "We will send a code to your email."}
            {resetStep === "code" && "Enter the 6-digit code we emailed you."}
            {resetStep === "password" && "Choose a new secure password."}
          </Text>

          {resetMessage ? (
            <Text className="text-black rounded-xl px-4 py-3 mb-4">
              {resetMessage}
            </Text>
          ) : null}

          {resetError ? (
            <Text className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              {resetError}
            </Text>
          ) : null}

          {resetStep === "email" && (
            <>
              <TextInput
                className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 bg-white"
                placeholder="Email address"
                placeholderTextColor="#9CA3AF"
                value={email}
                autoComplete="email"
                textContentType="emailAddress"
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={startResetPassword}
                disabled={resetLoading}
                className="w-full bg-black py-4 rounded-xl items-center mb-3"
              >
                {resetLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    Send reset code
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {resetStep === "code" && (
            <>
              <TextInput
                className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 bg-white"
                placeholder="Reset code"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
              />
              <TouchableOpacity
                onPress={verifyResetCode}
                disabled={resetLoading}
                className="w-full bg-black py-4 rounded-xl items-center mb-3"
              >
                {resetLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    Verify code
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={startResetPassword}
                disabled={resetLoading}
                className="py-2"
              >
                <Text className="text-gray-600 font-semibold">Resend code</Text>
              </TouchableOpacity>
            </>
          )}

          {resetStep === "password" && (
            <>
              <TextInput
                className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 bg-white"
                placeholder="New password"
                autoComplete="password"
                textContentType="newPassword"
                placeholderTextColor="#9CA3AF"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <TouchableOpacity
                onPress={submitNewPassword}
                disabled={resetLoading}
                className="w-full bg-black py-4 rounded-xl items-center mb-3"
              >
                {resetLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    Update password
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={closeResetFlow} className="py-2">
            <Text className="text-slate-600 font-semibold">
              Back to sign in
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className="bg-stone-50"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 justify-center px-6 py-12">
        <Image
          source={require("../../assets/images/shoehub.png")}
          className="w-36 h-16 mb-8"
          resizeMode="contain"
        />
        <Text className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back
        </Text>
        <Text className="text-gray-500 mb-8">Sign in to your account</Text>

        <TextInput
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4"
          placeholder="Email address"
          placeholderTextColor="#9CA3AF"
          value={email}
          autoComplete="email"
          textContentType="emailAddress"
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-6"
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          autoComplete="password"
          textContentType="password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          onPress={onSignInPress}
          disabled={isLoading || !email.trim() || !password.trim()}
          className="w-full bg-black text-white py-4 rounded-xl items-center mb-4"
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">Sign In</Text>
          )}
        </TouchableOpacity>

        {signInError ? (
          <Text className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            {signInError}
          </Text>
        ) : null}

        <TouchableOpacity onPress={openResetFlow} className="py-2 mb-2">
          <Text className="text-slate-600 text-center font-semibold">
            Forgot password?
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-gray-500">Don&apos;t have an account? </Text>
          <Link href="/sign-up">
            <Text className="text-gray-600 font-semibold">Sign Up</Text>
          </Link>
        </View>

        {showSupportMessage && (
          <View className="mt-4 rounded-xl border border-yellow-300 bg-yellow-50 p-4">
            <Text className="font-semibold text-yellow-900">
              Your account has been banned due to Some Reasons.
            </Text>

            <TouchableOpacity
              onPress={() =>
                Linking.openURL(
                  `mailto:support@shoehub.com?subject=${subject}&body=${body}`,
                )
              }
            >
              <Text className="mt-2 font-medium text-blue-600">
                Contact Support
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
