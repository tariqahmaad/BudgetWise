import React, { useState, useEffect, useMemo } from "react"; // Added useMemo
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  FlatList, // <-- Add FlatList
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
import { Ionicons } from "@expo/vector-icons"; // <-- Add Ionicons
import { CATEGORY_ICONS } from "../../constants/theme"; // Import CATEGORY_ICONS from theme.js

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

// Dynamically create CATEGORY_ICON_MAP
const CATEGORY_ICON_MAP = CATEGORY_ICONS.reduce((map, category) => {
  map[category.label] = category.name;
  return map;
}, {});

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
  const [selectedIndex, setSelectedIndex] = useState(null); // Default to null to show total expenses
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date());
  const [allMonthlyExpenses, setAllMonthlyExpenses] = useState([]);

  useEffect(() => {
    if (!user || !user.uid) {
      setLoading(false);
      setCategorizedTransactions({});
      setAllMonthlyExpenses([]); // <-- Reset on user change
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
              // Attempt to parse if it's a string or number, assuming it's a valid date representation
              const parsedDate = new Date(t.date);
              if (!isNaN(parsedDate)) {
                tDate = parsedDate;
              }
            }
            return (
              tDate instanceof Date &&
              !isNaN(tDate) &&
              isSameMonth(tDate, currentDisplayMonth)
            );
          }
        );
        setAllMonthlyExpenses(transactionsForSelectedMonth); // <-- Populate monthly expenses

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
        setAllMonthlyExpenses([]); // <-- Reset on error
      }
    );

    return () => unsubscribe();
  }, [user, currentDisplayMonth]);

  const totalAmount = useMemo(() => {
    return Object.values(categorizedTransactions).reduce(
      (sum, grp) => sum + (grp.total || 0),
      0
    );
  }, [categorizedTransactions]);

  const chartData = useMemo(() => {
    return Object.entries(categorizedTransactions)
      .map(([cat, data], i) => ({
        name: cat,
        population: parseFloat(data.total.toFixed(2)),
        color: MOCK_CHART_COLORS[i % MOCK_CHART_COLORS.length],
        legendFontColor: COLORS.text,
        legendFontSize: 14,
      }))
      .sort((a, b) => b.population - a.population);
  }, [categorizedTransactions]);

  const displayIndex = useMemo(() => {
    if (selectedIndex !== null) {
      return selectedIndex;
    }
    if (chartData.length > 0 && totalAmount > 0) {
      return null; // Default to showing total expenses
    }
    return null;
  }, [selectedIndex, chartData, totalAmount]);

  const centerPercentage = useMemo(() => {
    if (displayIndex !== null && totalAmount > 0 && chartData[displayIndex]) {
      return (
        ((chartData[displayIndex].population / totalAmount) * 100).toFixed(1) +
        "%"
      );
    }
    if (totalAmount > 0) {
      return "100%"; // Show 100% for total expenses
    }
    return "";
  }, [displayIndex, chartData, totalAmount]);

  const centerCategory = useMemo(() => {
    if (displayIndex !== null && chartData[displayIndex]) {
      return chartData[displayIndex].name;
    }
    return "Total Expenses"; // Default to "Total Expenses"
  }, [displayIndex, chartData]);

  const centerAmount = useMemo(() => {
    if (displayIndex !== null && totalAmount > 0 && chartData[displayIndex]) {
      return `$${chartData[displayIndex].population.toFixed(2)}`;
    }
    if (totalAmount > 0) {
      return `$${totalAmount.toFixed(2)}`; // Show total expenses amount
    }
    return "";
  }, [displayIndex, chartData, totalAmount]);

  const displayedTransactionsList = useMemo(() => {
    if (!allMonthlyExpenses) return [];

    let transactionsToDisplay = [...allMonthlyExpenses];

    if (selectedIndex !== null && chartData[selectedIndex]) {
      const selectedCategory = chartData[selectedIndex].name;
      transactionsToDisplay = transactionsToDisplay.filter(
        (t) => t.category === selectedCategory
      );
    }

    return transactionsToDisplay.sort((a, b) => {
      const dateA =
        a.date && typeof a.date.toDate === "function"
          ? a.date.toDate()
          : a.date
          ? new Date(a.date)
          : new Date(0);
      const dateB =
        b.date && typeof b.date.toDate === "function"
          ? b.date.toDate()
          : b.date
          ? new Date(b.date)
          : new Date(0);
      return dateB - dateA;
    });
  }, [allMonthlyExpenses, selectedIndex, chartData]);

  const getTransactionDateString = (dateField) => {
    if (!dateField) return "No Date";
    let dateObj;
    if (typeof dateField.toDate === "function") {
      dateObj = dateField.toDate();
    } else if (dateField instanceof Date) {
      dateObj = dateField;
    } else {
      dateObj = new Date(dateField);
    }
    return !isNaN(dateObj) ? dateObj.toLocaleString() : "Invalid Date"; // Changed to toLocaleString
  };

  const renderTransactionItem = ({ item }) => (
    <View style={styles.transactionCardItem}>
      <View style={styles.transactionLeft}>
        <View
          style={[
            styles.transactionIconContainer,
            {
              backgroundColor:
                MOCK_CHART_COLORS[
                  Math.floor(Math.random() * MOCK_CHART_COLORS.length)
                ] + "33",
            },
          ]}
        >
          <Ionicons
            name={CATEGORY_ICON_MAP[item.category] || "help-circle-outline"}
            size={30}
            color={COLORS.text}
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {item.description || "No Description"}
          </Text>
          <Text style={styles.transactionCategoryName}>
            {item.category || "Uncategorized"}
          </Text>
          <Text style={styles.transactionDateText}>
            {getTransactionDateString(item.date)}
          </Text>
        </View>
      </View>
      <View style={styles.transactionAmountContainer}>
        <Text style={styles.transactionAmountValue}>
          ${parseFloat(item.amount).toFixed(2)}
        </Text>
      </View>
    </View>
  );

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
              onDataPointClick={({ index }) => {
                setSelectedIndex(index === selectedIndex ? null : index);
              }}
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

        {allMonthlyExpenses.length > 0 && (
          <View style={styles.transactionsSection}>
            <Text style={styles.transactionsTitle}>
              {selectedIndex !== null && chartData[selectedIndex]
                ? `Transactions for ${chartData[selectedIndex].name}`
                : "Monthly Transactions"}
            </Text>
            <View style={styles.separator} />
            {displayedTransactionsList.length > 0 ? (
              <FlatList
                data={displayedTransactionsList}
                renderItem={renderTransactionItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false} // Important if FlatList is inside ScrollView
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />} // Adds space between card items
              />
            ) : (
              <Text style={styles.emptyTransactionsText}>
                {
                  selectedIndex !== null && chartData[selectedIndex]
                    ? `No transactions found for ${chartData[selectedIndex].name} this month.`
                    : "No transactions found for this month." // This case might not be hit if allMonthlyExpenses.length > 0
                }
              </Text>
            )}
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
    justifyContent: "center", // Note: justifyContent is duplicated, consider removing one
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
    // color: COLORS.primary, // Color is now dynamic
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
    justifyContent: "center",
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
  transactionsSection: {
    marginTop: 20,
    // Removed background color and padding from section, will be on cards
    // backgroundColor: COLORS.cardBackground,
    // borderRadius: 10,
    // padding: 15,
  },
  transactionsTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.text,
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 5, // Added padding if section bg is removed
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginBottom: 15, // Increased space after separator
    marginHorizontal: 5, // Added padding if section bg is removed
  },
  // Styles for transaction items, adapted from HomeScreen
  transactionCardItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white, // Using cardBackground from theme
    padding: 12,
    borderRadius: 12,
    // marginBottom: 10, // Replaced by ItemSeparatorComponent in FlatList
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // Allow text to take available space
    marginRight: 10, // Space between left block and amount
  },
  transactionIconContainer: {
    width: 50, // Adjusted size
    height: 50, // Adjusted size
    borderRadius: 25, // Half of width/height
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1, // Allow text to shrink/grow
    justifyContent: "center",
  },
  transactionDescription: {
    // Was transactionName in HomeScreen
    fontSize: 15, // Adjusted from 16
    fontFamily: "Poppins-Medium",
    color: COLORS.text,
    marginBottom: 2,
  },
  transactionCategoryName: {
    // Was transactionCategory in HomeScreen
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  transactionDateText: {
    // New style for date, similar to HomeScreen's inline style
    fontSize: 11, // Adjusted from 12
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
  },
  transactionAmountContainer: {
    alignItems: "flex-end",
  },
  transactionAmountValue: {
    fontSize: 15,
    fontFamily: "Poppins-SemiBold",
    color: "#FF3B30", // Red color for transaction amounts
  },
  emptyTransactionsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
    paddingVertical: 20,
  },
});

export default SummaryScreen;
