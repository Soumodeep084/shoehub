import { getAddressIcon } from "@/utils/address.utils";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { View, Text } from "react-native";
import { SectionCard } from "../SectionCard";
import { SettingRow } from "../SettingRow";

const AddressRender = ({
  item,
  handleDefault,
  handleDelete,
}: {
  item: any;
  handleDefault: (id: string) => void;
  handleDelete: (id: string, label: string) => void;
}) => (
  <View className="mb-4">
    <SectionCard>
      <View className="px-5 py-5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Ionicons
                name={getAddressIcon(item.label)}
                size={16}
                color="#18181b"
              />

              <Text className="text-lg font-black tracking-tight text-zinc-950">
                {item.label}
              </Text>

              {item.isDefault && (
                <View className="ms-2 rounded-xl bg-zinc-900 px-3 py-0.5 ">
                  <Text className="text-xs font-semibold uppercase text-white">
                    Default
                  </Text>
                </View>
              )}
            </View>
            <Text className="mt-1 text-sm font-semibold text-zinc-700">
              {item.fullName}
            </Text>
            <Text className="mt-1 text-sm leading-6 text-zinc-500">
              {item.line1}
              {item.line2 ? `, ${item.line2}` : ""}, {item.city}, {item.state}
              {"- "}
              {item.postalCode}
            </Text>
            <Text className="mt-1 text-xs font-bold uppercase text-zinc-400">
              {item.country}
            </Text>
          </View>
        </View>
      </View>

      <View className="bg-white">
        <View className="h-px bg-zinc-100" />
        <SettingRow
          title="Edit address"
          subtitle="Update delivery details"
          icon="create-outline"
          onPress={() =>
            router.push({
              pathname: "/address-form" as any,
              params: { id: item.id },
            })
          }
        />
        <View className="h-px bg-zinc-100" />
        {item.isDefault ? (
          <SettingRow
            title="Default Address"
            subtitle="Used automatically during checkout"
            icon="checkmark-circle"
            right="Active"
          />
        ) : (
          <SettingRow
            title="Set as Default"
            subtitle="Use for quick checkout"
            icon="star-outline"
            onPress={() => handleDefault(item.id)}
          />
        )}
        <View className="h-px bg-zinc-100" />
        <SettingRow
          title="Delete address"
          subtitle="Remove from this account"
          icon="trash-outline"
          danger
          onPress={() => handleDelete(item.id, item.label)}
        />
      </View>
    </SectionCard>
  </View>
);

export default AddressRender;
