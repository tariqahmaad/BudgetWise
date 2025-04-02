import React from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import MainCard from "../Components/CategoryCards/MainCard";
import SubCard from "../Components/CategoryCards/SubCard";
import FriendCard from "../Components/FriendCards/FriendCard";

const testingScreen = ({ navigation }) => {
  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexDireaction: "row", padding: 20 }}
      >
        <MainCard
          title="Available Balance"
          amount="$3,578"
          amountColor="white"
          description="See details"
          backgroundColor="#012249"
          Frame={require("../assets/card-animation1.png")}
        />
        <MainCard
          title="Total Income"
          amount="$3,578.00"
          amountColor="lightgreen"
          backgroundColor="#2F2F42"
          Frame={require("../assets/guy-animation.png")}
          extraField={[
            { label: "Total Expenses", value: "$3,578.00", color: "#FF7C7C" },
          ]}
        />
        <MainCard
          title="Total Saving"
          amount="$0.00"
          amountColor="white"
          description="See details"
          backgroundColor="#AF7700"
          Frame={require("../assets/money-animation.png")}
        />
        <TouchableOpacity onPress={() => navigation.navigate("onboarding")}>
          <MainCard
            title="Current Debts"
            amount="$17,769.88"
            description="See details"
            amountColor="white"
            backgroundColor="#37474F"
            Frame={require("../assets/debt-tracking-animation.png")}
          />
        </TouchableOpacity>
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexDireaction: "row", padding: 20 }}
      >
        <SubCard
          Category="Food"
          amount="$3,578.28"
          description="Available balance $750.20"
          backgroundColor="#2D8F78"
          iconName="pizza-outline"
          rotation="40deg"
        />
        <SubCard
          Category="Groceries"
          amount="$3,578.28"
          description="Available balance $750.20"
          backgroundColor="#E1B345"
          iconName="basket-outline"
        />

        <SubCard
          Category="Shopping"
          amount="$3,578.28"
          description="Available balance $750.20"
          backgroundColor="#0D60C4"
          iconName="bag-outline"
        />

        <SubCard
          Category="Travel and vacation"
          amount="$3,578.28"
          description="Available balance $750.20"
          backgroundColor="#0B2749"
          iconName="airplane-outline"
          rotation="-40deg"
        />

        <SubCard
          Category="Bank Fees"
          amount="$3,578.28"
          description="Available balance $750.20"
          backgroundColor="#1C4A3E"
          iconName="business-outline"
        />
      </ScrollView>
      <FriendCard 
       avatar={require("../assets/Avatar01.png")}
        name="Jane Cooper"
        email="manhhachtk08@gmail.com"
      />
    </>
  );
};
export default testingScreen;
