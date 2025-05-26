import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import NavigationBar from "../../Components/NavBar/NavigationBar";
import { COLORS } from "../../constants/theme";
import ScreenWrapper from "../../Components/ScreenWrapper";
import { useAuth } from "../../context/AuthProvider";
import {
  firestore,
  collection,
  onSnapshot,
  query,
  where,
} from "../../firebase/firebaseConfig";
import { PieChart } from "react-native-chart-kit";

const MOCK_CHART_COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#28B463",
  "#F39C12",
  "#8E44AD",
  "#2980B9",
];

const hexToRgba = (hex, opacity) => {
  let r = 0,
    g = 0,
    b = 0;
  if (!hex) hex = "#000000";
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }
  return `rgba(${r},${g},${b},${opacity})`;
};

const screenWidth = Dimensions.get("window").width;

const isSameMonth = (date1, date2) =>
  date1 instanceof Date &&
  !isNaN(date1) &&
  date2 instanceof Date &&
  !isNaN(date2) &&
  date1.getFullYear() === date2.getFullYear() &&
  date1.getMonth() === date2.getMonth();

const SummaryScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categorizedTransactions, setCategorizedTransactions] = useState({});
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date());

  useEffect(() => {
    if (!user || !user.uid) {
      setLoading(false);
      setCategorizedTransactions({});
      return;
    }

    setLoading(true);
    const transactionsRef = collection(
      firestore,
      "users",
      user.uid,
      "transactions"
    );
    const expenseQuery = query(
      transactionsRef,
      where("type", "==", "Expenses")
    );

    const unsubscribe = onSnapshot(
      expenseQuery,
      (snapshot) => {
        const allExpenseTransactions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const transactionsForSelectedMonth = allExpenseTransactions.filter(
          (t) => {
            let tDate;
            if (t.date && typeof t.date.toDate === "function") {
              tDate = t.date.toDate();
            } else if (t.date) {
              tDate = new Date(t.date);
            }
            return (
              tDate instanceof Date &&
              !isNaN(tDate) &&
              isSameMonth(tDate, currentDisplayMonth)
            );
          }
        );

        const grouped = {};
        transactionsForSelectedMonth.forEach((transaction) => {
          const amount = parseFloat(transaction.amount);
          if (isNaN(amount) || amount <= 0) return;
          const category = transaction.category || "Other";
          if (!grouped[category]) {
            grouped[category] = { total: 0 };
          }
          grouped[category].total += amount;
        });

        setCategorizedTransactions(grouped);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching transactions:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, currentDisplayMonth]);

  const totalAmount = Object.values(categorizedTransactions).reduce(
    (sum, grp) => sum + (grp.total || 0),
    0
  );

  const chartData = Object.entries(categorizedTransactions)
    .map(([cat, data], i) => ({
      name: cat,
      population: parseFloat(data.total.toFixed(2)),
      color: MOCK_CHART_COLORS[i % MOCK_CHART_COLORS.length],
      legendFontColor: COLORS.text,
      legendFontSize: 14,
    }))
    .sort((a, b) => b.population - a.population);

  let displayIndex = selectedIndex;
  if (displayIndex === null && chartData.length > 0 && totalAmount > 0) {
    displayIndex = 0;
  }

  const centerPercentage =
    displayIndex !== null && totalAmount > 0 && chartData[displayIndex]
      ? ((chartData[displayIndex].population / totalAmount) * 100).toFixed(1) +
        "%"
      : "";
  const centerCategory =
    displayIndex !== null && chartData[displayIndex]
      ? chartData[displayIndex].name
      : "";
  const centerAmount =
    displayIndex !== null && totalAmount > 0 && chartData[displayIndex]
      ? `$${chartData[displayIndex].population.toFixed(2)}`
      : "";

  const goToPreviousMonth = () => {
    setCurrentDisplayMonth(
      (prevDate) => new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDisplayMonth(
      (prevDate) => new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1)
    );
  };

  if (loading) {
    return (
      <ScreenWrapper backgroundColor={COLORS.appBackground}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading summary...</Text>
        </View>
        <NavigationBar />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper backgroundColor={COLORS.appBackground}>
      <View style={styles.header}>
        <Text style={styles.title}>Summary</Text>
      </View>
      <View style={styles.monthSelectorContainer}>
        <TouchableOpacity
          onPress={goToPreviousMonth}
          style={styles.monthButton}
        >
          <Text style={styles.monthButtonText}>{"< Prev"}</Text>
        </TouchableOpacity>
        <Text style={styles.monthDisplayText}>
          {currentDisplayMonth.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
          <Text style={styles.monthButtonText}>{"Next >"}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* <Text style={styles.sectionTitle}>
          Category Chart (
          {currentDisplayMonth.toLocaleString("default", {
            month: "short",
            year: "numeric",
          })}
          )
        </Text> */}
        {chartData.length > 0 && totalAmount > 0 ? (
          <View style={styles.chartWrapper}>
            <PieChart
              data={chartData}
              width={screenWidth - 40}
              height={300}
              chartConfig={{
                backgroundColor: COLORS.appBackground,
                backgroundGradientFrom: COLORS.appBackground,
                backgroundGradientTo: COLORS.appBackground,
                color: (opacity = 1) => hexToRgba(COLORS.text, opacity),
                labelColor: (opacity = 1) => hexToRgba(COLORS.text, opacity),
              }}
              accessor="population"
              backgroundColor="transparent"
              hasLegend={false}
              absolute
              paddingLeft={(screenWidth - 40) * 0.25}
              style={styles.pieChartStyle}
            />
            <View style={styles.centerOverlay}>
              <View style={styles.doughnutHole} />
              <View style={styles.centerTextView}>
                {centerPercentage !== "" && (
                  <Text style={styles.centerPercentageText}>
                    {centerPercentage}
                  </Text>
                )}
                {centerAmount !== "" && (
                  <Text
                    style={[
                      styles.centerAmountText,
                      {
                        color: chartData[displayIndex]
                          ? chartData[displayIndex].color
                          : COLORS.primary,
                      },
                    ]}
                  >
                    {centerAmount}
                  </Text>
                )}
                {centerCategory !== "" && (
                  <Text style={styles.centerCategoryText}>
                    {centerCategory}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyChartContainer}>
            <Text style={styles.emptyChartText}>
              No expense data for this month.
            </Text>
          </View>
        )}

        {chartData.length > 0 && totalAmount > 0 && (
          <View style={styles.legendContainer}>
            {chartData.map((item, idx) => (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.legendItem,
                  selectedIndex === idx && styles.selectedLegendItem,
                ]}
                onPress={() =>
                  setSelectedIndex(idx === selectedIndex ? null : idx)
                }
              >
                <View
                  style={[
                    styles.legendColorBox,
                    { backgroundColor: item.color },
                  ]}
                />
                <Text style={styles.legendText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      <NavigationBar />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: COLORS.appBackground,
  },
  title: {
    fontSize: 24,
    color: COLORS.text,
    fontFamily: "Poppins-SemiBold",
  },
  monthSelectorContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: COLORS.appBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    marginVertical: 10,
  },
  monthButton: {
    padding: 8,
  },
  monthButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontFamily: "Poppins-Medium",
  },
  monthDisplayText: {
    fontSize: 18,
    color: COLORS.text,
    fontFamily: "Poppins-SemiBold",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.appBackground,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: "Poppins-Regular",
  },
  sectionTitle: {
    fontSize: 20,
    color: COLORS.text,
    fontFamily: "Poppins-SemiBold",
    marginTop: 20,
    marginBottom: 15,
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    height: 250,
    position: "relative",
    marginBottom: 10,
    marginTop: 10,
  },
  pieChartStyle: {
    borderRadius: 16,
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  doughnutHole: {
    width: 170,
    height: 170,
    borderRadius: 100,
    backgroundColor: COLORS.appBackground,
  },
  centerTextView: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  centerPercentageText: {
    marginTop: 10,
    fontSize: 40,
    fontFamily: "Poppins-Bold",
    color: COLORS.text,
  },
  centerAmountText: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.primary,
    marginTop: -10,
  },
  centerCategoryText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    marginTop: 0,
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center", // Changed from space-around for a more natural flow
    paddingHorizontal: 5,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    marginHorizontal: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    // minWidth: "45%", // Removed to allow button to size based on content
  },
  selectedLegendItem: {
    backgroundColor: hexToRgba(COLORS.primary, 0.1),
    borderColor: COLORS.primary,
  },
  legendColorBox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: "Poppins-Medium",
    // flexShrink: 1, // Removed
    // flex: 1, // Removed
  },
  legendAmount: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: "Poppins-SemiBold",
    marginLeft: "auto",
    paddingLeft: 5,
  },
  emptyChartContainer: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    marginVertical: 10,
  },
  emptyChartText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: "Poppins-Regular",
  },
});

export default SummaryScreen;
