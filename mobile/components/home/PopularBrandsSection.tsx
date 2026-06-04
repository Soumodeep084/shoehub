import { FlatList, Text, TouchableOpacity, View } from "react-native";

type PopularBrandsSectionProps = {
  brands: string[];
  selectedBrand?: string;
  onSelectBrand?: (brand: string) => void;
};

export function PopularBrandsSection({
  brands,
  selectedBrand,
  onSelectBrand,
}: PopularBrandsSectionProps) {
  return (
    <View className="mt-12">
      <View className="mb-5 px-6">
        <Text className="text-[24px] font-black tracking-tight text-zinc-900">
          Popular Brands
        </Text>
      </View>

      <FlatList
        horizontal
        data={brands}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        ItemSeparatorComponent={() => <View className="w-3" />}
        ListHeaderComponent={<View className="w-6" />}
        ListFooterComponent={<View className="w-6" />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelectBrand?.(item)}
            activeOpacity={0.84}
            className={`rounded-full px-5 py-3 shadow-sm shadow-black/5 ${selectedBrand === item ? "border border-zinc-950 bg-zinc-950" : "border border-zinc-200 bg-white"}`}
          >
            <Text
              className={`text-sm font-semibold uppercase tracking-[1px] ${selectedBrand === item ? "text-white" : "text-zinc-800"}`}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
