import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  Easing,
} from "react-native";
import NavigationBar from "../../Components/NavBar/NavigationBar";
import ScreenWrapper from "../../Components/ScreenWrapper";
import { useAuth } from "../../context/AuthProvider";
import { PieChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, CATEGORY_ICONS } from "../../constants/theme";
import { CHART_COLORS, hexToRgba } from "../../constants/chart";
import { isSameMonth } from "../../hooks/useSameMonth";
import { subscribeToMonthlyExpenses } from "../../services/transactionService";
import { useCurrency } from "../../contexts/CurrencyContext";

const CATEGORY_ICON_MAP = CATEGORY_ICONS.reduce((map, category) => {
  map[category.label] = category.name;
  return map;
}, {});

const screenWidth = Dimensions.get("window").width;

const SummaryScreen = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();

  // Animated value for the center percentage
  const percentAnim = useRef(new Animated.Value(0)).current;
  const [displayPercentage, setDisplayPercentage] = useState(0);

  const [loading, setLoading] = useState(true);
  const [categorizedTransactions, setCategorizedTransactions] = useState({});
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date());
  const [allMonthlyExpenses, setAllMonthlyExpenses] = useState([]);

  const [chartScale] = useState(new Animated.Value(0));

  // Reset selectedIndex if out of bounds when chartData changes
  const chartData = useMemo(
    () =>
      Object.entries(categorizedTransactions)
        .map(([cat, data], i) => ({
          name: cat,
          population: parseFloat(data.total.toFixed(2)),
          color: CHART_COLORS[i % CHART_COLORS.length],
          legendFontColor: COLORS.text,
          legendFontSize: 14,
        }))
        .sort((a, b) => b.population - a.population),
    [categorizedTransactions]
  );

  useEffect(() => {
    if (selectedIndex !== null && selectedIndex >= chartData.length) {
      setSelectedIndex(null);
    }
  }, [chartData]);

  useEffect(() => {
    // Chart scale animation
    Animated.timing(chartScale, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();

    // Listen to percentAnim changes
    const id = percentAnim.addListener(({ value }) => {
      setDisplayPercentage(Math.round(value));
    });

    // Initial count-up from 0 to 100
    Animated.timing(percentAnim, {
      toValue: 100,
      duration: 1000,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();

    return () => percentAnim.removeListener(id);
  }, []);

  const totalAmount = useMemo(
    () =>
      Object.values(categorizedTransactions).reduce(
        (sum, grp) => sum + (grp.total || 0),
        0
      ),
    [categorizedTransactions]
  );

  // Compute center percentage as a string
  const centerPercentage = useMemo(() => {
    if (selectedIndex !== null && chartData[selectedIndex]) {
      return (
        ((chartData[selectedIndex].population / totalAmount) * 100).toFixed(1) +
        "%"
      );
    }
    return totalAmount > 0 ? "100%" : "";
  }, [selectedIndex, chartData, totalAmount]);

  // Animate percentage whenever it changes
  useEffect(() => {
    const target = parseFloat(centerPercentage) || 0;
    Animated.timing(percentAnim, {
      toValue: target,
      duration: 300,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [centerPercentage]);

  useEffect(() => {
    if (!user || !user.uid) {
      setLoading(false);
      setCategorizedTransactions({});
      setAllMonthlyExpenses([]);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToMonthlyExpenses(
      user.uid,
      currentDisplayMonth,
      (allExpenses) => {
        const txns = allExpenses.filter((t) => {
          let d;
          if (t.date?.toDate) d = t.date.toDate();
          else if (t.date) {
            const pd = new Date(t.date);
            if (!isNaN(pd)) d = pd;
          }
          return d && isSameMonth(d, currentDisplayMonth);
        });
        setAllMonthlyExpenses(txns);

        const grouped = {};
        txns.forEach((tran) => {
          const amt = parseFloat(tran.amount);
          if (isNaN(amt) || amt <= 0) return;
          const cat = tran.category || "Other";
          if (!grouped[cat]) grouped[cat] = { total: 0 };
          grouped[cat].total += amt;
        });
        setCategorizedTransactions(grouped);
        setLoading(false);
      },
      () => {
        setLoading(false);
        setAllMonthlyExpenses([]);
      }
    );
    return () => unsubscribe();
  }, [user, currentDisplayMonth]);

  const displayedTransactions = useMemo(() => {
    let list = [...allMonthlyExpenses];
    if (selectedIndex !== null && chartData[selectedIndex]) {
      const name = chartData[selectedIndex].name;
      list = list.filter((t) => t.category === name);
    }
    return list.sort(
      (a, b) =>
        new Date(b.date?.toDate?.() || b.date) -
        new Date(a.date?.toDate?.() || a.date)
    );
  }, [allMonthlyExpenses, selectedIndex, chartData]);

  const getDateStr = (df) => {
    if (!df) return "No Date";
    const d = df.toDate ? df.toDate() : new Date(df);
    return isNaN(d) ? "Invalid Date" : d.toLocaleString();
  };

  const renderItem = ({ item }) => {
    const cd = chartData.find((c) => c.name === item.category);
    const displayDescription =
      item.description || item.category || "Uncategorized";

    return (
      <View style={styles.transactionCardItem}>
        <View style={styles.transactionLeft}>
          <View
            style={[
              styles.transactionIconContainer,
              {
                backgroundColor: cd
                  ? hexToRgba(cd.color, 0.2)
                  : COLORS.lightGray,
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
              {displayDescription}
            </Text>
            {item.description && (
              <Text style={styles.transactionCategoryName}>
                {item.category || "Uncategorized"}
              </Text>
            )}
            <Text style={styles.transactionDateText}>
              {getDateStr(item.date)}
            </Text>
          </View>
        </View>
        <View style={styles.transactionAmountContainer}>
          <Text style={styles.transactionAmountValue}>
            {formatAmount(parseFloat(item.amount))}
          </Text>
        </View>
      </View>
    );
  };

  const prevMonth = () =>
    setCurrentDisplayMonth(
      (p) => new Date(p.getFullYear(), p.getMonth() - 1, 1)
    );
  const nextMonth = () =>
    setCurrentDisplayMonth(
      (p) => new Date(p.getFullYear(), p.getMonth() + 1, 1)
    );

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
        <TouchableOpacity onPress={prevMonth} style={styles.monthButton}>
          <Text style={styles.monthButtonText}>{"< Prev"}</Text>
        </TouchableOpacity>
        <Text style={styles.monthDisplayText}>
          {currentDisplayMonth.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={styles.monthButton}>
          <Text style={styles.monthButtonText}>{"Next >"}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {chartData.length > 0 && totalAmount > 0 ? (
          <Animated.View
            style={[
              styles.chartWrapper,
              { transform: [{ scale: chartScale }] },
            ]}
          >
            <PieChart
              data={chartData}
              width={screenWidth - 40}
              height={300}
              chartConfig={{
                backgroundColor: COLORS.appBackground,
                backgroundGradientFrom: COLORS.appBackground,
                backgroundGradientTo: COLORS.appBackground,
                color: (o = 1) => hexToRgba(COLORS.text, o),
                labelColor: (o = 1) => hexToRgba(COLORS.text, o),
              }}
              accessor="population"
              backgroundColor="transparent"
              hasLegend={false}
              absolute
              paddingLeft={(screenWidth - 40) * 0.25}
              style={styles.pieChartStyle}
              onDataPointClick={({ index }) =>
                setSelectedIndex(index === selectedIndex ? null : index)
              }
            />
            <View style={styles.centerOverlay}>
              <View style={styles.doughnutHole} />
              <View style={styles.centerTextView}>
                <Text style={styles.centerPercentageText}>
                  {displayPercentage}%
                </Text>
                {totalAmount > 0 && (
                  <Text
                    style={[
                      styles.centerAmountText,
                      {
                        color:
                          chartData[selectedIndex]?.color || COLORS.primary,
                      },
                    ]}
                  >
                    {selectedIndex != null && chartData[selectedIndex]
                      ? formatAmount(chartData[selectedIndex].population)
                      : formatAmount(totalAmount)}
                  </Text>
                )}
                <Text style={styles.centerCategoryText}>
                  {selectedIndex != null && chartData[selectedIndex]?.name
                    ? chartData[selectedIndex].name
                    : "Total Expenses"}
                </Text>
              </View>
            </View>
          </Animated.View>
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
              {selectedIndex != null && chartData[selectedIndex]
                ? `Transactions for ${chartData[selectedIndex].name}`
                : "Monthly Transactions"}
            </Text>
            <View style={styles.separator} />
            {displayedTransactions.length > 0 ? (
              <FlatList
                data={displayedTransactions}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              />
            ) : (
              <Text style={styles.emptyTransactionsText}>
                {selectedIndex != null && chartData[selectedIndex]
                  ? `No transactions found for ${chartData[selectedIndex].name} this month.`
                  : "No transactions found for this month."}
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
    paddingVertical: 12,
    paddingHorizontal: 5,
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
