import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";
import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useNotificationStore } from "@/store/notificationStore";

export function usePushNotifications() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const fetchUnreadCount = useNotificationStore((state) => state.fetchUnreadCount);
  const lastNotificationIdRef = useRef<string | null>(null);

  // Keep unstable functions in refs to avoid triggering effect restarts
  const getTokenRef = useRef(getToken);
  const fetchNotificationsRef = useRef(fetchNotifications);
  const fetchUnreadCountRef = useRef(fetchUnreadCount);

  useEffect(() => {
    getTokenRef.current = getToken;
    fetchNotificationsRef.current = fetchNotifications;
    fetchUnreadCountRef.current = fetchUnreadCount;
  }, [getToken, fetchNotifications, fetchUnreadCount]);

  // 1. Configure local notification popups
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    async function checkPermissions() {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
    }
    checkPermissions().catch(console.error);

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const orderId = response.notification.request.content.data?.orderId;
      if (orderId) {
        router.push(`/order/order-details?id=${orderId}` as any);
      }
    });

    return () => {
      responseSubscription.remove();
    };
  }, [router]);

  // 2. Fetch notifications on initial load/sign-in, and whenever app is reopened (foregrounded)
  useEffect(() => {
    if (!isSignedIn) return;

    let isMounted = true;

    async function loadNotifications() {
      try {
        const token = await getTokenRef.current();
        if (!token || !isMounted) return;

        await fetchNotificationsRef.current(token);
        await fetchUnreadCountRef.current(token);
      } catch (err) {
        console.error("Error loading notifications in hook:", err);
      }
    }

    // Initial load
    loadNotifications().catch(console.error);

    // App state listener (for app reopens)
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        await loadNotifications();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [isSignedIn]);
}
