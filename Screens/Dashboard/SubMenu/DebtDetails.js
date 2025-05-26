import React from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import BackButton from "../../../Components/Buttons/BackButton";
import FriendCard from "../../../Components/FriendCards/FriendCard";
import ScreenWrapper from "../../../Components/ScreenWrapper";
const plantImage = require("../../../assets/debt-details.png");
import { COLORS, FONTS, SHADOWS, SIZES } from "../../../constants/theme";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const DebtDetails = ({ navigation, route }) => {
  const { friend, debts, type } = route.params;

  const sortedDebts = debts
    ? debts
        .filter((d) => !d.paid)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    : [];
  const currentDebt = sortedDebts[0];
  const upcomingDebts = sortedDebts.slice(1);

  const renderBadge = (badgeType) => {
    if (badgeType === "overdue") {
      return (
        <View style={styles.overdueBadge}>
          <Text style={styles.overdueText}>overdue</Text>
        </View>
      );
    }
    if (badgeType === "received") {
      return (
        <View style={styles.receivedBadge}>
          <Text style={styles.receivedText}>Received</Text>
        </View>
      );
    }
    if (badgeType === "sent") {
      return (
        <View style={styles.sentBadge}>
          <Text style={styles.sentText}>Sent</Text>
        </View>
      );
    }
    return null;
  };

  const getAmountStyle = () => {
    if (type === "owe") {
      return styles.amountSent;
    } else {
      return styles.amountReceived;
    }
  };

  const getBadgeType = (paid) => {
    if (type === "owe") {
      return "sent";
    } else {
      return "received";
    }
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Debt Details</Text>
        </View>
        <Text style={styles.subtitle}>
          Here’s the breakdown of your transactions with{" "}
          <Text style={styles.highlight}>{friend.name}</Text>. The most urgent
          debt is highlighted, with past and upcoming payments listed below.
        </Text>

        <View style={styles.friendCardWrapper}>
          <FriendCard
            avatar={friend.avatar || require("../../../assets/Avatar01.png")}
            name={friend.name}
            email={friend.email}
          />
        </View>

        <Text style={styles.sectionHeader}>Current Debt</Text>
        {currentDebt ? (
          <View style={styles.debtCard}>
            <View style={styles.debtCardContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.debtLabel}>Due Date</Text>
                <Text style={styles.debtValue}>
                  {formatDate(currentDebt.dueDate)}
                </Text>
                <Text style={styles.debtLabel}>Amount</Text>
                <Text style={getAmountStyle()}>
                  ${Number(currentDebt.amount).toLocaleString()}
                </Text>
                <Text style={styles.issueDate}>
                  Date of issue: {formatDate(currentDebt.date)}
                </Text>
              </View>
              {/* Image is absolutely positioned in the card */}
              <Image source={plantImage} style={styles.plantImg} />
            </View>
            <View style={styles.badgeRow}>
              {new Date(currentDebt.dueDate) < new Date() &&
                renderBadge("overdue")}
              {renderBadge(getBadgeType(currentDebt.paid))}
            </View>
          </View>
        ) : (
          <Text style={styles.noDebtText}>No current debt.</Text>
        )}

        <Text style={styles.sectionHeader}>Upcoming Debt</Text>
        {upcomingDebts.length === 0 && (
          <Text style={styles.noDebtText}>No more upcoming debts.</Text>
        )}
        {upcomingDebts.map((debt) => (
          <View key={debt.id} style={styles.debtCard}>
            <View style={styles.debtCardContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.debtLabel}>Due Date</Text>
                <Text style={styles.debtValue}>{formatDate(debt.dueDate)}</Text>
                <Text style={styles.debtLabel}>Amount</Text>
                <Text style={getAmountStyle()}>
                  ${Number(debt.amount).toLocaleString()}
                </Text>
                <Text style={styles.issueDate}>
                  Date of issue: {formatDate(debt.date)}
                </Text>
              </View>
              <Image source={plantImage} style={styles.plantImg} />
            </View>
            <View style={styles.badgeRow}>
              {renderBadge(getBadgeType(debt.paid))}
            </View>
          </View>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.padding.xxlarge,
    paddingTop: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SIZES.padding.large,
    marginBottom: SIZES.padding.medium,
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: COLORS.text,
    fontFamily: "Poppins-SemiBold",
    fontSize: SIZES.font.xlarge,
    marginRight: 48,
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding.large,
    fontFamily: "Poppins-Regular",
    fontSize: SIZES.font.medium,
    lineHeight: 22,
    textAlign: "left",
  },
  highlight: {
    color: COLORS.primary,
    fontFamily: "Poppins-SemiBold",
    fontSize: SIZES.font.medium,
  },
  friendCardWrapper: {
    marginBottom: SIZES.padding.large,
    marginTop: SIZES.padding.medium,
  },
  sectionHeader: {
    color: COLORS.darkGray,
    marginTop: SIZES.padding.large,
    marginBottom: SIZES.padding.small,
    fontFamily: "Poppins-SemiBold",
    fontSize: SIZES.font.large,
  },
  debtCard: {
    backgroundColor: COLORS.header,
    borderRadius: SIZES.radius.large,
    padding: SIZES.padding.xlarge,
    marginBottom: SIZES.padding.medium,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    overflow: "hidden",
    minHeight: 160,
    justifyContent: "flex-end",
  },
  debtCardContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    minHeight: 120,
  },
  debtLabel: {
    color: COLORS.inactive,
    fontFamily: "Poppins-Regular",
    fontSize: SIZES.font.medium,
    marginTop: 4,
  },
  debtValue: {
    color: COLORS.text,
    fontFamily: "Poppins-SemiBold",
    fontSize: SIZES.font.large,
    marginBottom: 2,
  },
  amountReceived: {
    marginTop: 2,
    color: COLORS.BrightGreen,
    fontFamily: "Poppins-SemiBold",
    fontSize: SIZES.font.xxlarge,
  },
  amountSent: {
    marginTop: 2,
    color: COLORS.DeepRed,
    fontFamily: "Poppins-SemiBold",
    fontSize: SIZES.font.xlarge,
  },
  issueDate: {
    color: COLORS.inactive,
    marginTop: 2,
    fontFamily: "Poppins-Regular",
    fontSize: SIZES.font.medium,
  },
  plantImg: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left:180,
    width: 250,
    height: 150,
    resizeMode: "contain",
    opacity: 0.9,
    zIndex: 0,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SIZES.padding.small,
  },
  overdueBadge: {
    backgroundColor: COLORS.LightRed,
    borderRadius: SIZES.radius.medium,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginRight: 8,
  },
  overdueText: {
    color: COLORS.Red,
    fontFamily: "Poppins-SemiBold",
    fontSize: SIZES.font.small,
    textTransform: "lowercase",
    fontWeight: "bold",
  },
  receivedBadge: {
    backgroundColor: COLORS.Green,
    borderRadius: SIZES.radius.medium,
    paddingHorizontal: 18,
    paddingVertical: 5,
    marginLeft: 4,
  },
  receivedText: {
    color: COLORS.white,
    fontFamily: "Poppins-SemiBold",
    fontSize: SIZES.font.small,
    textTransform: "capitalize",
    fontWeight: "bold",
  },
  sentBadge: {
    backgroundColor: COLORS.Red,
    borderRadius: SIZES.radius.medium,
    paddingHorizontal: 18,
    paddingVertical: 5,
    marginLeft: 4,
  },
  sentText: {
    color: COLORS.white,
    fontFamily: "Poppins-SemiBold",
    fontSize: SIZES.font.small,
    textTransform: "capitalize",
    fontWeight: "bold",
  },
  noDebtText: {
    color: COLORS.inactive,
    marginLeft: 8,
    marginBottom: SIZES.padding.small,
    fontFamily: "Poppins-Regular",
    fontSize: SIZES.font.medium,
  },
});

export default DebtDetails;