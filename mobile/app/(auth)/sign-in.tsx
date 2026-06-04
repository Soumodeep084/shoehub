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

type ResetStep = "email" | "code" | "password";

export default function SignIn() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [mode, setMode] = useState<"signIn" | "reset">("signIn");
  const [resetStep, setResetStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [signInError, setSignInError] = useState("");

  const onSignInPress = async () => {
    setSignInError(""); // Clears old errors when you try again

    try {
      const { error } = await signIn.password({
        emailAddress: email,
        password,
      });

      if (error) {
        setSignInError(error.message);
        return;
      }

      console.log(
        "Password sign-in successful, checking status...",
        signIn.status,
      );

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              console.log(session?.currentTask);
              return;
            }
            const url = decorateUrl("/");
            router.replace(url as any);
          },
        });
      } else if (signIn.status === "needs_second_factor") {
        await signIn.mfa.sendPhoneCode();
      } else if (signIn.status === "needs_client_trust") {
        const emailCodeFactor = signIn.supportedSecondFactors.find(
          (factor) => factor.strategy === "email_code",
        );

        if (emailCodeFactor) {
          await signIn.mfa.sendEmailCode();
        }
      } else {
        console.error("Sign-In attempt not complete : \n", signIn);
      }
    } catch (err: any) {
      // 🚨 THIS IS WHAT YOU WERE MISSING!
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
        console.log("Sign in complete");
        await signIn.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              console.log(session.currentTask);
              return;
            }

            const url = decorateUrl("/");
            router.replace(url as any);
          },
        });
        return;
      }

      setResetError("Password was updated, but sign-in is not complete.");
    } finally {
      setResetLoading(false);
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
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.fields.identifier && (
          <Text className="text-red-500 mb-4">
            {errors.fields.identifier.message}
          </Text>
        )}

        <TextInput
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-6"
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {errors.fields.password && (
          <Text className="text-red-500 mb-4">
            {errors.fields.password.message}
          </Text>
        )}

        <TouchableOpacity
          onPress={onSignInPress}
          disabled={isLoading}
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
      </View>
    </ScrollView>
  );
}
