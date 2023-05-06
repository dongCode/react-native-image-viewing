import React, { ComponentType, useCallback, useRef, useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
  VirtualizedList,
  ModalProps,
  Modal,
  ScrollView,
  ScrollViewProps,
  Image,
  Pressable,
  ViewStyle,
  ImageStyle,
  StyleProp
} from "react-native";

import ImageItem from "./components/ImageItem/ImageItem";
import ImageDefaultHeader from "./components/ImageDefaultHeader";
import StatusBarManager from "./components/StatusBarManager";

import useAnimatedComponents from "./hooks/useAnimatedComponents";
import useImageIndexChange from "./hooks/useImageIndexChange";
import useRequestClose from "./hooks/useRequestClose";
import { ImageSource } from "./types";
import ImageFooter from "./components/ImageFooter";
import { styles } from "./styles";

type Props = {
  images: ImageSource[];
  keyExtractor?: (imageSrc: ImageSource, index: number) => string;
  imageIndex: number;
  visible: boolean;
  onRequestClose: () => void;
  onLongPress?: (image: ImageSource) => void;
  onImageIndexChange?: (imageIndex: number) => void;
  presentationStyle?: ModalProps["presentationStyle"];
  animationType?: ModalProps["animationType"];
  backgroundColor?: string;
  swipeToCloseEnabled?: boolean;
  doubleTapToZoomEnabled?: boolean;
  delayLongPress?: number;
  HeaderComponent?: ComponentType<{ imageIndex: number }>;
  FooterComponent?: ComponentType<{ imageIndex: number }>;
};

const DEFAULT_ANIMATION_TYPE = "fade";
const DEFAULT_BG_COLOR = "#000";
const DEFAULT_DELAY_LONG_PRESS = 800;
const SCREEN = Dimensions.get("screen");
const SCREEN_WIDTH = SCREEN.width;

const UNIQUE = '$$unique-key-'

let key = 1


const generateKey = () => {
  return UNIQUE + key++
}

function ImageViewing({
  images,
  keyExtractor,
  imageIndex,
  visible,
  onRequestClose,
  onLongPress = () => { },
  onImageIndexChange,
  animationType = DEFAULT_ANIMATION_TYPE,
  backgroundColor = DEFAULT_BG_COLOR,
  presentationStyle,
  swipeToCloseEnabled,
  doubleTapToZoomEnabled,
  delayLongPress = DEFAULT_DELAY_LONG_PRESS,
  HeaderComponent,
  FooterComponent,
}: Props) {
  const imageList = useRef<VirtualizedList<ImageSource>>(null);
  const [opacity, onRequestCloseEnhanced] = useRequestClose(onRequestClose);
  const [currentImageIndex, onScroll] = useImageIndexChange(imageIndex, SCREEN);
  const [headerTransform, footerTransform, toggleBarsVisible] =
    useAnimatedComponents();

  useEffect(() => {
    if (onImageIndexChange) {
      onImageIndexChange(currentImageIndex);
    }
  }, [currentImageIndex]);

  const onZoom = useCallback(
    (isScaled: boolean) => {
      // @ts-ignore
      imageList?.current?.setNativeProps({ scrollEnabled: !isScaled });
      toggleBarsVisible(!isScaled);
    },
    [imageList]
  );

  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent={presentationStyle === "overFullScreen"}
      visible={visible}
      presentationStyle={presentationStyle}
      animationType={animationType}
      onRequestClose={onRequestCloseEnhanced}
      supportedOrientations={["portrait"]}
      hardwareAccelerated
    >
      <StatusBarManager presentationStyle={presentationStyle} />
      <View style={[styles.container, { opacity, backgroundColor }]}>
        <Animated.View style={[styles.header, { transform: headerTransform }]}>
          {typeof HeaderComponent !== "undefined" ? (
            React.createElement(HeaderComponent, {
              imageIndex: currentImageIndex,
            })
          ) : (
            <ImageDefaultHeader onRequestClose={onRequestCloseEnhanced} />
          )}
        </Animated.View>
        <VirtualizedList
          ref={imageList}
          data={images}
          horizontal
          pagingEnabled
          windowSize={2}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          initialScrollIndex={imageIndex}
          getItem={(_, index) => images[index]}
          getItemCount={() => images.length}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          renderItem={({ item: imageSrc }) => (
            <ImageItem
              onZoom={onZoom}
              imageSrc={imageSrc}
              onRequestClose={onRequestCloseEnhanced}
              onLongPress={onLongPress}
              delayLongPress={delayLongPress}
              swipeToCloseEnabled={swipeToCloseEnabled}
              doubleTapToZoomEnabled={doubleTapToZoomEnabled}
            />
          )}
          onMomentumScrollEnd={onScroll}
          //@ts-ignore
          keyExtractor={(imageSrc, index) =>
            keyExtractor
              ? keyExtractor(imageSrc, index)
              : typeof imageSrc === "number"
                ? `${imageSrc}`
                : imageSrc.uri
          }
        />
        {typeof FooterComponent !== "undefined" && (
          <Animated.View
            style={[styles.footer, { transform: footerTransform }]}
          >
            {React.createElement(FooterComponent, {
              imageIndex: currentImageIndex,
            })}
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}



const ImagesModal = (props: Props) => (
  <ImageViewing key={props.imageIndex} {...props} />
);

interface IImages {
  scrollProps?: ScrollViewProps,
  style: StyleProp<ViewStyle>
  imageStyle: StyleProp<ImageStyle>
  data: string[],
  imagesModalProps?: Props,
  imageContainerStyle?: ViewStyle
}

const Images = (props: IImages) => {
  const { data, scrollProps = {}, imagesModalProps = {}, imageContainerStyle = {}, style, imageStyle } = props
  const [imagesModal, setImagesModal] = useState({
    visible: false,
    imageIndex: 0
  });

  if (!data || data.length === 0) {
    return null
  }
  return (
    <>
      <ImagesModal
        images={data.map((uri: string) => {
          return {
            uri
          }
        })}
        imageIndex={imagesModal.imageIndex}
        visible={imagesModal.visible}
        onRequestClose={() => setImagesModal({ ...imagesModal, visible: false })}
        FooterComponent={
          ({ imageIndex }) => (
            <ImageFooter imageIndex={imageIndex} imagesCount={data.length} />
          )
        }
        {...imagesModalProps}
      />
      <View style={StyleSheet.flatten([
        {
          height: 80
        },
        style
      ])}>
        <ScrollView style={styles.scroll} horizontal {...scrollProps} >
          <View style={[styles.image, imageContainerStyle]} >
            {
              data.map((v: any, i: number) => {
                return (
                  <Pressable key={generateKey()} onPress={() => setImagesModal({ imageIndex: i, visible: true })}>
                    <Image
                      source={{ uri: v }}
                      style={StyleSheet.flatten([{ height: 60, width: 60, marginLeft: 10 }, imageStyle])}
                      resizeMode={"cover"}
                    />
                  </Pressable>
                )
              })
            }
          </View>
        </ScrollView>
      </View>

    </>

  )
}

const ImageModal = (props: IImages) => {
  const { data,  imagesModalProps = {},  imageStyle } = props
  const [imagesModal, setImagesModal] = useState({
    visible: false,
    imageIndex: 0
  });

  if (!data || data.length === 0) {
    return null
  }
  return (
    <>
      <ImagesModal
        images={data.map((uri: string) => {
          return {
            uri
          }
        })}
        imageIndex={imagesModal.imageIndex}
        visible={imagesModal.visible}
        onRequestClose={() => setImagesModal({ ...imagesModal, visible: false })}
        FooterComponent={
          ({ imageIndex }) => (
            <ImageFooter imageIndex={imageIndex} imagesCount={data.length} />
          )
        }
        {...imagesModalProps}
      />

      {
        data.map((v: any, i: number) => {
          return (
            <Pressable key={generateKey()} onPress={() => setImagesModal({ imageIndex: i, visible: true })}>
              <Image
                source={{ uri: v }}
                style={StyleSheet.flatten([imageStyle])}
                resizeMode={"cover"}
              />
            </Pressable>
          )
        })
      }

    </>

  )
}

export {
  Images,
  ImageModal,
  ImagesModal
}
