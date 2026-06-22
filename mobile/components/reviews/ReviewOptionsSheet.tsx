import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import type { Review } from "@/types";

interface Props {
  visible: boolean;
  onClose: () => void;

  review: Review | null;
  isMine: boolean;

  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
}

export default function ReviewOptionsSheet({
  visible,
  onClose,
  review,
  isMine,
  onEdit,
  onDelete,
  onReport,
}: Props) {
  const copyLink = async () => {
    if (!review) return;

    await Clipboard.setStringAsync(`shoehub://review/${review.id}`);

    Toast.show({
      type: "success",
      text1: "Link copied",
    });

    onClose();
  };

  const shareReview = async () => {
    if (!review) return;

    await Share.share({
      message: `shoehub://review/${review.id}`,
    });

    onClose();
  };

  const Option = ({
    icon,
    title,
    color = "#18181b",
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    color?: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row items-center py-4"
    >
      <Ionicons name={icon} size={22} color={color} />

      <Text
        className="ml-4 text-base font-semibold"
        style={{ color }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/40">
          <TouchableWithoutFeedback>
            <View
              className="bg-white rounded-t-3xl px-6 pt-4 pb-10"
            >
              <View className="self-center w-12 h-1.5 rounded-full bg-zinc-300 mb-5" />

              <Text className="text-xl font-black mb-2">
                Review Options
              </Text>

              {isMine ? (
                <>
                  <Option
                    icon="create-outline"
                    title="Edit Review"
                    onPress={() => {
                      onClose();
                      onEdit();
                    }}
                  />

                  <Option
                    icon="trash-outline"
                    title="Delete Review"
                    color="#dc2626"
                    onPress={() => {
                      onClose();
                      onDelete();
                    }}
                  />
                </>
              ) : (
                <Option
                  icon="flag-outline"
                  title="Report Review"
                  color="#dc2626"
                  onPress={() => {
                    onClose();
                    onReport();
                  }}
                />
              )}

              <Option
                icon="copy-outline"
                title="Copy Link"
                onPress={copyLink}
              />

              <Option
                icon="share-social-outline"
                title="Share"
                onPress={shareReview}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}