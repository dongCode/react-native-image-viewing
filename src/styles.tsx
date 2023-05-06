import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    scroll: {
      height: 80
    },
    image: { flexDirection: 'row', paddingVertical: 10 },
    container: {
      flex: 1,
      backgroundColor: "#000",
    },
    header: {
      position: "absolute",
      width: "100%",
      zIndex: 1,
      top: 0,
    },
    footer: {
      position: "absolute",
      width: "100%",
      zIndex: 1,
      bottom: 0,
    },
  });


