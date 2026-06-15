import { useAuth, useSession, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { SectionCard } from "@/components/profile/SectionCard";
import { ChangePasswordCard } from "@/components/profile/security/ChangePasswordCard";
import { SecurityOverviewCard } from "@/components/profile/security/SecurityOverviewCard";
import { SessionCard } from "@/components/profile/security/SessionCard";

import type { SessionItem } from "@/types/index";

export default function SecurityScreen() {
  const { signOut } = useAuth();
  const { session: activeSession } = useSession();
  const { user } = useUser();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!user) return;

    setSessionsLoading(true);

    try {
      const list = await user.getSessions();
      setSessions(list as SessionItem[]);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setSessionsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await loadSessions();
    } finally {
      setRefreshing(false);
    }
  }, [loadSessions]);

  const handleChangePassword = async () => {
    setPasswordError("");

    if (!currentPassword.trim()) {
      setPasswordError("Current password is required.");
      return;
    }
    if (!newPassword.trim()) {
      setPasswordError("New password is required.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Use at least 8 characters.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      await user?.updatePassword({
        currentPassword,
        newPassword,
        signOutOfOtherSessions: true,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Toast.show({
        type: "success",
        text1: "Password updated",
        text2: "Your account password was changed successfully.",
      });
      await loadSessions();
    } catch (error: any) {
      setPasswordError(error.message || "Could not update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRevokeSession = useCallback(
    (session: SessionItem) => {
      Alert.alert(
        "Revoke session",
        "This will sign out that device from your account.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Revoke",
            style: "destructive",
            onPress: async () => {
              try {
                await session.revoke();
                Toast.show({
                  type: "success",
                  text1: "Session revoked",
                  text2: "The selected device has been signed out.",
                });

                if (activeSession?.id === session.id) {
                  await signOut().catch(() => undefined);
                } else {
                  await loadSessions();
                }
              } catch (error: any) {
                Toast.show({
                  type: "error",
                  text1: "Revoke failed",
                  text2: error.message || "Could not revoke the session.",
                });
              }
            },
          },
        ],
      );
    },
    [activeSession?.id, signOut, loadSessions],
  );

  const currentSessionId = activeSession?.id;

  const renderSession = useCallback(
    ({ item }: { item: SessionItem }) => {
      const isCurrent = currentSessionId === item.id;

      return (
        <SessionCard
          session={item}
          isCurrent={isCurrent}
          onRevoke={handleRevokeSession}
        />
      );
    },
    [currentSessionId, handleRevokeSession],
  );

  const sessionsEmpty = useMemo(
    () => !sessionsLoading && sessions.length === 0,
    [sessions.length, sessionsLoading],
  );

  return (
    <SafeAreaView className="flex-1 bg-zinc-50" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="bg-white border-b border-zinc-100">
          <View className="flex-row items-center px-6 py-5">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.replace("/profile")}
              className="h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white"
            >
              <Ionicons name="chevron-back" size={20} color="#18181b" />
            </TouchableOpacity>

            <View className="ml-4 flex-1">
              <Text className="text-2xl font-black  text-zinc-950">
                Security
              </Text>

              <Text className="mt-0.5 text-xs font-bold uppercase  text-zinc-400">
                Password and active devices
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6 pt-6">
          <SecurityOverviewCard sessionsCount={sessions.length} />
          <ChangePasswordCard
            showPasswordSection={showPasswordSection}
            setShowPasswordSection={setShowPasswordSection}
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            passwordError={passwordError}
            passwordLoading={passwordLoading}
            onSubmit={handleChangePassword}
          />

          <View className="mt-2">
            <SectionCard>
              <View className="px-5 py-5">
                <View className="flex-row gap-3">
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color="#18181b"
                  />

                  <View className="flex-1">
                    <Text className="text-sm font-bold text-zinc-900">
                      Security Tip
                    </Text>

                    <Text className="mt-1 text-sm leading-6 text-zinc-500">
                      Avoid reusing passwords across multiple accounts and
                      devices and regularly review active devices.
                    </Text>
                  </View>
                </View>
              </View>
            </SectionCard>
          </View>

          <View className="mt-4">
            <View className="mb-3 flex-row items-center justify-between px-1">
              <Text className="text-xs font-black uppercase  text-zinc-400">
                Active Sessions
              </Text>
              <TouchableOpacity
                onPress={handleRefresh}
                activeOpacity={0.8}
                className="h-9 w-9 items-center justify-center rounded-full bg-white border border-zinc-200"
              >
                <Ionicons name="refresh" size={16} color="#52525b" />
              </TouchableOpacity>
            </View>

            {sessionsLoading && !refreshing ? (
              <View className="items-center py-10">
                <ActivityIndicator color="#18181b" />
              </View>
            ) : null}

            {sessionsEmpty ? (
              <SectionCard>
                <View className="px-5 py-8">
                  <Text className="text-center text-sm font-medium text-zinc-400">
                    No active sessions found.
                  </Text>
                </View>
              </SectionCard>
            ) : (
              <FlatList
                data={sessions}
                keyExtractor={(item) => item.id}
                renderItem={renderSession}
                scrollEnabled={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor="#18181b"
                    colors={["#18181b"]}
                  />
                }
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
