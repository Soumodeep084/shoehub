import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { useCategoryStore } from "@/store/categoryStore";
import { useBrandStore } from "@/store/brandStore";
import { useFilterStore, SortByType } from "@/store/filterStore";
import { Ionicons } from "@expo/vector-icons";
import { SIZES, PRICE_PRESETS, SORT_BY } from "@/constants/filter.data";

export const FilterModal = ({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) => {
  const categories = useCategoryStore((state) => state.categories);
  const brands = useBrandStore((state) => state.brands);

  const {
    categoryId,
    brand,
    size,
    minPrice,
    maxPrice,
    sortBy,
    setCategoryId,
    setBrand,
    setSize,
    setMinPrice,
    setMaxPrice,
    setSortBy,
    resetFilters,
  } = useFilterStore();

  const displayCategories = useMemo(
    () => [{ id: "All", name: "All" }, ...categories],
    [categories],
  );

  const displayBrands = useMemo(() => ["All", ...brands], [brands]);

  const [localMin, setLocalMin] = useState(minPrice ? String(minPrice) : "");
  const [localMax, setLocalMax] = useState(maxPrice ? String(maxPrice) : "");

  useEffect(() => {
    setLocalMin(minPrice ? String(minPrice) : "");
    setLocalMax(maxPrice ? String(maxPrice) : "");
  }, [minPrice, maxPrice]);

  const handleApply = () => {
    const min = localMin ? Number(localMin) : null;
    const max = localMax ? Number(localMax) : null;

    if (min !== null && max !== null && min > max) {
      alert("Min price cannot be greater than max price");
      return;
    }

    setMinPrice(min);
    setMaxPrice(max);

    onClose();
  };

  const activeCount = [
    categoryId !== "All",
    brand !== "All",
    size !== "Any",
    minPrice !== null,
    maxPrice !== null,
    sortBy !== "newest",
  ].filter(Boolean).length;

  const handleReset = () => {
    setLocalMin("");
    setLocalMax("");
    resetFilters();
    onClose();
  };

  const shadow = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-6 pb-4 bg-white border-b border-gray-100">
          <TouchableOpacity onPress={onClose} className="p-1">
            <Ionicons name="close" size={22} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Filters</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text className="text-blue-600 font-semibold text-sm">Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Categories Section */}
          <Text className="text-base font-semibold text-zinc-800 mb-3">
            Categories
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {displayCategories.map((category) => {
              const selected = categoryId === category.id;

              return (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setCategoryId(category.id)}
                  className={`px-3 py-2 rounded-full border ${
                    selected
                      ? "bg-zinc-900 border-zinc-900"
                      : "bg-white border-zinc-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selected ? "text-white" : "text-zinc-700"
                    }`}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Brands Section */}
          <Text className="mt-2 text-base font-semibold text-zinc-800 mb-3">
            Brands
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {displayBrands.map((brandName) => {
              const selected = brand === brandName;

              return (
                <TouchableOpacity
                  key={brandName}
                  onPress={() => setBrand(brandName)}
                  className={`px-3 py-2 rounded-full border ${
                    selected
                      ? "bg-zinc-900 border-zinc-900"
                      : "bg-white border-zinc-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selected ? "text-white" : "text-zinc-700"
                    }`}
                  >
                    {brandName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Price Range */}
          <Text className="mt-2 text-base font-bold text-gray-800 mb-3">
            Price Range (₹)
          </Text>
          <View className="flex-row gap-3 mb-3">
            {[
              {
                label: "Min Price",
                value: localMin,
                onChange: setLocalMin,
                placeholder: "0",
              },
              {
                label: "Max Price",
                value: localMax,
                onChange: setLocalMax,
                placeholder: "Any",
              },
            ].map(({ label, value, onChange, placeholder }) => (
              <View key={label} className="flex-1">
                <Text className="text-xs text-gray-500 mb-1.5 font-medium">
                  {label}
                </Text>
                <View
                  className="flex-row items-center bg-white rounded-2xl px-3 border border-gray-200"
                  style={shadow}
                >
                  <Text className="text-gray-400 text-sm mr-1">₹</Text>
                  <TextInput
                    className="flex-1 py-3 text-gray-800"
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Price Presets */}
          <View className="flex-row flex-wrap gap-2">
            {PRICE_PRESETS.map((p) => {
              const selected =
                Number(localMin || 0) === (p.min ?? 0) &&
                Number(localMax || 0) === (p.max ?? 0);
              return (
                <TouchableOpacity
                  key={p.label}
                  onPress={() => {
                    setLocalMin(p.min ? String(p.min) : "");
                    setLocalMax(p.max ? String(p.max) : "");
                    setMinPrice(p.min);
                    setMaxPrice(p.max);
                  }}
                  className={`px-3 py-2 rounded-full border ${
                    selected
                      ? "bg-zinc-900 border-zinc-900"
                      : "bg-white border-zinc-200"
                  }`}
                >
                  <Text
                    numberOfLines={1}
                    className={`text-xs font-medium ${
                      selected ? "text-white" : "text-zinc-500"
                    }`}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sizes */}
          <Text className="mt-2 text-base font-bold text-gray-800 mb-3">
            Sizes (UK)
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {SIZES.map((item) => {
              const selected = size === item.value;
              return (
                <TouchableOpacity
                  key={String(item.value)}
                  onPress={() => setSize(item.value)}
                  className={`px-4 py-3 rounded-xl border ${
                    selected
                      ? "bg-zinc-900 border-zinc-900"
                      : "bg-white border-zinc-200"
                  }`}
                >
                  <Text
                    className={`font-medium text-sm ${
                      size === item.value ? "text-white" : "text-zinc-700"
                    }`}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* SortBy */}
          <Text className="mt-2 text-base font-bold text-gray-800 mb-3">
            Sort By
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {SORT_BY.map((item) => (
              <TouchableOpacity
                key={item.value}
                onPress={() => setSortBy(item.value as SortByType)}
                className={`px-4 py-3 rounded-xl border ${
                  sortBy === item.value
                    ? "bg-zinc-900 border-zinc-900"
                    : "bg-white border-zinc-200"
                }`}
              >
                <Text
                  className={`font-medium text-sm ${
                    sortBy === item.value ? "text-white" : "text-zinc-700"
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Bottom Action Buttons */}
        <View className="px-5 pb-8 pt-4 bg-white border-t border-gray-100">
          <TouchableOpacity
            onPress={handleApply}
            className="bg-blue-600 rounded-2xl py-4 items-center"
            style={{
              shadowColor: "#2563EB",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="text-white font-bold text-base">
              Apply Filters{activeCount > 0 ? ` (${activeCount})` : ""}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
