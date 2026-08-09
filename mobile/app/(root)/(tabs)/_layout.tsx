import { useUserStore } from "@/store/userStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import {
  Icon,
  Label,
  NativeTabs,
  Badge,
} from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";

function AndroidTabs() {
  const cartItemsCount = useCartStore((state) => state.getCartCount());
  const wishlistItemsCount = useWishlistStore((state) => state.getWishlistCount());
  const role = useUserStore((state) => state.role);
  const isDeliveryAgent = role === "DELIVERY_AGENT";
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" color={color} size={size} />
          ),
        }}
      />

      {/* <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          href: isAdmin ? "/create" : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" color={color} size={size} />
          ),
        }}
      /> */}

      <Tabs.Screen
        name="wishlist"
        options={{
          title: "WishList",
          tabBarBadge: wishlistItemsCount > 0 ? wishlistItemsCount : undefined,
          tabBarBadgeStyle: { backgroundColor: "red", color: "white" , fontSize: 11, minWidth: 16, height: 16, fontWeight: "bold", paddingHorizontal: 4, lineHeight: 16},
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarBadge: cartItemsCount > 0 ? cartItemsCount : undefined,
          tabBarBadgeStyle: { backgroundColor: "red", color: "white" , fontSize: 11, minWidth: 16, height: 16, fontWeight: "bold", paddingHorizontal: 4, lineHeight: 16},
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="deliveries"
        options={{
          title: "Deliveries",
          href: isDeliveryAgent ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bicycle" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

function IOSTabs() {
  const cartItemsCount = useCartStore((state) => state.getCartCount());
  const wishlistItemsCount = useWishlistStore((state) => state.getWishlistCount());
  const role = useUserStore((state) => state.role);
  const isDeliveryAgent = role === "DELIVERY_AGENT";
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf="house.fill" />
        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search">
        <Icon sf="magnifyingglass" />
        <Label>Search</Label>
      </NativeTabs.Trigger>

      {/* {isAdmin && (
        <NativeTabs.Trigger name="create">
          <Icon sf="plus.circle.fill" />
          <Label>create</Label>
        </NativeTabs.Trigger>
      )} */}

      <NativeTabs.Trigger name="wishlist">
        <Badge>{wishlistItemsCount > 0 ? String(wishlistItemsCount) : undefined}</Badge>
        <Icon sf="heart.fill" />
        <Label>WishList</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="cart">
        <Badge>{cartItemsCount > 0 ? String(cartItemsCount) : undefined}</Badge>
        <Icon sf="bag.fill" />
        <Label>Cart</Label>
      </NativeTabs.Trigger>

      {isDeliveryAgent && (
        <NativeTabs.Trigger name="deliveries">
          <Icon sf="bicycle" />
          <Label>Deliveries</Label>
        </NativeTabs.Trigger>
      )}

      <NativeTabs.Trigger name="profile">
        <Icon sf="person.fill" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export default function TabsLayout() {
  return Platform.OS === "android" ? <AndroidTabs /> : <IOSTabs />;
}
