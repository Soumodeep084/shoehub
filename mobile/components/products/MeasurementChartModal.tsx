import React, { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MEN_SIZE_CHART, WOMEN_SIZE_CHART } from "@/constants/size-chart";

// 1. EXTRACTED STANDALONE COMPONENT (Prevents layout re-creation bugs)
interface SizeRow {
  uk: string;
  us: string;
  eu: string;
  cm: string;
  inch: string;
}

function SizeTable({ title, data }: { title: string; data: SizeRow[] }) {
  return (
    <View className="mt-6">
      <Text className="mb-3 text-lg font-bold text-zinc-900">
        {title} Size Guide
      </Text>

      <View className="rounded-2xl border border-zinc-200 bg-white">
        {/* Table Header */}
        <View className="flex-row bg-zinc-100 rounded-t-2xl py-3">
          <Text className="flex-1 text-center text-xs font-bold text-zinc-900">
            UK
          </Text>
          <Text className="flex-1 text-center text-xs font-bold text-zinc-900">
            US
          </Text>
          <Text className="flex-1 text-center text-xs font-bold text-zinc-900">
            EU
          </Text>
          <Text className="flex-1 text-center text-xs font-bold text-zinc-900">
            CM
          </Text>
          <Text className="flex-1 text-center text-xs font-bold text-zinc-900">
            INCH
          </Text>
        </View>

        {/* Table Rows */}
        {data.map((row, index) => (
          <View
            key={`${title}-${row.uk}-${index}`}
            className="flex-row border-t border-zinc-100 py-3"
          >
            <Text className="flex-1 text-center text-sm text-zinc-700">
              {row.uk}
            </Text>
            <Text className="flex-1 text-center text-sm text-zinc-700">
              {row.us}
            </Text>
            <Text className="flex-1 text-center text-sm text-zinc-700">
              {row.eu}
            </Text>
            <Text className="flex-1 text-center text-sm text-zinc-700">
              {row.cm}
            </Text>
            <Text className="flex-1 text-center text-sm text-zinc-700">
              {row.inch}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// MAIN COMPONENT EXPORT
export default function MeasurementChartModal({
  isVisible,
  onClose,
  defaultTab,
}: {
  isVisible: boolean;
  onClose: () => void;
  defaultTab: "Men" | "Women";
}) {
  const [selectedTab, setSelectedTab] = useState<"Men" | "Women">(defaultTab);

  // Safe shadow definition for clean cross-platform execution
  const activeTabStyle = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    elevation: 2,
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        {/* Header Bar */}
        <View className="flex-row items-center justify-between border-b border-zinc-200 px-5 py-4">
          <Text className="text-xl font-bold text-zinc-900">Size Guide</Text>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            className="p-1"
          >
            <Ionicons name="close" size={24} color="#18181b" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 40,
          }}
        >
          {/* Informational Subtext */}
          <Text className="text-sm leading-6 text-zinc-500">
            Measure your foot from heel to longest toe and compare it with the
            CM or INCH columns for the best fit.
          </Text>

          {/* Clean Segmented Control Toggle */}
          <View className="mt-6 rounded-2xl bg-zinc-100 p-1">
            <View className="flex-row">
              {/* Men Selector Tab */}
              <TouchableOpacity
                onPress={() => setSelectedTab("Men")}
                className={`flex-1 rounded-xl py-3 ${
                  selectedTab === "Men" ? "bg-white" : "bg-transparent"
                }`}
                style={selectedTab === "Men" ? activeTabStyle : {}}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-center text-sm font-semibold ${
                    selectedTab === "Men" ? "text-zinc-900" : "text-zinc-500"
                  }`}
                >
                  Men
                </Text>
              </TouchableOpacity>

              {/* Women Selector Tab */}
              <TouchableOpacity
                onPress={() => setSelectedTab("Women")}
                className={`flex-1 rounded-xl py-3 ${
                  selectedTab === "Women" ? "bg-white" : "bg-transparent"
                }`}
                style={selectedTab === "Women" ? activeTabStyle : {}}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-center text-sm font-semibold ${
                    selectedTab === "Women" ? "text-zinc-900" : "text-zinc-500"
                  }`}
                >
                  Women
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Switch Deck */}
          {selectedTab === "Men" ? (
            <SizeTable title="Men" data={MEN_SIZE_CHART} />
          ) : (
            <SizeTable title="Women" data={WOMEN_SIZE_CHART} />
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
