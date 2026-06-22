import { useMemo, useState , useEffect} from "react";
import ImageViewing from "react-native-image-viewing";
import { ActivityIndicator, Image, ScrollView, Text, View , TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams , useRouter} from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { useReviewStore } from "@/store/reviewStore";

function ReviewVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
  });

  return (
    <VideoView
      player={player}
      allowsFullscreen
      allowsPictureInPicture
      nativeControls
      style={{
        width: "100%",
        height: 250,
        borderRadius: 20,
      }}
    />
  );
}

export default function ReviewDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedReview, getReviewById, isLoading } = useReviewStore();

  useEffect(() => {
    if (id) {
      getReviewById(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const images = useMemo(() => {
    if (!selectedReview) return [];

    return selectedReview.media
      .filter((m) => m.type === "IMAGE")
      .map((m) => ({
        uri: m.url,
      }));
  }, [selectedReview]);

  if (isLoading || !selectedReview) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-zinc-50">
        <ActivityIndicator size="large" />
        <Text>Loading....</Text>
      </SafeAreaView>
    );
  }

  const review = selectedReview;
  const fullName = `${review.user.firstName} ${review.user.lastName}`.trim();
  const createdDate = new Date(review.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 mt-6">
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.8}
        className="absolute top-4 left-4 z-50 h-11 w-11 items-center justify-center rounded-full bg-white shadow"
        style={{
          elevation: 6,
        }}
      >
        <Ionicons name="arrow-back" size={22} color="#18181b" />
      </TouchableOpacity>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
          paddingTop: 40,
        }}
      >
        {/* User */}

        <View className="flex-row items-center">
          {review.user.imageUrl ? (
            <Image
              source={{
                uri: review.user.imageUrl,
              }}
              className="w-14 h-14 rounded-full"
            />
          ) : (
            <View className="w-14 h-14 rounded-full bg-zinc-200 justify-center items-center">
              <Ionicons name="person" size={24} color="#52525b" />
            </View>
          )}

          <View className="ml-4 flex-1">
            <Text className="text-lg font-black text-zinc-900">{fullName}</Text>

            <Text className="text-zinc-500 mt-1">{createdDate}</Text>
          </View>
        </View>

        {/* Rating */}

        <View className="flex-row mt-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Ionicons
              key={i}
              name={i < review.rating ? "star" : "star-outline"}
              size={28}
              color="#f59e0b"
              style={{
                marginRight: 4,
              }}
            />
          ))}
        </View>

        {/* Comment */}

        {review.comment ? (
          <View className="mt-8 bg-white rounded-3xl p-5">
            <Text className="text-base leading-7 text-zinc-700">
              {review.comment}
            </Text>
          </View>
        ) : null}

        {/* Images */}

        {review.media.filter((m) => m.type === "IMAGE").length > 0 && (
          <View className="mt-10">
            <Text className="text-lg font-black mb-4">Photos</Text>

            {review.media
              .filter((m) => m.type === "IMAGE")
              .map((media, index) => (
                <TouchableOpacity
                  key={media.id}
                  activeOpacity={0.9}
                  onPress={() => {
                    setSelectedImageIndex(index);
                    setViewerVisible(true);
                  }}
                >
                  <Image
                    source={{
                      uri: media.url,
                    }}
                    resizeMode="cover"
                    className="w-full h-72 rounded-3xl mb-4"
                  />
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* Videos */}
        {review.media.filter((m) => m.type === "VIDEO").length > 0 && (
          <View className="mt-8">
            <Text className="text-lg font-black mb-4">Videos</Text>

            {review.media
              .filter((m) => m.type === "VIDEO")
              .map((media) => (
                <View
                  key={media.id}
                  className="mb-5 overflow-hidden rounded-3xl"
                >
                  <ReviewVideo uri={media.url} />
                </View>
              ))}
          </View>
        )}
      </ScrollView>

      <ImageViewing
        images={images}
        imageIndex={selectedImageIndex}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
      />
    </SafeAreaView>
  );
}
