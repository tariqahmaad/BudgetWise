import { StyleSheet, View } from 'react-native'
import React from 'react'

const HorizontalLine = () => {
  return (
    <View style={styles.horizontalLine}/>
  )
}

export default HorizontalLine

const styles = StyleSheet.create({
  horizontalLine:{
    flex: 1,
    flexDirection: "row",
    height: 1.5,
    backgroundColor: "#cccccc",
  }
})