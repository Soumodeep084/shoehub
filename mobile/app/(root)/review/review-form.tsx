import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { useReviewStore } from "@/store/reviewStore";
import { FormField } from "@/components/profile/FormField";

const IMAGE_LIMIT = 2 * 1024 * 1024; // 2 MB
const VIDEO_LIMIT = 6 * 1024 * 1024; // 6 MB

export default function ReviewFormScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { createReview, uploadMedia, updateReview, deleteReview, reviews } =
    useReviewStore();

  const { mode, editableReviewId, productId } = useLocalSearchParams<{
    mode?: string;
    editableReviewId?: string;
    productId: string;
  }>();

  const isEditing = mode === "edit";

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [videos, setVideos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEditing || !editableReviewId) return;

    const review = reviews.find((r) => r.id === editableReviewId);

    if (!review) return;

    setRating(review.rating);
    setComment(review.comment ?? "");
  }, [isEditing, editableReviewId, reviews]);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (result.canceled) return;

    const pickedImages = result.assets.filter(
      (asset) => asset.type === "image",
    );

    const pickedVideos = result.assets.filter(
      (asset) => asset.type === "video",
    );

    if (images.length + pickedImages.length > 4) {
      Toast.show({
        type: "error",
        text1: "Maximum 4 images allowed",
      });
      return;
    }

    if (videos.length + pickedVideos.length > 2) {
      Toast.show({
        type: "error",
        text1: "Maximum 2 videos allowed",
      });
      return;
    }

    // Validate image sizes
    const oversizedImage = pickedImages.find(
      (image) => (image.fileSize ?? 0) > IMAGE_LIMIT,
    );

    if (oversizedImage) {
      Toast.show({
        type: "error",
        text1: "Image size must not exceed 2 MB",
      });
      return;
    }

    // Validate video sizes
    const oversizedVideo = pickedVideos.find(
      (video) => (video.fileSize ?? 0) > VIDEO_LIMIT,
    );

    if (oversizedVideo) {
      Toast.show({
        type: "error",
        text1: "Video size must not exceed 6 MB",
      });
      return;
    }

    setImages((prev) => [...prev, ...pickedImages]);
    setVideos((prev) => [...prev, ...pickedVideos]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (loading) return;

    if (rating === 0) {
      Toast.show({
        type: "error",
        text1: "Select rating",
      });
      return;
    }

    if (comment.trim() === "") {
      Toast.show({
        type: "error",
        text1: "Enter your comment",
      });
      return;
    }

    setLoading(true);

    let reviewId: string | null = null;

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Unauthorized");
      }

      if (isEditing) {
        if (!editableReviewId) throw new Error("Review not found");

        await updateReview(
          {
            reviewId: editableReviewId,
            rating,
            comment,
          },
          token,
        );

        Toast.show({
          type: "success",
          text1: "Review updated",
        });

        router.back();
        return;
      }

      const review = await createReview(
        {
          productId,
          rating,
          comment,
        },
        token,
      );

      reviewId = review.reviewId;

      // Upload Images
      for (const image of images) {
        await uploadMedia(
          {
            reviewId,
            type: "IMAGE",
            file: {
              uri: image.uri,
              name: image.fileName ?? "image.jpg",
              type: image.mimeType ?? "image/jpeg",
            },
          },
          token,
        );
      }

      // Upload Videos
      for (const video of videos) {
        await uploadMedia(
          {
            reviewId,
            type: "VIDEO",
            file: {
              uri: video.uri,
              name: video.fileName ?? "video.mp4",
              type: video.mimeType ?? "video/mp4",
            },
          },
          token,
        );
      }

      Toast.show({
        type: "success",
        text1: "Review submitted",
      });

      router.back();
    } catch (err: any) {
      // Rollback review if media upload failed
      if (reviewId) {
        try {
          const token = await getToken();

          if (token) {
            await deleteReview(reviewId, token);
          }
        } catch (rollbackError) {
          console.error("ROLLBACK_ERROR", rollbackError);
        }
      }

      Toast.show({
        type: "error",
        text1: err?.message ?? "Failed to submit review",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-50">
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-black">
            {isEditing ? "Edit Review" : "Write Review"}
          </Text>

          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={22} />
          </TouchableOpacity>
        </View>

        {/* Rating */}
        <View className="mt-6">
          <View className="flex-row items-center ">
            <Text className="text-xs font-black text-zinc-500">Rating</Text>
            <Text className="text-red-500"> *</Text>
          </View>

          <View className="flex-row gap-2 mt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setRating(i)}
                disabled={loading}
              >
                <Ionicons
                  name={i <= rating ? "star" : "star-outline"}
                  size={28}
                  color={i <= rating ? "#f59e0b" : "#aaa"}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Comment */}
        <View className="mt-6">
          <FormField
            label="Comment"
            value={comment}
            onChangeText={setComment}
            placeholder="Share your experience..."
            multiline
            numberOfLines={6}
            maxLength={500}
          />
        </View>

        {/* Media */}
        {isEditing ? (
          <View className="mt-4">
            <Text className="text-xs font-black text-zinc-500">
              Note : Photos and Videos Editing is not Possible. Please delete
              the review and create a new one if you want to change the media.
            </Text>
          </View>
        ) : (
          <View className="mt-4">
            <Text className="text-xs font-black text-zinc-500">
              Photos / Videos (OPTIONAL)
            </Text>

            <TouchableOpacity
              onPress={pickMedia}
              disabled={loading || (images.length >= 4 && videos.length >= 2)}
              className="bg-white p-4 rounded-2xl mt-2"
            >
              <Text className="font-bold">
                + Add Media ({images.length}/4 Images • {videos.length}/2
                Videos)
              </Text>
            </TouchableOpacity>
            <Text className="mt-2 text-xs text-zinc-500">
              Maximum 4 images and 2 videos.
            </Text>
            <Text className="mt-2 text-xs text-zinc-500">
              Images must be under 2 MB and videos must be under 6 MB in Size.
            </Text>

            <ScrollView
              horizontal
              className="mt-3"
              contentContainerStyle={{
                paddingRight: 20,
              }}
              showsHorizontalScrollIndicator={false}
            >
              {images.map((image, index) => (
                <View key={`image-${index}`} className="mr-2 relative">
                  <Image
                    source={{ uri: image.uri }}
                    className="w-20 h-20 rounded-xl"
                  />

                  <TouchableOpacity
                    disabled={loading}
                    onPress={() => removeImage(index)}
                    className="absolute top-0 right-0 bg-black rounded-full"
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}

              {videos.map((video, index) => (
                <View key={`video-${index}`} className="mr-2 relative">
                  <Image
                    source={{ uri: video.uri }}
                    className="w-20 h-20 rounded-xl"
                  />

                  <View className="absolute inset-0 items-center justify-center">
                    <View className="bg-black/60 rounded-full p-2">
                      <Ionicons name="play" size={18} color="white" />
                    </View>
                  </View>

                  <TouchableOpacity
                    disabled={loading}
                    onPress={() => removeVideo(index)}
                    className="absolute top-0 right-0 bg-black rounded-full"
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          onPress={submit}
          disabled={loading}
          className="bg-zinc-950 mt-8 p-4 rounded-2xl items-center"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-black uppercase">
              {isEditing ? "Update Review" : "Submit Review"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
