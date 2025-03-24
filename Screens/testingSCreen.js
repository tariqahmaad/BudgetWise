import React from 'react';
import { View, ScrollView } from 'react-native';
import MainCard from "../Components/CategoryCards/MainCard";

const testingScreen = () => {
  return(
    <ScrollView
    horizontal 
    showsHorizontalScrollIndicator={false}
    style ={{flexDireaction: 'row', padding:20}}
    >
    <MainCard
     title='Available Balance'
     amount='$3,578'
     amountColor='white'
     description='See details'
     backgroundColor= "#012249"
     Frame={require('../assets/card-animation1.png')}
    />
     <MainCard
     title='Total Income'
     amount='$3,578.00'
     amountColor="lightgreen"
     backgroundColor= "#2F2F42"
     Frame={require('../assets/guy-animation.png')}
     extraField={[
      {label: 'Total Expenses', value: '$3,578.00',color:"#FF7C7C"},
     ]}
    />
     <MainCard
     title='Total Saving'
     amount='$0.00'
     amountColor='white'
     description='See details'
     backgroundColor= "#AF7700"
     Frame={require('../assets/money-animation.png')}
    />
    </ScrollView>
  )
}
export default testingScreen;